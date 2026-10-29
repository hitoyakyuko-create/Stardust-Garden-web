// 描画（見た目の処理）。色や大きさは data.js の gfx で変更する
const G=DATA.gfx,C=G.colors,CW=G.canvasW,CH=G.canvasH,TW=G.tileW,TH=G.tileH,S=G.cell;
const cv=document.getElementById('c');
let g=cv.getContext('2d');           // 描画先（影用の下書きキャンバスに一時的に切り替える）
const MAIN=g,mkc=()=>{const c=document.createElement('canvas');c.width=CW;c.height=CH;return c;},gcv=mkc(),gg=gcv.getContext('2d'),rcv=mkc(),rg=rcv.getContext('2d');  // gg＝本人の下書き、rg＝岩の下書き
// ユニット画像（SPR）。無い・読めない場合は丸アイコンのまま表示する
const SPR={};
function loadSprites(){for(const key of new Set(DATA.units.map(u=>u.sprite).filter(Boolean))){SPR[key]={};
 for(const d of['r','l']){const o=SPR[key][d]={ok:false,img:new Image()};o.img.onload=()=>{o.ok=true;draw();};o.img.src=key+'_'+d+'.png';}}}
// 地形画像（IM）。読めないものは従来の色付き四角で表示する
const IM={};
function loadImages(){const R=G.rocks,names=new Set([G.tiles.a,G.tiles.b,...R.single,R.x,R.y,R.block,...DATA.terrain.map(t=>t.img).filter(Boolean)]);
 for(const n of names){const o=IM[n]={ok:false,img:new Image()};o.img.onload=()=>{o.ok=true;draw();};o.img.src=n+'.png';}}
const getImg=n=>IM[n]&&IM[n].ok?IM[n].img:null;
// 向きに合う画像を選ぶ（_lが無ければ_rを左右反転）
function pick(u){const s=SPR[u.sprite];if(!s)return null;const l=u.face=='l';
 if(l&&s.l.ok)return{img:s.l.img,flip:false};if(s.r.ok)return{img:s.r.img,flip:l};return null;}
function spr(u,pk){const P=G.sprite,p=g.getTransform().transformPoint({x:u.x*S+S/2,y:u.y*S+S/2}),d=TW*P.scale,k=d/192,top=p.y-(192-P.feet)*k+P.drop;
 g.save();g.setTransform(1,0,0,1,0,0);
 g.fillStyle=P.shadow;g.beginPath();g.ellipse(p.x,p.y+2,TW*.3,TH*.3,0,0,7);g.fill();
 if(pk.flip){g.translate(p.x,0);g.scale(-1,1);g.drawImage(pk.img,-d/2,top,d,d);}else g.drawImage(pk.img,p.x-d/2,top,d,d);
 g.setTransform(1,0,0,1,0,0);g.font='bold 13px sans-serif';g.lineWidth=3;g.strokeStyle=C.textDark;g.strokeText(u.nm+' '+u.hp,p.x,p.y+TH*.5);g.fillStyle=C.textLight;g.fillText(u.nm+' '+u.hp,p.x,p.y+TH*.5);
 g.restore();}
// 岩：占めるマス全体を囲む長方形の下端中央に、画像の下端中央を合わせる
function rockDraw(o){const im=getImg(o.img);if(!im)return;const M=g.getTransform(),cs=o.tiles.map(([x,y])=>M.transformPoint({x:x*S+S/2,y:y*S+S/2}));
 const l=Math.min(...cs.map(c=>c.x))-TW/2,r=Math.max(...cs.map(c=>c.x))+TW/2,b=Math.max(...cs.map(c=>c.y))+TH/2,w=im.width*TW/192,h=im.height*TW/192;
 g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(im,(l+r)/2-w/2,b-h,w,h);g.restore();}
const EX=4,cc=(v,m)=>Math.max(-VW/2-EX,Math.min(m+VW/2+EX,v));
const ft=(t,x,y)=>{const p=g.getTransform().transformPoint({x,y});g.save();g.setTransform(1,0,0,1,0,0);g.fillText(t,p.x,p.y);g.restore();};
function mini(){const M=G.mini,m=M.scale,mx=CW-W*m-4,my=4;g.fillStyle='#000a';g.fillRect(mx-1,my-1,W*m+2,H*m+2);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(T[y][x]){g.fillStyle=T[y][x]==1?M.obstacle:M.hole;g.fillRect(mx+x*m,my+y*m,m,m);}
 for(const[a,c]of[[B,M.building],[E,M.enemy],[F,M.fragment],[U,M.unit]])for(const o of a){g.fillStyle=c;g.fillRect(mx+o.x*m,my+o.y*m,m,m);}
 g.save();g.beginPath();g.rect(mx-1,my-1,W*m+2,H*m+2);g.clip();g.strokeStyle='#fff';g.lineWidth=1;g.strokeRect(mx+camX*m,my+camY*m,VW*m,VH*m);g.restore();}
function dot(o,col,txt){
 g.fillStyle=col;g.beginPath();g.arc(o.x*S+S/2,o.y*S+S/2,17,0,7);g.fill();
 g.fillStyle=C.textDark;ft(txt,o.x*S+S/2,o.y*S+S/2);
}
const drawB=b=>{g.fillStyle=DATA.buildingTypes[b.k].color;g.fillRect(b.x*S+3,b.y*S+3,S-6,S-6);g.fillStyle=C.textDark;ft(b.k[0]+b.hp,b.x*S+S/2,b.y*S+S/2);};
const drawE=e=>{const m=e.boss?2:6;g.fillStyle=e.boss?C.boss:C.enemy;g.fillRect(e.x*S+m,e.y*S+m,S-2*m,S-2*m);g.fillStyle=C.textLight;ft(e.hp,e.x*S+S/2,e.y*S+S/2);};
const drawU=u=>{const pk=pick(u);if(pk)spr(u,pk);else dot(u,C.unit,u.n+u.hp);};
const drawF=f=>dot(f,ctl(f)?C.fragOn:C.fragOff,'★'+f.n);
function draw(){
 g=MAIN;g.fillStyle=C.bg;g.fillRect(0,0,CW,CH);
 g.save();{const a=TW/2/S,b=TH/2/S,cx=(camX+VW/2)*S,cy=(camY+VH/2)*S;g.setTransform(a,b,-a,b,CW/2-a*cx+a*cy,CH/2-b*cx-b*cy);}
 // 地面：画像があるマスは後でまとめて描き、無いマスは従来の色付き四角
 const M0=g.getTransform(),gr=[];g.strokeStyle=C.gridLine;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const nm=T[y][x]==2&&TI[y][x]?TI[y][x]:((x+y)%2?G.tiles.b:G.tiles.a),im=getImg(nm);
  if(im)gr.push([im,x,y]);
  else{g.fillStyle=(x+y)%2?C.tileB:C.tileA;g.fillRect(x*S,y*S,S,S);g.strokeRect(x*S,y*S,S,S);
   if(T[y][x]==2){g.fillStyle=C.hole;g.fillRect(x*S+1,y*S+1,S-2,S-2);}}
 }
 for(const o of OB)if(!getImg(o.img))for(const[x,y]of o.tiles){g.fillStyle=C.obstacle;g.fillRect(x*S+1,y*S+1,S-2,S-2);}
 if(gr.length){g.save();g.setTransform(1,0,0,1,0,0);
  for(const[im,x,y]of gr){const p=M0.transformPoint({x:x*S+S/2,y:y*S+S/2});g.drawImage(im,p.x-TW/2-.5,p.y-TH/2-.5,TW+1,TH+1);}
  g.restore();}
 g.font='bold 16px sans-serif';g.textAlign='center';g.textBaseline='middle';
 g.fillStyle=C.cityBar;g.fillRect(0,(H-1)*S,W*S,S);
 g.fillStyle=C.textLight;ft('街 HP '+Math.max(city,0)+' / '+R.cityHp,(camX+VW/2)*S,(H-1)*S+22);
 if(sel){
  const L=mode=='m'?reach(sel).map(c=>[c.x,c.y,C.move]):(mode=='s'?skt:mode=='t'?tst:tg)(sel,plan.get(sel).dx,plan.get(sel).dy).map(c=>[c.x,c.y,mode=='a'?C.attack:C.skill]);
  for(const[x,y,col]of L){g.fillStyle=col;g.fillRect(x*S+1,y*S+1,S-2,S-2);}
 }
 plan.forEach(p=>{
  g.fillStyle=C.plan;g.beginPath();g.arc(p.dx*S+S/2,p.dy*S+S/2,5,0,7);g.fill();
  if(p.t){g.strokeStyle=C.plan;g.lineWidth=3;g.strokeRect(p.t.x*S+4,p.t.y*S+4,S-8,S-8);g.lineWidth=1;g.strokeStyle=C.gridLine;}
 });
 // 岩・建物・敵・味方を、奥から手前の順（x+yの小さい順）に描く
 const items=[];
 for(const o of OB)items.push({key:o.key,pr:0,rock:o,fn:()=>rockDraw(o)});
 for(const b of B)items.push({key:b.x+b.y,pr:1,fn:()=>drawB(b)});
 for(const e of E)items.push({key:e.x+e.y,pr:1,ent:e,fn:()=>drawE(e)});
 for(const f of F)items.push({key:f.x+f.y,pr:1,ent:f,fn:()=>drawF(f)});
 for(const u of U)items.push({key:u.x+u.y,pr:1,ent:u,fn:()=>drawU(u)});
 items.sort((a,b)=>a.key-b.key||a.pr-b.pr);
 for(const it of items)it.fn();
 // 岩の後ろに隠れた部分だけを半透明で重ねる（下書きキャンバスに「岩→その上に本人」を source-in で描き、岩と重なる部分だけ残す）
 if(G.ghostAlpha>0)for(const it of items){const e=it.ent;if(!e)continue;
  const fr=items.filter(r=>r.rock&&r.key>it.key&&getImg(r.rock.img)&&r.rock.tiles.some(([x,y])=>Math.abs(x-e.x)+Math.abs(y-e.y)<=5));
  if(!fr.length)continue;
  const tr=MAIN.getTransform();
  for(const c of[rg,gg]){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,CW,CH);c.setTransform(tr);c.font=MAIN.font;c.textAlign='center';c.textBaseline='middle';}
  g=rg;for(const r of fr)r.fn();g=gg;it.fn();g=MAIN;
  gg.save();gg.setTransform(1,0,0,1,0,0);gg.globalCompositeOperation='destination-in';gg.drawImage(rcv,0,0);gg.restore();
  MAIN.save();MAIN.setTransform(1,0,0,1,0,0);MAIN.globalAlpha=G.ghostAlpha;MAIN.drawImage(gcv,0,0);MAIN.restore();}
 if(sel){g.strokeStyle=C.select;g.lineWidth=3;g.strokeRect(sel.x*S+2,sel.y*S+2,S-4,S-4);g.lineWidth=1;}
 g.restore();mini();
 document.getElementById('st').textContent='ターン'+turn+'　街'+Math.max(city,0)+'　'+U.map(u=>u.nm+u.hp+'(SP'+u.sp+')').join(' ')+'　敵'+E.length+'体'+(sel?(mode=='m'?'　移動先をタップ':'　攻撃マスをタップ（なしなら下のボタン）'):'');
 document.getElementById('log').innerHTML=log.slice(-6).join('<br>');
}
