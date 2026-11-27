/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V19.0 - Stabilised Full-Stack Express & Vite Server Entry Point
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/api.ts';
import { db } from './src/server/db.ts';
import { correlationMiddleware, validateV21Environment } from './src/server/v21Config.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();

  // Preserve port 3000 as the established project port for AI Studio runtime compatibility
  const portArgIdx = process.argv.indexOf('--port');
  const cliPort =
    portArgIdx !== -1 && process.argv[portArgIdx + 1]
      ? Number(process.argv[portArgIdx + 1])
      : null;
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = cliPort || Number(process.env.PORT) || 3000;

  if (!Number.isFinite(PORT) || PORT < 1 || PORT > 65535) {
    console.error(`[ECONEX V19] Invalid port configuration: ${PORT}`);
    process.exit(1);
  }

  app.use(express.json({ limit: '5mb' }));
  app.use(correlationMiddleware);

  let shuttingDown = false;

  // Mount API router
  app.use('/api', apiRouter);

  // Root process health & readiness checks
  app.get('/health', (req, res) => {
    const mem = process.memoryUsage();
    const envDiag = validateV21Environment();
    res.json({
      status: shuttingDown ? 'DRAINING' : 'healthy',
      product: 'ECONEX',
      system: 'ECONEX V26',
      release: 'V26.0-UNIVERSAL-PLATFORM-ACTIVATION',
      v19Release: 'V19.0-PLATFORM-STABILITY-AND-DELIVERY',
      v20Release: 'V20.0-UNIFIED-ECONOMIC-OPERATIONS',
      v21Release: 'V21.0-CONTROLLED-PILOT-AND-MARKET-ACTIVATION',
      v22Release: 'V22.0-UNIVERSAL-ECONOMIC-GROWTH',
      v23Release: 'V23.0-UNIVERSAL-WALLET-NETWORK',
      v24Release: 'V24.0-UNIVERSAL-COMMERCE-EXECUTION',
      v25Release: 'V25.0-CONTINENTAL-INFRASTRUCTURE',
      v26Release: 'V26.0-UNIVERSAL-PLATFORM-ACTIVATION',
      v27Release: 'V27.0-UNIVERSAL-ECONOMIC-NETWORK',
      v28Release: 'V28.0-UNIVERSAL-ECONOMIC-EXECUTION',
      environment: envDiag.environment,
      databaseAuthority: envDiag.databaseAuthority,
      schemaVersion: db.schemaVersion,
      developer: 'VINEXSAH TECHNOLOGIES',
      attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
      correlationId: (req as any).correlationId || null,
      uptimeSeconds: Math.round(process.uptime()),
      memoryRssMb: Number((mem.rss / (1024 * 1024)).toFixed(1)),
      heapUsedMb: Number((mem.heapUsed / (1024 * 1024)).toFixed(1)),
      port: PORT,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/ready', (_req, res) => {
    const envDiag = validateV21Environment();
    const fin = db.getFinancialIntegrityReport();
    const v22Check = db.validateV22SchemaIntegrity();
    const v23Check = db.validateV23SchemaIntegrity();
    const v24Check = db.validateV24SchemaIntegrity();
    const v25Check = db.validateV25SchemaIntegrity();
    const v26Check = db.validateV26SchemaIntegrity();
    const isReady = !shuttingDown && envDiag.portValid && fin.journalBalanced && v23Check.valid && v24Check.valid && v25Check.valid && v26Check.valid;
    res.status(isReady ? 200 : 503).json({
      ready: isReady,
      shuttingDown,
      schemaVersion: db.schemaVersion,
      databaseAuthority: envDiag.databaseAuthority,
      journalBalanced: fin.journalBalanced,
      schema22IntegrityValid: v22Check.valid,
      schema23IntegrityValid: v23Check.valid,
      schema24IntegrityValid: v24Check.valid,
      schema25IntegrityValid: v25Check.valid,
      schema26IntegrityValid: v26Check.valid,
      timestamp: new Date().toISOString(),
    });
  });

  let viteServer: any = null;
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    viteServer = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(viteServer.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    const distIndex = path.join(distDir, 'index.html');
    if (!fs.existsSync(distIndex)) {
      console.error('[ECONEX V19] Production build missing dist/index.html. Run `npm run build` first.');
      process.exit(1);
    }
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(distIndex);
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[ECONEX V19.0] Server active at http://0.0.0.0:${PORT} (env=${process.env.ECONEX_ENV || (isProduction ? 'production' : 'development')}, schema=${db.schemaVersion})`
    );
  });

  const gracefulShutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[ECONEX V19.0] ${signal} received: flushing database WAL and closing server...`);
    try {
      db.persistToDiskSync();
    } catch (e) {
      console.error('[ECONEX V19.0] WAL flush error during shutdown:', e);
    }
    if (viteServer && typeof viteServer.close === 'function') {
      await viteServer.close().catch(() => {});
    }
    server.close(() => {
      console.log('[ECONEX V19.0] Clean shutdown complete.');
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `[ECONEX V19.0] Port ${PORT} is already in use (EADDRINUSE). Stop duplicate processes or pass --port <port>.`
      );
      process.exit(1);
    }
    console.error('[ECONEX V19.0] Server runtime error:', err);
    process.exit(1);
  });
}

startServer().catch((err) => {
  console.error('[ECONEX V19.0] Fatal server startup error:', err);
  process.exit(1);
});
