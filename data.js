// STARDUST GARDEN ゲームデータ（数値・名前・色はここだけ書き換えればOK）
// 座標 x,y は「12×12試作マップ」基準（rel）。abs は20×18マップ上の絶対座標。
const DATA={
rules:{
 mapW:20,mapH:18,      // マップの大きさ（マス）
 viewW:12,viewH:12,    // 画面に映る範囲（マス）
 protoSize:12,         // 試作マップの大きさ（rel座標の基準）
 cityHp:15,            // 街のHP
 moveRange:2,          // 1ターンの移動量（味方・敵共通）
 controlRange:3,       // フラグメントへ指示できる距離（ユニットから）
 spInit:5,spMax:5,spRegen:1,  // スキルポイント
 fragMax:5             // フラグメントの最大体数
},
// ユニット：range=通常攻撃の届く距離、skill=スキル設定
units:[
 {nm:'キュリー',n:'キ',hp:8,atk:2,range:3,x:5,y:8,sprite:'unit_curie_normal_idle',
  skill:{name:'星屑の流星',type:'burst',cost:3,range:3,dmg:3,who:'流星'}},
 {nm:'A',n:'A',hp:10,atk:3,range:1,x:6,y:8,
  skill:{name:'突撃',type:'charge',cost:2,range:3,dmg:4,shape:'line',who:'突撃'}}
],
fragments:[{nm:'F1',n:5,x:4,y:9},{nm:'F2',n:5,x:7,y:9}],
// 地形：v=1 障害物、v=2 空洞
terrain:[
 {v:1,rel:[[3,4],[4,4],[8,5],[9,5],[6,3],[2,2],[10,7]]},
 {v:1,abs:[[3,3],[4,3],[15,4],[16,4],[9,6],[10,6],[7,9],[12,10]]},
 {v:2,img:'tile_hollow_void',abs:[[8,2],[9,2],[14,8],[2,8]]},
 {v:2,img:'tile_hollow_pond',rel:[[5,6],[6,6],[1,6],[9,8]]}
],
// 防衛機関の配置
buildings:[
 {k:'砲台',hp:5,x:3,y:9},{k:'砲台',hp:5,x:8,y:9},
 {k:'防壁',hp:8,x:4,y:10},{k:'防壁',hp:8,x:7,y:10},
 {k:'修理所',hp:4,x:6,y:9}
],
// 防衛機関の種類ごとの色と自動行動（act）
buildingTypes:{
 // cost＝設立に使う仮ポイント、hp＝設立時のHP（種類は今後増える予定）
 '砲台':{color:'#e08a20',cost:5,hp:5,act:{type:'shoot',range:3,dmg:2}},
 '防壁':{color:'#9a7b4f',cost:3,hp:8},
 '修理所':{color:'#30c080',cost:4,hp:4,act:{type:'repair',range:2,heal:1,fragAdd:1}}
},
// 防衛機関を設立できる場所（rel座標）。ここに空きがあるときだけ建てられる
buildSlots:[[2,9],[5,9],[9,9],[2,10],[3,10],[5,10],[6,10],[8,10]],
// 動作確認用のテスト砲：unitで指定したユニットが、マップ上の好きなマスに dmg ダメージを与えられる（この1行を消せばボタンも無くなる）
debugShot:{unit:'キュリー',name:'テスト砲',dmg:10},
// 1日の流れ：朝・昼・夕に行動を1回ずつ選び、夜に防衛バトル
day:{
 days:3,
 startPt:10,dayPt:0,starPerNight:10,   // startPt＝最初の仮ポイント／dayPt＝毎朝の自動加算（星屑の「資源」に置き換えたので0）／starPerNight＝夜を越えるともらえる星屑（仮）
 slots:['朝','昼','夕'],              // 時間帯
 slotEvents:['朝の光が町に差し込む。','昼の星屑が静かに降っている。','夕暮れ。今夜も敵が来そうだ。'],
 // A〜Hの仮コマンド（fx＝選んだときの効果。無ければ文章を出すだけ）
 commands:[
  {id:'A',nm:'A（仮）',text:'Aを選んだ。'},{id:'B',nm:'B（仮）',text:'Bを選んだ。'},
  {id:'C',nm:'C（仮）',text:'Cを選んだ。'},{id:'D',nm:'D（仮）',text:'Dを選んだ。'},
  {id:'E',nm:'E（仮）',text:'Eを選んだ。'},{id:'F',nm:'F（仮）',text:'Fを選んだ。'},
  {id:'G',nm:'G（仮）',text:'Gを選んだ。'},
  {id:'H',nm:'H（修復・仮）',text:'町を修復した。',fx:{city:3,bld:2}}   // 街HP+3、防衛機関HP+2
 ]
},
enemy:{atk:3,hpQueue:[4,3,5,4,3,5,4,3,5]},  // hpQueue＝出現する敵のHPを順番に並べたもの
waves:{initial:2,perTurn:2,bossTurn:4,normalAtBoss:1,bossHp:10},
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
