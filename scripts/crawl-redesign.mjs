#!/usr/bin/env node

/**
 * Universal Website Redesign Crawler & Asset Pipeline
 * Usage: node scripts/crawl-redesign.mjs <targetUrl>
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';

const targetUrlArg = process.argv[2] || 'https://dino-bruns.de';
const originUrl = new URL(targetUrlArg);
const baseUrl = originUrl.origin;

console.log(`[Crawler] Starting crawl on: ${targetUrlArg}`);

const visited = new Set();
const toVisit = [targetUrlArg];
const siteData = {};
const allImages = new Map();

function fetchText(urlStr) {
  return new Promise((resolve, reject) => {
    const client = urlStr.startsWith('https') ? https : http;
    client.get(urlStr, { rejectUnauthorized: false, headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, urlStr).href;
        return resolve(fetchText(redirectUrl));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function downloadBinary(urlStr, destPath) {
  return new Promise((resolve) => {
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 100) {
      return resolve({ success: true, cached: true });
    }
    const client = urlStr.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    client.get(urlStr, { rejectUnauthorized: false }, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve({ success: true })));
      } else {
        file.close();
        fs.unlink(destPath, () => {});
        resolve({ success: false, status: res.statusCode });
      }
    }).on('error', (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      resolve({ success: false, error: err.message });
    });
  });
}

async function run() {
  while (toVisit.length > 0) {
    const currentUrl = toVisit.shift();
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    try {
      const html = await fetchText(currentUrl);
      const pathname = new URL(currentUrl).pathname;
      const slug = pathname === '/' || pathname === '' ? 'index' : pathname.replace(/^\//, '').replace(/\.html$/, '').replace(/[^a-zA-Z0-9_-]/g, '-');

      // Extract title & headings
      const title = (html.match(/<title>(.*?)<\/title>/i) || [])[1] || '';
      const h1s = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gis)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
      const h2s = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gis)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
      const paragraphs = [...html.matchAll(/<p[^>]*>(.*?)<\/p>/gis)].map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(p => p.length > 20);

      // Extract links
      const links = [...html.matchAll(/<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["'][^>]*>/gis)];
      for (const lm of links) {
        const href = lm[1].split('#')[0].trim();
        if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:')) {
          try {
            const resolved = new URL(href, currentUrl).href;
            if (resolved.startsWith(baseUrl) && !visited.has(resolved) && !toVisit.includes(resolved)) {
              toVisit.push(resolved);
            }
          } catch (_) {}
        }
      }

      // Extract images
      const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gis)].map(m => {
        const src = m[1].trim();
        const alt = (m[0].match(/alt=["']([^"']*)["']/i) || [])[1] || '';
        return { src, alt };
      });

      const pageImgUrls = [];
      for (const img of imgs) {
        try {
          const resolvedImgUrl = new URL(img.src, currentUrl).href;
          pageImgUrls.push(resolvedImgUrl);
          if (!allImages.has(resolvedImgUrl)) {
            allImages.set(resolvedImgUrl, { slug, filename: path.basename(new URL(resolvedImgUrl).pathname) });
          }
        } catch (_) {}
      }

      siteData[slug] = {
        url: currentUrl,
        title: title.replace(/&nbsp;/g, ' '),
        h1s: h1s.map(h => h.replace(/&nbsp;/g, ' ')),
        h2s: h2s.map(h => h.replace(/&nbsp;/g, ' ')),
        paragraphs: paragraphs.map(p => p.replace(/&nbsp;/g, ' ')),
        images: pageImgUrls
      };

      console.log(`[Crawl] Page: ${slug} (${title.substring(0, 40)}...) -> ${pageImgUrls.length} images`);
    } catch (err) {
      console.error(`[Crawl Error] ${currentUrl}:`, err.message);
    }
  }

  // Save audit JSON
  fs.writeFileSync('site_audit.json', JSON.stringify(siteData, null, 2));
  console.log(`\n[Summary] Crawled ${Object.keys(siteData).length} pages. Found ${allImages.size} unique images.`);
}

run();
