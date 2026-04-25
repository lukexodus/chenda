#!/usr/bin/env node

/**
 * Fetch Product Images via DuckDuckGo Image Search
 *
 * Downloads one representative image per product type and writes a manifest
 * that seed.js uses to populate product_types.image_url.
 *
 * Sources:
 *   USDA   — seeds/products-list-unique.txt        (474 entries)
 *   Regional — seeds/regional-products-list.txt    (23 Philippines entries)
 *   Custom   — user-created at runtime; NOT pre-fetched (out of scope)
 *
 * Usage:
 *   node seeds/fetch-product-images.js                    # Dry run (USDA only)
 *   node seeds/fetch-product-images.js --regional         # Dry run (regional only)
 *   node seeds/fetch-product-images.js --all              # Dry run (USDA + regional)
 *   node seeds/fetch-product-images.js --download         # Download USDA images
 *   node seeds/fetch-product-images.js --download --all   # Download all catalog images
 *   node seeds/fetch-product-images.js --force            # Redownload existing files
 *   node seeds/fetch-product-images.js --limit 20         # First N entries only
 *
 * Output:
 *   public/images/products/<slug>.<ext>
 *   seeds/product-images-manifest.json
 *
 * Node v18+ required (built-in fetch). No extra npm packages needed.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Configuration ────────────────────────────────────────────────────────────

const CONFIG = {
  outputDir: path.join(__dirname, '..', 'chenda-frontend', 'public', 'images', 'products'),
  manifestPath: path.join(__dirname, 'product-images-manifest.json'),
  /** USDA product names (474 entries) */
  usda_listPath: path.join(__dirname, 'products-list-unique.txt'),
  /** Philippine regional product names (23 entries) */
  regional_listPath: path.join(__dirname, 'regional-products-list.txt'),

  /** ms to wait between DDG requests — stay polite */
  throttleMs: 1000,

  /** Max image download size: 3 MB.  Anything larger is skipped as probably not a real food photo. */
  maxImageBytes: 3 * 1024 * 1024,

  /** Image size hint appended to some URLs */
  preferredWidth: 640,

  /** Allowed image extensions to check for existing files */
  imageExtensions: ['.jpg', '.jpeg', '.webp', '.png', '.gif', '.avif'],
};

// ─── Terminal colors ──────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m',
  gray: '\x1b[90m', bold: '\x1b[1m',
};
const log = (m, col = 'reset') => console.log(`${c[col]}${m}${c.reset}`);
const ok = (m) => log(`  ✓ ${m}`, 'green');
const err = (m) => log(`  ✗ ${m}`, 'red');
const info = (m) => log(`  → ${m}`, 'cyan');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Check if an image for the given slug already exists.
 * Returns the relative path if found, otherwise null.
 */
async function findExistingImage(slug) {
  for (const ext of CONFIG.imageExtensions) {
    const filePath = path.join(CONFIG.outputDir, slug + ext);
    try {
      await fs.access(filePath);
      return `/images/products/${slug}${ext}`;
    } catch {
      // Continue to next extension
    }
  }
  return null;
}

/** Turn a product name into a URL/filesystem-safe slug. */
function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Build a food-specific DDG search query.
 * Regional entries get an extra "Philippines" hint to bias toward local photos.
 * @param {string} name
 * @param {'usda'|'regional'} source
 */
function buildQuery(name, source = 'usda') {
  const base = (
    name
      .toLowerCase()
      .replace(/\d+(\s*)(g|l|kg|ml|oz|lb|lbs)/gi, '') // strip amounts
      .replace(/[/\\]/g, ' ')                           // slash → space
      .replace(/[^a-z\s]/g, '')                         // remove special chars
      .replace(/\s+/g, ' ')
      .trim()
  );
  const suffix = source === 'regional'
    ? ' Philippines food isolated white background'
    : ' food isolated white background';
  return base + suffix;
}

// ─── DuckDuckGo image search ──────────────────────────────────────────────────

let _vqd = null; // cached session token

/**
 * Retrieve (and cache) the DuckDuckGo vqd session token.
 * DDG embeds it in the HTML of the homepage search results page.
 */
async function getDDGToken(query) {
  const res = await fetch(
    `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
    }
  );
  if (!res.ok) throw new Error(`DDG token fetch failed: HTTP ${res.status}`);
  const html = await res.text();
  const match = html.match(/vqd=["']?([^"'&\s]+)/);
  if (!match) throw new Error('vqd token not found in DDG page');
  return match[1];
}

/**
 * Search DDG Images and return an array of image URLs for the given query.
 * Returns up to 100 results per call.
 */
async function searchDDGImages(query) {
  // Always get a fresh token per query — DDG tokens are query-bound
  const vqd = await getDDGToken(query);

  const apiUrl =
    `https://duckduckgo.com/i.js` +
    `?q=${encodeURIComponent(query)}` +
    `&vqd=${encodeURIComponent(vqd)}` +
    `&f=,,,,,` +
    `&p=1`;

  const res = await fetch(apiUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Referer: 'https://duckduckgo.com/',
      Accept: 'application/json, text/javascript',
    },
  });

  if (!res.ok) throw new Error(`DDG images fetch failed: HTTP ${res.status}`);

  const data = await res.json();
  if (!data.results || data.results.length === 0) return [];

  // Return the `image` field (full-res) from each result
  return data.results.map((r) => r.image).filter(Boolean);
}

// ─── Image download ───────────────────────────────────────────────────────────

/**
 * Infer a file extension from a Content-Type header.
 * Falls back to .jpg for unknown image/* types.
 */
function extFromContentType(contentType) {
  if (!contentType) return '.jpg';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('gif')) return '.gif';
  if (contentType.includes('avif')) return '.avif';
  return '.jpg'; // jpeg, jfif, pjpeg, etc.
}

/**
 * Download an image URL.
 * Auto-detects the correct extension from Content-Type.
 * Returns { bytes, ext, finalPath } on success, throws on failure.
 */
async function downloadImage(imageUrl, destPathStem) {
  const res = await fetch(imageUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
    },
    redirect: 'follow',
  });

  if (!res.ok) throw new Error(`Image HTTP ${res.status}`);

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`Not an image (Content-Type: ${contentType})`);
  }

  const ext = extFromContentType(contentType);
  const dest = destPathStem + ext;
  const buffer = Buffer.from(await res.arrayBuffer());

  if (buffer.byteLength > CONFIG.maxImageBytes) {
    throw new Error(`Image too large (${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB)`);
  }
  if (buffer.byteLength < 1024) {
    throw new Error(`Image suspiciously small (${buffer.byteLength} bytes)`);
  }

  await fs.writeFile(dest, buffer);
  return { bytes: buffer.byteLength, ext, finalPath: dest };
}

// ─── Core: resolve one product ─────────────────────────────────────────────────

/**
 * Attempt to find and (optionally) download an image for `productName`.
 * Tries up to 3 candidate URLs from DDG before giving up.
 * @param {string} productName
 * @param {boolean} dryRun
 * @param {boolean} force
 * @param {'usda'|'regional'} source
 */
async function resolveProductImage(productName, dryRun, force, source = 'usda') {
  const query = buildQuery(productName, source);
  const slug = toSlug(productName);
  const destStem = path.join(CONFIG.outputDir, slug); // extension added by downloadImage

  // Check for existing file unless --force is used
  if (!force) {
    const existing = await findExistingImage(slug);
    if (existing) {
      return { ok: true, localPath: existing, skipped: true };
    }
  }

  let imageUrls;
  try {
    imageUrls = await searchDDGImages(query);
  } catch (e) {
    return { ok: false, reason: `DDG search error: ${e.message}` };
  }

  if (imageUrls.length === 0) {
    return { ok: false, reason: 'No results from DDG' };
  }

  if (dryRun) {
    // In dry-run mode just return the first candidate URL (ext unknown until download)
    const relPath = `/images/products/${slug}.jpg`; // placeholder — real ext resolved on download
    return { ok: true, imageUrl: imageUrls[0], localPath: relPath, query };
  }

  // Try up to 3 candidates
  for (let i = 0; i < Math.min(3, imageUrls.length); i++) {
    try {
      const { bytes, ext, finalPath } = await downloadImage(imageUrls[i], destStem);
      const relPath = `/images/products/${slug}${ext}`;
      return { ok: true, imageUrl: imageUrls[i], localPath: relPath, bytes, query };
    } catch (e) {
      // Try next candidate
    }
  }

  return { ok: false, reason: 'All download candidates failed' };
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--download');
  const force = args.includes('--force');
  const limitArg = args.indexOf('--limit');
  const limit = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : Infinity;

  if (args.includes('--help') || args.includes('-h')) {
    log('\n🖼️  Product Image Fetcher\n', 'blue');
    log('Usage:', 'cyan');
    log('  node seeds/fetch-product-images.js                    # Dry run (USDA only)');
    log('  node seeds/fetch-product-images.js --regional         # Dry run (regional only)');
    log('  node seeds/fetch-product-images.js --all              # Dry run (USDA + regional)');
    log('  node seeds/fetch-product-images.js --download         # Download USDA images');
    log('  node seeds/fetch-product-images.js --download --all   # Download all catalog images');
    log('  node seeds/fetch-product-images.js --force            # Redownload existing');
    log('  node seeds/fetch-product-images.js --limit 20         # First N entries only\n');
    log('Notes:', 'cyan');
    log('  Custom product types are created at runtime by sellers and cannot be pre-fetched.');
    log('  The manifest output is consumed by seed.js to populate product_types.image_url.\n');
    process.exit(0);
  }

  const includeUsda = !args.includes('--regional') || args.includes('--all');
  const includeRegional = args.includes('--regional') || args.includes('--all');

  // Load product names from the selected source(s)
  const products = [];
  if (includeUsda) {
    const raw = await fs.readFile(CONFIG.usda_listPath, 'utf-8');
    const names = raw.split('\n').map(p => p.trim()).filter(Boolean);
    names.forEach(name => products.push({ name, source: 'usda' }));
  }
  if (includeRegional) {
    const raw = await fs.readFile(CONFIG.regional_listPath, 'utf-8');
    const names = raw.split('\n').map(p => p.trim()).filter(Boolean);
    names.forEach(name => products.push({ name, source: 'regional' }));
  }

  const sourcesLabel = [
    includeUsda ? `USDA (${(await fs.readFile(CONFIG.usda_listPath, 'utf-8')).split('\n').filter(Boolean).length})` : null,
    includeRegional ? `Regional (${(await fs.readFile(CONFIG.regional_listPath, 'utf-8')).split('\n').filter(Boolean).length})` : null,
  ].filter(Boolean).join(' + ');

  const sliced = isFinite(limit) ? products.slice(0, limit) : products;

  log(`\n${c.bold}🖼️  Product Image Fetcher${c.reset}`, 'blue');
  log('━'.repeat(52), 'cyan');
  info(`Mode:    ${dryRun ? 'DRY RUN (no files saved)' : '⬇️  DOWNLOAD'}`);
  if (force) info(`Force:   Enabled (overwriting existing files)`);
  info(`Sources: ${sourcesLabel}`);
  info(`Limit:   ${isFinite(limit) ? `${limit}` : sliced.length} products`);
  info(`Throttle: ${CONFIG.throttleMs}ms between requests`);
  info(`Output:  ${path.relative(process.cwd(), CONFIG.outputDir)}`);
  log('');

  log(`📋 Loaded ${sliced.length} products\n`, 'blue');

  if (!dryRun) {
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    ok(`Output directory ready: ${path.relative(process.cwd(), CONFIG.outputDir)}\n`);
  }

  const manifest = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < sliced.length; i++) {
    const { name, source } = sliced[i];
    const pad = String(i + 1).padStart(3);

    process.stdout.write(
      `${c.gray}[${pad}/${sliced.length}]${c.reset} ${name.padEnd(40)} `
    );

    let result;
    try {
      result = await resolveProductImage(name, dryRun, force, source);
    } catch (e) {
      result = { ok: false, reason: e.message };
    }

    if (result.ok) {
      if (result.skipped) {
        process.stdout.write(`${c.cyan}✓ cached${c.reset}\n`);
      } else {
        const sizeInfo = result.bytes
          ? `${(result.bytes / 1024).toFixed(0)} KB`
          : result.imageUrl.slice(0, 40) + '…';
        process.stdout.write(`${c.green}✓${c.reset} ${c.gray}${sizeInfo}${c.reset}\n`);
      }
      successCount++;
      manifest.push({
        name,
        source,
        image: result.localPath,
        imageUrl: result.imageUrl || null,
        query: result.query || null,
        cached: !!result.skipped
      });
    } else {
      process.stdout.write(`${c.red}✗ ${result.reason}${c.reset}\n`);
      failCount++;
      manifest.push({ name, source, image: null, reason: result.reason });
    }

    if (i < sliced.length - 1) await sleep(CONFIG.throttleMs);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  const successRate = ((successCount / products.length) * 100).toFixed(1);

  log('\n' + '━'.repeat(52), 'cyan');
  log('\n📊 Results:', 'blue');
  ok(`${successCount} / ${products.length} products resolved`);
  if (failCount > 0) err(`${failCount} products could not be matched`);
  log(`\n   Success rate: ${successRate}%`, parseFloat(successRate) >= 80 ? 'green' : 'yellow');

  // Write manifest
  const out = {
    generatedAt: new Date().toISOString(),
    mode: dryRun ? 'dry-run' : 'download',
    source: 'DuckDuckGo Image Search',
    sources: { usda: includeUsda, regional: includeRegional },
    total: sliced.length,
    succeeded: successCount,
    failed: failCount,
    successRate: `${successRate}%`,
    outputDir: dryRun ? null : path.relative(process.cwd(), CONFIG.outputDir),
    products: manifest,
  };
  await fs.writeFile(CONFIG.manifestPath, JSON.stringify(out, null, 2), 'utf-8');
  log('');
  ok(`Manifest written → ${path.relative(process.cwd(), CONFIG.manifestPath)}`);

  if (dryRun) {
    log('\n💡 Dry run complete — no files downloaded.', 'yellow');
    log(
      '   If success rate looks good, run with --download:\n' +
      '   node seeds/fetch-product-images.js --download --all\n',
      'yellow'
    );
  } else {
    log('\n✅ Images saved to: public/images/products/', 'green');
    log(
      '   Next step: run seed.js — it will read the manifest and populate\n' +
      '   product_types.image_url automatically.\n',
      'cyan'
    );
  }

  // ── Feasibility verdict ───────────────────────────────────────────────────
  log('─'.repeat(52), 'gray');
  const rate = parseFloat(successRate);
  if (rate >= 70) {
    log(`\n🟢 FEASIBLE (${successRate}%) — Safe to integrate into seed pipeline.\n`, 'green');
  } else if (rate >= 40) {
    log(`\n🟡 PARTIALLY FEASIBLE (${successRate}%) — Works but may need fallback images.\n`, 'yellow');
  } else {
    log(`\n🔴 NOT FEASIBLE (${successRate}%) — Consider manual curation or an official API.\n`, 'red');
  }
}

main().catch((e) => {
  err(`Fatal: ${e.message}`);
  console.error(e);
  process.exit(1);
});
