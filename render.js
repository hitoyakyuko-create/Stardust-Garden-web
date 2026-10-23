// 描画（見た目の処理）。色や大きさは data.js の gfx で変更する
const G=DATA.gfx,C=G.colors,CW=G.canvasW,CH=G.canvasH,TW=G.tileW,TH=G.tileH,S=G.cell;
const cv=document.getElementById('c'),g=cv.getContext('2d');
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
function draw(){
 g.fillStyle=C.bg;g.fillRect(0,0,CW,CH);
 g.save();{const a=TW/2/S,b=TH/2/S,cx=(camX+VW/2)*S,cy=(camY+VH/2)*S;g.setTransform(a,b,-a,b,CW/2-a*cx+a*cy,CH/2-b*cx-b*cy);}
 g.strokeStyle=C.gridLine;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){g.fillStyle=(x+y)%2?C.tileB:C.tileA;g.fillRect(x*S,y*S,S,S);g.strokeRect(x*S,y*S,S,S);}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(T[y][x]){g.fillStyle=T[y][x]==1?C.obstacle:C.hole;g.fillRect(x*S+1,y*S+1,S-2,S-2);}
 g.font='bold 16px sans-serif';g.textAlign='center';g.textBaseline='middle';
 g.fillStyle=C.cityBar;g.fillRect(0,(H-1)*S,W*S,S);
 g.fillStyle=C.textLight;ft('街 HP '+Math.max(city,0)+' / '+R.cityHp,(camX+VW/2)*S,(H-1)*S+22);
 if(sel){
  const L=mode=='m'?reach(sel).map(c=>[c.x,c.y,C.move]):(mode=='s'?skt:tg)(sel,plan.get(sel).dx,plan.get(sel).dy).map(c=>[c.x,c.y,mode=='s'?C.skill:C.attack]);
  for(const[x,y,col]of L){g.fillStyle=col;g.fillRect(x*S+1,y*S+1,S-2,S-2);}
 }
 plan.forEach(p=>{
  g.fillStyle=C.plan;g.beginPath();g.arc(p.dx*S+S/2,p.dy*S+S/2,5,0,7);g.fill();
  if(p.t){g.strokeStyle=C.plan;g.lineWidth=3;g.strokeRect(p.t.x*S+4,p.t.y*S+4,S-8,S-8);g.lineWidth=1;g.strokeStyle=C.gridLine;}
 });
 for(const b of B){g.fillStyle=DATA.buildingTypes[b.k].color;g.fillRect(b.x*S+3,b.y*S+3,S-6,S-6);g.fillStyle=C.textDark;ft(b.k[0]+b.hp,b.x*S+S/2,b.y*S+S/2);}
 for(const e of E){const m=e.boss?2:6;g.fillStyle=e.boss?C.boss:C.enemy;g.fillRect(e.x*S+m,e.y*S+m,S-2*m,S-2*m);g.fillStyle=C.textLight;ft(e.hp,e.x*S+S/2,e.y*S+S/2);}
 for(const u of U)dot(u,C.unit,u.n+u.hp);
 for(const f of F)dot(f,ctl(f)?C.fragOn:C.fragOff,'★'+f.n);
 if(sel){g.strokeStyle=C.select;g.lineWidth=3;g.strokeRect(sel.x*S+2,sel.y*S+2,S-4,S-4);g.lineWidth=1;}
 g.restore();mini();
 document.getElementById('st').textContent='ターン'+turn+'　街'+Math.max(city,0)+'　'+U.map(u=>u.nm+u.hp+'(SP'+u.sp+')').join(' ')+'　敵'+E.length+'体'+(sel?(mode=='m'?'　移動先をタップ':'　攻撃マスをタップ（なしなら下のボタン）'):'');
 document.getElementById('log').innerHTML=log.slice(-6).join('<br>');
}
