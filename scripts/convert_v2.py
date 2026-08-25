import re, os
from lxml import etree, html as lhtml

SRC = "/home/claude/foodculture_src/Food Culture"
OUT_COMPONENTS = "/home/claude/build/components/pages"
OUT_STYLES = "/home/claude/build/styles/pages"
os.makedirs(OUT_COMPONENTS, exist_ok=True)
os.makedirs(OUT_STYLES, exist_ok=True)

FILES = [
    ("foodculture_homepage.html", "HomePage", "home"),
    ("foodculture_explore.html", "ExplorePage", "explore"),
    ("foodculture_trending.html", "TrendingPage", "trending"),
    ("foodculture_complete.html", "RestaurantDirectoryPage", "restaurant-directory"),
    ("foodculture_v3.html", "RestaurantDetailPage", "restaurant-detail"),
    ("foodculture_v4_revenue.html", "DashboardPage", "dashboard"),
    ("foodculture_influencer_profile.html", "InfluencerProfilePage", "influencer-profile"),
    ("foodculture_influencer_v2.html", "InfluencerProfileV2Page", "influencer-profile-v2"),
    ("foodculture_prototype.html", "PrototypeAllPage", "prototype-all"),
]

VOID_TAGS = {"area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"}

def style_str_to_obj(style):
    decls = [d.strip() for d in style.split(";") if d.strip()]
    pairs = []
    for d in decls:
        if ":" not in d:
            continue
        k, v = d.split(":", 1)
        k = k.strip()
        v = v.strip().replace("'", "\\'")
        parts = k.split("-")
        camel = parts[0] + "".join(p.capitalize() for p in parts[1:])
        pairs.append(f"{camel}: '{v}'")
    return "{{ " + ", ".join(pairs) + " }}"

def fix_unescaped_apostrophes(js):
    # The original prototypes have a real bug: contraction apostrophes (We'll, don't, etc.)
    # left unescaped inside single-quoted JS string literals. Escape them, but leave the
    # string-delimiting quotes (preceded by ':' '(' ',' '>' etc., not a letter) untouched.
    return re.sub(r"(?<=[a-zA-Z])'(?=(?:ll|s|t|re|ve|d)(?:[^a-zA-Z]|$))", r"\\'", js)

def onclick_to_jsx_handler(js):
    """Translate a raw inline onclick JS string into a React onClick arrow fn body."""
    code = js.strip()
    if code.endswith(";"):
        code = code[:-1]
    # word-boundary replacements: DOM event API -> React synthetic event
    code = re.sub(r"\bthis\b", "e.currentTarget", code)
    code = re.sub(r"\bevent\b", "e", code)
    code = code.replace("e.currentTarget.classList", "e.currentTarget.classList")  # no-op, kept for clarity
    return code

def transform_element(el):
    tag = el.tag
    if not isinstance(tag, str):
        return ""
    attrs = dict(el.attrib)
    attr_strs = []
    onclick_js = attrs.get("onclick")
    for k, v in attrs.items():
        if k == "onclick":
            continue
        if k.startswith("on"):  # other inline handlers (onchange etc.) - drop, rare in this dataset
            continue
        key = k
        if k == "class":
            key = "className"
        elif k == "for":
            key = "htmlFor"
        elif k == "tabindex":
            key = "tabIndex"
        elif k == "readonly":
            key = "readOnly"
        elif k == "maxlength":
            key = "maxLength"
        if k == "style":
            attr_strs.append(f"style={style_str_to_obj(v)}")
            continue
        v_escaped = v.replace('"', "&quot;")
        attr_strs.append(f'{key}="{v_escaped}"')

    if onclick_js:
        handler_body = onclick_to_jsx_handler(onclick_js)
        attr_strs.append(f"onClick={{(e) => {{ {handler_body}; }}}}")

    attr_out = (" " + " ".join(attr_strs)) if attr_strs else ""

    children_out = []
    if el.text and el.text.strip():
        children_out.append(escape_text(el.text))

    for child in el:
        children_out.append(transform_element(child))
        if child.tail and child.tail.strip():
            children_out.append(escape_text(child.tail))

    inner = "".join(children_out)

    if tag in VOID_TAGS:
        return f"<{tag}{attr_out} />"
    else:
        return f"<{tag}{attr_out}>{inner}</{tag}>"

def escape_text(t):
    t = t.replace("{", "&#123;").replace("}", "&#125;")
    t = re.sub(r"<(?!/?[a-zA-Z])", "&lt;", t)
    return t

def extract_script(raw):
    m = re.search(r"<script\b[^>]*>([\s\S]*?)</script>", raw)
    return m.group(1) if m else ""

def convert_file(fname, comp_name, slug):
    path = os.path.join(SRC, fname)
    raw = open(path, encoding="utf-8").read()

    style_m = re.search(r"<style>(.*?)</style>", raw, re.S)
    css = style_m.group(1) if style_m else ""

    script_js = extract_script(raw)
    script_js = fix_unescaped_apostrophes(script_js)

    body_m = re.search(r"<body[^>]*>(.*?)</body>", raw, re.S)
    body_html = body_m.group(1) if body_m else ""

    body_html = re.sub(r"<!--.*?-->", "", body_html, flags=re.S)
    body_html = re.sub(r"<script\b[^>]*>[\s\S]*?</script>", "", body_html)

    wrapper = f"<div>{body_html}</div>"
    parser = lhtml.HTMLParser(recover=True)
    tree = lhtml.fromstring(wrapper, parser=parser)

    jsx_body = transform_element(tree)

    css_filename = f"{slug}.module.css"
    css_path = os.path.join(OUT_STYLES, css_filename)
    with open(css_path, "w", encoding="utf-8") as f:
        f.write(css)

    def repl_classname(m):
        classes = m.group(1).split()
        if not classes:
            return 'className=""'
        parts = [f"styles['{c}']" for c in classes]
        if len(parts) == 1:
            return f"className={{{parts[0]}}}"
        joined = " + ' ' + ".join(parts)
        return f"className={{{joined}}}"

    jsx_body = re.sub(r'className="([^"]*)"', repl_classname, jsx_body)

    script_block = ""
    if script_js.strip():
        script_block = f"""
  // --- Ported interactive logic (verbatim from original mockup) ---
  // Operates on DOM directly via ids/classes already present in the markup above,
  // exactly like the original prototype. Triggered by the onClick handlers wired in.
{script_js}
"""

    tsx_content = f"""// @ts-nocheck
'use client';
import styles from '@/styles/pages/{css_filename}';

export default function {comp_name}() {{
{script_block}
  return (
    {jsx_body}
  );
}}
"""
    tsx_path = os.path.join(OUT_COMPONENTS, f"{comp_name}.tsx")
    with open(tsx_path, "w", encoding="utf-8") as f:
        f.write(tsx_content)

    return tsx_path, css_path

for fname, comp_name, slug in FILES:
    tsx_path, css_path = convert_file(fname, comp_name, slug)
    print("Converted:", fname, "->", tsx_path, css_path)
