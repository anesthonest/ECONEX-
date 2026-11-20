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

  // Mount API router
  app.use('/api', apiRouter);

  // Root process health check
  app.get('/health', (_req, res) => {
    const mem = process.memoryUsage();
    res.json({
      status: 'healthy',
      product: 'ECONEX',
      system: 'ECONEX V19',
      release: 'V19.0-PLATFORM-STABILITY-AND-DELIVERY',
      environment: process.env.ECONEX_ENV || (isProduction ? 'PRODUCTION' : 'DEVELOPMENT'),
      developer: 'VINEXSAH TECHNOLOGIES',
      uptimeSeconds: Math.round(process.uptime()),
      memoryRssMb: Number((mem.rss / (1024 * 1024)).toFixed(1)),
      heapUsedMb: Number((mem.heapUsed / (1024 * 1024)).toFixed(1)),
      port: PORT,
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

  let shuttingDown = false;
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
