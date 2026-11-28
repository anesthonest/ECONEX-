#!/usr/bin/env node
/**
 * ECONEX V28.0 - Secret-Free Source Archive Builder & Verifier (ECONEX-V28.0-SOURCE.zip)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { scanDirectoryForSecrets } from './econex-secret-scan.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const EXPORT_DIR = path.join(ROOT, 'exports');
const ARCHIVE_NAME = 'ECONEX-V30.0-SOURCE.zip';
const ARCHIVE_PATH = path.join(EXPORT_DIR, ARCHIVE_NAME);
const MANIFEST_PATH = path.join(EXPORT_DIR, 'ECONEX-V30.0-EXPORT-MANIFEST.json');

const EXCLUDED_TOP_OR_ANY_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  'exports',
  'data',
  '.econex-reports',
  '.tmp',
  'workspace',
]);

const EXCLUDED_FILE_NAMES = new Set([
  '.DS_Store',
]);

// Standard IEEE 802.3 CRC-32 table
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function toDosTimeDate(date) {
  const d = new Date(date);
  const year = Math.max(1980, d.getFullYear());
  const dosTime =
    ((d.getHours() & 0x1f) << 11) |
    ((d.getMinutes() & 0x3f) << 5) |
    ((d.getSeconds() >> 1) & 0x1f);
  const dosDate =
    (((year - 1980) & 0x7f) << 9) |
    (((d.getMonth() + 1) & 0x0f) << 5) |
    (d.getDate() & 0x1f);
  return { dosTime, dosDate };
}

function buildZipBuffer(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.zipPath, 'utf8');
    const raw = entry.data;
    const crc = crc32(raw);
    const compressed = zlib.deflateRawSync(raw, { level: 6 });
    const useDeflate = compressed.length < raw.length;
    const payload = useDeflate ? compressed : raw;
    const method = useDeflate ? 8 : 0;
    const { dosTime, dosDate } = toDosTimeDate(entry.mtimeMs);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 flag
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(payload.length, 18);
    localHeader.writeUInt32LE(raw.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, payload);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(payload.length, 20);
    centralHeader.writeUInt32LE(raw.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + payload.length;
  }

  const centralDirBuf = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirBuf, eocd]);
}

function collectExportFiles(rootDir) {
  const collected = [];

  function walk(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      const rel = path.relative(rootDir, fullPath).replace(/\\/g, '/');

      if (item.isDirectory()) {
        if (EXCLUDED_TOP_OR_ANY_DIRS.has(item.name)) continue;
        walk(fullPath);
        continue;
      }

      if (EXCLUDED_FILE_NAMES.has(item.name)) continue;
      if (/\.zip$/i.test(item.name) || /\.log$/i.test(item.name)) continue;
      if (/^\.env($|\.)/.test(item.name) && item.name !== '.env.example') continue;

      const stat = fs.statSync(fullPath);
      collected.push({
        zipPath: rel,
        fullPath,
        data: fs.readFileSync(fullPath),
        mtimeMs: stat.mtimeMs,
      });
    }
  }

  walk(rootDir);
  return collected;
}

export function verifyZipArchive(archivePath = ARCHIVE_PATH) {
  if (!fs.existsSync(archivePath)) {
    throw new Error(`Archive not found at ${archivePath}`);
  }
  const raw = fs.readFileSync(archivePath);
  if (raw.length === 0) {
    throw new Error('Archive file is 0 bytes');
  }
  const sha256 = crypto.createHash('sha256').update(raw).digest('hex');

  // Verify CRC integrity via `unzip -t`
  execFileSync('unzip', ['-t', archivePath], { stdio: 'pipe' });

  // Extract cleanly into isolated temp dir & validate contents
  const tmpExtract = `/tmp/econex_extract_${Date.now()}`;
  fs.mkdirSync(tmpExtract, { recursive: true });
  try {
    execFileSync('unzip', ['-q', archivePath, '-d', tmpExtract], { stdio: 'pipe' });

    const requiredFiles = [
      'package.json',
      'index.html',
      'server.ts',
      'tsconfig.json',
      'vite.config.ts',
      '.env.example',
      '.gitignore',
      'Dockerfile',
      '.github/workflows/econex-ci.yml',
      'README.md',
      'DEPLOYMENT.md',
      'POSTGRES_MIGRATION.md',
      'API_INTEGRATION_GUIDE.md',
      'RECOVERY.md',
      'SECURITY.md',
      'ARCHITECTURE.md',
      'DATABASE_SCHEMA.md',
      'OPERATIONS_RUNBOOK.md',
      'DISASTER_RECOVERY.md',
      'RELEASE_NOTES.md',
      'src/App.tsx',
      'src/navigation/navigationRegistry.ts',
      'src/server/api.ts',
      'src/server/v18Routes.ts',
      'src/server/v19Routes.ts',
      'src/server/v20Routes.ts',
      'src/server/v20Engine.ts',
      'src/server/postgres/schema_v17.sql',
      'src/server/postgres/schema_v18.sql',
      'src/components/v20/V20EconomicOperationsHub.tsx',
      'src/components/v20/V20PilotControlView.tsx',
      'RELEASE_NOTES_V21.md',
      'src/server/v21Routes.ts',
      'src/server/v21Engine.ts',
      'src/server/v21PostgresMigrator.ts',
      'src/server/postgres/schema_v19.sql',
      'src/components/v21/V21FieldOperationsApp.tsx',
      'src/components/v21/V21OnboardingHub.tsx',
      'src/components/v21/V21PilotCommandCentre.tsx',
      'src/components/modules/v21PilotOperationsTests.ts',
      'RELEASE_NOTES_V22.md',
      'src/server/v22Seed.ts',
      'src/server/v22Engine.ts',
      'src/server/v22Routes.ts',
      'src/server/postgres/schema_v20.sql',
      'src/components/v22/V22UniversalDashboard.tsx',
      'src/components/v22/V22DiscoverEconomyView.tsx',
      'src/components/v22/V22UniversalMarketplaceView.tsx',
      'src/components/v22/V22BusinessWorkspaceView.tsx',
      'src/components/v22/V22ProcurementProjectsView.tsx',
      'src/components/v22/V22FinancialIntelligenceView.tsx',
      'src/components/modules/v22UniversalEconomyTests.ts',
      'WALLET_ARCHITECTURE_V23.md',
      'RELEASE_NOTES_V23.md',
      'ROADMAP_V23.md',
      'src/server/v23Seed.ts',
      'src/server/v23Engine.ts',
      'src/server/v23Routes.ts',
      'src/server/postgres/schema_v21.sql',
      'src/components/v23/V23UniversalWalletDashboard.tsx',
      'src/components/v23/V23MerchantAcceptanceView.tsx',
      'src/components/v23/V23CardsInfrastructureView.tsx',
      'src/components/v23/V23CrossCountryNetworkView.tsx',
      'src/components/v23/V23WalletOperationsAdminView.tsx',
      'src/components/modules/v23WalletNetworkTests.ts',
      'src/server/v24Seed.ts',
      'src/server/v24Engine.ts',
      'src/server/v24Routes.ts',
      'src/server/postgres/schema_v22.sql',
      'src/components/v24/V24ExecutionNetworkHub.tsx',
      'src/components/v24/V24MarketplaceRfqContractsView.tsx',
      'src/components/v24/V24OrdersInventoryManufacturingView.tsx',
      'src/components/v24/V24ProcurementLogisticsProjectsView.tsx',
      'src/components/v24/V24BusinessDocumentsExecutionView.tsx',
      'src/components/modules/v24CommerceNetworkTests.ts',
      'src/server/v25Seed.ts',
      'src/server/v25Engine.ts',
      'src/server/v25PostgresEngine.ts',
      'src/server/v25Routes.ts',
      'src/server/postgres/schema_v23.sql',
      'src/components/v25/V25InfrastructureCommandCentreView.tsx',
      'src/components/v25/V25EnterpriseOrgIdentityView.tsx',
      'src/components/v25/V25PostgresMigrationOpsView.tsx',
      'src/components/v25/V25DeveloperPlatformIntegrationsView.tsx',
      'src/components/modules/v25ContinentalInfraTests.ts',
      'src/server/v26AuditRegistry.ts',
      'src/server/v26Seed.ts',
      'src/server/v26Engine.ts',
      'src/server/v26Routes.ts',
      'src/server/postgres/schema_v24.sql',
      'src/components/v26/V26ActivationCommandHub.tsx',
      'src/components/v26/V26DocumentsReportsVaultView.tsx',
      'src/components/v26/V26InteractiveAuditAndRoutesView.tsx',
      'src/components/modules/v26PlatformActivationTests.ts',
      'INTERACTIVE_FUNCTIONALITY_AUDIT.md',
      'ROUTE_INVENTORY.md',
      'WORKFLOW_COVERAGE.md',
      'V26_TEST_REPORT.md',
      'src/server/v27Seed.ts',
      'src/server/v27Engine.ts',
      'src/server/v27Routes.ts',
      'src/server/postgres/schema_v25.sql',
      'src/components/v27/V27EconomicNetworkHub.tsx',
      'src/components/v27/V27TrustDiscoveryMatchingView.tsx',
      'src/components/v27/V27OpportunitiesCrmGrowthView.tsx',
      'src/components/v27/V27IntelligenceAiPilotView.tsx',
      'src/components/v27/V27FieldIntegrationSecurityView.tsx',
      'src/components/modules/v27EconomicNetworkTests.ts',
      'ECONOMIC_NETWORK_ARCHITECTURE.md',
      'TRUST_AND_REPUTATION_FRAMEWORK.md',
      'ECONOMIC_MATCHING_ENGINE.md',
      'OPPORTUNITY_EXCHANGE_GUIDE.md',
      'ECONOMIC_INTELLIGENCE_GUIDE.md',
      'PILOT_OPERATIONS_GUIDE.md',
      'FIELD_OPERATIONS_GUIDE.md',
      'INTEGRATION_GOVERNANCE.md',
      'V27_TEST_REPORT.md',
      '.github/workflows/ci.yml',
      '.github/workflows/security.yml',
      '.github/PULL_REQUEST_TEMPLATE.md',
      '.github/ISSUE_TEMPLATE/bug_report.md',
      'CONTRIBUTING.md',
      'database/schema_v26.sql',
      'src/server/postgres/schema_v26.sql',
      'src/server/v28Seed.ts',
      'src/server/v28Engine.ts',
      'src/server/v28GitHubEngine.ts',
      'src/server/v28Routes.ts',
      'src/components/v28/V28ExecutionWorkspaceView.tsx',
      'src/components/v28/V28ContractsProcurementView.tsx',
      'src/components/v28/V28FulfilmentCrossBorderView.tsx',
      'src/components/v28/V28InteroperabilityEventsView.tsx',
      'src/components/v28/V28ContinentalIntelligenceOpsView.tsx',
      'src/components/v28/V28FieldRepoEngineeringView.tsx',
      'src/components/modules/v28ExecutionTests.ts',
      'V28_TEST_REPORT.md',
      'docs/engineering/GITHUB_SYNC_AND_AI_STUDIO_RCA.md',
      'docs/releases/V28_SYSTEM_ARCHITECTURE_BLUEPRINT.md',
      'src/config/econexAssetManifest.ts',
      'src/components/ux/EconexImage.tsx',
      'src/components/ux/CorePrimitives.tsx',
      'src/components/ux/DomainCards.tsx',
      'src/components/ux/GlobalCommandSearch.tsx',
      'src/components/layout/EconexNavigation.tsx',
      'src/components/modules/v29UiUxTests.ts',
      'public/assets/econex/hero/africa-commerce-hub.jpg',
      'public/assets/econex/agriculture/coffee-harvest.jpg',
      'public/assets/econex/agriculture/maize-grain.jpg',
      'public/assets/econex/agriculture/fresh-produce.jpg',
      'public/assets/econex/manufacturing/industrial-plant.jpg',
      'public/assets/econex/construction/civil-engineering.jpg',
      'public/assets/econex/logistics/freight-corridor.jpg',
      'public/assets/econex/logistics/fulfillment-warehouse.jpg',
      'public/assets/econex/retail/wholesale-showroom.jpg',
      'public/assets/econex/services/business-advisory.jpg',
      'public/assets/econex/technology/solar-energy-tech.jpg',
      'public/assets/econex/hospitality/clinic-hospitality.jpg',
      'docs/releases/V29_UI_UX_AUDIT.md',
      'docs/design/V29_DESIGN_SYSTEM.md',
      'docs/design/V29_CONTENT_AND_LANGUAGE_GUIDE.md',
      'docs/design/V29_IMAGE_ASSET_GUIDE.md',
      'docs/audits/V29_ROUTE_REDESIGN_REGISTER.md',
      'docs/audits/V29_INTERACTIVE_CONTROL_AUDIT.md',
      'docs/releases/V29_TEST_REPORT.md',
      'docs/releases/V29_READINESS_MATRIX.md',
      'docs/releases/V29_IMPLEMENTATION_SUMMARY.md',
      'docs/releases/V29_MASTER_RELEASE_REPORT.md',
      'database/schema_v27.sql',
      'src/server/postgres/schema_v27.sql',
      'src/server/v30Seed.ts',
      'src/server/v30Engine.ts',
      'src/server/v30GitHubEngine.ts',
      'src/server/v30Routes.ts',
      'src/components/v30/V30FinancialNetworkHub.tsx',
      'src/components/v30/V30CorridorsAgentsLiquidityView.tsx',
      'src/components/v30/V30BusinessDisputesComplianceView.tsx',
      'src/components/v30/V30UniversalWalletAndCardsView.tsx',
      'src/components/v30/V30DeveloperGitHubIntegrationsView.tsx',
      'src/components/modules/v30FinancialResilienceTests.ts',
      'public/assets/econex/finance/enterprise-finance-hub.jpg',
      'public/assets/econex/finance/corridor-border-trade.jpg',
      'public/assets/econex/finance/mobile-money-agent.jpg',
      'public/assets/econex/finance/digital-treasury.jpg',
      'public/assets/econex/finance/merchant-qr-counter.jpg',
      'public/assets/econex/finance/rural-agro-finance.jpg',
      'ECONEX_FULL_BLUEPRINT.md',
      'V30_ARCHITECTURE.md',
      'V30_FINANCIAL_INTEROPERABILITY.md',
      'V30_PROVIDER_ADAPTERS.md',
      'V30_WALLET_ARCHITECTURE.md',
      'V30_FINANCIAL_RESILIENCE.md',
      'V30_REGULATORY_READINESS.md',
      'V30_SECURITY_AND_FRAUD.md',
      'V30_AI_GOVERNANCE.md',
      'V30_GITHUB_WORKFLOW.md',
      'V30_UI_UX_GUIDE.md',
      'V30_TEST_REPORT.md',
      'V30_RELEASE_REPORT.md',
      'V30_SCHEMA_CHANGELOG.md',
    ];

    const missingRequired = requiredFiles.filter((rel) => !fs.existsSync(path.join(tmpExtract, rel)));
    const forbiddenPresent = ['.env', 'data/aros_database.json', 'node_modules'].filter((rel) =>
      fs.existsSync(path.join(tmpExtract, rel))
    );

    const listRaw = execFileSync('unzip', ['-Z1', archivePath], { encoding: 'utf8' });
    const fileList = listRaw.split('\n').map((s) => s.trim()).filter(Boolean);

    const manifestOk = (() => {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(tmpExtract, 'package.json'), 'utf8'));
        return Boolean(pkg.scripts?.build && pkg.scripts?.dev && pkg.scripts?.start);
      } catch {
        return false;
      }
    })();

    return {
      verified: missingRequired.length === 0 && forbiddenPresent.length === 0 && manifestOk,
      archiveName: path.basename(archivePath),
      archivePath,
      bytes: raw.length,
      sha256,
      fileCount: fileList.length,
      missingRequired,
      forbiddenPresent,
      manifestOk,
      unzipIntegrityPassed: true,
      extractedInspectionPassed: missingRequired.length === 0 && forbiddenPresent.length === 0 && manifestOk,
      verifiedAt: new Date().toISOString(),
    };
  } finally {
    fs.rmSync(tmpExtract, { recursive: true, force: true });
  }
}

export function generateAndVerifyExport({ verifyOnly = false } = {}) {
  const secretScan = scanDirectoryForSecrets(ROOT);
  if (!secretScan.passed) {
    throw new Error(
      `Secret scan failed before export: ${JSON.stringify({
        findings: secretScan.findings,
        forbiddenEnvFiles: secretScan.forbiddenEnvFiles,
      })}`
    );
  }

  if (!verifyOnly) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
    const entries = collectExportFiles(ROOT);
    const zipBuf = buildZipBuffer(entries);
    fs.writeFileSync(ARCHIVE_PATH, zipBuf);
  }

  const verification = verifyZipArchive(ARCHIVE_PATH);
  const manifest = {
    product: 'ECONEX',
    release: 'V30.0-UNIVERSAL-FINANCIAL-RESILIENCE',
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    secretScan,
    verification,
  };
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const verifyOnly = process.argv.includes('--verify-only');
  const asJson = process.argv.includes('--json');
  try {
    const manifest = generateAndVerifyExport({ verifyOnly });
    if (asJson) {
      console.log(JSON.stringify(manifest, null, 2));
    } else {
      const v = manifest.verification;
      console.log(
        `[ECONEX EXPORT] ${v.archiveName} | ${v.bytes} bytes | ${v.fileCount} files | SHA-256=${v.sha256.slice(0, 16)}... | Verified=${v.verified}`
      );
    }
    process.exit(manifest.verification.verified ? 0 : 1);
  } catch (err) {
    console.error('[ECONEX EXPORT ERROR]', err?.message || err);
    process.exit(1);
  }
}
