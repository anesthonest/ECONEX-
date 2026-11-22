/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V21.0 - Deployment Environment Portability, Validation & Correlation Middleware
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export type EconexEnvironmentMode = 'DEVELOPMENT' | 'AUTOMATED_TESTING' | 'STAGING' | 'PRODUCTION';

export interface V21EnvironmentDiagnostics {
  environment: EconexEnvironmentMode;
  nodeEnv: string;
  port: number;
  portValid: boolean;
  databaseAuthority: 'LOCAL_JSON_WAL_AUTHORITATIVE' | 'POSTGRES_PRIMARY';
  databaseUrlConfigured: boolean;
  geminiKeyConfigured: boolean;
  deploymentDomainConfigured: boolean;
  tlsTerminationExpected: boolean;
  warnings: string[];
  blockersForProduction: string[];
  validatedAt: string;
}

export function resolveEnvironmentMode(): EconexEnvironmentMode {
  const raw = String(process.env.ECONEX_ENV || '').toUpperCase().trim();
  if (raw === 'PRODUCTION') return 'PRODUCTION';
  if (raw === 'STAGING') return 'STAGING';
  if (raw === 'AUTOMATED_TESTING') return 'AUTOMATED_TESTING';
  return process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT';
}

export function validateV21Environment(): V21EnvironmentDiagnostics {
  const envMode = resolveEnvironmentMode();
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = Number(process.env.PORT || 3000);
  const portValid = Number.isFinite(port) && port >= 1 && port <= 65535;
  const databaseUrlConfigured = Boolean(process.env.DATABASE_URL || process.env.PGHOST);
  const geminiKeyConfigured = Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('REPLACE_WITH'));
  const deploymentDomainConfigured = Boolean(process.env.APP_URL && !process.env.APP_URL.includes('localhost'));
  const tlsTerminationExpected = envMode === 'STAGING' || envMode === 'PRODUCTION';

  const warnings: string[] = [];
  const blockersForProduction: string[] = [];

  if (!databaseUrlConfigured) {
    warnings.push('DATABASE_URL not configured; JSON WAL remains fail-closed authoritative.');
    blockersForProduction.push('Managed PostgreSQL 16 DATABASE_URL not provisioned or cut over.');
  }
  if (!geminiKeyConfigured) {
    warnings.push('GEMINI_API_KEY not active; V20/V21 operational AI uses deterministic offline fallback.');
  }
  if (!deploymentDomainConfigured) {
    blockersForProduction.push('Production domain and HTTPS reverse-proxy termination (APP_URL) not configured.');
  }
  if (!process.env.MOMO_PROVIDER_API_KEY || !process.env.RTGS_GATEWAY_ENDPOINT) {
    blockersForProduction.push('Licensed PSP / Mobile Money / Bank settlement endpoints remain unprovisioned.');
  }

  return {
    environment: envMode,
    nodeEnv,
    port,
    portValid,
    databaseAuthority: 'LOCAL_JSON_WAL_AUTHORITATIVE',
    databaseUrlConfigured,
    geminiKeyConfigured,
    deploymentDomainConfigured,
    tlsTerminationExpected,
    warnings,
    blockersForProduction,
    validatedAt: new Date().toISOString(),
  };
}

export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = (req.headers['x-correlation-id'] as string | undefined)?.trim();
  const correlationId = incoming && /^[a-zA-Z0-9._-]{4,64}$/.test(incoming)
    ? incoming
    : `corr-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
  (req as any).correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);
  const t0 = Date.now();
  res.on('finish', () => {
    if (process.env.ECONEX_STRUCTURED_LOGS === 'true' || res.statusCode >= 500) {
      console.log(
        JSON.stringify({
          ts: new Date().toISOString(),
          level: res.statusCode >= 500 ? 'ERROR' : 'INFO',
          correlationId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: Date.now() - t0,
        })
      );
    }
  });
  next();
}
