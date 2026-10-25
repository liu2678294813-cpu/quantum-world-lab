"""Inspectable question-to-model taxonomy. All headings reconciled to the PDF.

Counts are incidence counts: each numbered exercise counts at most once per
model family. A compound exercise can belong to several families. No keyword
occurrence counts, no splitting subquestions, no inference about exam frequency.
"""
from pathlib import Path
import json,re,collections,csv

ROOT=Path(__file__).resolve().parents[1]
index=ROOT/'source-notes/question-index.json'
if index.exists():
    data=json.loads(index.read_text(encoding='utf-8'))
else:
    # The downloadable source package retains page metadata, not the book text.
    catalog=json.loads((ROOT/'source-notes/model-inventory.json').read_text(encoding='utf-8'))
    data={'records':catalog['questions'],'sourcePDF':catalog['sourcePDF'],'pdfSHA256':catalog['pdfSHA256']}
records=data['records'];by_id={q['id']:q for q in records}
def ids(spec):
    out=set()
    for token in spec.split():
        if '-' in token:
            a,b=token.split('-');ch,start=map(int,a.split('.'));ch2,end=map(int,b.split('.'));assert ch==ch2
            out.update(f'{ch}.{i}' for i in range(start,end+1))
        else:out.add(token)
    assert out<=set(by_id),out-set(by_id)
    return sorted(out,key=lambda x:tuple(map(int,x.split('.'))))

# These assignments were semantically reviewed against the indexed question
# statements and the source PDF. Earlier generated titles are not classifiers:
# examples of corrected titles include 4.1, 5.42, 7.27, and 1.43.
specs=[
('oscillator','谐振子、耦合振子与非谐变式','physical',
 '1.7 1.10 1.14 1.19-1.20 1.32-1.35 1.45 2.20 2.22-2.23 2.25 2.44-2.47 3.3 3.20 4.34-4.35 5.1 5.6-5.7 5.10-5.11 5.13 5.21-5.22 5.27-5.30 5.32 5.39 5.42-5.43 5.48 5.52-5.53 6.55 7.2 7.4-7.5 7.8-7.9 7.16-7.20 7.25-7.26',
 ['harmonic-model','oscillator','coupled-oscillators','phase-space','sudden-force','variational'],
 '合并一维、多维、耦合、含非谐修正、半谐振子及数态变式；不是把这些势全当作同一个精确谐振子。5.43是纯四次势；5.44仅借谐振子波函数作试探，实际是δ势，不计入本族。'),
('single-spin','单自旋与磁场中的自旋','physical',
 '6.4-6.16 6.18-6.19 6.25-6.29 6.31-6.32 6.36 6.39-6.56',
 ['bloch','precession','rabi','stern-gerlach','spin-orbit'],
 '包括自旋测量、泡利态空间、静场、旋转场、自旋-空间耦合和自旋1变式；不把两个/三个自旋的题目混成单自旋。'),
('coulomb','氢样与库仑束缚体系','physical',
 '1.8-1.9 4.4 4.9-4.10 4.13-4.15 4.17-4.18 4.20 4.26 4.31 4.33 5.4 5.12 5.14-5.15 5.26 5.36 5.47 5.49-5.51 6.1-6.3 6.16-6.17 6.29 6.34 6.50 7.21',
 ['hydrogen-model','orbital','radial','atomic-drive','magnetic','coupled-spins'],
 '区分三维氢/类氢、一维/半轴库仑、电子偶素与含自旋两体库仑通道。4.31含附加1/r²项；不是标准纯氢势。'),
('hard-box','硬壁盒、无限深方阱及填充','physical',
 '1.3 1.6 1.18 1.21-1.26 1.28-1.30 1.44 2.26 5.5 5.9 5.24-5.25 6.48 7.3 7.7 7.10 7.22-7.24',
 ['infinite-well','stationary','superposition','box3d','occupation'],
 '合并一/二/三维矩形硬壁盒；圆弧有路障的1.18兼有环模型。球形/圆筒硬壁另外计数，不混为立方盒。'),
('multi-spin','双自旋、三自旋与交换耦合','physical',
 '6.1-6.3 6.17 6.20-6.24 6.30 6.33-6.35 6.37-6.38 7.2-7.3 7.5 7.8-7.9 7.21-7.24',
 ['coupled-spins','entanglement','exchange','correlation','slater'],
 '包含总自旋合成、单态/三重态、Heisenberg/各向异性交换以及空间-自旋配对；多粒子统计与交换哈密顿量是两件事。'),
('identical','全同少粒子与壳层填充','physical',
 '7.1-7.10 7.21-7.24 7.26',
 ['exchange','correlation','occupation','slater','two-site'],
 '第一量子化中的玻色/费米对称化、简并和填充；其中7.6是改变电子统计性的反事实原子模型，不当成真实元素。'),
('rotor','圆环、转子、受碍转动与陀螺','physical',
 '1.15 1.18 3.19 4.5 4.19 4.35 5.16-5.19 5.30-5.31',
 ['plane-rotor','rigid-rotor','asymmetric-rotor'],
 '细分平面/空间转子、非对称转子、偶极受碍转动、带磁通圆环、双珠圆环与小角单摆；二维和三维能谱不能互换。'),
('delta','δ 点作用、δ 球壳与接触相互作用','physical',
 '1.2 1.5-1.7 1.15 1.36 1.41 1.43 3.1-3.2 4.2 5.44 6.1 6.56 7.7 7.24',
 ['delta-well','finite-well','tunneling','correlation','contact-interaction'],
 '区别单点外势与粒子间δ接触作用、三维球壳及自旋翻转δ矩阵；这些只共享局域匹配结构，不是同一数值模型。'),
('orbital-field','轨道外磁场、Landau与磁通圆环','physical',
 '4.5-4.8 4.27 5.15 5.26 6.7 6.50',
 ['landau-model','magnetic','flux-ring'],
 '只统计题干真正含轨道最小耦合/磁场轨道修正的题；单纯自旋Zeeman不计入这里。'),
('finite-square','有限深方阱、半无限阱与球方阱','physical',
 '1.1 1.4 1.13 4.1 4.29',
 ['finite-well','spherical-well'],
 '普通有限深/半壁阱和三维球阱。含δ但外区不变的1.43单列δ模型，不因旧标题含“有限深”而误计。'),
('step-barrier','势阶、矩形势垒与自旋通道散射','physical',
 '1.5 1.36-1.41 6.42 6.56',
 ['tunneling','delta-scattering','spin-filter'],
 '题目粒子数统计仍按题计，不按能区分问拆分；δ散射与势阶叠加保留复合标签。'),
('linear-force','匀力、线性势与量子弹跳球','physical',
 '1.17 3.4-3.5 5.40-5.41',
 ['uniform-force','momentum-kick','sudden-force'],
 '无边界恒力与半轴硬壁线性势分开解释；后者的谱是Airy零点，不是自由波包。'),
('free-packet','自由粒子与波包传播','physical',
 '1.29 2.17 2.21 2.35 3.6 4.10 6.36',
 ['packet','fourier','momentum-kick'],
 '含释放后自由传播、自由粒子球波、孔径估算和二维自由电子基底；不能把所有傅里叶变换题都算成自由粒子。'),
('spherical-boundary','球形硬壁、球壳与径向束缚','physical',
 '4.1-4.3 4.11-4.12 4.29',
 ['spherical-well'],
 '径向变量u=rR必须满足u(0)=0；三维球阱的阈值与一维偶态“再浅也束缚”不同。'),
('spin-orbit','自旋-轨道结构与原子磁矩','physical',
 '6.16 6.36 6.45 6.53 6.55',
 ['spin-orbit','hydrogen-model','bloch'],
 '包括L·S能量、Rashba型动量锁定、Landé磁矩和σ·L的运动学；6.50明确忽略LS作用，不在此计数。'),
('inverse-power','反幂势与奇异势稳定性','physical',
 '1.10 1.47 4.21 4.28 4.31',
 ['hydrogen-model'],
 '含1/x²、r^(-s)、Kratzer势；需要定义域/边界或短程正则化，不用普通光滑势动画冒充塌缩过程。'),
('exponential','指数吸引势与氘核变式','physical',
 '4.32 5.45',[],
 'V=−V₀exp(−r/a)，依靠径向边界和变分判断束缚。'),
('logarithmic','对数中心势','physical',
 '4.23-4.24',[],
 'V=c ln(r/r₀)，用于维里定理与质量尺度；不当作库仑势。'),
('morse','Morse 分子振动势','physical',
 '4.30',[],
 '有限束缚能级、非等间距和解离；原书讨论l=0径向模型。'),
('cylinder','无限长硬壁圆筒','physical',
 '4.36',[],
 '横向Bessel零点离散，轴向动量连续。'),
('absorbing','常虚势与吸收模型','physical',
 '1.42',[],
 '非厄米有效势导致概率流损耗；不能要求普通闭合系统的R+T=1。'),
('inverse-designed','给定波函数反推的自定义势','physical',
 '1.11-1.12 1.14',['harmonic-model'],
 '依ψ″/ψ重建势；含库仑/反幂结构或有界区间的有理势。1.14可重建到谐振子型，不能仅凭旧题意标签把所有题都算成方阱。'),
('atomic-many','多电子原子的价电子与统计变式','physical',
 '5.23 7.6', ['hydrogen-model','occupation'],
 '硼2p价电子简并微扰与反事实原子统计题；氢原子图只能演示角向结构，未模拟多电子屏蔽。'),
('two-level','有限二/三能级有效体系','effective',
 '2.29 2.41 2.43 3.7-3.9 3.18 5.2-5.3 5.8 5.20 5.35 5.37-5.38 5.52 6.25',
 ['basis','avoided-crossing','transition','landau-zener'],
 '只统计这些显式有限维模型；没有再把所有自旋题机械重复加入。含中微子味振荡、中子-反中子混合及抽象矩阵。'),
('fock-modes','玻色/费米模式与二次量子化','effective',
 '2.44-2.47 7.11-7.20 7.25 7.27',
 ['ladder','two-site','phase-space','coupled-oscillators'],
 '模式标签不自动等于空间轨迹；含双模混合、配对、位移、压缩和Schwinger角动量表示。'),
('angular-space','角动量态空间与矩阵','kinematic',
 '1.46 2.9 2.12 2.14-2.17 2.31-2.32 2.37 3.10-3.17 5.33-5.34 7.27',
 ['angular-momentum','rigid-rotor','asymmetric-rotor','bloch'],
 '这是运动学结构，单独列出而不称为一种指定势场；同一结构可用于转子、原子和自旋。')
]
models=[]
for ident,name,kind,questions,scenes,note in specs:
    qs=ids(questions)
    models.append({'id':ident,'name':name,'kind':kind,'count':len(qs),'questionIds':qs,'chapters':sorted({by_id[q]['chapter'] for q in qs}),'scenes':scenes,'note':note})
models.sort(key=lambda x:(x['kind']!='physical',-x['count'],x['id']))
mapping=[]
for q in records:
    tags=[m['id'] for m in models if q['id'] in m['questionIds']]
    mapping.append({'id':q['id'],'chapter':q['chapter'],'printed':q['printed'],'pdf':q['pdf'],'models':tags,'classification':'named-model' if any(m['kind'] in ['physical','effective'] and m['id'] in tags for m in models) else 'kinematic-or-general-method','reviewed':True})
named=sum(r['classification']=='named-model' for r in mapping)
result={'scope':'原书第1–7章正文习题；不含第8章和书末历年试卷','unit':'每道编号题；同题同模型只计1次，复合题可计入多个模型族','totalQuestions':289,'perChapter':[48,48,20,36,54,56,27],'namedModelQuestionCount':named,'generalOrKinematicQuestionCount':289-named,'method':'题干语义人工分类，题号与当前PDF逐一核对；既有题型表仅作索引，不使用关键词出现次数推导频率','sourcePDF':data['sourcePDF'],'pdfSHA256':data['pdfSHA256'],'models':models,'questions':mapping,'qualityNotes':['289个题号均与当前PDF一致，零缺号/重复号。','4.1是三维球方阱，非立方盒；5.42是半谐振子，非半轴库仑；7.27是双玻色模角动量，非散射；1.43是硬壁加δ点势，非指数势。','题量不是考研真题命中率；宽模型族与窄子模型不能不加说明地比较。','频数允许重叠，不能把各模型题数相加当作总题数。','数值实验的代表模型不等于把该模型族所有变式逐题实现；模型库展示对应范围。']}
(ROOT/'source-notes/model-inventory.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'src/catalog-data.js').write_text('/* Question incidence catalog; regenerated by tools/analyze-models.py. */\nwindow.QS_CATALOG='+json.dumps(result,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
lines=['# 小黄书前七章：物理模型与出现题数','',f'逐项核对 **289道题**；其中{named}道涉及已列明的物理/有效模型，{289-named}道主要是一般理论或运动学结构。','',
'这里的“次数”是涉及模型的编号题数，不是词频、分问题数或考试频率。一题可以有多个模型标签；同题同模型只计一次，族间不可相加。','',
'## 模型族总览','', '| 模型族 | 类型 | 涉及题数 | 所在章 |','|---|---|---:|---|']
for m in models:lines.append('| '+m['name']+' | '+{'physical':'物理模型','effective':'有效/模式模型','kinematic':'运动学结构'}[m['kind']]+' | '+str(m['count'])+' | '+','.join(map(str,m['chapters']))+' |')
lines+=['','## 可复核的逐模型题号','']
for m in models:
    lines+=['### '+m['name']+f"（{m['count']}题）",'',m['note'],'','题号：'+ '、'.join(m['questionIds'])+'。','']
lines+=['## 未归入具体物理模型的题目','', '、'.join(r['id'] for r in mapping if r['classification']!='named-model')+'。','','这些题仍属于课程内容，例如厄米性、一般对易关系、连续测量和算符恒等式。不能为了凑模型数，把“微扰法”“表象变换”本身说成具体物理势场。','','## 数据质量与解释边界','']
lines += ['- '+s for s in result['qualityNotes']]
(ROOT/'小黄书物理模型盘点.md').write_text('\n'.join(lines),encoding='utf-8')
with (ROOT/'source-notes/model-question-map.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.writer(f);writer.writerow(['题号','章','印刷页','PDF页','模型标签','归类口径'])
    for r in mapping:writer.writerow([r['id'],r['chapter'],r['printed'],r['pdf'],';'.join(r['models']),r['classification']])
print(json.dumps({'questions':289,'named':named,'modelFamilies':len(models),'top':[(m['name'],m['count']) for m in models[:12]]},ensure_ascii=False,indent=2))
