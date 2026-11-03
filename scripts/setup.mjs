#!/usr/bin/env node

import { copyFileSync, existsSync, openSync, closeSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const rootDir = process.cwd();
const envExamplePath = join(rootDir, ".env.example");
const envPath = join(rootDir, ".env");
const dbPath = join(rootDir, "dev.db");

function log(message) {
  process.stdout.write(`${message}\n`);
}

function fail(message) {
  process.stderr.write(`\nERROR: ${message}\n`);
  process.exit(1);
}

function ensureDockerInstalled() {
  const result = spawnSync("docker", ["--version"], { stdio: "pipe" });
  if (result.error || result.status !== 0) {
    fail(
      "Docker is required but was not found. Install Docker Desktop (Windows/macOS) or Docker Engine (Linux), then rerun: npm run setup"
    );
  }
  log(`Docker detected: ${String(result.stdout).trim()}`);
}

function ensureEnvFile() {
  if (!existsSync(envExamplePath)) {
    fail(".env.example is missing in the repository root.");
  }

  if (!existsSync(envPath)) {
    copyFileSync(envExamplePath, envPath);
    log("Created .env from .env.example");
  } else {
    log(".env already exists (left unchanged except AUTH_SECRET if empty/missing)");
  }
}

function ensureAuthSecret() {
  const secret = randomBytes(32).toString("hex");
  const envContent = readFileSync(envPath, "utf8");

  const authSecretLineRegex = /^AUTH_SECRET=(.*)$/m;
  const match = envContent.match(authSecretLineRegex);

  if (!match) {
    const next = envContent.endsWith("\n") ? envContent : `${envContent}\n`;
    writeFileSync(envPath, `${next}AUTH_SECRET=${secret}\n`, "utf8");
    log("Added AUTH_SECRET to .env");
    return;
  }

  const currentValue = match[1].trim();
  if (currentValue.length > 0) {
    log("AUTH_SECRET already set in .env");
    return;
  }

  const updated = envContent.replace(authSecretLineRegex, `AUTH_SECRET=${secret}`);
  writeFileSync(envPath, updated, "utf8");
  log("Generated AUTH_SECRET in .env");
}

function ensureDbFile() {
  if (existsSync(dbPath)) {
    log("dev.db already exists");
    return;
  }

  const fd = openSync(dbPath, "a");
  closeSync(fd);
  log("Created dev.db");
}

function printNextSteps() {
  log("\nSetup complete. Next steps:\n");
  log("1) Build the image:");
  log("   docker build -t loan-salamander .\n");
  log("2) Run the container (Linux/macOS shell):");
  log('   docker run --name loan-salamander --env-file .env -p 3000:3000 -v "$(pwd)/dev.db:/app/dev.db" --restart unless-stopped loan-salamander\n');
  log("   Run the container (PowerShell):");
  log('   docker run --name loan-salamander --env-file .env -p 3000:3000 -v "${PWD}/dev.db:/app/dev.db" --restart unless-stopped loan-salamander\n');
  log("3) Open http://localhost:3000");
}

ensureDockerInstalled();
ensureEnvFile();
ensureAuthSecret();
ensureDbFile();
printNextSteps();
