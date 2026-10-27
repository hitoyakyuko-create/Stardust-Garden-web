// ゲームのルール処理（見た目の描画は render.js）
const G0=DATA.gfx,R=DATA.rules,W=R.mapW,H=R.mapH,CY=H-2,VW=R.viewW,VH=R.viewH;
const OX=(W-R.protoSize)>>1,OY=H-R.protoSize;
let camX,camY,pd,U,F,E,B,T,TI,OB,turn,city,over,won,busy,sel,mode,plan,log,hpq;
const man=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const occ=(x,y)=>[...U,...F,...E,...B].some(o=>o.x==x&&o.y==y);
const eAt=(x,y)=>E.find(o=>o.x==x&&o.y==y);
const ctl=f=>U.some(u=>man(u,f)<=R.controlRange);
const alive=a=>U.includes(a)||F.includes(a);
const blk=(x,y)=>T[y][x]>0;
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const lg=s=>log.push(s);
const cost=a=>a.skill.cost;
// 向き：画面上で右へ進む／右の相手なら'r'、左なら'l'
const faceTo=(a,t)=>{const s=(t.x-a.x)-(t.y-a.y);if(s)a.face=s>0?'r':'l';};
const topX=()=>{const fr=[...Array(W).keys()].filter(x=>!occ(x,0));return fr[Math.random()*fr.length|0];};
function init(c){
 U=DATA.units.map(d=>({...d,mh:d.hp,sp:R.spInit,x:d.x+OX,y:d.y+OY,face:'r',type:'U'}));
 F=DATA.fragments.map(d=>({...d,x:d.x+OX,y:d.y+OY,type:'F'}));
 T=Array.from({length:H},()=>Array(W).fill(0));TI=Array.from({length:H},()=>Array(W).fill(null));
 for(const t of DATA.terrain){
  for(const[x,y]of t.abs||[]){T[y][x]=t.v;if(t.img)TI[y][x]=t.img;}
  for(const[x,y]of t.rel||[]){T[y+OY][x+OX]=t.v;if(t.img)TI[y+OY][x+OX]=t.img;}
 }
 B=(c?c.B:DATA.buildings.map(b=>({...b,mh:b.hp}))).map(b=>({k:b.k,nm:b.k,hp:b.hp,mh:b.mh,x:b.x+OX,y:b.y+OY,type:'B'}));  // c＝前の日からの持ち越し
 OB=buildObjects();
 camX=(W-VW)/2;camY=H-VH;E=[];turn=1;city=c?c.city:R.cityHp;over=0;won=0;busy=0;sel=null;mode='m';plan=new Map();
 log=['ターン1：味方をタップして行動を決め、「ターン実行」'];
 hpq=[...DATA.enemy.hpQueue];spawn(DATA.waves.initial);draw();
}
// 隣り合う障害物を、まとめて1つの岩として扱う（2×2→4マス、横2→2x、縦2→2y、他は1マス）
function buildObjects(){
 const seen=new Set(),k=(x,y)=>x+','+y,ok=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&T[y][x]==1&&!seen.has(k(x,y)),O=[],RK=G0.rocks;
 const take=(img,ts)=>{ts.forEach(([x,y])=>seen.add(k(x,y)));O.push({img,tiles:ts,key:Math.max(...ts.map(([x,y])=>x+y))});};
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!ok(x,y))continue;
  if(ok(x+1,y)&&ok(x,y+1)&&ok(x+1,y+1))take(RK.block,[[x,y],[x+1,y],[x,y+1],[x+1,y+1]]);
  else if(ok(x+1,y))take(RK.x,[[x,y],[x+1,y]]);
  else if(ok(x,y+1))take(RK.y,[[x,y],[x,y+1]]);
  else take(RK.single[(x*7+y*13)%RK.single.length],[[x,y]]);}
 return O;
}
function reach(a){
 const k=(x,y)=>x+','+y,s={x:a.x,y:a.y,p:[],s:0},d={[k(a.x,a.y)]:s},q=[s];
 while(q.length){const c=q.shift();if(c.s>=R.moveRange)continue;
  for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=c.x+dx,ny=c.y+dy;
   if(nx<0||ny<0||nx>=W||ny>CY||d[k(nx,ny)]||blk(nx,ny)||occ(nx,ny))continue;
   d[k(nx,ny)]={x:nx,y:ny,p:[...c.p,[nx,ny]],s:c.s+1};q.push(d[k(nx,ny)]);}}
 return Object.values(d);
}
// 攻撃できるマスの一覧（フラグメントは隣＋直線2マス、ユニットはrange以内）
function tg(a,px,py){
 const r=[];
 for(let y=0;y<=CY;y++)for(let x=0;x<W;x++){const d=Math.abs(x-px)+Math.abs(y-py);
  const ok=a.type=='F'?(d==1||(d==2&&(x==px||y==py))):(d>=1&&d<=a.range);
  if(ok)r.push({x,y});}
 return r;
}
function spawn(k){for(let i=0;i<k;i++)E.push({x:topX(),y:0,hp:hpq.shift(),type:'E'});}
function chk(){if(!over&&(city<=0||!U.length)){over=1;lg('■ゲームオーバー');}}
function hurt(o,v){
 if(o.type=='B'){o.hp-=v;if(o.hp<=0){B.splice(B.indexOf(o),1);lg(o.nm+'が壊れた');}return;}
 if(o.type=='U'){o.hp-=v;if(o.hp<=0){U.splice(U.indexOf(o),1);lg(o.nm+'が倒れた');}}
 else{o.n-=v;if(o.n<=0){F.splice(F.indexOf(o),1);lg(o.nm+'が全滅');}}
}
function dmg(e,v,who){
 e.hp-=v;lg(who+'→敵に'+v+'ダメージ');
 if(e.hp<=0){E.splice(E.indexOf(e),1);if(e.boss){over=1;won=1;lg('★クリア！ボスを倒した！');}}
}
function mv(a,path){for(const[px,py]of path){if(occ(px,py)||blk(px,py))break;a.face=((px-a.x)-(py-a.y))>0?'r':'l';a.x=px;a.y=py;}}
function atk(a,t){
 if(!t)return;
 faceTo(a,t);
 const d=man(a,t);
 if(a.type=='F'){
  if(d<1||d>2||(t.x!=a.x&&t.y!=a.y))return lg(a.nm+'の攻撃は空振り');
  const dx=Math.sign(t.x-a.x),dy=Math.sign(t.y-a.y);
  for(let i=1;i<=d;i++){const cx=a.x+dx*i,cy=a.y+dy*i;if(T[cy][cx]==1)break;const e=eAt(cx,cy);if(e)return dmg(e,a.n,a.nm);}
  return lg(a.nm+'の攻撃は空振り');
 }
 const e=eAt(t.x,t.y);
 if(e&&d>=1&&d<=a.range)dmg(e,a.atk,a.nm);else lg(a.nm+'の攻撃は空振り');
}
function auto(f){
 if(!E.length)return;
 const n=E.reduce((b,e)=>man(f,e)<man(f,b)?e:b);
 const c=reach(f).reduce((b,c)=>man(c,n)<man(b,n)?c:b);
 mv(f,c.p);
 const t=tg(f,f.x,f.y).sort((a,b)=>man(a,f)-man(b,f)).find(c=>eAt(c.x,c.y));
 if(t)atk(f,t);
}
function eAct(e){
 let m=0;
 if(e.y<CY){
  const D=dfield(),c=reach(e).reduce((b,c)=>(D[c.y][c.x]<D[b.y][b.x]||(D[c.y][c.x]==D[b.y][b.x]&&Math.abs(c.x-e.x)<Math.abs(b.x-e.x)))?c:b);
  mv(e,c.p);m=c.s;
 }
 if(e.y==CY){city-=DATA.enemy.atk;lg('敵が街を攻撃！ 街HP'+Math.max(city,0));}
 else if(m<R.moveRange){const o=[...U,...F,...B].find(o=>man(o,e)==1);if(o){hurt(o,DATA.enemy.atk);lg('敵が'+o.nm+'を攻撃');}}
 chk();
}
// 街に近いほど小さい数字になる距離表（敵の進路決めに使う）
function dfield(){const d=Array.from({length:H},()=>Array(W).fill(99)),q=[];for(let x=0;x<W;x++)if(!blk(x,CY)){d[CY][x]=0;q.push([x,CY]);}
 while(q.length){const[x,y]=q.shift();for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>CY||blk(nx,ny)||d[ny][nx]<99)continue;d[ny][nx]=d[y][x]+1;q.push([nx,ny]);}}return d;}
// スキルを選べるマス（shape:'line'は縦横の直線のみ）
function skt(a,px,py){const sk=a.skill,r=[];for(let y=0;y<=CY;y++)for(let x=0;x<W;x++){const d=Math.abs(x-px)+Math.abs(y-py);if(d>=1&&d<=sk.range&&(sk.shape!='line'||x==px||y==py))r.push({x,y});}return r;}
// スキルの種類ごとの処理（burst＝着弾点と上下左右、charge＝直線に突進）
function skill(a,t){
 const sk=a.skill;a.sp-=sk.cost;faceTo(a,t);const d=man(a,t);
 if(sk.type=='burst'){
  if(d<1||d>sk.range)return lg('スキルは空振り');
  lg(a.nm+'の'+sk.name+'！');
  for(const[dx,dy]of[[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const e=eAt(t.x+dx,t.y+dy);if(e)dmg(e,sk.dmg,sk.who);}
  return;
 }
 if(d<1||d>sk.range||(t.x!=a.x&&t.y!=a.y))return lg('スキルは空振り');
 lg(a.nm+'の'+sk.name+'！');
 const dx=Math.sign(t.x-a.x),dy=Math.sign(t.y-a.y);let lx=a.x,ly=a.y;
 for(let i=1;i<=d;i++){const cx=a.x+dx*i,cy=a.y+dy*i;if(cx<0||cy<0||cx>=W||cy>CY||blk(cx,cy)||[...U,...F,...B].some(o=>o.x==cx&&o.y==cy))break;const e=eAt(cx,cy);if(e)dmg(e,sk.dmg,sk.who);if(!eAt(cx,cy)){lx=cx;ly=cy;}}
 a.x=lx;a.y=ly;
}
async function run(){
 if(busy||over)return;busy=1;sel=null;
 const au=new Set(F.filter(f=>!ctl(f)));
 for(const a of[...U,...F]){
  if(over)break;if(!alive(a))continue;
  if(au.has(a))auto(a);
  else{const p=plan.get(a);if(p){mv(a,p.path);if(p.sk&&a.sp>=cost(a))skill(a,p.t);else atk(a,p.t);}}
  draw();await sl(300);
 }
 for(const b of[...B]){if(over)break;if(!B.includes(b))continue;let did=0;
  const act=DATA.buildingTypes[b.k].act;
  if(act&&act.type=='shoot'){const e=E.filter(e=>man(b,e)<=act.range).sort((p,q)=>man(b,p)-man(b,q))[0];if(e){dmg(e,act.dmg,b.k);did=1;}}
  else if(act&&act.type=='repair'){
   for(const u of U)if(man(b,u)<=act.range&&u.hp<u.mh){u.hp=Math.min(u.mh,u.hp+act.heal);did=1;}
   for(const f of F)if(man(b,f)<=act.range&&f.n<R.fragMax){f.n=Math.min(R.fragMax,f.n+act.fragAdd);did=1;}
   if(did)lg(b.k+'が味方を回復');}
  if(did){draw();await sl(300);}}
 for(const e of[...E].sort(()=>Math.random()-.5)){
  if(over)break;if(!E.includes(e))continue;
  eAct(e);draw();await sl(300);
 }
 if(!over){
  const t=turn,w=DATA.waves;
  if(t<w.bossTurn)spawn(w.perTurn);
  else if(t==w.bossTurn){spawn(w.normalAtBoss);E.push({x:topX(),y:0,hp:w.bossHp,boss:1,type:'E'});lg('ボスが出現！');}
  turn++;U.forEach(u=>u.sp=Math.min(R.spMax,u.sp+R.spRegen));plan=new Map();mode='m';lg('--ターン'+turn+'--');
 }
 busy=0;draw();
 if(over)endBattle();
}

// ===== 1日の流れ（セーブデータ SV に全部まとめる。座標は rel 基準）=====
let SV;
function newSave(){return{day:1,slot:0,step:'ev',city:R.cityHp,pt:DATA.day.startPt,pend:null,B:DATA.buildings.map(b=>({k:b.k,hp:b.hp,mh:b.hp,x:b.x,y:b.y})),msg:''};}
// 行動の効果を適用して、結果の文章を返す
function applyCmd(c){
 let t=c.text;
 if(c.fx){SV.city=Math.min(R.cityHp,SV.city+c.fx.city);SV.B.forEach(b=>b.hp=Math.min(b.mh,b.hp+c.fx.bld));t+='（街HP'+SV.city+'）';}
 return t;
}
// バトル結果をセーブデータへ書き戻す（街HPと生き残った防衛機関を持ち越す）
function saveBattle(){SV.city=Math.max(city,0);SV.B=B.map(b=>({k:b.k,hp:b.hp,mh:b.mh,x:b.x-OX,y:b.y-OY}));}
// いまの場面の表示内容を返す（描き方は main.js）
function dayView(){
 const D=DATA.day,sl=D.slots[SV.slot],hd=SV.day+'日目 '+sl,go=(step,f)=>()=>{SV.step=step;if(f)f();};
 const st=hd+'　街'+SV.city+'　防衛機関'+SV.B.length+'基　ポイント'+SV.pt;
 switch(SV.step){
 case 'ev':return{st,title:hd,text:D.slotEvents[SV.slot],btns:[{l:'次へ',f:go('sel')}]};
 case 'sel':return{st,title:hd+'：行動を選ぶ',text:'どこへ向かう？',
  btns:[...D.commands.map(c=>({l:c.nm,f:()=>{SV.msg=applyCmd(c);SV.step='act';}})),{l:'防衛準備',f:go('prep')}]};
 case 'prep':{const T=DATA.buildingTypes;
  return{st,title:'防衛準備：種類を選ぶ',text:SV.msg||'建てる防衛機関を選んでください（行動は消費しない）',
  btns:[...Object.keys(T).map(k=>({l:k+'（'+T[k].cost+'pt）',off:SV.pt<T[k].cost||!freeSlots().length,f:()=>{SV.pend=k;SV.msg='';SV.step='prep2';}})),
  {l:'戻る',f:()=>{SV.msg='';SV.step='sel';}}]};}
 case 'prep2':return{st,title:'防衛準備：'+SV.pend+'を建てる場所',text:'設立できる場所を選んでください',
  btns:[...freeSlots().map(([x,y])=>({l:'区画('+x+','+y+')',f:()=>buildAt(SV.pend,x,y)})),{l:'戻る',f:go('prep')}]};
 case 'act':return{st,title:hd,text:SV.msg,btns:[{l:'次へ',f:()=>{
  if(SV.slot<D.slots.length-1){SV.slot++;SV.step='ev';}else SV.step='night';}}]};
 case 'night':return{st,title:SV.day+'日目 夜',text:'敵が近づいてくる…',btns:[{l:'防衛バトル開始',f:startBattle}]};
 case 'clear':return{st,title:SV.day+'日目 終了',text:'夜を守り抜いた。街HP'+SV.city+'、防衛機関'+SV.B.length+'基。',
  btns:[{l:SV.day>=D.days?'おしまいへ':'翌朝へ',f:()=>{if(SV.day>=D.days)SV.step='end';else{SV.day++;SV.slot=0;SV.step='ev';SV.pt+=DATA.day.dayPt;}}}]};
 case 'lose':return{st,title:'ゲームオーバー',text:'街を守れなかった…',btns:[{l:'最初から',f:newGame}]};
 default:return{st,title:'試作ここまで',text:D.days+'日間を守り切った！',btns:[{l:'最初から',f:newGame}]};
 }
}

// 設立できる場所のうち、まだ空いている所
function freeSlots(){return DATA.buildSlots.filter(([x,y])=>!SV.B.some(b=>b.x==x&&b.y==y));}
// 防衛機関を設立する（ポイントを使って、セーブデータの防衛機関リストに追加）
function buildAt(k,x,y){const t=DATA.buildingTypes[k];SV.pt-=t.cost;SV.B.push({k,hp:t.hp,mh:t.hp,x,y});SV.msg=k+'を('+x+','+y+')に設立した。';SV.pend=null;SV.step='prep';}

// ===== セーブ・ロード =====
// 保存先は Store にまとめてある。あとで別の保存先（ファイル書き出し等）にするときは、ここだけ差し替えればOK
const Store={
 key:'stardust-garden-save',
 save(o){try{localStorage.setItem(this.key,JSON.stringify(o));}catch(e){}},   // 保存できない環境でもゲームは止めない
 load(){try{return JSON.parse(localStorage.getItem(this.key));}catch(e){return null;}},
 clear(){try{localStorage.removeItem(this.key);}catch(e){}}
};
const SAVE_VER=1;   // セーブデータの形を変えたら上げる（古いデータを見分ける番号）
function saveGame(){Store.save({ver:SAVE_VER,sv:SV});}
// 読み込む。壊れている・古い・無いときは null を返す
function loadGame(){
 const o=Store.load();
 if(!o||o.ver!==SAVE_VER||!o.sv)return null;
 const s={...newSave(),...o.sv};   // あとで項目を増やしても、足りない分は初期値で補う
 if(!Array.isArray(s.B)||!['ev','sel','prep','prep2','act','night','clear','lose','end'].includes(s.step))return null;
 s.B=s.B.filter(b=>DATA.buildingTypes[b.k]);   // 種類が消えた防衛機関は除く
 if(s.step=='prep2'){s.step='prep';s.pend=null;}   // 場所選びの途中は、種類選びに戻す
 return s;
}
