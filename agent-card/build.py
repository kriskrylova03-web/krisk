#!/usr/bin/env python3
"""Build the standalone agent card using only the Python standard library."""
from pathlib import Path
import base64
import json
import mimetypes
import re

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'source'


def uri(relative):
    path = (SOURCE / relative).resolve()
    if not path.is_relative_to(SOURCE.resolve()):
        raise ValueError('Asset path escapes source directory')
    mime = {'.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp'}.get(path.suffix)
    mime = mime or mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()


def inline_script(contents):
    return re.sub(r'</script', r'<\/script', contents, flags=re.I)


html = (SOURCE / 'index.html').read_text(encoding='utf-8')
css = (SOURCE / 'styles.css').read_text(encoding='utf-8')
css = re.sub(r"url\(['\"]?(assets/[^)'\"]+)['\"]?\)", lambda m: 'url("' + uri(m[1]) + '")', css)
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + css + '\n</style>')
html = re.sub(r'(src|href)="(assets/[^"]+)"', lambda m: m[1] + '="' + uri(m[2]) + '"', html)
assets = {p.relative_to(SOURCE).as_posix(): uri(p.relative_to(SOURCE).as_posix()) for p in sorted((SOURCE / 'assets/images').iterdir()) if p.is_file()}
config = (SOURCE / 'agent-config.js').read_text(encoding='utf-8')
main = (SOURCE / 'card.js').read_text(encoding='utf-8')
scripts = 'window.AGENT_CARD_ASSETS=' + json.dumps(assets, ensure_ascii=False) + ';\n' + config + '\n' + main
html = html.replace('<script src="agent-config.js" defer></script>', '')
html = html.replace('<script src="card.js" defer></script>', '')
html = html.replace('</body>', '<script>\n' + inline_script(scripts) + '\n</script>\n</body>')
(ROOT / 'index.html').write_text(html, encoding='utf-8')
print('Built index.html:', len(html.encode('utf-8')), 'bytes')
