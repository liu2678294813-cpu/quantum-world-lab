/* Physical operations for Chapters 5–7. Dimensionless hbar = m = 1. */
(() => {
  'use strict';
  const PI = Math.PI, TAU = 2 * PI;
  const C = { blue:'#76a9ff', purple:'#b29aff', gold:'#efc77b', pink:'#ee91b8', text:'#e8ecfa', muted:'#909bb7', grid:'#222b43' };
  const clip = (x,a=0,b=1) => Math.max(a,Math.min(b,x)), f = (x,n=3) => Number(x).toFixed(n), pct = x => `${f(x*100,1)}%`;
  const metric = (label,value) => ({label,value});
  const range = (key,label,min,max,step,value,unit='') => ({key,label,min,max,step,value,unit});
  const select = (key,label,items,value) => ({key,label,options:items.map(([value,label])=>({value,label})),value});
  const source = (printed,topic) => ({printed:String(printed),pdf:String(printed+6),topic});
  function text(c,s,x,y,color=C.muted,size=13,align='left') {c.save();c.fillStyle=color;c.font=`${size}px "Microsoft YaHei",sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y);c.restore();}
  function line(c,x1,y1,x2,y2,color=C.grid,width=1,dash=[]) {c.save();c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.restore();}
  function path(c,pts,color,width=2,dash=[]) {c.save();c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.setLineDash(dash);c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();c.restore();}
  function dot(c,x,y,r,color) {c.save();c.fillStyle=color;c.shadowBlur=14;c.shadowColor=color;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
  function title(c,s,x,y,width) {text(c,s,x,y,C.text,14);line(c,x,y+18,x+width,y+18);}
  function graph(c,x,y,w,h,xmin,xmax,ymin,ymax,curves,xlabel='',ylabel='') {
    const X=u=>x+(u-xmin)*w/(xmax-xmin),Y=u=>y+h-(u-ymin)*h/(ymax-ymin);
    const yDigits=Math.max(1,Math.min(4,1-Math.floor(Math.log10(ymax-ymin))));
    for(let i=0;i<=4;i++){const xx=x+w*i/4,yy=y+h*i/4;line(c,xx,y,xx,y+h,C.grid,.75);line(c,x,yy,x+w,yy,C.grid,.75);text(c,f(xmin+(xmax-xmin)*i/4,1),xx,y+h+18,C.muted,11,'center');text(c,f(ymax-(ymax-ymin)*i/4,yDigits),x-9,yy,C.muted,11,'right');}
    if(ymin<0&&ymax>0)line(c,x,Y(0),x+w,Y(0),'#59647c');if(xmin<0&&xmax>0)line(c,X(0),y,X(0),y+h,'#59647c');
    text(c,xlabel,x+w,y+h+39,C.muted,12,'right');text(c,ylabel,x,y-17,C.muted,12);
    c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
    curves.forEach(q=>{const pts=Array.from({length:361},(_,i)=>{const u=xmin+(xmax-xmin)*i/360;return[X(u),Y(q.fn(u))]});if(q.fill){c.fillStyle=`${q.color}20`;c.beginPath();c.moveTo(pts[0][0],Y(Math.max(ymin,0)));pts.forEach(p=>c.lineTo(...p));c.lineTo(pts.at(-1)[0],Y(Math.max(ymin,0)));c.closePath();c.fill();}path(c,pts,q.color,q.width||2,q.dash||[]);});c.restore();return{X,Y};
  }
  function columns(w,h) {return w>=660?{ax:58,ay:95,aw:w*.53-65,ah:h-178,bx:w*.59,by:95,bw:w*.36,bh:h-178,wide:true}:{ax:52,ay:88,aw:w-84,ah:(h-292)*.48,bx:52,by:(h-292)*.48+205,bw:w-84,bh:(h-292)*.52,wide:false};}
  function legend(c,items,x,y,spacing){items.forEach(([s,color,dash],i)=>{line(c,x+i*spacing,y,x+i*spacing+20,y,color,2,dash?[4,4]:[]);text(c,s,x+i*spacing+28,y,C.muted,11);});}

  const LZ_T=24,LZ_STEPS=12000;
  // Exact SU(2) exponential for a constant Hamiltonian at the interval midpoint.
  function lzStep(state,s,dt,v,g) {
    const z=v*(s+dt/2),r=Math.hypot(z,g);if(!r)return state.slice();
    const a=r*dt/2,co=Math.cos(a),sn=Math.sin(a),nx=g/r,nz=z/r,[ar,ai,br,bi]=state;
    const kar=nz*ar+nx*br,kai=nz*ai+nx*bi,kbr=nx*ar-nz*br,kbi=nx*ai-nz*bi;
    return[co*ar+sn*kai,co*ai-sn*kar,co*br+sn*kbi,co*bi-sn*kbr];
  }
  function lzDiagnostics(state,s,v,g) {
    const[ar,ai,br,bi]=state,p0=ar*ar+ai*ai,p1=br*br+bi*bi,norm=p0+p1,rx=2*(ar*br+ai*bi),rz=p0-p1,z=v*s,r=Math.hypot(z,g),projection=r?(g*rx+z*rz)/r:0;
    return{a:[ar,ai],b:[br,bi],norm,p0,p1,pGround:r?clip((norm-projection)/2):null,pExcited:r?clip((norm+projection)/2):null,gap:r,energy:(g*rx+z*rz)/2};
  }
  let lzCache=null;
  function lzTrajectory(v,g,T=LZ_T,steps=LZ_STEPS) {
    const key=`${v}|${g}|${T}|${steps}`;if(lzCache?.key===key)return lzCache;
    const dt=2*T/steps,z=-v*T,r=Math.hypot(z,g);
    let state=r?[Math.sqrt((1-z/r)/2),0,-Math.sign(g||1)*Math.sqrt((1+z/r)/2),0]:[1,0,0,0];
    const times=new Float64Array(steps+1),states=new Float64Array((steps+1)*4),ground=new Float64Array(steps+1);let maxNormError=0;
    for(let i=0;i<=steps;i++){const s=-T+i*dt;times[i]=s;states.set(state,i*4);const d=lzDiagnostics(state,s,v,g);ground[i]=d.pGround??.5;maxNormError=Math.max(maxNormError,Math.abs(d.norm-1));if(i<steps)state=lzStep(state,s,dt,v,g);}
    lzCache={key,v,g,T,steps,dt,times,states,ground,maxNormError};return lzCache;
  }
  function lzState(t,v,g,T=LZ_T,steps=LZ_STEPS) {
    const tr=lzTrajectory(v,g,T,steps),time=clip(t,0,2*T),i=Math.min(steps,Math.floor(time/tr.dt)),s0=-T+i*tr.dt,remainder=time-i*tr.dt;
    let state=Array.from(tr.states.slice(i*4,i*4+4));if(remainder>1e-12)state=lzStep(state,s0,remainder,v,g);
    return{t:time,s:time-T,...lzDiagnostics(state,time-T,v,g),maxNormError:tr.maxNormError,dt:tr.dt};
  }
  function sgState(t,F,sigma0,theta) {
    const sigma=Math.sqrt(sigma0*sigma0+t*t/(4*sigma0*sigma0)),center=F*t*t/2,weightUp=Math.cos(theta/2)**2,weightDown=Math.sin(theta/2)**2;
    return{sigma,centerUp:center,centerDown:-center,pUp:F*t,pDown:-F*t,weightUp,weightDown,meanPosition:center*(weightUp-weightDown),separation:2*center};
  }
  function sgDensity(z,t,F,sigma0,theta) {
    const a=sgState(t,F,sigma0,theta),gaussian=mu=>Math.exp(-((z-mu)**2)/(2*a.sigma*a.sigma))/(Math.sqrt(2*PI)*a.sigma),up=a.weightUp*gaussian(a.centerUp),down=a.weightDown*gaussian(a.centerDown);return{up,down,total:up+down};
  }
  function twoSiteState(t,J,fermion=false) {
    const q=2*J*t,co=fermion?1:Math.cos(q),sn=fermion?0:Math.sin(q)/Math.SQRT2,amplitudes=[[0,sn],[co,0],[0,sn]],probabilities=amplitudes.map(([re,im])=>re*re+im*im),norm=probabilities.reduce((a,b)=>a+b,0),meanLeft=2*probabilities[0]+probabilities[1],meanRight=probabilities[1]+2*probabilities[2];
    return{amplitudes,probabilities,norm,meanLeft,meanRight,totalN:meanLeft+meanRight};
  }
  window.QSPhysicsD={lzStep,lzTrajectory,lzState,sgState,sgDensity,twoSiteState,LZ_T,LZ_STEPS};
  const scenes=[];
  scenes.push({
    id:'landau-zener',chapter:5,title:'真的扫过简并点：态会跟上吗？',subtitle:'实际求解二能级含时演化，而非浏览瞬时本征态',
    operation:'把两条裸能级的相对偏置从负值连续扫到正值，同时保留固定耦合。',
    implementation:'二能级原子或人工量子比特中，用可控电场、磁场或驱动改变失谐；这里用线性扫场的有效哈密顿量。',
    response:'慢扫时实际量子态近似跟随低能支；快扫时保留较多原来的裸态成分，最终落到高能支。',
    description:'开始时把体系准备在 s=−24 的低能本征态。接着真正演化薛定谔方程，看能级在变，实际的量子态是否来得及跟随。',
    formula:'i ∂ₛ|ψ⟩ = ½(vs σz + g σx)|ψ⟩；s = t−24；E±(s) = ±½√((vs)²+g²)',
    explanation:'左图是瞬时能级，右图是实际演化态投影到当时本征态后的占据。两者来自不同计算：能级由瞬时矩阵对角化得到，实际态则逐步求解含时薛定谔方程。控制慢快的是 g²/v。扫场越慢、最小能隙越大，越容易保持在低能支。',
    observe:'看右图的低能支占据是否接近1。快扫时，本征态的主要裸态成分已经互换，实际态却来不及完全转换。',
    experiment:'先取 v=0.25、g=1.2，播放到终点；再取 v=3、g=0.3，比较最终高能支概率。回拖时间条可复查同一次演化。',
    caution:'有限扫场窗口 s∈[−24,+24]，初态是有限起点的精确低能态，不直接套用无穷远Landau–Zener公式。数值用12000步中点SU(2)指数传播，每步保持幺正；仍有时间离散误差。到终点暂停，再次从头播放表示重新准备初态。',
    source:source(172,'简并子空间与含时微扰的延伸；实际扫场为显式二能级模型的数值演化'),
    controls:[range('v','扫场速率 v',.25,3,.05,.65),range('g','最小能隙 g',.1,1.5,.02,.8)],duration:48,loop:false,
    metrics(t,p){const a=lzState(t,p.v,p.g);return[metric('实际低能支占据',pct(a.pGround)),metric('实际高能支占据',pct(a.pExcited)),metric('物理扫场时间 s',f(a.s,2)),metric('最大归一化误差',a.maxNormError.toExponential(1))];},
    render(c,w,h,t,p){const b=columns(w,h),a=lzState(t,p.v,p.g),tr=lzTrajectory(p.v,p.g),em=Math.hypot(p.v*24,p.g)/2*1.05;
      title(c,'瞬时能级与当前扫场位置',b.ax,31,b.aw);title(c,'实际态在瞬时本征基中的占据',b.bx,b.wide?31:b.by-49,b.bw);
      const gg=graph(c,b.ax,b.ay,b.aw,b.ah,-24,24,-em,em,[{fn:s=>-Math.hypot(p.v*s,p.g)/2,color:C.blue},{fn:s=>Math.hypot(p.v*s,p.g)/2,color:C.gold}], '物理时间 s','能量 E');
      line(c,gg.X(a.s),b.ay,gg.X(a.s),b.ay+b.ah,'#9ca9c477',1,[3,5]);dot(c,gg.X(a.s),gg.Y(-a.gap/2),3+5*a.pGround,C.blue);dot(c,gg.X(a.s),gg.Y(a.gap/2),3+5*a.pExcited,C.gold);
      const sample=(s,excited)=>{const i=Math.max(0,Math.min(tr.steps,Math.round((s+24)/tr.dt)));return excited?1-tr.ground[i]:tr.ground[i];};
      const gr=graph(c,b.bx,b.by,b.bw,b.bh,-24,24,0,1.05,[{fn:s=>sample(s,false),color:C.blue},{fn:s=>sample(s,true),color:C.gold}], '物理时间 s','占据概率');
      c.save();c.fillStyle='#0b1222b0';c.fillRect(gr.X(a.s),b.by,b.bx+b.bw-gr.X(a.s),b.bh);c.restore();line(c,gr.X(a.s),b.by,gr.X(a.s),b.by+b.bh,'#c3cde477',1,[3,5]);dot(c,gr.X(a.s),gr.Y(a.pGround),4,C.blue);dot(c,gr.X(a.s),gr.Y(a.pExcited),4,C.gold);
      legend(c,[['低能支',C.blue],['高能支',C.gold]],b.ax,h-22,125);if(b.wide)text(c,`s=t−24；Δs=${f(tr.dt,3)}；有限窗口`,b.bx,h-22,C.muted,11);
    }
  });
  scenes.push({
    id:'stern-gerlach',chapter:6,title:'非均匀磁场把自旋变成空间分束',subtitle:'空间波包真的移动和展宽；自旋测量尚未发生',
    operation:'让一束中性原子穿过具有恒定轴向梯度、带强偏置场的磁场区域。',
    implementation:'用两个有效磁矩态近似中性原子的内部自旋，以一维轴向模型表示Stern–Gerlach磁场。',
    response:'两个正交自旋分量受到相反的力，概率包中心分别加速到 ±Ft²/2，同时自由展宽，形成位置与自旋关联。',
    description:'初态是同一个高斯空间波包乘上自旋叠加态。磁场梯度使两部分向相反方向加速分离，屏幕尚未探测它们。',
    formula:'H = pz²/2 − Fzσz；z± = ±Ft²/2；σt² = σ₀² + t²/(4σ₀²)；ρ = |c₊|²ρ₊ + |c₋|²ρ₋',
    explanation:'两支高斯分别是恒力哈密顿量的解析解。它们的空间密度按初始自旋权重相加，因为两个内部自旋态彼此正交，不添加空间干涉交叉项。即使两支仍重叠，整个系统也可处于相干的空间—自旋纠缠态；分束本身不是把态直接投影为某个测量结果。',
    observe:'让初态极角为90°，两支权重相等。改变初态角度只改变两支权重；改变梯度力则改变它们的加速度和间距。左图横轴会随展宽自动缩放，请同时看刻度。',
    experiment:'先取F=0.25、θ=90°，观察中心间距是否按t²增长；再把θ调到0°，检查是否只剩一支。最后减小σ₀，观察自由展宽反而变快。',
    caution:'中性原子的有效两态、一维恒梯度、强偏置场近似；忽略真实磁场的横向分量、自旋翻转、磁场入口边缘效应。实际Maxwell磁场不能只有随z变化的单独Bz分量。右图以飞行时间代替纵向位置，只显示横向概率密度，曲线是概率中心而非单原子轨道；本页无探测器或坍缩。',
    source:source(280,'习题6.29：Stern–Gerlach分束与自由电子困难；空间自旋波函数学习要点'),
    controls:[range('F','有效梯度力 F',.05,.5,.01,.25),range('sigma','初始位置标准差 σ₀',.5,1.5,.02,1),range('theta','初态自旋极角 θ',0,180,1,90,'°')],duration:8,loop:false,
    metrics(t,p){const a=sgState(t,p.F,p.sigma,p.theta*PI/180);return[metric('两支中心间距',f(a.separation,2)),metric('单支宽度 σt',f(a.sigma,2)),metric('上支总权重',pct(a.weightUp)),metric('下支总权重',pct(a.weightDown))];},
    render(c,w,h,t,p){const b=columns(w,h),theta=p.theta*PI/180,a=sgState(t,p.F,p.sigma,theta),span=Math.max(4*p.sigma,a.centerUp+3.2*a.sigma),ymax=1/(Math.sqrt(2*PI)*a.sigma)*1.15;
      title(c,'同一时刻的横向位置概率密度',b.ax,31,b.aw);title(c,'穿过磁场时的概率束形状',b.bx,b.wide?31:b.by-49,b.bw);
      const gg=graph(c,b.ax,b.ay,b.aw,b.ah,-span,span,0,ymax,[{fn:z=>sgDensity(z,t,p.F,p.sigma,theta).total,color:C.text,width:2.5},{fn:z=>sgDensity(z,t,p.F,p.sigma,theta).up,color:C.blue,fill:true},{fn:z=>sgDensity(z,t,p.F,p.sigma,theta).down,color:C.pink,fill:true}],'分束坐标 z','位置概率密度');
      for(const[mu,color,weight]of[[a.centerUp,C.blue,a.weightUp],[a.centerDown,C.pink,a.weightDown]])if(weight>1e-8){line(c,gg.X(mu),b.ay,gg.X(mu),b.ay+b.ah,`${color}77`,1,[3,4]);dot(c,gg.X(mu),gg.Y(weight/(Math.sqrt(2*PI)*a.sigma)),3.5,color);}
      const maxstate=sgState(8,p.F,p.sigma,theta),zmax=maxstate.centerUp+3*maxstate.sigma,nx=110,ny=90,cv=document.createElement('canvas');cv.width=nx;cv.height=ny;const tmp=cv.getContext('2d'),im=tmp.createImageData(nx,ny);
      for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const tt=8*(i+.5)/nx,z=zmax*(1-2*(j+.5)/ny),d=sgDensity(z,tt,p.F,p.sigma,theta),fade=tt<=t?1:.07,up=Math.sqrt(clip(d.up*4))*fade,dn=Math.sqrt(clip(d.down*4))*fade,k=(j*nx+i)*4;im.data[k]=10+100*up+215*dn;im.data[k+1]=17+145*up+110*dn;im.data[k+2]=32+220*up+140*dn;im.data[k+3]=255;}tmp.putImageData(im,0,0);c.drawImage(cv,b.bx,b.by,b.bw,b.bh);
      for(const sign of[-1,1])path(c,Array.from({length:121},(_,i)=>{const tt=8*i/120;return[b.bx+b.bw*tt/8,b.by+b.bh/2-sign*p.F*tt*tt/2/(2*zmax)*b.bh]}),sign===1?'#76a9ff77':'#ee91b877',1,[3,5]);
      line(c,b.bx+b.bw*t/8,b.by,b.bx+b.bw*t/8,b.by+b.bh,C.gold,1.5);for(let i=0;i<=4;i++)text(c,String(i*2),b.bx+b.bw*i/4,b.by+b.bh+18,C.muted,11,'center');text(c,'飞行时间 t',b.bx+b.bw,b.by+b.bh+39,C.muted,12,'right');text(c,'+z',b.bx-10,b.by+9,C.muted,11,'right');text(c,'−z',b.bx-10,b.by+b.bh-8,C.muted,11,'right');
      legend(c,[['上自旋分量',C.blue],['下自旋分量',C.pink],['总密度',C.text]],b.ax,h-22,w<660?(w-73)/3:145);if(b.wide)text(c,'左图横轴随展宽自动缩放',b.bx,h-22,C.muted,11);
    }
  });
  scenes.push({
    id:'two-site',chapter:7,title:'打开双阱之间的隧穿通道',subtitle:'同样从一边一个开始，玻色与费米的响应不同',
    operation:'先在左右两个局域模式各准备一个粒子，再降低中间势垒，打开隧穿耦合J。',
    implementation:'把双阱限制为左右两个低能模式，忽略模式内部激发和粒子间相互作用；使用固定N=2的两模哈密顿量。',
    response:'玻色态在|1,1⟩与同阱双占据的叠加态之间振荡；同自旋费米子因两个完整模式都已占据，隧穿被泡利原则阻塞。',
    description:'这一次不是让粒子寻找零温平衡，而是突然打开隧穿后，真实演化已经准备好的双粒子态。',
    formula:'H = −J(a†b + b†a)；|ψB(t)⟩ = cos(2Jt)|1,1⟩ + i sin(2Jt)(|2,0⟩+|0,2⟩)/√2',
    explanation:'玻色子基底按|2,0⟩、|1,1⟩、|0,2⟩排列，隧穿矩阵元含√2因子。从|1,1⟩出发，P₁₁=cos²(2Jt)，P₂₀=P₀₂=sin²(2Jt)/2。左右平均占有数始终各为1，但两粒子同阱还是分居的关联在改变。相同自旋费米子的两模空间只有|1,1⟩，跃迁到双占据态被禁止。',
    observe:'看底部三种占据结果的概率如何交换；它们是同一个叠加态的三个分量，不是三个实验世界里同时存在的六个粒子。',
    experiment:'选择玻色子，拖到t=π/(4J)，检查分居概率是否变成0、两个同阱结果是否各为1/2。切换同自旋费米子，观察固定N=2时的阻塞。',
    caution:'理想无相互作用两模式模型；每个模式包含完整的自旋状态。费米阻塞针对两个相同自旋模式已各占一个的情况，不泛化到含其他空模式、相反自旋或相互作用的实际体系。光点表示可能测得的占有数，不是粒子轨道。',
    source:{printed:'313–314；346–347',pdf:'319–320；352–353',topic:'占有数与玻色/费米代数；7.25两模耦合哈密顿量的动力学与统计扩展'},
    controls:[range('J','隧穿耦合 J',.1,1.5,.02,.6),select('statistics','粒子统计',[['boson','玻色子'],['fermion','同自旋费米子']],'boson')],duration:16,
    metrics(t,p){const a=twoSiteState(t,p.J,p.statistics==='fermion');return[metric('分居 P₁₁',pct(a.probabilities[1])),metric('同阱总概率',pct(a.probabilities[0]+a.probabilities[2])),metric('⟨n左⟩ / ⟨n右⟩',`${f(a.meanLeft,1)} / ${f(a.meanRight,1)}`),metric('总粒子数',f(a.totalN,0))];},
    render(c,w,h,t,p){const a=twoSiteState(t,p.J,p.statistics==='fermion'),wide=w>=660;
      title(c,'降低势垒后，改变的是占据关联',36,31,w-72);
      const gx=55,gy=90,gw=w-90,gh=wide?h*.34:h*.28;
      const gr=graph(c,gx,gy,gw,gh,-2,2,0,3,[{fn:x=>Math.min(3,(x*x-1)**2)*(1-.15*Math.min(p.J,1.5)),color:'#72809e'}],'双阱示意坐标','势阱示意（非定量）');
      for(const[x,name]of[[-1,'左模式 a'],[1,'右模式 b']]){dot(c,gr.X(x),gr.Y(.2),7,C.purple);text(c,name,gr.X(x),gr.Y(.5),C.text,13,'center');}
      const mid=gr.X(0);line(c,mid-30,gr.Y(.9),mid+30,gr.Y(.9),C.gold,2);text(c,`J = ${f(p.J,2)}`,mid,gr.Y(1.4),C.gold,13,'center');
      const yy=gy+gh+86,rowh=Math.max(72,h-yy-40),cardw=(w-90)/3,start=45,labels=['|2,0⟩','|1,1⟩','|0,2⟩'],counts=[[2,0],[1,1],[0,2]],colors=[C.purple,C.blue,C.pink];
      for(let i=0;i<3;i++){const x=start+i*cardw,prob=a.probabilities[i],cw=cardw-12;c.fillStyle=`rgba(${i===0?'178,154,255':i===1?'118,169,255':'238,145,184'},${.035+.16*prob})`;c.fillRect(x,yy,cw,rowh);text(c,labels[i],x+cw/2,yy+20,C.text,17,'center');text(c,pct(prob),x+cw/2,yy+rowh-19,colors[i],19,'center');
        const dy=yy+Math.min(rowh*.5,68),r=Math.min(4.5,cardw/28);for(let site=0;site<2;site++){const sx=x+cw*(site===0?.31:.69);line(c,sx-cw*.12,dy+9,sx+cw*.12,dy+9,'#68758d',1.3);for(let j=0;j<counts[i][site];j++)dot(c,sx+(j-(counts[i][site]-1)/2)*r*2.6,dy-3,r,prob>1e-8?colors[i]:'#414a5f');}
      }
      text(c,'三列是同一量子态的可测占据结果；概率相加为1',w/2,h-17,C.muted,w<500?10:12,'center');
    }
  });
  (window.QS_SCENES ||= []).push(...scenes);
})();
