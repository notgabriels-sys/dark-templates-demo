#!/usr/bin/env python3
"""
Inject canonical + description + Open Graph tags into the demo pages, and
regenerate sitemap.xml and robots.txt.

Several pages here are COPIES of the product packs. Re-copy a pack and its meta
tags are gone — so this is a script, not a one-off edit. Run it after any copy:

    python3 tools/add-meta.py
"""
import os, re, datetime

BASE = "https://notgabriels-sys.github.io/dark-templates-demo"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# page -> (title override or None, description)
PAGES = {
 "index.html": (None,
   "Live demos of dark HTML templates: business documents that print clean, 16:9 slide decks, "
   "app screens, a docs site with working search, 50 Obsidian themes, terminal tool themes, "
   "chart components and interface states."),
 "charts/index.html": ("Dark Charts — CSS and SVG charts with no library",
   "Line, area, bars, donut, sparkline, heatmap and stat tiles as CSS and inline SVG. "
   "About 6 KB of JavaScript, no charting library, no build step. Live demo with palette switching."),
 "cli/index.html": ("Dark CLI Toolkit — 50 palettes for starship, bat, delta, fzf, btop",
   "Fifty palettes applied to the tools inside your terminal: starship prompt, bat syntax, "
   "delta diffs, fzf, btop and directory colours. 300 config files, previewed in a rendered terminal."),
 "obsidian/index.html": ("Dark Obsidian Themes — 50 themes, previewed live",
   "Fifty dark themes for Obsidian with enforced WCAG contrast floors. Preview every one in a "
   "rendered Obsidian interface — the preview reads each theme's real values."),
 "states/index.html": ("Dark States Kit — empty states and skeleton loaders",
   "Empty states, skeleton loaders, banners and progress as pure CSS. No JavaScript, and every "
   "animation stops under prefers-reduced-motion."),
 "docs/index.html": ("Dark Docs Starter — a documentation site in plain HTML",
   "A whole docs site as plain HTML: working client-side search, light and dark toggle, copy "
   "buttons and an auto-generated table of contents. No framework, no build step."),
 "slides/01-pitch-deck.html": ("Dark Slide Templates — investor pitch deck",
   "An 11-slide investor pitch deck in plain HTML that exports to a true 16:9 PDF. "
   "No Keynote, no PowerPoint."),
 "invoices/01-invoice.html": ("Dark Invoice Template — prints clean to PDF",
   "A dark invoice template that prints clean black-on-white. VAT lines, IBAN fields, "
   "payment terms. Plain HTML, fits one A4 page."),
 "invoices/09-invoice-reverse-charge.html": ("EU reverse-charge invoice template",
   "A cross-border B2B invoice at 0% VAT with the Art. 196 reverse-charge note and both VAT IDs. "
   "Plain HTML, prints clean to PDF."),
 "release/01-one-sheet.html": ("Music release one-sheet template",
   "A release one-sheet for labels, distributors and bookers: tracklist with BPM and key, "
   "release details, asset links. Prints clean to one A4 page."),
 "release/05-tech-rider.html": ("Tech rider template for live and hybrid sets",
   "What you bring, what the venue provides, signal chain and hospitality — on one page, "
   "because a two-page rider does not get read."),
 "screens/dashboard.html": ("Dark dashboard screen — HTML and CSS",
   "A dark dashboard: sidebar nav, stat cards with deltas, a hand-written SVG area chart and an "
   "activity table. One file, no framework."),
 "screens/signin.html": ("Dark sign-in screen — HTML and CSS",
   "A dark sign-in screen with OAuth buttons, divider, email and password, and a legal footer. "
   "One file, no framework."),
 "docs/guide/quickstart.html": ("Quickstart — Dark Docs Starter demo",
   "A quickstart page from the Dark Docs Starter: code blocks with copy buttons, an auto table "
   "of contents, and working client-side search."),
 "docs/api/reference.html": ("API reference — Dark Docs Starter demo",
   "An API reference page from the Dark Docs Starter: endpoint tables, method pills, rate limits "
   "and copyable examples. Plain HTML, no framework."),
 "docs/changelog.html": ("Changelog — Dark Docs Starter demo",
   "A versioned changelog page from the Dark Docs Starter, with a deprecation notice pattern."),
 "writing/headless-chrome-never-exits.html": (None,
   "Headless Chrome writes the PDF and then never exits. A timeout truncates the file silently. "
   "Wait for the file size to stop changing instead — with the watchdog code, plus the profile-lock "
   "and page-count traps."),
 "writing/contrast-floors.html": (None,
   "A naive contrast check compares every colour to the background — including the backgrounds. "
   "What the WCAG floors actually are, and the fix that lifts a colour until it passes."),
}

OG = f"{BASE}/og.png"

def head_of(html):
    m = re.search(r'</head>', html, re.I)
    return m.start() if m else None

def strip_existing(html):
    for pat in (r'\n?\s*<link rel="canonical"[^>]*>',
                r'\n?\s*<meta name="description"[^>]*>',
                r'\n?\s*<meta property="og:[^"]*"[^>]*>',
                r'\n?\s*<meta name="twitter:[^"]*"[^>]*>'):
        html = re.sub(pat, '', html, flags=re.I)
    return html

def title_of(html):
    m = re.search(r'<title>(.*?)</title>', html, re.S | re.I)
    return re.sub(r'\s+', ' ', m.group(1)).strip() if m else "Dark templates"

changed = []
for rel, (title_override, desc) in PAGES.items():
    path = os.path.join(ROOT, rel)
    if not os.path.exists(path):
        print(f"  skip (missing): {rel}"); continue
    html = open(path, encoding='utf-8').read()
    html = strip_existing(html)
    if title_override:
        html = re.sub(r'<title>.*?</title>', f'<title>{title_override}</title>', html, count=1, flags=re.S | re.I)
    title = title_override or title_of(html)
    url = f"{BASE}/" + ("" if rel == "index.html" else rel)
    block = (f'\n<link rel="canonical" href="{url}">'
             f'\n<meta name="description" content="{desc}">'
             f'\n<meta property="og:type" content="website">'
             f'\n<meta property="og:title" content="{title}">'
             f'\n<meta property="og:description" content="{desc}">'
             f'\n<meta property="og:url" content="{url}">'
             f'\n<meta property="og:image" content="{OG}">'
             f'\n<meta name="twitter:card" content="summary_large_image">\n')
    i = head_of(html)
    if i is None:
        print(f"  skip (no </head>): {rel}"); continue
    open(path, 'w', encoding='utf-8').write(html[:i] + block + html[i:])
    changed.append(rel)

today = datetime.date(2026, 8, 23).isoformat()
urls = "".join(
    f'  <url><loc>{BASE}/{"" if r=="index.html" else r}</loc>'
    f'<lastmod>{today}</lastmod>'
    f'<priority>{"1.0" if r=="index.html" else "0.7"}</priority></url>\n'
    for r in PAGES)
open(os.path.join(ROOT, 'sitemap.xml'), 'w').write(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '</urlset>\n')
open(os.path.join(ROOT, 'robots.txt'), 'w').write(
    f"User-agent: *\nAllow: /\n\nSitemap: {BASE}/sitemap.xml\n")

print(f"meta injected into {len(changed)} pages")
print("sitemap.xml and robots.txt written")
