import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import * as authRepository from './auth.repository';
import type { JwtPayload, AuthResponse } from './auth.types';

const SALT_ROUNDS = 10;

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

function toAuthResponse(user: NonNullable<Awaited<ReturnType<typeof authRepository.findByEmail>>>): AuthResponse {
  const payload: JwtPayload = { userId: user.id, email: user.email };
  return {
    user: { id: user.id, email: user.email, name: user.name },
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export async function register(data: { email: string; password: string; name: string }): Promise<AuthResponse> {
  const existing = await authRepository.findByEmail(data.email);
  if (existing) {
    throw new Error('El email ya está registrado');
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await authRepository.create({
    email: data.email,
    passwordHash,
    name: data.name,
  });

  if (!user) {
    throw new Error('Error al crear el usuario');
  }

  return toAuthResponse(user);
}

export async function login(data: { email: string; password: string }): Promise<AuthResponse> {
  const user = await authRepository.findByEmail(data.email);
  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    throw new Error('Credenciales inválidas');
  }

  return toAuthResponse(user);
}

export async function refresh(refreshToken: string): Promise<{ accessToken: string }> {
  const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
  const user = await authRepository.findById(payload.userId);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  return {
    accessToken: generateAccessToken({ userId: user.id, email: user.email }),
  };
}
