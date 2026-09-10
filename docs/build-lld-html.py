#!/usr/bin/env python3
"""Render lld-erebus-api.md to a self-contained HTML document.

Mermaid fences become <pre class="mermaid"> blocks rendered client-side;
PlantUML fences are kept as highlighted source plus a link to render them.
"""
import html
import re
import markdown

SRC = "/home/ratto/Workspace/ErebusProject/erebus-project/erebus-api/docs/lld-erebus-api.md"
DST = "/home/ratto/Workspace/ErebusProject/erebus-project/erebus-api/docs/lld-erebus-api.html"

text = open(SRC, encoding="utf-8").read()

# Pull out fenced blocks that must not go through the markdown code highlighter.
placeholders = {}


def stash(match):
    lang = match.group(1)
    body = match.group(2)
    key = f"@@BLOCK{len(placeholders)}@@"
    if lang == "mermaid":
        placeholders[key] = (
            '<div class="diagram"><pre class="mermaid">'
            + html.escape(body)
            + "</pre></div>"
        )
    else:  # plantuml
        placeholders[key] = (
            '<div class="diagram plantuml">'
            '<div class="diagram-label">PlantUML — C4 component diagram '
            "(render with a PlantUML server or the VS Code PlantUML extension)</div>"
            "<pre><code>" + html.escape(body) + "</code></pre></div>"
        )
    return key


text = re.sub(r"```(mermaid|plantuml)\n(.*?)```", stash, text, flags=re.S)

body = markdown.markdown(
    text,
    extensions=["tables", "fenced_code", "codehilite", "toc", "sane_lists", "attr_list"],
    extension_configs={
        "codehilite": {"guess_lang": False, "noclasses": False},
        "toc": {"permalink": False},
    },
)

for key, value in placeholders.items():
    body = body.replace(f"<p>{key}</p>", value).replace(key, value)

STYLE = """
  :root { --bg:#ffffff; --fg:#1a1a1a; --muted:#5a5a5a; --line:#d8d8d8; --accent:#7a3b12;
          --code-bg:#f4f3f1; --code-fg:#24292f; --ok:#1a6b34; --bad:#9b2226; --note-bg:#faf6f1; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#15161a; --fg:#e8e8e6; --muted:#a6a6a6; --line:#33353c; --accent:#e0a878;
            --code-bg:#1d1f26; --code-fg:#d8d8d4; --ok:#7fd1a0; --bad:#ef8a8a; --note-bg:#1b1d23; }
  }
  html,body { background:var(--bg); color:var(--fg); }
  body { margin:0 auto; padding:2rem 1.25rem 5rem; max-width:64rem;
         font:16px/1.65 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; }
  h1 { font-size:1.9rem; border-bottom:2px solid var(--accent); padding-bottom:.4rem; margin-bottom:.3rem; }
  h2 { font-size:1.35rem; margin-top:2.6rem; color:var(--accent); border-bottom:1px solid var(--line);
       padding-bottom:.25rem; }
  h3 { font-size:1.08rem; margin-top:1.8rem; }
  h4 { font-size:.98rem; margin-top:1.2rem; color:var(--muted); text-transform:uppercase;
       letter-spacing:.04em; }
  p, li { overflow-wrap:anywhere; }
  code { background:var(--code-bg); color:var(--code-fg); padding:.1em .35em; border-radius:3px;
         font-size:.88em; font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; }
  pre { background:var(--code-bg); color:var(--code-fg); padding:.9rem 1rem; border-radius:6px;
        border:1px solid var(--line); overflow-x:auto; font-size:.85rem; line-height:1.55; }
  pre code { background:none; padding:0; font-size:1em; }
  table { border-collapse:collapse; width:100%; margin:1rem 0; display:block; overflow-x:auto; }
  th,td { border:1px solid var(--line); padding:.45rem .7rem; text-align:left; vertical-align:top;
          font-size:.92rem; }
  th { background:var(--code-bg); white-space:nowrap; }
  blockquote { border-left:3px solid var(--accent); margin:1rem 0; padding:.2rem 1rem;
               color:var(--muted); background:var(--note-bg); }
  ul,ol { padding-left:1.4rem; }
  li { margin:.3rem 0; }
  hr { border:none; border-top:1px solid var(--line); margin:2.5rem 0; }
  .meta { color:var(--muted); font-size:.92rem; margin-top:0; }
  .diagram { margin:1.4rem 0; padding:1rem; border:1px solid var(--line); border-radius:6px;
             background:var(--note-bg); overflow-x:auto; }
  .diagram pre.mermaid { background:none; border:none; padding:0; text-align:center; }
  .diagram-label { color:var(--muted); font-size:.82rem; margin-bottom:.6rem;
                   text-transform:uppercase; letter-spacing:.04em; }
  strong { font-weight:650; }
"""

out = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>LLD — erebus-api</title>
<style>{STYLE}</style>
</head>
<body>
{body}
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  mermaid.initialize({{ startOnLoad: true, theme: dark ? 'dark' : 'neutral' }});
</script>
</body>
</html>
"""

open(DST, "w", encoding="utf-8").write(out)
print(f"wrote {DST} ({len(out)} bytes)")
