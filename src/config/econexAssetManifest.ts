/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V29.0 - Central Visual Asset Manifest & Deterministic Sector Media Resolver
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

export type EconexMediaCategory =
  | 'hero'
  | 'agriculture'
  | 'manufacturing'
  | 'construction'
  | 'logistics'
  | 'retail'
  | 'services'
  | 'technology'
  | 'hospitality'
  | 'finance';

export interface EconexAssetEntry {
  id: string;
  path: string;
  category: EconexMediaCategory;
  aspectRatio: '16:9' | '4:3';
  alt: string;
  caption: string;
}

export const ECONEX_ASSET_MANIFEST: Record<string, EconexAssetEntry> = {
  hero_commerce: {
    id: 'hero_commerce',
    path: '/assets/econex/hero/africa-commerce-hub.jpg',
    category: 'hero',
    aspectRatio: '16:9',
    alt: 'Modern East African urban commercial district and active marketplace logistics hub at golden hour',
    caption: 'Continental Trade & Commercial Hub',
  },
  finance_enterprise_hub: {
    id: 'finance_enterprise_hub',
    path: '/assets/econex/finance/enterprise-finance-hub.jpg',
    category: 'finance',
    aspectRatio: '16:9',
    alt: 'Modern East African financial and trade operations hub overlooking Kampala skyline at sunset',
    caption: 'Universal Financial Interoperability Hub',
  },
  finance_corridor_border: {
    id: 'finance_corridor_border',
    path: '/assets/econex/finance/corridor-border-trade.jpg',
    category: 'finance',
    aspectRatio: '16:9',
    alt: 'East African One-Stop Border Post trade corridor with commercial trucks queued for customs clearance',
    caption: 'Cross-Border Payment & Trade Corridors',
  },
  finance_mobile_money_agent: {
    id: 'finance_mobile_money_agent',
    path: '/assets/econex/finance/mobile-money-agent.jpg',
    category: 'finance',
    aspectRatio: '4:3',
    alt: 'East African mobile money and financial liquidity agent assisting a business owner in a market street',
    caption: 'Agent & Liquidity Network',
  },
  finance_digital_treasury: {
    id: 'finance_digital_treasury',
    path: '/assets/econex/finance/digital-treasury.jpg',
    category: 'finance',
    aspectRatio: '4:3',
    alt: 'East African finance managers reviewing business reconciliation and multi-rail settlement analytics',
    caption: 'Business Finance & Reconciliation',
  },
  finance_merchant_qr: {
    id: 'finance_merchant_qr',
    path: '/assets/econex/finance/merchant-qr-counter.jpg',
    category: 'finance',
    aspectRatio: '4:3',
    alt: 'East African wholesale merchant accepting a contactless mobile payment at a retail checkout counter',
    caption: 'Merchant Wallet & QR Acceptance',
  },
  finance_rural_agro: {
    id: 'finance_rural_agro',
    path: '/assets/econex/finance/rural-agro-finance.jpg',
    category: 'finance',
    aspectRatio: '4:3',
    alt: 'Cooperative warehouse quality inspector checking coffee moisture content before digital settlement',
    caption: 'Rural Producer Settlement & Inventory',
  },
  agri_coffee: {
    id: 'agri_coffee',
    path: '/assets/econex/agriculture/coffee-harvest.jpg',
    category: 'agriculture',
    aspectRatio: '4:3',
    alt: 'Export-grade East African coffee harvest sorted and prepared for market',
    caption: 'Agriculture & Cash Crops',
  },
  agri_maize: {
    id: 'agri_maize',
    path: '/assets/econex/agriculture/maize-grain.jpg',
    category: 'agriculture',
    aspectRatio: '4:3',
    alt: 'Cleaned dry maize grain stored and graded in woven sacks for wholesale trade',
    caption: 'Grains, Cereals & Staples',
  },
  agri_produce: {
    id: 'agri_produce',
    path: '/assets/econex/agriculture/fresh-produce.jpg',
    category: 'agriculture',
    aspectRatio: '4:3',
    alt: 'Fresh regional produce sorted into market crates for retail and commercial buyers',
    caption: 'Fresh Produce & Horticulture',
  },
  manufacturing_plant: {
    id: 'manufacturing_plant',
    path: '/assets/econex/manufacturing/industrial-plant.jpg',
    category: 'manufacturing',
    aspectRatio: '4:3',
    alt: 'East African food and beverage manufacturing facility with stainless steel processing line and packed pallets',
    caption: 'Manufacturing & Industrial Processing',
  },
  construction_site: {
    id: 'construction_site',
    path: '/assets/econex/construction/civil-engineering.jpg',
    category: 'construction',
    aspectRatio: '4:3',
    alt: 'Civil engineers and site supervisors reviewing blueprints at an East African commercial building site',
    caption: 'Construction & Infrastructure',
  },
  logistics_fleet: {
    id: 'logistics_fleet',
    path: '/assets/econex/logistics/freight-corridor.jpg',
    category: 'logistics',
    aspectRatio: '4:3',
    alt: 'Commercial haulage truck transporting regional cargo along an East African highway corridor',
    caption: 'Transport & Regional Corridors',
  },
  logistics_warehouse: {
    id: 'logistics_warehouse',
    path: '/assets/econex/logistics/fulfillment-warehouse.jpg',
    category: 'logistics',
    aspectRatio: '4:3',
    alt: 'Organized regional fulfillment warehouse with pallet racking and forklift loading export cartons',
    caption: 'Warehousing & Fulfillment',
  },
  retail_showroom: {
    id: 'retail_showroom',
    path: '/assets/econex/retail/wholesale-showroom.jpg',
    category: 'retail',
    aspectRatio: '4:3',
    alt: 'East African wholesale and retail store showcasing dry goods, textiles, and digital payment counter',
    caption: 'Retail, Wholesale & Trade',
  },
  services_office: {
    id: 'services_office',
    path: '/assets/econex/services/business-advisory.jpg',
    category: 'services',
    aspectRatio: '4:3',
    alt: 'Business owners and professional advisors reviewing contracts and market analytics in an office',
    caption: 'Business, Advisory & Services',
  },
  tech_solar: {
    id: 'tech_solar',
    path: '/assets/econex/technology/solar-energy-tech.jpg',
    category: 'technology',
    aspectRatio: '4:3',
    alt: 'Renewable energy engineers calibrating commercial solar arrays and digital grid inverters',
    caption: 'Clean Energy & Technology',
  },
  hospitality_health: {
    id: 'hospitality_health',
    path: '/assets/econex/hospitality/clinic-hospitality.jpg',
    category: 'hospitality',
    aspectRatio: '4:3',
    alt: 'Modern East African healthcare supply counter and clean contemporary client reception lounge',
    caption: 'Healthcare, Hospitality & Public Services',
  },
};

export const ECONEX_HERO_SLIDES: EconexAssetEntry[] = [
  ECONEX_ASSET_MANIFEST.hero_commerce,
  ECONEX_ASSET_MANIFEST.finance_enterprise_hub,
  ECONEX_ASSET_MANIFEST.finance_corridor_border,
  ECONEX_ASSET_MANIFEST.retail_showroom,
  ECONEX_ASSET_MANIFEST.manufacturing_plant,
  ECONEX_ASSET_MANIFEST.tech_solar,
];

export function resolveSectorAsset(sectorCodeOrName?: string, categoryGroup?: string): EconexAssetEntry {
  const token = `${sectorCodeOrName || ''} ${categoryGroup || ''}`.toUpperCase();

  if (/MOMO|MOBILE_MONEY|AGENT|LIQUIDITY|CASH_IN|CASH_OUT/.test(token)) return ECONEX_ASSET_MANIFEST.finance_mobile_money_agent;
  if (/TREASURY|RECONCIL|INVOICE|ACCOUNTING|FINANCE_OPS|DISPUTE/.test(token)) return ECONEX_ASSET_MANIFEST.finance_digital_treasury;
  if (/QR|WALLET|MERCHANT_PAY|CARD|POS/.test(token)) return ECONEX_ASSET_MANIFEST.finance_merchant_qr;
  if (/BORDER|CORRIDOR_PAY|REMITTANCE|FX|CURRENCY|CROSS_BORDER/.test(token)) return ECONEX_ASSET_MANIFEST.finance_corridor_border;
  if (/INTEROPERAB|FINANCIAL_NETWORK|ROUTING|REGULATORY/.test(token)) return ECONEX_ASSET_MANIFEST.finance_enterprise_hub;
  if (/COFFEE|COCOA|TEA/.test(token)) return ECONEX_ASSET_MANIFEST.agri_coffee;
  if (/MAIZE|GRAIN|CEREAL|LEGUME|PULSE|OILSEED/.test(token)) return ECONEX_ASSET_MANIFEST.agri_maize;
  if (/AGRI|CROP|HORTI|FRUIT|VEG|LIVESTOCK|FISHER|FOREST|DAIRY/.test(token)) return ECONEX_ASSET_MANIFEST.agri_produce;

  if (/MANUFACTUR|PROCESS|TEXTILE|GARMENT|FACTORY|AGRO_PROCESS|PACKAGING|CHEMICAL/.test(token)) {
    return ECONEX_ASSET_MANIFEST.manufacturing_plant;
  }
  if (/CONSTRUCT|REAL_ESTATE|ENGINEER|INFRASTRUCT|MINING|QUARRY|PROPERTY/.test(token)) {
    return ECONEX_ASSET_MANIFEST.construction_site;
  }
  if (/WAREHOUS|COLD_CHAIN|STORAGE|INVENTORY|FULFILL/.test(token)) {
    return ECONEX_ASSET_MANIFEST.logistics_warehouse;
  }
  if (/LOGISTIC|TRANSPORT|FREIGHT|COURIER|CORRIDOR|MARITIME|AVIATION/.test(token)) {
    return ECONEX_ASSET_MANIFEST.logistics_fleet;
  }
  if (/ICT|SOFTWARE|DIGITAL|TECH|TELECOM|SOLAR|ENERGY|RENEWABLE|UTILITIES|POWER/.test(token)) {
    return ECONEX_ASSET_MANIFEST.tech_solar;
  }
  if (/HEALTH|PHARMA|MEDICAL|CLINIC|HOSPITAL|TOURISM|HOTEL|FOOD_SERVICE|EDUCATION|PUBLIC/.test(token)) {
    return ECONEX_ASSET_MANIFEST.hospitality_health;
  }
  if (/RETAIL|WHOLESALE|TRADE|CONSUMER|CRAFT|ARTISAN_GOODS|IMPORT|EXPORT/.test(token)) {
    return ECONEX_ASSET_MANIFEST.retail_showroom;
  }
  if (/SERVICE|CONSULT|FINANC|LEGAL|ACCOUNT|COOP|WORK|PROFESSIONAL/.test(token)) {
    return ECONEX_ASSET_MANIFEST.services_office;
  }

  return ECONEX_ASSET_MANIFEST.hero_commerce;
}

export function resolveMarketplaceAsset(opts: {
  imageUrl?: string | null;
  title?: string;
  category?: string;
  sectorCode?: string;
  offerKind?: string;
}): EconexAssetEntry {
  const provided = String(opts.imageUrl || '').trim();
  const matchedByToken = resolveSectorAsset(
    `${opts.title || ''} ${opts.sectorCode || ''} ${opts.offerKind || ''}`,
    opts.category
  );

  // Use trusted local /assets/econex paths when supplied, otherwise fall back deterministically to the local sector image
  if (provided.startsWith('/assets/econex/')) {
    const known = Object.values(ECONEX_ASSET_MANIFEST).find((a) => a.path === provided);
    if (known) return known;
  }

  // Remap legacy Unsplash / broken URLs cleanly to verified local photography
  const hint = `${provided} ${opts.title || ''} ${opts.category || ''} ${opts.sectorCode || ''} ${opts.offerKind || ''}`.toUpperCase();
  if (/COFFEE|ARABICA|ROBUSTA/.test(hint)) return ECONEX_ASSET_MANIFEST.agri_coffee;
  if (/MAIZE|BEAN|GRAIN|SOY|SORGHUM|MILLET|CEREAL|SEED/.test(hint)) return ECONEX_ASSET_MANIFEST.agri_maize;
  if (/MATOOKE|BANANA|TOMATO|ONION|FRESH|FRUIT|VEGETABLE|CASSAVA|POTATO/.test(hint)) return ECONEX_ASSET_MANIFEST.agri_produce;

  return matchedByToken;
}
