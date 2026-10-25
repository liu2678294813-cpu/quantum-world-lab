"""Vendor the official pinned KaTeX browser distribution for offline use."""
from pathlib import Path
import urllib.request, tarfile, io, json, hashlib

root=Path(__file__).resolve().parents[1]
version='0.19.1'
url=f'https://registry.npmjs.org/katex/-/katex-{version}.tgz'
data=urllib.request.urlopen(url,timeout=60).read()
dest=root/'vendor'/'katex'
dest.mkdir(parents=True,exist_ok=True)
with tarfile.open(fileobj=io.BytesIO(data),mode='r:gz') as tar:
    for member in tar.getmembers():
        name=member.name
        rel=None
        if name in ['package/dist/katex.min.js','package/dist/katex.min.css']:
            rel=Path(name).name
        elif name.startswith('package/dist/fonts/') and name.endswith('.woff2'):
            rel='fonts/'+Path(name).name
        elif name=='package/LICENSE':
            rel='LICENSE'
        if rel:
            p=dest/rel
            p.parent.mkdir(parents=True,exist_ok=True)
            p.write_bytes(tar.extractfile(member).read())
(dest/'provenance.json').write_text(json.dumps({'name':'KaTeX','version':version,'source':url,'archiveSha256':hashlib.sha256(data).hexdigest(),'license':'MIT'},indent=2),encoding='utf-8')
print(f'Vendored KaTeX {version}: {len(list(dest.rglob("*")))} entries')
