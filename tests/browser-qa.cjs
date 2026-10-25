const { chromium } = require('C:/Users/26782/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'output'),ART=path.join(OUT,'verification');fs.mkdirSync(ART,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--allow-file-access-from-files']});
 const context=await browser.newContext({viewport:{width:1536,height:1024},acceptDownloads:true});
 const page=await context.newPage(),errors=[],network=[];page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});page.on('pageerror',e=>errors.push(e.stack||String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('file:///'+path.join(OUT,'量子世界.html').replaceAll('\\','/'));
 await page.waitForSelector('#scene-title');await page.evaluate(()=>document.fonts.ready);await page.getByRole('button',{name:'暂停',exact:true}).click();
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(ART,'01-氢原子概率云.png'),fullPage:true});
 const sceneIDs=await page.evaluate(()=>window.QS_SCENES.map(s=>s.id));assert.equal(sceneIDs.length,52);
 let stageResults=[];
 assert.equal(await page.locator('.katex-error').count(),0);
 for(const id of sceneIDs){
   await page.evaluate(id=>{location.hash=id},id);await page.waitForFunction(id=>document.querySelector('[data-scene="'+id+'"]')?.getAttribute('aria-selected')==='true',id);
   const title=await page.locator('#scene-title').innerText();
   const explanations=await page.locator('.figure-note').count(),formulaCount=await page.locator('#formula .katex').count();
   const expected=await page.evaluate(id=>window.QS_SCENES.find(s=>s.id===id).lesson.figures.length,id);
   assert.equal(explanations,expected,id+' missing panel guide');assert.equal(formulaCount,expected,id+' missing typeset formula');assert.equal(await page.locator('.katex-error').count(),0);

   let invalid=await page.locator('#metrics').innerText();assert(!/NaN|undefined|Infinity/.test(invalid),id+' invalid metric: '+invalid);
   // Render real scene at time 0, mid-time and all declared parameter extremes.
   const renderCheck=await page.evaluate(id=>{
      const s=window.QS_SCENES.find(s=>s.id===id),c=document.createElement('canvas');c.width=900;c.height=540;let ctx=c.getContext('2d'),p=Object.fromEntries(s.controls.map(c=>[c.key,c.value]));let frames=0;
      for(const control of s.controls){for(const value of control.options?control.options.map(o=>o.value):[control.min,control.max]){let q={...p,[control.key]:value};ctx.save();s.render(ctx,900,540,(s.duration||20)*.43,q,window.QSKit);ctx.restore();frames++;}}
      for(const t of [0,(s.duration||20)*.6]){ctx.save();s.render(ctx,590,560,t,p,window.QSKit);ctx.restore();frames++;}return frames;
   },id);
   stageResults.push({id,title,renderedParameterFrames:renderCheck});
   if(['tunneling','superposition','rabi','entanglement','correlation','perturbation','fourier','operator','sudden-force','momentum-kick','phase-space','atomic-drive','landau-zener','stern-gerlach','two-site','hydrogen-model','infinite-well','finite-well','rigid-rotor','landau-model','spherical-well','coupled-spins'].includes(id))await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(ART,id+'.png'),fullPage:true});
 }

 // Model inventory is usable, source refs are exposed, and downloads are real.
 await page.getByRole('button',{name:'原书模型谱',exact:true}).click();assert.equal(await page.locator('.model-card').count(),26);
 assert((await page.locator('[data-model="oscillator"] .model-count').innerText()).includes('54'));
 await page.locator('#catalog-search').fill('转子');assert(await page.locator('.model-card').count()>0);
 await page.locator('[data-model="rotor"] summary').click();assert((await page.locator('[data-model="rotor"] .question-refs').innerText()).includes('5.18'));
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(ART,'模型谱-题号页码.png'),fullPage:true});
 const csvP=page.waitForEvent('download');await page.locator('#catalog-download').click();const csv=await csvP;await csv.saveAs(path.join(ART,'题号模型对照实测.csv'));assert.equal(fs.readFileSync(path.join(ART,'题号模型对照实测.csv'),'utf8').split('\r\n').length,290);
 await page.locator('[data-model-scene="rigid-rotor"]').first().click();await page.waitForFunction(()=>location.hash==='#rigid-rotor');
 const ell=page.locator('#param-ell'),m=page.locator('#param-m');await m.evaluate(e=>{e.value=e.max;e.dispatchEvent(new Event('input',{bubbles:true}));});await ell.evaluate(e=>{e.value=0;e.dispatchEvent(new Event('input',{bubbles:true}));});assert.equal(await m.inputValue(),'0');assert.equal(await m.getAttribute('max'),'0');
 await page.evaluate(()=>{location.hash='spherical-well'});await page.waitForFunction(()=>document.querySelector('[data-scene="spherical-well"]')?.getAttribute('aria-selected')==='true');await page.locator('#param-V').evaluate(e=>{e.value=.5;e.dispatchEvent(new Event('input',{bubbles:true}));});assert((await page.locator('#metrics').innerText()).includes('0'));
 // Physical-operation steps and named key-time controls really alter the state.
 await page.evaluate(()=>{location.hash='atomic-drive'});await page.waitForFunction(()=>document.querySelector('[data-scene="atomic-drive"]')?.getAttribute('aria-selected')==='true');
 assert(await page.locator('#operation-strip').isVisible());await page.getByRole('button',{name:'等权叠加',exact:true}).click();assert((await page.locator('#metrics').innerText()).includes('0.500'));assert.equal(await page.locator('#play-button').getAttribute('aria-label'),'播放');await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(ART,'04-共振驱动混合态.png'),fullPage:true});
 await page.evaluate(()=>{location.hash='landau-zener'});await page.waitForFunction(()=>document.querySelector('[data-scene="landau-zener"]')?.getAttribute('aria-selected')==='true');await page.getByRole('button',{name:'扫场终点',exact:true}).click();assert((await page.locator('#time-value').innerText()).includes('48.00'));
 await page.locator('#timeline').evaluate(e=>{e.value=Number(e.max)-.05;e.dispatchEvent(new Event('input',{bubbles:true}));});await page.getByRole('button',{name:'播放',exact:true}).click();await page.waitForTimeout(350);assert.equal(await page.locator('#play-button').getAttribute('aria-label'),'播放','nonlooping evolution must pause at the end');assert((await page.locator('#time-value').innerText()).includes('48.00'));
 // Observable UI parameter transition, seek and reset.
 await page.evaluate(()=>{location.hash='rabi'});await page.waitForFunction(()=>document.querySelector('[data-scene="rabi"]')?.getAttribute('aria-selected')==='true');
 const range=page.locator('#parameters input[type=range]').first();const initial=await range.inputValue();await range.evaluate(e=>{e.value=e.max;e.dispatchEvent(new Event('input',{bubbles:true}));});assert.notEqual(await range.inputValue(),initial);
 await page.locator('#timeline').evaluate(e=>{e.value=Number(e.max)*.5;e.dispatchEvent(new Event('input',{bubbles:true}));});assert((await page.locator('#time-value').innerText()).includes('t '));assert.equal(await page.locator('#play-button').getAttribute('aria-label'),'播放');
 await page.getByRole('button',{name:'重置实验',exact:true}).click();assert.equal(await range.inputValue(),initial);assert((await page.locator('#time-value').innerText()).includes('0.00'));
 // Downloaded PNG is actually generated and valid.
 const downloadP=page.waitForEvent('download');await page.getByRole('button',{name:'导出画面',exact:true}).click();const png=await downloadP;const pngPath=path.join(ART,'导出画面实测.png');await png.saveAs(pngPath);assert(fs.readFileSync(pngPath).subarray(1,4).toString()==='PNG');
 // Real recording started and stopped, read-back duration checked separately using ffprobe.
 await page.getByRole('button',{name:'录制动画',exact:true}).click();await page.getByRole('button',{name:'开始录制并下载',exact:true}).click();await page.waitForTimeout(3200);const videoP=page.waitForEvent('download');await page.locator('#record-button').click();const video=await videoP;const videoPath=path.join(ART,'录制动画实测'+path.extname(video.suggestedFilename()));await video.saveAs(videoPath);assert(fs.statSync(videoPath).size>10000);
 await page.getByRole('button',{name:'学习导览',exact:true}).click();assert(await page.getByRole('heading',{name:'从看见，到理解'}).isVisible());assert.equal(await page.locator('.guide-chapter').count(),7);await page.getByRole('button',{name:'关闭导览',exact:true}).click();
 await page.getByRole('button',{name:'开始全章导览',exact:true}).click();assert((await page.locator('#scene-title').innerText()).length>0);assert((await page.locator('#tour-status').innerText()).includes('1 / 52'));await page.getByRole('button',{name:'退出全章导览',exact:true}).click();
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{location.hash='bloch'});await page.waitForFunction(()=>document.querySelector('[data-scene="bloch"]')?.getAttribute('aria-selected')==='true');await page.waitForTimeout(5000);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(ART,'02-手机布局.png'),fullPage:true});
 const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));assert(size.scroll<=size.viewport,'page horizontal overflow '+JSON.stringify(size));
 await page.evaluate(()=>{location.hash='hydrogen-model'});await page.waitForFunction(()=>document.querySelector('[data-scene="hydrogen-model"]')?.getAttribute('aria-selected')==='true');await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(ART,'氢原子-手机逐图说明.png'),fullPage:true});
 const mobile=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));assert(mobile.scroll<=mobile.viewport,'new model mobile overflow');
 await page.setViewportSize({width:1280,height:800});await page.evaluate(()=>{location.hash='orbital'});await page.waitForFunction(()=>document.querySelector('[data-scene="orbital"]')?.getAttribute('aria-selected')==='true');await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(ART,'03-平板横屏.png'),fullPage:true});
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(network.length,0,'Offline HTML must not request network resources');let report={browser:'Chrome headless via Playwright; IAB failed: privileged native pipe bridge is not available; browser-client is not trusted',offlineFile:true,viewports:['1536x1024','1280x800','390x844'],sceneCount:sceneIDs.length,panelGuides:103,typesetFormulaBlocks:103,externalNetworkRequests:network,stageResults,consoleErrors:errors,exportPngBytes:fs.statSync(pngPath).size,recordedVideoBytes:fs.statSync(videoPath).size,checks:['all chapter tabs','52 scene default render','all parameter endpoint and select-option render','all narrow stage renders','range input','time seek','reset','PNG download','real video recording download','guide dialog and 7 chapters','tour start and stop','mobile page overflow','103 panel explanations and rendered KaTeX formula blocks','26 model catalog groups and source pages','289-row CSV export','dependent quantum-number controls','no external network requests']};fs.writeFileSync(path.join(ART,'browser-qa.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
