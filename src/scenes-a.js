/* Analytic quantum visualizations. All time is dimensionless; hbar=m=1
 * unless a scene states another convention. No scene draws hidden trajectories.
 */
(() => {
  'use strict';
  const TAU = 2 * Math.PI, SQRT2 = Math.SQRT2;
  const C = { blue:'#76a9ff',purple:'#b29aff',gold:'#efc77b',pink:'#ee91b8',text:'#e8ecfa',muted:'#909bb7',grid:'#222b43' };
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const abs2=z=>z.re*z.re+z.im*z.im;
  const mul=(a,b)=>({re:a.re*b.re-a.im*b.im,im:a.re*b.im+a.im*b.re});
  const polar=(r,a)=>({re:r*Math.cos(a),im:r*Math.sin(a)});
  const add=(a,b)=>({re:a.re+b.re,im:a.im+b.im});
  const div=(a,b)=>{const d=abs2(b);return {re:(a.re*b.re+a.im*b.im)/d,im:(a.im*b.re-a.re*b.im)/d};};
  function complete(z){z.density=abs2(z);return z;}
  function box(n,x,t=0){return complete(polar(x<0||x>1?0:SQRT2*Math.sin(n*Math.PI*x),-n*n*t));}
  function superposition(x,t,a=.5,phase=0){return complete(add(mul(polar(Math.sqrt(a),0),box(1,x,t)),mul(polar(Math.sqrt(1-a),phase),box(2,x,t))));}
  function packet(x,t,sigma=1,k=1.2,x0=-5){
    const q=t/(2*sigma*sigma),u=x-x0-k*t,d=1+q*q;
    const amplitude=Math.pow(2*Math.PI*sigma*sigma,-.25)*Math.pow(d,-.25)*Math.exp(-u*u/(4*sigma*sigma*d));
    return complete(polar(amplitude,k*(x-x0)-.5*k*k*t-.5*Math.atan(q)+u*u*q/(4*sigma*sigma*d)));
  }
  function barrierParts(E,V,a){
    const k=Math.sqrt(2*E),d=E-V;
    let f,g,den;
    if(Math.abs(d)<1e-8){f=1;g=a;den={re:1,im:-k*a/2};}
    else if(d>0){const q=Math.sqrt(2*d);f=Math.cos(q*a);g=Math.sin(q*a)/q;den={re:f,im:-(k*k+q*q)*g/(2*k)};}
    else {const q=Math.sqrt(-2*d);f=Math.cosh(q*a);g=Math.sinh(q*a)/q;den={re:f,im:-(k*k-q*q)*g/(2*k)};}
    const atA=div({re:1,im:0},den),left=mul(atA,{re:f,im:-k*g});
    return {k,atA,r:{re:left.re-1,im:left.im},T:abs2(atA)};
  }
  function transmission(E,V,a){return barrierParts(E,V,a).T;}
  function barrierWave(x,t,E,V,a){
    const b=barrierParts(E,V,a),k=b.k;
    let z;
    if(x<0)z=add(polar(1,k*x),mul(b.r,polar(1,-k*x)));
    else if(x>a)z=mul(b.atA,polar(1,k*(x-a)));
    else {const d=E-V,u=x-a;let f,g;
      if(Math.abs(d)<1e-8){f=1;g=u;}
      else if(d>0){const q=Math.sqrt(2*d);f=Math.cos(q*u);g=Math.sin(q*u)/q;}
      else{const q=Math.sqrt(-2*d);f=Math.cosh(q*u);g=Math.sinh(q*u)/q;}
      z=mul(b.atA,{re:f,im:k*g});
    }
    return complete(mul(z,polar(1,-E*t)));
  }
  function oscillator(n,x,t=0){
    let hm=1,h=2*x;
    if(n===0)h=1;
    for(let j=1;j<n;j++){const hn=2*x*h-2*j*hm;hm=h;h=hn;}
    let fact=1;for(let j=2;j<=n;j++)fact*=j;
    return complete(polar(Math.pow(Math.PI,-.25)*h*Math.exp(-x*x/2)/Math.sqrt(Math.pow(2,n)*fact),-(n+.5)*t));
  }
  function coherent(x,t,alpha=1.6){const xc=SQRT2*alpha*Math.cos(t),pc=-SQRT2*alpha*Math.sin(t);return complete(polar(Math.pow(Math.PI,-.25)*Math.exp(-((x-xc)**2)/2),pc*x-xc*pc/2-t/2));}
  function uncertainty(sigma,chirp=0){const dx=sigma,dp=Math.sqrt(1/(4*sigma*sigma)+4*chirp*chirp*sigma*sigma);return {dx,dp,product:dx*dp};}
  function basis(theta,phi,beta){const a=polar(Math.cos(theta/2),0),b=polar(Math.sin(theta/2),phi),c=Math.cos(beta/2),s=Math.sin(beta/2);return {old:[abs2(a),abs2(b)],rotated:[abs2(add(mul({re:c,im:0},a),mul({re:s,im:0},b))),abs2(add(mul({re:-s,im:0},a),mul({re:c,im:0},b)))]};}
  function hydrogenRadial(state,r){if(r<0)return 0;switch(state){case'1s':return 4*r*r*Math.exp(-2*r);case'2s':return r*r*(2-r)**2*Math.exp(-r)/8;case'2pz':return r**4*Math.exp(-r)/24;case'3dz2':return 8*r**6*Math.exp(-2*r/3)/98415;default:return 0;}}
  function hydrogenSpatial(state,x,y,z){const r=Math.hypot(x,y,z);if(r<1e-12)return state==='1s'?1/Math.PI:state==='2s'?1/(8*Math.PI):0;const c=z/r;const angular=state==='2pz'?3*c*c/(4*Math.PI):state==='3dz2'?5*(3*c*c-1)**2/(16*Math.PI):1/(4*Math.PI);return hydrogenRadial(state,r)*angular/(r*r);}
  window.QSPhysicsA={box,superposition,packet,transmission,barrierWave,oscillator,coherent,uncertainty,basis,hydrogenRadial,hydrogenSpatial};

  function text(ctx,s,x,y,color=C.muted,size=12,align='left'){ctx.save();ctx.fillStyle=color;ctx.font=`${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(String(s),x,y);ctx.restore();}
  function line(ctx,x1,y1,x2,y2,color=C.grid,width=1,dash=[]){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();}
  function dot(ctx,x,y,r,color=C.blue,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore();}
  function glow(ctx,x,y,r,color=C.blue){ctx.save();const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color+'aa');g.addColorStop(.25,color+'66');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);ctx.restore();}
  function arrow(ctx,x1,y1,x2,y2,color=C.blue,width=2){line(ctx,x1,y1,x2,y2,color,width);const a=Math.atan2(y2-y1,x2-x1);line(ctx,x2,y2,x2-9*Math.cos(a-.4),y2-9*Math.sin(a-.4),color,width);line(ctx,x2,y2,x2-9*Math.cos(a+.4),y2-9*Math.sin(a+.4),color,width);}
  function panelPair(w,h){return w<620?[{x:9,y:4,w:w-18,h:h*.49-8},{x:9,y:h*.5,w:w-18,h:h*.49-8}]:[{x:12,y:10,w:w*.49-18,h:h-20},{x:w*.5+7,y:10,w:w*.49-18,h:h-20}];}
  function plot(ctx,p){
    const {x,y,w,h,xmin,xmax,ymin,ymax,title='',xlabel='',ylabel='',curves=[]}=p;
    const left=x+46,right=x+w-17,top=y+35,bottom=y+h-42;
    const X=v=>left+(v-xmin)/(xmax-xmin)*(right-left),Y=v=>bottom-(v-ymin)/(ymax-ymin)*(bottom-top);
    text(ctx,title,x+8,y+13,C.text,13);
    for(let j=0;j<=4;j++){const xx=xmin+(xmax-xmin)*j/4,yy=ymin+(ymax-ymin)*j/4;line(ctx,X(xx),top,X(xx),bottom,C.grid);line(ctx,left,Y(yy),right,Y(yy),C.grid);text(ctx,Math.abs(xx)<1e-9?'0':Number(xx.toFixed(1)),X(xx),bottom+16,C.muted,10,'center');text(ctx,Math.abs(yy)<1e-9?'0':Number(yy.toFixed(Math.max(1,Math.min(6,1-Math.floor(Math.log10(ymax-ymin)))))),left-8,Y(yy),C.muted,10,'right');}
    if(ymin<0&&ymax>0)line(ctx,left,Y(0),right,Y(0),'#4e5872');
    text(ctx,xlabel,(left+right)/2,bottom+34,C.muted,11,'center');text(ctx,ylabel,left,top-10,C.muted,10);
    ctx.save();ctx.beginPath();ctx.rect(left,top,right-left,bottom-top);ctx.clip();
    for(const q of curves){const n=Math.max(200,Math.min(600,Math.round(w)));ctx.beginPath();for(let j=0;j<=n;j++){const xx=xmin+(xmax-xmin)*j/n,v=q.fn(xx);if(j===0)ctx.moveTo(X(xx),Y(v));else ctx.lineTo(X(xx),Y(v));}if(q.fill){ctx.lineTo(right,Y(clamp(0,ymin,ymax)));ctx.lineTo(left,Y(clamp(0,ymin,ymax)));ctx.closePath();ctx.globalAlpha=.14;ctx.fillStyle=q.color;ctx.fill();ctx.globalAlpha=1;ctx.beginPath();for(let j=0;j<=n;j++){const xx=xmin+(xmax-xmin)*j/n;if(!j)ctx.moveTo(X(xx),Y(q.fn(xx)));else ctx.lineTo(X(xx),Y(q.fn(xx)));}}
      ctx.strokeStyle=q.color;ctx.lineWidth=q.width||2;ctx.setLineDash(q.dash||[]);ctx.stroke();ctx.setLineDash([]);
    }ctx.restore();return{X,Y,left,right,top,bottom};
  }
  function wavePanels(ctx,w,h,t,fn,{xmin=0,xmax=1,densityMax=4,ampMax=1.6,leftTitle='概率密度 · |ψ|²',rightTitle='复波函数 · 蓝 Re ψ / 紫 Im ψ'}={}){const [a,b]=panelPair(w,h);const pa=plot(ctx,{...a,xmin,xmax,ymin:0,ymax:densityMax,title:leftTitle,xlabel:'位置 x',curves:[{fn:x=>fn(x).density,color:C.gold,fill:true}]});plot(ctx,{...b,xmin,xmax,ymin:-ampMax,ymax:ampMax,title:rightTitle,xlabel:'位置 x',curves:[{fn:x=>fn(x).re,color:C.blue},{fn:x=>fn(x).im,color:C.purple,dash:[5,4]}]});return pa;}
  function seeded(seed){let s=(seed|0)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};}
  const ctrl=(key,label,min,max,step,value,unit)=>({key,label,min,max,step,value,...(unit?{unit}:{})});
  const select=(key,label,options,value)=>({key,label,options:options.map(x=>typeof x==='string'?{value:x,label:x}:x),value});
  const source=(printed,pdf,topic)=>({printed,pdf,topic});
  const scenes=[];
  function push(scene){scenes.push(scene);}

  push({id:'stationary',chapter:1,title:'定态：波函数在动，概率不动',subtitle:'无限深势阱 · 能量本征态',description:'看清“定态”的真正含义：复波函数不断转相位，但每处找到粒子的概率保持不变。',formula:'ψₙ(x,τ) = √2 sin(nπx) e⁻ⁱⁿ²τ； ρ = |ψₙ|²',explanation:'墙在 x=0 和 x=1，波函数在两端严格为零。时间只带来一个整体相位，因此实部、虚部会起伏，概率密度不会移动。这里 τ=E₁t/ℏ，长度以阱宽 L 为单位。',observe:'左图金色概率密度保持静止；右图蓝色实部和紫色虚部交替变化。n 增大时，内部节点数变为 n−1。',experiment:'把 n 从 1 调到 4，再暂停并拖动时间。比较节点位置、峰数和概率密度是否变化。',caution:'曲线高度是概率幅或概率密度，不是粒子在空间中的上下位移。定态不意味着粒子静止。',source:source('1–3；30–33','7–9；36–39','学习要点；无限阱相关题组'),controls:[ctrl('n','量子数 n',1,6,1,2)],duration:TAU,
    render(ctx,w,h,t,p){wavePanels(ctx,w,h,t,x=>box(+p.n,x,t),{densityMax:2.25});},metrics(t,p){return[{label:'能量 E / E₁',value:(p.n*p.n).toFixed(0)},{label:'内部节点',value:String(p.n-1)},{label:'总概率',value:'1.000'}];}});

  push({id:'superposition',chapter:1,title:'叠加态：概率开始流动',subtitle:'两能级拍频 · 相对相位',description:'把两个静止的概率分布叠加，交叉项便让概率在阱内来回重新分配。',formula:'ψ = √a ψ₁ + √(1−a) eⁱφ ψ₂； ΔE = 3E₁',explanation:'两个本征态带有不同的时间相位，因而相对相位随时间演化。概率中出现 2 Re(c₁*c₂ψ₁*ψ₂) 这一干涉项；各能级概率仍为 a 和 1−a。',observe:'金色峰会向左右偏移。改相对相位能改变分布；把 a 调到 0 或 1，运动消失，回到定态。',experiment:'先取 a=0.5，比较 φ=0 和 φ=π；再把 a 调到 1。注意概率运动频率来自能量差。',caution:'图中的概率流动不能直接读作某一粒子的实际轨迹。测能量仍只得到离散的 E₁ 或 E₂。',source:source('30–33','36–39','1.24–1.29：无限阱叠加态'),controls:[ctrl('a','基态权重 a',0,1,.01,.5),ctrl('phase','初始相对相位 φ',0,TAU,.01,0,'rad')],duration:TAU/3,
    render(ctx,w,h,t,p){wavePanels(ctx,w,h,t,x=>superposition(x,t,+p.a,+p.phase),{densityMax:4.1});},metrics(t,p){return[{label:'P(E₁)',value:(+p.a).toFixed(2)},{label:'P(E₂)',value:(1-p.a).toFixed(2)},{label:'拍频周期 / τ',value:(TAU/3).toFixed(3)}];}});

  push({id:'packet',chapter:1,title:'自由波包：移动，也会展宽',subtitle:'自由粒子 · 高斯波包精确演化',description:'局域粒子必须混合许多动量。不同动量的相位不断分离，波包因此越走越宽。',formula:'⟨x⟩ = x₀ + k₀t； σₓ(t)² = σ₀² + t²/(4σ₀²)',explanation:'取 ℏ=m=1，自由哈密顿量为 p²/2。初始是最小不确定高斯包。包心以 k₀ 匀速移动，动量分布不变；位置宽度按解析式展宽。',observe:'金色密度峰向右平移且变矮，面积始终为 1。初始包越窄，随后展宽越快。',experiment:'固定平均动量，分别取初始宽度 0.5 和 1.5，拖到同一时刻比较。',caution:'画面只显示有限的 x 范围，包接近边缘时部分概率在画面外；解析波函数定义在整条实轴上。',source:source('1–3；109–110','7–9；115–116','自由粒子与动量表象的补充直观化'),controls:[ctrl('sigma','初始宽度 σ₀',.45,1.8,.01,.8),ctrl('k','平均动量 k₀',0,2,.02,1.2)],duration:6,
    render(ctx,w,h,t,p){wavePanels(ctx,w,h,t,x=>packet(x,t,+p.sigma,+p.k),{xmin:-12,xmax:12,densityMax:1,ampMax:1,leftTitle:'概率密度 · 自由传播'});},metrics(t,p){return[{label:'包心 ⟨x⟩',value:(-5+p.k*t).toFixed(2)},{label:'σₓ(t)',value:Math.sqrt(p.sigma*p.sigma+t*t/(4*p.sigma*p.sigma)).toFixed(2)},{label:'σₚ（恒定）',value:(1/(2*p.sigma)).toFixed(2)}];}});

  push({id:'tunneling',chapter:1,title:'隧穿：能量低于势垒，也能透过',subtitle:'矩形势垒 · 精确稳态散射',description:'在势垒内波函数衰减而不立即消失；势垒另一侧仍可带有非零透射概率流。',formula:'E<V₀：T = [1 + V₀²sinh²(κa)/(4E(V₀−E))]⁻¹； κ=√[2(V₀−E)]',explanation:'取 ℏ=m=1。入射、反射和透射波在两个边界连续匹配。图示为连续入射的稳态散射解，入射振幅为 1；T 是概率流比，不是右侧密度占全空间的比例。E>V₀ 时同样用匹配解计算，包含共振。',observe:'左侧的驻波来自入射与反射叠加；右侧为行波。增加势垒宽度，透射率通常快速下降。',experiment:'从 E<V₀ 开始加宽势垒，再让 E 超过 V₀。观察势垒内指数衰减与振荡解的变化。',caution:'这是不归一化的单能量散射态，不能把全图面积当总概率。隧穿不是借能量爬过墙；粒子能量保持 E。',source:source('42','48','1.39 的矩形势垒模型；E<V₀ 为同模型解析延伸'),controls:[ctrl('E','入射能量 E',.15,3,.01,.8),ctrl('V','势垒高度 V₀',.2,3,.01,1.8),ctrl('a','势垒宽度 a',.15,3,.01,1.1)],duration:TAU*2,
    render(ctx,w,h,t,p){const E=+p.E,V=+p.V,a=+p.a;const f=x=>barrierWave(x,t,E,V,a);const [top,bottom]=[{x:12,y:3,w:w-24,h:h*.36},{x:12,y:h*.36,w:w-24,h:h*.63}];const v=plot(ctx,{...top,xmin:-5,xmax:6,ymin:0,ymax:3.5,title:'势能 V(x) 与入射能量 E',xlabel:'位置 x',curves:[{fn:x=>x>=0&&x<=a?V:0,color:C.purple,fill:true},{fn:()=>E,color:C.gold,dash:[6,4]}]});ctx.save();ctx.fillStyle=C.purple+'12';ctx.fillRect(v.X(0),v.top,v.X(a)-v.X(0),v.bottom-v.top);ctx.restore();plot(ctx,{...bottom,xmin:-5,xmax:6,ymin:-2.1,ymax:4.15,title:'蓝：Re ψ  紫：Im ψ  金：|ψ|²',xlabel:'位置 x',curves:[{fn:x=>f(x).density,color:C.gold,fill:true},{fn:x=>f(x).re,color:C.blue},{fn:x=>f(x).im,color:C.purple,dash:[4,4]}]});},metrics(t,p){const T=transmission(+p.E,+p.V,+p.a);return[{label:'透射率 T',value:T.toFixed(4)},{label:'反射率 R',value:(1-T).toFixed(4)},{label:'R + T',value:'1.0000'}];}});

  push({id:'oscillator',chapter:1,title:'谐振子：定态与相干态',subtitle:'谐振子 · 经典极限的入口',description:'比较不移动的能量本征态与沿经典方程移动、却始终保持宽度的相干态。',formula:'V=x²/2； Eₙ=n+½； 相干态 ⟨x⟩=√2 α cos t',explanation:'取 ℏ=m=ω=1。能量本征态由 Hermite 多项式给出；相干态是无穷多个能级的特定叠加，密度为宽度 1/√2 的高斯包。它的包心满足经典谐振方程，但位置测量仍有涨落。',observe:'相干态的金色高斯峰左右往返，宽度不变。换成本征态，密度停下来，n 越高节点越多。',experiment:'先选择相干态，再选择第一、第二激发态；比较同一势阱中哪些“运动”只发生在相位上。',caution:'相干态包心的经典轨迹仅代表期望值，不是每个电子的轨迹。',source:source('2；27；50–54','8；33；56–60','谐振子学习要点及相关题组'),controls:[select('state','量子态',[{value:'coherent',label:'相干态'},{value:'0',label:'基态 n=0'},{value:'1',label:'第一激发态 n=1'},{value:'2',label:'第二激发态 n=2'}],'coherent'),ctrl('alpha','相干态幅度 α',0,2.4,.02,1.5)],duration:TAU,
    render(ctx,w,h,t,p){const fn=x=>p.state==='coherent'?coherent(x,t,+p.alpha):oscillator(+p.state,x,t);wavePanels(ctx,w,h,t,fn,{xmin:-5,xmax:5,densityMax:.8,ampMax:1,leftTitle:'概率密度 · 谐振子'});},metrics(t,p){const co=p.state==='coherent';return[{label:'平均能量 / ℏω',value:(co?p.alpha*p.alpha+.5:+p.state+.5).toFixed(2)},{label:'⟨x⟩',value:(co?SQRT2*p.alpha*Math.cos(t):0).toFixed(2)},{label:'σₓ',value:(co?1/SQRT2:Math.sqrt(+p.state+.5)).toFixed(3)}];}});

  const sinc=x=>Math.abs(x)<1e-8?1:Math.sin(x)/x;
  function slitIntensity(y,separation,phase,which){const env=sinc(.6*y)**2;return env*(which?1:(1+Math.cos(separation*y+phase)));}
  push({id:'double-slit',chapter:1,title:'双缝：一个个落点，积累成干涉',subtitle:'补充直观实验 · Fraunhofer 远场模型',description:'单次探测是一个落点；重复制备同一个量子态，许多落点才显出概率条纹。',formula:'I(y) ∝ sinc²(0.6y) [1 + cos(dy+φ)]',explanation:'使用远场双缝解析强度模型，并按强度作确定种子的蒙特卡洛抽样。理想路径标记使两条路径的干涉交叉项消失，剩下相同单缝包络的非相干和。',observe:'金色点是不同次实验的探测事件，不是同一个粒子的路径。时间增加时，点逐渐积累并趋近右侧理论曲线。',experiment:'先看少量落点，再增加到 1500 次。打开路径标记，条纹消失；关闭后再改变相对相位。',caution:'这是课本波函数与叠加原理的补充实验，并非原书某道双缝习题。点的位置由 Born 规则抽样，不绘制缝间轨迹。',source:source('1–3（原理）；双缝为补充','7–9（原理）','波函数概率解释与叠加原理；补充远场模型'),controls:[ctrl('d','缝距参数 d',1,6,.05,3),ctrl('phase','两路相位差 φ',0,TAU,.02,0,'rad'),select('which','路径标记',[{value:'off',label:'关闭：保留相干'},{value:'on',label:'打开：路径可区分'}],'off'),ctrl('shots','总实验次数',50,1500,10,800)],duration:12,
    render(ctx,w,h,t,p){const [a,b]=panelPair(w,h),tag=p.which==='on',f=y=>slitIntensity(y,+p.d,+p.phase,tag);const pr=plot(ctx,{...b,xmin:-7,xmax:7,ymin:0,ymax:2.1,title:'远场相对强度 I(y)',xlabel:'屏幕坐标 y',curves:[{fn:f,color:C.gold,fill:true}]});text(ctx,'屏幕上的独立探测事件',a.x+8,a.y+15,C.text,13);const rng=seeded(78413),count=Math.floor(+p.shots*clamp(t/12,0,1)),left=a.x+34,right=a.x+a.w-20,top=a.y+40,bottom=a.y+a.h-43;ctx.save();ctx.fillStyle='#111a30';ctx.fillRect(left,top,right-left,bottom-top);ctx.strokeStyle=C.grid;ctx.strokeRect(left,top,right-left,bottom-top);for(let j=0;j<count;j++){let y;do{y=-7+14*rng();}while(rng()*2>f(y));const x=left+(right-left)*rng(),yy=bottom-(y+7)/14*(bottom-top);dot(ctx,x,yy,1.3,C.gold,.78);}ctx.restore();text(ctx,`已探测 ${count} 次`,(left+right)/2,bottom+24,C.gold,12,'center');},metrics(t,p){return[{label:'相干性',value:p.which==='on'?'无交叉项':'两路相干'},{label:'显示次数',value:String(Math.floor(p.shots*clamp(t/12,0,1)))},{label:'模型',value:'远场强度抽样'}];}});

  push({id:'operator',chapter:2,title:'算符：作用在波函数上',subtitle:'动量算符 · 作用结果与测量分开',description:'动量算符是一次微分操作。对高斯波包作用以后，一般得到另一个函数。',formula:'p̂ψ = −i ∂ψ/∂x = [k + ix/(2σ²)] ψ',explanation:'以 L₀ 为长度单位、p₀=ℏ/L₀ 为动量单位，以下使用约化量。取 ψ=(2πσ²)⁻¹/⁴ exp(−x²/4σ²) exp(ikx)。动量算符作用结果同时包含实数载波动量与包络导数项。本页展示固定时刻的作用结果，不把它冒充时间演化。只有无限延伸的平面波才是动量的广义本征态。',observe:'蓝色是原波函数实部；紫色、粉色分别是 p̂ψ 的实部、虚部。k=0 时紫线为零而粉线非零。调窄包络，导数部分增大。',experiment:'把 k 调到 0：尽管平均动量为零，p̂ψ 一般仍不为零。再把 σ 调大，比较两条曲线。',caution:'p̂ψ 不是对某粒子施加一个外力后的新状态。算符作用、幺正时间演化和投影测量是三种不同操作。',source:source('55–57；76','61–63；82','力学量算符学习要点；2.20'),controls:[ctrl('sigma','位置宽度 σ / L₀',.45,1.6,.01,.9),ctrl('k','载波动量 k / p₀',0,3,.02,1.5)],duration:TAU,
    render(ctx,w,h,t,p){const sigma=+p.sigma,k=+p.k;const f=x=>polar(Math.pow(2*Math.PI*sigma*sigma,-.25)*Math.exp(-x*x/(4*sigma*sigma)),k*x);const [a,b]=panelPair(w,h);plot(ctx,{...a,xmin:-5,xmax:5,ymin:-3.3,ymax:3.3,title:'蓝 Re ψ · 紫 Re(p̂ψ) · 粉 Im(p̂ψ)',xlabel:'位置 x',curves:[{fn:x=>f(x).re,color:C.blue},{fn:x=>mul({re:k,im:x/(2*sigma*sigma)},f(x)).re,color:C.purple},{fn:x=>mul({re:k,im:x/(2*sigma*sigma)},f(x)).im,color:C.pink,dash:[5,4]}]});const dp=1/(2*sigma);plot(ctx,{...b,xmin:-4,xmax:6,ymin:0,ymax:1.4,title:'真正的动量测量分布',xlabel:'动量 p',curves:[{fn:x=>Math.exp(-((x-k)**2)/(2*dp*dp))/(Math.sqrt(TAU)*dp),color:C.gold,fill:true}]});},metrics(t,p){return[{label:'⟨p⟩ / p₀',value:(+p.k).toFixed(2)},{label:'Δp / p₀',value:(1/(2*p.sigma)).toFixed(3)},{label:'Δx Δp',value:'0.500 ℏ'}];}});

  push({id:'uncertainty',chapter:2,title:'不确定度：把一端压窄，另一端展开',subtitle:'位置–动量 · 高斯与啁啾态',description:'位置和动量分别有统计分布；不确定关系约束的是同一量子态的两种分布宽度。',formula:'Δx=σ； Δp²=1/(4σ²)+4c²σ²； ΔxΔp≥½',explanation:'取归一化波函数 ψ∝exp(−x²/4σ²)exp(icx²)，ℏ=1。二次相位 c 不改变位置密度，却增加动量分布的宽度，所以并非所有高斯态都满足简单等号 ΔxΔp=ℏ/2。',observe:'缩小 σ，左边变窄而右边变宽；改变二次相位 c，左边不动、右边仍能展开。',experiment:'先令 c=0，试三个不同 σ，乘积始终为 0.5。再把 c 调到 0.8，看看为何不确定关系写的是 ≥。',caution:'两图对应对同样制备的不同粒子群分别测 x 和 p，不表示同时精确测得单粒子的 x 与 p。',source:source('56–57；94','62–63；100','不确定关系学习要点及相关题组'),controls:[ctrl('sigma','位置标准差 σ',.3,2,.01,.8),ctrl('chirp','二次相位 c',-1,1,.01,0)],duration:TAU,
    render(ctx,w,h,t,p){const s=+p.sigma,u=uncertainty(s,+p.chirp),[a,b]=panelPair(w,h);plot(ctx,{...a,xmin:-6,xmax:6,ymin:0,ymax:1.4,title:'位置分布 |ψ(x)|²',xlabel:'位置 x',curves:[{fn:x=>Math.exp(-x*x/(2*s*s))/(Math.sqrt(TAU)*s),color:C.blue,fill:true}]});plot(ctx,{...b,xmin:-8,xmax:8,ymin:0,ymax:1.7,title:'动量分布 |φ(p)|²',xlabel:'动量 p',curves:[{fn:x=>Math.exp(-x*x/(2*u.dp*u.dp))/(Math.sqrt(TAU)*u.dp),color:C.purple,fill:true}]});},metrics(t,p){const u=uncertainty(+p.sigma,+p.chirp);return[{label:'Δx',value:u.dx.toFixed(3)},{label:'Δp',value:u.dp.toFixed(3)},{label:'乘积 / ℏ',value:u.product.toFixed(3)}];}});

  function bars(ctx,rect,probabilities,labels,title,observed){const{x,y,w,h}=rect;const base=y+h-52,top=y+48; text(ctx,title,x+8,y+16,C.text,13);line(ctx,x+30,base,x+w-15,base,C.grid);for(let j=0;j<probabilities.length;j++){const cx=x+35+(w-55)*(j+.5)/probabilities.length,bw=Math.min(64,(w-55)/probabilities.length*.4),height=(base-top)*probabilities[j];ctx.save();ctx.fillStyle=(j%2?C.purple:C.blue)+'44';ctx.strokeStyle=j%2?C.purple:C.blue;ctx.fillRect(cx-bw/2,base-height,bw,height);ctx.strokeRect(cx-bw/2,base-height,bw,height);ctx.restore();text(ctx,(probabilities[j]*100).toFixed(1)+'%',cx,Math.max(top+8,base-height-15),C.text,12,'center');text(ctx,labels[j],cx,base+23,C.muted,12,'center');if(observed)text(ctx,`实测 ${observed[j]} 次`,cx,base+42,C.gold,11,'center');}}
  push({id:'measurement',chapter:2,title:'测量：概率权重变成实际频数',subtitle:'Born 规则 · 同态重复制备',description:'测量能量时，每次只出现一个本征值；期望值不是一次实验必然得到的结果。',formula:'P(E₁)=a； P(E₂)=1−a； ⟨E⟩=aE₁+(1−a)E₂',explanation:'每一次试验都重新制备同一个态 √a|1⟩+√(1−a)|2⟩，再做一次理想能量测量。图中随机数使用固定种子，方便对比；不断重复实验，频数通常趋近理论概率。',observe:'只有 E₁=1、E₂=4 两种测量结果。虽然平均能量可能是 2.5，单次实验不会测到 2.5。',experiment:'取 a=0.5，对比 20、200 和 1000 次；再取 a=1，所有实验都落在 E₁。',caution:'这里演示的是许多份同态样本。对同一粒子连续重复同一种理想投影测量，第一次塌缩后结果会保持一致。',source:source('55–57；97','61–63；103','测量公设；2.41'),controls:[ctrl('a','能级 E₁ 的概率 a',0,1,.01,.5),ctrl('shots','重复制备次数',20,1000,10,300)],duration:10,
    render(ctx,w,h,t,p){const [a,b]=panelPair(w,h),count=Math.floor(p.shots*clamp(t/10,0,1)),rng=seeded(40513),freq=[0,0];text(ctx,'独立测量记录 · 每一点是一次实验',a.x+8,a.y+16,C.text,13);const left=a.x+28,right=a.x+a.w-20,top=a.y+56,bottom=a.y+a.h-56;for(let j=0;j<2;j++){const yy=top+(bottom-top)*(j?.72:.24);line(ctx,left,yy,right,yy,C.grid);text(ctx,j?'E₂ = 4':'E₁ = 1',left,yy-20,j?C.purple:C.blue,12);}for(let j=0;j<count;j++){const level=rng()<p.a?0:1;freq[level]++;dot(ctx,left+(right-left)*(j+.5)/Math.max(1,+p.shots),top+(bottom-top)*(level?.72:.24)+(rng()-.5)*26,1.7,level?C.purple:C.blue,.75);}bars(ctx,b,[+p.a,1-p.a],['E₁ = 1','E₂ = 4'],'理论概率与实测次数',freq);},metrics(t,p){return[{label:'理论平均能量',value:(4-3*p.a).toFixed(3)},{label:'可能结果',value:'仅 1 或 4'},{label:'独立样本数',value:String(Math.floor(p.shots*clamp(t/10,0,1)))}];}});

  push({id:'angular-momentum',chapter:2,title:'角动量：长度与投影不能随意选',subtitle:'角动量代数 · 空间量子化',description:'角动量平方与一个分量可以同时确定，但三个分量不能同时取确定值。',formula:'L²=ℓ(ℓ+1)ℏ²； Lz=mℏ； m=−ℓ,…,ℓ',explanation:'图中球面和锥面只是角动量代数的几何示意：长度为 √[ℓ(ℓ+1)]，z 投影为整数 m。对 |ℓ,m⟩，⟨Lx⟩=⟨Ly⟩=0，横向涨落非零。示意箭头不能解释为一根有确定方向的微观矢量。',observe:'投影只能落在右边的 2ℓ+1 条水平线上；即使 m=ℓ，投影长度仍小于 √[ℓ(ℓ+1)]。',experiment:'选择 ℓ=1、m=1，比较 |L|=√2 与 Lz=1；再逐级改变 m，看可用方向有多少。',caution:'锥面上的角度不是隐藏的实际旋转方向。量子态并没有同时确定的 Lx、Ly、Lz。',source:source('67；91','73；97','2.12、2.32：角动量'),controls:[ctrl('ell','轨道量子数 ℓ',1,4,1,2),ctrl('m','磁量子数 m',-4,4,1,1)],duration:TAU,
    render(ctx,w,h,t,p){const l=+p.ell,m=clamp(+p.m,-l,l),L=Math.sqrt(l*(l+1)),[a,b]=panelPair(w,h),cx=a.x+a.w*.5,cy=a.y+a.h*.52,r=Math.min(a.w*.34,a.h*.31);text(ctx,'代数几何示意 · 非真实转动',a.x+8,a.y+16,C.text,13);ctx.save();ctx.strokeStyle=C.grid;for(let q=-2;q<=2;q++){ctx.beginPath();ctx.ellipse(cx,cy+q*r*.29,r*Math.sqrt(1-q*q*.04),r*.2,0,0,TAU);ctx.stroke();}ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();ctx.restore();arrow(ctx,cx,cy+r+15,cx,cy-r-22,C.muted,1);text(ctx,'Lz',cx+15,cy-r-22,C.muted,12);const z=m/L,rr=r*Math.sqrt(1-z*z),yy=cy-r*z;ctx.save();ctx.strokeStyle=C.purple;ctx.setLineDash([4,5]);ctx.beginPath();ctx.ellipse(cx,yy,rr,rr*.2,0,0,TAU);ctx.stroke();ctx.restore();const ang=t*.5,xx=cx+rr*Math.cos(ang),ey=yy+rr*.2*Math.sin(ang);arrow(ctx,cx,cy,xx,ey,C.blue,2);line(ctx,xx,ey,cx,yy,C.gold,1,[4,4]);dot(ctx,cx,yy,4,C.gold);text(ctx,`|L| = √${l*(l+1)} ℏ`,cx,cy+r+34,C.text,13,'center');text(ctx,'允许的 z 投影',b.x+8,b.y+16,C.text,13);for(let j=-l;j<=l;j++){const y=b.y+b.h*.5-j/l*b.h*.31;line(ctx,b.x+50,y,b.x+b.w-50,y,j===m?C.gold:C.grid,j===m?3:1);text(ctx,`m = ${j}`,b.x+b.w-40,y,j===m?C.gold:C.muted,12);if(j===m)dot(ctx,b.x+65,y,5,C.gold);}},metrics(t,p){const l=+p.ell,m=clamp(+p.m,-l,l);return[{label:'|L| / ℏ',value:Math.sqrt(l*(l+1)).toFixed(3)},{label:'实际采用 m',value:String(m)},{label:'投影种数',value:String(2*l+1)}];}});

  push({id:'fourier',chapter:3,title:'位置与动量：同一个态的两张脸',subtitle:'傅里叶变换 · 表象切换',description:'坐标空间的局域包络，需要许多不同动量平面波的相干叠加。',formula:'φ(p) = (2π)⁻½ ∫ψ(x)e⁻ⁱᵖˣ dx； Δp=1/(2σ)',explanation:'这里展示高斯态的解析傅里叶变换，ℏ=1。左图的位置包络与右图动量权重互为变换；载波动量移动动量分布的中心，但不改变位置密度。时间演化取自由粒子相位 exp(−ip²t/2)。',observe:'改变 k，左边实部振荡变密，右边概率峰整体平移。改变 σ，两种表象的宽度反向变化。',experiment:'把 k 从 0 调到 3；再保持 k 不变，将 σ 减半。区分“包络宽度”和“载波波长”。',caution:'两种表象描述同一个量子态，并非两团同时存在的实体。傅里叶变换需要复振幅，不能只变换概率密度。',source:source('109–110；113–114','115–116；119–120','表象学习要点；动量表象题组'),controls:[ctrl('sigma','初始位置宽度 σ',.35,1.8,.01,.8),ctrl('k','平均动量 k',-3,3,.02,1.5)],duration:4,
    render(ctx,w,h,t,p){const [a,b]=panelPair(w,h),s=+p.sigma,k=+p.k,dp=1/(2*s);plot(ctx,{...a,xmin:-9,xmax:9,ymin:-1,ymax:1.25,title:'坐标表象 · 蓝 Re ψ / 金 |ψ|²',xlabel:'位置 x',curves:[{fn:x=>packet(x,t,s,k,0).re,color:C.blue},{fn:x=>packet(x,t,s,k,0).density,color:C.gold,fill:true}]});plot(ctx,{...b,xmin:-6,xmax:6,ymin:-1.8,ymax:1.8,title:'动量表象 · 紫 Re φ / 金 |φ|²',xlabel:'动量 p',curves:[{fn:x=>Math.pow(2*s*s/Math.PI,.25)*Math.exp(-s*s*(x-k)**2)*Math.cos(-x*x*t/2),color:C.purple},{fn:x=>Math.exp(-((x-k)**2)/(2*dp*dp))/(Math.sqrt(TAU)*dp),color:C.gold,fill:true}]});},metrics(t,p){return[{label:'⟨p⟩',value:(+p.k).toFixed(2)},{label:'初始 Δx',value:(+p.sigma).toFixed(2)},{label:'Δp',value:(1/(2*p.sigma)).toFixed(3)}];}});

  push({id:'basis',chapter:3,title:'换一组基，概率分量重新分配',subtitle:'有限维表象 · 幺正基变换',description:'态本身没变，描述它的坐标变了；若测量基也改变，结果的概率随之改变。',formula:'|ψ⟩=cos(θ/2)|0⟩+eⁱφsin(θ/2)|1⟩； c′=U†c',explanation:'新基为 |0′⟩=cos(β/2)|0⟩+sin(β/2)|1⟩，|1′⟩=−sin(β/2)|0⟩+cos(β/2)|1⟩。右边展示态投影到新基上的 Born 概率；完整描述仍需保留复系数的相位。',observe:'旋转基角 β 时，右侧概率变化，但左右两边概率总和始终为 1。对于 β=0，两边完全一致。',experiment:'取 θ=π/2、φ=0，再让 β=π/2：旧基各占一半，新基第一个结果为 100%。然后把 φ 改成 π。',caution:'被动换坐标不会改变物理态。若实际转动测量装置，它测量的是另一组投影，因此统计结果会不同。',source:source('110；117','116；123','表象变换学习要点；3.8'),controls:[ctrl('theta','初态混合角 θ',0,Math.PI,.01,Math.PI/2,'rad'),ctrl('phi','初态相位 φ',0,TAU,.01,0,'rad'),ctrl('beta','新基旋转角 β',0,Math.PI,.01,Math.PI/2,'rad')],duration:TAU,
    render(ctx,w,h,t,p){const [a,b]=panelPair(w,h),v=basis(+p.theta,+p.phi,+p.beta);bars(ctx,a,v.old,['|0⟩','|1⟩'],'旧表象 · 相同量子态');bars(ctx,b,v.rotated,['|0′⟩','|1′⟩'],'新表象 · 相同量子态');},metrics(t,p){const v=basis(+p.theta,+p.phi,+p.beta);return[{label:'旧基概率之和',value:(v.old[0]+v.old[1]).toFixed(3)},{label:'新基概率之和',value:(v.rotated[0]+v.rotated[1]).toFixed(3)},{label:'P(0′)',value:v.rotated[0].toFixed(3)}];}});

  push({id:'phase',chapter:3,title:'整体相位看不见，相对相位能干涉',subtitle:'物理等价态 · 相位的可观测性',description:'给整个波函数乘同一个相位不会改变任何概率；只转动一个分量，干涉图样就会变化。',formula:'|eⁱγψ|²=|ψ|²； |ψ₁+eⁱφψ₂|² 含相对相位 φ',explanation:'左图将同一个等权叠加态整体乘 exp(iγ)，金色概率线与白色参考线严格重合。右图只修改第二个能级的相位 φ，干涉交叉项改变。两图都按相同的能量相位演化。',observe:'调整体相位只转动复振幅，左侧概率保持与参考一致；调相对相位会移动右侧密度峰。',experiment:'暂停时间，先把整体相位 γ 从 0 拖到 2π，再把相对相位 φ 从 0 拖到 2π。',caution:'所谓“整体相位不可观测”指整个孤立量子态的共同相位；两条干涉路径之间的相位是相对相位。',source:source('109–110；117–118','115–116；123–124','表象、态矢与幺正变换的补充直观化'),controls:[ctrl('global','整体相位 γ',0,TAU,.01,1.2,'rad'),ctrl('relative','相对相位 φ',0,TAU,.01,1.5,'rad')],duration:TAU/3,
    render(ctx,w,h,t,p){const [a,b]=panelPair(w,h);plot(ctx,{...a,xmin:0,xmax:1,ymin:-1.7,ymax:4.1,title:'整体相位 · 金色密度不受 γ 影响',xlabel:'位置 x',curves:[{fn:x=>superposition(x,t,.5,0).density,color:'#e8ecfa',dash:[7,5],width:4},{fn:x=>superposition(x,t,.5,0).density,color:C.gold},{fn:x=>mul(superposition(x,t,.5,0),polar(1,+p.global)).re,color:C.blue}]});plot(ctx,{...b,xmin:0,xmax:1,ymin:0,ymax:4.1,title:'相对相位 · 金色密度随 φ 改变',xlabel:'位置 x',curves:[{fn:x=>superposition(x,t,.5,0).density,color:'#e8ecfa',dash:[5,5]},{fn:x=>superposition(x,t,.5,+p.relative).density,color:C.gold,fill:true}]});},metrics(t,p){return[{label:'整体相位对密度',value:'无影响'},{label:'相对相位 φ',value:(+p.relative).toFixed(2)+' rad'},{label:'两态归一化',value:'均为 1'}];}});

  const CLOUD_SAMPLES=6000,cloudCache=new Map();
  let projectedCloud={key:'',points:[]};
  function cloud(state){if(cloudCache.has(state))return cloudCache.get(state);const rng=seeded(24131),R={ '1s':12,'2s':32,'2pz':30,'3dz2':55 }[state],N=CLOUD_SAMPLES,cdf=[0];for(let j=1;j<=1800;j++){const dr=R/1800,r=j*dr;cdf[j]=cdf[j-1]+(hydrogenRadial(state,r)+hydrogenRadial(state,r-dr))*dr/2;}const total=cdf[1800];for(let j=0;j<=1800;j++)cdf[j]/=total;const pts=[];for(let j=0;j<N;j++){const u=rng();let lo=0,hi=1800;while(hi-lo>1){const m=(lo+hi)>>1;if(cdf[m]<u)lo=m;else hi=m;}const r=(lo+(u-cdf[lo])/(cdf[hi]-cdf[lo]))*R/1800;let c;do{c=2*rng()-1;}while(rng()>(state==='2pz'?c*c:state==='3dz2'?(3*c*c-1)**2/4:1));const ph=TAU*rng(),s=Math.sqrt(1-c*c),x=r*s*Math.cos(ph),y=r*s*Math.sin(ph),z=r*c;const sign=state==='2s'?Math.sign(2-r):state==='2pz'?Math.sign(z):state==='3dz2'?Math.sign(3*z*z-r*r):1;pts.push({x,y,z,sign});}pts.halfCount=pts.reduce((sum,p)=>sum+(p.y<=0?1:0),0);cloudCache.set(state,pts);return pts;}
  function project(x,y,z,cx,cy,scale,angle){const ca=Math.cos(angle),sa=Math.sin(angle),xx=x*ca-y*sa,yy=x*sa+y*ca;return[cx+xx*scale,cy-z*scale*.97077+yy*scale*.24,yy];}
  const orbitalOptions=[{value:'1s',label:'1s · 球对称'},{value:'2s',label:'2s · 径向节点'},{value:'2pz',label:'2pᶻ · 哑铃'},{value:'3dz2',label:'3dᶻ² · 双叶与环'}];
  push({id:'orbital',chapter:4,title:'氢原子：电子云，不是行星轨道',subtitle:'三维概率云 · 氢原子定态',description:'用 6000 次按 |ψ|² 抽样的独立位置测量，勾勒一个电子在重复制备后的空间概率分布。',formula:'ψₙℓm(r,θ,φ)=Rₙℓ(r)Yℓm(θ,φ)； ρ=|ψ|²',explanation:'每个点代表一次独立位置测量的样本，密度由归一化氢原子轨道解析式决定。蓝与紫区分实轨道的正负号，不是正负电荷。相机慢转让你看清三维形状；定态概率云本身不随时间变化。',observe:'1s 球对称，2s 有径向节点；2pᶻ 的 z=0 平面无密度；3dᶻ² 有锥形角节点。',experiment:'依次切换四个轨道，暂停后转动观察角；打开半空间剖切，查看 2s 的内层和外层。',caution:'点不是同时存在的几千个电子，也不沿轨道飞行。相机旋转只是观看方式，不能解释为电子云在自转。不同轨道会自动改变画面尺度。',source:source('132；143–153；165','138；149–159；171','中心势分离变量；4.17–4.18；4.33'),controls:[select('orbital','氢原子轨道',orbitalOptions,'2pz'),ctrl('view','观察角',0,TAU,.01,.55,'rad'),select('cut','半空间剖切',[{value:'off',label:'完整概率云'},{value:'on',label:'剖去 y>0 半空间'}],'off')],duration:TAU*6,
    render(ctx,w,h,t,p){
      const state=p.orbital,pts=cloud(state),cx=w*.5,cy=h*.49;
      const extent={'1s':5,'2s':14,'2pz':13,'3dz2':27}[state],scale=Math.min(w*.34,h*.39)/extent,angle=+p.view+t*.06;
      const axes=[['x',extent,0,0],['y',0,extent,0],['z',0,0,extent]];
      for(const [label,x,y,z] of axes){const a=project(x,y,z,cx,cy,scale,angle);line(ctx,cx,cy,a[0],a[1],'#34435e',1);text(ctx,label,a[0]+8,a[1]-6,C.muted,12);}
      // Nodes are drawn as labelled geometric guides, never as extra probability.
      if(state==='2pz'){
        ctx.save();ctx.strokeStyle='#b4a0ee66';ctx.setLineDash([4,6]);ctx.beginPath();
        for(let j=0;j<=80;j++){const q=TAU*j/80,v=project(extent*.74*Math.cos(q),extent*.74*Math.sin(q),0,cx,cy,scale,angle);if(!j)ctx.moveTo(v[0],v[1]);else ctx.lineTo(v[0],v[1]);}ctx.stroke();ctx.restore();
        text(ctx,'z=0 节点平面',cx+Math.min(w*.2,extent*scale*.68),cy-13,C.muted,w<500?10:11);
      }
      if(state==='2s'){
        ctx.save();ctx.strokeStyle='#b4a0ee77';ctx.setLineDash([3,5]);ctx.beginPath();ctx.arc(cx,cy,2*scale,0,TAU);ctx.stroke();ctx.restore();
        text(ctx,'r=2a₀ 节点球面',cx+2*scale+10,cy-2*scale-10,C.muted,w<500?10:11);
      }
      const key=[state,w,h,p.cut,angle.toFixed(5)].join('|');
      if(projectedCloud.key!==key){
        const ca=Math.cos(angle),sa=Math.sin(angle),points=[];
        for(const a of pts){if(p.cut==='on'&&a.y>0)continue;const xx=a.x*ca-a.y*sa,yy=a.x*sa+a.y*ca;points.push({sx:cx+xx*scale,sy:cy-a.z*scale*.97077+yy*scale*.24,depth:yy,sign:a.sign});}
        points.sort((a,b)=>a.depth-b.depth);projectedCloud={key,points};
      }
      // One save/restore for the cloud, rather than 6000 canvas state copies.
      ctx.save();
      for(const a of projectedCloud.points){ctx.fillStyle=a.sign<0?'#c2a5ff':'#90baff';ctx.globalAlpha=.48+clamp((a.depth/extent+1)*.16,0,.3);ctx.beginPath();ctx.arc(a.sx,a.sy,1.0+clamp((a.depth/extent+1)*.38,0,.9),0,TAU);ctx.fill();}
      ctx.restore();
      glow(ctx,cx,cy,13,C.gold);dot(ctx,cx,cy,2.5,C.gold);
      text(ctx,`${state.replace('pz','pᶻ').replace('dz2','dᶻ²')} · 6000 次独立位置抽样 · 相机缓慢旋转`,w/2,22,C.text,w<500?11:13,'center');
      text(ctx,`轴长度 = ${extent} a₀   ｜   蓝 / 紫 = 空间实波函数的正 / 负号`,w/2,h-24,C.muted,w<500?10:12,'center');
    },metrics(t,p){const n=p.orbital==='1s'?1:p.orbital==='3dz2'?3:2,count=p.cut==='on'?cloud(p.orbital).halfCount:CLOUD_SAMPLES;return[{label:'能量 / Ry',value:(-1/(n*n)).toFixed(4)},{label:'概率云演化',value:'定态：密度不变'},{label:'显示样本',value:p.cut==='on'?`${count} / 6000（半空间）`:'6000 次独立样本'}];}});

  push({id:'radial',chapter:4,title:'径向概率：最可能的半径在哪里',subtitle:'体积因子 · 密度与壳层概率',description:'中心处密度最大，不等于最可能半径为零：球壳体积带来 r² 因子。',formula:'P(r)dr=r²|Rₙℓ(r)|²dr； ∫₀∞P(r)dr=1',explanation:'左图是沿 z 轴的三维位置概率密度切线，右图是对所有方向积分后的径向概率密度。两者物理含义不同。1s 的点密度在核处最大，但径向概率在 r=a₀ 处最大。',observe:'所有轨道的 P(0)=0。2s 在 r=2a₀ 有径向节点；2p 没有径向节点，但在核处密度也为零。',experiment:'选择 1s，对照 r=0 与 r=1；再换成 2s，找出密度和径向概率共同为零的位置。',caution:'图上的三维密度与径向密度单位不同，不能把两图纵轴数值直接比较。这里采用 a₀=1。',source:source('151–152；165','157–158；171','4.17–4.18、4.33：氢原子径向分布'),controls:[select('orbital','氢原子轨道',orbitalOptions,'1s'),ctrl('r','检查半径 r',0,30,.05,1,'a₀')],duration:TAU,
    render(ctx,w,h,t,p){const state=p.orbital,R=state==='1s'?8:state==='3dz2'?40:24,[a,b]=panelPair(w,h),maxDensity=state==='1s'?.34:state==='2s'?.045:state==='2pz'?.007:.0004,maxRadial=state==='1s'?.6:state==='2s'?.22:state==='2pz'?.22:.11;const q=plot(ctx,{...a,xmin:0,xmax:R,ymin:0,ymax:maxDensity,title:'沿 z 轴的三维密度 ρ(0,0,r)',xlabel:'半径 r / a₀',curves:[{fn:r=>hydrogenSpatial(state,0,0,r),color:C.blue,fill:true}]});const v=plot(ctx,{...b,xmin:0,xmax:R,ymin:0,ymax:maxRadial,title:'球壳概率密度 P(r)',xlabel:'半径 r / a₀',curves:[{fn:r=>hydrogenRadial(state,r),color:C.gold,fill:true}]});if(+p.r<=R){line(ctx,q.X(+p.r),q.top,q.X(+p.r),q.bottom,C.pink,1,[4,4]);line(ctx,v.X(+p.r),v.top,v.X(+p.r),v.bottom,C.pink,1,[4,4]);dot(ctx,q.X(+p.r),q.Y(hydrogenSpatial(state,0,0,+p.r)),4,C.pink);dot(ctx,v.X(+p.r),v.Y(hydrogenRadial(state,+p.r)),4,C.pink);}},metrics(t,p){return[{label:'检查半径 / a₀',value:(+p.r).toFixed(2)},{label:'P(r) / a₀⁻¹',value:hydrogenRadial(p.orbital,+p.r).toFixed(5)},{label:'径向总概率',value:'1.000'}];}});

  push({id:'magnetic',chapter:4,title:'磁场：简并能级分裂',subtitle:'轨道 Zeeman 效应 · 弱场线性近似',description:'磁场通过轨道磁矩改变能量，使原本相同能量的不同 m 态出现分裂。',formula:'ΔE/E₀ = bm； b=μᴮB/E₀； τ=E₀t/ℏ（忽略自旋）',explanation:'以 E₀ 为能量单位、ℏ/E₀ 为时间单位。针对电子在弱磁场中的轨道 Zeeman 项 H′=μᴮBLz/ℏ，只保留一阶顺磁项，忽略自旋、抗磁 B² 项与能级混合。右图展示一对相邻 m 分量相对相位的积累，频率由能量差给定。',observe:'B=0 时所有 m 线重合；B 增大，能级等间距分裂。相邻 m 态相对相位的角速度与 B 成正比。',experiment:'把磁场从 0 缓慢增至 1，再反转符号，观察能级顺序和相位转动方向同时反转。',caution:'此图不是完整的 Landau 能级模型。弱场近似与只取轨道项是明确限制；强场及电子自旋需使用其他模型。',source:source('132–133；208–211','138–139；214–217','电磁场哈密顿量的弱场展开；跨章5.26；4.6/4.27的Landau模型供对比阅读'),controls:[ctrl('ell','轨道量子数 ℓ',1,3,1,1),ctrl('B','磁场参数 b = μᴮB / E₀',-1,1,.01,.5)],duration:TAU*2,
    render(ctx,w,h,t,p){const [a,b]=panelPair(w,h),l=+p.ell,B=+p.B,cx=a.x+a.w*.5,base=a.y+a.h*.5; text(ctx,'能量修正 ΔE / E₀',a.x+8,a.y+16,C.text,13);line(ctx,a.x+20,base,a.x+a.w-25,base,C.muted,1,[5,5]);for(let m=-l;m<=l;m++){const x=a.x+36+(a.w-75)*(m+l)/Math.max(1,2*l),y=base-m*B*(a.h*.27/l);line(ctx,x-18,y,x+18,y,m===0?C.gold:m<0?C.purple:C.blue,3);line(ctx,x,base,x,y,C.grid,1);text(ctx,`m=${m}`,x,a.y+a.h-34,C.muted,11,'center');text(ctx,(m*B).toFixed(2),x,y-17,C.text,11,'center');}text(ctx,'相邻 m 分量的相对相位',b.x+8,b.y+16,C.text,13);const xx=b.x+b.w*.5,yy=b.y+b.h*.49,r=Math.min(b.w*.31,b.h*.29);ctx.save();ctx.strokeStyle=C.grid;ctx.beginPath();ctx.arc(xx,yy,r,0,TAU);ctx.stroke();ctx.restore();line(ctx,xx-r-12,yy,xx+r+12,yy,C.grid);line(ctx,xx,yy-r-12,xx,yy+r+12,C.grid);arrow(ctx,xx,yy,xx+r*Math.cos(-B*t),yy-r*Math.sin(-B*t),C.blue,3);dot(ctx,xx,yy,3,C.gold);text(ctx,'Δφ = −bτ',xx,yy+r+31,C.muted,12,'center');},metrics(t,p){return[{label:'轨道分裂支数',value:String(2*p.ell+1)},{label:'相邻能量差 / E₀',value:Math.abs(+p.B).toFixed(3)},{label:'近似',value:'弱场 · 无自旋'}];}});

  (window.QS_SCENES ||= []).push(...scenes);
})();
