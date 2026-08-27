import { z } from 'zod';

/**
 * Validated once at boot. If anything required is missing or malformed the
 * app refuses to start instead of limping along on a silent fallback
 * (BrickFi's old JWT_SECRET ?? 'change_this' pattern is exactly what this
 * replaces).
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  // Seconds, not a duration string — keeps this an unambiguous number for @nestjs/jwt's expiresIn option.
  JWT_ACCESS_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60),
  JWT_REFRESH_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(7 * 24 * 60 * 60),
  ADMIN_WALLET_ADDRESSES: z.string().default(''),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map(
        (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
      )
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}

/** Parses the comma-separated admin address list into a lowercase Set for O(1) lookups. */
export function parseAdminAddresses(raw: string): Set<string> {
  return new Set(
    raw
      .split(',')
      .map((address) => address.trim().toLowerCase())
      .filter(Boolean),
  );
}
