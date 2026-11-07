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
function mini(){const M=G.mini,m=M.scale,mx=4,my=4;g.fillStyle='#000a';g.fillRect(mx-1,my-1,W*m+2,H*m+2);
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
 if(!U)return;   // バトル開始前は描かない
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
 const ci=cur();
 if(ci&&ci!==sel){g.strokeStyle='#5ae6ff';g.lineWidth=3;g.strokeRect(ci.x*S+2,ci.y*S+2,S-4,S-4);g.lineWidth=1;}   // 詳細を見ている対象
 if(sel){g.strokeStyle=C.select;g.lineWidth=3;g.strokeRect(sel.x*S+2,sel.y*S+2,S-4,S-4);g.lineWidth=1;
  // 「動かすキャラ」の頭上に▽
  const p=g.getTransform().transformPoint({x:sel.x*S+S/2,y:sel.y*S+S/2}),ty=p.y-(pick(sel)?134:30);
  g.save();g.setTransform(1,0,0,1,0,0);g.fillStyle=C.plan;g.beginPath();g.moveTo(p.x-9,ty-12);g.lineTo(p.x+9,ty-12);g.lineTo(p.x,ty+2);g.fill();g.restore();}
 g.restore();mini();queue();
 ui();
}

// 今、下の詳細欄に出す対象（タップして調べたもの→なければ選択中の味方）
const cur=()=>{const all=[...U,...F,...E,...B];return all.includes(insp)?insp:(all.includes(sel)?sel:null);};
// マップ右の行動順（上が「動かすキャラ／敵」、下がNEXT）。今は 味方→フラグメント→敵 の順で、AGIが高い順
function queue(){
 const by=a=>[...a].sort((p,q)=>(q.agi||40)-(p.agi||40)),L=[...by(U),...by(F),...by(E)].filter(o=>!acted.has(o)).slice(0,6);
 const cx=CW-30,tx=(t,x,y,f)=>{g.font='bold '+f+'px sans-serif';g.lineWidth=3;g.strokeStyle=C.textDark;g.strokeText(t,x,y);g.fillStyle=C.textLight;g.fillText(t,x,y);};
 g.save();g.setTransform(1,0,0,1,0,0);g.textAlign='center';g.textBaseline='middle';
 g.fillStyle='#0007';g.fillRect(cx-24,2,48,250);
 tx('行動順',cx,12,11);
 let y=22;
 L.forEach((o,i)=>{const s=i?30:38,x=cx-s/2;
  g.fillStyle=o.type=='E'?(o.boss?C.boss:C.enemy):o.type=='F'?C.fragOn:C.unit;g.fillRect(x,y,s,s);
  if(o===sel||o===cur()){g.strokeStyle=o===sel?C.select:'#5ae6ff';g.lineWidth=2;g.strokeRect(x,y,s,s);}
  g.fillStyle=o.type=='E'?C.textLight:C.textDark;g.font='bold '+(i?14:18)+'px sans-serif';g.fillText(o.type=='U'?o.n:o.type=='F'?'★':o.nm[0],cx,y+s/2);
  if(i==0){g.fillStyle=C.plan;g.beginPath();g.moveTo(x-12,y+s/2-6);g.lineTo(x-12,y+s/2+6);g.lineTo(x-3,y+s/2);g.fill();}
  if(i==1)tx('NEXT',x-22,y+s/2,11);
  y+=s+6;});
 g.restore();
}
// 画面下の表示（上の状態バー・味方カード・詳細欄・履歴）
const SH={single:'単体',cross:'十字',area:'3×3',line:'直線',chain:'連鎖'},RC={line2:'隣＋直線2マス',adj:'隣のみ',r3:'距離3以内'};
function ui(){
 const $=id=>document.getElementById(id),pc=(v,m)=>Math.max(0,Math.min(100,m?v/m*100:0)),mul=m=>Object.entries(m||{}).map(([k,v])=>k+'×'+v).join(' '),row=(k,v)=>'<div class="r"><span>'+k+'</span><b>'+v+'</b></div>';
 $('st').textContent='ターン'+turn+'　街LIFE '+Math.max(city,0)+' / '+R.cityHp;
 $('hint').textContent=sel?(mode=='m'?'移動先をタップ（その場なら自分のマス）':mode=='a'?'攻撃マスをタップ（なしなら「攻撃なし」）':'技の対象マスをタップ'):'';
 $('log').innerHTML=log.slice(-6).join('<br>');
 $('party').innerHTML=[...U,...F].map((a,i)=>{const u=a.type=='U',mh=u?a.mh:a.cap*a.ind,
  ico=u&&SPR[a.sprite]&&SPR[a.sprite].r.ok?'<img src="'+a.sprite+'_r.png">':'<span>'+(u?a.n:'★')+'</span>',
  sp=u?'<div class="bar sp"><i style="width:'+pc(a.sp,a.spMax)+'%"></i><b>'+a.sp+'</b></div>':'<div class="bar nb"></div>';
  return '<div class="pc'+(a===sel?' on':'')+(u||ctl(a)?'':' off')+'" data-k="'+i+'"><div class="ic"'+(u?'':' style="background:'+C.fragOn+'"')+'>'+ico+'</div><div class="bs"><div class="bar"><i style="width:'+pc(a.hp,mh)+'%"></i><b>'+Math.ceil(a.hp)+'</b></div>'+sp+'</div></div>';}).join('');
 const o=cur();
 if(!o){$('pic').innerHTML='';$('stat').innerHTML='<div class="mt">マップの味方・敵をタップすると、ここに詳細が出ます</div>';$('state').innerHTML='';$('skills').innerHTML='';return;}
 const u=o.type=='U',e=o.type=='E',f=o.type=='F',col=e?(o.boss?C.boss:C.enemy):f?C.fragOn:u?C.unit:'#e0a030';
 $('pic').innerHTML=(u&&SPR[o.sprite]&&SPR[o.sprite].r.ok?'<img src="'+o.sprite+'_r.png">':'<div class="big" style="background:'+col+(e?';color:#fff':'')+'">'+(u?o.n:f?'★':e?o.nm[0]:o.k[0])+'</div>')+'<div class="nm">'+o.nm+'</div>';
 let st='';
 if(u)st=row('LIFE',o.hp+'/'+o.mh)+row('SP',o.sp+'/'+o.spMax)+row('ATK',o.atk)+'<small>'+mul(o.atkMul)+'</small>'+row('DEF',o.def)+'<small>'+mul(o.defMul)+'</small>'+row('AGI',o.agi)+row('移動',o.move||R.moveRange)+row('射程',o.range);
 else if(e)st=row('LIFE',o.hp+'/'+o.mh)+row('ATK',o.atk)+row('DEF',Math.round(defOf(o)))+row('AGI',o.agi)+row('移動',o.move||R.moveRange)+row('種別',o.kind)+row('弱点',(o.weak||[]).join('・')||'なし')+row('抵抗',(o.resist||[]).join('・')||'なし');
 else if(f)st=row('個体数',o.n)+row('群れLIFE',Math.ceil(o.hp)+'/'+o.cap*o.ind)+row('FAT',o.fat)+row('FDF',o.fdf)+row('AGI',o.agi)+row('移動',o.move)+row('範囲',RC[o.reach]||'')+row('型',o.kind);
 else st=row('LIFE',o.hp+'/'+o.mh)+row('種類',o.k);
 $('stat').innerHTML=st;
 const bf=(o.buf||[]).map(b=>(b.def?'DEF '+Math.round(b.def*100)+'%':'AGI '+Math.round(b.agi*100)+'%')+'（残り'+b.t+'ターン）');
 if(o.dot)bf.push('継続ダメージ '+o.dot.v+'（残り'+o.dot.t+'ターン）');
 $('state').innerHTML=bf.length?bf.map(t=>'<div>'+t+'</div>').join(''):'<div class="mt">なし</div>';
 $('skills').innerHTML=u?o.skills.map((s,i)=>'<div class="sk'+(o.skill===s?' on':'')+(o.sp<s.cost?' off':'')+'" data-i="'+i+'"><b>'+s.name+'</b><small>'+(s.elem=='auto'?'自動':s.elem)+'　威力'+s.power+'　SP'+s.cost+'　射程'+s.range+'　'+SH[s.shape||'single']+'</small></div>').join(''):'<div class="mt">なし</div>';
}
