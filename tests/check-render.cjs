const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {launchBrowser,reportPath}=require('./helpers.cjs');
(async()=>{
 const browser=await launchBrowser();
 const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,1000));});
 await page.addInitScript(()=>{window.renderLongTasks=[];new PerformanceObserver(list=>{for(const e of list.getEntries())window.renderLongTasks.push({start:e.startTime,duration:e.duration})}).observe({type:'longtask',buffered:true});});
 const started=Date.now();await page.goto(pathToFileURL(path.resolve(__dirname,'../dist/rainy-corner.html')).href,{timeout:120000});await page.waitForFunction(()=>window.__district?.ready||window.__districtError,{},{timeout:120000});
 assert.equal(await page.evaluate(()=>window.__districtError),undefined);
 const readyMs=Date.now()-started;
 const defaults=await page.evaluate(()=>({quality:__district.quality,inventory:__district.inventory,street:__district.street,uiQualityButton:!!document.querySelector('#quality'),startup:__district.startup}));
 assert.equal(defaults.quality.mode,'high-realtime');assert(defaults.quality.ambientOcclusion&&defaults.quality.reflections&&defaults.quality.softShadows);
 assert.equal(defaults.uiQualityButton,false);assert(defaults.inventory.items>400);assert(defaults.inventory.categories.includes('日用品'));assert(defaults.inventory.categories.includes('面包'));assert(defaults.street.lamps>=4);
 await page.waitForTimeout(1600);const start=await page.evaluate(()=>({frames:__district.frames,time:performance.now()}));
 await page.waitForTimeout(3000);const runtime=await page.evaluate(start=>({fps:(__district.frames-start.frames)/((performance.now()-start.time)/1000),longTasks:renderLongTasks.filter(t=>t.start>start.time),drawCalls:__district.drawCalls,triangles:__district.renderer.info.render.triangles,quality:__district.quality}),start);
 assert(runtime.fps>20,`Default rendering too slow: ${runtime.fps}`);
 assert(runtime.longTasks.every(t=>t.duration<500),'Default rendering has a prolonged stall');
 const interactions=[];
 for(const v of ['god','interior','water','street']){
  const ms=await page.evaluate(v=>{const s=performance.now();__district.selectView(v,true);return performance.now()-s},v);
  await page.waitForTimeout(600);interactions.push({view:v,handlerMs:ms});assert(ms<250,'View switch synchronously blocks');
 }
 const before=await page.evaluate(()=>__district.controls.getAzimuthalAngle());await page.mouse.move(880,480);await page.mouse.down();await page.mouse.move(1020,510,{steps:10});await page.mouse.up();await page.waitForTimeout(350);
 assert(Math.abs(await page.evaluate(()=>__district.controls.getAzimuthalAngle())-before)>.05);assert.equal(await page.evaluate(()=>__district.quality.mode),'high-realtime');
 assert.deepEqual(errors,[]);const result={readyMs,defaults,runtime,interactions,errors};fs.writeFileSync(reportPath('render-report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
