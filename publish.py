"""Build the static GitHub Pages entry and a compact offline download."""
from pathlib import Path
import hashlib,json,subprocess,zipfile
root=Path(__file__).resolve().parent
subprocess.run(['python','build.py'],cwd=root,check=True)
page=(root/'output/量子世界.html').read_bytes()
docs=root/'docs';downloads=docs/'downloads';downloads.mkdir(parents=True,exist_ok=True)
(docs/'index.html').write_bytes(page)
(docs/'.nojekyll').write_text('',encoding='utf-8')
archive=downloads/'quantum-world-offline.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=7) as z:
    z.writestr('量子世界.html',page)
    for name in ['使用说明.md','学习导览.md','小黄书物理模型盘点.md','source-notes/model-question-map.csv','vendor/katex/LICENSE']:
        z.write(root/name,name)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None and z.read('量子世界.html')==page
report={'htmlSHA256':hashlib.sha256(page).hexdigest(),'htmlBytes':len(page),'offlineZipSHA256':hashlib.sha256(archive.read_bytes()).hexdigest(),'offlineZipBytes':archive.stat().st_size}
(docs/'downloads/checksums.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
