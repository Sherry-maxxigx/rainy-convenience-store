// Editable scene source. This project no longer depends on the earlier version folders.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import assets from './assets.js';
import nightHDR from './night.js';
import models from './models.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';

async function main(){
const $=s=>document.querySelector(s),mobile=innerWidth<700;const startup={started:performance.now()};const loadingStage=text=>{$('#loading small').textContent=text;};
let seed=7319;const rnd=(a=0,b=1)=>{seed=(seed*1664525+1013904223)>>>0;return a+seed/4294967296*(b-a)};
const scene=new THREE.Scene();scene.background=new THREE.Color('#101721');scene.fog=new THREE.FogExp2('#101721',.018);
const renderer=new THREE.WebGLRenderer({canvas:$('#scene'),antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:false});
const initialPixelRatio=Math.min(devicePixelRatio,mobile?1.25:1.5);renderer.setPixelRatio(initialPixelRatio);renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;renderer.info.autoReset=false;
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.15,240);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;
controls.minDistance=.8;controls.maxDistance=45;controls.maxPolarAngle=Math.PI*.61;controls.minPolarAngle=.001;
controls.screenSpacePanning=false;controls.panSpeed=.85;controls.rotateSpeed=.58;controls.zoomSpeed=.8;
controls.target.set(-7,0,-5);camera.position.set(35,43,47);controls.update();
scene.add(new THREE.HemisphereLight('#a1bad5','#25282b',.30));
const moon=new THREE.DirectionalLight('#b8cde4',.76);moon.position.set(-18,24,15);moon.target.position.set(-8,2,-5);scene.add(moon.target);moon.castShadow=true;
moon.shadow.mapSize.set(2048,2048);Object.assign(moon.shadow.camera,{left:-17,right:17,top:17,bottom:-17,near:1,far:65});
moon.shadow.bias=-.00008;moon.shadow.normalBias=.018;moon.shadow.radius=3;scene.add(moon);
const rim=new THREE.DirectionalLight('#b3c7df',.22);rim.position.set(35,20,-40);scene.add(rim);
const roofGroup=new THREE.Group();roofGroup.name='removable-store-roof';scene.add(roofGroup);
const storeGroup=new THREE.Group();storeGroup.name='convenience-store';scene.add(storeGroup);
const buildings=[],batches=new Map(),geom={box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(1,1,1,20),sphere:new THREE.SphereGeometry(1,10,8),round:new RoundedBoxGeometry(1,1,1,3,.09)};
const temp=new THREE.Object3D(),rotQ=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0);
function instance(type,size,pos,mat,parent=scene,rotation=0){
 const key=`${type}/${mat.uuid}/${parent.uuid}`;if(!batches.has(key))batches.set(key,{type,mat,parent,matrices:[]});
 temp.position.set(...pos);temp.scale.set(...size);temp.rotation.set(0,0,0);
 if(typeof rotation==='number')temp.rotation.y=rotation;else if(rotation.isQuaternion)temp.quaternion.copy(rotation);else temp.rotation.set(...rotation);
 temp.updateMatrix();batches.get(key).matrices.push(temp.matrix.clone());
}
const box=(w,h,d,x,y,z,m,p=scene,r=0)=>instance('box',[w,h,d],[x,y,z],m,p,r);
const cyl=(r,h,x,y,z,m,p=scene,rotation=0)=>instance('cylinder',[r,h,r],[x,y,z],m,p,rotation);
function rod(a,b,r,mat,parent=scene){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);rotQ.setFromUnitVectors(up,delta.clone().normalize());instance('cylinder',[r,delta.length(),r],av.add(bv).multiplyScalar(.5).toArray(),mat,parent,rotQ);}
function finishInstances(){for(const b of batches.values()){const mesh=new THREE.InstancedMesh(geom[b.type],b.mat,b.matrices.length);b.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=!b.mat.transparent&&b.mat.emissiveIntensity!==4;mesh.receiveShadow=true;b.parent.add(mesh);}batches.clear();}
function mat(color,roughness=.75,metalness=0,extra={}){return new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});}
function canvasTex(w,h,paint){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
const textureLoader=new THREE.TextureLoader();
const loaded=await Promise.all(Object.entries(assets).map(async([key,url])=>[key,await textureLoader.loadAsync(url)]));
startup.textures=performance.now();loadingStage('正在准备灯光与室内陈列');const textures=Object.fromEntries(loaded);for(const[k,t]of loaded){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(!k.endsWith('_nor_gl')&&!k.endsWith('_rough'))t.colorSpace=THREE.SRGBColorSpace;}
function textured(name,color,repeat,roughness=1){const maps={};for(const[suffix,slot]of [['diff','map'],['nor_gl','normalMap'],['rough','roughnessMap']]){maps[slot]=textures[name+'_'+suffix].clone();maps[slot].repeat.set(...repeat);maps[slot].needsUpdate=true;}return mat(color,roughness,0,{...maps,normalScale:new THREE.Vector2(.45,.45)});}
const concrete=textured('concrete_wall_007','#778b92',[2,2]);
const concreteDark=textured('concrete_wall_007','#3b505b',[2,2]);
const brick=textured('brick_wall_001','#8c8981',[3,3]);
const brickDark=textured('brick_wall_001','#606e74',[3,3]);
const asphalt=textured('asphalt_02','#a2a4a1',[24,24],.72);
const sidewalk=textured('concrete_wall_007','#888e8d',[14,14],.91);
const roofMat=textured('concrete_wall_007','#596c75',[3,3],.72);
const steel=mat('#60747e',.35,.65),trim=mat('#384e5c',.42,.7),black=mat('#101e29',.78),rubber=mat('#111a20',.95),white=mat('#bdc8c5',.65),pale=mat('#9aa9a8',.6),drainMat=mat('#263b46',.46,.6);
const lightMat=mat('#e9ebe7',.4,.0,{emissive:'#e8f0f7',emissiveIntensity:7.5});
const glass=mat('#263c49',.19,.65,{transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide});
const panes=[mat('#1a2e3e',.2,.32),mat('#233949',.25,.3),mat('#8dadae',.45,.1,{emissive:'#99b8c3',emissiveIntensity:.22}),mat('#b6a37d',.65,.05,{emissive:'#c1a26c',emissiveIntensity:.13})];
const curtains=canvasTex(128,192,(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#9fa9a3');g.addColorStop(.55,'#bdc6bc');g.addColorStop(1,'#535f61');c.fillStyle=g;c.fillRect(0,0,w,h);for(let i=0;i<w;i+=9){c.fillStyle='#1b32362c';c.fillRect(i,0,3,h);}c.fillStyle='#132b3652';c.fillRect(0,h*.78,w,h*.22);c.fillRect(13,128,22,43);});
panes[2].map=panes[2].emissiveMap=curtains;panes[3].map=panes[3].emissiveMap=curtains;
const markTex=canvasTex(128,128,(c,w,h)=>{c.fillStyle='#b2b7ad';c.fillRect(0,0,w,h);for(let i=0;i<5000;i++){c.fillStyle=`rgba(20,38,47,${rnd(.05,.8)})`;c.fillRect(rnd(0,w),rnd(0,h),rnd(1,3),rnd(1,5));}});
const paint=mat('#bfc8c1',.78,0,{map:markTex});
function point(x,y,z,color,power,range=14){const l=new THREE.PointLight(color,power,range,2);l.position.set(x,y,z);scene.add(l);return l;}
function signTexture(text,sub,w=1024,h=160){return canvasTex(w,h,(c)=>{c.fillStyle='#274c58';c.fillRect(0,0,w,h);c.fillStyle='#d3e4dd';c.fillRect(0,0,w,6);c.font=`500 ${h*.51}px "Microsoft YaHei",sans-serif`;c.textBaseline='middle';c.fillText(text,36,h*.43);c.fillStyle='#9db9b8';c.font=`${h*.115}px Arial,"Microsoft YaHei"`;c.fillText(sub,40,h*.84);c.fillStyle='#d7e9df';c.textAlign='right';c.font=`${h*.53}px Arial`;c.fillText('24',w-32,h*.43);c.font=`${h*.12}px Arial`;c.fillText('HOURS',w-36,h*.84);});}
function signMat(t,intensity=.7){return mat('#ffffff',.45,.08,{map:t,emissiveMap:t,emissive:'#d6ece9',emissiveIntensity:intensity});}


const env=await new RGBELoader().loadAsync(nightHDR);
// Keep a subdued, neutral sky reflection; nearby practical lamps provide the highlights.
for(let i=0;i<env.image.data.length;i+=4){
 const read=j=>THREE.DataUtils.fromHalfFloat(env.image.data[i+j]);
 const r=read(0),g=read(1),b=read(2),l=r*.2126+g*.7152+b*.0722;
 for(let j=0;j<3;j++){const c=[r,g,b][j]*.35+l*.65;env.image.data[i+j]=THREE.DataUtils.toHalfFloat(Math.min(c,1.7)*[.89,.96,1.07][j]);}
}env.needsUpdate=true;
env.mapping=THREE.EquirectangularReflectionMapping;
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(env).texture;
scene.environmentIntensity=.32;scene.environmentRotation.y=1.35;pmrem.dispose();
// Detailed library props retain surface wear, printed packaging and irregular silhouettes.
startup.environment=performance.now();const modelLoader=new GLTFLoader(),scans={};
await Promise.all(Object.entries(models).map(async([key,data])=>{const gltf=typeof data==='string'?await modelLoader.loadAsync(data):await modelLoader.parseAsync(JSON.stringify(data),'');scans[key]=gltf.scene;gltf.scene.updateMatrixWorld(true);}));
function placeScannedProp(key,position,height,angle=0){
 const source=scans[key],group=new THREE.Group();group.name=key;
 source.traverse(o=>{if(!o.isMesh)return;if(key==='metal_trash_can'&&!o.name.includes('rust'))return;
 const geo=o.geometry.clone();geo.applyMatrix4(o.matrixWorld);const mesh=new THREE.Mesh(geo,o.material.clone());mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);});
 group.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(group),size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3()),scale=height/size.y;
 group.children.forEach(o=>{o.geometry.translate(-center.x,-b.min.y,-center.z);});group.scale.setScalar(scale);group.rotation.y=angle;group.position.set(...position);scene.add(group);return group;
}

startup.models=performance.now();
// A single complete building. Surface maps supply grain, never windows or merchandise.
const sx=-8,sz=-5.4,sw=10.8,sd=8.8,shopH=3.22,fullH=6.57;
const left=sx-sw/2,right=sx+sw/2,front=-1,back=-9.8;
buildings.push({x:sx,z:sz,w:sw,d:sd,h:fullH,store:true});
const plaster=textured('white_plaster_rough_01','#c4c2b6',[1.7,1.7],.94);
plaster.normalScale.set(.38,.38);
const foundation=textured('concrete_wall_007','#807d70',[1,1],.83);
const roofTar=textured('asphalt_02','#bfc8c2',[3,3],.72);
const aluminium=mat('#aeb6b4',.32,.82),paintedMetal=mat('#677571',.55,.3),enamel=mat('#d3d3c5',.43,.12),darkMetal=mat('#303b3b',.46,.65),rust=mat('#635340',.84,.15);
const paper=mat('#c2c2ab',.9),charcoal=mat('#1c2221',.85),seal=mat('#252b29',.85),grout=mat('#646d67',.85);
const waterGlass=new THREE.MeshPhysicalMaterial({color:'#e2ebe7',roughness:.045,metalness:.07,transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide,clearcoat:1,clearcoatRoughness:.035,envMapIntensity:1.1});
function round(w,h,d,x,y,z,m,p=storeGroup,r=0){instance('round',[w,h,d],[x,y,z],m,p,r);}
function solid(w,h,d,x,y,z,m,p=storeGroup,bevel=.002){
 const g=new RoundedBoxGeometry(w,h,d,2,Math.min(bevel,w*.2,h*.2,d*.2));
 const a=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
 for(let i=0;i<a.count;i++){const xx=a.getX(i)+x,yy=a.getY(i)+y,zz=a.getZ(i)+z;const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));uv.setXY(i,(nx>.8?-zz:xx)/2.8,(ny>.8?zz:yy)/2.8);}
 const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;
}
function face(w,h,x,y,z,m,p=storeGroup,angle=0){const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);o.position.set(x,y,z);o.rotation.y=angle;o.receiveShadow=true;p.add(o);return o;}
function torus(r,t,x,y,z,m,p=storeGroup,rotation=[0,0,0]){const o=new THREE.Mesh(new THREE.TorusGeometry(r,t,6,32),m);o.position.set(x,y,z);o.rotation.set(...rotation);o.castShadow=true;p.add(o);}
function wire(points,r=.009,m=darkMetal,p=storeGroup){const path=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));const o=new THREE.Mesh(new THREE.TubeGeometry(path,32,r,6,false),m);o.castShadow=true;p.add(o);}
function label(text,sub,color='#e1dfc8',ink='#37483f',width=512,height=192){return canvasTex(width,height,(c,w,h)=>{c.fillStyle=color;c.fillRect(0,0,w,h);c.fillStyle=ink;c.textAlign='center';c.font=`600 ${h*.38}px "Microsoft YaHei"`;c.fillText(text,w/2,h*.50);c.font=`${h*.15}px "Microsoft YaHei"`;c.fillText(sub,w/2,h*.79);});}
function decalTexture(){return canvasTex(512,512,(c,w,h)=>{c.clearRect(0,0,w,h);for(let i=0;i<110;i++){let x=rnd(0,w),hh=rnd(15,480);const g=c.createLinearGradient(x,0,x,hh);g.addColorStop(0,`rgba(40,43,31,${rnd(.04,.17)})`);g.addColorStop(1,'rgba(30,36,27,0)');c.fillStyle=g;c.fillRect(x,0,rnd(1,13),hh);}for(let i=0;i<800;i++){c.fillStyle=`rgba(42,47,36,${rnd(.005,.09)})`;c.fillRect(rnd(0,w),rnd(0,h),rnd(2,12),rnd(1,8));}});}
const stain=mat('#ffffff',.99,0,{map:decalTexture(),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});

// The pavement has separate kerbs, joints, drains, and chipped corners.
asphalt.roughness=.76;asphalt.normalScale.set(.42,.42);asphalt.color.set('#777f83');for(const t of [asphalt.map,asphalt.normalMap,asphalt.roughnessMap])t.repeat.set(56,56);
box(130,.24,130,0,-.14,0,asphalt);
solid(110,.16,14.4,-8,.06,-5.8,foundation,scene,.02);
const paving=[0,1,2,3,4].map(i=>textured('concrete_wall_007',['#999d92','#9c9d92','#8e978f','#a3a297','#94998e'][i],[.6,.6],.58));
for(let x=-58.7;x<45;x+=.78)for(let z=-10.9;z<1.4;z+=.78){if(x>left-.1&&x<right&&z<front&&z>back)continue;box(.768,.028,.768,x+.39,.156,z+.39,paving[Math.floor(rnd(0,5))]);}
for(let x=-60;x<45;x+=.8)round(.786,.21,.22,x+.4,.08,1.48,foundation,scene);
// The kerb continues along the street rather than forming an isolated display plinth.

for(const x of[-13.4,-2.0]){box(.78,.023,.32,x,.174,1.3,darkMetal);for(let i=0;i<14;i++)box(.023,.025,.28,x-.35+i*.054,.189,1.3,aluminium);box(.91,.012,.44,x,.17,1.3,darkMetal);}
cyl(.32,.015,-.8,-.004,4,paintedMetal);torus(.305,.012,-.8,.007,4,darkMetal,scene,[Math.PI/2,0,0]);
for(let k=-3;k<=3;k++)box(.48,.006,.014,-.8,.009,4+k*.064,seal);

// Real wall openings: the upper walls are built around the windows.
solid(sw,.21,sd,sx,.275,sz,foundation);
solid(.25,2.9,sd,left+.125,1.8,sz,plaster);
solid(sw,2.9,.25,sx,1.8,back+.125,plaster);
solid(.25,2.9,6.35,right-.125,1.8,-6.625,plaster);
solid(.25,.52,2.2,right-.125,.61,-2.1,plaster);
solid(.25,.27,2.2,right-.125,3.08,-2.1,plaster);
solid(sw,.23,sd,sx,3.28,sz,plaster,roofGroup);
solid(sw+.12,.13,.34,sx,3.42,front+.025,foundation,roofGroup);
solid(.34,.13,sd,right-.025,3.42,sz,foundation,roofGroup);
solid(sw,.75,.28,sx,3.87,front-.14,plaster,roofGroup);
solid(sw,.57,.28,sx,6.24,front-.14,plaster,roofGroup);
const windowCenters=[-11.62,-8,-4.38],winW=2.02,winBottom=4.245,winTop=5.955;
let wallCursor=left;for(const x of windowCenters){const edge=x-winW/2;if(edge>wallCursor)solid(edge-wallCursor,1.71,.28,(edge+wallCursor)/2,5.1,front-.14,plaster,roofGroup);wallCursor=x+winW/2;}
solid(right-wallCursor,1.71,.28,(right+wallCursor)/2,5.1,front-.14,plaster,roofGroup);
// Side walls also contain actual holes.
for(const bx of[left+.14,right-.14]){
 solid(.28,.75,sd,bx,3.87,sz,plaster,roofGroup);solid(.28,.57,sd,bx,6.24,sz,plaster,roofGroup);
 let cursor=back;for(const z of[-7.55,-3.75]){const edge=z-.78;solid(.28,1.71,edge-cursor,bx,5.1,(edge+cursor)/2,plaster,roofGroup);cursor=z+.78;}
 solid(.28,1.71,front-cursor,bx,5.1,(front+cursor)/2,plaster,roofGroup);
}
solid(sw,3.02,.28,sx,5.01,back+.14,plaster,roofGroup);
solid(10.3,.08,8.3,sx,3.44,sz,charcoal,roofGroup);
solid(.12,2.75,8.2,-6.35,4.9,sz,grout,roofGroup);

const curtainMats=['#6e7770','#777b6d','#687479'].map(c=>mat(c,.98));
function windowUnit(x,z,w,angle=0,index=0){
 const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;roofGroup.add(g);
 const put=(a,b,d,u,y,depth,m)=>box(a,b,d,u,y,depth,m,g);
 put(w+.14,.11,.44,0,winBottom-.04,.025,foundation);
 put(w+.1,.08,.34,0,winTop+.04,-.02,plaster);
 for(const u of[-w/2+.035,w/2-.035])put(.065,1.68,.115,u,5.1,-.07,aluminium);
 for(const y of[winBottom+.035,winTop-.035])put(w-.04,.065,.115,0,y,-.07,aluminium);
 put(w-.12,1.54,.025,0,5.1,-.13,waterGlass);
 put(.055,1.6,.12,0,5.1,-.09,aluminium);put(w-.09,.032,.08,0,4.72,-.028,aluminium);
 put(.016,1.52,.02,-.044,5.1,-.005,seal);put(.018,1.52,.02,.044,5.1,-.005,seal);
 for(const u of[-.10,.10])put(.025,.12,.045,u,4.96,.014,darkMetal);
 put(w-.08,1.55,.05,0,5.1,-.74,charcoal);
 const cloth=new THREE.PlaneGeometry(w*.94,1.52,92,20),cp=cloth.attributes.position;
 for(let i=0;i<cp.count;i++){const u=cp.getX(i),v=cp.getY(i);cp.setZ(i,.045*Math.sin(u*43)+.011*Math.sin(u*89+v*.8));cp.setY(i,v+.014*Math.sin(u*29)*(1-(v+.76)/1.52));}
 cloth.computeVertexNormals();const drape=new THREE.Mesh(cloth,curtainMats[index%3]);drape.position.set(0,5.08,-.42);drape.castShadow=drape.receiveShadow=true;g.add(drape);
 const drips=new THREE.Mesh(new THREE.PlaneGeometry(w+.08,.75),stain);drips.position.set(0,winBottom-.46,.018);g.add(drips);
 if(index===0){for(let u=-w*.42;u<w*.44;u+=.22)put(.013,1.66,.025,u,5.1,.14,paintedMetal);for(const y of[4.4,5.8])put(w,.018,.03,0,y,.14,paintedMetal);}
}
windowCenters.forEach((x,i)=>windowUnit(x,front,winW,0,i));
for(const z of[-3.75,-7.55]){windowUnit(right,z,1.56,Math.PI/2,2);windowUnit(left,z,1.56,-Math.PI/2,1);}
// Fine weathering belongs to the surface, independent of architectural geometry.
face(sw,.52,sx,6.26,front+.008,stain,roofGroup);
face(sd,.55,right+.008,6.24,sz,stain,roofGroup,Math.PI/2);
face(sd,.65,right+.009,.75,sz,stain,storeGroup,Math.PI/2);
face(sw,1.3,sx,2.35,back-.014,stain,storeGroup,Math.PI);
// Individual glazed ceramic tiles along the storefront piers and side skirting.
const tileMats=['#7c8d7f','#879282','#959d8c','#7b8b81'].map(c=>mat(c,.36,.08));
for(const x of[left+.17,right-.17])for(let y=.48;y<3.1;y+=.13)for(let j=0;j<3;j++)box(.095,.118,.025,x+(j-1)*.1,y,front+.015,tileMats[Math.floor(rnd(0,4))]);
for(let z=-9.5;z<-3.35;z+=.20)for(let y=.47;y<.86;y+=.13)box(.025,.116,.186,right+.016,y,z,tileMats[Math.floor(rnd(0,4))]);

// Shop floor: grouted individual tiles, with a raised threshold and rubber mat.
box(10.25,.035,8.2,sx,.393,sz,grout,storeGroup);
const floorMats=['#b1b3a4','#aeb0a0','#b8b8a8'].map(c=>mat(c,.38,.03));
for(let x=left+.27;x<right-.3;x+=.5)for(let z=back+.28;z<front-.25;z+=.5)box(.493,.015,.493,x+.246,.417,z+.246,floorMats[Math.floor(rnd(0,3))],storeGroup);
solid(2.22,.10,.54,-6.32,.363,-.92,foundation);
round(1.55,.022,.64,-6.32,.444,-1.64,seal);
for(let i=0;i<29;i++)box(.017,.008,.58,-7.03+i*.05,.459,-1.64,charcoal,storeGroup);

// Refrigerators have frames, clear doors, internal shelves and separately modeled bottles.
const productColors=['#d1c8a2','#4d7970','#a0473b','#b5b99c','#496174','#bd9c50','#7c5361','#718950'];
const productMats=productColors.map((c,i)=>new THREE.MeshPhysicalMaterial({color:['#7f6a39','#adc6b2','#c48c33','#e0dace','#8ea5a7','#c2b05d','#41301f','#9d7e3a'][i],roughness:i===3?.34:.2,metalness:.02,clearcoat:1,clearcoatRoughness:.13}));
const labelMats=productColors.map((c,i)=>mat('#ffffff',.46,0,{map:canvasTex(1024,256,(ctx,w,h)=>{
 ctx.fillStyle=['#d6d6bc','#d6e1d3','#e7d6ae','#e5e4cf','#c8d7cd','#e0d2a4','#c4b799','#d9d0a8'][i];ctx.fillRect(0,0,w,h);
 ctx.fillStyle=c;ctx.fillRect(0,0,w,26);ctx.fillRect(0,211,w,45);ctx.fillRect(174,26,165,185);
 ctx.fillStyle='#f0ead4';ctx.textAlign='center';ctx.font='600 43px "Microsoft YaHei"';ctx.fillText(['清茶','山泉','果汁','牛乳','苏打','柠檬','咖啡','麦茶'][i],256,112);ctx.font='15px Arial';ctx.fillText(['GREEN TEA','SPRING WATER','ORANGE','FRESH MILK','SODA','LEMON','COFFEE','BARLEY'][i],256,148);
 ctx.fillStyle=c;ctx.font='600 55px "Microsoft YaHei"';ctx.fillText(['清茶','山泉','果汁','牛乳','苏打','柠檬','咖啡','麦茶'][i],750,116);ctx.font='19px Arial';ctx.fillText('NATURAL  /  500 ml',750,158);
 ctx.fillStyle='#4c5148';ctx.textAlign='left';ctx.font='12px "Microsoft YaHei"';for(let y=60;y<185;y+=20)ctx.fillText('原料 · 饮用水  精选原叶  清爽口感',375,y);
 for(let x=30;x<140;x+=3){ctx.fillRect(x,70,Math.random()>.5?1:2,90);}ctx.font='11px monospace';ctx.fillText('692 012 85730',30,180);
 ctx.fillStyle='#ffffff77';ctx.fillRect(0,26,w,3);ctx.fillStyle='#273f3044';ctx.fillRect(0,207,w,3);
})}));
const caps=[mat('#d1d6c9',.4),mat('#567c73',.45),mat('#9e4f3e',.5)];
geom.bottle=new THREE.LatheGeometry([new THREE.Vector2(.033,0),new THREE.Vector2(.045,.008),new THREE.Vector2(.047,.04),new THREE.Vector2(.047,.16),new THREE.Vector2(.043,.182),new THREE.Vector2(.021,.213),new THREE.Vector2(.020,.236)],14);
geom.can=new THREE.CylinderGeometry(.047,.047,.145,20);
function bottle(x,y,z,i,scale=1,parent=storeGroup){
 i=((i%8)+8)%8;
 if(i===4||i===6){instance('can',[scale,scale,scale],[x,y+.074*scale,z],labelMats[i],parent,Math.PI/2);cyl(.043*scale,.008*scale,x,y+.149*scale,z,aluminium,parent);cyl(.036*scale,.003*scale,x,y+.155*scale,z,darkMetal,parent);box(.014*scale,.004,.027*scale,x,y+.159*scale,z,aluminium,parent);return;}
 const sy=scale*(i===3?.86:1),s=scale*(i===3?1.10:1);
 instance('bottle',[s,sy,s],[x,y,z],productMats[i],parent);
 cyl(.022*s,.025*sy,x,y+.243*sy,z,caps[i%3],parent);
 cyl(.048*s,.105*sy,x,y+.105*sy,z,labelMats[i],parent,Math.PI/2);
 for(const yy of[.025,.041,.178])cyl(.0478*s,.003*sy,x,y+yy*sy,z,productMats[i],parent);
}
const priceTex=label('￥ 3.50','冷藏饮品','#ddd7b6','#233e38',256,80),priceMat=mat('#ffffff',.75,0,{map:priceTex});
function fridge(x,z,w=1.0){
 round(w,.22,.82,x,.535,z,enamel);
 round(w,.19,.82,x,2.76,z,enamel);
 box(w,1.94,.07,x,1.67,z-.375,enamel,storeGroup);
 for(const dx of[-w/2+.035,w/2-.035])box(.07,1.94,.82,x+dx,1.67,z,enamel,storeGroup);
 box(w-.12,1.84,.025,x,1.68,z-.325,enamel,storeGroup);
 for(const dx of[-w/2+.055,w/2-.055])box(.045,1.9,.68,x+dx,1.67,z+.08,enamel,storeGroup);
 for(let shelf=0;shelf<5;shelf++){
  const y=.69+shelf*.347;box(w-.13,.023,.62,x,y,z+.05,aluminium,storeGroup);
  for(let k=0;k<7;k++)box(.008,.012,.58,x-w*.39+k*w*.13,y+.015,z+.05,enamel,storeGroup);
  for(let k=0;k<7;k++)for(let row=0;row<2;row++){if(rnd()<.05)continue;bottle(x-w*.37+k*w*.12,y+.027,z+.22-row*.22,(shelf+Math.floor(k/3)+Math.round(x*7)+80)%8,.93);}
  box(w-.12,.043,.025,x,y+.018,z+.37,enamel,storeGroup);for(let k=-1;k<=1;k++)box(.14,.039,.004,x+k*.27,y+.015,z+.385,priceMat,storeGroup);
 }
 for(const dx of[-w/2+.025,w/2-.025])box(.047,1.98,.07,x+dx,1.67,z+.45,aluminium,storeGroup);
 for(const y of[.677,2.66])box(w,.044,.075,x,y,z+.45,aluminium,storeGroup);
 box(w-.075,1.91,.012,x,1.67,z+.444,waterGlass,storeGroup);
 box(.021,1.78,.03,x-w*.43,1.66,z+.35,lightMat,storeGroup);
 rod([x+w*.38,1.22,z+.52],[x+w*.38,1.75,z+.52],.016,aluminium,storeGroup);
 for(const y of[1.24,1.73])rod([x+w*.38,y,z+.47],[x+w*.38,y,z+.52],.013,aluminium,storeGroup);
 for(let y=.51;y<.64;y+=.025)box(w-.15,.008,.018,x,y,z+.428,darkMetal,storeGroup);
 box(w-.16,.12,.02,x,2.82,z+.423,mat('#ffffff',.6,0,{map:label('冷 藏','FRESH & COLD','#9caea2','#2d4741',256,64)}),storeGroup);
}
for(const x of[-12.48,-11.40,-10.32])fridge(x,-2.04,1.02);
// Printed packaging shares one atlas; the silhouettes are modeled in centimetres.
const inventory={items:0,categories:new Set()};
const goods=[
 ['薄切薯片','SEA SALT','#aa3e26','#f6dfa0','bag',.17,.245,.065,'零食'],
 ['海苔脆片','ROASTED NORI','#284d38','#eee6bd','bag',.16,.225,.06,'零食'],
 ['黄油曲奇','BUTTER COOKIES','#b19151','#f4e6b9','box',.155,.22,.065,'饼干'],
 ['巧克力饼干','COCOA BISCUIT','#4e2f27','#eacb9f','box',.125,.25,.064,'饼干'],
 ['红烧牛肉面','BEEF NOODLES','#a82e24','#e9bb69','cup',.135,.135,.135,'方便面'],
 ['香菇炖鸡面','MUSHROOM SOUP','#47643c','#efd9a0','cup',.135,.135,.135,'方便面'],
 ['鲜汤拉面','SOUP NOODLES','#c79c43','#f1e6bd','pillow',.18,.095,.12,'方便面'],
 ['全麦吐司','WHOLE WHEAT','#9e683d','#e7d6a8','bread',.145,.235,.115,'面包'],
 ['奶油餐包','SOFT BREAD','#b88d58','#efe0b5','pillow',.17,.11,.105,'面包'],
 ['原味燕麦','ROLLED OATS','#385362','#f1e4c4','box',.17,.285,.07,'早餐'],
 ['山野香米','PREMIUM RICE','#8b5839','#f0e1b9','bag',.185,.28,.09,'粮油'],
 ['柔韧抽纸','SOFT TISSUE','#9caea3','#f4f0e1','tissue',.20,.10,.12,'纸品'],
 ['厨房用纸','KITCHEN TOWEL','#c4b789','#eeedda','tissue',.18,.19,.12,'纸品'],
 ['洁净洗衣液','LAUNDRY LIQUID','#44787c','#dce9d8','bottle',.145,.28,.075,'日用品'],
 ['清润洗发露','DAILY SHAMPOO','#bbc9b4','#35554a','bottle',.092,.26,.06,'日用品'],
 ['薄荷牙膏','MINT TOOTHPASTE','#527868','#eee9d9','box',.22,.055,.04,'日用品']
];
const merchandiseAtlas=canvasTex(2048,2048,(c)=>{
 const tile=512;
 goods.forEach((p,index)=>{
  c.save();c.translate(index%4*tile,Math.floor(index/4)*tile);c.fillStyle=p[2];c.fillRect(0,0,tile,tile);
  const shade=c.createLinearGradient(0,0,tile,0);shade.addColorStop(0,'#00000050');shade.addColorStop(.17,'#ffffff09');shade.addColorStop(.53,'#ffffff00');shade.addColorStop(.85,'#00000012');shade.addColorStop(1,'#00000050');c.fillStyle=shade;c.fillRect(0,0,tile,tile);
  c.fillStyle=p[3];c.fillRect(36,46,440,5);c.font='17px Georgia';c.textAlign='center';c.fillText('YU XIANG  /  EVERYDAY SELECTION',256,80);
  c.fillStyle=p[3];c.font='600 54px "Microsoft YaHei"';c.fillText(p[0],256,165,430);c.font='20px Arial';c.fillText(p[1],256,199);
  c.save();c.translate(256,302);
  if(index<=3){for(let j=0;j<9;j++){c.save();c.rotate(j*1.38);c.translate(20+j*3,j%2*12);c.fillStyle=index===1?'#657b37':index===3?'#68402b':'#d4ac62';c.strokeStyle='#815b32';c.lineWidth=2;c.beginPath();c.ellipse(35,0,index<2?50:31,index<2?28:30,.2,0,Math.PI*2);c.fill();c.stroke();for(let k=0;k<9;k++){c.fillStyle=index===3?'#35271c':'#a17a40';c.fillRect(rnd(6,62),rnd(-17,17),3,3);}c.restore();}}
  else if(index<=6){c.fillStyle='#eee4bd';c.beginPath();c.ellipse(0,6,122,64,0,0,Math.PI*2);c.fill();c.fillStyle='#8b582e';c.beginPath();c.ellipse(0,-3,108,48,0,0,Math.PI*2);c.fill();c.strokeStyle='#d9b779';c.lineWidth=3;for(let j=0;j<19;j++){c.beginPath();c.ellipse(rnd(-60,60),rnd(-17,17),rnd(10,34),rnd(3,10),rnd(-1,1),0,Math.PI*2);c.stroke();}for(let j=0;j<12;j++){c.fillStyle='#66823f';c.fillRect(rnd(-75,75),rnd(-30,28),10,5);}}
  else if(index<11){c.strokeStyle='#e4c389';c.lineWidth=3;for(let j=0;j<5;j++){c.beginPath();c.moveTo(-80+j*34,60);c.quadraticCurveTo(-48+j*28,-15,-28+j*18,-75);c.stroke();for(let k=0;k<6;k++){c.fillStyle='#d6af63';c.beginPath();c.ellipse(-48+j*25+k*2,-50+k*13,10,4,.5,0,Math.PI*2);c.fill();}}}
  else{c.fillStyle=p[3];c.globalAlpha=.85;for(let j=0;j<4;j++){c.beginPath();c.ellipse(-65+j*45,j%2*10,30,45,.5,0,Math.PI*2);c.fill();}c.globalAlpha=1;}
  c.restore();
  c.fillStyle=p[3];c.font='18px "Microsoft YaHei"';c.fillText(['薄脆酥香 · 分享好滋味','精选原料 · 每日所需','自然清香 · 舒心生活'][Math.floor(index/6)],256,415);c.fillRect(35,442,442,1);
  c.textAlign='left';c.font='14px "Microsoft YaHei"';c.fillText(index<11?'净含量  '+[80,45,150,120,108,106,120,320,90,500,1000][index]+'g':'家庭装 · 品质甄选',36,470);
  c.fillStyle='#ece5cd';c.fillRect(360,450,110,40);c.fillStyle='#323329';for(let k=0;k<40;k++)c.fillRect(365+k*2.5,454,rnd()<.4?2:1,23);c.font='8px monospace';c.fillText('6 92371 018260',366,486);
  for(const y of[9,495]){c.fillStyle=p[3]+'55';c.fillRect(0,y,512,2);for(let x=0;x<512;x+=5)c.fillRect(x,y-5,1,10);}
  c.restore();
 });
});
const merchandiseMaterial=new THREE.MeshPhysicalMaterial({map:merchandiseAtlas,color:'#ffffff',roughness:.48,metalness:.02,clearcoat:.24,clearcoatRoughness:.34});
function atlasUV(g,index){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(index%4+.012+uv.getX(i)*.976)/4,(3-Math.floor(index/4)+.012+uv.getY(i)*.976)/4);return g;}
goods.forEach((p,index)=>{
 let g;const kind=p[4];
 if(kind==='cup'){
  g=new THREE.LatheGeometry([new THREE.Vector2(.37,0),new THREE.Vector2(.39,.04),new THREE.Vector2(.48,.88),new THREE.Vector2(.52,.91),new THREE.Vector2(.52,.96),new THREE.Vector2(0,.96)],24);
  for(let k=0;k<g.attributes.uv.count;k++)g.attributes.uv.setY(k,g.attributes.position.getY(k)/.96);
  g.rotateY(Math.PI);
  geom['goods-lid-'+index]=atlasUV(new THREE.CylinderGeometry(.525,.525,.022,24),index);
  // Front of a cup uses a full label; the print follows the curved wall.
 }else{
  g=new THREE.BoxGeometry(1,1,1,kind==='box'?1:12,kind==='box'?1:16,kind==='box'?1:4);
  const a=g.attributes.position;
  for(let k=0;k<a.count;k++){
   let x=a.getX(k),y=a.getY(k),z=a.getZ(k);
   if(['bag','pillow','bread'].includes(kind)){
    const f=Math.max(0,1-Math.pow(Math.abs(y)*2,3));
    z*=.10+.90*f;x*=.88+.12*Math.sin((y+.5)*Math.PI);
    const crease=(Math.sin(x*53+y*24+index)*.018+Math.sin(x*91-y*31)*.009)*(1-f*.65);
    z+=Math.sign(z||1)*crease;x+=Math.sin(y*48+index)*.008;
   }else if(kind==='bottle'){
    const top=Math.max(0,(y-.20)/.30);x*=1-top*.62;z*=1-top*.32;
    const corner=1-Math.pow(Math.abs(x)*2,8)*.12;z*=corner;
   }else if(kind==='tissue'){
    const f=Math.cos(x*Math.PI)*Math.cos(y*Math.PI);z*=.8+f*.2;x*=.95+.05*Math.cos(y*Math.PI);
   }
   a.setXYZ(k,x,y+.5,z);
  }
 }
 g.computeVertexNormals();geom['goods-'+index]=atlasUV(g,index);
});
function stock(x,y,z,index,scale=1,angle=0,parent=storeGroup){
 const p=goods[index];inventory.items++;inventory.categories.add(p[8]);
 instance('goods-'+index,[p[5]*scale,p[6]*scale,p[7]*scale],[x,y,z],merchandiseMaterial,parent,angle);
 if(p[4]==='cup')instance('goods-lid-'+index,[p[5]*scale,p[6]*scale,p[7]*scale],[x,y+p[6]*.966*scale,z],merchandiseMaterial,parent,angle);
 if(p[4]==='bottle'){round(p[5]*.40*scale,.032*scale,p[7]*.82*scale,x,y+p[6]*scale+.012,z,index===13?caps[1]:caps[0],parent,angle);}
}
const shelfPrice=canvasTex(2048,576,(c,w,h)=>{
 c.fillStyle='#e4e1cc';c.fillRect(0,0,w,h);
 const prices=['6.50','7.50','8.90','9.90','5.00','5.00','4.00','7.90','3.50','12.80','8.50','9.90','12.00','19.90','16.90','6.90'];
 for(let i=0;i<16;i++){c.save();c.translate(i%4*512,Math.floor(i/4)*144);c.fillStyle='#405246';c.fillRect(0,0,512,20);c.fillStyle='#fff6dd';c.font='13px "Microsoft YaHei"';c.fillText('雨巷便利店   /   日常精选',14,15);c.fillStyle='#34372f';c.font='24px "Microsoft YaHei"';c.fillText(goods[i][0],15,54);c.font='700 56px Arial';c.textAlign='right';c.fillText(prices[i],490,110);c.font='21px Arial';c.fillText('¥',315,105);c.textAlign='left';for(let j=0;j<70;j++)c.fillRect(15+j*2,78,rnd()<.5?1:2,29);c.font='12px monospace';c.fillText('692311 3021 '+String(i).padStart(3,'0'),15,126);c.font='12px "Microsoft YaHei"';c.fillText('零售价 / 元',400,131);c.restore();}
});
const shelfPriceMat=mat('#ffffff',.70,0,{map:shelfPrice});
for(let i=0;i<16;i++)geom['price-'+i]=atlasPrice(i);
function atlasPrice(index){const g=new THREE.BoxGeometry(1,1,1);const uv=g.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,(index%4+uv.getX(k))/4,(3-Math.floor(index/4)+uv.getY(k))/4);return g;}
const shelfSections=[['膨化 · 饼干','SNACKS',0],['方便面 · 速食','QUICK MEALS',1],['面包 · 早餐','BAKERY',2],['纸品 · 日用','HOME ESSENTIALS',3]];
const sectionMaterials=shelfSections.map(([s,en])=>mat('#ffffff',.7,0,{map:label(s,en,'#315448','#e1e5ce',512,112)}));
function shelf(x,z,w=2.25,d=.75,rows=4,section=0){
 box(w,1.75,.055,x,1.33,z,enamel,storeGroup);
 for(const dx of[-w/2+.035,w/2-.035]){box(.045,1.84,.06,x+dx,1.34,z,paintedMetal,storeGroup);for(let y=.5;y<2.15;y+=.08)box(.011,.026,.003,x+dx,y,z+.034,charcoal,storeGroup);}
 const sets=[[0,1,2,3],[4,5,6,10],[7,8,9,2],[11,12,13,14,15]];
 for(let n=0;n<rows;n++){
  const y=.50+n*.365;box(w+.06,.028,d,x,y,z,enamel,storeGroup);box(w,.017,d-.07,x,y-.024,z,paintedMetal,storeGroup);
  for(const side of[-1,1]){
   box(w,.044,.022,x,y+.017,z+side*d/2,paintedMetal,storeGroup);
   const step=section===3?.245:section===1?.185:.205,count=Math.floor((w-.09)/step);
   for(let i=0;i<count;i++){
    const index=sets[section][(n+Math.floor(i/3))%sets[section].length],p=goods[index],xx=x-w/2+.13+i*step;
    const zz=z+side*(d/2-.09);const a=side===1?rnd(-.045,.045):Math.PI+rnd(-.045,.045);
    if(rnd()>.035)stock(xx,y+.017,zz,index,.95,a);
    if(d>.6&&rnd()>.16)stock(xx+rnd(-.015,.015),y+.018,zz-side*.16,index,.95,a);
    if(index===6||index===8||index===15){if(rnd()>.2)stock(xx,y+.02+p[6]*.95,zz,index,.95,a);}
    if(i%3===0)instance('price-'+index,[.16,.046,.003],[xx,y+.016,z+side*(d/2+.014)],shelfPriceMat,storeGroup,side===1?0:Math.PI);
   }
  }
 }
 for(const side of[-1,1])box(w,.13,.018,x,2.155,z+side*.037,sectionMaterials[section],storeGroup,side===1?0:Math.PI);
 for(const dx of[-w*.4,w*.4])box(.05,.10,d*.82,x+dx,.455,z,darkMetal,storeGroup);
}
shelf(-11.55,-5.2,2.45,.86,4,0);
shelf(-11.55,-7.55,2.45,.86,4,1);
shelf(-7.98,-5.2,2.45,.86,4,2);
shelf(-7.98,-7.55,2.45,.86,4,3);
shelf(-9.14,-2.13,.92,.65,4,0);
shelf(-4.35,-8.95,2.28,.61,5,3);

// Basket stacks and a bread end display occupy real retail space.
const basketMat=mat('#7b5140',.61,.02);
for(let level=0;level<5;level++){
 const x=-5.35,y=.45+level*.045,z=-2.53;box(.39,.015,.28,x,y,z,basketMat,storeGroup);
 for(const dz of[-.14,.14]){box(.42,.016,.018,x,y+.15,z+dz,basketMat,storeGroup);for(let k=0;k<9;k++)box(.015,.14,.017,x-.19+k*.047,y+.075,z+dz,basketMat,storeGroup);}
 for(const dx of[-.21,.21]){box(.018,.018,.30,x+dx,y+.15,z,basketMat,storeGroup);for(let k=0;k<6;k++)box(.016,.14,.017,x+dx,y+.075,z-.125+k*.05,basketMat,storeGroup);}
}
round(1.05,.64,.53,-4.05,.75,-5.03,enamel);
for(let k=0;k<3;k++){
 const y=1.09+k*.25;box(1.07,.025,.49,-4.05,y,-5.03,aluminium,storeGroup);
 for(let i=0;i<5;i++)stock(-4.45+i*.19,y+.025,-4.94,k===2?2:8,.94,rnd(-.04,.04));
}
for(const x of[-4.61,-3.49])box(.018,.80,.52,x,1.48,-5.03,waterGlass,storeGroup);
box(1.13,.02,.52,-4.05,1.89,-5.03,waterGlass,storeGroup);
box(1.08,.13,.022,-4.05,1.89,-4.757,sectionMaterials[2],storeGroup);

// Back-wall service door, ventilation and electrical boxes.
solid(.95,2.24,.08,-12.25,1.56,-9.50,paintedMetal);
for(const x of[-12.77,-11.73])box(.05,2.33,.1,x,1.56,-9.44,aluminium,storeGroup);
box(1.09,.05,.1,-12.25,2.71,-9.44,aluminium,storeGroup);
rod([-11.92,1.45,-9.40],[-11.78,1.45,-9.40],.017,aluminium);
// Cash desk, till, scanner, small notices and paper bags.
round(1.8,.91,.77,-4.10,.93,-2.18,paintedMetal);
solid(1.94,.055,.89,-4.10,1.415,-2.18,mat('#c4c2b0',.31,.03));
box(1.66,.61,.025,-4.10,.97,-1.778,enamel,storeGroup);
box(.42,.045,.3,-4.52,1.47,-2.17,charcoal,storeGroup);rod([-4.52,1.47,-2.17],[-4.52,1.67,-2.17],.025,darkMetal);
round(.44,.30,.045,-4.52,1.76,-2.19,charcoal,storeGroup,[.10,0,0]);
box(.39,.246,.006,-4.52,1.76,-2.161,mat('#748d80',.4,.1,{emissive:'#8db9a2',emissiveIntensity:.3}),storeGroup,[.1,0,0]);
round(.18,.11,.21,-4.06,1.49,-2.1,charcoal);box(.15,.01,.14,-3.75,1.46,-1.97,darkMetal,storeGroup);

const noticeMat=mat('#ffffff',.85,0,{map:label('欢迎光临','24小时 · 请随手关门','#c3ccbd','#365447')});
// A working counter: customer display, receipt printer, payment stand and small impulse goods.
const interiorWall=mat('#b7bdb0',.88,.01),skirting=mat('#747f74',.62,.04);
box(10.27,2.68,.015,-8,1.78,-9.535,interiorWall,storeGroup);
box(.015,2.68,8.17,-13.138,1.78,-5.38,interiorWall,storeGroup);
box(.015,2.68,6.16,-2.862,1.78,-6.44,interiorWall,storeGroup);
box(10.27,.15,.025,-8,.50,-9.520,skirting,storeGroup);
box(.025,.15,8.17,-13.128,.50,-5.38,skirting,storeGroup);
box(.025,.15,6.16,-2.872,.50,-6.44,skirting,storeGroup);
const shopPoster=mat('#ffffff',.83,0,{map:canvasTex(512,640,(c,w,h)=>{c.fillStyle='#d6d2b9';c.fillRect(0,0,w,h);c.fillStyle='#3d5f4e';c.fillRect(0,0,w,160);c.fillStyle='#f2ead3';c.font='bold 66px "Microsoft YaHei"';c.fillText('每日早餐',48,105);c.fillStyle='#a25a3a';c.font='bold 128px Arial';c.fillText('8.90',90,326);c.fillStyle='#3d5142';c.font='34px "Microsoft YaHei"';c.fillText('面包 + 原味牛乳',90,400);c.font='23px "Microsoft YaHei"';c.fillText('早起的日子，也要好好吃饭',77,485);c.fillRect(48,535,416,2);c.font='20px Arial';c.fillText('YU XIANG  /  24 HOURS',96,588);})});
box(.61,.76,.008,-7.15,2.50,-9.520,shopPoster,storeGroup);
const tillScreen=canvasTex(512,320,(c,w,h)=>{c.fillStyle='#253b36';c.fillRect(0,0,w,h);c.fillStyle='#b3cec0';c.font='23px "Microsoft YaHei"';c.fillText('雨巷便利店   /   收银',24,42);c.fillStyle='#78a896';c.fillRect(22,60,468,2);c.font='20px "Microsoft YaHei"';for(let i=0;i<4;i++)c.fillText(['商品                     数量     金额','原叶茶                    1      3.50','黄油曲奇                  1      8.90','--------------------------------'][i],24,101+i*42);c.font='bold 33px Arial';c.fillStyle='#d6e3c9';c.fillText('TOTAL   ¥ 12.40',146,293);});
box(.388,.244,.002,-4.52,1.76,-2.156,mat('#ffffff',.56,0,{map:tillScreen,emissiveMap:tillScreen,emissive:'#91b9a4',emissiveIntensity:.28}),storeGroup,[.1,0,0]);
round(.18,.13,.19,-4.14,1.51,-2.04,charcoal);box(.124,.012,.029,-4.14,1.579,-1.987,black,storeGroup);
const receiptMat=mat('#ffffff',.97,0,{map:canvasTex(128,256,(c,w,h)=>{c.fillStyle='#d8d6c6';c.fillRect(0,0,w,h);c.fillStyle='#5b6054';c.font='9px monospace';for(let k=0;k<14;k++)c.fillText(['YU XIANG 24H','2026/11/13 23:17','ITEM     PRICE','    1     3.50','TOTAL     3.50'][k%5],5,15+k*16);})});
box(.065,.10,.002,-4.14,1.617,-1.973,receiptMat,storeGroup,[.37,0,0]);
const payMat=mat('#ffffff',.62,.02,{map:canvasTex(256,320,(c,w,h)=>{c.fillStyle='#eee9d7';c.fillRect(0,0,w,h);c.fillStyle='#3e6353';c.fillRect(0,0,w,66);c.fillStyle='#f0ecdb';c.textAlign='center';c.font='23px "Microsoft YaHei"';c.fillText('扫码支付',128,43);c.fillStyle='#263c30';for(let y=0;y<25;y++)for(let x=0;x<25;x++)if(rnd()<.5)c.fillRect(39+x*7,92+y*7,7,7);for(const [x,y]of[[39,92],[165,92],[39,218]]){c.fillRect(x,y,49,49);c.fillStyle='#e6e1d1';c.fillRect(x+7,y+7,35,35);c.fillStyle='#263c30';c.fillRect(x+14,y+14,21,21);}c.font='14px "Microsoft YaHei"';c.fillText('欢迎光临 · 谢谢惠顾',128,303);})});
box(.16,.205,.009,-3.57,1.56,-1.902,payMat,storeGroup,[-.12,0,0]);box(.17,.008,.10,-3.57,1.461,-1.95,aluminium,storeGroup);
const candyMat=mat('#e3d4a9',.4,.05);
for(let row=0;row<3;row++){box(.39,.035,.105,-3.83,1.47+row*.046,-2.35+row*.035,darkMetal,storeGroup);for(let k=0;k<5;k++)box(.056,.018,.085,-3.97+k*.07,1.498+row*.046,-2.35+row*.035,k%2?caps[1]:candyMat,storeGroup);}
// Microwave and coffee machine sit on a service bench behind the till.
round(1.70,.78,.51,-4.10,.83,-3.46,enamel);box(1.78,.045,.56,-4.10,1.245,-3.46,aluminium,storeGroup);
round(.51,.30,.38,-4.58,1.42,-3.45,enamel);box(.36,.22,.013,-4.64,1.43,-3.25,charcoal,storeGroup);box(.31,.17,.006,-4.64,1.43,-3.241,glass,storeGroup);rod([-4.42,1.37,-3.224],[-4.42,1.51,-3.224],.009,aluminium);cyl(.024,.014,-4.36,1.38,-3.241,darkMetal,storeGroup,[Math.PI/2,0,0]);
round(.32,.53,.33,-3.66,1.53,-3.46,darkMetal);round(.29,.20,.32,-3.66,1.71,-3.46,aluminium);box(.24,.22,.014,-3.66,1.49,-3.285,black,storeGroup);rod([-3.66,1.59,-3.26],[-3.66,1.53,-3.25],.013,aluminium);box(.28,.025,.15,-3.66,1.29,-3.24,darkMetal,storeGroup);cyl(.040,.083,-3.66,1.35,-3.24,paper,storeGroup);cyl(.045,.011,-3.66,1.397,-3.24,white,storeGroup);
for(let k=0;k<6;k++)cyl(.042,.03,-3.26,1.275+k*.022,-3.42,paper,storeGroup);
// Paper bags, wall clock and pinned delivery notes add everyday scale.
for(let i=0;i<3;i++){box(.17,.26,.10,-3.45+i*.06,.65,-2.13,mat('#af9a6e',.91),storeGroup);}
const clockMat=mat('#ffffff',.64,0,{map:canvasTex(256,256,(c,w,h)=>{c.fillStyle='#d5d4c4';c.fillRect(0,0,w,h);c.strokeStyle='#3b4640';c.lineWidth=2;for(let i=0;i<60;i++){const a=i/60*Math.PI*2;c.beginPath();c.moveTo(128+Math.sin(a)*(i%5?102:94),128-Math.cos(a)*(i%5?102:94));c.lineTo(128+Math.sin(a)*109,128-Math.cos(a)*109);c.stroke();}c.lineWidth=7;c.beginPath();c.moveTo(128,128);c.lineTo(102,78);c.stroke();c.lineWidth=4;c.beginPath();c.moveTo(128,128);c.lineTo(212,146);c.stroke();})});
cyl(.185,.028,-4.10,2.73,-9.515,darkMetal,storeGroup,[Math.PI/2,0,0]);cyl(.169,.030,-4.10,2.73,-9.495,clockMat,storeGroup,[Math.PI/2,0,0]);

// Aluminium storefront, with an inset door swung open eleven degrees.
for(const x of[left+.34,-9.72,-7.42,-5.30,right-.34]){box(.054,2.46,.10,x,1.69,-1.04,aluminium,storeGroup);box(.016,2.42,.015,x-.039,1.69,-.978,seal,storeGroup);}
for(const y of[.46,2.92])box(10.15,.062,.12,-8,y,-1.04,aluminium,storeGroup);
for(const[x,w]of[[-11.58,3.64],[-8.57,2.19],[-3.96,2.57]]){box(w,2.39,.012,x,1.69,-1.056,waterGlass,storeGroup);box(w,.13,.02,x,.53,-1.025,aluminium,storeGroup);}
const door=new THREE.Group();door.position.set(-7.4,0,-1.09);door.rotation.y=-.16;storeGroup.add(door);
for(const x of[0,1.03])box(.043,2.39,.065,x,1.69,0,aluminium,door);for(const y of[.5,2.88])box(1.07,.046,.065,.515,y,0,aluminium,door);
box(.99,2.3,.009,.515,1.69,0,waterGlass,door);rod([.9,1.29,.065],[.9,1.72,.065],.016,aluminium,door);
for(const y of[.71,2.65])cyl(.018,.10,0,y,0,darkMetal,door);
box(.32,.23,.008,.51,1.98,.013,noticeMat,door);
box(.29,.055,.11,.18,2.83,.04,darkMetal,door);rod([.18,2.86,.075],[.5,2.86,.14],.01,aluminium,door);
// Side glazing reveals the counter when orbiting around the corner.
for(const z of[-1.2,-2.25,-3.31])box(.075,2.04,.052,right-.02,1.89,z,aluminium,storeGroup);
box(.012,1.98,2.09,right-.04,1.9,-2.25,waterGlass,storeGroup);for(const y of[.87,2.94])box(.08,.055,2.15,right-.02,y,-2.25,aluminium,storeGroup);

// A faded enamel sign, fasteners, a pitched sheet-metal awning and actual gutter.
const shopSign=canvasTex(1536,208,(c,w,h)=>{c.fillStyle='#adc0b2';c.fillRect(0,0,w,h);c.fillStyle='#315b50';c.fillRect(0,0,w,13);c.fillRect(0,h-13,w,13);c.font='600 99px "Microsoft YaHei"';c.fillText('雨 巷 便 利 店',70,132);c.font='23px "Microsoft YaHei"';c.fillText('烟 酒 · 饮 料 · 日 用 百 货',76,182);c.fillRect(1248,25,230,158);c.fillStyle='#cdd6c4';c.textAlign='center';c.font='76px Arial';c.fillText('24',1363,115);c.font='21px Arial';c.fillText('HOURS',1363,155);for(let i=0;i<6500;i++){c.fillStyle=`rgba(30,45,31,${rnd(.02,.10)})`;c.fillRect(rnd(0,w),rnd(0,h),rnd(1,4),rnd(1,4));}});
round(10.22,.85,.21,-8,3.45,-.81,paintedMetal);
box(10.07,.72,.015,-8,3.45,-.693,mat('#ffffff',.52,.12,{map:shopSign,emissiveMap:shopSign,emissive:'#b4c8bb',emissiveIntensity:.32}),storeGroup);
for(let x=-12.7;x<-3;x+=1.6)for(const y of[3.13,3.76])cyl(.012,.014,x,y,-.673,aluminium,storeGroup,[Math.PI/2,0,0]);
const awning=mat('#526a65',.58,.48);
box(10.8,.045,1.44,-8,2.96,-.38,awning,storeGroup,[.14,0,0]);
for(let x=-13.35;x<-2.6;x+=.22){box(.027,.038,1.43,x,2.985,-.38,paintedMetal,storeGroup,[.14,0,0]);for(const z of[-.90,.23])cyl(.009,.012,x,3.006-(z+.38)*.14,z,aluminium,storeGroup);}
for(const x of[-12.9,-10.4,-7.9,-5.4,-3.1]){rod([x,2.67,-.96],[x,2.86,.22],.018,paintedMetal);rod([x,2.60,-.97],[x,2.86,.10],.013,paintedMetal);}
box(10.85,.15,.035,-8,2.82,.34,paintedMetal,storeGroup);
box(10.85,.035,.16,-8,2.76,.29,paintedMetal,storeGroup);
box(10.85,.095,.025,-8,2.79,.21,paintedMetal,storeGroup);
for(const x of[-13.27,-2.73]){wire([[x,2.77,.29],[x,2.64,.29],[x,2.56,.14],[x,2.40,-.72],[x,.40,-.72],[x,.28,-.54]],.039,paintedMetal);for(const y of[.75,2.1])box(.14,.028,.055,x,y,-.71,aluminium,storeGroup);}
// Fluorescent fixtures include the housing, tube, end caps and wall light spill.
function fluorescent(x,z,w=1.2,y=2.87,parent=storeGroup){round(w+.15,.062,.19,x,y+.025,z,enamel,parent);rod([x-w/2,y-.018,z],[x+w/2,y-.018,z],.021,lightMat,parent);for(const xx of[x-w/2,x+w/2])box(.044,.064,.09,xx,y-.004,z,aluminium,parent);}
for(const x of[-11.8,-8.1,-4.2])fluorescent(x,-.55,1.35,2.86);
for(const x of[-11.45,-6.2])for(const z of[-4.5,-7.9])fluorescent(x,z,1.6,3.10,roofGroup);
RectAreaLightUniformsLib.init();
function area(x,y,z,w,h,power,color,target){const l=new THREE.RectAreaLight(color,power,w,h);l.position.set(x,y,z);l.lookAt(...target);scene.add(l);return l;}
area(-8,2.77,-.55,9,.25,3.4,'#d4e5f5',[-8,.2,1.8]);
area(-10.5,3.04,-5.6,4.4,4.8,1.3,'#e0e9ea',[-10.5,.4,-5.6]);
area(-4.4,3.03,-5.6,2.3,4.8,1.1,'#e4ebed',[-4.4,.4,-5.6]);
area(-11.4,2.60,-1.66,3.0,.14,7,'#d9eaf9',[-11.4,.6,-2.05]);
// Focused lamps cast physical shadows on the entry and road.
function spot(x,y,z,power,color,target,angle=.9){const l=new THREE.SpotLight(color,power,16,angle,.75,2);l.position.set(x,y,z);l.target.position.set(...target);l.castShadow=true;l.shadow.mapSize.set(1024,1024);l.shadow.bias=-.0001;l.shadow.normalBias=.018;l.shadow.camera.near=.1;l.shadow.camera.far=18;scene.add(l,l.target);return l;}
spot(-8,2.78,-.5,27,'#d7e7f6',[-8,.2,1.5],1.15);
spot(-4.8,3.05,-5.8,34,'#e4e3d9',[-4.8,.4,-4.4],1.2).castShadow=false;

// Functional rooftop: parapets, flashing, tar seams, condenser and drain route.
solid(sw+.08,.17,sd+.08,sx,6.57,sz,roofTar,roofGroup);
for(const z of[front,back]){solid(sw+.08,.34,.18,sx,6.78,z,plaster,roofGroup);solid(sw+.18,.045,.26,sx,6.965,z,foundation,roofGroup);}
for(const x of[left,right]){solid(.18,.34,sd,x,6.78,sz,plaster,roofGroup);solid(.26,.045,sd+.1,x,6.965,sz,foundation,roofGroup);}
for(let x=left+.8;x<right-.3;x+=1.05)box(.028,.012,8.45,x,6.662,sz,seal,roofGroup);
for(let z=back+.3;z<front-.3;z+=2.8)box(10.42,.012,.025,sx,6.663,z,seal,roofGroup);
for(const x of[left+.15,right-.15])box(.11,.025,8.45,x,6.677,sz,darkMetal,roofGroup);
function condenser(x,y,z,parent=roofGroup,angle=0){
 const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=angle;parent.add(g);
 round(.98,.66,.42,0,0,0,enamel,g);
 for(const x of[-.30,.30]){box(.055,.14,.43,x,-.38,0,darkMetal,g);box(.16,.045,.48,x,-.455,0,rubber,g);}
 cyl(.225,.016,-.16,0,.222,charcoal,g,[Math.PI/2,0,0]);
 for(let a=0;a<6.28;a+=Math.PI/3)box(.052,.33,.011,-.16+Math.sin(a)*.07,Math.cos(a)*.07,.236,paintedMetal,g,[0,0,-a]);
 for(const r of[.075,.126,.176,.22])torus(r,.0045,-.16,0,.25,aluminium,g);
 for(let a=0;a<6.28;a+=Math.PI/4)rod([-.16,0,.252],[-.16+Math.sin(a)*.224,Math.cos(a)*.224,.252],.004,aluminium,g);
 for(let yy=-.25;yy<.28;yy+=.037)box(.19,.009,.017,.325,yy,.225,paintedMetal,g);
 for(const xx of[-.44,.44])for(const yy of[-.275,.275])cyl(.009,.012,xx,yy,.231,aluminium,g,[Math.PI/2,0,0]);
 box(.13,.065,.006,.3,.26,.23,noticeMat,g);
}
condenser(-11.6,7.15,-7.8);condenser(-10.4,7.15,-7.8);
condenser(right+.24,4.12,-5.53,roofGroup,Math.PI/2);
for(const z of[-5.88,-5.18]){rod([right,3.67,z],[right+.51,3.67,z],.018,darkMetal,roofGroup);rod([right,3.48,z],[right+.47,3.68,z],.013,darkMetal,roofGroup);}
wire([[-11.2,7.0,-8.05],[-11.2,6.80,-8.4],[-11.2,6.70,-8.4],[-3,6.70,-8.4],[-2.82,6.76,-7],[-2.45,6.68,-7],[-2.45,4.4,-6.8],[-2.45,4.15,-5.7]],.035,mat('#999b84',.84),roofGroup);
round(1.15,.14,1.55,-5.4,6.72,-7.9,darkMetal,roofGroup);box(1.03,.035,1.42,-5.4,6.81,-7.9,paintedMetal,roofGroup);
for(const x of[-5.82,-4.98])box(.075,.025,.23,x,6.84,-8.1,aluminium,roofGroup);
cyl(.115,.61,-4.05,6.95,-3.0,paintedMetal,roofGroup);cyl(.18,.065,-4.05,7.28,-3.0,darkMetal,roofGroup);cyl(.23,.045,-4.05,6.69,-3,seal,roofGroup);
for(const p of[[-12.7,-8.9],[-3.2,-2.0]]){cyl(.10,.025,p[0],6.68,p[1],charcoal,roofGroup);for(let k=-2;k<=2;k++)box(.14,.012,.012,p[0],6.699,p[1]+k*.035,aluminium,roofGroup);}
const roofWater=mat('#293530',.12,.15,{transparent:true,opacity:.40,depthWrite:false});
for(let i=0;i<7;i++){const shape=new THREE.Shape();for(let k=0;k<=40;k++){const a=k/40*Math.PI*2,r=.72+.15*Math.sin(a*5+i)+.12*Math.sin(a*9-i),x=Math.cos(a)*r,y=Math.sin(a)*r;if(k===0)shape.moveTo(x,y);else shape.lineTo(x,y);}const o=new THREE.Mesh(new THREE.ShapeGeometry(shape),roofWater);o.rotation.x=-Math.PI/2;o.scale.set(rnd(.3,.9),rnd(.16,.45),1);o.position.set(rnd(-12.5,-3.4),6.674,rnd(-9,-1.6));roofGroup.add(o);}
// Rear rain pipe and service conduits are visible from every side.
wire([[-3.0,6.8,-9.83],[-3.0,6.3,-10],[-3.0,.40,-10],[-2.8,.25,-10]],.047,paintedMetal,roofGroup);
for(const y of[1.2,3,5])box(.16,.04,.08,-3,y,-9.99,aluminium,roofGroup);
round(.48,.68,.15,right+.12,1.85,-6.9,paintedMetal);wire([[right+.2,2.18,-6.9],[right+.21,3.18,-6.9],[right+.21,3.18,-3.5]],.018,darkMetal);
wire([[-12.9,3.99,-.79],[-10.5,3.89,-.82],[-7,3.94,-.8],[-3,3.99,-.81]],.011,charcoal,roofGroup);

// A few carefully built objects around the entrance, with no people.
function crate(x,y,z){
 const m=mat('#566f59',.75);box(.48,.025,.35,x,y+.012,z,m);for(const dx of[-.23,.23])for(const dz of[-.16,.16])box(.025,.27,.025,x+dx,y+.14,z+dz,m);
 for(const yy of[.07,.16,.26]){for(const dz of[-.16,.16])box(.48,.025,.023,x,y+yy,z+dz,m);for(const dx of[-.23,.23])box(.025,.025,.35,x+dx,y+yy,z,m);}
 for(let i=-2;i<=2;i++)for(const dz of[-.16,.16])box(.023,.24,.018,x+i*.085,y+.14,z+dz,m);
}
crate(-12.96,.18,-.16);crate(-12.91,.46,-.16);crate(-12.32,.18,-.24);
for(const x of[-13.05,-12.88])bottle(x,.47,-.16,1,1.06,scene);
placeScannedProp('folding_wooden_stool',[-9.1,.18,-.14],.47,-.24);
placeScannedProp('metal_trash_can',[-3.12,.18,-.16],.60,.18);
// Modest wall posters and a bolted street address.
box(.30,.20,.025,right+.035,2.65,-1.55,mat('#ffffff',.7,0,{map:label('17','雨巷','#244d56','#d6ddd1',256,160)}),storeGroup,Math.PI/2);
for(const [x,y,t]of[[-9.28,1.95,'便民服务'],[-3.28,2.22,'请勿吸烟']])box(.27,.36,.008,x,y,-1.028,mat('#ffffff',.9,0,{map:label(t,'24 HOURS','#c8c9ae','#435549',256,320)}),storeGroup);
// A complete two-lane street, with a second pavement and realistic roadside fittings.
const streetGroup=new THREE.Group();streetGroup.name='street-and-lighting';scene.add(streetGroup);
const galvanized=textured('concrete_wall_007','#a7adaa',[.7,2.4],.45);galvanized.metalness=.72;galvanized.normalScale.set(.04,.04);
const lampPaint=mat('#63706d',.38,.62),lampLens=mat('#e4ede9',.24,.05,{emissive:'#e3e9e3',emissiveIntensity:5.2});
const pavementDark=textured('concrete_wall_007','#707c7b',[6,1],.86);
const roadPatch=textured('asphalt_02','#666e71',[3.5,1.6],.83);
const oldPaint=paint.clone();oldPaint.color.set('#ddd7b5');oldPaint.roughness=.71;
const yellowPaint=paint.clone();yellowPaint.color.set('#c2a668');
const tactile=mat('#a69b65',.72,.01);
const lampLocations=[[-22.2,.72,6.8],[-.50,.72,6.3],[21.5,.72,6.8],[-42.8,.72,6.8],[-19,11.15,6.5],[9.5,11.15,6.5]];
const streetLamps=[];
function streetLamp(x,z,h,backSide=false,index=0){
 const g=new THREE.Group();g.name='streetlight-'+index;g.position.set(x,.18,z);g.rotation.y=backSide?Math.PI:0;streetGroup.add(g);
 round(.39,.065,.39,0,.035,0,darkMetal,g);round(.31,.035,.31,0,.085,0,galvanized,g);
 for(const xx of[-.117,.117])for(const zz of[-.117,.117]){
  cyl(.026,.009,xx,.113,zz,aluminium,g);cyl(.016,.04,xx,.132,zz,darkMetal,g);
  instance('nut',[.024,.017,.024],[xx,.126,zz],galvanized,g);
 }
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.050,.099,h,16),galvanized);pole.position.y=h/2+.105;pole.castShadow=pole.receiveShadow=true;g.add(pole);
 cyl(.105,.31,0,.24,0,lampPaint,g);cyl(.083,.024,0,1.14,0,aluminium,g);
 round(.092,.39,.018,0,.72,.089,lampPaint,g);for(const y of[.56,.88])cyl(.006,.007,0,y,.102,aluminium,g,[Math.PI/2,0,0]);
 const id=mat('#ffffff',.65,0,{map:label('YX '+String(17+index).padStart(3,'0'),'路灯设施','#d9dfd4','#34443d',256,180)});box(.081,.104,.004,0,1.55,.081,id,g);
 wire([[0,h-.28,0],[0,h+.03,.08],[0,h+.20,.34],[0,h+.25,.75],[0,h+.24,1.24]],.044,galvanized,g);
 cyl(.067,.23,0,h-.15,0,lampPaint,g);round(.38,.11,.82,0,h+.20,1.35,lampPaint,g);
 round(.31,.018,.66,0,h+.135,1.38,lampLens,g);
 for(const xx of[-.107,-.036,.036,.107])for(let k=0;k<7;k++)box(.038,.006,.052,xx,h+.121,1.13+k*.075,lampLens,g);
 for(let k=0;k<9;k++)box(.30,.026,.012,0,h+.27,1.06+k*.065,galvanized,g);
 for(const xx of[-.14,.14])for(const zz of[1.06,1.64])cyl(.007,.007,xx,h+.14,zz,darkMetal,g);
 const dz=backSide?-1:1;
 if(index===2||index===3)return;
 const l=spot(x,h+.28,z+dz*1.40,index<2?240:160,index===0?'#d8dedb':'#cfdfeb',[x,0,z+dz*4.2],1.04);
 l.distance=24;l.decay=2;l.penumbra=.68;l.castShadow=index<2;l.shadow.camera.far=27;l.shadow.mapSize.set(1024,1024);streetLamps.push(l);
}
geom.nut=new THREE.CylinderGeometry(1,1,1,6);
lampLocations.forEach(([x,z,h],i)=>streetLamp(x,z,h,z>8,i));

// The opposite kerb establishes the width of the carriageway, beyond the reflections.
box(116,.19,3.10,-8,.055,11.72,pavementDark,streetGroup);
for(let x=-64;x<49;x+=.80){round(.785,.22,.22,x+.4,.085,10.16,foundation,streetGroup);for(let z=10.38;z<13.1;z+=.66)box(.786,.026,.647,x+.4,.163,z,paving[Math.floor(rnd(0,5))],streetGroup);}
for(let x=-62;x<48;x+=6.8)box(2.9,.005,.095,x,-.013,5.88,oldPaint,streetGroup);
for(const z of[1.91,9.79])box(112,.004,.085,-8,-.012,z,yellowPaint,streetGroup);
// Paint has aggregate showing through; small studs sit below the tyre contact profile.
const studAmber=mat('#a47f34',.31,.22,{emissive:'#ad812d',emissiveIntensity:.10});
for(let x=-42;x<32;x+=6.8){round(.10,.017,.075,x,.001,5.90,aluminium,streetGroup);box(.045,.014,.06,x,.01,5.91,studAmber,streetGroup);}
// A pedestrian crossing, with a stop bar and tactile approach.
for(let z=2.25;z<9.65;z+=1.02)box(2.70,.006,.46,5.8,-.010,z,oldPaint,streetGroup);
box(.25,.006,3.25,3.62,-.009,7.85,oldPaint,streetGroup);
for(const z of[.92,10.64])for(let xx=4.51;xx<7.2;xx+=.30){box(.292,.025,.57,xx,.182,z,tactile,streetGroup);for(let i=0;i<3;i++)for(let j=0;j<5;j++)cyl(.013,.008,xx-.095+i*.095,.201,z-.20+j*.1,tactile,streetGroup);}
for(let x=-25;x<23;x+=.6){if(x>4.1&&x<7.7)continue;box(.58,.014,.29,x,.181,.55,tactile,streetGroup);for(let k=-1;k<=1;k++)box(.53,.009,.016,x,.192,.55+k*.072,tactile,streetGroup);}
// Repairs, narrow tar seams and grit interrupt an otherwise perfect road surface.
for(const [x,z,w,d]of[[-14,4.8,2.8,1.7],[-.3,7.2,3.5,1.6],[13,3.7,2,1.2],[-24,8.4,3.2,1.8]]){
 const sh=new THREE.Shape();for(let k=0;k<=32;k++){const a=k/32*Math.PI*2,r=1+rnd(-.055,.055),xx=Math.cos(a)*w*.5*r,zz=Math.sin(a)*d*.5*r;k?sh.lineTo(xx,zz):sh.moveTo(xx,zz);}
 const o=new THREE.Mesh(new THREE.ShapeGeometry(sh),roadPatch);o.rotation.x=-Math.PI/2;o.position.set(x,-.008,z);o.receiveShadow=true;streetGroup.add(o);
}
const tar=mat('#262e30',.53,.02);
for(const [xx,zz]of[[-5,7.3],[-16,2.3],[2,4.2],[-26,6.1]]){let x=xx,z=zz;const p=[[x,-.018,z]];for(let k=0;k<15;k++){x+=rnd(.15,.37);z+=rnd(-.14,.14);p.push([x,-.018,z]);}wire(p,.006,tar,streetGroup);}
function drain(x,z,frontFacing=true){
 box(.94,.025,.37,x,.173,z,darkMetal,streetGroup);for(let k=0;k<17;k++)box(.020,.025,.31,x-.43+k*.053,.190,z,galvanized,streetGroup);
 for(const dx of[-.46,.46])box(.03,.032,.39,x+dx,.188,z,aluminium,streetGroup);
 for(const dz of[-.18,.18])box(.94,.03,.024,x,.188,z+dz,darkMetal,streetGroup);
}
for(const x of[-21.5,1.6,12.1])drain(x,1.28);
for(const x of[-17,3.0,22.1])drain(x,10.38);
const manholeMark=mat('#ffffff',.54,.65,{map:canvasTex(512,512,(c,w,h)=>{c.fillStyle='#505854';c.fillRect(0,0,w,h);c.strokeStyle='#2c3633';c.lineWidth=8;for(let x=-512;x<512;x+=31){c.beginPath();c.moveTo(x,0);c.lineTo(x+512,512);c.stroke();c.beginPath();c.moveTo(x+512,0);c.lineTo(x,512);c.stroke();}c.fillStyle='#59635d';c.fillRect(145,175,222,162);c.fillStyle='#313b36';c.textAlign='center';c.font='bold 60px "Microsoft YaHei"';c.fillText('雨 水',256,247);c.font='28px Arial';c.fillText('D400',256,300);})});
for(const [x,z]of[[-15.5,7.6],[3.3,4.1]]){cyl(.37,.021,x,-.001,z,darkMetal,streetGroup);cyl(.33,.022,x,.001,z,manholeMark,streetGroup);torus(.345,.008,x,.016,z,aluminium,streetGroup,[Math.PI/2,0,0]);for(const dx of[-.23,.23])box(.06,.004,.035,x+dx,.015,z,black,streetGroup);}

// Low pedestrian guard rails, expansion joints and reflective bollards.
for(const [start,end,z]of[[-30,-15.2,.90],[9,27,.90],[-31,-15.2,10.88],[8,29,10.88]]){
 for(let x=start;x<end;x+=2.1){cyl(.033,1.03,x,.69,z,galvanized,streetGroup);cyl(.075,.05,x,.20,z,darkMetal,streetGroup);const to=Math.min(x+2.1,end);for(const y of[.46,1.12])rod([x,y,z],[to,y,z],.024,galvanized,streetGroup);for(let u=x+.30;u<to;u+=.30)rod([u,.46,z],[u,1.12,z],.013,lampPaint,streetGroup);}
}
for(const [x,z]of[[3.9,.9],[7.6,.9],[3.9,10.8],[7.6,10.8]]){cyl(.062,.79,x,.58,z,darkMetal,streetGroup);cyl(.074,.045,x,.20,z,galvanized,streetGroup);cyl(.066,.09,x,.86,z,white,streetGroup);cyl(.063,.02,x,.975,z,galvanized,streetGroup);}

// Roadside sign with pole clips, folded edges and a legible crossing symbol.
const crossingSign=mat('#ffffff',.40,.32,{map:canvasTex(512,512,(c,w,h)=>{c.fillStyle='#2a526c';c.fillRect(0,0,w,h);c.strokeStyle='#d8e4df';c.lineWidth=14;c.strokeRect(15,15,w-30,h-30);c.fillStyle='#e1e4d8';c.beginPath();c.moveTo(256,62);c.lineTo(450,400);c.lineTo(62,400);c.fill();c.strokeStyle='#294154';c.lineWidth=22;for(let x=130;x<400;x+=48){c.beginPath();c.moveTo(x,350);c.lineTo(x+18,350);c.stroke();}c.fillStyle='#243c4d';c.beginPath();c.arc(270,198,21,0,6.28);c.fill();c.lineWidth=20;c.lineCap='round';c.beginPath();c.moveTo(260,230);c.lineTo(240,280);c.lineTo(280,321);c.moveTo(240,280);c.lineTo(197,324);c.moveTo(252,242);c.lineTo(292,270);c.moveTo(250,248);c.lineTo(212,261);c.stroke();})});
cyl(.035,2.6,8.5,1.48,.72,galvanized,streetGroup);round(.60,.65,.035,8.5,2.36,.72,galvanized,streetGroup);box(.55,.60,.008,8.5,2.36,.744,crossingSign,streetGroup);
for(const y of[2.13,2.55])box(.12,.032,.09,8.5,y,.68,darkMetal,streetGroup);

// Quiet boundary behind the shop: an alley wall and equipment, rather than an empty platform.
const boundary=textured('brick_wall_001','#697470',[12,1],.91);
box(72,1.06,.25,-8,.70,-12.8,boundary,streetGroup);box(72,.07,.31,-8,1.265,-12.8,foundation,streetGroup);
for(let x=-41;x<27;x+=3.6){round(.25,1.22,.30,x,.79,-12.8,foundation,streetGroup);}
box(90,.39,.46,-8,.40,13.20,foundation,streetGroup);
for(let x=-48;x<35;x+=2.4){box(.045,1.25,.045,x,1.18,13.18,paintedMetal,streetGroup);for(let k=0;k<8;k++)box(.015,.96,.015,x+k*.30,.99,13.18,darkMetal,streetGroup);}
for(const y of[.58,1.48])box(87,.032,.03,-6.5,y,13.18,paintedMetal,streetGroup);

// Bare street trees have tapered branching, root flares and fitted tree grilles.
const bark=textured('concrete_wall_007','#484b3d',[1,3],.95);bark.normalScale.set(.6,.6);
function branch(a,b,r1,r2){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const o=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,d.length(),7),bark);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(up,d.normalize());o.castShadow=true;o.receiveShadow=true;streetGroup.add(o);}
function tree(x,z,n){
 box(1.43,.032,1.43,x,.177,z,darkMetal,streetGroup);for(let k=-6;k<=6;k++){box(.023,.023,1.37,x+k*.105,.199,z,galvanized,streetGroup);box(1.37,.023,.023,x,.199,z+k*.105,galvanized,streetGroup);}
 branch([x,.19,z],[x+.06,2.5,z+.09],.155,.092);branch([x+.06,2.5,z+.09],[x-.09,4.9,z+.18],.092,.022);
 for(let k=0;k<8;k++){const a=k*2.38+n,h=2.20+k*.26,ex=x+Math.cos(a)*rnd(1.1,1.8),ez=z+Math.sin(a)*rnd(.9,1.5),ey=h+rnd(1.1,1.9);branch([x,h,z],[ex,ey,ez],.047,.011);for(let j=0;j<3;j++){const f=.45+j*.19,px=x+(ex-x)*f,pz=z+(ez-z)*f,py=h+(ey-h)*f;branch([px,py,pz],[px+Math.cos(a+j*1.7)*.58,py+.60,pz+Math.sin(a+j*1.7)*.58],.014,.003);}}
 for(let k=0;k<5;k++){const a=k*1.25;branch([x,.48,z],[x+Math.cos(a)*.28,.20,z+Math.sin(a)*.28],.05,.025);}
}
tree(-17.6,-.08,0);tree(13.3,-.12,2);tree(-13.1,11.85,1);tree(18,11.85,3);

// A utility cabinet, bicycle parking hoops and a few damp everyday traces.
round(.76,1.19,.42,1.6,.80,-.33,paintedMetal,streetGroup);box(.69,1.07,.025,1.6,.81,-.105,enamel,streetGroup);
for(let k=0;k<7;k++)box(.47,.012,.012,1.60,.42+k*.046,-.087,darkMetal,streetGroup);box(.038,.10,.024,1.85,.95,-.082,darkMetal,streetGroup);
for(const x of[-15.7,-14.8])wire([[x,.19,-.13],[x,.76,-.13],[x,.89,-.04],[x,.89,.45],[x,.75,.54],[x,.19,.54]],.027,galvanized,streetGroup);
const cardboard=mat('#8f7851',.93);for(const [x,y,z,w]of[[-13.96,.35,-2.0,.48],[-13.96,.69,-2.01,.44]]){box(w,.32,.39,x,y,z,cardboard,streetGroup);box(.065,.007,.40,x,y+.163,z,paper,streetGroup);box(.067,.24,.005,x,y+.03,z+.199,paper,streetGroup);}

// Microscopic scratches and handling marks break up clean specular highlights.
const microRough=canvasTex(512,512,(c,w,h)=>{c.fillStyle='#c6c6c6';c.fillRect(0,0,w,h);for(let i=0;i<24000;i++){const n=Math.floor(rnd(130,245));c.fillStyle=`rgb(${n},${n},${n})`;c.fillRect(rnd(0,w),rnd(0,h),rnd(1,3),1);}for(let i=0;i<90;i++){c.strokeStyle=`rgba(70,70,70,${rnd(.02,.12)})`;c.beginPath();let x=rnd(0,w),y=rnd(0,h);c.moveTo(x,y);c.lineTo(x+rnd(3,40),y+rnd(-2,2));c.stroke();}});microRough.colorSpace=THREE.NoColorSpace;microRough.wrapS=microRough.wrapT=THREE.RepeatWrapping;microRough.repeat.set(3,3);
for(const m of[enamel,paintedMetal,aluminium,darkMetal,awning]){m.roughnessMap=microRough;m.bumpMap=microRough;m.bumpScale=.0011;}
const glassRough=canvasTex(256,512,(c,w,h)=>{c.fillStyle='#555555';c.fillRect(0,0,w,h);c.filter='blur(4px)';for(let i=0;i<70;i++){c.fillStyle=`rgba(240,240,240,${rnd(.015,.07)})`;c.fillRect(rnd(0,w),rnd(0,h),rnd(2,12),rnd(20,95));}});glassRough.colorSpace=THREE.NoColorSpace;waterGlass.roughnessMap=glassRough;
// Real-scale surface changes: wet plaster, runoff below sills, and fine cracks.
plaster.onBeforeCompile=shader=>{
 shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vSurfaceWorld;');
 shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
 vec4 surfaceWorld=vec4(transformed,1.);
 #ifdef USE_INSTANCING
 surfaceWorld=instanceMatrix*surfaceWorld;
 #endif
 vSurfaceWorld=(modelMatrix*surfaceWorld).xyz;`);
 shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
 varying vec3 vSurfaceWorld;
 float wallHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float wallNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(wallHash(i),wallHash(i+vec2(1.,0.)),f.x),mix(wallHash(i+vec2(0.,1.)),wallHash(i+1.),f.x),f.y);}`);
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec2 wp=vec2(vSurfaceWorld.x+vSurfaceWorld.z*.71,vSurfaceWorld.y);
 float cloud=wallNoise(wp*.6)*.52+wallNoise(wp*2.4)*.30+wallNoise(wp*7.2)*.18;
 float runoff=wallNoise(vec2(wp.x*11.,wp.y*.32));
 float roofDamp=exp(-abs(wp.y-6.5)*2.7)*(.16+runoff*.32);
 float sillDamp=exp(-abs(wp.y-4.14)*5.)*.10;
 float baseDamp=exp(-max(0.,wp.y-.4)*3.)*.18;
 diffuseColor.rgb*=vec3(.98,.99,1.)*(.80+cloud*.28-roofDamp-sillDamp-baseDamp);
 `);
};plaster.customProgramCacheKey=()=> 'wet-plaster-12';

// Rain marks on the front glass are shallow normal relief, not opaque streak decals.
const dropCanvas=document.createElement('canvas');dropCanvas.width=dropCanvas.height=512;
const dc=dropCanvas.getContext('2d');dc.fillStyle='#808080';dc.fillRect(0,0,512,512);
for(let i=0;i<380;i++){
 const x=rnd(0,512),y=rnd(0,512),r=rnd(.8,3.1),stretch=rnd(1,2.7);
 const g=dc.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#dfdfdf');g.addColorStop(.58,'#b8b8b8');g.addColorStop(1,'#808080');
 dc.save();dc.translate(x,y);dc.scale(1,stretch);dc.translate(-x,-y);dc.fillStyle=g;dc.beginPath();dc.arc(x,y,r,0,Math.PI*2);dc.fill();dc.restore();
}
const pixels=dc.getImageData(0,0,512,512),norm=dc.createImageData(512,512);
for(let y=0;y<512;y++)for(let x=0;x<512;x++){
 const k=(y*512+x)*4,at=(xx,yy)=>pixels.data[(((yy+512)%512)*512+(xx+512)%512)*4]/255;
 let dx=(at(x-1,y)-at(x+1,y))*.62,dy=(at(x,y-1)-at(x,y+1))*.62;const l=Math.hypot(dx,dy,1);
 norm.data[k]=(dx/l*.5+.5)*255;norm.data[k+1]=(dy/l*.5+.5)*255;norm.data[k+2]=(1/l*.5+.5)*255;norm.data[k+3]=255;
}dc.putImageData(norm,0,0);
const dropNormal=new THREE.CanvasTexture(dropCanvas);dropNormal.wrapS=dropNormal.wrapT=THREE.RepeatWrapping;dropNormal.repeat.set(2.2,2.8);dropNormal.anisotropy=8;
const frontGlass=waterGlass.clone();frontGlass.normalMap=dropNormal;frontGlass.normalScale=new THREE.Vector2(.22,.22);frontGlass.roughness=.09;
// Replace only exterior panes, retaining clear refrigerator glass.
for(const batch of batches.values())if(batch.mat===waterGlass&&batch.parent===storeGroup){
 const outside=[],inside=[];
 for(const m of batch.matrices){const p=new THREE.Vector3().setFromMatrixPosition(m);(p.z> -1.20||p.x>right-.10?outside:inside).push(m);}
 if(outside.length){batches.set(batch.type+'/'+frontGlass.uuid+'/'+storeGroup.uuid,{...batch,mat:frontGlass,matrices:outside});batch.matrices=inside;}
}
// Worn render repairs at the base, subtle mineral deposits on the window sills.
const repairMat=textured('white_plaster_rough_01','#a5a69d',[.7,.7],.96);
for(const [x,y,w,h]of[[-12.8,4.02,.28,.13],[-10.22,4.02,.15,.09],[-5.60,4.03,.20,.12],[-3.01,3.96,.18,.22],[-12.7,6.39,.36,.08]]){
 const sh=new THREE.Shape();for(let i=0;i<=17;i++){const a=i/17*Math.PI*2,r=1+rnd(-.12,.12);const u=Math.cos(a)*w*.5*r,v=Math.sin(a)*h*.5*r;if(i===0)sh.moveTo(u,v);else sh.lineTo(u,v);}
 const patch=new THREE.Mesh(new THREE.ShapeGeometry(sh),repairMat);patch.position.set(x,y,front+.009);roofGroup.add(patch);
}
const hairline=mat('#555951',.99);
for(const [x,y]of[[-10.1,4.18],[-6.82,5.98],[-3.02,6.05]]){
 const points=[[x,y,front+.011]];let xx=x,yy=y;for(let i=0;i<8;i++){xx+=rnd(-.04,.04);yy-=rnd(.035,.075);points.push([xx,yy,front+.012]);}wire(points,.0017,hairline,roofGroup);
}
// Narrow masonry joints and a weathered lower wall, with a service hatch on the side.
solid(.015,.95,1.17,right+.008,1.50,-7.96,paintedMetal);
for(const z of[-8.50,-7.42])rod([right+.035,1.08,z],[right+.035,1.91,z],.009,aluminium);
for(const y of[1.08,1.91])rod([right+.035,y,-8.50],[right+.035,y,-7.42],.009,aluminium);
for(let y=1.24;y<1.75;y+=.055)box(.022,.017,.88,right+.025,y,-7.96,darkMetal,storeGroup);
// Small glazed safety markers and opening-hours vinyl have actual placement on the glass.
const vinyl=mat('#c9d7d3',.72,0,{transparent:true,opacity:.36,depthWrite:false});
for(const [x,w]of[[-11.58,3.58],[-8.57,2.13],[-3.96,2.51]]){
 box(w,.023,.003,x,1.12,-1.042,vinyl,storeGroup);
 for(let xx=x-w/2+.16;xx<x+w/2;xx+=.28)box(.036,.036,.003,xx,1.18,-1.041,vinyl,storeGroup);
}
// Shop lights now cast shelf and fixture shadows instead of uniformly filling the room.
spot(-11.45,3.04,-4.5,26,'#e5edf4',[-11.45,.42,-4.5],1.16);
spot(-11.45,3.04,-7.9,24,'#e7ebe7',[-11.45,.42,-7.9],1.15).castShadow=false;
spot(-6.2,3.04,-7.9,22,'#e8e8e0',[-6.2,.42,-7.9],1.15);
// A faint bounced spill gives the wall below the canopy a spatial gradient.


// The gutter line collects silty water and debris; it is not uniformly reflective.
const gutterSurface=textured('asphalt_02','#4e5653',[20,.10],.82);
box(100,.005,.28,-8,-.010,1.68,gutterSurface);
const leafMats=['#5d5640','#555643','#3f493c'].map(c=>mat(c,.55));
for(let i=0;i<75;i++){
 const x=rnd(-19,3),z=rnd(1.6,2.05),shape=new THREE.Shape();shape.moveTo(0,-.055);shape.bezierCurveTo(.034,-.024,.031,.017,0,.054);shape.bezierCurveTo(-.021,.018,-.028,-.02,0,-.055);
 const g=new THREE.ShapeGeometry(shape,3);const o=new THREE.Mesh(g,leafMats[i%3]);o.rotation.set(-Math.PI/2,0,rnd(0,6.28));o.scale.setScalar(rnd(.6,1.6));o.position.set(x,.004,z);o.receiveShadow=true;scene.add(o);
}
// Drip loops, screws and oxidised joins at the awning's real sheet seams.
for(let x=-13.1;x<-2.9;x+=1.15){box(.019,.14,.043,x,2.82,.359,aluminium,storeGroup);cyl(.006,.007,x,2.83,.387,rust,storeGroup,[Math.PI/2,0,0]);}
for(const x of[-13.27,-2.73])for(const y of[.73,1.43,2.13]){torus(.042,.004,x,y,-.72,aluminium,storeGroup,[Math.PI/2,0,0]);}

// Suspended service cables connect this building to the street.
const cable=mat('#1b2226',.83,.05);
for(const [z,h,sag]of[[-3.0,8.7,1.3],[-3.23,8.87,1.1],[-3.49,8.91,1.4]]){
 wire([[-45,h+2,z],[-22,h+.3,z-.1],[-8,h-sag,z-.24],[13,h+.3,z-.31],[40,h+2,z-.4]],.013,cable,scene);
}
rod([-13.4,6.7,-3.2],[-13.4,8.0,-3.2],.027,darkMetal,roofGroup);
rod([-13.65,7.95,-3.2],[-13.12,7.95,-3.2],.019,darkMetal,roofGroup);
for(const x of[-13.58,-13.25]){cyl(.038,.13,x,8.00,-3.2,enamel,roofGroup);for(const y of[7.97,8.02,8.06])cyl(.047,.013,x,y,-3.2,enamel,roofGroup);}
wire([[-13.4,7.9,-3.2],[-13.5,6.9,-3.2],[-13.5,6.15,-2.8],[-13.5,3.8,-2.6],[-13.42,3.3,-1.1]],.014,cable,roofGroup);



const cutawayGroup=new THREE.Group();cutawayGroup.name='removable-canopy-and-sign';scene.add(cutawayGroup);
for(const batch of [...batches.values()]){
 if(batch.parent!==storeGroup&&batch.parent!==scene)continue;
 const keep=[],move=[];
 for(const matrix of batch.matrices){const p=new THREE.Vector3().setFromMatrixPosition(matrix);(p.x>left-.1&&p.x<right+.1&&p.z>-1.12&&p.z<.5&&p.y>2.65&&p.y<3.95?move:keep).push(matrix);}
 if(move.length){batches.set(batch.type+'/'+batch.mat.uuid+'/'+cutawayGroup.uuid,{...batch,parent:cutawayGroup,matrices:move});batch.matrices=keep;}
}
finishInstances();
scene.updateMatrixWorld(true);
const preservedGroups=new Set([roofGroup,storeGroup,cutawayGroup]);
function flattenStatic(root){
 const inverse=root.matrixWorld.clone().invert(),objects=[];
 function collect(p){for(const o of [...p.children]){if(preservedGroups.has(o))continue;if(o.isMesh)objects.push(o);else if(o.isGroup)collect(o);}}
 collect(root);const instanced=new Map();
 for(const o of objects){
  const transform=new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld);
  if(o.isInstancedMesh){
   const key=o.geometry.uuid+'/'+o.material.uuid+'/'+o.castShadow;
   if(!instanced.has(key))instanced.set(key,{source:o,matrices:[]});const entry=instanced.get(key),m=new THREE.Matrix4();
   for(let k=0;k<o.count;k++){o.getMatrixAt(k,m);entry.matrices.push(new THREE.Matrix4().multiplyMatrices(transform,m));}
   o.removeFromParent();
  }else{o.removeFromParent();transform.decompose(o.position,o.quaternion,o.scale);o.updateMatrix();root.add(o);}
 }
 for(const {source,matrices} of instanced.values()){
  if(!matrices.length)continue;const o=new THREE.InstancedMesh(source.geometry,source.material,matrices.length);matrices.forEach((m,i)=>o.setMatrixAt(i,m));o.instanceMatrix.needsUpdate=true;o.castShadow=source.castShadow;o.receiveShadow=source.receiveShadow;root.add(o);
 }
}
for(const root of [scene,roofGroup,storeGroup,cutawayGroup])flattenStatic(root);
function mergeStaticMeshes(parent){
 const buckets=new Map();
 for(const o of [...parent.children]){
  if(o.isGroup){mergeStaticMeshes(o);continue;}
  if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material)||o.material.transparent)continue;
  const key=o.material.uuid+'/'+o.castShadow+'/'+o.receiveShadow;
  if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);
 }
 for(const meshes of buckets.values()){
  if(meshes.length<3)continue;
  const geometries=meshes.map(o=>{let g=o.geometry.clone();if(g.index)g=g.toNonIndexed();g.applyMatrix4(o.matrix);for(const a of Object.keys(g.attributes))if(!['position','normal','uv'].includes(a))g.deleteAttribute(a);if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));return g;});
  const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());
  if(!merged)continue;
  const m=new THREE.Mesh(merged,meshes[0].material);m.castShadow=meshes[0].castShadow;m.receiveShadow=meshes[0].receiveShadow;m.name='static-detail-batch';parent.add(m);meshes.forEach(o=>parent.remove(o));
 }
}
mergeStaticMeshes(scene);
startup.geometry=performance.now();loadingStage('正在完成默认高画质渲染');


// The puddle surface reflects actual scene geometry and is masked by ground relief.
const waterUniform={value:0};
const waterShader={...Reflector.ReflectorShader,uniforms:THREE.UniformsUtils.clone(Reflector.ReflectorShader.uniforms)};
waterShader.uniforms.uTime=waterUniform;
waterShader.vertexShader=waterShader.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv; varying vec3 vWorld;').replace('vUv = textureMatrix','vWorld = (modelMatrix * vec4(position,1.0)).xyz; vUv = textureMatrix');
waterShader.fragmentShader=`
uniform vec3 color;uniform sampler2D tDiffuse;uniform float uTime;varying vec4 vUv;varying vec3 vWorld;
#include <logdepthbuf_pars_fragment>
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){return noise(p)*.54+noise(p*2.13)*.27+noise(p*4.42)*.13+noise(p*9.5)*.06;}
void main(){
 #include <logdepthbuf_fragment>
 vec2 p=vWorld.xz;vec3 view=normalize(cameraPosition-vWorld);float facing=max(.015,view.y);
 float basin=fbm(p*.65);float gutter=exp(-abs(p.y-1.92)*2.8)*.13;
 float pool=smoothstep(.43,.57,basin+gutter);
 float small=fbm(p*10.);float filmCoverage=smoothstep(.22,.54,small)*.07;
 float motion=uTime*.55;
 vec2 wave=vec2(fbm(p*3.6+vec2(motion,-motion*.23)),fbm(p*4.1+vec2(-motion*.31,motion)))-.5;
 vec2 ringNormal=vec2(0.);float broken=0.;vec2 grid=floor(p*4.);
 for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++){
  vec2 cell=grid+vec2(float(i),float(j));float h=hash(cell);
  vec2 center=(cell+vec2(h,hash(cell+9.3)))/4.;vec2 delta=p-center;float dist=length(delta);
  float age=fract(uTime*(1.6+h*.9)+h*7.);float rad=age*.20;
  float envelope=exp(-pow((dist-rad)*90.,2.))*(1.-age);
  ringNormal+=normalize(delta+.00001)*envelope*sin((dist-rad)*220.)*.0023;
  broken+=envelope*.05;
 }
 vec2 warp=wave*.0031+ringNormal;
 vec4 uv=vUv;uv.xy+=warp*uv.w;
 float edgeRough=(1.-pool)*.0012+.00024;
 vec3 reflected=texture2DProj(tDiffuse,uv).rgb*.40;
 for(int i=0;i<4;i++){
  float a=float(i)*1.570796;vec4 q=uv;q.xy+=vec2(cos(a),sin(a)*2.1)*(edgeRough+broken*.001)*uv.w;
  reflected+=texture2DProj(tDiffuse,q).rgb*.15;
 }
 float fresnel=.025+.975*pow(1.-facing,5.);
 float coverage=pool*(.06+fresnel*.82)+filmCoverage*fresnel;
 gl_FragColor=vec4(reflected*vec3(.92,.96,1.),min(.89,coverage));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
const reflection=new Reflector(new THREE.PlaneGeometry(124,124),{textureWidth:mobile?768:1536,textureHeight:mobile?768:1536,multisample:0,clipBias:.003,color:'#bdcbd5',shader:waterShader});
reflection.rotation.x=-Math.PI/2;reflection.position.y=-.007;reflection.material.transparent=true;reflection.material.depthWrite=false;reflection.renderOrder=1;scene.add(reflection);

// A height map prevents rainfall from passing through buildings and canopies.
function surfaceHeight(x,z){
 let y=x>-60&&x<45&&((z>-11.1&&z<1.6)||(z>10.05&&z<13.3))?.18:.01;
 for(const b of buildings)if(Math.abs(x-b.x)<b.w/2&&Math.abs(z-b.z)<b.d/2)y=Math.max(y,b.h+.45);
 if(x>-13.4&&x<-2.6&&z>-1.1&&z<.38)y=Math.max(y,3.1);
 return y;
}
const heights=new Float32Array(256*256);for(let y=0;y<256;y++)for(let x=0;x<256;x++)heights[y*256+x]=surfaceHeight(x/255*120-60,y/255*120-60);
const heightMap=new THREE.DataTexture(heights,256,256,THREE.RedFormat,THREE.FloatType);heightMap.minFilter=heightMap.magFilter=THREE.NearestFilter;heightMap.needsUpdate=true;
// Dense, wind-driven rain, with a common clock for pause and deterministic captures.
const weatherObjects=[];
function weatherMesh(g,m){const o=new THREE.Mesh(g,m);o.frustumCulled=false;o.userData.weather=true;scene.add(o);weatherObjects.push(o);return o;}
function rainQuadGeometry(count){const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-.5,0,0,.5,0,0,.5,1,0,-.5,0,0,.5,1,0,-.5,1,0],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,0,1,1,0,1],2));g.instanceCount=count;return g;}
const rainCount=mobile?26000:56000;
const rainGeom=rainQuadGeometry(rainCount),rainBase=new Float32Array(rainCount*3),rainSeed=new Float32Array(rainCount);
for(let i=0;i<rainCount;i++){rainBase.set([rnd(-33,13),rnd(0,24),rnd(-25,22)],i*3);rainSeed[i]=rnd();}
rainGeom.setAttribute('aBase',new THREE.InstancedBufferAttribute(rainBase,3));rainGeom.setAttribute('aSeed',new THREE.InstancedBufferAttribute(rainSeed,1));
const weatherTime={value:17},weatherAmount={value:1.25},weatherFlash={value:0};
const rainMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uTime:weatherTime,uAmount:weatherAmount,uFlash:weatherFlash,uHeight:{value:heightMap}},vertexShader:`
 uniform float uTime,uAmount,uFlash;uniform sampler2D uHeight;attribute vec3 aBase;attribute float aSeed;varying vec2 vUv;varying float vAlpha;
 void main(){vUv=uv;vec3 p=aBase;float gust=.075+.035*sin(uTime*.49)+.022*sin(uTime*1.16);float y=mod(p.y-uTime*(19.+aSeed*12.)+10000.,24.);p.x+=y*gust;p.z+=y*.075;p.y=y;
 float roof=texture2D(uHeight,(p.xz+60.)/120.).r;
 float nearShop=exp(-length(p.xz-vec2(-8.,-.3))*.15)*exp(-abs(p.y-2.3)*.15);
 float lamps=exp(-length(p-vec3(-.5,7.38,2.12))*.20)+exp(-length(p-vec3(-22.2,7.38,2.12))*.22)+exp(-length(p-vec3(-11.,3.,-1.))*.24);
 vec4 mv=modelViewMatrix*vec4(p,1.);vec4 head=modelViewMatrix*vec4(p+vec3(gust,1.,.075)*(.14+aSeed*.29),1.);vec2 delta=head.xy-mv.xy;vec2 right=normalize(vec2(-delta.y,delta.x));
 mv.xy+=right*position.x*(.0026+aSeed*.0035)+delta*position.y;
 vAlpha=(.025+nearShop*.12+lamps*.20+uFlash*.29)*step(roof+.08,p.y)*step(aSeed,min(1.,uAmount*.79))*clamp(1.-length(mv.xyz)/90.,.23,1.);
 gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform float uFlash;varying vec2 vUv;varying float vAlpha;void main(){float edge=pow(max(0.,1.-abs(vUv.x-.5)*2.),1.6),tip=pow(sin(vUv.y*3.14159),.8);gl_FragColor=vec4(mix(vec3(.65,.73,.83),vec3(.91,.94,1.),uFlash),vAlpha*edge*tip);}`});
const rainLines=weatherMesh(rainGeom,rainMat);

const rippleCount=mobile?3600:7200,ripplePos=[],rippleUV=[],ripplePhase=[];
const quad=[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]];
for(let i=0;i<rippleCount;i++){const x=rnd(-23,6),z=rnd(-13,15),y=surfaceHeight(x,z);if(y>1)continue;const s=rnd(.03,.14),phase=rnd();for(const[u,v]of quad){ripplePos.push(x+u*s,y+.019,z+v*s);rippleUV.push(u,v);ripplePhase.push(phase);}}
const rippleGeometry=new THREE.BufferGeometry();rippleGeometry.setAttribute('position',new THREE.Float32BufferAttribute(ripplePos,3));rippleGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(rippleUV,2));rippleGeometry.setAttribute('aPhase',new THREE.Float32BufferAttribute(ripplePhase,1));
const rippleMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uTime:weatherTime,uAmount:weatherAmount,uFlash:weatherFlash},vertexShader:`attribute float aPhase;varying vec2 vUv;varying float vPhase;void main(){vUv=uv;vPhase=aPhase;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float uTime,uAmount,uFlash;varying vec2 vUv;varying float vPhase;void main(){float life=fract(uTime*2.5+vPhase),r=length(vUv);float band=1.-smoothstep(.015,.085,abs(r-life*.94));float second=(1.-smoothstep(.015,.07,abs(r-life*.63)))*.34;float a=(band+second)*(1.-life)*.085*min(1.6,uAmount);gl_FragColor=vec4(vec3(.52,.68,.76)+uFlash*.25,a);}`});
const ripples=weatherMesh(rippleGeometry,rippleMat);

// Raindrop impact spray rises only a few centimetres from exposed surfaces.
const splashCount=mobile?3600:8000,splashGeom=rainQuadGeometry(splashCount),splashBase=new Float32Array(splashCount*3),splashSeed=new Float32Array(splashCount);
for(let i=0;i<splashCount;i++){let x,z,y;do{x=rnd(-20,4);z=rnd(-12,12);y=surfaceHeight(x,z);}while(y>1);splashBase.set([x,y+.018,z],i*3);splashSeed[i]=rnd();}
splashGeom.setAttribute('aBase',new THREE.InstancedBufferAttribute(splashBase,3));splashGeom.setAttribute('aSeed',new THREE.InstancedBufferAttribute(splashSeed,1));
const splashMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:weatherTime,uAmount:weatherAmount,uFlash:weatherFlash},vertexShader:`uniform float uTime,uAmount,uFlash;attribute vec3 aBase;attribute float aSeed;varying vec2 vUv;varying float vAlpha;void main(){vUv=uv;float life=fract(uTime*(2.5+aSeed)+aSeed*17.);float theta=aSeed*175.;vec3 p=aBase+vec3(cos(theta)*life*.13,sin(life*3.14159)*(.035+aSeed*.07),sin(theta)*life*.13);vec4 mv=modelViewMatrix*vec4(p,1.);mv.xy+=vec2(position.x*.007,position.y*.016);float nearShop=exp(-length(p.xz-vec2(-8.,.3))*.12);vAlpha=(.14+nearShop*.23+uFlash*.3)*(1.-life)*step(aSeed,uAmount*.8);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying vec2 vUv;varying float vAlpha;void main(){float d=length((vUv-.5)*2.);gl_FragColor=vec4(.72,.82,.85,max(0.,1.-d)*vAlpha);}`});
weatherMesh(splashGeom,splashMat);

// A broken water curtain spills over the awning lip, concentrated at its seams.
const runoffCount=mobile?180:360,runoffGeom=rainQuadGeometry(runoffCount),runoffBase=new Float32Array(runoffCount*3),runoffSeed=new Float32Array(runoffCount);
for(let i=0;i<runoffCount;i++){const clusters=[-13.05,-11.1,-8.3,-5.7,-2.95],x=i%3?clusters[i%5]+rnd(-.15,.15):rnd(-13.3,-2.7);runoffBase.set([x,rnd(0,2.6),.35+rnd(-.015,.02)],i*3);runoffSeed[i]=rnd();}
runoffGeom.setAttribute('aBase',new THREE.InstancedBufferAttribute(runoffBase,3));runoffGeom.setAttribute('aSeed',new THREE.InstancedBufferAttribute(runoffSeed,1));
const runoffMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uTime:weatherTime,uAmount:weatherAmount,uFlash:weatherFlash},vertexShader:`uniform float uTime,uAmount,uFlash;attribute vec3 aBase;attribute float aSeed;varying vec2 vUv;varying float vAlpha;void main(){vUv=uv;vec3 p=aBase;p.y=.20+mod(aBase.y-uTime*(4.+aSeed*2.)+1000.,2.56);p.x-=pow((2.76-p.y)/2.56,2.)*.09;vec4 mv=modelViewMatrix*vec4(p,1.);vec4 end=modelViewMatrix*vec4(p+vec3(0.,.10+aSeed*.30,0.),1.);mv.x+=position.x*(.006+aSeed*.009);mv.xy+=position.y*(end.xy-mv.xy);vAlpha=(.24+uFlash*.3)*min(1.4,uAmount)*step(p.y,2.60);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying vec2 vUv;varying float vAlpha;void main(){gl_FragColor=vec4(.74,.85,.89,vAlpha*sin(vUv.y*3.14159)*pow(1.-abs(vUv.x-.5)*2.,1.6));}`});
weatherMesh(runoffGeom,runoffMat);

// Very low spray haze catches the fluorescent light along the kerb.
const mistCount=110,mistGeom=rainQuadGeometry(mistCount),mistBase=new Float32Array(mistCount*3),mistSeed=new Float32Array(mistCount);
for(let i=0;i<mistCount;i++){mistBase.set([rnd(-18,1),rnd(.06,.14),rnd(1.8,8)],i*3);mistSeed[i]=rnd();}mistGeom.setAttribute('aBase',new THREE.InstancedBufferAttribute(mistBase,3));mistGeom.setAttribute('aSeed',new THREE.InstancedBufferAttribute(mistSeed,1));
const mistMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:weatherTime,uAmount:weatherAmount,uFlash:weatherFlash},vertexShader:`uniform float uTime;attribute vec3 aBase;attribute float aSeed;varying vec2 vUv;varying float vAlpha;void main(){vUv=uv;vec3 p=aBase;p.x+=sin(uTime*.7+aSeed*21.)*.27;vec4 mv=modelViewMatrix*vec4(p,1.);mv.xy+=vec2(position.x*(1.+aSeed*1.6),position.y*(.14+aSeed*.2));vAlpha=.018+exp(-length(p.xz-vec2(-8.,.5))*.14)*.025;gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform float uAmount,uFlash;varying vec2 vUv;varying float vAlpha;void main(){float soft=pow(max(0.,1.-length((vUv-.5)*2.)),2.);gl_FragColor=vec4(vec3(.53,.66,.73)+uFlash*.22,soft*vAlpha*uAmount);}`});
weatherMesh(mistGeom,mistMat);

const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
const gtao=new GTAOPass(scene,camera,innerWidth*.65,innerHeight*.65);gtao.updateGtaoMaterial({radius:.65,thickness:.22,distanceFallOff:1.3,scale:.9,samples:16,screenSpaceRadius:false});gtao.blendIntensity=1.0;
const originalSize=gtao.setSize.bind(gtao);gtao.setSize=(w,h)=>originalSize(Math.round(w*.65),Math.round(h*.65));
const originalRender=gtao.render.bind(gtao);gtao.render=(...args)=>{const hidden=[];scene.traverse(o=>{if(o.visible&&o.material&&o.material.transparent){hidden.push(o);o.visible=false;}});originalRender(...args);hidden.forEach(o=>o.visible=true);};composer.addPass(gtao);
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.23,.55,1.2);composer.addPass(bloom);composer.addPass(new OutputPass());
const fxaa=new ShaderPass(FXAAShader);const setAA=()=>fxaa.uniforms.resolution.value.set(1/(innerWidth*renderer.getPixelRatio()),1/(innerHeight*renderer.getPixelRatio()));setAA();composer.addPass(fxaa);
const film=new ShaderPass({uniforms:{tDiffuse:{value:null},uTime:{value:0}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform sampler2D tDiffuse;uniform float uTime;varying vec2 vUv;void main(){vec3 col=texture2D(tDiffuse,vUv).rgb;float vignette=1.-.22*pow(length((vUv-.5)*vec2(1.15,.9)),1.8);float grain=fract(sin(dot(vUv*vec2(1743.,1031.),vec2(12.9898,78.233))+floor(uTime*14.))*43758.5453)-.5;col*=vignette;col+=grain*.004;gl_FragColor=vec4(col,1.);}`});composer.addPass(film);

// High-quality realtime rendering is the only rendering path. No scene rebuild on interaction.
const renderQuality={mode:'high-realtime',ambientOcclusion:true,reflections:true,softShadows:true,adaptiveResolution:true};
let adaptiveAverage=24,adaptiveFrames=0,lastAdapt=0;
function adaptResolution(dt,now){
 if(paused||transition)return;
 adaptiveAverage=adaptiveAverage*.96+Math.min(dt*1000,100)*.04;adaptiveFrames++;
 if(adaptiveFrames<90||now-lastAdapt<6500)return;
 const ratio=renderer.getPixelRatio(),minRatio=mobile?.75:.85;
 let next=ratio;
 if(adaptiveAverage>42)next=Math.max(minRatio,ratio-.15);
 else if(adaptiveAverage<27)next=Math.min(initialPixelRatio,ratio+.10);
 if(Math.abs(next-ratio)>.04){renderer.setPixelRatio(next);composer.setPixelRatio(next);setAA();}
 lastAdapt=now;adaptiveFrames=0;
}

let lightningEnabled=true,stormFlash=0,boltCycle=-999,lastThunderCycle=-999;
const stormHash=n=>{const v=Math.sin(n*127.1+19.13)*43758.5453;return v-Math.floor(v);};
function stormEvent(t){const cycle=Math.floor((t-17)/18),start=17+cycle*18+3.3+stormHash(cycle)*2.6;return{cycle,start,age:t-start,delay:1.4+stormHash(cycle+7)*2.0};}
const flashLight=new THREE.DirectionalLight('#d7e1ff',0);flashLight.position.set(-20,24,-15);flashLight.target.position.set(-8,2,-4);flashLight.userData.weather=true;scene.add(flashLight,flashLight.target);
const flashFill=new THREE.HemisphereLight('#becfe9','#334454',0);flashFill.userData.weather=true;scene.add(flashFill);
const skyBase=scene.background.clone(),fogBase=scene.fog.color.clone(),skyLit=new THREE.Color('#7187a2'),fogLit=new THREE.Color('#718ba2'),baseFog=scene.fog.density,baseExposure=renderer.toneMappingExposure,baseEnv=scene.environmentIntensity;
const boltGroup=new THREE.Group();boltGroup.name='distant-lightning';boltGroup.userData.weather=true;boltGroup.visible=false;scene.add(boltGroup);
const boltCore=new THREE.MeshBasicMaterial({color:'#e9eeff',transparent:true,opacity:0,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending});
const boltHalo=new THREE.MeshBasicMaterial({color:'#8dacf3',transparent:true,opacity:0,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending});
function makeBolt(cycle){
 for(const o of [...boltGroup.children]){o.geometry.dispose();boltGroup.remove(o);}
 const leftSide=cycle%2===0,xx=leftSide?-31:-2.4,zz=-18-stormHash(cycle+3)*6,points=[];
 for(let i=0;i<18;i++){const f=i/17;points.push(new THREE.Vector3(xx+(stormHash(cycle*37+i)-.5)*(f<.1?.8:1.8)+f*.9,22-f*17,zz+(stormHash(cycle+i+90)-.5)*.65));}
 function strand(list,r){const path=new THREE.CurvePath();for(let i=1;i<list.length;i++)path.add(new THREE.LineCurve3(list[i-1],list[i]));for(const[m,rr]of[[boltCore,r],[boltHalo,r*4.8]]){const o=new THREE.Mesh(new THREE.TubeGeometry(path,list.length*2,rr,5,false),m);o.userData.weather=true;boltGroup.add(o);}}
 strand(points,.038);
 for(const j of[4,8,11]){const p=points[j],branch=[p];for(let k=1;k<=6;k++)branch.push(new THREE.Vector3(p.x-k*.34+(stormHash(k+j+cycle)-.5)*.60,p.y-k*.57,p.z+.1*k));strand(branch,.010);}
 boltCycle=cycle;
}
function updateStorm(t){
 const ev=stormEvent(t),pulse=(age,amp,decay)=>age<0?0:amp*(1-Math.exp(-age*110))*Math.exp(-age/decay);
 stormFlash=lightningEnabled&&ev.age>=0&&ev.age<1.35?Math.min(1,pulse(ev.age,1.12,.16)+pulse(ev.age-.27,.66,.12)+pulse(ev.age,.13,.6)):0;
 if(stormFlash>.025&&boltCycle!==ev.cycle)makeBolt(ev.cycle);
 boltGroup.visible=stormFlash>.045;boltCore.opacity=Math.min(1,stormFlash*1.5);boltHalo.opacity=stormFlash*.14;
 flashLight.intensity=stormFlash*5.0;flashFill.intensity=stormFlash*1.75;
 scene.background.copy(skyBase).lerp(skyLit,stormFlash*.76);scene.fog.color.copy(fogBase).lerp(fogLit,stormFlash*.64);
 scene.fog.density=baseFog+.0025*rainAmount;scene.environmentIntensity=baseEnv+stormFlash*.6;renderer.toneMappingExposure=baseExposure+stormFlash*.12;
 weatherTime.value=t;weatherAmount.value=rainAmount;weatherFlash.value=stormFlash;
 if(lightningEnabled&&soundOn&&!paused&&!document.hidden&&ev.age>=ev.delay&&ev.age<ev.delay+.35&&lastThunderCycle!==ev.cycle){playThunder(.8+stormHash(ev.cycle)*.2);lastThunderCycle=ev.cycle;}
}
$('#lightning').onclick=()=>{lightningEnabled=!lightningEnabled;$('#lightning').setAttribute('aria-pressed',String(lightningEnabled));$('#lightning').textContent=lightningEnabled?'雷电 开':'雷电 关';updateStorm(elapsed);syncStormAudio();};

const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches,rainAmount=1.25,roofOpen=false,autoOrbit=false,activeView='god',immersive=false,elapsed=17,transition=null,previous=performance.now(),lastDraw=0,frames=0;
const views={
 god:{position:[8.5,12.2,20.0],target:[-7.0,1.65,-.3],label:'01 / 全貌',title:'雨落在这一盏灯前。',copy:'路灯照着斑马线，雨水沿街汇入排水口。'},
 top:{position:[-8,26,-5.39],target:[-8,0,-5.4],label:'02 / 屋顶',title:'雨声，越过屋檐。',copy:'雨槽、旧屋顶，和楼下没有熄灭的灯。'},
 street:{position:[-2.4,1.80,13.0],target:[-7.3,2.85,-1.0],fov:46,label:'03 / 店门',title:'街角的灯，还亮着。',copy:'雨水从檐口滴落，在路边汇成一片倒影。'},
 interior:{position:[-1.6,9.6,5.2],target:[-8,.85,-5.0],label:'04 / 店内',title:'日常，都收在这盏灯里。',copy:'零食、面包、速食与日用品，沿着货架慢慢看。'},
 water:{position:[-9.8,.36,5.5],target:[-8,.9,-.2],label:'05 / 积水',title:'灯光，被雨打散。',copy:'水坑里的倒影，随着雨滴轻轻晃动。'}
};
function updateUI(){syncStormAudio();
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===activeView)));
 $('#roof').setAttribute('aria-pressed',String(roofOpen));$('#roof').textContent=roofOpen?'还原上层':'移开上层';
 $('#orbit').setAttribute('aria-pressed',String(autoOrbit));$('#orbit').textContent=autoOrbit?'停止环绕':'自动环绕';
 $('#pause').setAttribute('aria-pressed',String(paused));$('#pause span').textContent=paused?'播放':'暂停';
 const v=views[activeView];$('#view-label').textContent=v?v.label:'自由观察 / 360°';
 if(v){$('#view-title').textContent=v.title;$('#view-copy').textContent=v.copy;}
}
function setRoof(value){renderer.shadowMap.needsUpdate=true;roofOpen=value;roofGroup.visible=!value;cutawayGroup.visible=!value;updateUI();}
function selectView(name,instant=false){
 if(!views[name])return;activeView=name;autoOrbit=false;controls.autoRotate=false;
 setRoof(name==='interior');const v=views[name];camera.fov=v.fov||42;camera.updateProjectionMatrix();const p=new THREE.Vector3(...v.position),target=new THREE.Vector3(...v.target);
 if(mobile)p.sub(target).multiplyScalar(name==='top'?1.4:1.65).add(target);
 if(instant||reduced.matches){camera.position.copy(p);controls.target.copy(target);controls.update();transition=null;}
 else transition={from:camera.position.clone(),to:p,targetFrom:controls.target.clone(),targetTo:target,started:performance.now(),duration:1500};
 updateUI();
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>selectView(b.dataset.view)));
$('#roof').onclick=()=>setRoof(!roofOpen);$('#reset').onclick=()=>selectView(activeView==='free'?'god':activeView);
$('#orbit').onclick=()=>{autoOrbit=!autoOrbit;controls.autoRotate=autoOrbit;controls.autoRotateSpeed=.45;transition=null;updateUI();};
$('#pause').onclick=()=>{paused=!paused;updateUI();};
$('#rain').oninput=e=>{rainAmount=Number(e.target.value);weatherAmount.value=rainAmount;syncStormAudio();};
controls.addEventListener('start',()=>{transition=null;autoOrbit=false;controls.autoRotate=false;activeView='free';updateUI();});
const toggleImmersive=value=>{immersive=value;document.body.classList.toggle('immersive',value);};$('#immerse').onclick=()=>toggleImmersive(true);$('#restore').onclick=()=>toggleImmersive(false);
addEventListener('keydown',e=>{
 if(e.key==='Escape')toggleImmersive(false);
 if(e.target.tagName==='INPUT')return;
 if(['1','2','3','4','5'].includes(e.key))selectView(['god','top','street','interior','water'][Number(e.key)-1]);
 if(e.key.toLowerCase()==='r')selectView('god');
 if(e.code==='Space'&&(e.target===document.body||e.target===renderer.domElement)){e.preventDefault();paused=!paused;updateUI();}
});
const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-.03),raycaster=new THREE.Raycaster(),hit=new THREE.Vector3(),clickRings=[];
function groundAt(clientX,clientY){const r=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),camera);return raycaster.ray.intersectPlane(groundPlane,hit)?hit.clone():null;}
renderer.domElement.addEventListener('dblclick',e=>{const p=groundAt(e.clientX,e.clientY);if(!p||Math.abs(p.x)>52||Math.abs(p.z)>52)return;const offset=camera.position.clone().sub(controls.target).multiplyScalar(.75);offset.y=Math.max(offset.y,3);transition={from:camera.position.clone(),to:p.clone().add(offset),targetFrom:controls.target.clone(),targetTo:p,started:performance.now(),duration:1000};activeView='free';updateUI();});
let pointerStart=null;
renderer.domElement.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY,t:performance.now()};});
renderer.domElement.addEventListener('pointerup',e=>{if(!pointerStart||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>5||performance.now()-pointerStart.t>350)return;const p=groundAt(e.clientX,e.clientY);if(!p||Math.abs(p.x)>55||Math.abs(p.z)>55||surfaceHeight(p.x,p.z)>.1)return;
 const m=new THREE.MeshBasicMaterial({color:'#badce9',transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false});const o=new THREE.Mesh(new THREE.RingGeometry(.9,1,48),m);o.rotation.x=-Math.PI/2;o.position.set(p.x,.045,p.z);o.scale.setScalar(.05);scene.add(o);clickRings.push({o,age:0});});
let audioContext=null,audioGain=null,soundOn=false,thunderGain=null,stormMaster=null,thunderBuffer=null,thunderEvents=0,audioState='';
function ensureStormAudio(){
 if(audioContext)return;
 audioContext=new (window.AudioContext||window.webkitAudioContext)();
 const compressor=audioContext.createDynamicsCompressor();compressor.threshold.value=-14;compressor.knee.value=16;compressor.ratio.value=4;compressor.attack.value=.006;compressor.release.value=.35;
 stormMaster=audioContext.createGain();stormMaster.gain.value=0;stormMaster.connect(compressor).connect(audioContext.destination);
 const noise=audioContext.createBuffer(2,audioContext.sampleRate*6,audioContext.sampleRate);
 for(let ch=0;ch<2;ch++){const data=noise.getChannelData(ch);let low=0;for(let i=0;i<data.length;i++){const n=Math.random()*2-1;low=low*.983+n*.017;const t=i/audioContext.sampleRate;data[i]=(n*.36+low*2.7)*(.83+.1*Math.sin(t*2.5+ch));}}
 const rainSource=audioContext.createBufferSource();rainSource.buffer=noise;rainSource.loop=true;
 const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=4100;filter.Q.value=.4;
 audioGain=audioContext.createGain();audioGain.gain.value=.22;rainSource.connect(filter).connect(audioGain).connect(stormMaster);rainSource.start();
 thunderGain=audioContext.createGain();thunderGain.gain.value=.65;thunderGain.connect(stormMaster);
 thunderBuffer=audioContext.createBuffer(2,Math.ceil(audioContext.sampleRate*9.5),audioContext.sampleRate);
 for(let ch=0;ch<2;ch++){let bass=0,rumble=0;const data=thunderBuffer.getChannelData(ch);for(let i=0;i<data.length;i++){const t=i/audioContext.sampleRate,n=Math.random()*2-1;bass=.988*bass+.012*n;rumble=.96*rumble+.04*n;
 const attack=(1-Math.exp(-t*65))*Math.exp(-t*13)*n*.48;
 const roll=(1-Math.exp(-t*3.4))*Math.exp(-t*.40)*(.64+.20*Math.sin(t*4.7+ch*.4)+.15*Math.sin(t*10.1))*(bass*6.5+rumble*1.3);
 const echo=t>.72?Math.exp(-(t-.72)*2.1)*Math.sin(Math.min(1,(t-.72)*6)*Math.PI*.5)*rumble*.7:0;
 const tail=Math.min(1,(9.5-t)*1.5);data[i]=Math.tanh((attack+roll+echo)*1.15)*.88*tail;}}
}
function syncStormAudio(){
 if(!audioContext)return;const active=soundOn&&!paused&&!document.hidden;
 const state=[active,rainAmount,lightningEnabled].join('/');if(state===audioState)return;audioState=state;
 stormMaster.gain.setTargetAtTime(active?.8:0,audioContext.currentTime,.12);
 audioGain.gain.setTargetAtTime(.24*Math.sqrt(rainAmount),audioContext.currentTime,.3);
 thunderGain.gain.setTargetAtTime(lightningEnabled?.72:0,audioContext.currentTime,.18);
}
function playThunder(strength=1){
 if(!audioContext||!soundOn||paused||!lightningEnabled||document.hidden)return;
 const source=audioContext.createBufferSource(),volume=audioContext.createGain(),pan=audioContext.createStereoPanner();source.buffer=thunderBuffer;source.playbackRate.value=.92+stormHash(thunderEvents+14)*.15;volume.gain.value=strength;pan.pan.value=(stormHash(thunderEvents+23)-.5)*.65;
 source.connect(volume).connect(pan).connect(thunderGain);source.onended=()=>{source.disconnect();volume.disconnect();pan.disconnect();};source.start();thunderEvents++;
}
$('#sound').onclick=async()=>{ensureStormAudio();await audioContext.resume();soundOn=!soundOn;syncStormAudio();$('#sound').setAttribute('aria-pressed',String(soundOn));$('#sound span').textContent=soundOn?'雷雨声 开':'雷雨声 关';};

function drawMap(){ $('#height-label').textContent=`视点高度 ${camera.position.y.toFixed(1)} m`; }
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);setAA();}
addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{previous=performance.now();syncStormAudio();});
function renderAt(t){updateStorm(t);film.uniforms.uTime.value=t;rainMat.uniforms.uTime.value=t;rippleMat.uniforms.uTime.value=t;reflection.material.uniforms.uTime.value=t;renderer.info.reset();composer.render();drawMap();}
function frame(now){
 requestAnimationFrame(frame);if(document.hidden){previous=now;return;}if(now-lastDraw<1000/(mobile?30:45))return;lastDraw=now;
 const rawDt=(now-previous)/1000,dt=Math.min(rawDt,.05);adaptResolution(rawDt,now);previous=now;frames++;if(!paused)elapsed+=dt;
 if(transition){const t=Math.min(1,(now-transition.started)/transition.duration),s=t*t*(3-2*t);camera.position.lerpVectors(transition.from,transition.to,s);controls.target.lerpVectors(transition.targetFrom,transition.targetTo,s);if(t===1)transition=null;}
 controls.autoRotate=autoOrbit&&!paused;controls.update(dt);
 controls.target.x=THREE.MathUtils.clamp(controls.target.x,-19,3);controls.target.z=THREE.MathUtils.clamp(controls.target.z,-14,8);controls.target.y=THREE.MathUtils.clamp(controls.target.y,.0,14);camera.position.y=Math.max(.28,camera.position.y);
 for(let i=clickRings.length-1;i>=0;i--){const r=clickRings[i];r.age+=dt;r.o.scale.setScalar(.04+r.age*.9);r.o.material.opacity=Math.max(0,.5-r.age*.25);if(r.age>2){scene.remove(r.o);r.o.geometry.dispose();r.o.material.dispose();clickRings.splice(i,1);}}
 renderAt(elapsed);
}
selectView('street',true);updateUI();
// Compile into the same linear target used by the compositor. Compiling for the
// screen creates different shader programs and makes the first frame stall again.
renderer.setRenderTarget(composer.readBuffer);
await renderer.compileAsync(scene,camera);
const warmScene=new THREE.Scene(),warmGeometry=new THREE.PlaneGeometry(2,2);
const warmMaterials=new Set();
for(const pass of composer.passes)for(const value of Object.values(pass)){
 if(value?.isMaterial)warmMaterials.add(value);
 else if(Array.isArray(value))for(const m of value)if(m?.isMaterial)warmMaterials.add(m);
}
for(const m of warmMaterials)warmScene.add(new THREE.Mesh(warmGeometry,m));
const warmDepth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,side:THREE.BackSide});
for(const m of [gtao.normalMaterial,warmDepth]){
 warmScene.add(new THREE.Mesh(geom.box,m));
 const inst=new THREE.InstancedMesh(geom.box,m,1);inst.setMatrixAt(0,new THREE.Matrix4());warmScene.add(inst);
}
await renderer.compileAsync(warmScene,camera);
renderer.setRenderTarget(null);warmGeometry.dispose();
startup.shaders=performance.now();
await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
renderAt(elapsed);startup.firstFrame=performance.now();
$('#loading').classList.add('done');
window.__district={ready:true,startup,get storm(){return{rainCount,splashCount,flash:stormFlash,enabled:lightningEnabled,thunderEvents,event:stormEvent(elapsed),audioRunning:audioContext?.state==='running',audioGain:stormMaster?.gain.value||0}},get quality(){return {...renderQuality,pixelRatio:renderer.getPixelRatio()}},get inventory(){return {items:inventory.items,categories:[...inventory.categories]}},get street(){return {lamps:lampLocations.length}},scene,camera,controls,renderer,buildings,selectView,setRoof,renderAt,get roofOpen(){return roofOpen},get view(){return activeView},get paused(){return paused},get rainAmount(){return rainAmount},get autoOrbit(){return autoOrbit},get soundOn(){return soundOn},get immersive(){return immersive},get frames(){return frames},get drawCalls(){return renderer.info.render.calls},setPaused(value){paused=value;updateUI();},setTime(t){elapsed=t;renderAt(t);},get time(){return elapsed}};
requestAnimationFrame(frame);
}
main().catch(error=>{console.error(error);window.__districtError=String(error);const loading=document.querySelector('#loading');loading.replaceChildren();const message=document.createElement('div');message.textContent='三维场景未能载入';const hint=document.createElement('small');hint.textContent='请使用启用了硬件加速的 Edge 或 Chrome 打开此网页。';loading.append(message,hint);});
