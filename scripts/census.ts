#!/usr/bin/env tsx
/**
 * Venezuelan Law MCP -- Census Script
 *
 * Scrapes venezuela.justia.com to enumerate ALL federal laws, codes, and decrees.
 * The official Asamblea Nacional portal (asambleanacional.gob.ve) returns 403,
 * so Justia is the primary source and the official portal is a best-effort secondary.
 *
 * Pipeline:
 *   1. Fetch /federales/leyes/   (314 federal laws, single page, no pagination)
 *   2. Fetch /federales/codigos/  (codes -- civil, penal, etc.)
 *   3. Fetch /federales/decretos/ (decree-laws)
 *   4. Optionally try asambleanacional.gob.ve as secondary (expect 403)
 *   5. Deduplicate and write data/census.json
 *
 * Sources:
 *   - Primary:   https://venezuela.justia.com/federales/leyes/
 *   - Secondary:  https://www.asambleanacional.gob.ve/leyes/vigentes (often 403)
 *
 * Usage:
 *   npx tsx scripts/census.ts
 *   npx tsx scripts/census.ts --limit 50
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const CENSUS_PATH = path.join(DATA_DIR, 'census.json');

const JUSTIA_BASE = 'https://venezuela.justia.com';
const ASAMBLEA_BASE = 'https://www.asambleanacional.gob.ve';

const USER_AGENT =
  'venezuelan-law-mcp/1.0 (https://github.com/Ansvar-Systems/Venezuelan-law-mcp; hello@ansvar.ai)';

const MIN_DELAY_MS = 500;

/* ---------- Types ---------- */

interface RawLawEntry {
  title: string;
  url: string;
  /** Extracted from URL path, e.g. "ley-organica-de-telecomunicaciones" */
  slug: string;
  /** Category: leyes, codigos, decretos, vigentes */
  category: string;
  /** Date string if found on the listing page */
  date: string;
  /** Which portal supplied this entry */
  source: 'justia' | 'asamblea';
}

/* ---------- HTTP Helpers ---------- */

let lastRequestTime = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

async function fetchPage(url: string): Promise<string> {
  await rateLimit();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html, */*',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

/* ---------- Parsing Helpers ---------- */

function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#209;/g, 'N').replace(/&#241;/g, 'n')
    .replace(/&#193;/g, 'A').replace(/&#225;/g, 'a')
    .replace(/&#201;/g, 'E').replace(/&#233;/g, 'e')
    .replace(/&#205;/g, 'I').replace(/&#237;/g, 'i')
    .replace(/&#211;/g, 'O').replace(/&#243;/g, 'o')
    .replace(/&#218;/g, 'U').replace(/&#250;/g, 'u')
    .replace(/&#252;/g, 'u').replace(/&#220;/g, 'U')
    .replace(/&aacute;/g, 'a').replace(/&eacute;/g, 'e')
    .replace(/&iacute;/g, 'i').replace(/&oacute;/g, 'o')
    .replace(/&uacute;/g, 'u').replace(/&ntilde;/g, 'n')
    .replace(/&Aacute;/g, 'A').replace(/&Eacute;/g, 'E')
    .replace(/&Iacute;/g, 'I').replace(/&Oacute;/g, 'O')
    .replace(/&Uacute;/g, 'U').replace(/&Ntilde;/g, 'N')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

function parseArgs(): { limit: number | null } {
  const args = process.argv.slice(2);
  let limit: number | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    }
  }

  return { limit };
}

/* ---------- Justia Parsing ---------- */

/**
 * Justia category pages list laws as anchor tags in this pattern:
 *   <a href="/federales/leyes/{slug}/gdoc/">{Title}</a>
 *   <a href="/federales/codigos/{slug}/">{Title}</a>
 *   <a href="/federales/decretos/{slug}/">{Title}</a>
 *
 * The /leyes/ page has ~314 entries on a single page (no pagination).
 * Each entry is a numbered list item with an anchor tag.
 */
function parseJustiaListingPage(
  html: string,
  sectionPath: string,
  category: string,
): RawLawEntry[] {
  const entries: RawLawEntry[] = [];
  const seen = new Set<string>();

  // Match anchor tags pointing to entries under the section path.
  // Pattern: <a href="/federales/leyes/{slug}/gdoc/">{Title}</a>
  //   or:    <a href="/federales/leyes/{slug}/">{Title}</a>
  //   or:    <a href="/federales/codigos/{slug}/">{Title}</a>
  // We capture the slug portion and the anchor text.
  const escapedPath = sectionPath.replace(/\//g, '\\/');
  const linkRe = new RegExp(
    `<a\\s[^>]*href=["'](${escapedPath}([^"'/]+)(?:\\/[^"']*)?)["'][^>]*>([\\s\\S]*?)<\\/a>`,
    'gi',
  );
  let match: RegExpExecArray | null;

  while ((match = linkRe.exec(html)) !== null) {
    const href = match[1];
    const slug = match[2];
    const rawTitle = stripTags(match[3]).trim();

    // Skip empty, very short, or navigation-only anchors
    if (!rawTitle || rawTitle.length < 5) continue;
    if (!slug || slug.length < 2) continue;

    // Skip duplicate slugs
    if (seen.has(slug)) continue;
    seen.add(slug);

    const title = decodeEntities(rawTitle);
    const url = `${JUSTIA_BASE}${href}`;

    entries.push({
      title,
      url,
      slug,
      category,
      date: '',
      source: 'justia',
    });
  }

  return entries;
}

/**
 * Fetch all three Justia category pages and combine results.
 */
async function censusFromJustia(limit: number | null): Promise<RawLawEntry[]> {
  const allEntries: RawLawEntry[] = [];

  const categories: Array<{ path: string; label: string; category: string }> = [
    { path: '/federales/leyes/', label: 'Federal Laws', category: 'leyes' },
    { path: '/federales/codigos/', label: 'Codes', category: 'codigos' },
    { path: '/federales/decretos/', label: 'Decree-Laws', category: 'decretos' },
  ];

  for (const { path: sectionPath, label, category } of categories) {
    const url = `${JUSTIA_BASE}${sectionPath}`;
    process.stdout.write(`  Fetching ${label} (${url})... `);

    try {
      const html = await fetchPage(url);
      const entries = parseJustiaListingPage(html, sectionPath, category);
      allEntries.push(...entries);
      console.log(`${entries.length} entries`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`FAILED: ${msg}`);
    }

    if (limit && allEntries.length >= limit) break;
  }

  return allEntries;
}

/* ---------- Asamblea Nacional (secondary, expect 403) ---------- */

/**
 * Attempt to scrape the official Asamblea Nacional portal.
 * This portal frequently returns 403 or times out.
 * Returns whatever entries we can get; caller should not depend on this.
 */
async function censusFromAsamblea(limit: number | null): Promise<RawLawEntry[]> {
  const entries: RawLawEntry[] = [];
  const seen = new Set<string>();
  const listingUrl = `${ASAMBLEA_BASE}/leyes/vigentes`;

  process.stdout.write(`  Fetching ${listingUrl}... `);

  let html: string;
  try {
    html = await fetchPage(listingUrl);
    console.log('OK');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`UNAVAILABLE: ${msg}`);
    return entries;
  }

  // Detect pagination: ?page=N
  let maxPage = 1;
  const pageRe = /[?&]page=(\d+)/g;
  let pageMatch: RegExpExecArray | null;
  while ((pageMatch = pageRe.exec(html)) !== null) {
    const num = parseInt(pageMatch[1], 10);
    if (num > maxPage) maxPage = num;
  }
  console.log(`  Detected ${maxPage} pages`);

  // Parse all pages (starting with the already-fetched page 1)
  const pages = [html];
  const effectiveMaxPage = limit ? Math.min(maxPage, Math.ceil(limit / 10)) : maxPage;

  for (let page = 2; page <= effectiveMaxPage; page++) {
    if (limit && entries.length >= limit) break;
    process.stdout.write(`  Page ${page}/${effectiveMaxPage}... `);
    try {
      const pageHtml = await fetchPage(`${listingUrl}?page=${page}`);
      pages.push(pageHtml);
      console.log('OK');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`FAILED: ${msg}`);
    }
  }

  // Extract law links from all fetched pages
  for (const pageHtml of pages) {
    const linkRe = /<a\s[^>]*href=["']([^"']*\/leyes\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = linkRe.exec(pageHtml)) !== null) {
      const rawHref = match[1];
      const rawTitle = stripTags(match[2]).trim();

      if (!rawTitle || rawTitle.length < 5) continue;
      if (/[?&]page=/.test(rawHref)) continue;
      if (/\/leyes\/(vigentes|sancionadas|proyectos)\/?$/i.test(rawHref)) continue;

      const url = rawHref.startsWith('http') ? rawHref : `${ASAMBLEA_BASE}${rawHref}`;
      const slugMatch = rawHref.match(/\/leyes\/(?:vigentes\/|sancionadas\/|proyectos\/)?(.+?)(?:\/|\?|$)/);
      const slug = slugMatch ? slugMatch[1].replace(/\/$/, '') : slugify(rawTitle);

      if (!slug || seen.has(slug)) continue;
      seen.add(slug);

      entries.push({
        title: decodeEntities(rawTitle),
        url,
        slug,
        category: 'vigentes',
        date: '',
        source: 'asamblea',
      });

      if (limit && entries.length >= limit) break;
    }
  }

  return entries;
}

/* ---------- Main ---------- */

async function main(): Promise<void> {
  const { limit } = parseArgs();

  console.log('Venezuelan Law MCP -- Census');
  console.log('============================\n');
  console.log('  Primary:   venezuela.justia.com/federales/leyes/ (+ codigos, decretos)');
  console.log('  Secondary: asambleanacional.gob.ve/leyes/vigentes (often 403)');
  if (limit) console.log(`  --limit ${limit}`);
  console.log('');

  fs.mkdirSync(DATA_DIR, { recursive: true });

  // Step 1: Primary source -- Justia (reliable, 314+ laws on single pages)
  console.log('[1/2] Justia (primary)\n');
  let allEntries = await censusFromJustia(limit);
  console.log(`\n  Justia total: ${allEntries.length} entries\n`);

  // Step 2: Secondary source -- Asamblea Nacional (expect 403, do not fail)
  console.log('[2/2] Asamblea Nacional (secondary)\n');
  const asambleaEntries = await censusFromAsamblea(limit);

  if (asambleaEntries.length > 0) {
    // Merge, preferring Justia entries on slug collision
    const existingSlugs = new Set(allEntries.map(e => e.slug));
    let added = 0;
    for (const entry of asambleaEntries) {
      if (!existingSlugs.has(entry.slug)) {
        allEntries.push(entry);
        existingSlugs.add(entry.slug);
        added++;
      }
    }
    console.log(`  Merged ${added} additional entries from Asamblea Nacional`);
  } else {
    console.log('  No entries from Asamblea Nacional (expected if portal returns 403)');
  }

  // Deduplicate by slug (belt-and-suspenders -- in case of overlap within sources)
  const deduped = new Map<string, RawLawEntry>();
  for (const entry of allEntries) {
    const key = entry.slug || slugify(entry.title);
    if (!deduped.has(key)) {
      deduped.set(key, entry);
    }
  }
  allEntries = Array.from(deduped.values());

  // Apply limit
  if (limit && allEntries.length > limit) {
    allEntries = allEntries.slice(0, limit);
  }

  // Step 3: Build census entries
  const laws = allEntries.map((entry) => {
    const id = `ve-${entry.category}-${slugify(entry.title).substring(0, 50)}`;

    return {
      id,
      title: entry.title,
      identifier: entry.title,
      url: entry.url,
      status: 'in_force' as const,
      category: mapCategory(entry.category),
      classification: 'ingestable' as const,
      ingested: false,
      provision_count: 0,
      ingestion_date: null as string | null,
      issued_date: entry.date || '',
      portal_slug: entry.slug,
      source_portal: entry.source,
    };
  });

  const ingestable = laws.filter(l => l.classification === 'ingestable').length;
  const inaccessible = laws.filter(l => l.classification === 'inaccessible').length;

  const portalName = 'venezuela.justia.com';
  const census = {
    schema_version: '2.0',
    jurisdiction: 'VE',
    jurisdiction_name: 'Venezuela',
    portal: portalName,
    secondary_portal: 'asambleanacional.gob.ve',
    census_date: new Date().toISOString().split('T')[0],
    agent: 'venezuelan-law-mcp/census.ts',
    summary: {
      total_laws: laws.length,
      ingestable,
      ocr_needed: 0,
      inaccessible,
      excluded: 0,
      by_category: {
        leyes: laws.filter(l => l.source_portal === 'justia' && allEntries.find(e => e.slug === l.portal_slug)?.category === 'leyes').length,
        codigos: laws.filter(l => l.source_portal === 'justia' && allEntries.find(e => e.slug === l.portal_slug)?.category === 'codigos').length,
        decretos: laws.filter(l => l.source_portal === 'justia' && allEntries.find(e => e.slug === l.portal_slug)?.category === 'decretos').length,
        asamblea: laws.filter(l => l.source_portal === 'asamblea').length,
      },
    },
    laws,
  };

  fs.writeFileSync(CENSUS_PATH, JSON.stringify(census, null, 2));

  console.log('\n==================================================');
  console.log('CENSUS COMPLETE');
  console.log('==================================================');
  console.log(`  Primary portal:     ${portalName}`);
  console.log(`  Secondary portal:   asambleanacional.gob.ve (${asambleaEntries.length} entries)`);
  console.log(`  Total laws:         ${laws.length}`);
  console.log(`  Ingestable:         ${ingestable}`);
  console.log(`  Inaccessible:       ${inaccessible}`);
  console.log(`\n  Output: ${CENSUS_PATH}`);
}

/**
 * Map Justia categories to census law categories.
 */
function mapCategory(category: string): 'act' | 'code' | 'decree' {
  switch (category) {
    case 'codigos': return 'code';
    case 'decretos': return 'decree';
    default: return 'act';
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
