#!/usr/bin/env python3
"""Build printable client handouts.

src/*.md (front matter: title, category, optional lang)
  -> <slug>.html   print-ready page (Letter)
  -> pdf/<slug>.pdf
  -> index.html    download/print library

Requires pandoc and Google Chrome (headless) on PATH/default location.
Usage: python3 build.py            (build everything)
       python3 build.py --no-pdf   (HTML only)
"""
import html
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
PDF = ROOT / "pdf"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

CATEGORY_ORDER = [
    "Brain & Seizures",
    "Spine",
    "Nerves, Muscles, Joints & Senses",
    "Tests & Procedures",
    "Home Care",
    "Medications & Diet",
    "About Our Team",
]

CLINIC = "VCA Veterinary Specialty and Emergency Center of Kalamazoo"
ADDRESS = "5348 S. Westnedge Ave., Portage, MI 49002"
PHONE = "269-381-5228"
EMAIL = "vseck.neuro@vca.com"
WEB = "vcakalamazoo.com"
AUTHOR = "Sandy Chen, BVM, DACVIM (Neurology)"

PAGE_CSS = """
:root{--ink:#1d2733;--muted:#5b6876;--brand:#00539b;--accent:#e8f1fa;--rule:#c9d6e3;--bg:#fff}
@page{size:Letter;margin:0.45in 0.5in 0.55in}
*{box-sizing:border-box}
html{background:#e9edf1}
body{margin:0;font:10pt/1.36 "Helvetica Neue",Arial,sans-serif;color:var(--ink);background:#e9edf1}
.sheet{background:var(--bg);max-width:8.5in;margin:16px auto;padding:0.45in 0.5in 0.5in;box-shadow:0 1px 6px rgba(0,0,0,.15)}
header{display:flex;align-items:center;gap:14px;border-bottom:2.5px solid var(--brand);padding-bottom:6px;margin-bottom:8px}
header img{height:34px;width:auto}
header .clinic{font-size:8.5pt;color:var(--muted);line-height:1.25}
header .clinic b{color:var(--brand);font-size:9.5pt}
h1{font-size:17pt;color:var(--brand);margin:4px 0 8px;line-height:1.15}
.body{columns:2;column-gap:0.3in;column-fill:balance}
.body.single{columns:1}
h2{font-size:10.5pt;color:var(--brand);margin:8px 0 2px;padding-bottom:1px;border-bottom:1px solid var(--rule);break-after:avoid;break-inside:avoid}
.body>h2:first-child{margin-top:0}
p{margin:0 0 5px}
ul,ol{margin:0 0 5px;padding-left:16px}
li{margin:0 0 1px}
li>ul,li>ol{margin:1px 0 1px}
table{border-collapse:collapse;width:100%;margin:2px 0 6px;font-size:9pt;break-inside:avoid}
th,td{border:1px solid var(--rule);padding:2px 5px;text-align:left;vertical-align:top}
th{background:var(--accent)}
blockquote{margin:0 0 6px;padding:4px 8px;background:var(--accent);border-left:3px solid var(--brand);break-inside:avoid}
blockquote p{margin:0}
footer span:first-child{white-space:nowrap}
footer{margin-top:10px;border-top:1px solid var(--rule);padding-top:4px;font-size:7.5pt;color:var(--muted);display:flex;justify-content:space-between;gap:12px}
.toolbar{max-width:8.5in;margin:16px auto 0;display:flex;gap:8px;font:13px Arial,sans-serif}
.toolbar a,.toolbar button{padding:7px 12px;border-radius:6px;border:1px solid #9fb3c8;background:#fff;color:var(--brand);text-decoration:none;cursor:pointer;font:inherit}
.toolbar .primary{background:var(--brand);color:#fff;border-color:var(--brand)}
@media screen and (max-width:700px){.body{columns:1}.sheet{padding:16px;margin:8px}}
@media print{
  html,body{background:#fff}
  .sheet{margin:0;padding:0;box-shadow:none;max-width:none}
  .toolbar{display:none}
}
"""

INDEX_CSS = """
:root{--ink:#1d2733;--muted:#5b6876;--brand:#00539b;--card:#fff;--bg:#f3f6f9;--rule:#d5dee8}
@media (prefers-color-scheme:dark){:root{--ink:#e6edf3;--muted:#9fb0c0;--brand:#7db7ff;--card:#18212b;--bg:#10161d;--rule:#2b3846}}
*{box-sizing:border-box}
body{margin:0;font:15px/1.45 "Helvetica Neue",Arial,sans-serif;color:var(--ink);background:var(--bg)}
.wrap{max-width:980px;margin:0 auto;padding:24px 16px 48px}
header{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
header img{height:40px;background:#fff;border-radius:6px;padding:3px}
h1{margin:0;font-size:24px;color:var(--brand)}
.sub{color:var(--muted);margin:6px 0 18px}
input{width:100%;padding:10px 12px;font:inherit;border:1px solid var(--rule);border-radius:8px;background:var(--card);color:var(--ink);margin-bottom:8px}
h2{font-size:15px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin:22px 0 8px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}
.card{background:var(--card);border:1px solid var(--rule);border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:8px}
.card .t{font-weight:600}
.card .m{font-size:12.5px;color:var(--muted)}
.card .links{display:flex;gap:8px;margin-top:auto}
.card a{font-size:13px;padding:5px 10px;border-radius:6px;border:1px solid var(--rule);color:var(--brand);text-decoration:none}
.card a.pdf{background:var(--brand);color:#fff;border-color:var(--brand)}
@media (prefers-color-scheme:dark){.card a.pdf{color:#0b1520}}
footer{margin-top:32px;font-size:12.5px;color:var(--muted)}
"""


def parse(path):
    text = path.read_text(encoding="utf-8")
    m = re.match(r"---\n(.*?)\n---\n(.*)", text, re.S)
    meta = {}
    for line in m.group(1).splitlines():
        k, _, v = line.partition(":")
        meta[k.strip()] = v.strip()
    meta["slug"] = path.stem
    meta.setdefault("lang", "en")
    return meta, m.group(2)


def md_to_html(md):
    return subprocess.run(
        ["pandoc", "-f", "gfm", "-t", "html5", "--wrap=none"],
        input=md, capture_output=True, text=True, check=True,
    ).stdout


def render_page(meta, body_html):
    t = html.escape(meta["title"])
    cls = "body single" if meta.get("layout") == "single" else "body"
    es = meta["lang"] == "es"
    made_by = "Documento preparado por" if es else "Prepared by"
    return f"""<!DOCTYPE html>
<html lang="{meta['lang']}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{t}</title>
<style>{PAGE_CSS}</style>
</head>
<body>
<div class="toolbar">
  <a href="index.html">&larr; All handouts</a>
  <button class="primary" onclick="window.print()">Print</button>
  <a href="pdf/{meta['slug']}.pdf" download>Download PDF</a>
</div>
<div class="sheet">
<header>
  <img src="assets/vca-logo.png" alt="VCA Animal Hospitals">
  <div class="clinic"><b>{CLINIC}</b><br>Neurology Department</div>
</header>
<h1>{t}</h1>
<div class="{cls}">
{body_html}
</div>
<footer>
  <span>{made_by} {AUTHOR}</span>
  <span>{ADDRESS} &middot; P {PHONE} &middot; {EMAIL} &middot; {WEB}</span>
</footer>
</div>
</body>
</html>
"""


def render_index(items):
    by_cat = {}
    for meta in items:
        by_cat.setdefault(meta["category"], []).append(meta)
    sections = []
    cats = [c for c in CATEGORY_ORDER if c in by_cat] + sorted(set(by_cat) - set(CATEGORY_ORDER))
    for cat in cats:
        cards = []
        for m in sorted(by_cat[cat], key=lambda x: x["title"].lower()):
            pages = m.get("pages")
            info = f"{pages} page{'s' if pages != 1 else ''} · PDF" if pages else "PDF"
            if m["lang"] == "es":
                info += " · Español"
            cards.append(
                f'<div class="card" data-q="{html.escape((m["title"] + " " + cat).lower())}">'
                f'<div class="t">{html.escape(m["title"])}</div><div class="m">{info}</div>'
                f'<div class="links"><a href="{m["slug"]}.html">View / Print</a>'
                f'<a class="pdf" href="pdf/{m["slug"]}.pdf" download>Download PDF</a></div></div>'
            )
        sections.append(f'<section><h2>{html.escape(cat)}</h2><div class="grid">{"".join(cards)}</div></section>')
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Neurology Client Handouts</title>
<style>{INDEX_CSS}</style>
</head>
<body>
<div class="wrap">
<header><img src="assets/vca-logo.png" alt="VCA Animal Hospitals"><h1>Neurology Client Handouts</h1></header>
<p class="sub">{CLINIC} &middot; Neurology Department. Each handout prints on one or two Letter pages. Choose <b>View / Print</b> to print from your browser, or <b>Download PDF</b> to save a copy.</p>
<input id="q" type="search" placeholder="Search handouts (e.g. seizure, disc, steroid)" aria-label="Search handouts">
{"".join(sections)}
<footer>{ADDRESS} &middot; P {PHONE} &middot; {EMAIL} &middot; {WEB}<br>These handouts are general information and do not replace advice from your veterinarian about your own pet.</footer>
</div>
<script>
const q=document.getElementById('q');
q.addEventListener('input',()=>{{const v=q.value.trim().toLowerCase();
document.querySelectorAll('.card').forEach(c=>c.style.display=!v||c.dataset.q.includes(v)?'':'none');
document.querySelectorAll('section').forEach(s=>s.style.display=[...s.querySelectorAll('.card')].some(c=>c.style.display!=='none')?'':'none');}});
</script>
</body>
</html>
"""


def make_pdf(html_path, pdf_path):
    subprocess.run(
        [CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
         f"--print-to-pdf={pdf_path}", html_path.as_uri()],
        check=True, capture_output=True,
    )
    from pypdf import PdfReader
    return len(PdfReader(str(pdf_path)).pages)


def main():
    want_pdf = "--no-pdf" not in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    PDF.mkdir(exist_ok=True)
    items = []
    for path in sorted(SRC.glob("*.md")):
        meta, md = parse(path)
        out = ROOT / f"{meta['slug']}.html"
        if not only or meta["slug"] in only:
            out.write_text(render_page(meta, md_to_html(md)), encoding="utf-8")
        pdf_path = PDF / f"{meta['slug']}.pdf"
        if want_pdf and (not only or meta["slug"] in only):
            meta["pages"] = make_pdf(out, pdf_path)
            flag = "  <-- OVER 2 PAGES" if meta["pages"] > 2 else ""
            print(f"{meta['pages']}p  {meta['slug']}{flag}")
        elif pdf_path.exists():
            from pypdf import PdfReader
            meta["pages"] = len(PdfReader(str(pdf_path)).pages)
        items.append(meta)
    (ROOT / "index.html").write_text(render_index(items), encoding="utf-8")
    print(f"{len(items)} handouts -> index.html")


if __name__ == "__main__":
    main()
