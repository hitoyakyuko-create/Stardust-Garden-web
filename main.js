// 入力（タップ・ドラッグ・ボタン）と起動
const btn=id=>document.getElementById(id);
function tap(ev){
 if(busy||over)return;
 const r=cv.getBoundingClientRect(),py=(ev.clientY-r.top)/r.height*CH,px=(ev.clientX-r.left)/r.width*CW,u=(px-CW/2)/(TW/2),v=(py-CH/2)/(TH/2),X=Math.floor(camX+VW/2+(u+v)/2),Y=Math.floor(camY+VH/2+(v-u)/2);
 if(X<0||Y<0||X>=W||Y>=H)return;
 const a=[...U,...F].find(o=>o.x==X&&o.y==Y);
 if(a&&a!==sel&&(a.type=='U'||ctl(a))){sel=a;mode='m';draw();return;}
 if(!sel){draw();return;}
 if(mode=='m'){const c=reach(sel).find(c=>c.x==X&&c.y==Y);if(c){plan.set(sel,{path:c.p,dx:c.x,dy:c.y,t:null});mode='a';}}
 else{const p=plan.get(sel),L=mode=='s'?skt(sel,p.dx,p.dy):tg(sel,p.dx,p.dy);if(L.some(c=>c.x==X&&c.y==Y)){p.t={x:X,y:Y};p.sk=mode=='s';sel=null;}}
 draw();
}
cv.onpointerdown=e=>{pd={x:e.clientX,y:e.clientY,cx:camX,cy:camY,mv:0};cv.setPointerCapture(e.pointerId);};
cv.onpointermove=e=>{if(!pd)return;const r=cv.getBoundingClientRect(),dx=e.clientX-pd.x,dy=e.clientY-pd.y;
 if(Math.hypot(dx,dy)>8)pd.mv=1;
 if(pd.mv){const u=dx/r.width*CW/(TW/2),v=dy/r.height*CH/(TH/2);camX=cc(pd.cx-(u+v)/2,W-VW);camY=cc(pd.cy-(v-u)/2,H-VH);draw();}};
cv.onpointerup=e=>{if(!pd)return;const m=pd.mv;pd=null;if(m){camX=Math.round(camX);camY=Math.round(camY);draw();}else tap(e);};
cv.onpointercancel=()=>{pd=null;};
btn('cm').onclick=()=>{const t=sel||U[0];if(t){camX=cc(Math.round(t.x-VW/2+.5),W-VW);camY=cc(Math.round(t.y-VH/2+.5),H-VH);}draw();};
btn('sk').onclick=()=>{if(sel&&sel.type=='U'&&mode=='a'&&sel.sp>=cost(sel))mode='s';draw();};
btn('un').onclick=()=>{if(busy||over)return;if(sel){plan.delete(sel);mode='m';}draw();};
btn('cl').onclick=()=>{if(busy||over)return;plan=new Map();sel=null;mode='m';draw();};
btn('go').onclick=run;
btn('skip').onclick=()=>{sel=null;draw();};
btn('rs').onclick=()=>newGame();
// ===== 日常画面と、日常⇔バトルの切り替え =====
function show(battle){btn('day').hidden=battle;btn('battle').hidden=!battle;}
function showDay(){
 show(false);
 const v=dayView();
 btn('st').textContent=v.st;btn('dayTitle').textContent=v.title;btn('dayText').textContent=v.text;
 const box=btn('dayBtns');box.innerHTML='';
 // バトルへ移ったときは日常画面に戻さない
 for(const b of v.btns){const e=document.createElement('button');e.textContent=b.l;e.onclick=()=>{b.f();if(btn('battle').hidden)showDay();};box.appendChild(e);}
}
function newGame(){SV=newSave();showDay();}
function startBattle(){show(true);btn('dawn').hidden=true;init(SV);}   // 夜のバトル（前日からの持ち越し付き）
function endBattle(){btn('dawn').hidden=false;}                       // バトルが終わったら「夜明けへ」を出す
btn('dawn').onclick=()=>{if(won){saveBattle();SV.step='clear';}else SV.step='lose';showDay();};
loadSprites();
loadImages();
newGame();
