# Contributing to Loan Salamander

Thank you for your interest in contributing to Loan Salamander! This document provides guidelines for contributing to the project.

## Contributor License Agreement

By contributing to this project, you agree that:

- Your contributions are your own original work
- You grant the project maintainers and users a perpetual, worldwide, non-exclusive, royalty-free license to use your contributions
- You have the right to grant these licenses
- Your contributions are provided "as-is" without any warranties

A formal CLA will be required before merging pull requests. You will be asked to sign it as part of the PR process.

## Getting Started

### Development Setup

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/yourusername/loan-salamander.git
   cd loan-salamander
   npm install
   ```

2. Configure your environment:
   ```bash
   cp .env.example .env
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Code Style

This project follows a consistent code style to maintain readability and consistency. Please adhere to these guidelines:

### TypeScript

- Use **strict mode** enabled in `tsconfig.json`
- Add type annotations for function parameters and return types
- Use interfaces for object shapes; avoid `any` types
- Use constants and enums for magic values
- Add JSDoc comments for exported functions and components

Example:

```typescript
/**
 * Calculates the monthly payment for a loan
 * @param principal - The loan amount in dollars
 * @param annualRate - The annual interest rate (e.g., 5 for 5%)
 * @param months - The loan term in months
 * @returns The monthly payment in dollars
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  months: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
}
```

### React Components

- Use **functional components** with hooks
- Name component files with PascalCase (e.g., `CalculatorPage.tsx`)
- Add a JSDoc comment describing the component's purpose
- Keep components focused and decompose large components into smaller ones
- Use meaningful prop names and add prop type documentation

Example:

```typescript
interface LoanInputProps {
  principal: number;
  onPrincipalChange: (value: number) => void;
  rate: number;
  onRateChange: (value: number) => void;
}

/**
 * Form for entering loan parameters.
 * Displays input fields for principal, interest rate, and term.
 */
export function LoanInput({
  principal,
  onPrincipalChange,
  rate,
  onRateChange,
}: LoanInputProps) {
  return (
    <div className="space-y-4">
      <input
        type="number"
        value={principal}
        onChange={(e) => onPrincipalChange(Number(e.target.value))}
        placeholder="Loan amount"
      />
      <input
        type="number"
        value={rate}
        onChange={(e) => onRateChange(Number(e.target.value))}
        placeholder="Interest rate"
      />
    </div>
  );
}
```

### Database Schema (Prisma)

- Use descriptive model and field names
- Add `createdAt` and `updatedAt` timestamp fields to models that track changes
- Use `@unique` for email, username, or other identifiers
- Add comments explaining non-obvious relationships or business logic

Example:

```prisma
model Loan {
  id        Int       @id @default(autoincrement())
  userId    Int
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  principal Decimal   @db.Decimal(12, 2)  // Loan amount
  rate      Decimal   @db.Decimal(5, 3)   // Annual interest rate
  term      Int                           // Loan term in months
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([userId])
}
```

### Formatting

- Use **Prettier** for automatic code formatting
- Lint your code before committing:
  ```bash
  npm run lint
  ```

## Commit Messages

Write clear, descriptive commit messages that explain the "why" behind your changes:

- **Format**: `<type>: <description>` followed by optional body and footer
- **Types**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

Examples:

```
feat: add refinancing scenario calculator

Adds a new page for modeling refinancing options. Calculates 
potential savings by comparing current loan terms with new 
refinance terms, accounting for closing costs.

Closes #42
```

```
fix: correct interest rate calculation in payment scenarios

The payment schedule was not correctly accounting for 
compounding when applying the monthly interest rate.
```

## Submitting Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make your changes** and commit with clear messages

3. **Run tests and linting**:
   ```bash
   npm run lint
   npm test
   ```

4. **Push your branch**:
   ```bash
   git push origin feat/my-feature
   ```

5. **Create a Pull Request** with:
   - A clear title describing the changes
   - A description of what was changed and why
   - Reference to any related issues (`Closes #123`)
   - Screenshots/recordings for UI changes (if applicable)

6. **Address review feedback** and keep your branch up to date

## What We're Looking For

- **Clear, well-tested code**: Changes should be thoroughly tested
- **Self-documenting code**: Use comments to explain the "why" of non-obvious decisions
- **Consistency**: Follow the existing code style and patterns
- **Small, focused PRs**: Easier to review and understand
- **Good commit history**: Clear, descriptive commit messages
- **Updated documentation**: If your change affects user-facing behavior or setup

## Running the Full Test Suite

Before submitting a PR, ensure all tests pass and the app builds successfully:

```bash
# Lint all code
npm run lint

# Run all tests
npm test

# Build for production
npm run build
```

## Questions?

Feel free to open an issue or discussion if you have questions about contributing. We're here to help!

---

Thank you for helping make Loan Salamander better! 🦎
