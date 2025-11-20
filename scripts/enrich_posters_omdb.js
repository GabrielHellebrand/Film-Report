#!/usr/bin/env node
/**
 * scripts/enrich_posters_omdb.js
 *
 * Usage:
 *   OMDB_API_KEY=your_omdb_key node scripts/enrich_posters_omdb.js
 *
 * Reads data/weekends.json (array of weekend objects with results[])
 * and writes data/weekends_with_posters_omdb.json with added fields per movie:
 *   imdb_id (string|null)
 *   poster_url (string|null)
 *
 * Requirements:
 *   npm install axios
 *
 * Notes:
 * - This script uses the OMDb API. You need an OMDb API key in OMDB_API_KEY env var.
 * - The script is polite (small delay) and writes intermediate files periodically.
 * - OMDb free-tier has usage limits — see omdbapi.com for details.
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const INPUT = path.resolve(__dirname, '..', 'data', 'weekends.json');
const OUTPUT = path.resolve(__dirname, '..', 'data', 'weekends_with_posters_omdb.json');
const OMDB_KEY = process.env.OMDB_API_KEY;
if (!OMDB_KEY) {
  console.error('Missing OMDB_API_KEY environment variable. Get one at http://www.omdbapi.com/');
  process.exit(1);
}

const DELAY_MS = 350; // be polite to OMDb
const WRITE_INTERVAL = 20; // write intermediate output every N weekends
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function normalizeTitle(t) {
  return (t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Try a search (s=) first, fallback to title lookup (t=). Return imdbID or null.
async function findImdbId(title, year) {
  const encodedTitle = encodeURIComponent(title);
  // First try search endpoint; include year if available
  try {
    let url = `http://www.omdbapi.com/?apikey=${OMDB_KEY}&s=${encodedTitle}&type=movie`;
    if (year) url += `&y=${year}`;
    const res = await axios.get(url, { timeout: 10000 });
    if (res.data && res.data.Response === 'True' && Array.isArray(res.data.Search) && res.data.Search.length > 0) {
      // Try to pick best match by normalized title and year
      const candidates = res.data.Search;
      const norm = normalizeTitle(title);
      for (const c of candidates) {
        if (normalizeTitle(c.Title) === norm) return c.imdbID;
      }
      // prefer same-year match
      if (year) {
        for (const c of candidates) {
          const cYear = (c.Year || '').slice(0,4);
          if (cYear === String(year)) return c.imdbID;
        }
      }
      // fallback: return first candidate
      return candidates[0].imdbID;
    }
  } catch (err) {
    // continue to fallback
  }

  // Fallback: try exact-title lookup (t=)
  try {
    let url2 = `http://www.omdbapi.com/?apikey=${OMDB_KEY}&t=${encodedTitle}`;
    if (year) url2 += `&y=${year}`;
    const r2 = await axios.get(url2, { timeout: 10000 });
    if (r2.data && r2.data.Response === 'True' && r2.data.imdbID) return r2.data.imdbID;
  } catch (err) {
    // fall through
  }

  return null;
}

async function fetchOmdbDetailsById(imdbID) {
  try {
    const url = `http://www.omdbapi.com/?apikey=${OMDB_KEY}&i=${encodeURIComponent(imdbID)}&plot=short`;
    const res = await axios.get(url, { timeout: 10000 });
    if (res.data && res.data.Response === 'True') return res.data;
  } catch (err) {
    // ignore
  }
  return null;
}

async function enrich() {
  if (!fs.existsSync(INPUT)) {
    console.error('Input file not found:', INPUT);
    process.exit(1);
  }
  const weekends = JSON.parse(fs.readFileSync(INPUT, 'utf8'));

  for (let wi = 0; wi < weekends.length; wi++) {
    const w = weekends[wi];
    if (!Array.isArray(w.results)) continue;
    const yearHint = (w.weekend ? new Date(w.weekend).getFullYear() : null);

    console.log(`Processing weekend ${wi+1}/${weekends.length}: ${w.weekend}`);

    for (let mi = 0; mi < w.results.length; mi++) {
      const m = w.results[mi];
      // Skip if already enriched
      if (m.imdb_id || m.poster_url) continue;

      const title = (m.title || '').replace(/\u2019/g, "'").trim();
      if (!title) {
        m.imdb_id = null;
        m.poster_url = null;
        continue;
      }

      // Try to extract year from title text (e.g., "Movie (1999)")
      let extractedYear = null;
      const ym = title.match(/\b(19\d{2}|20\d{2})\b/);
      if (ym) extractedYear = ym[1];

      const yearToUse = extractedYear || yearHint || null;

      try {
        const imdbID = await findImdbId(title, yearToUse);
        if (imdbID) {
          const details = await fetchOmdbDetailsById(imdbID);
          if (details && details.Response === 'True') {
            m.imdb_id = imdbID;
            m.omdb_title = details.Title || null;
            m.omdb_year = details.Year || null;
            m.poster_url = (details.Poster && details.Poster !== 'N/A') ? details.Poster : null;
            console.log(`  → ${title} => ${imdbID} ${m.poster_url ? '(poster)' : '(no poster)'}`);
          } else {
            m.imdb_id = imdbID;
            m.poster_url = null;
            console.log(`  → ${title} => ${imdbID} (no details)`);
          }
        } else {
          m.imdb_id = null;
          m.poster_url = null;
          console.log(`  → ${title} => no OMDb match`);
        }
      } catch (err) {
        console.error(`  ! error processing \