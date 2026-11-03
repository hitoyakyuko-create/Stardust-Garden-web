// STARDUST GARDEN ゲームデータ（数値・名前・色はここだけ書き換えればOK）
// 座標 x,y は「12×12試作マップ」基準（rel）。abs は20×18マップ上の絶対座標。
const DATA={
rules:{
 mapW:20,mapH:18,      // マップの大きさ（マス）
 viewW:12,viewH:12,    // 画面に映る範囲（マス）
 protoSize:12,         // 試作マップの大きさ（rel座標の基準）
 cityHp:1600,          // 街のHP（ユニット4人ぶんくらい）
 cityDef:40,           // 街の防御力（敵の攻撃力に対して使う）
 moveRange:2,          // 1ターンの移動量（ユニット個別の move があればそちらを優先）
 controlRange:3,       // フラグメントへ指示できる距離（ユニットから）
 spInit:50,spMax:50,spRegen:6,  // spMax＝表示用の最大値／spRegen＝毎ターンの回復量（ユニットごとに spMax・spRegen を持たせてもOK）
 fragMax:5,            // フラグメントの最大体数
 elem:{weak:1.5,resist:0.7}     // 弱点・抵抗のダメージ倍率
},
// ユニット：LIFE→hp、ATK→atk、DEF→def、AGI→agi（行動順）、atkMul/defMul＝種別（物理・魔力・工学）ごとの倍率
// range＝通常攻撃の射程。skills＝技の一覧（先頭が最初に使う技。バトル中に選択したユニットで数字キー1〜3で切り替え）
// 技：power＝威力、elem＝属性（無＝属性なし／auto＝敵の弱点属性を自動で選ぶ）、kind＝種別、cost＝消費SP、range＝射程、
//     shape＝範囲（single＝単体／cross＝着弾点と上下左右／area＝着弾点を中心に3×3／line＝縦横の直線(射程ぶん全部)／chain＝近くの敵へ連鎖）
//     ignore＝DEFを無視する割合、fx＝追加効果（def＝DEF増減の割合、agi＝AGI増減の割合、dot＝継続ダメージの威力、t＝続くターン数）
units:[
 {nm:'キュリー',n:'キ',hp:400,spMax:50,atk:40,def:40,agi:40,atkMul:{魔力:1.5},defMul:{魔力:1.5},range:3,x:5,y:8,sprite:'unit_curie_normal_idle',
  skills:[
   {name:'星屑の矢',elem:'星光',kind:'魔力',power:270,cost:10,range:4,shape:'single'},
   {name:'星降り',elem:'星光',kind:'魔力',power:160,cost:18,range:3,shape:'cross'},
   {name:'属性の灯',elem:'auto',kind:'魔力',power:210,cost:10,range:3,shape:'single'}]},
 {nm:'カーティス',n:'カ',hp:500,spMax:40,atk:40,def:40,agi:40,atkMul:{工学:1.5},defMul:{魔力:1.2,工学:1.3},range:3,x:6,y:7,
  skills:[
   {name:'電撃砲',elem:'電気',kind:'工学',power:270,cost:10,range:4,shape:'single'},
   {name:'連鎖電撃',elem:'電気',kind:'工学',power:150,cost:18,range:3,shape:'chain',chain:3},
   {name:'真空孔',elem:'真空',kind:'工学',power:220,cost:14,range:3,shape:'single',ignore:0.3}]},
 {nm:'エルジー',n:'エ',hp:400,spMax:40,atk:30,def:40,agi:45,atkMul:{魔力:1.2,物理:1.3},defMul:{魔力:1.2,物理:1.3},range:1,x:6,y:8,
  skills:[
   {name:'重撃',elem:'圧壊',kind:'物理',power:210,cost:10,range:1,shape:'single',fx:{def:-0.1,t:2}},
   {name:'薙ぎ払い',elem:'斬切',kind:'物理',power:150,cost:15,range:3,shape:'line'},
   {name:'熱撃',elem:'炎熱',kind:'魔力',power:190,cost:12,range:2,shape:'single'}]},
 {nm:'シルヴェスター',n:'シ',hp:450,spMax:45,atk:40,def:35,agi:35,atkMul:{物理:1.5},defMul:{物理:1.5},range:4,x:7,y:8,
  skills:[
   {name:'精密射撃',elem:'無',kind:'物理',power:210,cost:8,range:5,shape:'single'},
   {name:'氷結弾',elem:'凍結',kind:'物理',power:220,cost:12,range:4,shape:'single',fx:{agi:-0.2,t:2}}]},
 {nm:'シャノン',n:'ノ',hp:300,spMax:50,atk:40,def:35,agi:40,atkMul:{魔力:1.5},defMul:{魔力:1.3,工学:1.2},range:3,x:5,y:7,
  skills:[
   {name:'響く波',elem:'波動',kind:'魔力',power:240,cost:10,range:4,shape:'single'},
   {name:'広がる波紋',elem:'波動',kind:'魔力',power:140,cost:18,range:3,shape:'area'},
   {name:'電気の針',elem:'電気',kind:'魔力',power:200,cost:12,range:4,shape:'single'}]},
 {nm:'ジラルド',n:'ジ',hp:350,spMax:45,atk:35,def:40,agi:40,atkMul:{魔力:1.5},defMul:{物理:1.3,魔力:1.2},range:2,x:7,y:7,
  skills:[
   {name:'炎の弾',elem:'炎熱',kind:'魔力',power:240,cost:10,range:3,shape:'single',fx:{dot:30,t:2}},
   {name:'圧砕',elem:'圧壊',kind:'魔力',power:200,cost:12,range:2,shape:'single',fx:{def:-0.1,t:2}},
   {name:'交差斬',elem:'斬切',kind:'魔力',power:150,cost:16,range:3,shape:'line'}]}
],
// 出撃メンバー：[初日, 2日目以降]
party:[['キュリー','エルジー','シルヴェスター'],['キュリー','エルジー','シルヴェスター','シャノン']],
// フラグメント：n＝個体数（体力兼攻撃回数）、fat＝1体あたりの攻撃力、fdf＝防御力、ind＝1体が耐えられるダメージ
fragments:[{nm:'F1',n:5,fat:10,fdf:20,ind:25,agi:30,x:4,y:9},{nm:'F2',n:5,fat:10,fdf:20,ind:25,agi:30,x:7,y:9}],
// 地形：v=1 障害物、v=2 空洞
terrain:[
 {v:1,rel:[[3,4],[4,4],[8,5],[9,5],[6,3],[2,2],[10,7]]},
 {v:1,abs:[[3,3],[4,3],[15,4],[16,4],[9,6],[10,6],[7,9],[12,10]]},
 {v:2,img:'tile_hollow_void',abs:[[8,2],[9,2],[14,8],[2,8]]},
 {v:2,img:'tile_hollow_pond',rel:[[5,6],[6,6],[1,6],[9,8]]}
],
// 防衛機関の配置（最初は無し。防衛準備で星屑の「資源」から設立する）
buildings:[],
// 防衛機関の種類ごとの色と自動行動（act）
buildingTypes:{
 // cost＝設立に使う仮ポイント（配列なら「1基目,2基目,3基目以降」の順に高くなる）、hp＝設立時のHP
 // 砲台の act：atk＝攻撃力、power＝威力、range＝射程、speed＝1ターンに行動する割合（0.7＝やや控えめ）、着弾点と上下左右に当たる
 '砲台':{color:'#e08a20',cost:[30,40,55],hp:300,act:{type:'shoot',range:6,atk:50,power:200,speed:0.7}},
 '防壁':{color:'#9a7b4f',cost:[20],hp:600},
 '修理所':{color:'#30c080',cost:[25],hp:300,act:{type:'repair',range:2,heal:40,fragAdd:1}}
},
// 防衛機関を設立できる場所（rel座標）。ここに空きがあるときだけ建てられる
buildSlots:[[2,9],[5,9],[9,9],[2,10],[3,10],[5,10],[6,10],[8,10]],
// 動作確認用のテスト砲：unitで指定したユニットが、マップ上の好きなマスに dmg ダメージを与えられる（この1行を消せばボタンも無くなる）
debugShot:{unit:'キュリー',name:'テスト砲',dmg:300},
// 1日の流れ：朝・昼・夕に行動を1回ずつ選び、夜に防衛バトル
day:{
 days:3,
 startPt:66,dayPt:0,starPerNight:200,   // startPt＝最初の仮ポイント／dayPt＝毎朝の自動加算（星屑の「資源」に置き換えたので0）／starPerNight＝夜を越えるともらえる星屑（仮）
 slots:['朝','昼','夕'],              // 時間帯
 slotEvents:['朝の光が町に差し込む。','昼の星屑が静かに降っている。','夕暮れ。今夜も敵が来そうだ。'],
 // A〜Hの仮コマンド（fx＝選んだときの効果。無ければ文章を出すだけ）
 commands:[
  {id:'A',nm:'A（仮）',text:'Aを選んだ。'},{id:'B',nm:'B（仮）',text:'Bを選んだ。'},
  {id:'C',nm:'C（仮）',text:'Cを選んだ。'},{id:'D',nm:'D（仮）',text:'Dを選んだ。'},
  {id:'E',nm:'E（仮）',text:'Eを選んだ。'},{id:'F',nm:'F（仮）',text:'Fを選んだ。'},
  {id:'G',nm:'G（仮）',text:'Gを選んだ。'},
  {id:'H',nm:'H（修復・仮）',text:'町を修復した。',fx:{city:150,bld:60}}   // 街HP+3、防衛機関HP+2
 ]
},
// 敵：life＝体力、atk＝攻撃力、def＝防御力、agi＝行動順、kind＝攻撃の種別、move＝1ターンの移動量
// variant:1 の敵は、下の variants（赤・水・紫）のどれかの弱点・抵抗をランダムに持つ
enemy:{
 types:{
  '雑魚':{life:60,atk:25,def:20,agi:45,kind:'物理',move:2,variant:1},
  '標準':{life:120,atk:30,def:30,agi:40,kind:'物理',move:2,variant:1},
  '砲撃':{life:90,atk:55,def:15,agi:35,kind:'魔力',move:2,variant:1},
  '突撃':{life:80,atk:35,def:20,agi:50,kind:'物理',move:3,weak:['凍結'],resist:['電気']},
  '装甲':{life:240,atk:30,def:60,agi:30,kind:'工学',move:2,weak:['真空'],resist:['電気']},
  '精鋭':{life:350,atk:50,def:60,agi:40,kind:'魔力',move:2,weak:['圧壊','斬切'],resist:['炎熱','凍結','電気']},
  'ボス':{life:1200,atk:70,def:80,agi:45,kind:'魔力',move:2,weak:['真空','圧壊'],resist:['炎熱','凍結','電気']}
 },
 variants:[{c:'赤',weak:'炎熱',resist:'電気'},{c:'水',weak:'凍結',resist:'炎熱'},{c:'紫',weak:'電気',resist:'凍結'}],
 grow:0.1,                                              // 1日進むごとの体力・攻撃力・防御力の上がり方（+10%）
 mix:[['雑魚',4],['標準',4],['砲撃',2],['突撃',2],['装甲',1]],   // 出現する敵の種類と割合
 mixLate:[['精鋭',1]]                                    // 2日目以降に加わる敵
},
waves:{initial:5,perTurn:5,bossTurn:3,normalAtBoss:3},
// 見た目の設定
gfx:{
 canvasW:528,canvasH:396,
 tileW:96,tileH:48,   // 菱形マス1つの大きさ（画像素材の基準）
 cell:44,             // 内部計算用のマスの大きさ
 colors:{bg:'#14143a',gridLine:'#2a2a60',tileA:'#23235a',tileB:'#1b1b44',
  obstacle:'#6a6a85',hole:'#03030c',cityBar:'#8a6d1f',
  unit:'#3ad0ff',fragOn:'#7dff7d',fragOff:'#8a9a8a',enemy:'#d03030',boss:'#a020c0',
  move:'#3a6cff77',attack:'#ff3a3a77',skill:'#c03aff77',plan:'#ffe14a',select:'#fff',
  textDark:'#001',textLight:'#fff'},
 mini:{scale:4,obstacle:'#889',hole:'#000',building:'#e0a030',enemy:'#ff4040',fragment:'#7dff7d',unit:'#3ad0ff'},
 // ユニット画像：scale＝マス幅に対する表示倍率、feet＝画像下端から足元までのpx、drop＝画像を下へずらす量（大きいほど低く立つ）、shadow＝足元の影の色
 sprite:{scale:1.4,feet:4,drop:6,shadow:'rgba(150,170,255,0.30)'},
 // 地形画像：通常タイル、岩（隣り合う障害物は自動で2マス・4マスの岩にまとまる）
 tiles:{a:'tile_normal_a',b:'tile_normal_b'},
 rocks:{single:['obj_rock_a','obj_rock_b','obj_rock_c'],x:'obj_rock2_x',y:'obj_rock2_y',block:'obj_rock4_a'},
 ghostAlpha:0.55   // 岩の後ろに隠れた部分の半透明の濃さ（0で無効）
}
};
DATA.units.forEach(u=>u.skill=u.skills[0]);   // 先頭の技を初期の技にする
