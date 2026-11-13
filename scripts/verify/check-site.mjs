#!/usr/bin/env node
/**
 * Checks the built site: every page exists, and every asset every page references
 * is really there.
 *
 *   node scripts/build/site.mjs && python -m zensical build -f course-site.yml
 *   node scripts/verify/check-site.mjs
 *
 * The card a share shows is checked here too: og:image is an absolute URL on
 * the published site, so it is the one reference that cannot be followed by a
 * browser looking at a local build, and a missing card is invisible until a
 * link is posted somewhere.
 *
 * It reads the generated HTML and resolves each reference against the built
 * output on disk, rather than rendering pages in a browser. A browser lazy-loads
 * images below the fold, so a DOM check reports whatever happened not to have
 * loaded yet; resolving on disk answers the question that actually matters, which
 * is whether the file a learner's browser will ask for exists.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { SITE_URL as CANONICAL_SITE_URL } from "../lib/urls.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const SITE = path.join(ROOT, "site");

if (!fs.existsSync(SITE)) {
  console.error("No site/ directory. Build it first:");
  console.error("  node scripts/build/site.mjs && python -m zensical build -f course-site.yml");
  process.exit(2);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

// The path the site is published under, from course-site.yml site_url
function sitePathPrefix() {
  try {
    const mkdocs = fs.readFileSync(path.join(ROOT, "course-site.yml"), "utf8");
    const match = mkdocs.match(/^site_url:\s*(\S+)/m);
    if (!match) {
      return "/";
    }
    const url = new URL(match[1]);
    return url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  } catch {
    return "/";
  }
}
const BASE_PATH = sitePathPrefix();

// The site is published under this, and og:image says so in full
const SITE_URL = (() => {
  const match = fs.readFileSync(path.join(ROOT, "course-site.yml"), "utf8").match(/^site_url:\s*(\S+)/m);
  return match ? match[1].replace(/\/$/, "") + "/" : null;
})();

const pages = walk(SITE);
const problems = [];

// course-site.yml and scripts/lib/urls.mjs each say where this site is published,
// one for the theme and one for the scripts. They move together or the site
// declares a canonical it is not served at, which is the kind of thing nobody
// notices until a search engine does.
if (SITE_URL !== `${CANONICAL_SITE_URL}/`) {
  problems.push(
    `course-site.yml site_url is ${SITE_URL || "missing"}, scripts/lib/urls.mjs SITE_URL is ${CANONICAL_SITE_URL}`
  );
}

// The publish step force-pushes an orphan branch, so the CNAME file it writes is
// the only thing that keeps the custom domain on the host. A cname that names
// another host, or none, takes the course off its address at the next push.
const publishedCname = (() => {
  const match = fs.readFileSync(path.join(ROOT, ".github", "workflows", "pages.yml"), "utf8").match(/^\s*cname:\s*(\S+)/m);
  return match ? match[1] : null;
})();
if (publishedCname !== new URL(CANONICAL_SITE_URL).host) {
  problems.push(
    `.github/workflows/pages.yml publishes cname ${publishedCname || "missing"}, scripts/lib/urls.mjs SITE_URL is ${CANONICAL_SITE_URL}`
  );
}
let references = 0;
let links_checked = 0;
let cards = 0;

for (const file of pages) {
  const html = fs.readFileSync(file, "utf8");
  const pageUrl = "/" + path.relative(SITE, file).replace(/\\/g, "/");
  const pageDir = path.dirname(file);

  // Every local asset the page asks for: images, stylesheets, scripts
  const refs = [
    ...[...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/<link[^>]+href="([^"]+\.css[^"]*)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/g)].map((m) => m[1])
  ];

  // Every page this page links to. A link out of labs/ carries one "../" too
  // many for the site, resolves fine on GitHub, and 404s for the reader.
  const links = [...html.matchAll(/<a[^>]+href="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((href) => !/^(https?:|mailto:|#)/.test(href));

  for (const ref of links) {
    const clean = ref.split("?")[0].split("#")[0];
    if (clean === "" || clean === ".") {
      continue;
    }
    links_checked++;
    const rooted = clean.startsWith("/") ? clean.replace(BASE_PATH, "/") : clean;
    const target = rooted.startsWith("/")
      ? path.join(SITE, rooted)
      : path.resolve(pageDir, rooted);
    // A directory link is the page inside it; anything else is the file itself
    const exists =
      fs.existsSync(target) &&
      (!fs.statSync(target).isDirectory() || fs.existsSync(path.join(target, "index.html")));
    if (!exists) {
      problems.push(`${pageUrl} -> ${ref} (link goes nowhere)`);
    }
  }

  // The card of this page: an absolute URL, which has to be on this site and
  // has to be a file that exists
  const card = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1];
  if (!card) {
    problems.push(`${pageUrl} declares no og:image, so a share of it shows no card`);
  } else if (SITE_URL && !card.startsWith(SITE_URL)) {
    problems.push(`${pageUrl} -> ${card} (og:image is not on this site)`);
  } else if (SITE_URL) {
    cards++;
    const file = path.join(SITE, card.slice(SITE_URL.length));
    if (!fs.existsSync(file)) {
      problems.push(`${pageUrl} -> ${card} (og:image, no such file)`);
    }
  }

  for (const ref of refs) {
    if (/^(https?:)?\/\//.test(ref) || ref.startsWith("data:")) {
      continue;
    }
    references++;
    // An absolute reference carries the site_url path prefix, which is right on
    // the published site and meaningless against the built folder. 404.html is
    // the page that uses them, because it has to work from any depth.
    const clean = ref.split("?")[0].split("#")[0];
    const rooted = clean.startsWith("/") ? clean.replace(BASE_PATH, "/") : clean;
    const target = rooted.startsWith("/")
      ? path.join(SITE, rooted)
      : path.resolve(pageDir, rooted);
    if (!fs.existsSync(target)) {
      problems.push(`${pageUrl} -> ${ref} (no such file)`);
    }
  }
}

// The badge records are read by other sites: the Trailhead Banner project asks
// one for a Trailblazer username and draws what it points at. Both pictures of
// each badge have to be there, the full one and the banner one.
let badgeImages = 0;
const recordsDir = path.join(SITE, "badges");
if (fs.existsSync(recordsDir) && SITE_URL) {
  for (const file of fs.readdirSync(recordsDir)) {
    if (!file.endsWith(".json")) {
      continue;
    }
    let record;
    try {
      record = JSON.parse(fs.readFileSync(path.join(recordsDir, file), "utf8"));
    } catch (error) {
      problems.push(`/badges/${file} is not readable JSON: ${error.message}`);
      continue;
    }
    for (const badge of record.badges || []) {
      for (const key of ["image", "bannerImage"]) {
        const url = badge[key];
        if (!url) {
          problems.push(`/badges/${file} level ${badge.level} has no ${key}`);
          continue;
        }
        if (!url.startsWith(SITE_URL)) {
          problems.push(`/badges/${file} -> ${url} (${key} is not on this site)`);
          continue;
        }
        badgeImages++;
        if (!fs.existsSync(path.join(SITE, url.slice(SITE_URL.length)))) {
          problems.push(`/badges/${file} -> ${url} (${key}, no such file)`);
        }
      }
    }
  }
}

// The statistics page is generated, like the badges, and is in the menu of every
// language: a build that skipped it leaves a menu entry that answers 404.
const labLocales = fs
  .readdirSync(path.join(ROOT, "labs"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^[a-z]{2}(-[A-Z]{2})?$/.test(entry.name))
  .map((entry) => entry.name);
for (const locale of labLocales) {
  const page = path.join(locale === "en" ? "" : locale, "stats", "index.html");
  if (!fs.existsSync(path.join(SITE, page))) {
    problems.push(`/${page.replace(/\\/g, "/")} (the statistics page of ${locale} was not built)`);
  }
  // The Hall of Fame is generated the same way, but stays out of the menu
  const hall = path.join(locale === "en" ? "" : locale, "hall-of-fame", "index.html");
  if (!fs.existsSync(path.join(SITE, hall))) {
    problems.push(`/${hall.replace(/\\/g, "/")} (the Hall of Fame page of ${locale} was not built)`);
  }
}

console.log(
  `${pages.length} page(s), ${references} local asset reference(s), ${links_checked} internal link(s), ${cards} share card(s), ${badgeImages} badge image(s) in records.`
);

if (problems.length > 0) {
  console.error(`\n${problems.length} reference(s) that go nowhere:`);
  problems.forEach((p) => console.error(`  ${p}`));
  process.exit(1);
}

console.log("Every page resolves every asset and every link it carries.");
