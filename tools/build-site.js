const fs = require('fs');
const path = require('path');
const REPO = path.join(__dirname, '..');

// ---- i18n: FR dictionary keyed by the exact English source string ----
const FR = JSON.parse(fs.readFileSync(path.join(REPO, 'i18n', 'fr.json'), 'utf8'));
const usedI18n = new Set();
const escAttr = (v) => v.replace(/&(?!(amp|lt|gt|quot|nbsp|#\d+);)/g, '&amp;').replace(/"/g, '&quot;');
// T(): wraps translatable markup; missing FR -> falls back to English + build warning
const T = (en) => {
  usedI18n.add(en);
  const fr = FR[en];
  if (!fr) return '<span data-i18n>' + en + '</span>';
  return '<span data-i18n data-fr="' + escAttr(fr) + '">' + en + '</span>';
};
// TA(): same for a single attribute (e.g. aria-label)
const TA = (attr, en) => {
  usedI18n.add(en);
  const fr = FR[en] || en;
  return attr + '="' + escAttr(en) + '" data-i18n-attr="' + attr + '" data-fr-attr="' + escAttr(fr) + '"';
};

// ---- brand mark extraction ----
const logoSvg = fs.readFileSync(require('path').join(__dirname, '..') + '/public/g-rilla-roar-logo.svg', 'utf8');
const grab = (a, b, name) => {
  const i = logoSvg.indexOf(a);
  if (i === -1) throw new Error('missing ' + name);
  const j = logoSvg.indexOf(b, i);
  return logoSvg.slice(i, j + b.length);
};
const logoFull = '<defs>' + grab('<radialGradient id="backgroundGradient"', '</radialGradient>', 'bgGrad') + grab('<linearGradient id="letterGradient"', '</linearGradient>', 'lGrad') + '</defs>' + grab('<g id="background">', '</g>', 'bg') + grab('<g id="letter-g">', '</g>', 'letter') + grab('<g id="gorilla-white">', '</g>', 'white') + grab('<g id="gorilla-details">', '</g>', 'detail');
const apeInner = grab('<g id="gorilla-white">', '</g>', 'white') + grab('<g id="gorilla-details">', '</g>', 'detail');
const uid = (str, p) => str.replace(/id="/g, 'id="' + p + '-').replace(/url\(#/g, 'url(#' + p + '-');
const logoInst = (p) => p === 'nav'
  ? '<img src="public/marks/png/g-rilla-roar-nav.png" alt="" width="548" height="552" decoding="async">'
  : '<img src="public/marks/png/g-rilla-roar-full.png" alt="" width="523" height="536" decoding="async">';
const apeInst = (p, cls) => '<svg class="' + cls + '" viewBox="191 234 692 784" aria-hidden="true">' + uid(apeInner, p) + '</svg>';
// hero plate expression frames, one pixel-identical G base so swapping them
// never jitters; spin speed picks the face (see spinLoop). The roar rests on
// top of the stack as the default (no-JS / reduced-motion / idle brand mark).
const SPIN_FRAMES = ['pleased', 'focus', 'strain', 'scowl', 'roar', 'laugh'];
const spinCard = SPIN_FRAMES.map((n, i) =>
  '<img' + (n === 'roar' ? ' class="on"' : '') + ' src="public/marks/spin/g-rilla-spin-' + i + '-' + n + '.png" alt="" width="523" height="536" decoding="async">').join('');

// ---- procedural gym textures (SVG data URIs) ----
const enc = (svg) => "url('data:image/svg+xml," + encodeURIComponent(svg).replace(/'/g, '%27') + "')";

// studded rubber mat (body background) — embossed round studs
const studMat = enc(`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34"><rect width="34" height="34" fill="#17181A"/><circle cx="17" cy="18" r="6.5" fill="#131416"/><circle cx="17" cy="16.6" r="6.5" fill="#1D1F22"/><circle cx="17" cy="17.2" r="5.4" fill="#191B1D"/></svg>`);

// EPDM rubber fleck (panel background) — large 216px tile so repetition isn't visible
let flecks = '';
let seed = 987654321;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const TILE = 216;
for (let i = 0; i < 380; i++) {
  const x = (rnd() * TILE).toFixed(1), y = (rnd() * TILE).toFixed(1);
  const w = (0.9 + rnd() * 2.6).toFixed(1), h = (0.7 + rnd() * 1.6).toFixed(1);
  const rot = Math.round(rnd() * 180);
  const roll = rnd();
  const c = roll < 0.13 ? '#3FA75C' : (roll < 0.30 ? '#33373B' : (roll < 0.62 ? '#2A2D31' : '#232629'));
  const o = (0.4 + rnd() * 0.6).toFixed(2);
  flecks += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="0.6" fill="${c}" opacity="${o}" transform="rotate(${rot} ${x} ${y})"/>`;
}
const fleckMat = enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}"><rect width="${TILE}" height="${TILE}" fill="#1C1E20"/>${flecks}</svg>`);

// strawberry skin — red base with staggered pale achene seeds in dimples
let seedsStraw = '';
const sPos = [[7,6],[21,13],[7,20],[21,27],[14,-1],[14,13],[0,13],[28,13],[14,27],[0,-1],[28,-1],[0,27],[28,27]];
sPos.forEach(([sx, sy], i) => {
  const tilt = (i % 3 - 1) * 14;
  seedsStraw += `<ellipse cx="${sx}" cy="${sy}" rx="2.6" ry="3.4" fill="#8E2A20" transform="rotate(${tilt} ${sx} ${sy})"/><ellipse cx="${sx}" cy="${sy - 0.4}" rx="1.5" ry="2.3" fill="#F2D488" transform="rotate(${tilt} ${sx} ${sy})"/>`;
});
const strawTex = enc(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><rect width="28" height="28" fill="#C23B30"/>${seedsStraw}</svg>`);

// watermelon rind — light green with dark jagged stripes
const melonTex = enc(`<svg xmlns="http://www.w3.org/2000/svg" width="44" height="30"><rect width="44" height="30" fill="#79B865"/><path d="M8,0 C10,5 6,9 9,15 C11,20 7,25 9,30 L15,30 C12,25 16,20 13,15 C11,9 15,5 13,0 Z" fill="#3E8B49"/><path d="M30,0 C32,5 28,9 31,15 C33,20 29,25 31,30 L37,30 C34,25 38,20 35,15 C33,9 37,5 35,0 Z" fill="#3E8B49"/><path d="M9.5,0 C11,4 8,9 10.5,15 C12,20 9,25 10.5,30 L12.5,30 C11,25 14,20 11.5,15 C9.5,9 13,4 11.5,0 Z" fill="#5AA455" opacity="0.7"/><path d="M31.5,0 C33,4 30,9 32.5,15 C34,20 31,25 32.5,30 L34.5,30 C33,25 36,20 33.5,15 C31.5,9 35,4 33.5,0 Z" fill="#5AA455" opacity="0.7"/></svg>`);

// diamond checker plate (flavor band edging)
const diamondPlate = enc(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><rect width="28" height="28" fill="#101112"/><g fill="none" stroke="#232527" stroke-width="3" stroke-linecap="round"><path d="M4,10 L10,4"/><path d="M18,24 L24,18"/></g><g fill="none" stroke="#1B1D1F" stroke-width="3" stroke-linecap="round"><path d="M18,10 L24,4"/><path d="M4,24 L10,18"/></g></svg>`);

// ---- content data (facts identical to content.md; no reviews) ----
const INGREDIENTS = [
  'Organic Kale', 'Organic Broccoli', 'Organic Spinach', 'Organic Beet Root', 'Organic Carrot',
  'Wild Blueberry', 'Elderberry', 'Organic Pomegranate', 'Goji Juice', 'Acai Berry',
  'Organic Guava', 'Organic Mango', 'Organic Spirulina', 'Organic Noni', 'Lemon Extract',
];
const FACTS = [
  ['Calories', '20', ''],
  ['Total Carbohydrate', '5 g', '2%'],
  ['Total Sugars', '3 g', '2%'],
  ['Added Sugars', '3 g', '6%'],
  ['Riboflavin', '0.8 mg', '62%'],
  ['Niacin', '1.4 mg NE', '9%'],
  ['Vitamin B6', '0.9 mg', '53%'],
  ['Folate', '50 mcg DFE', '53%'],
  ['Pantothenic Acid', '0.9 mg', '18%'],
  ['Sodium', '15 mg', '&lt;1%'],
  ['Organic Super Greens Blend', '170 mg', '&lt;1%*'],
];
const FAQS = [
  ['What makes Gorilla Greens different from other greens supplements?',
   "Unlike most super greens on the market, Gorilla Greens contains no adaptogens, astragalus, or ashwagandha — ingredients that can interfere with medications or come with hormonal question marks. We focus on 15 organic, real-food ingredients in a gummy you'll actually take every day."],
  ['Can I take these with my meds or the rest of my stack?',
   "That's exactly why we built the formula this way. We excluded adaptogens that can interfere with common medications, as well as herbs with limited long-term safety data — what's left is real food. As with any supplement, check with your doctor, especially if you take prescription medication. (And yes — the formula is clean enough that the rest of your household can steal them.)"],
  ['How should I take Gorilla Greens?',
   'Take two (2) gummies daily. With or without food, any time of day. Most guys pair them with a morning routine or pre-workout so they never miss a day — consistency is the whole game.'],
  ['What do they taste like?',
   'Strawberry-watermelon, and we spent months getting it right. No grassy aftertaste, no bracing yourself. A treat that happens to be good for you.'],
  ['How does the subscription work?',
   'Subscribe and every pouch is $33.99 — 38% off the $54.99 list price. We ship a fresh pouch every 30 days so you never run out. Pause, skip, or cancel anytime — no questions asked, no hoops.'],
  ['Is there a money-back guarantee?',
   "Absolutely. 30-day money-back guarantee: if you're not completely satisfied for any reason, contact us and we'll issue a full refund — no questions asked."],
  ['Are the ingredients really organic?',
   'Yes. Our Organic Super Greens Blend contains certified organic ingredients including kale, broccoli, spinach, beet root, carrot, spirulina, and more. The formula is also Non-GMO, vegan, and gluten-free.'],
];
const BADGES = ['Non-GMO', 'Vegan', 'Gluten-free', 'No adaptogens', 'FDA-registered facility', 'Made in USA'];
const OUTS = [
  ['Adaptogens', 'Can interfere with common medications. If it argues with your prescriptions, it stays out.'],
  ['Astragalus', 'May trigger autoimmune responses in some people. Not worth the risk.'],
  ['Ashwagandha', 'Can affect thyroid hormone levels, with potential liver concerns in long-term use.'],
  ['Mystery blends', "Concentrated herbal extracts with limited long-term research. If we can't explain it, we don't sell it."],
];
const INS = [
  ['15 organic superfoods', 'Kale, spinach, broccoli, elderberry, spirulina and more — food you can pronounce.'],
  ['Five B-vitamins in every serving', 'Riboflavin, niacin, B6, folate and pantothenic acid.'],
  ["A flavor you'll actually crave", 'Strawberry-watermelon, refined over months. Zero grass clippings.'],
  ['Clean credentials', 'Non-GMO, vegan, gluten-free, made in the USA.'],
];

let ringTicks = '';
for (let i = 0; i < 72; i++) {
  const a = i * 5 * Math.PI / 180;
  const r1 = 86, r2 = i % 18 === 0 ? 76 : 81;
  ringTicks += '<line x1="' + (100 + Math.cos(a) * r1).toFixed(1) + '" y1="' + (100 + Math.sin(a) * r1).toFixed(1) + '" x2="' + (100 + Math.cos(a) * r2).toFixed(1) + '" y2="' + (100 + Math.sin(a) * r2).toFixed(1) + '"/>';
}
let ringBolts = '';
for (let i = 0; i < 4; i++) {
  const a = (45 + i * 90) * Math.PI / 180;
  ringBolts += '<circle cx="' + (100 + Math.cos(a) * 62).toFixed(1) + '" cy="' + (100 + Math.sin(a) * 62).toFixed(1) + '" r="3.4"/>';
}
const plateRing = '<svg class="plate-ring" id="heroRing" viewBox="0 0 200 200"><g stroke="#3A3E42" stroke-width="2" stroke-linecap="round" opacity="0.9">' + ringTicks + '</g><g fill="#4A4F54">' + ringBolts + '</g></svg>';

const strawIcon = '<svg class="fico" viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M12 21.2 C7.2 18.4 4.6 14.4 4.6 10.9 C4.6 8.2 6.8 6.6 9 7 L15 7 C17.2 6.6 19.4 8.2 19.4 10.9 C19.4 14.4 16.8 18.4 12 21.2 Z" fill="#D6453A"/>' +
  '<g fill="#F5DFA0"><ellipse cx="9" cy="10.6" rx="0.75" ry="1.05"/><ellipse cx="15" cy="10.6" rx="0.75" ry="1.05"/><ellipse cx="12" cy="12.6" rx="0.75" ry="1.05"/><ellipse cx="9.6" cy="14.8" rx="0.75" ry="1.05"/><ellipse cx="14.4" cy="14.8" rx="0.75" ry="1.05"/><ellipse cx="12" cy="17" rx="0.75" ry="1.05"/></g>' +
  '<path d="M12 3.2 L12.8 5.4 L15.6 4.6 L14 6.7 L16.6 7.8 L13.4 8.2 L12 6.9 L10.6 8.2 L7.4 7.8 L10 6.7 L8.4 4.6 L11.2 5.4 Z" fill="#3FA75C"/>' +
'</svg>';
const melonIcon = '<svg class="fico" viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M1.5 8 A10.5 10.5 0 0 0 22.5 8 Z" fill="#3E8B49"/>' +
  '<path d="M2.6 8 A9.4 9.4 0 0 0 21.4 8 Z" fill="#BFE29B"/>' +
  '<path d="M3.6 8 A8.4 8.4 0 0 0 20.4 8 Z" fill="#E8563F"/>' +
  '<g fill="#22201E"><ellipse cx="8" cy="10.4" rx="0.8" ry="1.15" transform="rotate(18 8 10.4)"/><ellipse cx="12" cy="12.6" rx="0.8" ry="1.15"/><ellipse cx="16" cy="10.4" rx="0.8" ry="1.15" transform="rotate(-18 16 10.4)"/></g>' +
'</svg>';

// expression marks traced from public/g-rilla-green-grid.png
const MARKS_DIR = require('path').join(__dirname, '..') + '/public/marks/';
const mark = (name, cls) => '<img class="' + (cls || 'mico') + '" src="public/marks/png/g-rilla-' + name + '-head.png" alt="" aria-hidden="true" loading="lazy" decoding="async">';
const markSvg = (name, cls) => fs.readFileSync(MARKS_DIR + 'g-rilla-' + name + '-head.svg', 'utf8')
  .replace('<svg ', '<svg class="' + (cls || 'mico') + '" aria-hidden="true" ');

// pull-up animation frames (split from public/g-rilla-green-pullup-grid.svg)
const PU_FRAMES = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'pullup-frames.json'), 'utf8'));
const PU_K = 240 / Math.max(...PU_FRAMES.map(fr => fr.h));
const puImgs = PU_FRAMES.map((fr, i) => {
  const w = (fr.w * PU_K).toFixed(0), h = (fr.h * PU_K).toFixed(0);
  const img = (cls, style) => '<img class="' + cls + '"' + (style ? ' style="' + style + '"' : '') + ' src="public/marks/pullup/' + fr.file + '" width="' + w + '" height="' + h + '" alt="" loading="lazy" decoding="async">';
  const PAD = 5, CAP = 110;
  const lx0 = Math.max(0, fr.fl[0] - PAD), lx1 = Math.min(fr.fl[1], fr.fl[0] + CAP) + PAD;
  const rx0 = Math.max(fr.fr2[0], fr.fr2[1] - CAP) - PAD, rx1 = Math.min(fr.w, fr.fr2[1] + PAD);
  const botIn = ((fr.h - fr.bandB) * PU_K).toFixed(1);
  const clip = (x0, x1) => 'clip-path:inset(0 ' + ((fr.w - x1) * PU_K).toFixed(1) + 'px ' + botIn + 'px ' + (x0 * PU_K).toFixed(1) + 'px)';
  return '<span class="pu-slot' + (i === 0 ? ' on' : '') + '" style="width:' + w + 'px;height:' + h + 'px;left:calc(50% - ' + (fr.w * PU_K / 2).toFixed(1) + 'px)">' + img('pu-b') + img('pu-ch', clip(lx0, lx1)) + img('pu-ch', clip(rx0, rx1)) + '</span>';
}).join('');

const ingRows = INGREDIENTS.map((n, i) => `<li><span class="idx">${String(i + 1).padStart(2, '0')}</span>${T(n)}</li>`).join('');

// ---- site variants: the main US page and the Swiss-made client version ----
const flagSwiss = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="6" fill="#DA291C"/><rect x="13.2" y="6.5" width="5.6" height="19" fill="#fff"/><rect x="6.5" y="13.2" width="19" height="5.6" fill="#fff"/></svg>';
const flagUS = '<img src="public/flag-us.png" alt="" width="80" height="42" decoding="async">';
const swissPanel = `
  <section id="swiss" class="swissband">
    <div class="wrap">
      <div class="swiss-panel reveal">
        <div class="swiss-head">
          <span class="swiss-cross" aria-hidden="true"></span>
          <div>
            <p class="eyebrow" style="margin-bottom:6px">${T('Swiss made')}</p>
            <h2 style="margin-bottom:0">${T('Swiss precision. <span class="grn">Gorilla strength.</span>')}</h2>
          </div>
        </div>
        <p class="sub">${T("Gorilla Greens gummies are made in Switzerland, where supplement manufacturing runs on pharma-grade discipline. Precision isn't a buzzword here — it's the house rules.")}</p>
        <div class="steps" style="margin-top:26px">
          <div class="step"><h3>${T('Swiss GMP production')}</h3><p>${T('Produced in a GMP-certified Swiss facility under pharmaceutical-grade quality management.')}</p></div>
          <div class="step"><h3>${T('Batch-by-batch testing')}</h3><p>${T('Every production run is tested for purity and consistency before it ships.')}</p></div>
          <div class="step"><h3>${T('Traceable ingredients')}</h3><p>${T('Full traceability from raw ingredient to finished gummy — the Swiss way.')}</p></div>
        </div>
      </div>
    </div>
  </section>
`;
const VARIANTS = {
  us: {
    file: 'index.html',
    titleEn: 'Gorilla Greens — Super Greens Gummies Built for Men',
    titleFr: 'Gorilla Greens — Gommes aux super verts conçues pour les hommes',
    url: 'https://hmohyud.github.io/greengummies/',
    robots: '',
    badges: BADGES,
    ins: INS,
    metaLine: 'Non-GMO ·&nbsp;Vegan ·&nbsp;Gluten-free ·&nbsp;Made&nbsp;in&nbsp;USA',
    flagBtn: '<a class="ver-flag" href="swiss.html" ' + TA('aria-label', 'Swiss-made version') + '>' + flagSwiss + '</a>',
    legal1: 'Gorilla Greens Super Greens Gummies are manufactured in an FDA-registered facility, in compliance with FDA regulations and standards for dietary supplements. We maintain the highest quality and safety standards throughout our manufacturing process.',
    afterWhy: '\n  <div class="knurl" aria-hidden="true"></div>\n',
  },
  swiss: {
    file: 'swiss.html',
    titleEn: 'Gorilla Greens — Swiss-Made Super Greens Gummies',
    titleFr: 'Gorilla Greens — Gommes aux super verts fabriquées en Suisse',
    url: 'https://hmohyud.github.io/greengummies/swiss.html',
    robots: '<meta name="robots" content="noindex">\n',
    badges: ['Non-GMO', 'Vegan', 'Gluten-free', 'No adaptogens', 'GMP-certified facility', 'Swiss-made'],
    ins: INS.map(([t, d]) => t === 'Clean credentials' ? [t, 'Non-GMO, vegan, gluten-free, made in Switzerland.'] : [t, d]),
    metaLine: 'Non-GMO ·&nbsp;Vegan ·&nbsp;Gluten-free ·&nbsp;Swiss-made',
    flagBtn: '<a class="ver-flag" href="./" ' + TA('aria-label', 'US version') + '>' + flagUS + '</a>',
    legal1: 'Gorilla Greens Super Greens Gummies are made in Switzerland in a GMP-certified facility, in compliance with Swiss quality and safety standards for dietary supplements. We maintain the highest quality and safety standards throughout our manufacturing process.',
    afterWhy: swissPanel,
  },
};
let V = VARIANTS.us;

const renderPage = () => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${V.titleEn}</title>
${V.robots}<meta name="description" content="15 organic superfoods in two gummies a day. No adaptogens, no ashwagandha, no chalky shakes. Strength runs on greens.">
<meta property="og:type" content="website">
<meta property="og:url" content="${V.url}">
<meta property="og:image" content="https://hmohyud.github.io/greengummies/public/og-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://hmohyud.github.io/greengummies/public/og-card.png">
<link rel="canonical" href="${V.url}">
<!-- swap the absolute URLs above when a custom production domain lands -->
<meta property="og:title" content="${V.titleEn}">
<meta property="og:description" content="A 400-pound silverback builds its muscle on plants. 15 organic superfoods, two gummies, zero excuses.">
<link rel="icon" type="image/png" href="public/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root {
  --bg: #17181A;
  --bg-deep: #0E0F10;
  --panel: #1D1F21;
  --steel: #26282B;
  --steel-2: #34373B;
  --ink: #E8E9E6;
  --muted: #9AA39D;
  --dim: #8A948E;
  --green: #3FA75C;
  --green-deep: #2F8A4A;
  --green-ink: #0E1510;
  --melon: #C24B36;
  --tex-stud: ${studMat};
  --tex-fleck: ${fleckMat};
  --tex-diamond: ${diamondPlate};
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background-color: var(--bg);
  background-image: var(--tex-stud);
  color: var(--ink);
  font-family: Archivo, 'Segoe UI', system-ui, sans-serif;
  font-size: 17px;
  line-height: 1.62;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3, .disp { font-family: 'Archivo Black', Archivo, sans-serif; font-weight: 400; text-transform: uppercase; line-height: 0.98; letter-spacing: 0.005em; }
a { color: inherit; }
img, svg { display: block; max-width: 100%; }
.wrap { max-width: 1160px; margin: 0 auto; padding: 0 24px; }
section { padding: 92px 0; }
section[id] { scroll-margin-top: 90px; }
.eyebrow { color: var(--green); font-weight: 700; font-size: 12px; letter-spacing: 0.26em; text-transform: uppercase; margin-bottom: 20px; }
.eyebrow::before { content: '///'; letter-spacing: 0.05em; margin-right: 10px; color: var(--steel-2); }
.sub { color: var(--muted); max-width: 56ch; font-size: 17.5px; }
h2 { font-size: clamp(32px, 4.4vw, 54px); margin-bottom: 18px; max-width: 24ch; }
h2 .grn { color: var(--green); }
.center { text-align: center; }
.center h2, .center .sub { margin-left: auto; margin-right: auto; }
.knurl { height: 12px; border-top: 1px solid var(--steel); border-bottom: 1px solid var(--steel); background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 6px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 6px); }

/* buttons */
/* repeat-tappable controls: keep panning, drop the browser's double-tap zoom */
.btn, .lang-opt, .menu-btn, summary, .fchip { touch-action: manipulation; }
.btn { display: inline-block; background: var(--green); color: var(--green-ink); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; text-decoration: none; border: 0; border-radius: 6px; padding: 15px 28px; font-size: 14.5px; cursor: pointer; font-family: inherit; transition: background 0.15s ease, transform 0.15s ease; }
.btn:hover { background: #4CBF6C; transform: translateY(-1px); }
.btn.ghost { background: transparent; color: var(--ink); border: 2px solid var(--steel-2); }
.btn.ghost:hover { background: rgba(255,255,255,0.04); }
.lang-toggle { display: inline-flex; flex: none; border: 1px solid var(--steel-2); border-radius: 7px; overflow: hidden; }
.lang-opt { background: transparent; color: var(--dim); border: 0; padding: 8px 11px; font: inherit; font-weight: 700; font-size: 12.5px; letter-spacing: 0.06em; line-height: 1; cursor: pointer; transition: background 0.15s ease, color 0.15s ease; }
.lang-opt + .lang-opt { border-left: 1px solid var(--steel-2); }
.lang-opt:hover:not(.active) { color: var(--ink); }
.lang-opt.active { background: var(--green); color: var(--green-ink); cursor: default; }
.btn .arr { display: inline-block; margin-left: 9px; transition: transform 0.18s ease; }
.btn:hover .arr { transform: translateX(5px); }
a:focus-visible, button:focus-visible, summary:focus-visible { outline: 2px solid var(--green); outline-offset: 3px; border-radius: 4px; }

/* announce + nav */
.announce { background: var(--bg-deep); color: var(--dim); font-weight: 700; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; text-align: center; padding: 10px 16px; }
.announce b { color: var(--green); }
header.nav { position: sticky; top: 0; z-index: 50; background: rgba(23,24,26,0.92); backdrop-filter: blur(10px); border-bottom: 1px solid var(--steel); }
.navrow { display: flex; align-items: center; gap: 26px; padding: 14px 0; }
.brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
.tile { display: block; width: 44px; height: 44px; }
.tile svg, .tile img { width: 100%; height: 100%; display: block; object-fit: contain; }
.brand b { font-family: 'Archivo Black', sans-serif; font-weight: 400; font-size: 18px; letter-spacing: 0.04em; text-transform: uppercase; }
.navlinks { display: flex; gap: 24px; margin-left: auto; }
.navlinks a { text-decoration: none; color: var(--muted); font-weight: 600; font-size: 13.5px; text-transform: uppercase; letter-spacing: 0.08em; }
.navlinks a:hover { color: var(--ink); }
.nav-cta { padding: 11px 20px; font-size: 13px; }
.menu-btn { display: none; margin-left: auto; background: none; border: 1px solid var(--steel-2); color: var(--ink); border-radius: 8px; padding: 7px 12px; font-size: 17px; cursor: pointer; }
.navrow > .lang-toggle, .navrow > .menu-btn { margin-left: 0; }
html[lang="fr"] .navrow { gap: 18px; }
html[lang="fr"] .navlinks { gap: 16px; }
html[lang="fr"] .navlinks a { font-size: 13px; letter-spacing: 0.03em; }

/* hero */
.hero { padding: 72px 0 76px; }
.hero .wrap { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 44px; align-items: center; }
.hero h1 { font-size: clamp(46px, 6.6vw, 88px); margin-bottom: 26px; }
.hero h1 span:not([data-i18n]) { color: var(--green); }
.hero .sub { margin-bottom: 32px; }
.cta-row { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 26px; }
.meta-line { color: var(--dim); font-size: 13px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
.plate-zone { display: flex; justify-content: center; position: relative; }
/* friction heat: a rim that blooms red-orange as spin speed climbs (JS sets opacity) */
.plate-heat, .plate-heat-white, .plate-heat-core { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
  width: min(470px, 82vw); aspect-ratio: 1; border-radius: 50%; pointer-events: none; opacity: 0; will-change: opacity; }
.plate-heat { border: 2.5px solid rgba(255,96,42,0.85);
  box-shadow: 0 0 26px 7px rgba(255,72,24,0.5), 0 0 60px 18px rgba(255,50,10,0.22), inset 0 0 22px 4px rgba(255,64,20,0.45); }
/* sustained flat-out: the rim whitens and the heat seeps toward the centre */
.plate-heat-white { border: 2.5px solid rgba(255,246,232,0.95);
  box-shadow: 0 0 30px 9px rgba(255,240,215,0.55), inset 0 0 34px 10px rgba(255,236,205,0.5); }
.plate-heat-core { background: radial-gradient(circle,
  rgba(255,180,90,0) 38%, rgba(255,140,50,0.13) 62%, rgba(255,190,110,0.3) 84%, rgba(255,235,200,0.42) 100%); }
.plate { position: relative; overflow: hidden; width: min(470px, 82vw); aspect-ratio: 1; border-radius: 50%; background: #1D1F21; border: 1px solid #2A2D30;
  box-shadow: inset 0 0 0 26px #202225, inset 0 0 0 28px #17181A, inset 0 0 0 60px #1B1D1F, inset 0 0 0 62px #141517, 0 30px 60px rgba(0,0,0,0.5);
  cursor: grab; touch-action: none; -webkit-tap-highlight-color: transparent; }
.plate.dragging { cursor: grabbing; }
.plate .card { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 57%; aspect-ratio: 1; filter: drop-shadow(0 16px 30px rgba(0,0,0,0.5)); pointer-events: none; }
.plate .card svg, .plate .card img { width: 100%; height: 100%; object-fit: contain; display: block; }
.plate .card img { position: absolute; inset: 0; opacity: 0; }
.plate .card img.on { opacity: 1; }
.plate-ring { position: absolute; inset: 0; width: 100%; height: 100%; will-change: transform; pointer-events: none; }

/* stats */
.stats { border-top: 1px solid var(--steel); border-bottom: 1px solid var(--steel); background: rgba(14,15,16,0.55); }
.stats .wrap { display: grid; grid-template-columns: repeat(4, 1fr); }
.stat { padding: 24px 10px; text-align: center; border-left: 1px solid var(--steel); }
.stat:first-child { border-left: 0; }
.stat b { display: block; font-family: 'Archivo Black', sans-serif; font-weight: 400; font-size: 42px; color: var(--ink); }
.stat span { color: var(--dim); font-size: 11.5px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; }

/* badges */
.badgerow { padding: 24px 0; border-bottom: 1px solid var(--steel); }
.badgerow ul { list-style: none; display: flex; flex-wrap: wrap; gap: 10px 12px; justify-content: center; }
.badgerow li { color: var(--muted); font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; border: 1px solid var(--steel); border-radius: 999px; padding: 7px 16px; background: rgba(29,31,33,0.6); }

/* the cut */
.split { display: grid; grid-template-columns: 5fr 7fr; gap: 56px; align-items: start; }
.split .sticky { position: sticky; top: 120px; }
.quote { border-left: 3px solid var(--green); padding: 4px 0 4px 20px; margin-top: 40px; font-size: 19px; font-weight: 600; max-width: 44ch; }
.quote footer { color: var(--dim); font-size: 13.5px; font-weight: 500; margin-top: 8px; }
.inout { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.locker { background-color: var(--panel); background-image: var(--tex-fleck); border: 1px solid var(--steel); border-radius: 12px; padding: 26px 24px; }
.locker h3 { font-size: 15px; letter-spacing: 0.14em; padding-bottom: 14px; margin-bottom: 6px; border-bottom: 2px solid var(--green); color: var(--green); }
.locker.out h3 { color: #DC6650; border-color: var(--melon); }
.locker ul { list-style: none; }
.locker li { padding: 13px 0; border-bottom: 1px solid var(--steel); font-size: 14.5px; color: var(--muted); }
.locker li:last-child { border-bottom: 0; }
.locker li b { display: block; color: var(--ink); font-size: 15.5px; margin-bottom: 2px; letter-spacing: 0.02em; }
.locker.out li b::after { content: ' ✕'; color: var(--melon); font-weight: 700; }

/* protocol steps */
.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 48px; }
.step { background-color: var(--panel); background-image: var(--tex-fleck); border: 1px solid var(--steel); border-radius: 12px; padding: 26px 24px; }
.step .num { font-family: 'Archivo Black', sans-serif; font-size: 40px; color: var(--green); display: block; margin-bottom: 12px; }
.step .cat { display: block; font-size: 11.5px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--green); margin-bottom: 12px; }
.step h3 { font-size: 19px; margin-bottom: 10px; letter-spacing: 0.03em; }
.step p { color: var(--muted); font-size: 15px; }

/* bench press interactive */
.bench { border-top: 1px solid var(--steel); border-bottom: 1px solid var(--steel); background: rgba(14,15,16,0.45); }
.bench .wrap { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 48px; align-items: center; }
.rig-btn { display: block; width: 100%; background: none; border: 0; cursor: pointer; padding: 0; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
.rig-wrap { background-color: var(--panel); background-image: var(--tex-fleck); border: 1px solid var(--steel); border-radius: 14px; padding: 20px 20px 8px; position: relative; overflow: hidden; --rep-dur: 0.85s; }
.rig-l1 { --rep-dur: 0.95s; }
.rig-l2 { --rep-dur: 1.05s; }
.rig-l3 { --rep-dur: 1.15s; }
.load { opacity: 0; transition: transform 0.45s cubic-bezier(0.3, 1.45, 0.4, 1), opacity 0.2s; }
.plates-l .load { transform: translateX(-64px); }
.plates-r .load { transform: translateX(64px); }
.rig-l1 .load-1, .rig-l2 .load-2, .rig-l3 .load-3 { opacity: 1; transform: translateX(0); }
@keyframes plate-whip {
  0% { transform: translateY(0); animation-timing-function: cubic-bezier(0.55, 0, 0.75, 0.5); }
  38% { transform: translateY(4.5px); animation-timing-function: linear; }
  50% { transform: translateY(3.5px); animation-timing-function: cubic-bezier(0.2, 0.55, 0.25, 1); }
  86% { transform: translateY(-2.5px); }
  100% { transform: translateY(0); }
}
.rig-active .plates { animation: plate-whip var(--rep-dur) both; }
.pr-tag { position: absolute; top: 14px; right: 14px; width: 60px; height: 60px; border-radius: 50%; background: #2A2D30; box-shadow: inset 0 0 0 5px #232629, inset 0 0 0 6px #1A1C1E, 0 6px 14px rgba(0,0,0,0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0; z-index: 4; }
.pr-tag span { font-size: 9px; font-weight: 700; letter-spacing: 0.22em; color: var(--dim); }
.pr-tag b { font-family: 'Archivo Black', sans-serif; font-size: 17px; color: var(--green); line-height: 1; }
.mico svg, .mico { width: 100%; height: 100%; display: block; object-fit: contain; }
.bg-face { position: absolute; pointer-events: none; z-index: 0; }
.bg-face .mico { opacity: 0.09; }
.bf-card { width: 168px; height: 168px; right: -14px; bottom: -14px; }
.locker { position: relative; overflow: hidden; }
.locker > *:not(.bg-face), .step > *:not(.bg-face) { position: relative; z-index: 1; }
.step { position: relative; overflow: hidden; }
.bf-band { width: 9.8em; height: 9.8em; left: -4.6em; top: -3.6em; }
.cheat-head { position: relative; width: fit-content; max-width: 100%; margin: 0 auto 18px; font-size: clamp(13px, 4.6vw, 48px); }
.ch-body { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 0.24em; }
.ch-lines { display: flex; flex-direction: column; align-items: flex-end; gap: 0.12em; white-space: nowrap; }
.ch-word { font-size: 2.42em; line-height: 0.8; color: #D65A43; letter-spacing: 0.01em; }
.mood { top: -34px; left: -38px; width: 250px; height: 250px; }
.mico-slot { position: absolute; inset: 0; opacity: 0; transition: opacity 0.3s ease; }
.mico-slot.in { opacity: 0.11; }
.mood .mico { opacity: 1; }
.rig-btn { position: relative; z-index: 1; }
.ptc { position: absolute; pointer-events: none; z-index: 6; border-radius: 50%; }
.ptc.gummy { border-radius: 34%; box-shadow: inset 0 -1.5px 2px rgba(0,0,0,0.3), inset 0 1px 1.5px rgba(255,255,255,0.25); }
.ptc.chalk { filter: blur(0.4px); }
.ptc.spark { height: 2.6px !important; border-radius: 2px; box-shadow: 0 0 9px rgba(255,186,64,0.9), 0 0 3px rgba(255,240,190,0.9); }
/* phones: per-spark glow shadows and giant bloom blurs are GPU killers */
@media (pointer: coarse), (max-width: 700px) {
  .ptc.spark { box-shadow: none; }
  .plate-heat { box-shadow: 0 0 18px 5px rgba(255,72,24,0.5), inset 0 0 14px 3px rgba(255,64,20,0.45); }
  .plate-heat-white { box-shadow: 0 0 14px 4px rgba(255,240,215,0.5), inset 0 0 18px 6px rgba(255,236,205,0.45); }
}
@keyframes rep-press {
  0% { transform: translateY(0); animation-timing-function: cubic-bezier(0.55, 0, 0.75, 0.5); }
  38% { transform: translateY(52px); animation-timing-function: linear; }
  50% { transform: translateY(52px); animation-timing-function: cubic-bezier(0.2, 0.55, 0.25, 1); }
  100% { transform: translateY(0); }
}
.rig-active #barGroup { animation: rep-press var(--rep-dur) both; }
.rep-row { display: flex; align-items: baseline; gap: 18px; margin-top: 6px; padding: 0 6px 10px; position: relative; }
.rep-row b { font-family: 'Archivo Black', sans-serif; font-size: 52px; color: var(--green); min-width: 74px; }
.rep-row .lbl { color: var(--dim); font-weight: 700; letter-spacing: 0.2em; font-size: 12px; text-transform: uppercase; }
.rep-row .msg { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 14.5px; text-align: right; max-width: 30ch; }
.bench-hint { color: var(--dim); font-size: 13px; margin-top: 14px; }
kbd { border: 1px solid var(--steel-2); border-bottom-width: 2px; border-radius: 4px; padding: 1px 6px; font-size: 12px; color: var(--muted); font-family: inherit; }

/* flavor band */
.band { background: #12241A; color: var(--ink); border-top: 12px solid transparent; border-bottom: 12px solid transparent; border-image: var(--tex-diamond) 12 round; position: relative; overflow: hidden; }
.band .sub { color: #9FB6A3; }
.fchips { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 28px; }
.fchip { display: inline-flex; align-items: center; gap: 10px; border: 1px solid rgba(232,233,230,0.25); border-radius: 999px; padding: 8px 20px; font-size: 12.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
.fico { width: 19px; height: 19px; flex: none; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.35)); }
.fchip.strawb { border-color: rgba(194,59,48,0.55); }
.fchip.watermel { border-color: rgba(94,164,85,0.55); }

/* ingredients */
.facts-flex { display: grid; grid-template-columns: 7fr 5fr; gap: 52px; align-items: start; margin-top: 46px; }
.ing-list { list-style: none; columns: 2; column-gap: 40px; }
.ing-list li { padding: 11px 0; border-bottom: 1px solid var(--steel); font-size: 15.5px; font-weight: 500; break-inside: avoid; }
.ing-list .idx { font-family: 'Archivo Black', sans-serif; color: var(--green); margin-right: 13px; font-size: 13px; }
.also { color: var(--dim); font-size: 13.5px; margin-top: 20px; max-width: 64ch; }
.factlabel { background: #FFFFFF; color: #111; border-radius: 6px; padding: 22px 24px; font-family: Arial, Helvetica, sans-serif; box-shadow: 0 18px 44px rgba(0,0,0,0.5); }
.factlabel h3 { font-family: 'Arial Black', Arial, sans-serif; font-size: 25px; text-transform: none; letter-spacing: 0; border-bottom: 10px solid #111; padding-bottom: 6px; margin-bottom: 6px; }
.factlabel .serv { font-size: 13px; border-bottom: 4px solid #111; padding-bottom: 6px; margin-bottom: 4px; }
.factlabel table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.factlabel td { padding: 4px 0; border-top: 1px solid #999; }
.factlabel td:last-child { text-align: right; font-weight: bold; }
.factlabel .blend { font-size: 12px; border-top: 4px solid #111; padding-top: 6px; margin-top: 6px; }
.factlabel .dv { font-size: 11px; color: #333; margin-top: 6px; }
.vh { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* pricing */
.price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; max-width: 900px; margin: 48px auto 24px; }
.price-card { background-color: var(--panel); background-image: var(--tex-fleck); border: 1px solid var(--steel); border-radius: 14px; padding: 34px 32px; text-align: left; position: relative; }
.price-card.featured { border: 2px solid var(--green); box-shadow: 0 0 0 4px rgba(63,167,92,0.12), 0 24px 50px rgba(0,0,0,0.4); }
.flag { position: absolute; top: -13px; left: 28px; background: var(--green); color: var(--green-ink); font-weight: 700; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; border-radius: 4px; padding: 4px 12px; }
.flag.dim { background: var(--steel-2); color: var(--ink); }
.price-card h3 { font-size: 21px; letter-spacing: 0.03em; margin: 8px 0 4px; }
.price-card .pdesc { color: var(--dim); font-size: 14px; margin-bottom: 20px; }
.price { display: flex; align-items: baseline; gap: 12px; margin-bottom: 2px; }
.price .now { font-family: 'Archivo Black', sans-serif; font-size: 46px; }
.price .was { color: var(--dim); text-decoration: line-through; font-size: 17px; }
.per { color: var(--dim); font-size: 13.5px; margin-bottom: 16px; }
.savings { color: var(--green); font-weight: 700; font-size: 14px; margin-bottom: 18px; letter-spacing: 0.04em; }
.plist { list-style: none; margin: 0 0 26px; }
.plist li { padding: 6px 0 6px 26px; position: relative; font-size: 15px; color: var(--muted); }
.plist li::before { content: '＋'; position: absolute; left: 2px; color: var(--green); font-weight: 700; }
.trust-row { text-align: center; color: var(--dim); font-size: 14px; }

/* faq */
.faq-list { max-width: 800px; margin: 44px auto 0; border-top: 1px solid var(--steel); }
details { border-bottom: 1px solid var(--steel); }
summary { cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: baseline; gap: 18px; padding: 21px 4px; font-weight: 600; font-size: 16.5px; }
summary::-webkit-details-marker { display: none; }
summary::after { content: '+'; font-family: 'Archivo Black', sans-serif; font-size: 19px; color: var(--green); transition: transform 0.15s; flex: none; }
details[open] summary::after { transform: rotate(45deg); }
details .a { padding: 0 4px 22px; color: var(--muted); font-size: 15px; max-width: 68ch; }

/* final */
.final { background: var(--bg-deep); border-top: 1px solid var(--steel); text-align: center; position: relative; overflow: hidden; }
.final h2 { font-size: clamp(42px, 6vw, 78px); max-width: none; }
.final .sub { margin: 0 auto 32px; }
.guarantee { color: var(--dim); font-size: 13.5px; margin-top: 18px; letter-spacing: 0.06em; }
.pullup { position: absolute; right: 26px; bottom: -30px; width: 300px; height: 258px; opacity: 0.17; pointer-events: none; }
.pu-stage { position: absolute; top: 16px; left: 0; right: 0; height: 250px; }
.pu-slot { position: absolute; top: 0; opacity: 0; }
.pu-slot.on { opacity: 1; }
.pu-slot img { position: absolute; inset: 0; }
.pu-b { z-index: 1; }
.pu-ch { z-index: 3; }
.pu-bar { position: absolute; z-index: 2; top: 14px; left: -44px; right: -66px; height: 8px; border-radius: 4px;
  background: linear-gradient(#787E85, #4A4F55 55%, #303439); box-shadow: 0 3px 7px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.5); }
.pu-bracket { position: absolute; left: -2px; top: -9px; width: 24px; height: 29px; background: #2A2D31; border-radius: 4px; box-shadow: inset 0 0 0 2px #43474C, 0 2px 5px rgba(0,0,0,0.45); }
.pu-post { position: absolute; left: -37px; top: 22px; width: 10px; height: 340px; border-radius: 3px; background: linear-gradient(90deg, #5A6066, #383C41); box-shadow: 2px 0 5px rgba(0,0,0,0.35); }
.final .wrap { position: relative; }

/* footer */
footer.site { background: var(--bg-deep); padding: 60px 0 42px; border-top: 1px solid var(--steel); }
.foot-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 32px; margin-bottom: 42px; }
.foot-brand .tile { width: 46px; height: 46px; border-radius: 9px; margin-bottom: 14px; }
.foot-brand p { color: var(--muted); font-size: 14px; max-width: 36ch; }
.foot-brand .dist { font-size: 12.5px; margin-top: 10px; color: var(--dim); }
footer.site h3 { font-size: 12.5px; letter-spacing: 0.18em; margin-bottom: 14px; color: var(--ink); }
footer.site ul { list-style: none; }
footer.site li { margin-bottom: 9px; }
footer.site ul a { color: var(--muted); text-decoration: none; font-size: 14px; }
footer.site ul a:hover { color: var(--ink); }
footer.site ul.plain li { color: var(--dim); font-size: 14px; }
.legal { border-top: 1px solid var(--steel); padding-top: 22px; color: var(--dim); font-size: 12px; line-height: 1.7; }
.legal p { margin-bottom: 10px; max-width: 100ch; }

/* swiss reliability panel (swiss.html variant) */
.swissband { border-top: 1px solid var(--steel); border-bottom: 1px solid var(--steel); background: rgba(14,15,16,0.45); }
.swiss-panel { background-color: var(--panel); background-image: var(--tex-fleck); border: 1px solid var(--steel); border-radius: 14px; padding: 40px 42px; position: relative; overflow: hidden; }
.swiss-head { display: flex; align-items: center; gap: 22px; margin-bottom: 14px; }
.swiss-cross { width: 56px; height: 56px; flex: none; border-radius: 12px; background: #DA291C; display: grid; place-items: center; box-shadow: 0 10px 24px rgba(0,0,0,0.45); }
.swiss-cross::before { content: ''; width: 32px; height: 32px;
  background: linear-gradient(#fff,#fff) center / 32px 10px no-repeat, linear-gradient(#fff,#fff) center / 10px 32px no-repeat; }
.swiss-panel .step { border: 1px solid var(--steel); }
@media (max-width: 700px) {
  .swiss-panel { padding: 26px 22px; }
  .swiss-head { align-items: flex-start; }
}

/* version flag toggle (bottom-right) */
.ver-flag { position: fixed; right: 18px; bottom: 18px; z-index: 90; width: 54px; height: 54px; display: grid; place-items: center; background: var(--panel); border: 1px solid var(--steel-2); border-radius: 14px; box-shadow: 0 12px 28px rgba(0,0,0,0.5); transition: transform 0.15s ease, border-color 0.15s ease; }
.ver-flag:hover { transform: translateY(-2px); border-color: #4A4E53; }
.ver-flag svg { width: 28px; height: 28px; display: block; }
.ver-flag img { width: 30px; height: auto; display: block; border-radius: 3px; box-shadow: 0 0 0 1px rgba(255,255,255,0.12); }
@media (max-width: 700px) { .ver-flag { right: 12px; bottom: 12px; width: 48px; height: 48px; } .ver-flag svg { width: 25px; height: 25px; } }

/* toast */
.toast[hidden] { display: none; }
.toast { position: fixed; bottom: 26px; left: 50%; transform: translateX(-50%); background: var(--ink); color: var(--bg-deep); border-radius: 8px; padding: 13px 24px; font-weight: 700; font-size: 14px; z-index: 100; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }

/* reveal */
.reveal { opacity: 0; transform: translateY(16px); transition: opacity 0.55s ease, transform 0.55s ease; }
.reveal.in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .reveal { transition: none !important; }
  .rig-active #barGroup { animation: none; }
  .rig-active .plates { animation: none; }
  .load { transition: none; }

}

/* responsive */
@media (max-width: 980px) {
  section { padding: 66px 0; }
  .hero .wrap { grid-template-columns: 1fr; gap: 40px; }
  .plate-zone { order: -1; }
  .split { grid-template-columns: 1fr; gap: 36px; }
  .split .sticky { position: static; }
  .steps { grid-template-columns: 1fr; }
  .bench .wrap { grid-template-columns: 1fr; gap: 34px; }
  .facts-flex { grid-template-columns: 1fr; gap: 40px; }
  .price-grid { grid-template-columns: 1fr; }
  .price-card .btn { display: block; width: 100%; text-align: center; }
  .stats .wrap { grid-template-columns: repeat(2, 1fr); }
  .stat { border-left: 0; border-top: 1px solid var(--steel); }
  .foot-grid { grid-template-columns: 1fr 1fr; }
  .final { padding-bottom: 340px; }
  .pullup { right: 50%; transform: translateX(50%); bottom: 26px; opacity: 0.16; }
  .pu-bar { left: calc(150px - 50vw); right: calc(150px - 50vw); }
  .pu-post, .pu-bracket { display: none; }
}
@media (max-width: 700px) {
  section { padding: 56px 0; }
  .inout { grid-template-columns: 1fr; }
  .cta-row .btn { flex: 1 1 100%; text-align: center; }
  .mood { width: 170px; height: 170px; top: -24px; left: -26px; }
  .pullup { width: 220px; }
  .pu-bar { left: calc(110px - 50vw); right: calc(110px - 50vw); }
  .foot-grid { gap: 26px 20px; }
  .foot-brand { grid-column: 1 / -1; }
}
@media (max-width: 560px) {
  .an-2 { display: none; }
  .brand b { font-size: 15px; white-space: nowrap; }
  .lang-opt { padding: 7px 9px; font-size: 11.5px; }
  .navrow { gap: 12px; }
}
@media (max-width: 1020px) {
  .navlinks { display: none; position: absolute; top: 100%; left: 0; right: 0; background: var(--bg-deep); border-bottom: 1px solid var(--steel); flex-direction: column; gap: 0; padding: 8px 24px 16px; }
  .navlinks a { padding: 12px 0; }
  .navlinks.open { display: flex; }
  .menu-btn { display: block; }
  .nav-cta { display: none; }
}
/* French labels are longer — collapse to the hamburger sooner so the bar never wraps */
@media (max-width: 1160px) {
  html[lang="fr"] .navlinks { display: none; position: absolute; top: 100%; left: 0; right: 0; background: var(--bg-deep); border-bottom: 1px solid var(--steel); flex-direction: column; gap: 0; padding: 8px 24px 16px; }
  html[lang="fr"] .navlinks a { padding: 12px 0; font-size: 13.5px; letter-spacing: 0.08em; }
  html[lang="fr"] .navlinks.open { display: flex; }
  html[lang="fr"] .menu-btn { display: block; }
  html[lang="fr"] .nav-cta { display: none; }
}
@media (max-width: 860px) {
  .ing-list { columns: 2; column-gap: 18px; }
  .ing-list li { padding: 8px 0; font-size: 13px; }
  .ing-list .idx { margin-right: 7px; font-size: 11px; }
  .rep-row .msg { position: static; transform: none; text-align: left; min-height: 2.9em; }
  .rep-row { flex-wrap: wrap; }
}
</style>
<noscript><style>.reveal { opacity: 1 !important; transform: none !important; } .bench { display: none; } .js-only { display: none !important; } .navlinks { display: flex !important; position: static !important; } .menu-btn { display: none !important; }</style></noscript>
</head>
<body>

<div class="announce">${T('Free shipping on every order')}<span class="an-2"> &nbsp;·&nbsp; <b>${T('Subscribe &amp; save 38%')}</b></span></div>

<header class="nav">
  <div class="wrap navrow">
    <a class="brand" href="#top" aria-label="Gorilla Greens home">
      <span class="tile">${logoInst('nav')}</span>
      <b>Gorilla Greens</b>
    </a>
    <nav class="navlinks" id="navlinks" aria-label="Main">
      <a href="#why">${T('Why us')}</a>
      <a href="#benefits">${T('The protocol')}</a>
      <a href="#ingredients">${T('Ingredients')}</a>
      <a href="#faq">${T('FAQ')}</a>
      <a href="#pricing">${T('Shop')}</a>
    </nav>
    <a class="btn nav-cta" href="#pricing">${T('Shop now')}</a>
    <div class="lang-toggle" id="langToggle" role="group" aria-label="Language / Langue">
      <button class="lang-opt active" type="button" data-lang="en" aria-pressed="true">EN</button>
      <button class="lang-opt" type="button" data-lang="fr" aria-pressed="false">FR</button>
    </div>
    <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="navlinks" aria-label="Menu">☰</button>
  </div>
</header>

<main id="top">
  <section class="hero">
    <div class="wrap">
      <div>
        <p class="eyebrow">${T('Super greens gummies · Built for men who train')}</p>
        <h1>${T('Strength runs on <span>greens.</span>')}</h1>
        <p class="sub">${T('A 400-pound silverback builds its muscle on plants. Gorilla Greens packs 15 organic superfoods into two gummies a day — no adaptogens, no astragalus, no ashwagandha. Nothing but fuel.')}</p>
        <div class="cta-row">
          <a class="btn" href="#pricing">${T('Get started — $33.99/mo')}<span class="arr" aria-hidden="true">→</span></a>
          <a class="btn ghost" href="#ingredients">${T("See what's inside")}</a>
        </div>
        <p class="meta-line">${T(V.metaLine)}</p>
      </div>
      <div class="plate-zone">
        <div class="plate" aria-hidden="true">
          ${plateRing}
          <div class="card">${spinCard}</div>
        </div>
        <div class="plate-heat" id="plateHeat" aria-hidden="true"></div>
        <div class="plate-heat-core" id="plateHeatCore" aria-hidden="true"></div>
        <div class="plate-heat-white" id="plateHeatWhite" aria-hidden="true"></div>
      </div>
    </div>
  </section>

  <div class="stats">
    <div class="wrap">
      <div class="stat"><b>60</b><span>${T('Gummies')}</span></div>
      <div class="stat"><b>30</b><span>${T('Day supply')}</span></div>
      <div class="stat"><b>15</b><span>${T('Superfoods')}</span></div>
      <div class="stat"><b>20</b><span>${T('Cal / serving')}</span></div>
    </div>
  </div>

  <div class="badgerow">
    <div class="wrap"><ul>${V.badges.map(b => `<li>${T(b)}</li>`).join('')}</ul></div>
  </div>

  <section id="why">
    <div class="wrap split">
      <div class="sticky reveal">
        <p class="eyebrow">${T('Why Gorilla Greens')}</p>
        <h2>${T("The strongest primate on Earth doesn't do powders.")}</h2>
        <p class="sub">${T('Most greens supplements are either a 40-ingredient mystery blend or a chalky shake you have to choke down. We took a different approach: 15 organic, real-food ingredients in a gummy — and a hard no to everything else.')}</p>
        <blockquote class="quote">${T('"If we wouldn\'t take it ourselves, we won\'t sell it to you."')}<footer>${T('— The Gorilla Greens team')}</footer></blockquote>
      </div>
      <div class="inout reveal">
        <div class="locker">
          <h3>${T('In the formula')}</h3><span class="bg-face bf-card">${mark('pleased')}</span>
          <ul>${V.ins.map(([t, d]) => `<li><b>${T(t)}</b>${T(d)}</li>`).join('')}</ul>
        </div>
        <div class="locker out">
          <h3>${T('Cut from the formula')}</h3><span class="bg-face bf-card">${mark('strain')}</span>
          <ul>${OUTS.map(([t, d]) => `<li><b>${T(t)}</b>${T(d)}</li>`).join('')}</ul>
        </div>
      </div>
    </div>
  </section>
${V.afterWhy}
  <section id="benefits">
    <div class="wrap">
      <p class="eyebrow reveal">${T('The protocol')}</p>
      <h2 class="reveal">${T('Two gummies. <span class="grn">That\'s the whole workout.</span>')}</h2>
      <div class="steps">
        <div class="step reveal"><span class="num">01</span><h3>${T('Take two gummies daily')}</h3><p>${T('With breakfast, with pre-workout, or on the way out the door. No shaker bottle, no cleanup, no excuses.')}</p></div>
        <div class="step reveal"><span class="num">02</span><h3>${T('15 superfoods go to work')}</h3><p>${T('Organic kale, spinach, broccoli, elderberry and more absorb into your system.')}</p></div>
        <div class="step reveal"><span class="num">03</span><h3>${T('Feel the difference')}</h3><p>${T('More energy in the gym, stronger immunity, and a gut that actually digests what you feed it.')}</p></div>
      </div>
      <div class="steps" style="margin-top:18px">
        <div class="step reveal"><span class="bg-face bf-card">${mark('stare')}</span><span class="cat">${T('Immune health')}</span><h3>${T('Defense, year-round')}</h3><p>${T("Elderberry, spinach, and vitamin-rich greens support your body's natural defenses all year round, so you can keep showing up.")}</p></div>
        <div class="step reveal"><span class="bg-face bf-card">${mark('calm')}</span><span class="cat">${T('Gut &amp; absorption')}</span><h3>${T('Digest what you eat')}</h3><p>${T('A healthy gut is the foundation of everything. Organic vegetables support digestive balance and nutrient absorption — food only counts if you absorb it.')}</p></div>
        <div class="step reveal"><span class="bg-face bf-card">${mark('grin')}</span><span class="cat">${T('All-day energy')}</span><h3>${T('No caffeine crash')}</h3><p>${T('B-vitamins and natural plant energy deliver sustained vitality from morning lift to evening wind-down.')}</p></div>
      </div>
    </div>
  </section>

  <section id="bench" class="bench">
    <div class="wrap">
      <div class="reveal">
        <p class="eyebrow">${T('Rep counter')}</p>
        <h2>${T('Earn your <span class="grn">gummies.</span>')}</h2>
        <p class="sub">${T("Two gummies a day is the easiest set you'll ever finish. Prove you've got it in you — rack up ten reps on the bar.")}</p>
        <p class="bench-hint">${T('Click the rig (or focus it and hit <kbd>Space</kbd>) to press.')}</p>
      </div>
      <div class="reveal">
        <div class="rig-wrap">
          <button class="rig-btn" id="rigBtn" type="button" ${TA('aria-label', 'Bench press — activate to complete one rep')}>
            <svg id="rigSvg" viewBox="0 0 560 330" aria-hidden="true">
              <!-- floor -->
              <rect x="10" y="306" width="540" height="4" rx="2" fill="#26282B"/>
              <!-- uprights -->
              <g fill="#2E3134">
                <rect x="148" y="86" width="13" height="222" rx="3"/>
                <rect x="399" y="86" width="13" height="222" rx="3"/>
                <rect x="128" y="300" width="53" height="8" rx="3"/>
                <rect x="379" y="300" width="53" height="8" rx="3"/>
              </g>
              <!-- j-hooks -->
              <g fill="#3A3E42">
                <path d="M148,128 h-14 v18 h8 v-10 h6 Z"/>
                <path d="M412,128 h14 v18 h-8 v-10 h-6 Z"/>
              </g>
              <!-- bench -->
              <g>
                <rect x="212" y="240" width="136" height="18" rx="6" fill="#2E3134"/>
                <rect x="222" y="258" width="10" height="48" fill="#26282B"/>
                <rect x="328" y="258" width="10" height="48" fill="#26282B"/>
              </g>
              <!-- barbell group (animates) -->
              <g id="barGroup">
                <!-- bar -->
                <rect x="42" y="118" width="476" height="7" rx="3.5" fill="#B9BEC2"/>
                <!-- knurl marks -->
                <g fill="#8F959A">
                  <rect x="196" y="118" width="34" height="7" opacity="0.5"/>
                  <rect x="330" y="118" width="34" height="7" opacity="0.5"/>
                </g>
                <!-- sleeves -->
                <rect x="42" y="113" width="76" height="17" rx="5" fill="#9AA0A5"/>
                <rect x="442" y="113" width="76" height="17" rx="5" fill="#9AA0A5"/>
                <!-- plates: left (loads added as you rep) -->
                <g class="plates plates-l">
                  <rect x="96" y="46" width="20" height="150" rx="8" fill="#3FA75C"/>
                  <g class="load load-1"><rect x="78" y="62" width="16" height="118" rx="7" fill="#2E3134"/></g>
                  <g class="load load-2"><rect x="63" y="78" width="13" height="86" rx="6" fill="#26292C"/></g>
                  <g class="load load-3"><rect x="51" y="90" width="10" height="62" rx="5" fill="#3FA75C"/></g>
                  <rect x="43" y="108" width="6" height="27" rx="3" fill="#5A6065"/>
                </g>
                <!-- plates: right -->
                <g class="plates plates-r">
                  <rect x="444" y="46" width="20" height="150" rx="8" fill="#3FA75C"/>
                  <g class="load load-1"><rect x="466" y="62" width="16" height="118" rx="7" fill="#2E3134"/></g>
                  <g class="load load-2"><rect x="484" y="78" width="13" height="86" rx="6" fill="#26292C"/></g>
                  <g class="load load-3"><rect x="499" y="90" width="10" height="62" rx="5" fill="#3FA75C"/></g>
                  <rect x="511" y="108" width="6" height="27" rx="3" fill="#5A6065"/>
                </g>
              </g>
            </svg>
          </button>
          <div class="mood bg-face" id="moodBox" aria-hidden="true">
${['calm','grimace','grin','stare','smirk','scowl','alert','strain','smug','pleased','focus','laugh','roar'].map(n => '            <span class="mico-slot' + (n === 'calm' ? ' in' : '') + '" data-mood="' + n + '">' + mark(n) + '</span>').join('\n')}
          </div>
          <div class="pr-tag" id="prTag" hidden><span>PR</span><b id="prVal">0</b></div>
          <div class="rep-row" aria-live="polite">
            <b id="repCount">0</b>
            <span class="lbl">${T('Reps')}</span>
            <span class="msg" id="repMsg">Bar's loaded. Get under it.</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="band">
    <div class="wrap center">
      <p class="eyebrow reveal" style="text-align:center">${T('Strawberry-watermelon')}</p>
      <h2 class="reveal cheat-head" ${TA('aria-label', 'Tastes like a cheat. Works like a cheat.')}>
        <span class="bg-face bf-band">${markSvg('smirk')}</span>
        <span class="ch-body" aria-hidden="true"><span class="ch-lines"><span>${T('Tastes like a')}</span><span>${T('Works like a')}</span></span><span class="ch-word">${T('Cheat')}</span></span>
      </h2>
      <p class="sub reveal" style="margin:0 auto">${T("Let's be honest — most greens supplements taste like lawn clippings. We spent months perfecting a strawberry-watermelon flavor you'll actually look forward to. No weird aftertaste. No holding your nose. Just a delicious gummy that happens to be packed with 15 organic superfoods.")}</p>
      <div class="fchips reveal">
        <span class="fchip strawb">${strawIcon}${T('Strawberry')}</span><span class="fchip watermel">${melonIcon}${T('Watermelon')}</span><span class="fchip">${T('Natural flavors only')}</span>
      </div>
    </div>
  </section>

  <section id="ingredients">
    <div class="wrap">
      <p class="eyebrow reveal">${T("What's inside")}</p>
      <h2 class="reveal">${T('15 organic superfoods. <span class="grn">Zero fine print.</span>')}</h2>
      <p class="sub reveal">${T('Real ingredients you can recognize and pronounce. No fillers, no artificial colors, no mysterious blends.')}</p>
      <div class="facts-flex">
        <div class="reveal">
          <ul class="ing-list">${ingRows}</ul>
          <p class="also">${T('<b>Also contains:</b> Tapioca Syrup, Sugar, Pectin, Citric Acid, Orange Juice Concentrate, Sodium Citrate, Natural Flavor (Strawberry, Watermelon), Palm Oil, Carnauba Wax, Color Added (Purple Carrot Juice Concentrate), Stevioside.')}</p>
        </div>
        <aside class="factlabel reveal" aria-label="Supplement facts">
          <h3>${T('Supplement Facts')}</h3>
          <p class="serv">${T('Serving Size: 2 Gummies &nbsp;|&nbsp; Servings Per Container: 30')}</p>
          <table>
            <caption class="vh">Supplement facts per 2-gummy serving</caption>
            <tr><th scope="col" class="vh">Amount per serving</th><th scope="col" class="vh">Percent daily value</th></tr>
            ${FACTS.map(([n, a, d]) => `<tr><td>${T(n)} &nbsp;<b>${a}</b></td><td>${d}</td></tr>`).join('')}
          </table>
          <p class="blend">${T('<b>*Organic Super Greens Blend contains:</b> Kale Leaf, Broccoli Stalk &amp; Flower, Beet Root, Guava Extract, Spinach Leaf, Lemon Extract, Carrot Root, Wild Blueberry, Mango Extract, Pomegranate Fruit, Goji Juice, Spirulina, Noni Fruit, Acai Berry, Elderberry')}</p>
          <p class="dv">${T('Percent Daily Values are based on a 2,000 calorie diet. *Daily Value not established.')}</p>
        </aside>
      </div>
    </div>
  </section>

  <div class="knurl" aria-hidden="true"></div>

  <section id="pricing" class="center">
    <div class="wrap">
      <p class="eyebrow reveal" style="text-align:center">${T('Membership rates')}</p>
      <h2 class="reveal" style="margin-left:auto;margin-right:auto">${T('Pick your plan. <span class="grn">Start today.</span>')}</h2>
      <div class="price-grid">
        <div class="price-card reveal">
          <span class="flag dim">${T('One-time · No commitment')}</span>
          <h3>${T('Single pouch')}</h3>
          <p class="pdesc">${T('Try it out, no strings attached.')}</p>
          <div class="price"><span class="now">$39.49</span><span class="was">$54.99</span></div>
          <p class="per">${T('60 gummies · ≈ $0.66 per gummy')}</p>
          <p class="savings">${T("Save 28% — that's $15.50 off")}</p>
          <ul class="plist">
            <li>${T('60 gummies (30-day supply)')}</li>
            <li>${T('Free shipping')}</li>
            <li>${T('30-day money-back guarantee')}</li>
          </ul>
          <button class="btn ghost" type="button" data-soon>${T('Add to cart')}</button>
        </div>
        <div class="price-card featured reveal">
          <span class="flag">${T('Subscribe &amp; save · Best value')}</span>
          <h3>${T('Monthly delivery')}</h3>
          <p class="pdesc">${T('A fresh pouch every 30 days. Cancel anytime.')}</p>
          <div class="price"><span class="now">$33.99</span><span class="was">$54.99</span></div>
          <p class="per">${T('60 gummies · ≈ $0.57 per gummy')}</p>
          <p class="savings">${T("Save 38% — that's $21.00 off, every month")}</p>
          <ul class="plist">
            <li>${T('60 gummies (30-day supply)')}</li>
            <li>${T('Free shipping, always')}</li>
            <li>${T('Pause, skip, or cancel anytime')}</li>
          </ul>
          <button class="btn" type="button" data-soon>${T('Subscribe &amp; save')}<span class="arr" aria-hidden="true">→</span></button>
        </div>
      </div>
      <p class="trust-row reveal">${T('Free shipping on all orders &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; 100% satisfaction guaranteed')}</p>
    </div>
  </section>

  <section id="faq" style="padding-top:60px">
    <div class="wrap">
      <p class="eyebrow reveal" style="text-align:center">${T('Straight answers')}</p>
      <h2 class="center reveal" style="margin-left:auto;margin-right:auto">${T('Questions, <span class="grn">answered.</span>')}</h2>
      <div class="faq-list">
        ${FAQS.map(([q, a]) => `<details class="reveal"><summary>${T(q)}</summary><div class="a">${T(a)}</div></details>`).join('')}
      </div>
    </div>
  </section>

  <section class="final">
    <div class="pullup" aria-hidden="true">
      <span class="pu-post"></span>
      <div class="pu-stage">
        ${puImgs}
        <span class="pu-bar"><span class="pu-bracket"></span></span>
      </div>
    </div>
    <div class="wrap">
      <h2 class="reveal">${T('Go full <span class="grn">silverback.</span>')}</h2>
      <p class="sub reveal">${T('15 organic superfoods. Two gummies a day. Zero excuses.')}</p>
      <a class="btn reveal" href="#pricing">${T('Subscribe &amp; save 38%')}<span class="arr" aria-hidden="true">→</span></a>
      <p class="guarantee reveal">${T('30-day money-back guarantee · Free shipping on all orders')}</p>
    </div>
  </section>
</main>

<footer class="site">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand">
        <span class="tile">${logoInst('foot')}</span>
        <p>${T('<b style="color:var(--ink)">GORILLA GREENS</b> — super greens gummies built for men who train. 15 organic ingredients, zero adaptogens, 100% delicious.')}</p>
        <p class="dist">${T('Distributed by Healthy Beauty for You')}</p>
      </div>
      <div>
        <h3>${T('Shop')}</h3>
        <ul><li><a href="#pricing">${T('Buy now')}</a></li><li><a href="#pricing">${T('Subscribe &amp; save')}</a></li><li><a href="#faq">${T('Contact')}</a></li></ul>
      </div>
      <div>
        <h3>${T('Learn')}</h3>
        <ul><li><a href="#why">${T('Our story')}</a></li><li><a href="#ingredients">${T('Ingredients')}</a></li><li><a href="#faq">${T('FAQ')}</a></li></ul>
      </div>
      <div>
        <h3>${T('Legal')}</h3>
        <ul class="plain"><li>${T('Privacy Policy')}</li><li>${T('Terms of Service')}</li><li>${T('Refund Policy')}</li><li>${T('Shipping Policy')}</li></ul>
      </div>
    </div>
    <div class="legal">
      <p>${T(V.legal1)}</p>
      <p>${T('These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.')}</p>
      <p>${T('© 2026 Gorilla Greens. All rights reserved.')}</p>
    </div>
  </div>
</footer>

${V.flagBtn}
<div class="toast" id="toast" role="status" hidden></div>
<script>
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var I18N = {
    title: { en: '${V.titleEn}', fr: '${V.titleFr}' },
    toast: { en: 'Checkout is coming soon — hang tight.', fr: 'Le paiement en ligne arrive bientôt — tenez bon.' },
    msgs: {
      en: ["Bar's loaded. Get under it.", 'Good depth. Keep moving.', 'Warm-up complete. Plate up.', 'Past halfway. Gummies in sight.', 'Set complete — two gummies earned. That IS the protocol.', 'Third plate. Now it means something.', "Still going? Respect. The gummies aren't going anywhere.", 'Silverback status. Go eat your greens.'],
      fr: ['La barre est chargée. Passez dessous.', 'Bonne profondeur. On continue.', 'Échauffement terminé. Chargez les plaques.', 'Plus de la moitié. Les gommes sont en vue.', "Série terminée — deux gommes méritées. C'EST ça, le protocole.", 'Troisième plaque. Là, ça veut dire quelque chose.', "Encore ? Respect. Les gommes ne s'enfuiront pas.", 'Statut de dos argenté. Allez manger vos verts.']
    }
  };
  var curLang = 'en';
  try { if (localStorage.getItem('gg-lang') === 'fr') curLang = 'fr'; } catch (e) {}

  var btn = document.getElementById('menuBtn');
  var links = document.getElementById('navlinks');
  btn.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { links.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  });

  var toast = document.getElementById('toast');
  var toastTimer = null;
  document.querySelectorAll('[data-soon]').forEach(function (b) {
    b.addEventListener('click', function () {
      clearTimeout(toastTimer);
      toast.textContent = I18N.toast[curLang];
      toast.hidden = false;
      toastTimer = setTimeout(function () { toast.hidden = true; toast.textContent = ''; }, 2600);
    });
  });

  // ---- particle engine (chalk + gummies) ----
  function spawn(host, x, y, o) {
    if (reduced) return;
    for (var i = 0; i < o.count; i++) {
      var p = document.createElement('span');
      p.className = 'ptc ' + (o.cls || '');
      var sz = o.size[0] + Math.random() * (o.size[1] - o.size[0]);
      p.style.width = sz + 'px';
      p.style.height = (o.cls === 'gummy' ? sz * 1.15 : sz) + 'px';
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      if (o.fixed) p.style.position = 'fixed';
      p.style.background = o.colors[(Math.random() * o.colors.length) | 0];
      host.appendChild(p);
      var ang = (o.angle - 90) + (Math.random() - 0.5) * o.spread;
      var rad = ang * Math.PI / 180;
      var dist = o.dist[0] + Math.random() * (o.dist[1] - o.dist[0]);
      var dx = Math.cos(rad) * dist, dy = Math.sin(rad) * dist;
      var fall = o.fall || 0;
      var rot = (Math.random() - 0.5) * (o.rot || 0);
      // align: lay the particle's long axis along its travel direction (sparks)
      var base = o.align ? ang : 0;
      // grow: end-scale for soft expanding puffs (chalk clouds)
      var g1 = o.grow ? 1 + (o.grow - 1) * 0.55 : 1;
      var g2 = o.grow || 1;
      var dur = o.dur[0] + Math.random() * (o.dur[1] - o.dur[0]);
      var anim = p.animate([
        { transform: 'translate(-50%,-50%) translate(0,0) rotate(' + base + 'deg) scale(1)', opacity: o.op },
        { transform: 'translate(-50%,-50%) translate(' + (dx * 0.7) + 'px,' + (dy * 0.7) + 'px) rotate(' + (base + rot * 0.6) + 'deg) scale(' + g1 + ')', opacity: o.op * 0.65, offset: 0.55 },
        { transform: 'translate(-50%,-50%) translate(' + dx + 'px,' + (dy + fall) + 'px) rotate(' + (base + rot) + 'deg) scale(' + g2 + ')', opacity: 0 }
      ], { duration: dur, easing: o.ease || 'cubic-bezier(0.25,0.6,0.35,1)' });
      anim.onfinish = (function (el) { return function () { el.remove(); }; })(p);
    }
  }
  var CHALK = ['rgba(216,220,216,0.55)', 'rgba(192,197,194,0.45)', 'rgba(232,234,231,0.4)'];
  var SPARK = ['#FFE28A', '#FFC65C', '#FFAD42', '#FFF6D0'];
  var GUMMY = ['#3FA75C', '#4CBF6C', '#2F8A4A', '#C24B36'];

  // ---- bench rig ----
  var rig = document.getElementById('rigBtn');
  var rigSvg = document.getElementById('rigSvg');
  var wrapEl = rig.closest('.rig-wrap');
  var countEl = document.getElementById('repCount');
  var msgEl = document.getElementById('repMsg');
  var prTag = document.getElementById('prTag');
  var prVal = document.getElementById('prVal');
  var reps = 0, busy = false, level = 0;
  var pr = 0;
  try { pr = parseInt(localStorage.getItem('gg-pr'), 10) || 0; } catch (e) {}
  if (pr > 0) { prVal.textContent = pr; prTag.hidden = false; }

  function rigPoint(vx, vy) {
    var sr = rigSvg.getBoundingClientRect();
    var wr = wrapEl.getBoundingClientRect();
    var k = sr.width / 560;
    return { x: sr.left - wr.left + vx * k, y: sr.top - wr.top + vy * k };
  }
  function lockoutChalk(big) {
    [106, 454].forEach(function (vx) {
      var pt = rigPoint(vx, 116);
      spawn(wrapEl, pt.x, pt.y, { cls: 'chalk', count: big ? 14 : 6, size: [2, 5], colors: CHALK, angle: 0, spread: 150, dist: [8, big ? 44 : 26], fall: 22, dur: [450, 850], op: 0.5 });
    });
  }
  function gummyBurst() {
    var pt = rigPoint(280, 108);
    spawn(wrapEl, pt.x, pt.y, { cls: 'gummy', count: 16, size: [5, 9], colors: GUMMY, angle: 0, spread: 130, dist: [40, 130], fall: 110, rot: 300, dur: [700, 1200], op: 0.95 });
  }
  function message(n) {
    var M = I18N.msgs[curLang];
    if (n === 0) return M[0];
    if (n < 5) return M[1];
    if (n === 5) return M[2];
    if (n < 10) return M[3];
    if (n === 10) return M[4];
    if (n === 15) return M[5];
    if (n < 20) return M[6];
    return M[7];
  }
  function rack() {
    reps++;
    countEl.textContent = reps;
    msgEl.textContent = message(reps);
    var lvl = Math.min(3, Math.floor(reps / 5));
    if (lvl > level) {
      level = lvl;
      wrapEl.classList.add('rig-l' + lvl);
      lockoutChalk(true);
    } else {
      lockoutChalk(false);
    }
    clearTimeout(moodTimer);
    if (reps % 10 === 0) gummyBurst();
    if (moodMap.flash && moodMap.flash.every > 0 && reps % moodMap.flash.every === 0) {
      setMood(moodMap.flash.face);
      moodTimer = setTimeout(function () { setMood(moodFor(reps)); }, 1500);
    } else {
      setMood(moodFor(reps));
    }
    if (reps > pr) {
      pr = reps;
      try { localStorage.setItem('gg-pr', String(pr)); } catch (e) {}
      prVal.textContent = pr;
      prTag.hidden = false;
    }
  }
  var moodBox = document.getElementById('moodBox');
  var moodTimer = null;
  function setMood(name) {
    [].forEach.call(moodBox.children, function (el) {
      el.classList.toggle('in', el.getAttribute('data-mood') === name);
    });
  }
  var MOOD_DEFAULT = { rest: 'calm', steps: [{ at: 1, face: 'smirk' }, { at: 3, face: 'smug' }, { at: 5, face: 'grin' }, { at: 10, face: 'grimace' }, { at: 15, face: 'roar' }], flash: { every: 0, face: 'grin' } };
  var moodMap = MOOD_DEFAULT;
  try {
    var mm = JSON.parse(localStorage.getItem('gg-mood-map') || 'null');
    if (mm && mm.rest && Array.isArray(mm.steps)) moodMap = mm;
  } catch (e) {}
  setMood(moodMap.rest);
  function moodFor(n) {
    var face = moodMap.rest;
    var st = moodMap.steps.slice().sort(function (a, b) { return a.at - b.at; });
    for (var i = 0; i < st.length; i++) if (n >= st[i].at) face = st[i].face;
    return face;
  }
  // nav brand: mouse hover loops the expressions; a touch tap plays one full
  // cycle (~2.4s) and settles back on the resting logo by itself
  (function () {
    var brand = document.querySelector('.brand');
    var brandImg = brand && brand.querySelector('.tile img');
    if (!brand || !brandImg) return;
    var REST = 'public/marks/png/g-rilla-roar-nav.png';
    var CYCLE = ['calm', 'pleased', 'smirk', 'smug', 'grin', 'laugh', 'alert', 'stare', 'focus', 'strain', 'grimace', 'scowl'].map(function (n) {
      return 'public/marks/png/g-rilla-' + n + '-full.png';
    });
    var cycleTimer = null, ci = 0, preloaded = false, oneShotActive = false;
    function preloadFrames() {
      if (preloaded) return;
      preloaded = true;
      CYCLE.forEach(function (src) { var im = new Image(); im.src = src; });
    }
    setTimeout(preloadFrames, 3500);
    function stopCycle() {
      clearInterval(cycleTimer);
      cycleTimer = null;
      oneShotActive = false;
      brandImg.src = REST;
    }
    function startCycle(oneShot) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      preloadFrames();
      clearInterval(cycleTimer);
      ci = 0;
      oneShotActive = oneShot;
      cycleTimer = setInterval(function () {
        if (oneShot && ci >= CYCLE.length) { stopCycle(); return; }
        brandImg.src = CYCLE[ci % CYCLE.length];
        ci++;
      }, 200);
    }
    if (window.PointerEvent) {
      brand.addEventListener('pointerenter', function (e) {
        startCycle(e.pointerType !== 'mouse');
      });
      brand.addEventListener('pointerleave', function () {
        // touch fires pointerleave right after the tap — let the one-shot finish
        if (oneShotActive) return;
        stopCycle();
      });
    } else {
      brand.addEventListener('mouseenter', function () { startCycle(false); });
      brand.addEventListener('mouseleave', stopCycle);
    }
  })();

  var barGroup = document.getElementById('barGroup');
  var repFallback = null;
  function finishRep() {
    if (!busy) return;
    busy = false;
    clearTimeout(repFallback);
    wrapEl.classList.remove('rig-active');
    rack();
  }
  barGroup.addEventListener('animationend', function (e) { if (e.animationName === 'rep-press') finishRep(); });
  rig.addEventListener('click', function () {
    if (busy) return;
    if (reduced) { rack(); return; }
    busy = true;
    wrapEl.classList.add('rig-active');
    repFallback = setTimeout(finishRep, 1700);
  });

  // ---- hero plate: idle torque + grab to spin; spin speed picks the face ----
  var ring = document.getElementById('heroRing');
  // the whole plate is the grab target — the logo card sits over the ring's centre
  var grip = ring && ring.closest('.plate');
  if (ring && grip) {
    var angle = 0, vel = reduced ? 0 : 0.05;
    var dragging = false, lastA = 0, lastT = 0;
    // the ladder rests on the roar brand mark, relaxes to pleased on a gentle
    // spin, works up through the effort faces, and flat-out he's loving it:
    //   rest(roar) -> pleased -> focus -> strain -> scowl -> laugh
    // FACE_UP thresholds are deg/frame@60fps, geometrically spaced to match
    // the exponential spin-down (vel decays with tau ~1.4s), so the wind-down
    // steps through faces at an even, settling pace. Drop-back happens below
    // threshold * 0.72 so a boundary speed never flaps between two faces.
    var faces = [].slice.call(grip.querySelectorAll('.card img'));
    // ladder config: baked default, overridable per-browser via spin-lab.html
    // (localStorage 'gg-spin-map' = { rest: name, ladder: [5 names] })
    var SPIN_NAMES = ${JSON.stringify(SPIN_FRAMES)};
    var spinCfg = { rest: 'roar', ladder: ['focus', 'scowl', 'laugh', 'strain', 'pleased'] };
    try {
      var spinSv = JSON.parse(localStorage.getItem('gg-spin-map') || 'null');
      if (spinSv && SPIN_NAMES.indexOf(spinSv.rest) >= 0 && Array.isArray(spinSv.ladder) &&
          spinSv.ladder.length === 5 && spinSv.ladder.every(function (n) { return SPIN_NAMES.indexOf(n) >= 0; })) {
        spinCfg = spinSv;
      }
    } catch (err) {}
    var FACE_SEQ = [SPIN_NAMES.indexOf(spinCfg.rest)].concat(spinCfg.ladder.map(function (n) { return SPIN_NAMES.indexOf(n); }));
    var FACE_UP = [0.5, 1.8, 3.8, 7.0, 11.0];
    var tier = 0, speedSm = 0;
    // markup rests on the roar img; move the .on if the config rests elsewhere
    if (faces.length > 1 && !faces[FACE_SEQ[0]].classList.contains('on')) {
      faces.forEach(function (f) { f.classList.remove('on'); });
      faces[FACE_SEQ[0]].classList.add('on');
    }
    function ptrAngle(e) {
      var r = grip.getBoundingClientRect();
      return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
    }
    // radial damp: grabs near the axle turn tiny finger moves into wild angle
    // jumps (worst on small phone plates) — scale deltas down inside 35% R
    function ptrDamp(e) {
      var r = grip.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      var rr = Math.sqrt(dx * dx + dy * dy) / (r.width / 2);
      return Math.min(1, rr / 0.35);
    }
    grip.addEventListener('pointerdown', function (e) {
      dragging = true;
      try { grip.setPointerCapture(e.pointerId); } catch (err) {}
      lastA = ptrAngle(e); lastT = performance.now();
      grip.classList.add('dragging');
      e.preventDefault();
    });
    grip.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      e.preventDefault();
      var a = ptrAngle(e);
      var d = a - lastA;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      d = Math.max(-30, Math.min(30, d * ptrDamp(e)));
      angle += d;
      var now = performance.now();
      // rolling velocity, not last-sample: a thumb decelerates just before it
      // lifts, which used to kill the flick on touch — the blend keeps the
      // recent motion so releases coast the way the gesture felt
      var instV = Math.max(-14, Math.min(14, d / Math.max(1, now - lastT) * 16.7));
      vel += (instV - vel) * 0.55;
      lastA = a; lastT = now;
      ring.style.transform = 'rotate(' + angle + 'deg)';
    });
    function endDrag() {
      dragging = false;
      grip.classList.remove('dragging');
      // finger parked before lifting: that is a hold-and-release, not a flick
      if (performance.now() - lastT > 140) vel *= 0.25;
    }
    grip.addEventListener('pointerup', endDrag);
    grip.addEventListener('pointercancel', endDrag);
    // vel is in deg per 60fps-frame; integrate against real dt so speed,
    // spin-down time and the face ladder feel the same on 60Hz and 144Hz
    var lastFrame = performance.now();
    var sparkAcc = 0, sparkZone = grip.parentElement;
    // phones start at a reduced spark budget; on ANY device the real measured
    // frame time scales the budget further, down to zero if frames crawl —
    // the wheel, faces and heat always take priority over the garnish
    var coarse = window.matchMedia('(pointer: coarse)').matches ||
                 (navigator.maxTouchPoints > 0 && window.innerWidth < 900);
    var frameAvg = 1;
    var heatEl = document.getElementById('plateHeat');
    var heatWhiteEl = document.getElementById('plateHeatWhite');
    var heatCoreEl = document.getElementById('plateHeatCore');
    var heatShown = 0, heatLevel = 0, whiteLevel = 0, whiteShown = 0;
    (function spinLoop() {
      var now = performance.now();
      var f = Math.min(100, now - lastFrame) / 16.7;
      lastFrame = now;
      if (!dragging) {
        angle += vel * f;
        vel += ((reduced ? 0 : 0.05) - vel) * Math.min(1, 0.012 * f);
        ring.style.transform = 'rotate(' + angle + 'deg)';
      } else if (now - lastT > 120) {
        vel *= Math.pow(0.9, f); // finger holding still mid-grab: bleed speed so the face relaxes
      }
      if (!reduced && faces.length > 1) {
        speedSm += (Math.abs(vel) - speedSm) * Math.min(1, 0.2 * f);
        var t = tier;
        while (t < FACE_UP.length && speedSm >= FACE_UP[t]) t++;
        while (t > 0 && speedSm < FACE_UP[t - 1] * 0.72) t--;
        if (t !== tier) {
          faces[FACE_SEQ[tier]].classList.remove('on');
          tier = t;
          faces[FACE_SEQ[tier]].classList.add('on');
        }
      }
      // friction heat with thermal inertia: the rim heats fast while the
      // wheel rips (quadratic ramp keeps it cold at low speed) but COOLS
      // slowly, so it keeps glowing for a few seconds after the spin dies.
      // Held near flat-out, a second stage builds: the rim whitens and the
      // glow seeps inward (~3s to full white); on cooldown the white recedes
      // first and the red ember lingers, like metal coming off temperature.
      if (heatEl && !reduced) {
        var target = Math.max(0, Math.min(1, (speedSm - 3) / 8.5));
        target = target * target;
        heatLevel += (target - heatLevel) * Math.min(1, (target > heatLevel ? 0.06 : 0.0016) * f);
        whiteLevel += ((target > 0.72 ? 1 : 0) - whiteLevel) * Math.min(1, (target > 0.72 ? 0.01 : 0.004) * f);
        if (Math.abs(heatLevel - heatShown) > 0.003 || Math.abs(whiteLevel - whiteShown) > 0.003) {
          heatShown = heatLevel;
          whiteShown = whiteLevel;
          heatEl.style.opacity = heatLevel.toFixed(3);
          heatWhiteEl.style.opacity = (whiteLevel * heatLevel).toFixed(3);
          heatCoreEl.style.opacity = (whiteLevel * heatLevel).toFixed(3);
        }
      }
      // sparks off the rim: none until the wheel is really working, a storm
      // flat-out; they fly tangent to the rim in the direction of spin
      frameAvg += (f - frameAvg) * 0.05;
      if (!reduced && speedSm > 4.2) {
        var budget = (coarse ? 0.4 : 1) * Math.max(0, Math.min(1, (2.6 - frameAvg) / 1.2));
        sparkAcc += (0.2 + Math.min(1, (speedSm - 4.2) / 7.3) * 2.2) * f * budget;
        var R = grip.offsetWidth / 2;
        while (sparkAcc >= 1) {
          sparkAcc--;
          var th = Math.random() * Math.PI * 2;
          var travel = th * 180 / Math.PI + (vel >= 0 ? 90 : -90);
          // hard tangential launch: long fast straight throw, fast-out easing
          // so the speed reads at the rim, streak shrinking as it slows.
          // A quarter of emissions sputter a tight 3-spark fan from one point.
          var burst = Math.random() < 0.25;
          spawn(sparkZone, grip.offsetLeft + R + Math.cos(th) * (R - 3),
                grip.offsetTop + R + Math.sin(th) * (R - 3),
                { cls: 'spark', count: burst ? 3 : 1, size: [12, 26], colors: SPARK, angle: travel + 90, align: true,
                  spread: burst ? 14 : 8, dist: [90, 190 + speedSm * 6], fall: 30, grow: 0.45,
                  dur: [380, 560], op: 1, ease: 'cubic-bezier(0.12,0.65,0.4,1)' });
        }
      }
      requestAnimationFrame(spinLoop);
    })();
  }

  // ---- pull-up gorilla: frame animation, runs only while in view ----
  var finalSec = document.querySelector('.final');
  var puFrames = [].slice.call(document.querySelectorAll('.pu-slot'));
  if (finalSec && puFrames.length && !reduced) {
    var fi = 0, fdir = 1, puHold = 0, puTimer = null;
    function puTick() {
      if (puHold > 0) { puHold--; return; }
      puFrames[fi].classList.remove('on');
      fi += fdir;
      if (fi >= puFrames.length - 1) { fi = puFrames.length - 1; fdir = -1; puHold = 5; }
      else if (fi <= 0) { fi = 0; fdir = 1; puHold = 3; }
      puFrames[fi].classList.add('on');
    }
    function puStart() { if (!puTimer) puTimer = setInterval(puTick, 110); }
    function puStop() { if (puTimer) { clearInterval(puTimer); puTimer = null; } }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) puStart(); else puStop(); });
      }, { threshold: 0.12 }).observe(finalSec);
    } else { puStart(); }
  }

  // ---- reveal ----
  var revealEls = [].slice.call(document.querySelectorAll('.reveal'));
  function show(el) { el.classList.add('in'); }
  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(show);
  } else {
    var ioAlive = false;
    var io = new IntersectionObserver(function (entries) {
      ioAlive = true;
      entries.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    function manualCheck() {
      if (ioAlive) { window.removeEventListener('scroll', manualCheck); return; }
      revealEls.forEach(function (el) {
        if (!el.classList.contains('in') && el.getBoundingClientRect().top < window.innerHeight) { show(el); }
      });
    }
    revealEls.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) { show(el); }
      else { io.observe(el); }
    });
    window.addEventListener('scroll', manualCheck, { passive: true });
  }

  // ---- language toggle (segmented EN | FR) ----
  var langOpts = [].slice.call(document.querySelectorAll('.lang-opt'));
  function applyLang(l) {
    curLang = l;
    try { localStorage.setItem('gg-lang', l); } catch (e) {}
    document.documentElement.lang = l;
    [].forEach.call(document.querySelectorAll('[data-i18n]'), function (el) {
      if (el.getAttribute('data-en') === null) el.setAttribute('data-en', el.innerHTML);
      var frv = el.getAttribute('data-fr');
      el.innerHTML = (l === 'fr' && frv) ? frv : el.getAttribute('data-en');
    });
    [].forEach.call(document.querySelectorAll('[data-i18n-attr]'), function (el) {
      var attr = el.getAttribute('data-i18n-attr');
      if (el.getAttribute('data-en-attr') === null) el.setAttribute('data-en-attr', el.getAttribute(attr));
      el.setAttribute(attr, l === 'fr' ? el.getAttribute('data-fr-attr') : el.getAttribute('data-en-attr'));
    });
    document.title = I18N.title[l];
    langOpts.forEach(function (o) {
      var on = o.getAttribute('data-lang') === l;
      o.classList.toggle('active', on);
      o.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (typeof msgEl !== 'undefined' && msgEl) msgEl.textContent = message(reps);
  }
  langOpts.forEach(function (o) {
    o.addEventListener('click', function () {
      var l = o.getAttribute('data-lang');
      if (l !== curLang) applyLang(l);
    });
  });
  if (curLang === 'fr') applyLang('fr');
})();
</script>
</body>
</html>`;

for (const key of Object.keys(VARIANTS)) {
  V = VARIANTS[key];
  const out = renderPage();
  fs.writeFileSync(path.join(REPO, V.file), out);
  console.log('[' + key + '] ' + V.file + ' written: ' + out.length + ' chars');
}

// ---- i18n coverage report: run this build after editing copy to see what needs French ----
const missing = [...usedI18n].filter(k => !(k in FR) || FR[k] === '');
const stale = Object.keys(FR).filter(k => !usedI18n.has(k));
const missPath = path.join(REPO, 'i18n', 'fr.missing.json');
if (missing.length) {
  console.warn('[i18n] MISSING FRENCH for ' + missing.length + ' string(s) — fill them in i18n/fr.missing.json, merge into fr.json, rebuild:');
  missing.forEach(m => console.warn('   - ' + (m.length > 90 ? m.slice(0, 90) + '…' : m)));
  const obj = {};
  missing.forEach(m => { obj[m] = ''; });
  fs.writeFileSync(missPath, JSON.stringify(obj, null, 2));
} else {
  try { fs.unlinkSync(missPath); } catch (e) {}
  console.log('[i18n] all ' + usedI18n.size + ' strings have French');
}
if (stale.length) console.warn('[i18n] STALE fr.json entries (' + stale.length + ') — English source changed or was removed: ' + stale.map(x => '"' + (x.length > 60 ? x.slice(0, 60) + '…' : x) + '"').join(', '));
