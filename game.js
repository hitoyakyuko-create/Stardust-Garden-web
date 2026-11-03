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
// ===== ダメージ計算（除算型）：ATK×威力/100 × 100/(100+DEF) × 属性倍率 =====
const calcDmg=(atkV,power,defV,m=1)=>Math.max(1,Math.round(atkV*power/100*100/(100+defV)*m));
const elemMul=(e,el)=>!el||el=='無'?1:(e.weak&&e.weak.includes(el)?R.elem.weak:(e.resist&&e.resist.includes(el)?R.elem.resist:1));
const sumBuf=(o,k)=>(o.buf||[]).reduce((s,b)=>s+(b[k]||0),0);   // 敵にかかっている強化・弱体の合計
const defOf=e=>e.def*(1+sumBuf(e,'def'));
const agiOf=o=>(o.agi||40)*(1+sumBuf(o,'agi'))+Math.random()*10-5;   // 行動順（±5のゆらぎ）
const mainKind=a=>Object.keys(a.atkMul||{}).sort((p,q)=>a.atkMul[q]-a.atkMul[p])[0]||'物理';
const uAtk=(a,kind)=>a.atk*((a.atkMul&&a.atkMul[kind])||1);
const dayNow=()=>(typeof SV!=='undefined'&&SV&&SV.day)||1;
// 敵1体を作る（日数が進むほど体力・攻撃・防御が上がる）
function mkEnemy(nm,boss){
 const t=DATA.enemy.types[nm],g=1+DATA.enemy.grow*(dayNow()-1);
 let weak=t.weak,resist=t.resist,label=nm;
 if(t.variant){const v=DATA.enemy.variants[Math.random()*DATA.enemy.variants.length|0];weak=[v.weak];resist=[v.resist];label=nm+'('+v.c+')';}
 const life=Math.round(t.life*g);
 return{x:topX(),y:0,type:'E',nm:label,hp:life,mh:life,atk:Math.round(t.atk*g),def:Math.round(t.def*g),agi:t.agi,kind:t.kind,move:t.move,weak,resist,boss:boss?1:0,buf:[]};
}
function pickType(){
 const m=[...DATA.enemy.mix,...(dayNow()>1?DATA.enemy.mixLate:[])];
 let r=Math.random()*m.reduce((s,x)=>s+x[1],0);
 for(const[n,w]of m){if((r-=w)<0)return n;}
 return m[0][0];
}
// 敵から味方・防衛機関へのダメージ（フラグメントは「失う体数」で返す）
function eDmg(e,o){
 if(o.type=='U')return calcDmg(e.atk,100,o.def*((o.defMul&&o.defMul[e.kind])||1));
 if(o.type=='F')return Math.max(1,Math.ceil(calcDmg(e.atk,100,o.fdf)/o.ind));
 return calcDmg(e.atk,100,R.cityDef);
}
// 敵1体に技・攻撃を当てる（sk＝power・elem・kind・ignore・fx）
function hitEnemy(a,e,sk){
 let el=sk.elem;if(el=='auto')el=(e.weak&&e.weak[0])||'無';
 const m=elemMul(e,el),kind=sk.kind||mainKind(a),v=calcDmg(uAtk(a,kind),sk.power,defOf(e)*(1-(sk.ignore||0)),m);
 dmg(e,v,sk.name||a.nm,m>1?'（弱点！）':m<1?'（抵抗）':'');
 const f=sk.fx;
 if(f&&E.includes(e)){
  e.buf=e.buf||[];
  if(f.def)e.buf.push({def:f.def,t:f.t});
  if(f.agi)e.buf.push({agi:f.agi,t:f.t});
  if(f.dot)e.dot={v:calcDmg(uAtk(a,kind),f.dot,defOf(e),1),t:f.t};
 }
}
// 建設コスト：配列なら「何基目か」で値段が変わる
function bcost(k){const c=DATA.buildingTypes[k].cost,n=SV.B.filter(b=>b.k==k).length;return Array.isArray(c)?c[Math.min(n,c.length-1)]:c;}
// 向き：画面上で右へ進む／右の相手なら'r'、左なら'l'
const faceTo=(a,t)=>{const s=(t.x-a.x)-(t.y-a.y);if(s)a.face=s>0?'r':'l';};
const topX=()=>{const fr=[...Array(W).keys()].filter(x=>!occ(x,0));return fr[Math.random()*fr.length|0];};
function init(c){
 const pty=DATA.party[dayNow()>1?1:0];   // 初日は3人、2日目以降は4人
 U=DATA.units.filter(d=>pty.includes(d.nm)).map(d=>({...d,mh:d.hp,sp:d.spMax,skill:d.skills[d.skillIdx||0],x:d.x+OX,y:d.y+OY,face:'r',type:'U'}));
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
 spawn(DATA.waves.initial);draw();
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
 while(q.length){const c=q.shift();if(c.s>=(a.move||R.moveRange))continue;
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
function spawn(k){for(let i=0;i<k;i++)E.push(mkEnemy(pickType()));}
function chk(){if(!over&&(city<=0||!U.length)){over=1;lg('■ゲームオーバー');}}
function hurt(o,v){
 if(o.type=='B'){o.hp-=v;if(o.hp<=0){B.splice(B.indexOf(o),1);lg(o.nm+'が壊れた');}return;}
 if(o.type=='U'){o.hp-=v;if(o.hp<=0){U.splice(U.indexOf(o),1);lg(o.nm+'が倒れた');}}
 else{o.n-=v;if(o.n<=0){F.splice(F.indexOf(o),1);lg(o.nm+'が全滅');}}
}
function dmg(e,v,who,tag=''){
 e.hp-=v;lg(who+'→'+e.nm+'に'+v+'ダメージ'+tag);
 if(e.hp<=0){const i=E.indexOf(e);if(i>=0)E.splice(i,1);if(e.boss){over=1;won=1;lg('★クリア！ボスを倒した！');}}
}
function mv(a,path){for(const[px,py]of path){if(occ(px,py)||blk(px,py))break;a.face=((px-a.x)-(py-a.y))>0?'r':'l';a.x=px;a.y=py;}}
function atk(a,t){
 if(!t)return;
 faceTo(a,t);
 const d=man(a,t);
 if(a.type=='F'){
  if(d<1||d>2||(t.x!=a.x&&t.y!=a.y))return lg(a.nm+'の攻撃は空振り');
  const dx=Math.sign(t.x-a.x),dy=Math.sign(t.y-a.y);
  for(let i=1;i<=d;i++){const cx=a.x+dx*i,cy=a.y+dy*i;if(T[cy][cx]==1)break;const e=eAt(cx,cy);if(e)return dmg(e,calcDmg(a.n*a.fat,100,defOf(e)),a.nm);}
  return lg(a.nm+'の攻撃は空振り');
 }
 const e=eAt(t.x,t.y);
 if(e&&d>=1&&d<=a.range)hitEnemy(a,e,{power:100,elem:'無',name:a.nm});else lg(a.nm+'の攻撃は空振り');
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
 if(e.y==CY){const v=calcDmg(e.atk,100,R.cityDef);city-=v;lg(e.nm+'が街を攻撃！ '+v+'ダメージ 街HP'+Math.max(city,0));}
 else if(m<(e.move||R.moveRange)){const o=[...U,...F,...B].find(o=>man(o,e)==1);if(o){hurt(o,eDmg(e,o));lg(e.nm+'が'+o.nm+'を攻撃');}}
 chk();
}
// 街に近いほど小さい数字になる距離表（敵の進路決めに使う）
function dfield(){const d=Array.from({length:H},()=>Array(W).fill(99)),q=[];for(let x=0;x<W;x++)if(!blk(x,CY)){d[CY][x]=0;q.push([x,CY]);}
 while(q.length){const[x,y]=q.shift();for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>CY||blk(nx,ny)||d[ny][nx]<99)continue;d[ny][nx]=d[y][x]+1;q.push([nx,ny]);}}return d;}
// スキルを選べるマス（shape:'line'は縦横の直線のみ）
function skt(a,px,py){const sk=a.skill,r=[];for(let y=0;y<=CY;y++)for(let x=0;x<W;x++){const d=Math.abs(x-px)+Math.abs(y-py);if(d>=1&&d<=sk.range&&(sk.shape!='line'||x==px||y==py))r.push({x,y});}return r;}
// 技の処理：shape（single／cross／area／line／chain）ごとに当たる敵を集めて、1体ずつダメージ計算する
function skill(a,t){
 const sk=a.skill,sh=sk.shape||'single';a.sp-=sk.cost;faceTo(a,t);const d=man(a,t);
 if(d<1||d>sk.range||(sh=='line'&&t.x!=a.x&&t.y!=a.y))return lg('スキルは空振り');
 lg(a.nm+'の'+sk.name+'！');
 let hits=[];
 if(sh=='single'){const e=eAt(t.x,t.y);if(e)hits=[e];}
 else if(sh=='cross'){for(const[dx,dy]of[[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const e=eAt(t.x+dx,t.y+dy);if(e)hits.push(e);}}
 else if(sh=='area'){for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const e=eAt(t.x+dx,t.y+dy);if(e)hits.push(e);}}
 else if(sh=='line'){const dx=Math.sign(t.x-a.x),dy=Math.sign(t.y-a.y);
  for(let i=1;i<=sk.range;i++){const cx=a.x+dx*i,cy=a.y+dy*i;if(cx<0||cy<0||cx>=W||cy>CY||blk(cx,cy))break;const e=eAt(cx,cy);if(e)hits.push(e);}}
 else if(sh=='chain'){const f=eAt(t.x,t.y);
  if(f){hits=[f];let cur=f;while(hits.length<(sk.chain||3)){const nx=E.filter(e=>!hits.includes(e)&&man(e,cur)<=2).sort((p,q)=>man(p,cur)-man(q,cur))[0];if(!nx)break;hits.push(nx);cur=nx;}}}
 if(!hits.length)lg('（当たった敵はいない）');
 for(const e of hits)if(!over)hitEnemy(a,e,sk);
}
// テスト砲：マップ全体が射程（動作確認用）
function tst(a){const r=[];for(let y=0;y<=CY;y++)for(let x=0;x<W;x++)r.push({x,y});return r;}
function testShot(a,t){
 const ds=DATA.debugShot;faceTo(a,t);lg(a.nm+'の'+ds.name+'！');
 const e=eAt(t.x,t.y);if(e)dmg(e,ds.dmg,ds.name);else lg('空振り');
}
async function run(){
 if(busy||over)return;busy=1;sel=null;
 const au=new Set(F.filter(f=>!ctl(f)));
 for(const a of[...[...U].sort((p,q)=>agiOf(q)-agiOf(p)),...[...F].sort((p,q)=>agiOf(q)-agiOf(p))]){
  if(over)break;if(!alive(a))continue;
  if(au.has(a))auto(a);
  else{const p=plan.get(a);if(p){mv(a,p.path);if(p.tk)testShot(a,p.t);else if(p.sk&&a.sp>=cost(a))skill(a,p.t);else atk(a,p.t);}}
  draw();await sl(300);
 }
 for(const b of[...B]){if(over)break;if(!B.includes(b))continue;let did=0;
  const act=DATA.buildingTypes[b.k].act;
  if(act&&act.type=='shoot'){b.g=(b.g||0)+(act.speed||1);
   if(b.g>=1){b.g-=1;const e=E.filter(e=>man(b,e)<=act.range).sort((p,q)=>man(b,p)-man(b,q))[0];
    if(e){const hs=[[0,0],[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>eAt(e.x+dx,e.y+dy)).filter(Boolean);
     for(const h of hs)if(!over)dmg(h,calcDmg(act.atk,act.power,defOf(h)),b.k);did=1;}}}
  else if(act&&act.type=='repair'){
   for(const u of U)if(man(b,u)<=act.range&&u.hp<u.mh){u.hp=Math.min(u.mh,u.hp+act.heal);did=1;}
   for(const f of F)if(man(b,f)<=act.range&&f.n<R.fragMax){f.n=Math.min(R.fragMax,f.n+act.fragAdd);did=1;}
   if(did)lg(b.k+'が味方を回復');}
  if(did){draw();await sl(300);}}
 for(const e of[...E].sort((p,q)=>agiOf(q)-agiOf(p))){
  if(over)break;if(!E.includes(e))continue;
  eAct(e);draw();await sl(300);
 }
 if(!over){   // ターン終了時：継続ダメージと、弱体の残りターンを進める
  for(const e of[...E]){
   if(e.dot){dmg(e,e.dot.v,'継続ダメージ');if(!E.includes(e))continue;if(--e.dot.t<=0)e.dot=null;}
   e.buf=(e.buf||[]).map(b=>({...b,t:b.t-1})).filter(b=>b.t>0);
  }
 }
 if(!over){
  const t=turn,w=DATA.waves;
  if(t<w.bossTurn)spawn(w.perTurn);
  else if(t==w.bossTurn){spawn(w.normalAtBoss);E.push(mkEnemy('ボス',1));lg('ボスが出現！');}
  turn++;U.forEach(u=>u.sp=Math.min(u.spMax,u.sp+(u.spRegen||R.spRegen)));plan=new Map();mode='m';lg('--ターン'+turn+'--');
 }
 busy=0;draw();
 if(over)endBattle();
}

// ===== 1日の流れ（セーブデータ SV に全部まとめる。座標は rel 基準）=====
let SV;
function zeroMem(){return Object.fromEntries(DATA.units.map(u=>[u.nm,0]));}   // ユニットごとの記憶の数（0で初期化）
function newSave(){return{day:1,slot:0,step:'ev',city:R.cityHp,pt:DATA.day.startPt,pend:null,star:0,mp:0,mem:zeroMem(),draft:{res:0,mp:0,mem:zeroMem()},B:DATA.buildings.map(b=>({k:b.k,hp:b.hp,mh:b.hp,x:b.x,y:b.y})),msg:''};}
// 行動の効果を適用して、結果の文章を返す
function applyCmd(c){
 let t=c.text;
 if(c.fx){SV.city=Math.min(R.cityHp,SV.city+c.fx.city);SV.B.forEach(b=>b.hp=Math.min(b.mh,b.hp+c.fx.bld));t+='（街HP'+SV.city+'）';}
 return t;
}
// バトル結果をセーブデータへ書き戻す（街HPと生き残った防衛機関を持ち越す）
function saveBattle(){SV.star+=DATA.day.starPerNight;SV.city=Math.max(city,0);SV.B=B.map(b=>({k:b.k,hp:b.hp,mh:b.mh,x:b.x-OX,y:b.y-OY}));}
// いまの場面の表示内容を返す（描き方は main.js）
function dayView(){
 const D=DATA.day,sl=D.slots[SV.slot],hd=SV.day+'日目 '+sl,go=(step,f)=>()=>{SV.step=step;if(f)f();};
 const st=hd+'　街'+SV.city+'　防衛機関'+SV.B.length+'基　ポイント'+SV.pt+'　魔力'+SV.mp+'　星屑'+SV.star;
 switch(SV.step){
 case 'ev':return{st,title:hd,text:D.slotEvents[SV.slot],btns:[{l:'次へ',f:go('sel')}]};
 case 'sel':return{st,title:hd+'：行動を選ぶ',text:'どこへ向かう？',
  btns:[...D.commands.map(c=>({l:c.nm,f:()=>{SV.msg=applyCmd(c);SV.step='act';}})),{l:'防衛準備',f:go('prep')}]};
 case 'prep':{const T=DATA.buildingTypes;
  return{st,title:'防衛準備：種類を選ぶ',text:SV.msg||'建てる防衛機関を選んでください（行動は消費しない）',
  btns:[...Object.keys(T).map(k=>({l:k+'（'+bcost(k)+'pt）',off:SV.pt<bcost(k)||!freeSlots().length,f:()=>{SV.pend=k;SV.msg='';SV.step='prep2';}})),
  {l:'戻る',f:()=>{SV.msg='';SV.step='sel';}}]};}
 case 'prep2':return{st,title:'防衛準備：'+SV.pend+'を建てる場所',text:'設立できる場所を選んでください',
  btns:[...freeSlots().map(([x,y])=>({l:'区画('+x+','+y+')',f:()=>buildAt(SV.pend,x,y)})),{l:'戻る',f:go('prep')}]};
 case 'act':return{st,title:hd,text:SV.msg,btns:[{l:'次へ',f:()=>{
  if(SV.slot<D.slots.length-1){SV.slot++;SV.step='ev';}else SV.step='night';}}]};
 case 'night':return{st,title:SV.day+'日目 夜',text:'敵が近づいてくる…',btns:[{l:'防衛バトル開始',f:startBattle}]};
 case 'clear':return{st,title:SV.day+'日目 終了',text:'夜を守り抜いた。星屑を'+DATA.day.starPerNight+'手に入れた。街HP'+SV.city+'、防衛機関'+SV.B.length+'基。',
  btns:[{l:'星屑を振り分ける',f:go('dist',()=>{SV.draft={res:0,mp:0,mem:zeroMem()};})}]};
 case 'dist':{const b=distBuckets(),rem=distRemain();
  return{st,title:'星屑の振り分け',text:'星屑'+SV.star+'（未振り分け'+rem+'）。資源→防衛機関のポイント、魔力→ユニット強化、記憶→ユニットのストーリー。残りは持ち越せます。',
  rows:b.map(x=>({label:x.l+'　計'+x.total(),val:x.get(),minus:()=>{if(x.get()>0)x.add(-1);},plus:()=>{if(distRemain()>0)x.add(1);},minusOff:x.get()<=0,plusOff:rem<=0})),
  btns:[{l:'確定',f:distConfirm}]};}
 case 'lose':return{st,title:'ゲームオーバー',text:'街を守れなかった…',btns:[{l:'最初から',f:newGame}]};
 default:return{st,title:'試作ここまで',text:D.days+'日間を守り切った！',btns:[{l:'最初から',f:newGame}]};
 }
}

// 設立できる場所のうち、まだ空いている所
function freeSlots(){return DATA.buildSlots.filter(([x,y])=>!SV.B.some(b=>b.x==x&&b.y==y));}
// 防衛機関を設立する（ポイントを使って、セーブデータの防衛機関リストに追加）
function buildAt(k,x,y){const t=DATA.buildingTypes[k];SV.pt-=bcost(k);SV.B.push({k,hp:t.hp,mh:t.hp,x,y});SV.msg=k+'を('+x+','+y+')に設立した。';SV.pend=null;SV.step='prep';}

// ===== セーブ・ロード =====
// 保存先は Store にまとめてある。あとで別の保存先（ファイル書き出し等）にするときは、ここだけ差し替えればOK
const Store={
 key:'stardust-garden-save',
 save(o){try{localStorage.setItem(this.key,JSON.stringify(o));}catch(e){}},   // 保存できない環境でもゲームは止めない
 load(){try{return JSON.parse(localStorage.getItem(this.key));}catch(e){return null;}},
 clear(){try{localStorage.removeItem(this.key);}catch(e){}}
};
const SAVE_VER=2;   // セーブデータの形を変えたら上げる（古いデータを見分ける番号）
function saveGame(){Store.save({ver:SAVE_VER,sv:SV});}
// 読み込む。壊れている・古い・無いときは null を返す
function loadGame(){
 const o=Store.load();
 if(!o||o.ver!==SAVE_VER||!o.sv)return null;
 const s={...newSave(),...o.sv};   // あとで項目を増やしても、足りない分は初期値で補う
 if(!Array.isArray(s.B)||!['ev','sel','prep','prep2','act','night','clear','dist','lose','end'].includes(s.step))return null;
 s.mem={...zeroMem(),...s.mem};s.draft={res:0,mp:0,...s.draft,mem:{...zeroMem(),...(s.draft&&s.draft.mem)}};
 s.B=s.B.filter(b=>DATA.buildingTypes[b.k]);   // 種類が消えた防衛機関は除く
 if(s.step=='prep2'){s.step='prep';s.pend=null;}   // 場所選びの途中は、種類選びに戻す
 return s;
}

// ===== 星屑の振り分け =====
// 振り分け先の一覧：資源・魔力と、ユニットごとの記憶（誰に渡すかを選べる）
function distBuckets(){
 const D=SV.draft;
 return[
  {l:'資源（防衛機関）',get:()=>D.res,add:n=>{D.res+=n;},total:()=>SV.pt+'pt'},
  {l:'魔力（ユニット強化）',get:()=>D.mp,add:n=>{D.mp+=n;},total:()=>SV.mp},
  ...DATA.units.map(u=>({l:'記憶：'+u.nm,get:()=>D.mem[u.nm]||0,add:n=>{D.mem[u.nm]=(D.mem[u.nm]||0)+n;},total:()=>SV.mem[u.nm]||0}))
 ];
}
function distRemain(){const D=SV.draft;return SV.star-D.res-D.mp-Object.values(D.mem).reduce((a,b)=>a+b,0);}
// 確定：振り分けを実際の持ち物に反映して、翌朝（または終了）へ
function distConfirm(){
 const D=SV.draft,rem=distRemain();
 SV.pt+=D.res;SV.mp+=D.mp;for(const k in D.mem)SV.mem[k]=(SV.mem[k]||0)+D.mem[k];
 SV.star=rem;SV.draft={res:0,mp:0,mem:zeroMem()};
 if(SV.day>=DATA.day.days)SV.step='end';else{SV.day++;SV.slot=0;SV.step='ev';SV.pt+=DATA.day.dayPt;}
}

// ===== 技の切り替え（試作用）：ユニットを選んだ状態で、キーボードの 1・2・3 を押すと技が変わる =====
if(typeof document!=='undefined')document.addEventListener('keydown',ev=>{
 const i=parseInt(ev.key)-1;
 if(!(sel&&sel.type=='U'&&sel.skills&&sel.skills[i]))return;
 sel.skill=sel.skills[i];sel.skillIdx=i;lg(sel.nm+'の技を「'+sel.skill.name+'」（SP'+sel.skill.cost+'）に切り替え');draw();
});
