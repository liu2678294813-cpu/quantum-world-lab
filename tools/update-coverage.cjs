const fs=require('fs'),path=require('path'),vm=require('vm'),root=path.resolve(__dirname,'..'),box={window:{}};vm.createContext(box);
for(const f of ['scenes-a','scenes-b','scenes-c','scenes-d','models','models-more'])vm.runInContext(fs.readFileSync(path.join(root,'src',f+'.js'),'utf8'),box);
const file=path.join(root,'source-notes/coverage.json'),data=JSON.parse(fs.readFileSync(file,'utf8'));
data.source.scope='前七章52个代表性场景；26类模型与结构的289道题目索引；不是逐题求解全部习题，也不包括第八章完整散射理论。';
for(const s of box.window.QS_SCENES){if(data.scenes.some(t=>t.id===s.id))continue;const printed=[...s.source.printed.matchAll(/\d+/g)].map(m=>+m[0]);data.scenes.push({id:s.id,chapter:s.chapter,topic:s.model,relation:'原书模型的明确子情形',anchor:s.source.topic,printed,pdf:printed.map(p=>p+6),objective:s.description});}
data.chapters[0].not_exhaustive=['任意分段势全部匹配','全部非谐变式','虚势吸收','全部绘景计算题'];
data.chapters[3].not_exhaustive=['全部角动量球阱','一般中心势','不同规范的完整推导','所有受碍转子','分子与圆筒束缚态'];
data.chapters[5].not_exhaustive=['任意多自旋矩阵','完整原子精细结构','完整塞曼效应','自旋空间散射'];
fs.writeFileSync(file,JSON.stringify(data,null,2));console.log('Coverage:',data.scenes.length);
