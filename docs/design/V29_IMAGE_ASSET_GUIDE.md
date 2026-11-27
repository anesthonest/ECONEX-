# ECONEX V29.0 — Image & Visual Asset Guide

**Product:** ECONEX — Universal Economic Operating System  
**Attribution:** Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Directory Structure (`/public/assets/econex/`)

All UI imagery is stored locally under `/public/assets/econex/` and mirrored deterministically via `/src/config/econexAssetManifest.ts` so Vite serves static files cleanly without third-party hotlink failures or server bundle bloat:

| Directory & File | Aspect Ratio | Primary Sectors & Workflows Covered |
| :--- | :---: | :--- |
| `/assets/econex/hero/africa-commerce-hub.jpg` | `16:9` | Home dashboard hero, continental commerce overview |
| `/assets/econex/manufacturing/industrial-plant.jpg` | `4:3` | Manufacturing, Agro-Processing, Food & Beverage, Textiles |
| `/assets/econex/construction/civil-engineering.jpg` | `4:3` | Construction, Real Estate, Engineering, Mining & Quarrying |
| `/assets/econex/retail/wholesale-showroom.jpg` | `4:3` | Retail & Wholesale Trade, Consumer Goods, Artisan Crafts |
| `/assets/econex/services/business-advisory.jpg` | `4:3` | Professional Services, Advisory, Cooperatives, Workforce & Jobs |
| `/assets/econex/technology/solar-energy-tech.jpg` | `4:3` | Renewable Energy, Solar Microgrids, ICT, Software & Telecoms |
| `/assets/econex/hospitality/clinic-hospitality.jpg` | `4:3` | Healthcare Supplies, Pharmaceuticals, Hospitality, Education |
| `/assets/econex/logistics/freight-corridor.jpg` | `4:3` | Road Haulage, Cross-Border Corridors, Freight Operators |
| `/assets/econex/logistics/fulfillment-warehouse.jpg` | `4:3` | Warehousing, Cold-Chain Storage, Inventory & Dispatch |
| `/assets/econex/agriculture/coffee-harvest.jpg` | `4:3` | Coffee, Tea, Cocoa & Export Cash Crops |
| `/assets/econex/agriculture/maize-grain.jpg` | `4:3` | Grains, Cereals, Legumes & Oilseeds |
| `/assets/econex/agriculture/fresh-produce.jpg` | `4:3` | Fresh Produce, Horticulture, Dairy & Fisheries |

---

## 2. Manifest & Safe Rendering Architecture

1. **Central Manifest (`src/config/econexAssetManifest.ts`):**
   - Zero server-side `.jpg` ES imports (strictly static public string URLs).
   - `resolveSectorAsset(sectorCodeOrName, categoryGroup)` maps all 28+ ECONEX economic sectors cleanly to sector photography.
   - `resolveMarketplaceAsset(listing)` overrides broken or external URLs deterministically to verified local assets.
2. **Protected `<EconexImage />` Component (`src/components/ux/EconexImage.tsx`):**
   - `loading="lazy"` and `decoding="async"` for lightweight mobile loading.
   - `referrerPolicy="no-referrer"` on every `<img>`.
   - Automatic `Low-Data Mode` switch respecting user bandwidth preferences (`ExperienceContext.lowBandwidth`).
   - Built-in `onError` resilient fallback rendering a dark-gold branded panel instead of a broken image icon.
