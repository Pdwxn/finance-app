import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL debe ser una URL válida' }),
  PORT: z.coerce.number().int().positive().default(3001),
  JWT_SECRET: z.string().min(32, { message: 'JWT_SECRET debe tener al menos 32 caracteres' }),
  JWT_REFRESH_SECRET: z.string().min(32, { message: 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres' }),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  GROQ_API_KEY: z.string().min(1, { message: 'GROQ_API_KEY es requerida' }),
  GROQ_MODEL: z.string().default('gpt-oss-120b'),
  BYPASS_AUTH: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  DEV_USER_ID: z.string().uuid().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
