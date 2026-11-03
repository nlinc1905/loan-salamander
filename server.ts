import express from "express";
import path from "path";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { ExpressAuth, getSession } from "@auth/express";
import prisma from "./src/lib/prisma";
import { authConfig } from "./src/lib/authOptions";
import { randomBytes } from "crypto";
import { calculateScenarioRows as calculateScenarioRowsShared, calculateStandardRows as calculateStandardRowsShared } from "./src/utils/calculations";

// Load local environmental variables if any
dotenv.config();

const isProd = process.env.NODE_ENV === "production";
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const authSecret = process.env.AUTH_SECRET;
if (!authSecret) {
  throw new Error("AUTH_SECRET environment variable is required.");
}
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_BUCKET_MAX_AGE_MS = RATE_LIMIT_WINDOW_MS * 2;
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 2 * 60 * 1000;
const HTTP_REQUEST_TIMEOUT_MS = 30 * 1000;

type RateLimitBucket = {
  windowStart: number;
  count: number;
};

type CaptchaEntry = {
  answer: string;
  expiresAt: number;
};

const contactCaptchaStore = new Map<string, CaptchaEntry>();
const CAPTCHA_TTL_MS = 10 * 60 * 1000;
const rateLimitBuckets = new Map<string, RateLimitBucket>();

function isLoopbackAddress(address: string): boolean {
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function consumeRateLimit(bucketKey: string, maxRequests: number, windowMs = RATE_LIMIT_WINDOW_MS): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(bucketKey);

  if (!bucket || now - bucket.windowStart >= windowMs) {
    rateLimitBuckets.set(bucketKey, {
      windowStart: now,
      count: 1,
    });
    return true;
  }

  if (bucket.count >= maxRequests) {
    return false;
  }

  bucket.count += 1;
  return true;
}

function cleanupRateLimitBuckets(now = Date.now()): void {
  for (const [bucketKey, bucket] of rateLimitBuckets.entries()) {
    if (now - bucket.windowStart > RATE_LIMIT_BUCKET_MAX_AGE_MS) {
      rateLimitBuckets.delete(bucketKey);
    }
  }
}

function getRateLimitClientId(req: express.Request): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedForValue = typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : "";
  const ip = forwardedForValue || req.ip || req.socket.remoteAddress || "unknown";
  return ip;
}

function isTrustedInternalAuthRequest(req: express.Request): boolean {
  const marker = req.headers["x-lp-internal-auth-flow"];
  if (marker !== "1") {
    return false;
  }

  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return false;
  }

  const socketAddress = req.socket.remoteAddress || "";
  const requestIp = req.ip || "";
  return isLoopbackAddress(socketAddress) || isLoopbackAddress(requestIp);
}

function isAuthPath(pathname: string): boolean {
  return pathname.startsWith("/api/auth/");
}

function createContactCaptcha() {
  const left = Math.floor(Math.random() * 9) + 1;
  const right = Math.floor(Math.random() * 9) + 1;
  const captchaId = randomBytes(16).toString("hex");
  const answer = String(left + right);

  contactCaptchaStore.set(captchaId, {
    answer,
    expiresAt: Date.now() + CAPTCHA_TTL_MS,
  });

  return {
    captchaId,
    prompt: `What is ${left} + ${right}?`,
  };
}

function consumeCaptchaAnswer(captchaId: string, providedAnswer: string): boolean {
  const captcha = contactCaptchaStore.get(captchaId);
  contactCaptchaStore.delete(captchaId);

  if (!captcha) return false;
  if (captcha.expiresAt < Date.now()) return false;

  return captcha.answer === providedAnswer.trim();
}

async function startServer() {
  const app = express();
  app.set("trust proxy", true);

  const cleanupInterval = setInterval(() => {
    cleanupRateLimitBuckets();
  }, RATE_LIMIT_CLEANUP_INTERVAL_MS);
  cleanupInterval.unref();

  const requestTimeoutMiddleware: express.RequestHandler = (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: "Request timed out",
          code: "REQUEST_TIMEOUT",
        });
      }
    }, HTTP_REQUEST_TIMEOUT_MS);

    res.on("finish", () => clearTimeout(timeout));
    res.on("close", () => clearTimeout(timeout));
    next();
  };

  app.use(requestTimeoutMiddleware);

  const endpointRateLimitMiddleware: express.RequestHandler = (req, res, next) => {
    const pathname = req.path;

    if (!pathname.startsWith("/api/") && pathname !== "/health") {
      return next();
    }

    if (isTrustedInternalAuthRequest(req) && isAuthPath(pathname)) {
      return next();
    }

    let maxRequestsPerMinute = 200;
    let policyName = "default";

    if (isAuthPath(pathname)) {
      maxRequestsPerMinute = 2;
      policyName = "auth";
    }

    const clientId = getRateLimitClientId(req);
    const bucketKey = `${policyName}:${pathname}:${clientId}`;
    const allowed = consumeRateLimit(bucketKey, maxRequestsPerMinute);

    if (!allowed) {
      return res.status(429).json({
        error: "Too many requests",
        code: "RATE_LIMITED",
        limitPerMinute: maxRequestsPerMinute,
      });
    }

    return next();
  };

  app.use(endpointRateLimitMiddleware);

  const REQUEST_SIZE_LIMIT = '1mb';
  app.use(express.json({ limit: REQUEST_SIZE_LIMIT }));
  app.use(express.urlencoded({ limit: REQUEST_SIZE_LIMIT }));

  app.get("/api/contact/captcha", (req, res) => {
    const captcha = createContactCaptcha();
    res.json({ success: true, ...captcha });
  });

  app.post("/api/contact", async (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const captchaId = typeof req.body?.captchaId === "string" ? req.body.captchaId.trim() : "";
    const captchaAnswer = typeof req.body?.captchaAnswer === "string" ? req.body.captchaAnswer.trim() : "";
    const website = typeof req.body?.website === "string" ? req.body.website.trim() : "";

    if (website) {
      return res.status(400).json({ error: "Bot submission detected" });
    }

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required" });
    }

    if (name.length > 120 || email.length > 320 || message.length > 5000) {
      return res.status(400).json({ error: "Form values exceed allowed limits" });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }

    if (!captchaId || !captchaAnswer || !consumeCaptchaAnswer(captchaId, captchaAnswer)) {
      return res.status(400).json({ error: "Invalid captcha. Please try again." });
    }

    res.json({ success: true, message: "Contact form submitted successfully" });
  });

  interface AuthenticatedRequest extends express.Request {
    authUser?: {
      id: number;
      email: string;
      name: string | null;
    };
  }

  const requireAuth: express.RequestHandler = async (req, res, next) => {
    try {
      const session = await getSession(req, authConfig);
      const email = session?.user?.email;

      if (!email) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true, email: true, name: true },
      });

      if (!user) {
        return res.status(401).json({ error: "Authenticated user no longer exists" });
      }

      (req as AuthenticatedRequest).authUser = user;
      next();
    } catch (err: any) {
      console.error("Auth middleware failure:", err);
      res.status(500).json({ error: "Failed to validate session", details: err?.message });
    }
  };

  // API Endpoint: Record that a user clicked a premium export action.
  app.post("/api/usage/export-activity", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const authUser = authReq.authUser;
    if (!authUser) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const source = typeof req.body?.source === "string" ? req.body.source.trim() : "";
    if (source !== "paymentScenarios" && source !== "refinance") {
      return res.status(400).json({ error: "Unsupported export source" });
    }

    const now = new Date();

    try {
      const existingRecord = await prisma.userExportActivity.findUnique({
        where: { userId: authUser.id },
        select: { firstDownloadedAt: true },
      });

      const updateData: {
        hasDownloadedPremiumData: true;
        hasDownloadedPaymentScenarios?: true;
        hasDownloadedRefinanceScenarios?: true;
        lastDownloadedAt: Date;
        firstDownloadedAt?: Date;
      } = {
        hasDownloadedPremiumData: true,
        lastDownloadedAt: now,
      };

      if (source === "paymentScenarios") {
        updateData.hasDownloadedPaymentScenarios = true;
      }
      if (source === "refinance") {
        updateData.hasDownloadedRefinanceScenarios = true;
      }
      if (!existingRecord?.firstDownloadedAt) {
        updateData.firstDownloadedAt = now;
      }

      const saved = existingRecord
        ? await prisma.userExportActivity.update({
            where: { userId: authUser.id },
            data: updateData,
          })
        : await prisma.userExportActivity.create({
            data: {
              userId: authUser.id,
              hasDownloadedPremiumData: true,
              hasDownloadedPaymentScenarios: source === "paymentScenarios",
              hasDownloadedRefinanceScenarios: source === "refinance",
              firstDownloadedAt: now,
              lastDownloadedAt: now,
            },
          });

      return res.json({
        success: true,
        exportActivity: {
          hasDownloadedPremiumData: saved.hasDownloadedPremiumData,
          hasDownloadedPaymentScenarios: saved.hasDownloadedPaymentScenarios,
          hasDownloadedRefinanceScenarios: saved.hasDownloadedRefinanceScenarios,
          firstDownloadedAt: saved.firstDownloadedAt,
          lastDownloadedAt: saved.lastDownloadedAt,
        },
      });
    } catch (err: any) {
      console.error("Failed to track export activity:", err);
      return res.status(500).json({ error: "Failed to track export activity", details: err?.message });
    }
  });

  // API Endpoint: Delete the authenticated user's account and associated data.
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body || {};
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const rawPassword = typeof password === "string" ? password : "";

    if (!normalizedEmail || !rawPassword) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    try {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`, {
        headers: {
          cookie: req.headers.cookie || "",
          "x-lp-internal-auth-flow": "1",
        },
      });
      const csrfPayload = await csrfResponse.json();
      const csrfToken = csrfPayload?.csrfToken;

      if (!csrfToken) {
        return res.status(500).json({ error: "Could not establish auth CSRF token" });
      }

      const csrfCookie = csrfResponse.headers.get("set-cookie");
      const combinedCookie = [req.headers.cookie || "", csrfCookie || ""].filter(Boolean).join("; ");

      const signinResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          cookie: combinedCookie,
          "X-Auth-Return-Redirect": "1",
          "x-lp-internal-auth-flow": "1",
        },
        body: new URLSearchParams({
          email: normalizedEmail,
          password: rawPassword,
          csrfToken,
          callbackUrl: "/",
          json: "true",
        }).toString(),
        redirect: "manual",
      });

      const setCookies = signinResponse.headers.getSetCookie?.() || [];
      if (setCookies.length > 0) {
        res.setHeader("set-cookie", setCookies);
      } else {
        const singleCookie = signinResponse.headers.get("set-cookie");
        if (singleCookie) res.setHeader("set-cookie", singleCookie);
      }

      const signinBodyText = await signinResponse.text();
      if (!signinResponse.ok || /error=CredentialsSignin/i.test(signinBodyText)) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("Login failure:", err);
      res.status(500).json({ error: "Failed to sign in", details: err?.message });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`, {
        headers: {
          cookie: req.headers.cookie || "",
          "x-lp-internal-auth-flow": "1",
        },
      });
      const csrfPayload = await csrfResponse.json();
      const csrfToken = csrfPayload?.csrfToken;

      if (!csrfToken) {
        return res.status(500).json({ error: "Could not establish logout CSRF token" });
      }

      const csrfCookie = csrfResponse.headers.get("set-cookie");
      const combinedCookie = [req.headers.cookie || "", csrfCookie || ""].filter(Boolean).join("; ");

      const signoutResponse = await fetch(`${baseUrl}/api/auth/signout`, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          cookie: combinedCookie,
          "X-Auth-Return-Redirect": "1",
          "x-lp-internal-auth-flow": "1",
        },
        body: new URLSearchParams({
          csrfToken,
          callbackUrl: "/",
          json: "true",
        }).toString(),
        redirect: "manual",
      });

      const setCookies = signoutResponse.headers.getSetCookie?.() || [];
      if (setCookies.length > 0) {
        res.setHeader("set-cookie", setCookies);
      } else {
        const singleCookie = signoutResponse.headers.get("set-cookie");
        if (singleCookie) res.setHeader("set-cookie", singleCookie);
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("Logout failure:", err);
      res.status(500).json({ error: "Failed to sign out", details: err?.message });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    const { email, password, confirmPassword, name } = req.body || {};

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedPassword = typeof password === "string" ? password : "";
    const normalizedConfirmPassword = typeof confirmPassword === "string" ? confirmPassword : "";
    const displayName = typeof name === "string" ? name.trim() : "";

    if (!normalizedEmail) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!normalizedPassword || !normalizedConfirmPassword) {
      return res.status(400).json({ error: "Password and confirmation are required" });
    }

    if (normalizedPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    try {
      const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingUser) {
        return res.status(409).json({ error: "Email already in use" });
      }

      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: normalizedPassword,
          name: displayName || null,
          premium_access_until: new Date("3000-01-01T00:00:00.000Z"),
        },
        select: { id: true, email: true, name: true, createdAt: true },
      });

      res.status(201).json({
        success: true,
        user,
        message: "Account created. You can now sign in.",
      });
    } catch (err: any) {
      console.error("Registration error:", err);
      res.status(500).json({ error: "Failed to register user", details: err?.message });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const confirmPassword = typeof req.body?.confirmPassword === "string" ? req.body.confirmPassword : "";

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ error: "Email, password, and confirmation are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true },
      });

      if (!user) {
        return res.status(404).json({ error: "No account found for that email" });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { password },
      });

      res.json({ success: true, message: "Password reset successfully. Please sign in with your new password." });
    } catch (err: any) {
      console.error("Password reset failure:", err);
      res.status(500).json({ error: "Failed to reset password", details: err?.message });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const currentUser = authReq.authUser;

    if (!currentUser) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const rows = await prisma.$queryRaw<Array<{
        id: number;
        email: string;
        name: string | null;
        premium_access_until: Date | null;
      }>>`
        SELECT id, email, name, premium_access_until
        FROM "User"
        WHERE id = ${currentUser.id}
        LIMIT 1
      `;

      const user = rows[0];
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const premiumUntil = user.premium_access_until;
      res.json({
        authenticated: true,
        user: {
          id: String(user.id),
          email: user.email,
          name: user.name,
          isPremium: true,
          premiumUntil: premiumUntil || new Date("3000-01-01T00:00:00.000Z"),
        },
      });
    } catch (err: any) {
      console.error("Failed to fetch current user:", err);
      res.status(500).json({ error: "Failed to fetch user", details: err?.message });
    }
  });

  app.use("/api/auth/*", ExpressAuth(authConfig));

  // API Route: Close Account
  app.post("/api/account/close", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const authUser = authReq.authUser;

    if (!authUser) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      await prisma.user.deleteMany({ where: { id: authUser.id } });

      res.json({
        success: true,
        message: "Account deleted successfully.",
      });
    } catch (err: any) {
      console.error("Failed to close account:", err);
      res.status(500).json({ error: "Failed to close account", details: err?.message });
    }
  });

  // API Route: Healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  type NormalizedExtraPayment = {
    type: "single" | "recurring";
    amount: number;
    period: number;
    startPeriod: number;
    endPeriod: number;
  };

  function normalizeExtraPayment(raw: any, maxPeriod: number): NormalizedExtraPayment {
    const normalizedType = raw?.type === "recurring" ? "recurring" : "single";
    const normalizedAmount = Math.max(1, Number(raw?.amount) || 0);
    const normalizedPeriod = Math.max(1, Math.min(maxPeriod, Number(raw?.period) || 1));
    const normalizedStartPeriod = Math.max(1, Math.min(maxPeriod, Number(raw?.startPeriod) || 1));
    const endRaw = Number(raw?.endPeriod);
    const normalizedEndPeriod = Math.max(
      normalizedStartPeriod,
      Math.min(maxPeriod, Number.isFinite(endRaw) && endRaw >= 1 ? endRaw : maxPeriod),
    );

    return {
      type: normalizedType,
      amount: normalizedAmount,
      period: normalizedPeriod,
      startPeriod: normalizedStartPeriod,
      endPeriod: normalizedEndPeriod,
    };
  }

  function normalizeExtraPayments(rawPayments: any[], maxPeriod: number): NormalizedExtraPayment[] {
    if (!Array.isArray(rawPayments)) {
      return [];
    }

    return rawPayments.map((raw) => normalizeExtraPayment(raw, maxPeriod));
  }

  // Helper calculation functions
  function calculateStandardRows(details: any) {
    return calculateStandardRowsShared(details);
  }

  function calculateScenarioRows(details: any, extraPayments: any[]) {
    return calculateScenarioRowsShared(details, extraPayments);
  }

  // API Endpoint: Get list of saved loans
  app.get("/api/loans", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const authUser = authReq.authUser;
    if (!authUser) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const loans = await prisma.loan.findMany({
        where: {
          OR: [
            { userId: authUser.id },
            { id: "loan_standard_demo" },
          ],
        },
        orderBy: { createdAt: "asc" }
      });
      res.json({ success: true, loans });
    } catch (err: any) {
      console.error("Failed to fetch loans:", err);
      res.status(500).json({ error: "Failed to load saved loans", details: err?.message });
    }
  });

  // API Endpoint: Save a loan
  app.post("/api/loans", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const authUser = authReq.authUser;
    if (!authUser) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { 
      name, 
      assetCost, 
      downPayment, 
      interestRate, 
      years, 
      months, 
      loanType, 
      rateType,
      varFixedYears,
      varPeriodicity,
      varMaxIncrease,
      varVolatility,
      varTrendScenario,
      varRateMode,
      varManualRates
    } = req.body;

    const normalizedName = typeof name === "string" ? name.trim() : "";

    if (!normalizedName) {
      return res.status(400).json({ error: "Missing loan identification name" });
    }

    try {
      const loanPayload = {
        userId: authUser.id,
        name: normalizedName,
        assetCost: Number(assetCost) || 350000,
        downPayment: Number(downPayment) || 0,
        interestRate: Number(interestRate) || 6.5,
        years: Number(years) || 30,
        months: Number(months) || 0,
        loanType: loanType || "mortgage",
        rateType: rateType || "fixed",
        varFixedYears: Number(varFixedYears) || 5,
        varPeriodicity: Number(varPeriodicity) || 12,
        varMaxIncrease: Number(varMaxIncrease) || 4.0,
        varVolatility: Number(varVolatility) || 0.5,
        varTrendScenario: varTrendScenario || "average",
        varRateMode: varRateMode || "trend",
        varManualRates: Array.isArray(varManualRates) ? varManualRates : undefined,
      };

      const existingLoan = await prisma.loan.findFirst({
        where: {
          userId: authUser.id,
          name: normalizedName,
        },
        select: { id: true },
      });

      if (existingLoan) {
        const updatedLoan = await prisma.loan.update({
          where: { id: existingLoan.id },
          data: loanPayload,
        });
        return res.json({ success: true, loan: updatedLoan, replaced: true });
      }

      const newLoan = await prisma.loan.create({
        data: loanPayload,
      });

      res.json({ success: true, loan: newLoan, replaced: false });
    } catch (err: any) {
      console.error("Failed to save loan:", err);
      res.status(500).json({ error: "Failed to save loan info", details: err?.message });
    }
  });

  // API Endpoint: Delete a saved loan
  app.delete("/api/loans/:id", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const authUser = authReq.authUser;
    if (!authUser) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    try {
      const deleteResult = await prisma.loan.deleteMany({ where: { id, userId: authUser.id } });
      if (deleteResult.count === 0) {
        return res.status(404).json({ error: "Loan not found" });
      }
      res.json({ success: true, message: "Loan deleted successfully" });
    } catch (err: any) {
      console.error("Failed to delete loan:", err);
      res.status(500).json({ error: "Failed to delete loan", details: err?.message });
    }
  });

  // API Endpoint: List saved payment schedules (optionally for a specific loan)
  app.get("/api/payment-schedules", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const authUser = authReq.authUser;
    if (!authUser) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const loanId = typeof req.query?.loanId === "string" ? req.query.loanId.trim() : "";

    try {
      if (loanId) {
        const loan = await prisma.loan.findFirst({
          where: { id: loanId, userId: authUser.id },
          select: { id: true },
        });

        if (!loan) {
          return res.status(404).json({ error: "Loan not found for this account" });
        }
      }

      const schedules = await prisma.paymentSchedule.findMany({
        where: {
          userId: authUser.id,
          ...(loanId ? { loanId } : {}),
        },
        include: {
          items: {
            orderBy: { position: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      const serializedSchedules = schedules.map((schedule) => ({
        id: schedule.id,
        name: schedule.name,
        loanId: schedule.loanId,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
        extraPayments: schedule.items.map((item) => ({
          id: item.id,
          type: item.type,
          amount: item.amount,
          period: item.period,
          startPeriod: item.startPeriod,
          endPeriod: item.endPeriod,
        })),
      }));

      res.json({ success: true, schedules: serializedSchedules });
    } catch (err: any) {
      console.error("Failed to fetch payment schedules:", err);
      res.status(500).json({ error: "Failed to load payment schedules", details: err?.message });
    }
  });

  // API Endpoint: Save a named payment schedule tied to a loan
  app.post("/api/payment-schedules", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const authUser = authReq.authUser;
    if (!authUser) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const loanId = typeof req.body?.loanId === "string" ? req.body.loanId.trim() : "";
    const rawExtraPayments = Array.isArray(req.body?.extraPayments) ? req.body.extraPayments : [];

    if (!name) {
      return res.status(400).json({ error: "Schedule name is required" });
    }

    if (!loanId) {
      return res.status(400).json({ error: "Loan selection is required" });
    }

    try {
      const loan = await prisma.loan.findFirst({
        where: {
          id: loanId,
          userId: authUser.id,
        },
        select: {
          id: true,
          years: true,
          months: true,
        },
      });

      if (!loan) {
        return res.status(404).json({ error: "Loan not found for this account" });
      }

      const maxPeriod = Math.min(480, Math.max(6, (Number(loan.years) || 0) * 12 + (Number(loan.months) || 0)));
      const normalizedPayments = normalizeExtraPayments(rawExtraPayments, maxPeriod);
      const scheduleItemPayload = normalizedPayments.map((payment, index) => ({
        type: payment.type,
        amount: payment.amount,
        period: payment.period,
        startPeriod: payment.startPeriod,
        endPeriod: payment.endPeriod,
        position: index,
      }));

      const existingSchedule = await prisma.paymentSchedule.findFirst({
        where: {
          userId: authUser.id,
          loanId,
          name,
        },
        select: { id: true },
      });

      let savedSchedule;
      if (existingSchedule) {
        savedSchedule = await prisma.paymentSchedule.update({
          where: { id: existingSchedule.id },
          data: {
            name,
            items: {
              deleteMany: {},
              create: scheduleItemPayload,
            },
          },
          include: {
            items: {
              orderBy: { position: "asc" },
            },
          },
        });
      } else {
        savedSchedule = await prisma.paymentSchedule.create({
          data: {
            userId: authUser.id,
            loanId,
            name,
            items: {
              create: scheduleItemPayload,
            },
          },
          include: {
            items: {
              orderBy: { position: "asc" },
            },
          },
        });
      }

      res.json({
        success: true,
        replaced: Boolean(existingSchedule),
        schedule: {
          id: savedSchedule.id,
          name: savedSchedule.name,
          loanId: savedSchedule.loanId,
          createdAt: savedSchedule.createdAt,
          updatedAt: savedSchedule.updatedAt,
          extraPayments: savedSchedule.items.map((item) => ({
            id: item.id,
            type: item.type,
            amount: item.amount,
            period: item.period,
            startPeriod: item.startPeriod,
            endPeriod: item.endPeriod,
          })),
        },
      });
    } catch (err: any) {
      console.error("Failed to save payment schedule:", err);
      res.status(500).json({ error: "Failed to save payment schedule", details: err?.message });
    }
  });

  // API Endpoint: Calculate premium scenario comparisons
  app.post("/api/loans/scenarios-calculate", (req, res) => {
    const { loanDetails, extraPayments = [] } = req.body;

    if (!loanDetails) {
      return res.status(400).json({ error: "Missing loanDetails configuration" });
    }

    try {
      const baseline = calculateStandardRows(loanDetails);
      const scenario = calculateScenarioRows(loanDetails, extraPayments);

      const interestSaved = Math.max(0, baseline.totalInterestPaid - scenario.totalInterestPaid);
      const monthsSaved = Math.max(0, baseline.durationMonths - scenario.durationMonths);

      res.json({
        success: true,
        baseline,
        scenario,
        interestSaved,
        monthsSaved
      });
    } catch (err: any) {
      console.error("Calculations error:", err);
      res.status(500).json({ error: "Calculations failure", details: err?.message });
    }
  });

  // Vite middleware setup or Static file delivery
  const rootIndexPath = path.join(process.cwd(), "index.html");
  const distPath = path.join(process.cwd(), "dist");

  // If not in production and index.html exists, use Vite dev server middleware; otherwise serve static files from dist
  if (!isProd && existsSync(rootIndexPath)) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    // Fallback route for SPA: serve transformed index.html for all unmatched routes
    app.use("*", async (req, res, next) => {
      try {
        const template = await readFile(rootIndexPath, "utf-8");
        const transformed = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(transformed);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Loan Salamander app server booted successfully on port ${PORT}`);
    console.log(`Mode: "DEVELOPMENT"}`);
  });
}

startServer().catch((e) => {
  console.error("Failed to start server:", e);
});
