const fs=require('fs'),path=require('path'),vm=require('vm'),root=path.resolve(__dirname,'..'),box={window:{}};vm.createContext(box);
for(const f of ['scenes-a','scenes-b','scenes-c','scenes-d','models','models-more','lessons','catalog-data'])vm.runInContext(fs.readFileSync(path.join(root,'src',f+'.js'),'utf8'),box);
const chapters=['薛定谔方程与一维定态问题','力学量算符','表象','三维定态问题','近似方法','自旋','全同粒子体系'],scenes=box.window.QS_SCENES.sort((a,b)=>a.chapter-b.chapter);
let text='# 量子世界交互图谱 · 学习导览\n\n52个实验，103个逐图阅读说明与公式区块。每章以原书为线索，选择可清楚定义初态、哈密顿量、坐标和观测量的代表情形。实验数量依次为12、5、5、11、5、7、7。\n\n原书PDF共446页；第1—7章对应PDF第7—357页。PDF页码=印刷页码+6。出处定位主题与原题，场景可能只取其中明确子情形；并非289题逐题解答。完整模型分布见《小黄书物理模型盘点》。\n\n先辨认每张图的量与单位，再只改变一个参数。位置散点不是轨迹；配置空间不是单粒子的物理平面；自旋箭头不是刚体旋转。每个实验的“模型条件与易误解处”说明具体边界。\n';
for(let ch=1;ch<=7;ch++){text+='\n## 第'+ch+'章 · '+chapters[ch-1]+'\n';for(const s of scenes.filter(s=>s.chapter===ch)){text+='\n### '+s.title+'\n\n入口：`'+s.id+'`；印刷页 '+s.source.printed+' / PDF '+s.source.pdf+'。\n\n'+s.description+'\n\n观察：'+s.observe+'\n\n动手：'+s.experiment+'\n\n适用条件：'+s.caution+'\n\n图像：'+s.lesson.figures.map((f,i)=>(i+1)+'. '+f.title).join('；')+'。\n\n原书对应：'+s.source.topic+'。\n';}}
text+='\n## 覆盖边界\n\n本版扩充了高频模型的代表实验；受碍转子、全部非谐势、完整多电子原子、一般奇异势、自旋通道散射、虚势吸收、Morse、硬壁圆筒等尚无完整独立动画。模型谱中的题号保留这些内容，不用其他模型画面替代。近似法与自旋等章节已有代表场景，但不意味着全部计算技巧和高阶修正都已实现。\n';
fs.writeFileSync(path.join(root,'学习导览.md'),text);
console.log('Wrote 52-scene teaching guide');
