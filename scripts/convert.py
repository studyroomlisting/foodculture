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
        # convert kebab-case to camelCase
        parts = k.split("-")
        camel = parts[0] + "".join(p.capitalize() for p in parts[1:])
        pairs.append(f"{camel}: '{v}'")
    return "{{ " + ", ".join(pairs) + " }}"

def transform_element(el, comp_counter):
    tag = el.tag
    if not isinstance(tag, str):
        return ""  # comments/PIs - skip
    attrs = dict(el.attrib)
    attr_strs = []
    for k, v in attrs.items():
        if k.startswith("on"):  # strip inline JS handlers (onclick etc.)
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
        elif k == "-" in k:
            key = k
        if k == "style":
            attr_strs.append(f"style={style_str_to_obj(v)}")
            continue
        v_escaped = v.replace('"', "&quot;")
        attr_strs.append(f'{key}="{v_escaped}"')
    attr_out = (" " + " ".join(attr_strs)) if attr_strs else ""

    children_out = []
    if el.text and el.text.strip():
        children_out.append(escape_text(el.text))
    elif el.text and el.text != "\n" and el.text.strip() == "" and el.text != "":
        pass

    for child in el:
        children_out.append(transform_element(child, comp_counter))
        if child.tail and child.tail.strip():
            children_out.append(escape_text(child.tail))

    inner = "".join(children_out)

    if tag in VOID_TAGS:
        return f"<{tag}{attr_out} />"
    else:
        return f"<{tag}{attr_out}>{inner}</{tag}>"

def escape_text(t):
    t = t.replace("{", "&#123;").replace("}", "&#125;")
    t = re.sub(r"<(?!/?[a-zA-Z])", "&lt;", t)  # stray lone < not part of a tag
    return t

def convert_file(fname, comp_name, slug):
    path = os.path.join(SRC, fname)
    raw = open(path, encoding="utf-8").read()

    style_m = re.search(r"<style>(.*?)</style>", raw, re.S)
    css = style_m.group(1) if style_m else ""

    body_m = re.search(r"<body[^>]*>(.*?)</body>", raw, re.S)
    body_html = body_m.group(1) if body_m else ""

    # remove HTML comments (not valid in JSX as-is)
    body_html = re.sub(r"<!--.*?-->", "", body_html, flags=re.S)
    # strip <script> blocks entirely (demo-only JS; logic gets reimplemented in React)
    body_html = re.sub(r"<script\b[^>]*>.*?</script>", "", body_html, flags=re.S)

    wrapper = f"<div>{body_html}</div>"
    parser = lhtml.HTMLParser(recover=True)
    tree = lhtml.fromstring(wrapper, parser=parser)

    jsx_body = transform_element(tree, [0])

    css_filename = f"{slug}.module.css"
    css_path = os.path.join(OUT_STYLES, css_filename)
    with open(css_path, "w", encoding="utf-8") as f:
        f.write(css)

    # Replace className="x y z" with styles-based template literal referencing CSS module classes
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

    tsx_content = f"""'use client';
import styles from '@/styles/pages/{css_filename}';

export default function {comp_name}() {{
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
