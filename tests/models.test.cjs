'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),box={window:{}};vm.createContext(box);
for(const f of ['scenes-a','scenes-b','scenes-c','scenes-d','models','models-more','lessons','catalog-data'])vm.runInContext(fs.readFileSync(path.join(root,'src',f+'.js'),'utf8'),box);
const M=box.window.QSPhysicsModels,N=box.window.QSPhysicsMore,scenes=box.window.QS_SCENES;
function near(a,b,e=1e-8){assert(Number.isFinite(a)&&Math.abs(a-b)<=e,`${a} != ${b} (tol ${e})`);}
function integral(f,a,b,n=16000){let sum=0,dx=(b-a)/n;for(let i=0;i<n;i++)sum+=f(a+(i+.5)*dx);return sum*dx;}
function integral2(f,a,b,n=220){return integral(x=>integral(y=>f(x,y),a,b,n),a,b,n);}
test('hydrogen radial and angular factors normalize for every supported n,l,m; mean radius and nodes agree',()=>{
 for(let n=1;n<=4;n++)for(let l=0;l<n;l++){
  near(integral(r=>M.radialDensity(n,l,r),0,220),1,3e-9);
  near(integral(r=>r*M.radialDensity(n,l,r),0,220),(3*n*n-l*(l+1))/2,3e-9);
  for(let m=-l;m<=l;m++)near(2*Math.PI*integral(u=>M.angular(l,m,u).density,-1,1),1,1e-7);
 }
 for(const xyz of [[0,0,0],[.2,.5,-1],[2,3,4]])near(M.hydrogen(1,0,0,...xyz).density,Math.exp(-2*Math.hypot(...xyz))/Math.PI,1e-14);
 near(M.radial(2,0,2),0,1e-14);
 for(const u of [-.9,0,.6])near(M.angular(3,-2,u,.3).density,M.angular(3,2,u,.3).density,1e-14);
});
test('variable-width infinite well: norms, node boundaries and scaled Schrödinger equation',()=>{
 for(const L of [.5,1,2.5])for(let n=1;n<=6;n++){
  near(integral(x=>M.well(n,L,x,.6).density,0,L),1);
  near(integral(x=>M.wellMix(n,L,x,2).density,0,L),1);
  near(M.well(n,L,0).density,0);near(M.well(n,L,L).density,0);
  const x=.31*L,h=1e-4*L,z=M.well(n,L,x,.2),dx2=(M.well(n,L,x+h,.2).re-2*z.re+M.well(n,L,x-h,.2).re)/(h*h);
  near(-dx2/(Math.PI*Math.PI),n*n/(L*L)*z.re,3e-4);
 }
});
test('finite well: bound roots, norm, continuity and derivative matching over all physical extremes',()=>{
 for(const V of [1,6,20])for(const a of [.6,1,2]){
  const levels=M.finiteLevels(V,a);assert(levels.length>=1);assert(levels.every(q=>q.E<0&&q.E>-V));
  for(const q of levels){
   const span=a+22/q.kappa;
   // Integrate interior and exterior separately to avoid quadrature crossing a cusp.
   near(integral(x=>M.finiteWave(q,x).density,-a,a,64000)+q.outside,1,1e-8);
   const match=q.even?q.k*Math.tan(q.k*a):-q.k/Math.tan(q.k*a);near(match,q.kappa,1e-9);
   const h=1e-5;near(M.finiteWave(q,a-h).re,M.finiteWave(q,a+h).re,3e-4);
   const dInside=(M.finiteWave(q,a-h).re-M.finiteWave(q,a-2*h).re)/h,dOutside=(M.finiteWave(q,a+2*h).re-M.finiteWave(q,a+h).re)/h;
   near(dInside,dOutside,8e-4);assert(Number.isFinite(span));
  }
 }
});
test('delta bound state: position/Fourier norms, derivative jump and variances',()=>{
 for(const g of [.3,1,3]){
  near(integral(x=>M.delta(x,g).density,-18/g,18/g),1,9e-7);
  near(integral(x=>x*x*M.delta(x,g).density,-18/g,18/g),1/(2*g*g),1e-8);
  near(integral(p=>M.deltaMomentum(p,g),-200*g,200*g),1,1e-7);
  const h=1e-6,jump=2*(M.delta(h,g).re-M.delta(0,g).re)/h;near(jump,-2*g*M.delta(0,g).re,2e-5);
 }
});
test('plane rotor: periodic norm, density speed and no current-implied point trajectory',()=>{
 for(const m of [-4,-1,0,3])for(const I of [.5,2])for(const t of [0,.8,4]){
  near(integral(phi=>M.rotorDensity(phi,t,m,I,true),0,2*Math.PI),1);
  near(M.rotorDensity(.7,t,m,I,true),M.rotorDensity(.7+2*Math.PI,t,m,I,true));
  const speed=(2*m+1)/(2*I);near(M.rotorDensity(.7+speed*t,t,m,I,true),M.rotorDensity(.7,0,m,I,true));
 }
});
test('oscillator scaling and coherent-state centre remain normalized',()=>{
 for(const w of [.5,1,2])for(let n=0;n<=6;n++)near(integral(x=>M.oscillator(n,w,x,1).density,-20,20),1,1e-9);
 for(const w of [.5,2])for(const t of [0,.6,2]){near(integral(x=>M.coherent(w,x,t).density,-20,20),1);near(integral(x=>x*M.coherent(w,x,t).density,-20,20),Math.sqrt(2/w)*1.5*Math.cos(w*t));}
});
test('coupled oscillator covariance, Gaussian norm and Ehrenfest normal-mode dynamics',()=>{
 for(const lambda of [-.85,0,.6,.85])for(const t of [0,.7,2]){
  const q=N.coupled(lambda,t,1.5);near(integral2((x,y)=>N.coupledDensity(x,y,lambda,t,1.5),-12,12),1,1e-8);
  near(integral2((x,y)=>(x-q.x)*(y-q.y)*N.coupledDensity(x,y,lambda,t,1.5),-12,12),q.covxy,1e-7);
  const h=1e-4,up=N.coupled(lambda,t+h,1.5),dn=N.coupled(lambda,t-h,1.5);near((up.x-2*q.x+dn.x)/(h*h),-q.x-lambda*q.y,1e-7);
 }
});
test('two coupled spins satisfy the full 2x2 Schrödinger equation, unit norm and conserved Mz',()=>{
 for(const J of [.2,1,2])for(const b of [-1.5,0,.6])for(const t of [0,.5,2]){
  const q=N.spinPair(t,J,b),h=1e-5,up=N.spinPair(t+h,J,b),dn=N.spinPair(t-h,J,b),v=[q.a,q.b],H=[[-J/4+b,J/2],[J/2,-J/4-b]];
  near(v.reduce((s,z)=>s+z.re*z.re+z.im*z.im,0),1);near(q.sz1+q.sz2,0);
  for(let i=0;i<2;i++){const key=i?'b':'a';near(-(up[key].im-dn[key].im)/(2*h),H[i].reduce((s,a,j)=>s+a*v[j].re,0));near((up[key].re-dn[key].re)/(2*h),H[i].reduce((s,a,j)=>s+a*v[j].im,0));}
 }
 near(N.spinPair(Math.PI,1,0).pFlip,1);
});
test('Landau centre/gap, spherical binding threshold and asymmetric-rotor degeneracy',()=>{
 for(const B of [.4,1,2.5])for(let n=0;n<=5;n++){const q=N.landau(n,B,1.2,0);near(q.center,-1.2/B);near(q.E,B*(n+.5));near(integral(x=>N.landau(n,B,1.2,x).density,-30,30),1);}
 assert.equal(N.sphericalLevels(1,1).length,0);assert.equal(N.sphericalLevels(Math.PI*Math.PI/8,1).length,0);assert.equal(N.sphericalLevels(2,1).length,1);
 for(const q of N.sphericalLevels(15,2))near(integral(r=>N.sphericalU(q,r)**2,0,2,12000)+2*q.A*q.A*q.edge*q.edge/(2*q.kappa),1,1e-8);
 for(const I of [.5,1,3])for(const e of N.asymE(I,I,I))near(e,1/I);
});
test('spin-orbit selection subspace, flux periodicity and contact pair coincidences',()=>{
 for(let l=1;l<=3;l++)for(const lambda of [-1.5,0,1])for(const t of [0,1,5]){const s=N.ls(t,l,lambda);near(s.pUp+s.pDown,1);near(s.Lz+s.Sz,.5);near(s.ePlus-s.eMinus,lambda*(2*l+1)/2);assert(s.pDown>=0&&s.pDown<=1);}
 const ground=f=>Math.min(...Array.from({length:21},(_,j)=>N.fluxEnergy(j-10,f,1)));
 for(const f of [-2.3,0,.4,2.2])near(ground(f),ground(f+1));
 for(const [kind,expected]of [['symmetric',2],['antisymmetric',0],['dist',1]]){
  near(integral2((x,y)=>N.contactAmplitude(x,y,kind)**2,0,1),1);
  near(integral(x=>N.contactAmplitude(x,x,kind)**2,0,1),expected);
 }
 near(integral2((x,y)=>integral(z=>M.box3(2,1,3,x,y,z)**2,0,1,50),0,1,50),1);
});
test('every plotted panel has an explanation and all authored TeX renders with real KaTeX',()=>{
 const katex=require('../vendor/katex/katex.min.js');let panels=0,formulas=0;
 for(const scene of scenes){assert(scene.lesson.figures.length>0);for(const f of scene.lesson.figures){panels++;for(const key of ['title','where','axes','encoding','read'])assert(f[key]?.length>0,scene.id+' '+key);for(const tex of Array.isArray(f.tex)?f.tex:[f.tex]){const html=katex.renderToString(tex,{displayMode:true,throwOnError:true,strict:false});assert(html.includes('katex-mathml'));formulas++;}}}
 console.log('Verified panel guides:',panels,'; typeset formula blocks:',formulas);
});
test('book catalog has all 289 PDF-verified question IDs, consistent incidence counts and page offsets',()=>{
 const c=box.window.QS_CATALOG;assert.equal(c.questions.length,289);assert.equal(new Set(c.questions.map(q=>q.id)).size,289);assert.equal(c.models.length,26);
 const physical=new Set();for(const m of c.models){assert.equal(m.count,m.questionIds.length);assert.equal(new Set(m.questionIds).size,m.count);for(const id of m.questionIds){const q=c.questions.find(q=>q.id===id);assert(q&&q.models.includes(m.id));if(m.kind!=='kinematic')physical.add(id);}}
 assert.equal(physical.size,c.namedModelQuestionCount);near(c.namedModelQuestionCount+c.generalOrKinematicQuestionCount,289,0);
 for(const q of c.questions){near(q.pdf-q.printed,6,0);assert(q.reviewed);}
 assert(c.models.find(m=>m.id==='spherical-boundary').questionIds.includes('4.1'));assert(!c.models.find(m=>m.id==='hard-box').questionIds.includes('4.1'));
});
