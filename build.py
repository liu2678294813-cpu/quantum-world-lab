"""Build a single HTML document that runs offline without installation."""
from pathlib import Path
import re
import base64

ROOT = Path(__file__).resolve().parent
page = (ROOT / 'index.html').read_text(encoding='utf-8')
def stylesheet(match):
    file = ROOT / match[1]
    css = file.read_text(encoding='utf-8')
    if file.name == 'katex.min.css':
        def font_face(face):
            block = face[0]
            font = re.search(r'url\(([^)]+\.woff2)\)', block)
            if not font:
                raise ValueError('Missing WOFF2 in KaTeX font face')
            payload = base64.b64encode((file.parent / font[1].strip('\'"')).read_bytes()).decode('ascii')
            return re.sub(r'src:[^;}]*(?=;|})', 'src:url(data:font/woff2;base64,' + payload + ') format("woff2")', block)
        css = re.sub(r'@font-face\{[^}]+\}', font_face, css)
    return '<style>\n' + css + '\n</style>'
page = re.sub(r'<link rel="stylesheet" href="([^"]+)">', stylesheet, page)
page = re.sub(r'<script src="([^"]+)"></script>', lambda m: '<script>\n' + (ROOT / m[1]).read_text(encoding='utf-8').replace('</script', '<\\/script') + '\n</script>', page)
out = ROOT / 'output' / '量子世界.html'
out.parent.mkdir(exist_ok=True)
out.write_bytes(page.encode('utf-8'))
print(f'Built {out} ({out.stat().st_size:,} bytes)')
