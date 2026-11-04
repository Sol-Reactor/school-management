// UI review: visits every page as every demo role at phone / tablet / desktop
// widths in light and dark mode. Reports console errors, horizontal overflow and
// axe-core WCAG 2.1 AA violations, and saves screenshots.
//
//   node scripts/ui-review.mjs [--out dir] [--base http://localhost:5173] [--marketing]
//
// --marketing also writes the landing-page screenshots to public/screenshots/.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
};
const BASE = arg('base', 'http://localhost:5173');
const OUT = resolve(arg('out', 'ui-review'));
const MARKETING = process.argv.includes('--marketing');
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: 'phone', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const PAGES = {
  PUBLIC: ['/', '/login', '/register', '/no-such-page'],
  ADMIN: ['/dashboard', '/students', '/teachers', '/classes', '/attendance', '/grades', '/timetable', '/settings', '/profile'],
  TEACHER: ['/dashboard', '/classes', '/students', '/attendance', '/grades', '/timetable'],
  STUDENT: ['/dashboard', '/attendance', '/grades', '/timetable'],
  PARENT: ['/dashboard', '/attendance', '/grades', '/timetable'],
};

const issues = [];
const note = (kind, where, detail) => issues.push({ kind, where, detail });

let visited = 0;
const progress = (label) => {
  visited += 1;
  if (visited % 10 === 0) console.log(`  …${visited} pages (${label})`);
};

// Waits on the app's own loading signals. (Not 'networkidle': notification polling
// means the network is never idle for long on authenticated pages.)
const settle = async (page) => {
  await page
    .waitForFunction(
      () =>
        document.querySelector('#root')?.childElementCount > 0 &&
        !document.querySelector('.animate-shimmer, [aria-busy="true"]') &&
        !document.body.innerText.includes('Loading your workspace'),
      null,
      { timeout: 15000, polling: 200 }
    )
    .catch(() => {});
  await page.waitForTimeout(250);
};

/** Navigates and waits for content; records (instead of throwing on) a failed page. */
const visit = async (page, url, label) => {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await settle(page);
    return true;
  } catch (err) {
    note('navigation', label, err.message.split('\n')[0]);
    return false;
  }
};

const check = async (page, label, { axe }) => {
  try {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 1) note('overflow', label, `${overflow}px wider than viewport`);
    if (axe) {
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      for (const v of result.violations) {
        note('a11y', label, `${v.id} (${v.impact}): ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
      }
    }
  } catch (err) {
    note('check-failed', label, err.message.split('\n')[0]);
  }
  // Written after every page so a crash never loses findings.
  writeFileSync(join(OUT, 'report.json'), JSON.stringify(issues, null, 2));
};

/** Screenshot that records (instead of throwing on) a timeout, e.g. a slow web-font request. */
const shoot = async (page, label, options) => {
  try {
    await page.screenshot({ timeout: 30000, ...options });
  } catch (err) {
    note('screenshot', label, err.message.split('\n')[0]);
  }
};

const run = async () => {
  const browser = await chromium.launch({ channel: 'chromium' });

  for (const theme of ['light', 'dark']) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
        reducedMotion: 'reduce',
      });
      context.setDefaultTimeout(20000);
      context.setDefaultNavigationTimeout(30000);
      const page = await context.newPage();
      page.on('console', (m) => m.type() === 'error' && note('console', `${theme}/${vp.name} ${page.url()}`, m.text().slice(0, 200)));
      page.on('pageerror', (e) => note('pageerror', `${theme}/${vp.name} ${page.url()}`, e.message));
      // axe on desktop + phone in both themes; tablet is layout-only.
      const axe = vp.name !== 'tablet';

      for (const path of PAGES.PUBLIC) {
        const label = `${theme}/${vp.name}/public${path.replace(/\//g, '_') || '_home'}`;
        if (!(await visit(page, BASE + path, label))) continue;
        await check(page, label, { axe });
        await shoot(page, label, { path: join(OUT, `${label.replace(/\//g, '__')}.png`), fullPage: true });
        progress(label);
      }

      for (const role of ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']) {
        const res = await page.request.post(`${BASE}/api/auth/demo`, { data: { role } });
        if (!res.ok()) throw new Error(`Demo login failed for ${role}: ${res.status()}`);
        for (const path of PAGES[role]) {
          const label = `${theme}/${vp.name}/${role.toLowerCase()}${path.replace(/\//g, '_')}`;
          if (!(await visit(page, BASE + path, label))) continue;
          await check(page, label, { axe });
          progress(label);
          await shoot(page, label, { path: join(OUT, `${label.replace(/\//g, '__')}.png`), fullPage: vp.name !== 'desktop' || path === '/dashboard' });

          if (MARKETING && role === 'ADMIN' && path === '/dashboard' && vp.name === 'desktop') {
            mkdirSync('public/screenshots', { recursive: true });
            await shoot(page, label, { path: `public/screenshots/admin-dashboard-${theme}.png` });
          }
        }
      }
      await context.close();
    }
  }

  // Keyboard smoke test: skip link + focus is visible on the first tab stop.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.request.post(`${BASE}/api/auth/demo`, { data: { role: 'TEACHER' } });
  await visit(page, `${BASE}/dashboard`, 'keyboard/teacher_dashboard');
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => ({ text: document.activeElement?.textContent?.trim(), outline: getComputedStyle(document.activeElement).outlineStyle }));
  if (first.text !== 'Skip to main content') note('keyboard', 'teacher/dashboard', `first Tab stop is "${first.text}", expected the skip link`);
  if (first.outline === 'none') note('keyboard', 'teacher/dashboard', 'no visible focus outline on first Tab stop');
  await context.close();

  await browser.close();

  writeFileSync(join(OUT, 'report.json'), JSON.stringify(issues, null, 2));
  const byKind = issues.reduce((m, i) => ({ ...m, [i.kind]: (m[i.kind] ?? 0) + 1 }), {});
  console.log(`Screenshots in ${OUT}`);
  console.log('Issues:', Object.keys(byKind).length ? byKind : 'none');
  // De-duplicate the same message across themes/viewports for a readable summary.
  const unique = [...new Map(issues.map((i) => [`${i.kind}|${i.detail}`, i])).values()];
  for (const i of unique.slice(0, 60)) console.log(`- [${i.kind}] ${i.where}: ${i.detail}`);
  process.exitCode = issues.length ? 1 : 0;
};

run().catch((err) => {
  console.error(err);
  process.exitCode = 2;
});
