/* Figure-by-figure explanations and a source-audited book model index. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;};
function renderLesson(scene){
 const notes=$('figure-notes'),formulas=$('formula');notes.replaceChildren();formulas.replaceChildren();
 notes.append(node('h2','','逐图读懂这个实验'));
 scene.lesson.figures.forEach((f,i)=>{
  const a=node('article','figure-note'),h=node('h3','',f.title),pos=node('span','figure-position',f.where);h.prepend(node('b','figure-index',String(i+1).padStart(2,'0')));a.append(h,pos);
  for(const[label,value]of [['坐标与单位',f.axes],['颜色与符号',f.encoding],['怎样理解',f.read]]){const p=node('p');p.append(node('b','',label+' · '),document.createTextNode(value));a.append(p);}
  const jump=node('button','formula-jump','对照本图公式 ↗');jump.onclick=()=>{const target=$('math-figure-'+i);target.scrollIntoView({behavior:'smooth',block:'center'});target.focus({preventScroll:true});};a.append(jump);notes.append(a);
  const block=node('div','math-figure');block.id='math-figure-'+i;block.tabIndex=-1;block.append(node('h3','',f.title));
  for(const tex of (Array.isArray(f.tex)?f.tex:[f.tex])){const m=node('div','math-display');window.katex.render(tex,m,{displayMode:true,throwOnError:true,strict:false,trust:false,output:'htmlAndMathml'});block.append(m);}
  formulas.append(block);
 });
 const stage=document.querySelector('.canvas-inner');stage.style.setProperty('--stage-height',(scene.stageHeight||480)+'px');
 stage.style.setProperty('--stage-mobile-height',(scene.stageHeight?Math.max(690,scene.stageHeight*1.4):670)+'px');
}
function normalize(scene,p){
 if(scene.normalizeParams)scene.normalizeParams(p);
 if(scene.id==='angular-momentum'){p.m=Math.max(-p.ell,Math.min(p.ell,p.m));scene.controls.find(c=>c.key==='m').bounds=q=>[-q.ell,q.ell];}
 if(scene.id==='ladder'){p.n=Math.max(0,Math.min(p.statistics==='fermion'?1:6,p.n));scene.controls.find(c=>c.key==='n').bounds=q=>[0,q.statistics==='fermion'?1:6];}
 return p;
}
function initCatalog(selectScene){
 const data=window.QS_CATALOG,types={physical:'物理模型族',effective:'有效模型',kinematic:'运动学结构'};
 $('catalog-summary').textContent=`${data.totalQuestions} 道编号题　·　${data.models.length} 类模型与结构　·　${data.namedModelQuestionCount} 题含已标注的物理／有效模型`;
 $('catalog-method').textContent=`统计范围：${data.scope}。统计单位：${data.unit}。${data.method}。按模型族归并后的题目数排序，数值不是词频、分问数或考试命中率；各族可重叠，题数不可相加。另有 ${data.generalOrKinematicQuestionCount} 题以通用理论或运动学结构为主。`;
 const allScenes=window.QS_SCENES;
 function drawCatalog(){
  const query=$('catalog-search').value.trim().toLowerCase(),kind=$('catalog-kind').value;
  const models=data.models.filter(m=>(kind==='all'||m.kind===kind)&&(!query||(m.name+' '+m.note+' '+m.questionIds.join(' ')).toLowerCase().includes(query))).sort((a,b)=>b.count-a.count);
  $('catalog-result').textContent=`显示 ${models.length} / ${data.models.length} 类；展开“原书题号与页码”可逐题定位。`;
  $('catalog-list').replaceChildren();
  for(const m of models){
   const card=node('article','model-card');card.dataset.model=m.id;
   const head=node('div','model-heading'),title=node('h3','',m.name),num=node('strong','model-count',m.count+' 题');head.append(title,num);card.append(head,node('p','model-kind',types[m.kind]+' · 第 '+m.chapters.join('、')+' 章'),node('p','',m.note));
   const links=node('div','model-links');const implemented=m.scenes.map(id=>allScenes.find(s=>s.id===id)).filter(Boolean);
   for(const scene of implemented){const b=node('button','',scene.tabTitle||scene.title);b.dataset.modelScene=scene.id;b.onclick=()=>{selectScene(scene.id);$('catalog-dialog').close();window.scrollTo({top:0,behavior:'smooth'});};links.append(b);}
   if(!implemented.length)links.append(node('span','no-animation','有原书定位与说明；尚无独立动画'));
   else links.append(node('small','','本族代表实验；查看模型条件'));
   card.append(links);
   const refs=node('details','model-refs');refs.append(node('summary','',`原书题号与页码 · ${m.questionIds.length} 题`));
   const list=node('div','question-refs');for(const id of m.questionIds){const q=data.questions.find(q=>q.id===id);list.append(node('span','',`${id}　印 ${q.printed} / PDF ${q.pdf}`));}refs.append(list);card.append(refs);$('catalog-list').append(card);
  }
 }
 $('catalog-search').oninput=drawCatalog;$('catalog-kind').onchange=drawCatalog;
 const open=()=>{$('catalog-dialog').showModal();drawCatalog();};$('catalog-button').onclick=$('catalog-entry').onclick=open;
 $('catalog-download').onclick=()=>{
  const rows=[['题号','章节','印刷页','PDF页','模型族']];for(const q of data.questions)rows.push([q.id,q.chapter,q.printed,q.pdf,data.models.filter(m=>m.questionIds.includes(q.id)).map(m=>m.name).join('；')||'通用理论/算符与运动学结构']);
  const csv='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='小黄书-第1至7章-289题模型对照.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
 };
}
window.QSStudy={renderLesson,normalize,initCatalog};
})();
