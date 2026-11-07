// 入力（タップ・ドラッグ・ボタン）と起動
const btn=id=>document.getElementById(id);
function tap(ev){
 if(busy||over)return;
 const r=cv.getBoundingClientRect(),py=(ev.clientY-r.top)/r.height*CH,px=(ev.clientX-r.left)/r.width*CW,u=(px-CW/2)/(TW/2),v=(py-CH/2)/(TH/2),X=Math.floor(camX+VW/2+(u+v)/2),Y=Math.floor(camY+VH/2+(v-u)/2);
 if(X<0||Y<0||X>=W||Y>=H)return;
 const o=[...U,...F,...E,...B].find(o=>o.x==X&&o.y==Y);   // タップしたマスにいるもの（味方・敵・防衛機関）
 if(o&&o!==sel&&(o.type=='U'||(o.type=='F'&&ctl(o)))){sel=o;insp=o;mode='m';draw();return;}   // 動かせる味方なら選択して、詳細も出す
 let hit=0;   // 移動先・攻撃先として使われたら1
 if(sel){
  if(mode=='m'){const c=reach(sel).find(c=>c.x==X&&c.y==Y);if(c){plan.set(sel,{path:c.p,dx:c.x,dy:c.y,t:null});mode='a';hit=1;}}
  else{const p=plan.get(sel),L=mode=='s'?skt(sel,p.dx,p.dy):mode=='t'?tst(sel):tg(sel,p.dx,p.dy);if(L.some(c=>c.x==X&&c.y==Y)){p.t={x:X,y:Y};p.sk=mode=='s';p.tk=mode=='t';sel=null;hit=1;}}
 }
 if(!hit&&o)insp=o;   // 操作に使われなかったタップは、敵や機関を調べる（詳細を下に出す）
 draw();
}
cv.onpointerdown=e=>{pd={x:e.clientX,y:e.clientY,cx:camX,cy:camY,mv:0};cv.setPointerCapture(e.pointerId);};
cv.onpointermove=e=>{if(!pd)return;const r=cv.getBoundingClientRect(),dx=e.clientX-pd.x,dy=e.clientY-pd.y;
 if(Math.hypot(dx,dy)>8)pd.mv=1;
 if(pd.mv){const u=dx/r.width*CW/(TW/2),v=dy/r.height*CH/(TH/2);camX=cc(pd.cx-(u+v)/2,W-VW);camY=cc(pd.cy-(v-u)/2,H-VH);draw();}};
cv.onpointerup=e=>{if(!pd)return;const m=pd.mv;pd=null;if(m){camX=Math.round(camX);camY=Math.round(camY);draw();}else tap(e);};
cv.onpointercancel=()=>{pd=null;};
// 上の味方カードをタップ＝マップで味方をタップしたのと同じ
btn('party').onclick=e=>{const c=e.target.closest('[data-k]');if(!c||busy||over)return;const a=[...U,...F][+c.dataset.k];if(!a)return;
 if(a.type=='U'||ctl(a)){sel=a;mode='m';}insp=a;draw();};
// 詳細欄のスキルをタップ＝技を切り替える（行動先を決めたあとなら、そのまま対象選びへ）
btn('skills').onclick=e=>{const r=e.target.closest('[data-i]');if(!r||busy||over)return;const o=cur();if(!o||o.type!='U')return;
 const i=+r.dataset.i,s=o.skills[i];if(!s||o.sp<s.cost)return;
 o.skill=s;o.skillIdx=i;if(o===sel&&mode=='a')mode='s';draw();};
btn('cm').onclick=()=>{const t=sel||U[0];if(t){camX=cc(Math.round(t.x-VW/2+.5),W-VW);camY=cc(Math.round(t.y-VH/2+.5),H-VH);}draw();};
btn('sk').onclick=()=>{if(sel&&sel.type=='U'&&mode=='a'&&sel.sp>=cost(sel))mode='s';draw();};
btn('tk').hidden=!DATA.debugShot;if(DATA.debugShot)btn('tk').textContent=DATA.debugShot.name;
btn('tk').onclick=()=>{if(DATA.debugShot&&sel&&sel.type=='U'&&sel.nm==DATA.debugShot.unit&&mode=='a')mode='t';draw();};
btn('un').onclick=()=>{if(busy||over)return;if(sel){plan.delete(sel);mode='m';}draw();};
btn('cl').onclick=()=>{if(busy||over)return;plan=new Map();sel=null;mode='m';draw();};
btn('go').onclick=run;
btn('skip').onclick=()=>{sel=null;draw();};
btn('rs').onclick=()=>{if(confirm('最初からやり直しますか？セーブデータも消えます'))newGame();};
// ===== 日常画面と、日常⇔バトルの切り替え =====
function show(battle){btn('day').hidden=battle;btn('battle').hidden=!battle;}
function showDay(){
 saveGame();   // 場面が変わるたびに自動保存
 show(false);
 const v=dayView();
 btn('st').textContent=v.st;btn('dayTitle').textContent=v.title;btn('dayText').textContent=v.text;
 const box=btn('dayBtns');box.innerHTML='';
 // バトルへ移ったときは日常画面に戻さない
  for(const r of (v.rows||[])){   // 数を増減する行（星屑の振り分け用）
  const row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:8px;margin:6px 0';
  const lb=document.createElement('span');lb.textContent=r.label;lb.style.flex='1';
  const mk=(t,f,off)=>{const e=document.createElement('button');e.textContent=t;e.disabled=!!off;e.onclick=()=>{f();showDay();};return e;};
  const vl=document.createElement('span');vl.textContent=r.val;vl.style.cssText='min-width:2em;text-align:center';
  row.append(lb,mk('−',r.minus,r.minusOff),vl,mk('＋',r.plus,r.plusOff));box.appendChild(row);
 }
 for(const b of v.btns){const e=document.createElement('button');e.textContent=b.l;e.disabled=!!b.off;e.onclick=()=>{b.f();if(btn('battle').hidden)showDay();};box.appendChild(e);}
}
function newGame(){SV=newSave();showDay();}
function startBattle(){show(true);btn('dawn').hidden=true;init(SV);}   // 夜のバトル（前日からの持ち越し付き）
function endBattle(){btn('dawn').hidden=false;}                       // バトルが終わったら「夜明けへ」を出す
btn('dawn').onclick=()=>{if(won){saveBattle();SV.step='clear';}else SV.step='lose';showDay();};
loadSprites();
loadImages();
SV=loadGame()||newSave();showDay();   // セーブがあれば続きから
