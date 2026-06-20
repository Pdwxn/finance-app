import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email({ message: 'Email no válido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  name: z.string().min(1, { message: 'El nombre es obligatorio' }),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email no válido' }),
  password: z.string().min(1, { message: 'La contraseña es obligatoria' }),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, { message: 'El refresh token es obligatorio' }),
});
