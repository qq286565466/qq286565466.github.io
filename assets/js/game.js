"use strict";

const GAME_VERSION=window.GAME_META?.version;
if(!GAME_VERSION)throw new Error("缺少 assets/js/version.js，无法确定游戏版本");

const GAME_CONFIG=window.GAME_CONFIG;
if(!GAME_CONFIG)throw new Error("缺少 assets/js/config.js，无法读取基础对局配置");
const MATCH_RULES=GAME_CONFIG.match;

const SUITS = ["♠","♥","♣","♦"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const RANK_VALUE = Object.fromEntries(RANKS.map((r,i)=>[r,i+1]));

const SKILLS = [
  {
    id:"overload", name:"过载",
    desc:"<div class='sk-sum'>正常摸牌额外多摸1张</div><div class='sk-row'><span class='sk-k'>触发</span>每次正常摸牌阶段，额外摸 <b>1</b> 张。</div><div class='sk-row'><span class='sk-k'>范围</span>效果摸牌不受影响。</div><div class='sk-row'><span class='sk-k'>连锁</span>你的额外回合仍可由 <b>4</b> 张及以上牌型继续触发。</div>"
  },
  {
    id:"dice", name:"骰命",
    desc:"<div class='sk-sum'>正常回合开始掷 1D6 强制结算</div><div class='sk-row'><span class='sk-k'>1</span>自己摸 <b>1</b> 张。</div><div class='sk-row'><span class='sk-k'>2</span>选择2：看牌堆顶 <b>2</b> 张选 <b>1</b> 加入手牌，另一张洗回牌堆。</div><div class='sk-row'><span class='sk-k'>3</span>指定任意玩家摸 <b>1</b>；指定自己则改为选择2。</div><div class='sk-row'><span class='sk-k'>4</span>指定两名不同玩家各摸 <b>1</b>；含自己则自己那份改为选择2。</div><div class='sk-row'><span class='sk-k'>5</span>先弃 <b>2</b> 张；若因此清空手牌立即获胜，否则再选择3。</div><div class='sk-row'><span class='sk-k'>6</span>本正常回合结束后获得 <b>1</b> 个额外回合。</div><div class='sk-row'><span class='sk-k'>备注</span>骰命进张均属效果摸牌，不触发占卜。</div>"
  },
  {
    id:"trap", name:"截胡",
    desc:"<div class='sk-sum'>别人开额外回合时截胡摸牌</div><div class='sk-row'><span class='sk-k'>待机</span>场上其他玩家手牌 <b>&gt;4</b> 后进入待触发状态。</div><div class='sk-row'><span class='sk-k'>触发</span>之后第一个获得额外回合的其他玩家，先摸 <b>2</b> 张。</div><div class='sk-row'><span class='sk-k'>排除</span>不会被自己的额外回合触发。</div><div class='sk-row'><span class='sk-k'>处罚</span>结算时本人可分别选择：是否摸 <b>1</b>、是否弃 <b>1</b>。</div><div class='sk-row'><span class='sk-k'>冷却</span>随后进入 <b>5</b> 个场上回合冷却，再重新检测待触发条件。</div>"
  },
  {
    id:"resonance", name:"共振",
    desc:"<div class='sk-sum'>额外回合引发群体摸牌</div><div class='sk-row'><span class='sk-k'>他人</span>其他玩家每获得 <b>1</b> 个额外回合，你必须摸 <b>1</b> 张。</div><div class='sk-row'><span class='sk-k'>自己</span>你每获得 <b>1</b> 个额外回合，其他所有玩家各摸 <b>1</b> 张，随后你可弃 <b>1</b> 张。</div><div class='sk-row'><span class='sk-k'>结算</span>每个额外回合分别结算一次。</div>"
  },
  {
    id:"divine", name:"占卜",
    desc:"<div class='sk-sum'>窥探牌堆与他人暗牌</div><div class='sk-row'><span class='sk-k'>占卜4</span>正常摸牌阶段第一张改为：看牌堆顶 <b>4</b> 张选 <b>1</b> 加入手牌。</div><div class='sk-row'><span class='sk-k'>顺序</span>剩余牌保持原序不可调，至多可将 <b>1</b> 张置底。</div><div class='sk-row'><span class='sk-k'>限制</span>额外回合、处罚、技能等效果摸牌均不触发占卜。</div><div class='sk-row'><span class='sk-k'>情报</span>每个自己的正常回合结束时，秘密查看其他每名玩家随机 <b>1</b> 张暗牌；情报保留至该牌离手。</div><div class='sk-row'><span class='sk-k'>明牌</span>所有已公开/明牌自动加入情报区，以金色显示。</div>"
  },
  {
    id:"reveal", name:"明牌",
    desc:"<div class='sk-sum'>亮一张牌令他人摸牌</div><div class='sk-row'><span class='sk-k'>频次</span>每个自己的正常回合限 <b>1</b> 次。</div><div class='sk-row'><span class='sk-k'>效果</span>出牌阶段可公开手中 <b>1</b> 张未公开牌，指定任意玩家（含自己）摸 <b>1</b> 张。</div><div class='sk-row'><span class='sk-k'>持续</span>公开牌保持明置直到离手。</div>"
  },
  {
    id:"charge", name:"充能",
    desc:"<div class='sk-sum'>同点数进张积攒能量</div><div class='sk-row'><span class='sk-k'>充能</span>每次获得牌时立即判断：若获得前手牌已存在同点数牌，则 <b>+1</b> 能量。</div><div class='sk-row'><span class='sk-k'>来源</span>正常摸牌、场地、处罚、他人/自己技能均适用，按获得顺序逐张结算。</div><div class='sk-row'><span class='sk-k'>2点</span>正常摸牌时可额外摸 <b>1</b>。</div><div class='sk-row'><span class='sk-k'>4点</span>额外回合可继续触发。</div><div class='sk-row'><span class='sk-k'>6点</span>可出对子。</div><div class='sk-row'><span class='sk-k'>8点</span>立即获得额外回合，该回合结束后 <b>-4</b> 能量。</div>"
  },
  {
    id:"artisan", name:"牌匠",
    desc:"<div class='sk-sum'>操控摸牌与牌型联动</div><div class='sk-row'><span class='sk-k'>摸牌</span>正常摸牌时可将刚摸到的牌置底并重摸 <b>1</b> 次。</div><div class='sk-row'><span class='sk-k'>三带一</span>指定 <b>1</b> 人摸 <b>1</b>。</div><div class='sk-row'><span class='sk-k'>葫芦</span>指定 <b>2</b> 人各摸 <b>1</b>。</div><div class='sk-row'><span class='sk-k'>顺子</span>其他人各摸 <b>1</b>。</div><div class='sk-row'><span class='sk-k'>连对</span>额外再获 <b>1</b> 个额外回合。</div><div class='sk-row'><span class='sk-k'>四条</span>指定 <b>1</b> 人下个正常回合跳过出牌阶段。</div>"
  },
  {
    id:"barrier", name:"结界",
    desc:"<div class='sk-sum'>布置一种持续3次触发的结界</div><div class='sk-row'><span class='sk-k'>施放</span>仅可在自己的<b>正常回合</b>出牌阶段施放。结界不会在施放当回合触发，而从自己的<b>下一个正常回合</b>开始连续触发3次。</div><div class='sk-row'><span class='sk-k'>丰饶结界</span>每次触发，本次正常摸牌额外摸 <b>1</b> 张。</div><div class='sk-row'><span class='sk-k'>蚀流结界</span>施放时指定1名其他玩家；每次触发，该目标<b>效果摸1张</b>。</div><div class='sk-row'><span class='sk-k'>轮转结界</span>每次触发，本回合正常摸牌结束后，可将刚摸到的最后1张牌置底并重摸1张。</div><div class='sk-row'><span class='sk-k'>倒计时</span>结界初始倒计时 <b>3</b>；每次效果真正触发后 -1，降至0后结界消失。</div><div class='sk-row'><span class='sk-k'>冷却</span>施放后进入 <b>4个自己的正常回合</b>冷却。3次结界触发结束后，还会完整跨过1个不能施放技能的正常回合；再下一个自己的正常回合才可重新布置结界。</div><div class='sk-row'><span class='sk-k'>边界</span>额外回合不会触发结界、不会推进结界倒计时，也不会推进技能冷却。</div>"
  },
  {
    id:"pollution", name:"污染",
    desc:"<div class='sk-sum'>持续侵蚀对手的终结路线</div><div class='sk-row'><span class='sk-k'>投放</span>自己的<b>正常回合</b>打出单牌后，若自己尚未清空手牌，可选择1名其他玩家。若其没有污染牌：随机将其手中 <b>1</b> 张牌标记为污染。</div><div class='sk-row'><span class='sk-k'>引爆</span>若目标已经持有污染牌，则不新增第二张污染；改为令其<b>效果摸1张</b>，随后解除其当前污染。你可以在持续压制与立即进攻之间选择。</div><div class='sk-row'><span class='sk-k'>侵蚀</span>若一个<b>4张及以上</b>的合法牌型中包含污染牌，该牌型本应产生的<b>基础额外回合</b>被取消。</div><div class='sk-row'><span class='sk-k'>扩散</span>污染牌若作为<b>非单牌组合</b>被打出，且持有者仍有手牌，污染会随机转移到其剩余 <b>1</b> 张手牌；只有把污染牌作为<b>单牌</b>打出才能稳定净化。</div><div class='sk-row'><span class='sk-k'>上限</span>每名玩家同时最多持有 <b>1</b> 张污染牌；具体牌面只有持有者自己知道。</div><div class='sk-row'><span class='sk-k'>边界</span>污染只取消牌型自带的基础额外回合，不取消骰命、加时赛、牌匠连对等其他来源；若一手牌已经直接清空全部手牌，仍然正常获胜。</div>"
  }
];

const FIELDS = [
  {id:"drawplus", name:"丰收", dur:2, desc:"接下来2轮，所有玩家正常摸牌数+1。"},
  {id:"nosingle", name:"封口", dur:2, desc:"接下来2轮，所有玩家禁止出单牌。"},
  {id:"odd", name:"奇数通行", dur:2, desc:"接下来2轮，单牌只能打A/3/5/7/9/J/K。"},
  {id:"even", name:"偶数通行", dur:2, desc:"接下来2轮，单牌只能打2/4/6/8/10/Q。"},
  {id:"chain", name:"连锁失控", dur:3, desc:"接下来3轮，所有玩家的额外回合也可由4张及以上牌型继续触发。"},
  {id:"discard", name:"强制清仓", dur:2, desc:"接下来2轮，每个正常回合结束必须弃1张；若弃牌前仅剩1张，弃后立即摸1张。弃牌不能直接获胜。"},
  {id:"diceDraw", name:"骰子风暴", dur:2, desc:"接下来2轮，每个正常回合开始掷1D6，本回合基础摸牌数改为骰子点数。"},
  {id:"overtime", name:"加时赛", dur:1, desc:"接下来1轮，每名玩家结束自己的正常回合后，在该正常回合已产生的其他额外回合全部结算完毕后，再获得1个额外回合。本场地不改变额外回合的连锁规则：额外回合默认不能再由4张以上牌型触发新的额外回合；若玩家技能本身允许额外回合连锁，则这些额外回合均可正常连锁。"}
];

let G = null;
let selected = new Set();
let aiTimer = null;
const PLAYER_AVATAR="./assets/avatars/avatar-player-modern.webp";
const AI_FALLBACK_PROFILE=Object.freeze({style:"均衡应战",desc:"在资源、组合与压制之间保持平衡。",aggression:0.75,combo:1,finish:1,control:1,resource:1,skill:1,variance:1,humanFocus:0});
const OPPONENTS=[
  {name:"福掌柜",avatar:"./assets/avatars/opponent-fuzhanggui-modern.webp",ai:{style:"稳健经营",desc:"优先保留成组资源，少做高波动冒险。",aggression:0.48,combo:1.12,finish:1.08,control:0.82,resource:1.30,skill:0.92,variance:0.55,humanFocus:0.00}},
  {name:"阿岚",avatar:"./assets/avatars/opponent-alan-modern.webp",ai:{style:"疾风快攻",desc:"更愿意主动出牌和追击短手玩家。",aggression:1.15,combo:0.94,finish:1.24,control:0.82,resource:0.78,skill:0.98,variance:0.95,humanFocus:0.08}},
  {name:"顾老",avatar:"./assets/avatars/opponent-gulao-modern.webp",ai:{style:"守势控场",desc:"强调目标威胁判断和持续干扰。",aggression:0.58,combo:1.00,finish:1.02,control:1.38,resource:1.05,skill:1.18,variance:0.48,humanFocus:0.00}},
  {name:"公子",avatar:"./assets/avatars/opponent-gongzi-transparent.png",ai:{style:"冒险豪赌",desc:"偏爱高收益路线，也更容易出现大胆选择。",aggression:1.12,combo:1.18,finish:0.94,control:0.78,resource:0.88,skill:1.08,variance:1.60,humanFocus:0.05}},
  {name:"术士",avatar:"./assets/avatars/opponent-shushi-transparent.png",ai:{style:"技能经营",desc:"更积极寻找技能收益和资源转换机会。",aggression:0.66,combo:0.90,finish:0.98,control:1.18,resource:1.14,skill:1.48,variance:0.68,humanFocus:0.00}},
  {name:"影剑",avatar:"./assets/avatars/opponent-yingjian.webp",ai:{style:"终结猎手",desc:"对接近清手的目标更敏感，自己临门时更果断。",aggression:0.96,combo:1.02,finish:1.58,control:1.18,resource:0.76,skill:1.02,variance:0.52,humanFocus:0.14}},
  {name:"青策",avatar:"./assets/avatars/opponent-qingce.webp",ai:{style:"精算布局",desc:"更重视大牌组合和稳定的高分路线。",aggression:0.70,combo:1.42,finish:1.30,control:1.18,resource:1.02,skill:1.18,variance:0.34,humanFocus:0.00}},
  {name:"赤焰",avatar:"./assets/avatars/opponent-chiyan.webp",ai:{style:"爆发猛攻",desc:"强烈偏好大牌与额外回合，资源保守度最低。",aggression:1.36,combo:1.50,finish:1.20,control:0.72,resource:0.62,skill:1.04,variance:0.88,humanFocus:0.12}},
  {name:"紫弦",avatar:"./assets/avatars/opponent-zixian.webp",ai:{style:"诡谋牵制",desc:"偏爱技能、污染与控制，偶尔会特别关注真人玩家。",aggression:0.74,combo:0.96,finish:1.04,control:1.58,resource:0.92,skill:1.38,variance:0.78,humanFocus:0.28}}
];
// 兼容旧存档：没有 player.avatar 时仍按座位使用原始头像。
const AVATARS=[PLAYER_AVATAR,"./assets/avatars/opponent-fuzhanggui-modern.webp","./assets/avatars/opponent-alan-modern.webp","./assets/avatars/opponent-gulao-modern.webp"];
const expIntel=new Set();
let _modalIsChoice=false;

const $ = id => document.getElementById(id);
function setLobbyMode(isLobby){
  document.documentElement.classList.toggle("lobby-mode",!!isLobby);
  if(document.body) document.body.classList.toggle("lobby-mode",!!isLobby);
}
function syncLobbyMode(){
  setLobbyMode(!$("startPanel")?.classList.contains("hidden"));
}
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const rand = n => Math.floor(Math.random()*n);
const rollD6 = () => 1+rand(6);

const AI_THINK_MS = MATCH_RULES.aiThinkMs;
const aiThink = () => sleep(AI_THINK_MS);
const clamp01=v=>Math.max(0,Math.min(1,v));
function aiProfile(p){ return p?.aiProfile||AI_FALLBACK_PROFILE; }
function aiDifficulty(p){ return p?.aiDifficulty||G?.room?.ai||{label:"标准",mistakeRate:0.12,scoreNoise:7,topChoices:2,awareness:0.82,skillFactor:1}; }
function aiScoredChoice(p,items,scoreFn){ if(!items?.length)return null; const diff=aiDifficulty(p), profile=aiProfile(p); const noise=Math.max(0,diff.scoreNoise||0)*Math.max(0.25,profile.variance||1); const ranked=items.map(item=>({item,score:scoreFn(item)+(Math.random()*2-1)*noise})).sort((a,b)=>b.score-a.score); const window=Math.max(1,Math.min(ranked.length,diff.topChoices||1)); if(window>1&&Math.random()<clamp01(diff.mistakeRate||0))return ranked[rand(window)].item; return ranked[0].item; }
function aiTargetScore(p,target,purpose="pressure"){ const profile=aiProfile(p), diff=aiDifficulty(p); if(target===p){ if(purpose!=="draw")return -9999; const need=p.hand.length<=2?58:p.hand.length<=4?28:p.hand.length<=6?4:-55; return need*profile.resource+(profile.aggression<0.7?8:0); } let score=(10-target.hand.length)*12*profile.control; if(target.hand.length<=3)score+=(4-target.hand.length)*24*profile.finish; if(target===G.players[0])score+=(profile.humanFocus||0)*28; if((diff.awareness||0)>0.65){ if(target.extraTurns>0)score+=10*(diff.awareness||1); if(["overload","charge","artisan"].includes(target.skill?.id))score+=5*(diff.awareness||1); } if(purpose==="pressure")score+=10*profile.aggression; if(purpose==="control")score+=12*profile.control; return score; }
function aiChooseTargets(p,count,{allowSelf=false,purpose="pressure"}={}){ const pool=G.players.map((x,i)=>({x,i})).filter(o=>allowSelf||o.x!==p), picks=[]; while(picks.length<count&&pool.length){ const chosen=aiScoredChoice(p,pool,o=>aiTargetScore(p,o.x,purpose)); if(!chosen)break; picks.push(chosen.i); pool.splice(pool.indexOf(chosen),1); } return picks; }
function aiMovePersonalityBias(p,move){ const profile=aiProfile(p); const n=move.cards.length, remain=p.hand.length-n; let score=0; if(n>=4)score+=(profile.combo-1)*30+(profile.aggression-0.75)*10; if(move.type==="single")score+=(profile.aggression-0.75)*8-(profile.combo-1)*7; if(remain<=2)score+=(3-remain)*18*(profile.finish-0.75); if(p.skill.id==="pollution"&&move.type==="single")score+=(profile.control-1)*16+(profile.skill-1)*10; if(p.skill.id==="artisan"&&n>=4)score+=(profile.skill-1)*10; if(move.cards.some(c=>c.polluted))score+=8*profile.control; return score; }

function makeDeck(){
  const d=[]; let uid=0;
  for(let k=0;k<4;k++){
    for(const s of SUITS) for(const r of RANKS) d.push({id:"c"+(uid++),rank:r,suit:s,revealed:false});
  }
  shuffle(d); return d;
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function drawRaw(){
  if(!G.deck.length){
    // prototype fallback: recycle a fresh deck if somehow exhausted
    G.deck = makeDeck();
    log("牌堆耗尽，测试版重新生成牌堆。");
  }
  return G.deck.shift();
}
function putBottom(card){ G.deck.push(card); }

function gainCardToHand(p, c, source="effect"){
  // 所有“获得牌”统一从这里结算。
  // 【充能】不区分来源：正常摸牌、场地、处罚、他人技能、自己技能都逐张判断。
  const hadSame = p.hand.some(x=>x.rank===c.rank);
  p.hand.push(c);

  if(p.skill.id==="charge" && hadSame){
    p.energy++;
    const sourceText = source==="normal" ? "正常摸牌"
      : source==="field" ? "场地效果"
      : source==="penalty" ? "处罚效果"
      : source==="skill" ? "技能效果"
      : source==="setup" ? "起手"
      : "获得牌";
    log(`${p.name} 因${sourceText}获得重复点数 ${c.rank}，充能 +1（${p.energy}）。`);
  }

  checkChargeBurst(p);
}

function drawTo(p, n, source="effect"){
  for(let i=0;i<n;i++){
    const c=drawRaw();
    gainCardToHand(p,c,source);
  }
  if(n>0 && source!=="setup"){
    if(typeof AudioSys!=="undefined"){
      // 只有人类玩家摸牌时播放明显音效，AI 摸牌播放轻微音效
      if(!p.isAI) AudioSys.SFX.deal();
      else if(n>=2) setTimeout(()=>AudioSys.SFX.deal(), 50);
    }
    showDrawFlight(p,n);
  }
}

function reducedUiMotion(){
  return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function showDrawFlight(p,n){
  if(!G || !p || n<=0 || reducedUiMotion())return;
  const layer=document.getElementById("fxLayer");
  if(!layer)return;
  const deckRect=document.getElementById("lastPlay")?.getBoundingClientRect();
  const start={x:deckRect?deckRect.left+deckRect.width/2:innerWidth/2,y:deckRect?deckRect.top+deckRect.height/2:innerHeight*.48};
  let targetRect=null;
  const idx=G.players.indexOf(p);
  if(idx===0) targetRect=document.getElementById("hand")?.getBoundingClientRect();
  if(!targetRect) targetRect=document.querySelectorAll("#players .player")[idx]?.getBoundingClientRect();
  if(!targetRect)return;
  const target={x:targetRect.left+targetRect.width/2,y:targetRect.top+targetRect.height/2};
  const count=Math.min(n,4);
  for(let i=0;i<count;i++){
    const el=document.createElement("div");
    el.className="fx-draw-card play";
    const spread=(i-(count-1)/2)*8;
    el.style.left=`${start.x+spread}px`;
    el.style.top=`${start.y}px`;
    el.style.setProperty("--dx",`${target.x-(start.x+spread)}px`);
    el.style.setProperty("--dy",`${target.y-start.y}px`);
    el.style.setProperty("--draw-rot",`${(i-(count-1)/2)*7}deg`);
    el.style.setProperty("--delay",`${i*45}ms`);
    layer.appendChild(el);
    setTimeout(()=>el.remove(),760+i*45);
  }
}

function showTurnBanner(p,extra=false){
  if(!p || reducedUiMotion())return;
  const layer=document.getElementById("fxLayer");
  if(!layer)return;
  const el=document.createElement("div");
  el.className=`fx-turn-banner play${p.isAI?"":" human"}${extra?" extra":""}`;
  el.textContent=extra?`${p.name} · 额外回合`:`${p.name} · ${p.isAI?"行动":"轮到你"}`;
  layer.appendChild(el);
  setTimeout(()=>el.remove(),1050);
}

function checkChargeBurst(p){
  if(p.skill.id==="charge" && p.energy>=8 && !p.chargeBurstQueued){
    p.chargeBurstQueued=true;
    p.extraTurns += 1;
    p.chargeBurstExtraPending += 1;
    log(`${p.name} 充能达到8：立即获得1个额外回合。`);
  }
}

const BALANCE_STORAGE_KEY="happy-card-game.bean-balances.v1";
const DEFAULT_BEAN_BALANCES=Array(4).fill(MATCH_RULES.startingBalance);

function loadBeanBalances(){
  try{
    const saved=JSON.parse(localStorage.getItem(BALANCE_STORAGE_KEY));
    if(Array.isArray(saved) && saved.length===4 && saved.every(v=>Number.isFinite(v) && v>=0)){
      return saved.map(v=>Math.floor(v));
    }
  }catch(err){
    console.warn("星石余额读取失败，将使用初始余额。",err);
  }
  return [...DEFAULT_BEAN_BALANCES];
}

function saveBeanBalances(){
  try{
    localStorage.setItem(BALANCE_STORAGE_KEY,JSON.stringify(beanBalances));
    return true;
  }catch(err){
    console.warn("星石余额保存失败。",err);
    return false;
  }
}

function renderStoredBalance(){
  const el=$("storedBalance");
  if(el)el.textContent=beanBalances[0].toLocaleString("zh-CN");
  if(typeof updateLobbyRooms==="function")updateLobbyRooms();
}
const SAVE_FILE_MAGIC="happy-card-game-save";
const SAVE_FILE_VERSION=1;
const SAVE_BUILD=GAME_VERSION;
const SAVE_CODE_PREFIX="HCG1-";

function buildPortableSave(){
  return {
    magic:SAVE_FILE_MAGIC,version:SAVE_FILE_VERSION,build:SAVE_BUILD,exportedAt:new Date().toISOString(),
    balances:[...beanBalances],selectedRoomId,game:G?JSON.parse(JSON.stringify(G)):null,
    preferences:{sfxMuted:localStorage.getItem("happy-card-game.sfxMuted")==="1",musicMuted:localStorage.getItem("happy-card-game.musicMuted")==="1"}
  };
}
function utf8ToBase64(text){
  const bytes=new TextEncoder().encode(text); let binary="";
  for(let i=0;i<bytes.length;i+=8192) binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}
function base64ToUtf8(text){
  let b64=text.replace(/-/g,"+").replace(/_/g,"/"); while(b64.length%4)b64+="=";
  const binary=atob(b64); const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function createSaveCode(){ return SAVE_CODE_PREFIX+utf8ToBase64(JSON.stringify(buildPortableSave())); }
function parseSaveCode(code){
  const clean=String(code||"").trim().replace(/\s+/g,"");
  if(!clean.startsWith(SAVE_CODE_PREFIX))throw new Error("不是有效的欢乐牌局存档码");
  let data; try{ data=JSON.parse(base64ToUtf8(clean.slice(SAVE_CODE_PREFIX.length))); }catch(e){ throw new Error("存档码损坏或复制不完整"); }
  validatePortableSave(data); return data;
}
function validatePortableSave(data){
  if(!data||data.magic!==SAVE_FILE_MAGIC)throw new Error("存档格式不正确");
  if(data.version!==SAVE_FILE_VERSION)throw new Error("暂不支持此存档版本");
  if(!Array.isArray(data.balances)||data.balances.length!==4||!data.balances.every(v=>Number.isFinite(v)&&v>=0))throw new Error("存档余额数据无效");
  if(data.game && (!Array.isArray(data.game.players)||data.game.players.length!==4))throw new Error("对局数据不完整");
}
function normalizeImportedAIState(){ if(!G?.players)return; const roomDef=ROOMS[G.room?.id]||ROOMS[selectedRoomId]||ROOMS.normal; G.room={...roomDef,...(G.room||{}),ai:{...roomDef.ai,...(G.room?.ai||{})}}; for(const p of G.players){ if(!p.isAI)continue; const def=OPPONENTS.find(o=>o.name===p.name); p.aiProfile={...(def?.ai||AI_FALLBACK_PROFILE)}; p.aiDifficulty={...G.room.ai}; } }
function applyPortableSave(data){
  clearTimeout(aiTimer); aiTimer=null;
  beanBalances.splice(0,beanBalances.length,...data.balances.map(v=>Math.floor(v)));
  if(ROOMS[data.selectedRoomId])selectedRoomId=data.selectedRoomId;
  G=data.game?JSON.parse(JSON.stringify(data.game)):null; normalizeImportedAIState(); selected.clear(); expIntel.clear(); saveBeanBalances(); renderStoredBalance();
  try{localStorage.setItem("happy-card-game.sfxMuted",data.preferences?.sfxMuted?"1":"0");localStorage.setItem("happy-card-game.musicMuted",data.preferences?.musicMuted?"1":"0");}catch(e){}
  if(typeof AudioSys!=="undefined"){AudioSys.loadPrefs();AudioSys.applyPrefsUI();}
  if(G){$("startPanel").classList.add("hidden");$("game").classList.remove("hidden");updateTrapArming();render();if(currentPlayer()?.isAI&&G.phase==="play")scheduleAI();}
  else{$("game").classList.add("hidden");$("startPanel").classList.remove("hidden");updateLobbyRooms();}
  syncLobbyMode();
}
function openSaveCode(mode="export"){
  const mask=$("saveCodeMask"), text=$("saveCodeText"), title=$("saveCodeTitle"), hint=$("saveCodeHint"), copy=$("saveCodeCopy"), apply=$("saveCodeApply"); if(!mask)return;
  // 存档导入/导出只允许在大厅使用，避免对局中的异步结算状态被截断或覆盖。
  if($("startPanel")?.classList.contains("hidden")){
    toast("存档导入/导出仅可在大厅使用。");
    return;
  }
  const exporting=mode==="export";
  title.textContent=exporting?"导出存档码":"导入存档码"; hint.textContent=exporting?"复制并妥善保存，之后可恢复当前进度":"粘贴完整存档码后点击导入";
  text.value=exporting?createSaveCode():""; text.readOnly=exporting; copy.style.display=exporting?"":"none"; apply.style.display=exporting?"none":""; mask.classList.add("show"); setTimeout(()=>{text.focus();if(exporting)text.select();},30);
}
function closeSaveCode(){ $("saveCodeMask")?.classList.remove("show"); }
async function copyCurrentSaveCode(){
  const text=$("saveCodeText")?.value||""; if(!text)return;
  try{await navigator.clipboard.writeText(text);toast("存档码已复制");}catch(e){$("saveCodeText")?.select();document.execCommand("copy");toast("存档码已复制");}
}
function importSaveCodeFromUI(){
  try{const data=parseSaveCode($("saveCodeText")?.value);if(G&&!G.gameOver&&!confirm("导入存档会覆盖当前对局，确定继续吗？"))return;applyPortableSave(data);closeSaveCode();toast(G?"存档码已导入，对局已恢复":"存档码已导入");}
  catch(err){console.error("导入存档码失败",err);alert(`导入失败：${err.message||"存档码无效"}`);}
}
function initSaveTransferUI(){
  $("saveExportBtn")?.addEventListener("click",()=>openSaveCode("export"));
  $("saveImportBtn")?.addEventListener("click",()=>openSaveCode("import"));
  $("saveCodeClose")?.addEventListener("click",closeSaveCode); $("saveCodeCopy")?.addEventListener("click",copyCurrentSaveCode); $("saveCodeApply")?.addEventListener("click",importSaveCodeFromUI);
  $("saveCodeMask")?.addEventListener("click",e=>{if(e.target===$("saveCodeMask"))closeSaveCode();});
}
const beanBalances=loadBeanBalances();
const ROOMS=GAME_CONFIG.rooms;
let selectedRoomId="normal";

function currentRoom(){ return ROOMS[selectedRoomId] || ROOMS.normal; }

// 根据配置生成“第5、10、15…”这类提示，避免 UI 写死轮次。
function fieldScheduleText(){
  const every=Math.max(1,Number(MATCH_RULES.fieldEveryRounds)||1);
  return `第${[every,every*2,every*3].join("、")}…轮结束时抽取新场地`;
}

// 规则页中的房间数字同样由配置生成。
function roomRulesText(){
  const rooms=Object.values(ROOMS);
  return `大厅分为【${rooms.map(r=>r.name).join(" / ")}】：底注分别为${rooms.map(r=>r.baseBet).join(" / ")}星石；入场门槛分别为${rooms.map(r=>r.minBalance).join(" / ")}星石。场次只改变星石风险和 AI 难度，不改变卡牌规则。`;
}

function updateLobbyRooms(){
  const balance=beanBalances[0] ?? 0;
  document.querySelectorAll(".room-card[data-room]").forEach(card=>{
    const room=ROOMS[card.dataset.room];
    if(!room)return;

    // 房间显示数字从 config.js 同步，避免“逻辑已改、界面没改”。
    const nameEl=card.querySelector(".room-name");
    const stakeEl=card.querySelector(".room-stake b");
    const entryEl=card.querySelector(".room-entry");
    if(nameEl)nameEl.textContent=room.name;
    if(stakeEl)stakeEl.textContent=room.baseBet.toLocaleString("zh-CN");
    if(entryEl)entryEl.textContent=room.minBalance>0
      ? `${room.minBalance.toLocaleString("zh-CN")} 星石以上可入场`
      : "不限星石 · 适合熟悉玩法";

    const locked=balance<room.minBalance;
    card.classList.toggle("locked",locked);
    card.setAttribute("aria-disabled",locked?"true":"false");
    const enter=card.querySelector(".room-enter");
    if(enter)enter.textContent=locked?`还差 ${(room.minBalance-balance).toLocaleString("zh-CN")} 🔮`:"进入牌桌";
  });

  const fieldDesc=$("fieldDesc");
  if(fieldDesc&&!G)fieldDesc.textContent=fieldScheduleText();
}

function newGame(roomId=selectedRoomId){
  clearTimeout(aiTimer);
  expIntel.clear();
  if(ROOMS[roomId]) selectedRoomId=roomId;
  const room=currentRoom();
  if(beanBalances[0]<room.minBalance){
    toast(`进入【${room.name}】至少需要 ${room.minBalance.toLocaleString("zh-CN")} 星石。`);
    updateLobbyRooms();
    return;
  }
  const deck=makeDeck();
  const selectedSkillId = $("skillSelect").value || "random";
  let humanSkill;
  if(selectedSkillId==="random") humanSkill=[...SKILLS][rand(SKILLS.length)];
  else humanSkill=SKILLS.find(x=>x.id===selectedSkillId) || SKILLS[0];
  const aiPool=shuffle(SKILLS.filter(x=>x.id!==humanSkill.id));
  const skills=[humanSkill,...aiPool.slice(0,3)];
  // 每局从扩展对手池随机抽取3名，人物与头像一一绑定且不重复。
  const opponents=shuffle(OPPONENTS.map(x=>({...x}))).slice(0,3);
  const names=["你",...opponents.map(x=>x.name)];
  G={
    deck, players:names.map((name,i)=>({
      name,avatar:i===0?PLAYER_AVATAR:opponents[i-1].avatar,isAI:i!==0,hand:[],skill:skills[i],energy:0,diceValue:null,ownNormalTurns:0,
      aiProfile:i===0?null:{...opponents[i-1].ai},aiDifficulty:i===0?null:{...room.ai},
      extraTurns:0,skipPlay:false,revealUsed:false,chargeBurstQueued:false,chargeBurstExtraPending:0,
      diceExtraPending:false,fieldExtraPending:false,knownInfo:{},discards:[],beans:beanBalances[i],
      barrierType:null,barrierRemaining:0,barrierCooldown:0,barrierCanCast:false,barrierTarget:null,barrierSiftPending:false,barrierDrawBonus:0
    })),
    current:rand(4), round:1, normalSeat:0, phase:"idle", field:null, fieldRoundsLeft:0,
    gameOver:false, trapStates:{}, turnSerial:0, extraMode:false, fieldHistory:[],lastPlay:null,
    room:{...room}, baseBet:room.baseBet, multiplier:1
  };
  for(const p of G.players) drawTo(p,MATCH_RULES.startingHandSize,"setup");
  for(const p of G.players){
    if(p.skill.id==="trap"){
      G.trapStates[p.name]={armed:false,cooldown:0,everActivated:false};
    }
  }
  selected.clear();
  renderStoredBalance();
  $("startPanel").classList.add("hidden");
  $("game").classList.remove("hidden");
  syncLobbyMode();
  logClear();
  log(`进入【${room.name}】。底注 ${room.baseBet} 星石 · AI难度：${room.ai.label}。`, "system");
  log(`本局对手：${G.players.filter(p=>p.isAI).map(p=>`${p.name}（${aiProfile(p).style}）`).join("、")}。`, "system");
  log(`游戏开始。每人起手${MATCH_RULES.startingHandSize}张。`, "system");
  log(`本局随机先手：${G.players[G.current].name}。`, "system");
  updateTrapArming();
  render();
  startTurn(false);
}

function ensureLogDrawerPortal(){
  const drawer=$("logDrawer");
  if(drawer && drawer.parentElement!==document.body){
    document.body.appendChild(drawer);
  }
}

function logClear(){$("log").innerHTML=""}
function log(t, type="action"){
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  
  const e = document.createElement("div");
  e.className = `log-item log-${type}`;
  
  // 简单的自动加粗玩家名字逻辑
  let msg = t;
  if (G && G.players) {
    G.players.forEach(p => {
      const regex = new RegExp(p.name, "g");
      msg = msg.replace(regex, `<b>${p.name}</b>`);
    });
  }

  e.innerHTML = `<span class="log-time">${timeStr}</span><span class="log-msg">${msg}</span>`;
  $("log").appendChild(e);
  $("log").scrollTop = $("log").scrollHeight;
}
function toast(t){
  $("toast").textContent=t; $("toast").style.display="block";
  setTimeout(()=>$("toast").style.display="none",1500);
}

let eventOverlayBusy = false;
function showEventOverlay(kind, kicker, title, desc, duration=1250){
  duration=Math.round(duration*1.8);
  return new Promise(resolve=>{
    const o=$("eventOverlay");
    eventOverlayBusy=true;
    o.className=`event-overlay ${kind} show`;
    $("eventKicker").textContent=kicker;
    $("eventTitle").textContent=title;
    $("eventDesc").textContent=desc || "";
    // 事件音效 + 视觉
    if(typeof AudioSys!=="undefined"){
      if(kind==="skill"){
        AudioSys.SFX.skill();
        AudioSys.FX.skill();
      }else if(kind==="field"){
        AudioSys.SFX.fieldChange();
        AudioSys.FX.fieldChange();
      }else{
        AudioSys.SFX.popup();
      }
    }
    const done=()=>{
      if(!eventOverlayBusy)return;
      eventOverlayBusy=false;
      o.className="event-overlay";
      o.onclick=null;
      resolve();
    };
    const timer=setTimeout(done,duration);
    o.onclick=()=>{ clearTimeout(timer); done(); };
  });
}


const BARRIER_INFO={
  draw:{name:"丰饶结界",short:"丰饶"},
  pressure:{name:"蚀流结界",short:"蚀流"},
  sift:{name:"轮转结界",short:"轮转"}
};

function barrierStatusText(p){
  if(p.skill.id!=="barrier")return "";
  if(p.barrierType && p.barrierRemaining>0){
    const info=BARRIER_INFO[p.barrierType];
    const target=p.barrierType==="pressure" && Number.isInteger(p.barrierTarget)
      ? `→${G.players[p.barrierTarget]?.name||"目标"}` : "";
    return `${info?.short||"结界"}${target} · 倒计时${p.barrierRemaining} · CD${p.barrierCooldown}`;
  }
  if(p.barrierCanCast)return "可施放";
  if(p.barrierCooldown===0)return "冷却结束 · 下回合可施放";
  return `冷却${p.barrierCooldown}`;
}

async function activateBarrier(p,type,targetIndex=null){
  if(!G || p.skill.id!=="barrier" || G.extraMode || !p.barrierCanCast || p.barrierCooldown!==0)return false;
  if(!BARRIER_INFO[type])return false;
  if(type==="pressure"){
    if(!Number.isInteger(targetIndex) || targetIndex<0 || targetIndex>=G.players.length || G.players[targetIndex]===p)return false;
  }
  p.barrierType=type;
  p.barrierRemaining=3;
  p.barrierCooldown=4;
  p.barrierCanCast=false;
  p.barrierTarget=type==="pressure"?targetIndex:null;
  p.barrierSiftPending=false;
  p.barrierDrawBonus=0;

  const info=BARRIER_INFO[type];
  const targetText=type==="pressure"?`，目标为 ${G.players[targetIndex].name}`:"";
  log(`${p.name} 布置【${info.name}】${targetText}：从下一个自己的正常回合开始触发3次，技能冷却4回合。`, "skill");
  render();
  if(typeof AudioSys!=="undefined" && !p.isAI){
    AudioSys.SFX.barrier();
    AudioSys.FX.barrier();
  }
  await showEventOverlay("skill","技能发动",`【${info.name}】`,
    `${p.name} 完成布置${targetText}。结界将在下一个自己的正常回合开始生效。`,950);
  return true;
}

async function humanActivateBarrier(p){
  const type=await modalChoices(
    "结界 · 选择术式",
    `<div class="small" style="margin-bottom:10px">结界从你的下一个正常回合开始连续触发3次；施放后4个自己的正常回合内不能再次施放。</div>`,
    [
      ["draw","丰饶结界 · 接下来3次正常摸牌各额外摸1张"],
      ["pressure","蚀流结界 · 指定1名对手，接下来3次触发令其各摸1张"],
      ["sift","轮转结界 · 接下来3次正常摸牌后可将最后摸到的牌置底重摸"]
    ]
  );
  if(!type)return false;
  let target=null;
  if(type==="pressure") target=await chooseTarget("蚀流结界：选择持续影响的目标",false);
  return activateBarrier(p,type,target);
}

function aiBarrierChoice(p){ const profile=aiProfile(p), diff=aiDifficulty(p); const threatIndex=aiChooseTargets(p,1,{purpose:"control"})[0]; const threat=threatIndex===undefined?null:G.players[threatIndex]; const candidates=enumerateCandidates(p); const hasBig=candidates.some(c=>c.cards.length>=4); const options=[{type:"draw",target:null,score:(p.hand.length<=4?38:10)*profile.resource},{type:"sift",target:null,score:(p.hand.length>=5&&!hasBig?42:14)*profile.combo},{type:"pressure",target:threatIndex,score:threat?aiTargetScore(p,threat,"control")*0.45*profile.skill:-999}].filter(o=>o.type!=="pressure"||o.target!==undefined); const picked=aiScoredChoice(p,options,o=>o.score*(diff.skillFactor||1)); return picked||{type:"draw",target:null}; }

async function processBarrierNormalTurnStart(p){
  if(p.skill.id!=="barrier")return;

  // CD=4：3个触发回合结束后，再完整跨过1个禁用回合；之后才重新可施放。
  p.barrierCanCast=(p.barrierCooldown===0);
  if(p.barrierCooldown>0)p.barrierCooldown--;

  p.barrierSiftPending=false;
  p.barrierDrawBonus=0;

  if(!p.barrierType || p.barrierRemaining<=0)return;

  const type=p.barrierType;
  const info=BARRIER_INFO[type];

  if(type==="draw"){
    p.barrierDrawBonus=1;
    log(`${p.name} 的【${info.name}】触发：本次正常摸牌额外 +1。`, "skill");
  }else if(type==="pressure"){
    const target=G.players[p.barrierTarget];
    if(target){
      drawTo(target,1,"skill");
      log(`${p.name} 的【${info.name}】触发：${target.name} 效果摸1张。`, "skill");
      updateTrapArming();
    }
  }else if(type==="sift"){
    p.barrierSiftPending=true;
    log(`${p.name} 的【${info.name}】触发：本回合正常摸牌后可轮转最后摸到的1张牌。`, "skill");
  }

  p.barrierRemaining--;
  const left=p.barrierRemaining;
  if(left>0){
    log(`【${info.name}】倒计时 → ${left}。`, "skill");
  }else{
    log(`【${info.name}】倒计时 → 0，结界消散。`, "skill");
    p.barrierType=null;
    p.barrierTarget=null;
  }
  render();
}

function currentPlayer(){ return G.players[G.current]; }

function fieldActive(id){ return G.field && G.field.id===id && G.fieldRoundsLeft>0; }

async function startTurn(extra){
  if(G.gameOver)return;
  selected.clear();
  hintIndex=0;
  G.extraMode=!!extra;
  const p=currentPlayer();

  if(extra){
    G.phase="play";
    log(`↪ ${p.name} 进入额外回合（不摸牌）。`, "action");
    render();
    showTurnBanner(p,true);
    if(p.isAI) scheduleAI();
    return;
  }

  // 【明牌】规则是“每个自己的正常回合限一次”，额外回合不会刷新次数。
  p.revealUsed=false;
  p.ownNormalTurns++;
  G.turnSerial++;
  tickTrapCooldowns();
  await processBarrierNormalTurnStart(p);
  if(G.gameOver)return;

  G.phase="draw";
  render();

  // 轮到人类玩家的提示音 + 视觉
  if(!p.isAI && typeof AudioSys!=="undefined"){
    AudioSys.SFX.yourTurn();
    AudioSys.FX.yourTurn();
    AudioSys.VO.yourTurn();
  }

  // 新版【骰命】：每个自己的正常回合开始时公开投1D6。
  if(p.skill.id==="dice"){
    if(p.isAI) await aiThink();
    await resolveDiceFateTurnStart(p);
    if(G.gameOver)return;
  }

  let base=1;
  if(fieldActive("diceDraw")){
    const d=rollD6(); base=d;
    log(`${p.name} 受到【骰子风暴】：掷出 ${d}，基础摸牌=${d}。`);
  }else if(fieldActive("drawplus")){
    base=2;
  }

  let extraDraw=0;
  if(p.skill.id==="overload") extraDraw+=1;
  if(p.skill.id==="barrier" && p.barrierDrawBonus>0) extraDraw+=p.barrierDrawBonus;

  // 充能2：人类可选，AI简单决策
  if(p.skill.id==="charge" && p.energy>=2){
    let take=false;
    if(p.isAI){
      await aiThink();
      take = aiShouldExtraDraw(p);
    }
    else take = await askYesNo("充能 · 额外摸牌", `当前充能 ${p.energy}。是否在本次正常摸牌额外摸1张？`);
    if(take){extraDraw++;log(`${p.name} 使用2点阈值能力：本回合额外摸1张。`, "skill")}
  }

  const totalNormalDraw = base+extraDraw;
  const beforeIds=new Set(p.hand.map(c=>c.id));

  // 占卜：只替代本次正常摸牌阶段的“第一张”
  if(p.skill.id==="divine" && !G.extraMode){
    if(p.isAI) await aiDivinationDraw(p);
    else await humanDivinationDraw(p);
    if(totalNormalDraw>1) drawTo(p,totalNormalDraw-1,"normal");
  }else{
    drawTo(p,totalNormalDraw,"normal");
  }

  const justDrawn=p.hand.filter(c=>!beforeIds.has(c.id));
  log(`${p.name} 正常摸牌 ${totalNormalDraw} 张。`, "action");
  updateTrapArming();

  // 【轮转结界】只处理本次正常摸牌阶段最后获得的一张牌。
  if(p.skill.id==="barrier" && p.barrierSiftPending && justDrawn.length){
    p.barrierSiftPending=false;
    const last=justDrawn[justDrawn.length-1];
    let replace=false;
    if(p.isAI){
      await aiThink();
      replace=aiArtisanReplace(p,last);
    }else{
      replace=await askYesNo("轮转结界 · 换牌",`刚摸到 ${last.rank}${last.suit}。是否将它置于牌底并重摸1张？`);
    }
    if(replace){
      const idx=p.hand.findIndex(c=>c.id===last.id);
      if(idx>=0){
        p.hand.splice(idx,1);
        putBottom(last);
        drawTo(p,1,"skill");
        log(`${p.name} 的【轮转结界】将 ${last.rank}${last.suit} 置底并重摸1张。`);
      }
    }
  }

  // 牌匠只处理“最后摸到的一张”，避免骰子风暴时过度复杂
  if(p.skill.id==="artisan" && justDrawn.length){
    const last=justDrawn[justDrawn.length-1];
    let replace=false;
    if(p.isAI){
      await aiThink();
      replace=aiArtisanReplace(p,last);
    }
    else replace=await askYesNo("牌匠 · 换牌", `刚摸到 ${last.rank}${last.suit}。是否将它置于牌底并重摸1张？`);
    if(replace){
      const idx=p.hand.findIndex(c=>c.id===last.id);
      if(idx>=0){p.hand.splice(idx,1);putBottom(last);drawTo(p,1,"skill");log(`${p.name} 将 ${last.rank}${last.suit} 置底并重摸1张。`)}
    }
  }

  if(p.skipPlay){
    p.skipPlay=false;
    log(`${p.name} 本回合被【四条】效果跳过出牌阶段。`);
    await finishTurn();
    return;
  }

  G.phase="play";
  render();
  if(p.isAI) scheduleAI();
}

function scheduleAI(){
  clearTimeout(aiTimer);
  aiTimer=setTimeout(()=>{
    aiTimer=null;
    aiAct();
  },AI_THINK_MS);
}

async function aiAct(){
  if(!G || G.gameOver)return;
  const p=currentPlayer();
  if(!p || !p.isAI || G.phase!=="play")return;

  try{
    // 【结界】只在自己的正常回合、且冷却允许时施放。
    if(p.skill.id==="barrier" && !G.extraMode && p.barrierCanCast){
      const plan=aiBarrierChoice(p);
      await activateBarrier(p,plan.type,plan.target);
      await aiThink();
    }

    // 主动明牌：每个“正常回合”最多一次；额外回合不会刷新。
    if(p.skill.id==="reveal" && !p.revealUsed){
      const unrevealed=p.hand.filter(c=>!c.revealed);
      const revealChance=clamp01((p.hand.length>=5?0.72:0.34)*aiProfile(p).skill*(aiDifficulty(p).skillFactor||1));
      if(unrevealed.length && Math.random()<revealChance){
        const c=chooseLeastUsefulCard(p,unrevealed);
        if(c){
          // 明牌后仍保留在占卜者的情报区，只把显示状态改成“公开（金色）”。
          c.revealed=true;
          p.revealUsed=true;

          const t=aiChooseDrawTarget(p,true);
          drawTo(G.players[t],1,"skill");
          log(`${p.name} 公开 ${c.rank}${c.suit}，令 ${G.players[t].name} 摸1张。`);
          updateTrapArming();
          render();

          await showEventOverlay(
            "skill",
            "技能发动",
            "【明牌】",
            `${p.name} 公开 ${c.rank}${c.suit}，并令 ${G.players[t].name} 额外摸1张。`,
            900
          );

          // AI用了主动技能后，再停约2秒，模拟重新评估手牌再出牌。
          await aiThink();
        }
      }
    }

    const cand=aiBestPlay(p);
    if(cand){
      await executePlay(p,cand.cards,cand.type);
    }else{
      if(typeof AudioSys!=="undefined"){
        AudioSys.SFX.pass();
        AudioSys.VO.pass();
      }
      log(`${p.name} 选择不出。`, "action");
      await finishTurn();
    }
  }catch(err){
    console.error("AI action error:",err);
    log(`⚠ ${p.name} 的AI逻辑发生异常，系统已自动跳过本次出牌以避免卡死。`, "warn");
    // 防止因为单个AI技能异常把整局锁死。
    try{
      if(G && !G.gameOver && currentPlayer()===p){
        await finishTurn();
      }
    }catch(recoverErr){
      console.error("AI recovery error:",recoverErr);
      log("⚠ 自动恢复失败，请返回开始界面重新开局。", "warn");
    }
  }
}


const DICE_FATE_TEXT = {
  1:"强制：自己摸1张。",
  2:"强制【选择2】：查看牌堆顶2张，选1张加入手牌，另一张洗回牌堆。",
  3:"强制：指定任意玩家摸1张；若指定自己，则改为【选择2】。",
  4:"强制：指定两名不同玩家各摸1张；若其中包含自己，自己的那一份改为【选择2】。",
  5:"强制：先弃2张，再【选择3】：查看牌堆顶3张，选2张加入手牌，未选牌洗回牌堆。",
  6:"强制：本正常回合结束后获得1个额外回合。"
};



function shuffleCardIntoDeck(card){
  // “洗入牌堆”：随机插入剩余牌堆任意位置，而不是置于牌底。
  card.revealed=false;
  const pos=rand(G.deck.length+1);
  G.deck.splice(pos,0,card);
}

function addEffectCardToHand(p,card,label="效果摸牌"){
  // 特殊选择进张同样属于“获得牌”，统一走【充能】判定。
  gainCardToHand(p,card,"skill");
}

function aiPickBestFromCards(p,cards,count){ const pool=[...cards], chosen=[]; while(chosen.length<count&&pool.length){ const pick=aiScoredChoice(p,pool,c=>cardNeedScore(p,c)+p.hand.filter(x=>x.rank===c.rank).length*3*aiProfile(p).combo); if(!pick)break; chosen.push(pick); pool.splice(pool.indexOf(pick),1); } return chosen; }

async function diceChooseTop(p,lookCount,takeCount,title){
  const top=G.deck.splice(0,lookCount);
  if(top.length<lookCount){
    // 测试版极端牌堆不足时补足新牌堆，避免流程卡死。
    while(top.length<lookCount) top.push(drawRaw());
  }

  let chosen=[];
  if(p.isAI){
    chosen=aiPickBestFromCards(p,top,takeCount);
  }else{
    chosen=await chooseMultipleCardsFromList(title,top,takeCount);
  }

  const chosenIds=new Set(chosen.map(c=>c.id));
  for(const c of chosen){
    addEffectCardToHand(p,c,title);
  }

  for(const c of top){
    if(!chosenIds.has(c.id)) shuffleCardIntoDeck(c);
  }

  log(`${p.name} 完成【${title}】：从牌堆顶${lookCount}张中获得${takeCount}张，未选择牌洗回牌堆。`);
  updateTrapArming();
  render();
}

async function discardExactForDice(p,count){
  const actual=Math.min(count,p.hand.length);
  if(actual<=0)return [];

  let cards=[];
  if(p.isAI){
    const pool=[...p.hand];
    for(let i=0;i<actual;i++){
      const c=chooseLeastUsefulCard({...p, hand:pool},pool);
      if(!c)break;
      cards.push(c);
      pool.splice(pool.findIndex(x=>x.id===c.id),1);
    }
  }else{
    cards=await chooseMultipleCardsFromList(
      `骰命·5：必须弃${count}张牌${p.hand.length<count?"（当前不足2张，将弃尽现有手牌）":""}`,
      p.hand,
      actual
    );
  }

  const idx=G.players.indexOf(p);
  const ids=new Set(cards.map(c=>c.id));
  for(const c of cards) removeKnownFaceFromAllObservers(idx,c);
  p.hand=p.hand.filter(c=>!ids.has(c.id));

  if(cards.length){
    log(`${p.name} 因【骰命·5】弃掉 ${cards.map(c=>c.rank+c.suit).join(" ")}。`);
  }
  return cards;
}

function aiChooseTwoDrawTargets(p){ return aiChooseTargets(p,2,{allowSelf:true,purpose:"draw"}); }

async function resolveDiceFateTurnStart(p){
  if(p.skill.id!=="dice" || G.extraMode)return;

  p.diceExtraPending=false;
  const d=rollD6();
  p.diceValue=d;

  render();
  await showEventOverlay(
    "skill",
    "骰命 · 公开掷骰",
    `🎲 ${d} 点`,
    DICE_FATE_TEXT[d],
    950
  );

  if(d===1){
    drawTo(p,1,"skill");
    log(`${p.name} 强制结算【骰命·1】：自己摸1张。`);
  }

  else if(d===2){
    await diceChooseTop(p,2,1,"骰命·选择2");
  }

  else if(d===3){
    const selfIndex=G.players.indexOf(p);
    const t=p.isAI
      ? aiChooseDrawTarget(p,true)
      : await chooseTarget("骰命·3：必须指定一名玩家",true);

    if(t===selfIndex){
      await diceChooseTop(p,2,1,"骰命·选择2");
      log(`${p.name} 的【骰命·3】指定自己，因此改为【选择2】。`);
    }else{
      drawTo(G.players[t],1,"skill");
      log(`${p.name} 强制结算【骰命·3】：${G.players[t].name} 摸1张。`);
    }
  }

  else if(d===4){
    const selfIndex=G.players.indexOf(p);
    const ts=p.isAI
      ? aiChooseTwoDrawTargets(p)
      : await chooseTwoTargets("骰命·4：必须指定两名不同玩家");

    // 非自己目标正常各摸1；自己目标则只结算一次【选择2】。
    for(const t of ts){
      if(t!==selfIndex){
        drawTo(G.players[t],1,"skill");
        log(`${p.name} 的【骰命·4】：${G.players[t].name} 摸1张。`);
      }
    }
    if(ts.includes(selfIndex)){
      await diceChooseTop(p,2,1,"骰命·选择2");
      log(`${p.name} 的【骰命·4】包含自己，因此自己的那一份改为【选择2】。`);
    }
  }

  else if(d===5){
    // 强制弃2。若弃牌后手牌变为0，则立即获胜，后续【选择3】不再结算。
    await discardExactForDice(p,2);

    if(p.hand.length===0){
      log(`${p.name} 因【骰命·5】弃尽手牌，立即获胜；不再结算后续【选择3】。`);
      win(p);
      return;
    }

    await diceChooseTop(p,3,2,"骰命·选择3");
    log(`${p.name} 强制结算【骰命·5】：先弃2张，再从牌堆顶3张中选择2张。`);
  }

  else if(d===6){
    p.diceExtraPending=true;
    log(`${p.name} 强制结算【骰命·6】：本正常回合结束后获得1个额外回合。`);
  }

  updateTrapArming();
  render();
}
function aiShouldExtraDraw(p){ const profile=aiProfile(p), diff=aiDifficulty(p); if(p.hand.length<=3)return true; const counts=rankCounts(p.hand); const comboReady=Object.values(counts).some(n=>n>=2); let chance=(p.hand.length<=5?0.84:p.hand.length<9?0.58:0.24)*profile.resource*(diff.skillFactor||1); if(comboReady)chance+=0.12*profile.combo; return Math.random()<clamp01(chance); }

function aiArtisanReplace(p,card){ const profile=aiProfile(p), diff=aiDifficulty(p); const cnt=p.hand.filter(c=>c.rank===card.rank).length; if(cnt>=2)return false; const vals=p.hand.map(c=>RANK_VALUE[c.rank]); const v=RANK_VALUE[card.rank]; const near=vals.some(x=>x!==v&&Math.abs(x-v)<=1); if(near||p.hand.length<4)return false; return Math.random()<clamp01(0.48*profile.resource*profile.skill*(diff.skillFactor||1)); }

async function aiDivinationDraw(p){
  // 占卜只替代“正常摸牌阶段的第一张”；额外回合/效果摸牌绝不触发。
  if(G.extraMode)return;
  if(G.deck.length<4){
    drawTo(p,1,"normal");
    log(`${p.name} 的【占卜4】因牌堆不足4张，改为正常摸1张。`);
    return;
  }
  await aiThink();
  const top=G.deck.splice(0,4);
  const picked=aiScoredChoice(p,top,c=>cardNeedScore(p,c)+p.hand.filter(x=>x.rank===c.rank).length*3*aiProfile(p).combo);
  const best=Math.max(0,top.indexOf(picked));
  const chosen=top.splice(best,1)[0];
  gainCardToHand(p,chosen,"normal");

  // AI最多沉1张：优先沉掉最可能帮助下一位已知牌型的牌
  const next=(G.current+1)%G.players.length;
  const knownCards=knownCardsFor(p,next);
  let sinkIndex=-1, sinkScore=0;
  top.forEach((c,i)=>{
    const sameKnown=knownCards.filter(x=>faceKey(x)===faceKey(c)).length;
    const sameRankKnown=knownCards.filter(x=>x.rank===c.rank).length;
    const sc=sameKnown*6+sameRankKnown*2;
    if(sc>sinkScore){sinkScore=sc;sinkIndex=i}
  });
  const useIntel=Math.random()<clamp01((aiDifficulty(p).awareness||0.5)*aiProfile(p).control);
  if(sinkIndex>=0&&useIntel){ const sunk=top.splice(sinkIndex,1)[0]; putBottom(sunk); } else if(!useIntel){ sinkIndex=-1; }

  // 削弱版【占卜】：剩余牌不能调整顺序，只能保持原有相对顺序。
  G.deck.unshift(...top);

  log(`${p.name} 使用【占卜4】选择1张；剩余牌保持原顺序${sinkIndex>=0?"，并将其中1张置底":""}。`);
}


async function humanDivinationDraw(p){
  // 占卜只替代“正常摸牌阶段的第一张”；额外回合/效果摸牌绝不触发。
  if(G.extraMode)return;
  if(G.deck.length<4){
    drawTo(p,1,"normal");
    log(`你的【占卜4】因牌堆不足4张，改为正常摸1张。`);
    return;
  }
  const top=G.deck.splice(0,4);

  const chosenId=await chooseCardFromList("占卜4 · 选择1张加入手牌",top);
  const chosenIndex=top.findIndex(c=>c.id===chosenId);
  const chosen=top.splice(chosenIndex>=0?chosenIndex:0,1)[0];
  gainCardToHand(p,chosen,"normal");

  let remaining=[...top];
  const sinkId=await chooseCardOrNone(
    "占卜4 · 至多沉底1张",
    remaining,
    "不沉底（剩余牌保持原顺序）"
  );
  if(sinkId){
    const idx=remaining.findIndex(c=>c.id===sinkId);
    if(idx>=0){
      const sunk=remaining.splice(idx,1)[0];
      putBottom(sunk);
    }
  }

  // 不能调整顺序；拿走/沉底后，剩余牌按它们原本在牌堆中的相对顺序返回牌顶。
  G.deck.unshift(...remaining);
  log(`你使用【占卜4】拿走1张；剩余牌保持原顺序${sinkId?"，并将其中1张置底":""}。`);
}

function faceKey(c){ return `${c.rank}|${c.suit}`; }
function faceTextKey(k){ const [r,s]=k.split("|"); return `${r}${s}`; }

function recordDivinationIntel(observer,targetIndex,card){
  // 记录“具体哪一张实体牌”，避免四副扑克出现同花同点数时重复/误删。
  observer.knownInfo[targetIndex] ??= [];
  if(!observer.knownInfo[targetIndex].includes(card.id)){
    observer.knownInfo[targetIndex].push(card.id);
  }
}

function removeKnownFaceFromAllObservers(targetIndex,card){
  // 牌真正离开手牌时，所有占卜者关于这张实体牌的情报才失效。
  for(const obs of G.players){
    const arr=obs.knownInfo?.[targetIndex];
    if(!arr || !arr.length)continue;
    const idx=arr.indexOf(card.id);
    if(idx>=0)arr.splice(idx,1);
  }
}

function knownCardsFor(observer,targetIndex){
  const ids=observer.knownInfo?.[targetIndex] || [];
  const target=G.players[targetIndex];
  return ids.map(id=>target.hand.find(c=>c.id===id)).filter(Boolean);
}

async function resolveDivinationIntel(p){
  if(p.skill.id!=="divine")return;
  const observerIndex=G.players.indexOf(p);
  const seen=[];
  for(let i=0;i<G.players.length;i++){
    if(i===observerIndex)continue;
    const target=G.players[i];
    const hidden=target.hand.filter(c=>!c.revealed);
    if(!hidden.length){
      seen.push(`${target.name}：无可窥视暗牌`);
      continue;
    }
    const c=hidden[rand(hidden.length)];
    recordDivinationIntel(p,i,c);
    seen.push(`${target.name}：${c.rank}${c.suit}`);
  }
  log(`${p.name} 在回合结束时获得了一轮信息。`);
  if(!p.isAI){
    render();
    await showEventOverlay("skill","私人情报","【占卜】",seen.join("　｜　"),1800);
  }
}



function cardNeedScore(p,c){
  // 简单评估一张牌对当前手牌的“做牌价值”：
  // 同点数越多越有价值，相邻点数也略微加分，供AI占卜/换牌等决策使用。
  let score=0;
  const same=p.hand.filter(x=>x.rank===c.rank).length;
  score += same*4;

  const v=RANK_VALUE[c.rank];
  for(const x of p.hand){
    const xv=RANK_VALUE[x.rank];
    if(Math.abs(xv-v)===1) score += 1;
    // A既可作1，也可在10JQKA里作高位，给一点额外顺子兼容性
    if((v===1 && xv===13) || (v===13 && xv===1)) score += 0.5;
  }
  return score;
}

function rankCounts(cards){
  const m={}; for(const c of cards)m[c.rank]=(m[c.rank]||0)+1; return m;
}

function classify(cards,p){
  const n=cards.length;
  if(n===0)return {ok:false,msg:"请先选择手牌。"};
  if(n===1){
    if(fieldActive("nosingle"))return {ok:false,msg:"当前场地禁止出单牌。"};
    const v=RANK_VALUE[cards[0].rank];
    if(fieldActive("odd") && v%2===0)return {ok:false,msg:"当前场地单牌只能打单数。"};
    if(fieldActive("even") && v%2===1)return {ok:false,msg:"当前场地单牌只能打双数。"};
    return {ok:true,type:"single",name:"单牌"};
  }
  if(n===2 && p.skill.id==="charge" && p.energy>=6 && cards[0].rank===cards[1].rank){
    return {ok:true,type:"pair",name:"对子"};
  }
  const cnt=rankCounts(cards);
  const vals=Object.values(cnt).sort((a,b)=>b-a);
  if(n===4 && vals[0]===4)return {ok:true,type:"four",name:"四条"};
  if(n===4 && vals[0]===3 && vals[1]===1)return {ok:true,type:"triple1",name:"三带一"};
  if(n===5 && vals[0]===3 && vals[1]===2)return {ok:true,type:"fullhouse",name:"葫芦"};
  if(n>=5 && isStraight(cards))return {ok:true,type:"straight",name:"顺子"};
  if(n>=6 && n%2===0 && isPairRun(cards))return {ok:true,type:"pairrun",name:"连对"};
  return {ok:false,msg:"这组牌不是当前允许的牌型。"};
}

function isStraight(cards){
  const uniq=[...new Set(cards.map(c=>RANK_VALUE[c.rank]))].sort((a,b)=>a-b);
  if(uniq.length!==cards.length)return false;
  const consecutive = arr => arr.every((v,i)=>i===0 || v===arr[i-1]+1);
  if(consecutive(uniq))return true;
  // A作14用于10JQKA
  const high=uniq.map(v=>v===1?14:v).sort((a,b)=>a-b);
  return consecutive(high);
}
function isPairRun(cards){
  const cnt=rankCounts(cards);
  if(!Object.values(cnt).every(x=>x===2))return false;
  const vals=Object.keys(cnt).map(r=>RANK_VALUE[r]).sort((a,b)=>a-b);
  const consecutive=arr=>arr.every((v,i)=>i===0||v===arr[i-1]+1);
  if(consecutive(vals))return true;
  const high=vals.map(v=>v===1?14:v).sort((a,b)=>a-b);
  return consecutive(high);
}

function enumerateCandidates(p){
  const hand=p.hand, out=[];
  // single
  for(const c of hand){
    const cl=classify([c],p); if(cl.ok)out.push({cards:[c],type:cl.type,name:cl.name});
  }
  // pair if allowed
  if(p.skill.id==="charge" && p.energy>=6){
    const by=groupByRank(hand);
    for(const arr of Object.values(by)) if(arr.length>=2) out.push({cards:arr.slice(0,2),type:"pair",name:"对子"});
  }
  const by=groupByRank(hand);
  const ranks=Object.keys(by);

  // four / triple1
  for(const r of ranks){
    if(by[r].length>=4) out.push({cards:by[r].slice(0,4),type:"four",name:"四条"});
    if(by[r].length>=3){
      const kicker=hand.find(c=>c.rank!==r);
      if(kicker) out.push({cards:[...by[r].slice(0,3),kicker],type:"triple1",name:"三带一"});
    }
  }
  // full house
  for(const r3 of ranks){
    if(by[r3].length<3)continue;
    for(const r2 of ranks){
      if(r2!==r3 && by[r2].length>=2) out.push({cards:[...by[r3].slice(0,3),...by[r2].slice(0,2)],type:"fullhouse",name:"葫芦"});
    }
  }
  // straights: enumerate contiguous unique ranks, max useful length
  const rankCards={};
  for(const r of ranks)rankCards[RANK_VALUE[r]]=by[r][0];
  const seqSets=[];
  const vals=[...new Set(Object.keys(rankCards).map(Number))].sort((a,b)=>a-b);
  const variants=[vals, vals.includes(1)?[...vals.filter(v=>v!==1),14].sort((a,b)=>a-b):vals];
  for(const vv of variants){
    let run=[];
    for(const v of vv){
      if(!run.length || v===run[run.length-1]+1)run.push(v); else{if(run.length>=5)seqSets.push([...run]);run=[v]}
    }
    if(run.length>=5)seqSets.push([...run]);
  }
  for(const run of seqSets){
    for(let len=5;len<=run.length;len++){
      for(let st=0;st+len<=run.length;st++){
        const chosen=run.slice(st,st+len).map(v=>rankCards[v===14?1:v]);
        out.push({cards:chosen,type:"straight",name:"顺子"});
      }
    }
  }

  // pair runs
  const pairVals=ranks.filter(r=>by[r].length>=2).map(r=>RANK_VALUE[r]).sort((a,b)=>a-b);
  const pairVariants=[pairVals,pairVals.includes(1)?[...pairVals.filter(v=>v!==1),14].sort((a,b)=>a-b):pairVals];
  for(const vv of pairVariants){
    let run=[];
    for(const v of vv){
      if(!run.length||v===run[run.length-1]+1)run.push(v); else{addPairRuns(run);run=[v]}
    }
    addPairRuns(run);
  }
  function addPairRuns(run){
    if(run.length<3)return;
    for(let len=3;len<=run.length;len++) for(let st=0;st+len<=run.length;st++){
      const cards=[]; for(const v of run.slice(st,st+len)){const r=RANKS[(v===14?1:v)-1];cards.push(...by[r].slice(0,2))}
      out.push({cards,type:"pairrun",name:"连对"});
    }
  }
  return dedupeCandidates(out);
}
function groupByRank(hand){
  const m={};for(const c of hand)(m[c.rank]??=[]).push(c);return m;
}
function dedupeCandidates(arr){
  const seen=new Set();return arr.filter(x=>{const k=x.cards.map(c=>c.id).sort().join(",");if(seen.has(k))return false;seen.add(k);return true});
}

function hasPollutionTarget(owner){
  return G.players.some(t=>t!==owner && t.hand.length>0);
}

function pollutionTargetIndices(owner){
  // 新版允许继续攻击已经被污染的目标：不会叠第二张污染，而是触发【引爆】令其摸1张并解除当前污染。
  return G.players.map((t,i)=>({t,i})).filter(o=>o.t!==owner && o.t.hand.length>0);
}

function aiChoosePollutionTarget(owner){ const choices=pollutionTargetIndices(owner); if(!choices.length)return null; const picked=aiScoredChoice(owner,choices,o=>{ const infected=o.t.hand.some(c=>c.polluted); let score=aiTargetScore(owner,o.t,"pressure"); if(infected)score+=12*aiProfile(owner).control; if(infected&&o.t.hand.length<=3)score+=20*aiProfile(owner).finish; return score; }); return picked?.i??null; }

function choosePollutionTarget(owner){
  return new Promise(resolve=>{
    const choices=pollutionTargetIndices(owner);
    if(!choices.length){resolve(null);return;}
    const sheet=$("sheet");
    setChoiceSheet(`<h3>污染 · 选择目标</h3><div class="small">未污染：随机污染1张暗牌；已有污染：改为【引爆】，目标效果摸1张并解除当前污染。</div>`);
    choices.forEach(({t,i})=>{
      const infected=t.hand.some(c=>c.polluted);
      const b=document.createElement("button");
      b.className="choice";
      b.textContent=`${t.name} · 手牌${t.hand.length}张 · ${infected?"☣ 已污染（引爆：摸1并解除）":"未污染（投放）"}`;
      b.onclick=()=>{closeModal();resolve(i)};
      sheet.appendChild(b);
    });
    openModal();
  });
}

async function resolvePollutionAfterSingle(owner){
  // 只奖励“正常回合主动打一张单牌”；额外回合的甩尾单牌不继续制造污染。
  if(owner.skill.id!=="pollution" || G.extraMode || owner.hand.length===0)return;
  const choices=pollutionTargetIndices(owner);
  if(!choices.length)return;

  let use=true;
  if(!owner.isAI){
    use=await askYesNo("污染 · 投放", "你刚在正常回合打出单牌。是否发动【污染】攻击一名其他玩家？");
  }
  if(!use)return;

  const targetIndex=owner.isAI?aiChoosePollutionTarget(owner):await choosePollutionTarget(owner);
  if(targetIndex===null || targetIndex===undefined)return;
  const target=G.players[targetIndex];
  const existing=target.hand.find(c=>c.polluted);

  if(existing){
    // 【引爆】：把潜伏的控制换成即时进攻。先解除现有污染，再令目标吃1张效果牌。
    existing.polluted=false;
    drawTo(target,1,"skill");
    log(`☣ ${owner.name} 引爆 ${target.name} 的【污染】：${target.name} 效果摸1张，当前污染解除。`);
    updateTrapArming();
    render();
    await showEventOverlay("penalty","污染引爆","【污染】",`${target.name} 的污染被引爆：额外摸1张，随后污染解除。`,1050);
    return;
  }

  const candidates=target.hand.filter(c=>!c.polluted);
  if(!candidates.length)return;
  const card=candidates[rand(candidates.length)];
  card.polluted=true;

  log(`☣ ${owner.name} 发动【污染】：${target.name} 的1张手牌被污染。`);
  render();
  if(typeof AudioSys!=="undefined" && targetIndex===0){
    AudioSys.SFX.pollution();
    AudioSys.FX.pollution();
  }

  const targetKnows=targetIndex===0;
  const desc=targetKnows
    ? `你的 ${card.rank}${card.suit} 被污染。把它作为单牌打出可以净化；若它进入大牌，可能破坏你的终结路线。`
    : `${target.name} 的1张手牌被污染；具体牌面只有持有者知道。`;
  await showEventOverlay("skill","污染投放","【污染】",desc,1050);
}

function scoreMove(p, move){
  let s=0;
  const n=move.cards.length;
  if(n>=4)s+=35+n*4; else if(move.type==="pair")s+=24; else s+=2;

  if(move.type==="single"){
    if(G.extraMode)s += 30;
    else if(p.hand.length<=4)s -= 50;
    else if(p.hand.length===5)s -= 18;
    else s += 3;
    const same=p.hand.filter(x=>x.rank===move.cards[0].rank).length;
    if(same>1)s-=20;
    if(!G.extraMode && p.skill.id==="pollution" && hasPollutionTarget(p))s+=26;
    if(move.cards[0].polluted)s+=62;
  }
  if(n>=4 && move.cards.some(x=>x.polluted) && (p.hand.length-n)>0)s-=75;
  if(p.skill.id==="artisan"){
    if(move.type==="pairrun")s+=22;
    if(move.type==="four")s+=15;
    if(move.type==="straight")s+=10;
    if(move.type==="fullhouse")s+=8;
  }
  const remain=p.hand.length-n;
  if(remain===1 && n>=4)s+=120;
  if(remain===2 && n>=4 && p.skill.id==="charge" && p.energy>=6)s+=100;
  return s;
}

function aiBestPlay(p){ const cands=enumerateCandidates(p); if(!cands.length)return null; const win=cands.find(c=>c.cards.length===p.hand.length); if(win)return win; const diff=aiDifficulty(p),profile=aiProfile(p),noise=Math.max(0,diff.scoreNoise||0)*Math.max(0.25,profile.variance||1); const ranked=cands.map(c=>({c,score:scoreMove(p,c)+aiMovePersonalityBias(p,c)+(Math.random()*2-1)*noise})).sort((a,b)=>b.score-a.score); let pick=ranked[0]; const window=Math.max(1,Math.min(ranked.length,diff.topChoices||1)); if(window>1&&Math.random()<clamp01(diff.mistakeRate||0))pick=ranked[rand(window)]; const passThreshold=4-(profile.aggression*8); if(pick?.c.type==="single"&&pick.score<passThreshold)return null; return pick?.c||null; }

let hintIndex=0;
let lastHintHand="";
function hint(){
  if(!G || G.current!==0 || G.phase!=="play" || G.gameOver)return;
  const p=G.players[0];
  const cands=enumerateCandidates(p);
  if(!cands.length){
    toast("没有可出的牌。");
    return;
  }

  // 按分值从高到低排序，让玩家优先看到“好牌”
  cands.sort((a,b)=>scoreMove(p,b)-scoreMove(p,a));

  const currentHandIds=p.hand.map(c=>c.id).sort().join(",");
  if(currentHandIds!==lastHintHand){
    hintIndex=0;
    lastHintHand=currentHandIds;
  }

  const move=cands[hintIndex % cands.length];
  selected.clear();
  for(const c of move.cards) selected.add(c.id);
  hintIndex++;
  render();
  if(typeof AudioSys!=="undefined") AudioSys.SFX.click();
}

function chooseLeastUsefulCard(p,arr=p.hand){
  const counts=rankCounts(p.hand);
  return [...arr].sort((a,b)=>{
    const ca=counts[a.rank], cb=counts[b.rank];
    if(ca!==cb)return ca-cb;
    return cardNeedScore(p,a)-cardNeedScore(p,b);
  })[0];
}

async function executePlay(p,cards,type){
  if(G.gameOver)return;
  const sourceRects=p===G.players[0]
    ? cards.map(card=>[...document.querySelectorAll("#hand .card")].find(el=>el.dataset.cardId===String(card.id))?.getBoundingClientRect()).filter(Boolean)
    : [];
  const pollutedInPlay=cards.some(c=>c.polluted);
  const ids=new Set(cards.map(c=>c.id));
  const targetIndex=G.players.indexOf(p);
  for(const c of cards) removeKnownFaceFromAllObservers(targetIndex,c);
  p.hand=p.hand.filter(c=>!ids.has(c.id));

  // 【扩散】：污染牌只有作为单牌打出才会被稳定净化；若它跟随非单牌组合离手，且仍有剩余手牌，污染随机转移。
  let pollutionSpread=false;
  if(pollutedInPlay && type!=="single" && p.hand.length>0 && !p.hand.some(c=>c.polluted)){
    const next=p.hand[rand(p.hand.length)];
    next.polluted=true;
    pollutionSpread=true;
    log(`☣ ${p.name} 未能净化污染：污染转移到其剩余的1张手牌。`);
  }

  log(`${p.name} 打出【${typeName(type)}】${cards.length}张：${cards.map(c=>c.rank+c.suit).join(" ")}。`, "action");
  selected.clear();
  G.lastPlay={name:p.name,type,cards:cards.map(c=>({rank:c.rank,suit:c.suit})),n:cards.length,playedAt:performance.now()};
  p.discards.push(...cards.map(c=>({rank:c.rank,suit:c.suit})));

  // 出牌音效 + 视觉
  if(typeof AudioSys!=="undefined"){
    AudioSys.playCardSound(type, cards);
    AudioSys.FX.cardFlight(cards,G.players.indexOf(p),sourceRects);
    AudioSys.FX.ripple();
    // 炸弹额外特效
    if(type==="four") AudioSys.FX.boom();
  }

  // 星石倍数：4张及以上牌型 ×2（类似炸弹翻倍）
  if(cards.length>=4){
    G.multiplier*=2;
    log(`💥 ${p.name} 打出【${typeName(type)}】${cards.length}张，倍数 ×2 → 当前 ${G.multiplier}×！`, "skill");
    if(typeof AudioSys!=="undefined"){
      AudioSys.SFX.multUp();
      AudioSys.FX.multUp(`倍数 ×${G.multiplier}`);
    }
  }

  // 【污染】只在自己的正常回合实际打出单牌后投放；若这张单牌已是最后一张，则直接进入胜利判定，不做无意义投放。
  if(p.skill.id==="pollution" && type==="single" && !G.extraMode && p.hand.length>0){
    await resolvePollutionAfterSingle(p);
    if(G.gameOver)return;
  }

  // 牌匠牌型附加效果
  if(p.skill.id==="artisan"){
    await resolveArtisanEffect(p,type);
  }

  // 4张及以上合法牌型先产生额外回合，再经过所有“获得额外回合”响应。
  // 若牌型里带有污染牌，只取消这一手牌型自带的“基础额外回合”；技能/场地来源不受影响。
  let extraCount=0;
  const baseExtraWouldTrigger=cards.length>=4 && canBaseExtraTrigger(p);
  if(baseExtraWouldTrigger && pollutedInPlay){
    log(`☣ ${p.name} 打出的【${typeName(type)}】含污染牌：本次牌型的基础额外回合被取消。`);
    render();
    const spreadText=pollutionSpread?" 污染同时扩散到了剩余手牌。":"";
    await showEventOverlay("penalty","污染爆发","【污染】",`${p.name} 的这手大牌含污染牌，基础额外回合被取消。${spreadText}`,1000);
  }else if(baseExtraWouldTrigger){
    extraCount+=1;
  }
  if(p.skill.id==="artisan" && type==="pairrun") extraCount+=1;

  if(pollutionSpread && cards.length<4){
    render();
    if(G.players.indexOf(p)===0) toast("☣ 污染未净化，已扩散到另一张手牌");
  }

  if(extraCount>0) await grantExtraTurns(p,extraCount,"牌型");

  updateTrapArming();
  render();

  // 所有效果结算后才判断是否真正清空
  if(p.hand.length===0){
    win(p); return;
  }
  await finishTurn();
}

function typeName(t){
  return ({single:"单牌",pair:"对子",four:"四条",triple1:"三带一",fullhouse:"葫芦",straight:"顺子",pairrun:"连对"})[t]||t;
}
function canBaseExtraTrigger(p){
  if(!G.extraMode)return true;
  if(fieldActive("chain"))return true;
  if(p.skill.id==="overload")return true;
  if(p.skill.id==="charge" && p.energy>=4)return true;
  return false;
}


function aiTrapShouldDraw(owner){ const profile=aiProfile(owner),diff=aiDifficulty(owner); if(owner.hand.length<=2)return true; const base=owner.hand.length<=4?0.72:owner.hand.length<=6?0.46:0.18; return Math.random()<clamp01(base*profile.resource*(diff.skillFactor||1)); }

function aiTrapShouldDiscard(owner){ if(owner.hand.length===0||owner.hand.length<=2)return false; const counts=rankCounts(owner.hand),loose=owner.hand.some(c=>(counts[c.rank]||0)===1),profile=aiProfile(owner); if(owner.hand.length>=7)return true; const chance=(loose?0.66:0.28)*(0.65+profile.combo*0.35); return Math.random()<clamp01(chance); }

async function resolveTrapOwnerAdjustment(owner){
  let didDraw=false, didDiscard=false, discardedCard=null;

  if(owner.isAI) await aiThink();

  // “是否摸1张”和“是否弃1张”是两个相互独立的选择。
  let chooseDraw;
  if(owner.isAI) chooseDraw=aiTrapShouldDraw(owner);
  else chooseDraw=await askYesNo("截胡 · 自我调整", "【截胡】处罚已触发。你是否让自己额外摸1张？");

  if(chooseDraw){
    drawTo(owner,1,"skill");
    didDraw=true;
    log(`${owner.name} 借【截胡】效果选择摸1张。`);
    updateTrapArming();
  }

  if(owner.hand.length>0){
    let chooseDiscard;
    if(owner.isAI) chooseDiscard=aiTrapShouldDiscard(owner);
    else chooseDiscard=await askYesNo("截胡 · 自我调整", "你是否再弃1张手牌？");

    if(chooseDiscard){
      if(owner.isAI){
        discardedCard=chooseLeastUsefulCard(owner);
      }else{
        discardedCard=await chooseDiscardCard(owner);
      }
      if(discardedCard){
        const ownerIndex=G.players.indexOf(owner);
        removeKnownFaceFromAllObservers(ownerIndex,discardedCard);
        owner.hand=owner.hand.filter(c=>c.id!==discardedCard.id);
        didDiscard=true;
        log(`${owner.name} 借【截胡】效果弃掉 ${discardedCard.rank}${discardedCard.suit}。`);
      }
    }
  }

  render();

  const parts=[];
  if(didDraw)parts.push("摸1张");
  if(didDiscard)parts.push(`弃1张（${discardedCard.rank}${discardedCard.suit}）`);
  if(!parts.length)parts.push("不进行额外调整");

  await showEventOverlay(
    "skill",
    "截胡者调整",
    `【${owner.name}】`,
    parts.join("；"),
    950
  );

  // 这里是技能弃牌，不属于场地“强制清仓”。
  // 若截胡者因此清空手牌，按当前“清空即胜利”的总规则判胜。
  if(owner.hand.length===0){
    win(owner);
    return true;
  }
  return false;
}




function aiResonanceShouldDiscard(owner){ if(owner.hand.length===0)return false; const counts=rankCounts(owner.hand),profile=aiProfile(owner); const loose=owner.hand.filter(c=>(counts[c.rank]||0)===1); if(owner.hand.length>=7)return true; if(loose.length&&owner.hand.length>=3)return Math.random()<clamp01(0.62+profile.combo*0.18); return Math.random()<clamp01(0.12+profile.aggression*0.12); }

async function resolveResonanceOwnerDiscard(owner){
  if(owner.hand.length===0)return false;

  let doDiscard;
  if(owner.isAI){
    await aiThink();
    doDiscard=aiResonanceShouldDiscard(owner);
  }else{
    doDiscard=await askYesNo(
      "共振 · 回响",
      "你获得了额外回合。其他玩家已各摸1张，你是否再弃1张手牌？"
    );
  }

  if(!doDiscard){
    log(`${owner.name} 放弃了【共振】的弃牌。`);
    return false;
  }

  let card;
  if(owner.isAI){
    card=chooseLeastUsefulCard(owner);
  }else{
    card=await chooseDiscardCard(owner);
  }

  if(!card)return false;

  const ownerIndex=G.players.indexOf(owner);
  removeKnownFaceFromAllObservers(ownerIndex,card);
  owner.hand=owner.hand.filter(c=>c.id!==card.id);

  log(`${owner.name} 发动【共振】：弃掉 ${card.rank}${card.suit}。`);
  render();

  await showEventOverlay(
    "skill",
    "共振 · 回响",
    "【共振】",
    `${owner.name} 在令其他玩家各摸1张后，弃掉了1张牌。`,
    900
  );

  if(owner.hand.length===0){
    win(owner);
    return true;
  }
  return false;
}

async function grantExtraTurns(p,count,source){
  for(let k=0;k<count;k++){
    // 场地直接赠送的额外回合不触发【截胡】；牌型与技能来源照常。
    const trapEligible=!String(source||"").startsWith("场地");
    if(trapEligible) for(const owner of G.players){
      if(owner.skill.id!=="trap")continue;
      const st=G.trapStates[owner.name];
      if(owner===p) continue; // 自己获得额外回合时，不会触发自己的【截胡】
      if(st && st.armed && st.cooldown===0){
        drawTo(p,2,"penalty");
        st.armed=false; st.cooldown=5;
        log(`⚠ ${owner.name} 的【截胡】触发：${p.name} 在获得额外回合前摸2张。`);
        render();
        await showEventOverlay(
          "penalty",
          "处罚技能触发",
          "【截胡】",
          `${p.name} 在获得额外回合前被塞入2张牌！`,
          1250
        );
        updateTrapArming();

        const ownerWon=await resolveTrapOwnerAdjustment(owner);
        if(ownerWon || G.gameOver)return;
      }
    }

    if(G.gameOver)return;

    // 共振：每一个“获得额外回合”事件分别结算一次。
    for(const owner of G.players){
      if(owner.skill.id!=="resonance")continue;

      if(owner===p){
        // 自己起势：全场其他玩家各被塞1张，然后自己可以弃1张。
        for(const other of G.players){
          if(other!==p) drawTo(other,1,"skill");
        }
        log(`${owner.name} 的【共振】：自己获得额外回合，其他所有玩家各摸1张。`);
        updateTrapArming();
        render();

        const resonanceWon=await resolveResonanceOwnerDiscard(owner);
        if(resonanceWon || G.gameOver)return;
      }else{
        // 别人起势：自己必须被动摸1张，不能拒绝。
        drawTo(owner,1,"skill");
        log(`${owner.name} 的【共振】：因 ${p.name} 获得额外回合，被迫摸1张。`);
        updateTrapArming();
        render();
      }
    }

    p.extraTurns++;
    log(`${p.name} 获得1个额外回合（来源：${source}）。`);
    updateTrapArming();
    // 额外回合音效 + 视觉（只在人类玩家或明显触发时播放）
    if(typeof AudioSys!=="undefined" && !p.isAI){
      AudioSys.SFX.extraTurn();
      AudioSys.FX.extraTurn();
    }
  }
}

async function resolveArtisanEffect(p,type){
  if(type==="triple1"){
    const t=p.isAI?aiChooseDrawTarget(p,true):await chooseTarget("三带一：指定1名玩家摸1张",true);
    drawTo(G.players[t],1,"skill"); log(`【牌匠·三带一】${G.players[t].name} 摸1张。`);
    render();
    await showEventOverlay("penalty","牌型处罚","【三带一】",`${G.players[t].name} 被指定额外摸1张。`,1050);
  }else if(type==="fullhouse"){
    let ts;
    if(p.isAI){
      ts=aiChooseTargets(p,2,{allowSelf:false,purpose:"pressure"});
    }else ts=await chooseTwoTargets("葫芦：指定2名玩家各摸1张");
    for(const t of ts)drawTo(G.players[t],1,"skill");
    log(`【牌匠·葫芦】${ts.map(i=>G.players[i].name).join("、")} 各摸1张。`);
    render();
    await showEventOverlay("penalty","牌型处罚","【葫芦】",`${ts.map(i=>G.players[i].name).join("、")} 各被塞入1张牌。`,1100);
  }else if(type==="straight"){
    for(const o of G.players)if(o!==p)drawTo(o,1,"skill");
    log(`【牌匠·顺子】其他所有玩家各摸1张。`);
    render();
    await showEventOverlay("penalty","牌型处罚","【顺子】","除出牌者外，其他所有玩家各摸1张。",1150);
  }else if(type==="four"){
    const t=p.isAI?aiChooseThreatTarget(p):await chooseTarget("四条：指定1名玩家下个正常回合跳过出牌阶段",false);
    G.players[t].skipPlay=true;
    log(`【牌匠·四条】${G.players[t].name} 下个正常回合将跳过出牌阶段。`);
    render();
    await showEventOverlay("penalty","强制控制","【四条】",`${G.players[t].name} 下个正常回合将跳过出牌阶段。`,1250);
  }
  updateTrapArming();
}

function aiChooseThreatTarget(p){ return aiChooseTargets(p,1,{purpose:"control"})[0]; }
function aiChooseDrawTarget(p,allowSelf){ return aiChooseTargets(p,1,{allowSelf,purpose:"draw"})[0]; }

function updateTrapArming(){
  for(const owner of G.players){
    if(owner.skill.id!=="trap")continue;
    const st=G.trapStates[owner.name];
    if(!st)continue;

    // 【截胡】是限制别人的技能：只有“其他玩家”手牌>4才会使它待触发。
    const anyOtherOver4=G.players.some(p=>p!==owner && p.hand.length>4);

    if(st.cooldown===0 && anyOtherOver4 && !st.armed){
      st.armed=true; st.everActivated=true;
      log(`${owner.name} 的【截胡】进入待触发状态。`, "skill");
    }
  }
}
function tickTrapCooldowns(){
  for(const owner of G.players){
    if(owner.skill.id!=="trap")continue;
    const st=G.trapStates[owner.name];
    if(st && st.cooldown>0){
      st.cooldown--;
      if(st.cooldown===0){
        st.armed=false;
        log(`${owner.name} 的【截胡】冷却结束；若其他玩家有人手牌>4，将重新待触发。`, "skill");
        updateTrapArming();
      }
    }
  }
}

async function finishTurn(){
  if(G.gameOver)return;
  const p=currentPlayer();

  // 充能8对应的“该额外回合结束后-4”
  if(G.extraMode && p.skill.id==="charge" && p.chargeBurstExtraPending>0){
    p.chargeBurstExtraPending--;
    p.energy=Math.max(0,p.energy-4);
    p.chargeBurstQueued=false;
    log(`${p.name} 的8点充能额外回合结束：充能 -4（现为${p.energy}）。`, "skill");
  }

  // 强制清仓只在正常回合结束时触发
  if(!G.extraMode && fieldActive("discard") && p.hand.length>0){
    const card = p.isAI ? chooseLeastUsefulCard(p) : await chooseDiscardCard(p);
    if(!card){
      log(`【强制清仓】${p.name} 无牌可弃，跳过。`, "field");
    }else{
      const wasOne=p.hand.length===1;
      removeKnownFaceFromAllObservers(G.players.indexOf(p),card);
      p.hand=p.hand.filter(c=>c.id!==card.id);
      log(`【强制清仓】${p.name} 弃掉 ${card.rank}${card.suit}。`, "field");
      render();
      await showEventOverlay("penalty","场地处罚","【强制清仓】",`${p.name} 回合结束，被迫弃掉1张牌。`,900);
      if(wasOne){
        drawTo(p,1,"field");
        log(`因弃牌不能直接获胜，${p.name} 立即摸1张。`, "field");
      }
    }
  }

  // 占卜：自己的正常回合真正结束时，秘密查看其余玩家各1张随机暗牌
  if(!G.extraMode && p.skill.id==="divine"){
    await resolveDivinationIntel(p);
  }

  render();
  if(p.hand.length===0){win(p);return}

  // 【骰命·6】在“本正常回合结束后”才真正获得额外回合，
  // 因此此刻才会进入【截胡】/【共振】等“获得额外回合”响应链。
  if(!G.extraMode && p.skill.id==="dice" && p.diceExtraPending){
    p.diceExtraPending=false;
    await grantExtraTurns(p,1,"骰命");
    if(G.gameOver)return;
  }

  // 【加时赛】只在正常回合结束时登记一次。
  // 不立刻 grant，是为了让这个正常回合原本已经获得的大牌/技能额外回合先结算。
  if(!G.extraMode && fieldActive("overtime")){
    p.fieldExtraPending=true;
    log(`【加时赛】${p.name} 的场地额外回合已排队，将在本回合其他额外回合结算完后获得。`);
  }

  if(p.extraTurns>0){
    p.extraTurns--;
    await sleep(p.isAI?320:80);
    startTurn(true);
    return;
  }

  // 如果正常回合处于【加时赛】，并且此前由大牌/技能获得的额外回合已经全部打完，
  // 此时才真正获得场地送出的那个额外回合。
  if(p.fieldExtraPending){
    p.fieldExtraPending=false;

    await showEventOverlay(
      "field",
      "场地效果触发",
      "【加时赛】",
      `${p.name} 的其他额外回合已结算完毕，现在获得1个场地额外回合。`,
      900
    );

    await grantExtraTurns(p,1,"场地·加时赛");
    if(G.gameOver)return;

    if(p.extraTurns>0){
      p.extraTurns--;
      await sleep(p.isAI?320:80);
      startTurn(true);
      return;
    }
  }

  // 进入下一正常座位
  G.extraMode=false;
  G.current=(G.current+1)%G.players.length;
  G.normalSeat++;
  if(G.normalSeat>=G.players.length){
    G.normalSeat=0;
    await endRound();
  }
  startTurn(false);
}

async function endRound(){
  if(G.field && G.fieldRoundsLeft>0){
    G.fieldRoundsLeft--;
    if(G.fieldRoundsLeft===0){
      log(`场地【${G.field.name}】结束。`);
      G.field=null;
    }
  }
  if(G.round%MATCH_RULES.fieldEveryRounds===0){
    await drawField();
  }
  G.round++;
}

async function drawField(){
  let pool=FIELDS.filter(f=>!G.fieldHistory.slice(-2).includes(f.id));
  const f=pool[rand(pool.length)];
  G.field={...f}; G.fieldRoundsLeft=f.dur; G.fieldHistory.push(f.id);
  log(`🌐 新场地【${f.name}】生效：${f.desc}`, "field");
  render();
  if(typeof AudioSys!=="undefined") AudioSys.SFX.fieldChange();
  await showEventOverlay("field","场地规则变更",`【${f.name}】`,f.desc,1550);
}

function win(p){
  G.gameOver=true; G.phase="结束"; render();
  const winIdx=G.players.indexOf(p);
  const losers=G.players.filter(x=>x!==p);
  const unit=G.baseBet*G.multiplier;
  const houseFee=Math.round(unit*0.1);
  const settlements=new Map();
  let winnerGain=0;
  let totalFeeCollected=0;
  // 结算：赢家只获得对手实际支付的底注；手续费单独回收，避免旧逻辑额外再从赢家收益里扣一次手续费。
  for(const x of losers){
    const xi=G.players.indexOf(x);
    const available=Math.max(0,beanBalances[xi]);
    const basePaid=Math.min(unit,available);
    const feePaid=Math.min(houseFee,Math.max(0,available-basePaid));
    const paid=basePaid+feePaid;
    beanBalances[xi]=available-paid;
    x.beans=beanBalances[xi];
    winnerGain+=basePaid;
    totalFeeCollected+=feePaid;
    settlements.set(x,{paid,basePaid,feePaid});
  }
  beanBalances[winIdx]+=winnerGain;
  p.beans=beanBalances[winIdx];
  const balanceSaved=saveBeanBalances();
  renderStoredBalance();
  log(`🏆 ${p.name} 清空手牌，获胜！底注 ${G.baseBet} × 倍数 ${G.multiplier}× = ${unit} 星石/人`, p.isAI ? "lose" : "win");
  log(`💰 ${p.name} 获得 ${winnerGain} 星石；系统实际回收手续费 ${totalFeeCollected} 星石。`, p.isAI ? "lose" : "win");
  // 结算音效 + 视觉
  if(typeof AudioSys!=="undefined"){
    if(p.isAI){
      AudioSys.SFX.lose();
      AudioSys.FX.lose();
      AudioSys.VO.lose();
    }else{
      AudioSys.SFX.win();
      AudioSys.FX.win();
      AudioSys.VO.win();
    }
    setTimeout(()=>{
      AudioSys.SFX.coins();
      if(!p.isAI) AudioSys.FX.coins(winnerGain);
    }, 500);
  }
  // 结算面板
  let rows=G.players.map((x,i)=>{
    const isWin=x===p;
    const paid=settlements.get(x)?.paid||0;
    const delta=isWin?`+${winnerGain}`:`-${paid}`;
    const cls=isWin?"win":"lose";
    return `<div class="settle-row ${cls}"><span class="name">${isWin?"🏆 ":""}${x.name}</span><span style="color:#aaa;font-size:12px">${beanBalances[i]} 🔮</span><span class="delta">${delta} 🔮</span></div>`;
  }).join("");
  const humanWon=!p.isAI;
  showInfo("游戏结束 · 星石结算", `<div class="settle-hero ${humanWon?"victory":"defeat"}">
      <div class="settle-eyebrow">${humanWon?"VICTORY":"RESULT"}</div>
      <div class="settle-title">${humanWon?"🏆 胜利":"本局惜败"}</div>
      <div class="settle-sub">${humanWon?"你已清空手牌，拿下本局":`🏆 ${p.name} 率先清空手牌`}</div>
    </div>
    <div class="center" style="margin:6px 0 2px;color:#e9c9a0;font-size:13px">${G.room?.name||"牌局"} · 底注 ${G.baseBet} × 倍数 ${G.multiplier}× = ${unit} 星石/人</div>
    <div style="margin:8px 0">${rows}</div>
    <div class="small center" style="color:${balanceSaved?"#9fbfaa":"#ffb0b0"}">${balanceSaved?"余额已自动保存，重新打开游戏仍会延续":"当前环境无法保存余额，请保持页面开启"} · 系统本局实际回收 ${totalFeeCollected} 星石手续费</div>
    <div class="settle-actions">
      <button class="btn btn-play" onclick="replayGame()">再来一局</button>
      <button class="btn btn-sort" onclick="returnToStart()">返回首页</button>
    </div>`);
}

let lastRenderedPhase="";
let lastRenderedPlayToken=0;
function render(){
  if(!G)return;
  const table=document.querySelector(".table");
  const phaseKey=`${G.current}:${G.phase}:${G.extraMode?1:0}`;
  if(table){
    table.classList.toggle("human-turn",G.current===0&&G.phase==="play"&&!G.gameOver);
    if(phaseKey!==lastRenderedPhase){
      table.classList.remove("phase-change");
      void table.offsetWidth;
      table.classList.add("phase-change");
    }
  }
  lastRenderedPhase=phaseKey;
  $("roundNo").textContent=G.round;
  const roomBadge=$("roomBadge"); if(roomBadge)roomBadge.textContent=`${G.room?.name||"普通场"} · AI ${G.room?.ai?.label||"标准"}`;
  $("fieldName").textContent=G.field?`${G.field.name}（剩${G.fieldRoundsLeft}轮）`:"无场地";
  $("fieldDesc").textContent=G.field?G.field.desc:fieldScheduleText();
  const mb=$("multNum"); if(mb){mb.textContent=G.multiplier;}
  const p=currentPlayer();
  $("turnText").textContent=(G.extraMode?"额外回合 · ":"")+p.name;
  $("phaseText").textContent=G.phase==="play"?"出牌":G.phase==="draw"?"摸牌":G.phase;

  const lp=$("lastPlay");
  if(G.lastPlay){
    const isNewPlay=G.lastPlay.playedAt!==lastRenderedPlayToken;
    lp.classList.toggle("impact",isNewPlay);
    lp.innerHTML=`<div class="lp-tag">${G.lastPlay.name} · ${typeName(G.lastPlay.type)}（${G.lastPlay.n}张）</div>
      <div class="lp-cards">${G.lastPlay.cards.map((c,i)=>`<div class="lp-card ${isRed(c.suit)?"red":""} ${isNewPlay?"just-played":""}" style="--land-rot:${(i-(G.lastPlay.cards.length-1)/2)*4}deg;animation-delay:${i*35}ms"><span class="rank">${c.rank}</span><span class="suit">${c.suit}</span></div>`).join("")}</div>`;
    lastRenderedPlayToken=G.lastPlay.playedAt;
  }else{
    lp.classList.remove("impact");
    lp.innerHTML=`<div class="lp-empty">等待出牌…</div>`;
  }

  const wrap=$("players"); wrap.innerHTML="";
  G.players.forEach((x,i)=>{
    const d=document.createElement("div");
    d.className="player"+(i===G.current&&!G.gameOver?" active":"")+(i===0?" me":"")+(expIntel.has(i)?" exp-intel":"");
    let extra=`<div class="beans">🔮 ${x.beans} 星石</div>`;
    if(x.skill.id==="dice")extra+=`<div class="energy">🎲 本回合骰点：${x.diceValue??"待投"}</div>`;
    if(x.skill.id==="charge")extra+=`<div class="energy">⚡ 充能：${x.energy}</div>`;
    if(x.skill.id==="barrier")extra+=`<div class="energy">🔷 结界：${barrierStatusText(x)}</div>`;
    if(x.skill.id==="trap"){
      const st=G.trapStates[x.name];
      extra+=`<div class="energy">🪤 截胡：${st?.armed?"待触发":st?.cooldown?`冷却${st.cooldown}`:"未激活"}</div>`;
    }
    const pollutionCount=x.hand.filter(c=>c.polluted).length;
    if(pollutionCount)extra+=`<div class="pollution-status">☣ 污染：${pollutionCount}张</div>`;
    const rev=x.hand.filter(c=>c.revealed);
    let privateIntel="";
    if(i===0 && x.skill.id==="divine"){
      const lines=[];
      for(let ti=1;ti<G.players.length;ti++){
        const target=G.players[ti];

        // 私人占卜得到的实体牌
        const privateCards=knownCardsFor(x,ti);

        // 所有通过【明牌】等方式已经公开的牌，自动加入占卜情报堆
        const publicCards=target.hand.filter(c=>c.revealed);

        // 按实体牌ID去重：如果原本占卜过，后来又明牌，只显示一次，并升级为金色公开状态
        const merged=new Map();
        for(const c of privateCards) merged.set(c.id,{card:c,public:c.revealed});
        for(const c of publicCards) merged.set(c.id,{card:c,public:true});

        const groups={};
        for(const {card,public:pub} of merged.values()){
          const key=`${faceKey(card)}|${pub?"public":"private"}`;
          groups[key]=(groups[key]||0)+1;
        }

        const text=Object.entries(groups).map(([key,n])=>{
          const parts=key.split("|");
          const rank=parts[0], suit=parts[1], state=parts[2];
          const cls=state==="public"?"intel-public":"intel-private";
          return `<span class="${cls}">${rank}${suit}${n>1?`×${n}`:""}</span>`;
        }).join("、");

        lines.push(`<div>${target.name}：${text||"暂无"}</div>`);
      }
      privateIntel=`<div class="intel-row"><span class="sk-chip">🔮 占卜情报</span></div>
      <div class="intel-body">
        <div class="known-title">仅你可见</div>
        ${lines.join("")}
        <div class="intel-legend"><span class="intel-public">金色</span> = 已公开 / 明牌；普通颜色 = 仅你占卜得知</div>
      </div>`;
    }
    const avatar=x.avatar||AVATARS[i]||PLAYER_AVATAR;
    d.innerHTML=`<div class="avatar"><div class="face" style="background-image:url('${avatar}')"></div><div class="meta"><div class="name">${x.name}</div><div class="count">${x.hand.length}<span class="small">张</span></div><div class="skill-row"><span class="sk-chip">${x.skill.name}</span></div></div></div>
      ${extra}
      ${rev.length?`<div class="revealed">明牌：${rev.slice(-5).map(c=>c.rank+c.suit).join(" ")}${rev.length>5?` · +${rev.length-5}`:""}</div>`:""}
      ${privateIntel}
      ${x.discards.length?`<div class="discards"><span class="disc-label">出过</span>${x.discards.slice(-5).map(c=>`<div class="d-card ${isRed(c.suit)?"red":""}"><span class="dr">${c.rank}</span><span class="ds">${c.suit}</span></div>`).join("")}</div>`:""}`;
    wrap.appendChild(d);
  });
  wrap.onclick=ev=>{
    const tgt=ev.target.closest(".sk-chip,.skname"); if(!tgt)return;
    const seat=tgt.closest(".player"); if(!seat)return;
    const idx=[...wrap.children].indexOf(seat);
    const isIntel=!!tgt.closest(".intel-row");
    if(isIntel){
      const set=expIntel, cls="exp-intel";
      if(set.has(idx)){set.delete(idx);seat.classList.remove(cls)}else{set.add(idx);seat.classList.add(cls)}
    }else{
      const p=G.players[idx];
      showSkillDetail(p.skill.name,p.skill.desc);
    }
  };

  const hand=$("hand");hand.innerHTML="";
  G.players[0].hand.forEach(c=>{
    const div=document.createElement("div");
    div.className=`card ${isRed(c.suit)?"red":""} ${selected.has(c.id)?"selected":""} ${c.revealed?"faceup":""} ${c.polluted?"polluted":""}`;
    div.dataset.cardId=String(c.id);
    div.innerHTML=`<span class="rank">${c.rank}</span><span class="suit">${c.suit}</span>`;
    div.onclick=()=>{
      if(G.current!==0||G.phase!=="play"||G.gameOver)return;
      selected.has(c.id)?selected.delete(c.id):selected.add(c.id);render();
    };
    hand.appendChild(div);
  });

  const mine=G.players[0];
  const chosen=mine.hand.filter(c=>selected.has(c.id));
  const cl=classify(chosen,mine);
  $("selectionText").textContent=chosen.length?(cl.ok?`已选 ${chosen.length} 张：${cl.name}`:`已选 ${chosen.length} 张：${cl.msg}`):"选择手牌后出牌。";

  const canHuman=G.current===0 && G.phase==="play" && !G.gameOver;
  $("playBtn").disabled=!canHuman || !cl.ok;
  $("hintBtn").disabled=!canHuman;
  $("passBtn").disabled=!canHuman;
  $("sortBtn").disabled=G.gameOver;
  const canReveal=canHuman && mine.skill.id==="reveal" && !mine.revealUsed && mine.hand.some(c=>!c.revealed);
  const canBarrier=canHuman && mine.skill.id==="barrier" && !G.extraMode && mine.barrierCanCast;
  $("skillBtn").disabled=!(canReveal||canBarrier);
  $("skillBtn").textContent=mine.skill.id==="reveal"?"发动【明牌】":
    mine.skill.id==="barrier"?(mine.barrierCanCast?"施放【结界】":`【结界】${barrierStatusText(mine)}`):
    mine.skill.id==="pollution"?"【污染】单牌后攻击":"无主动出牌技能";
}
function isRed(s){return s==="♥"||s==="♦"}
function cardHTML(c,selectedFlag){
  return `<div class="card ${isRed(c.suit)?"red":""} ${selectedFlag?"selected":""} ${c.polluted?"polluted":""}"><span class="rank">${c.rank}</span><span class="suit">${c.suit}</span></div>`;
}

function skillPickerSummary(skill){
  if(!skill)return "每局从技能池随机获得1个技能";
  const m=skill.desc.match(/<div class=['"]sk-sum['"]>([\s\S]*?)<\/div>/i);
  if(!m)return "点击选择这个技能";
  const box=document.createElement("div");
  box.innerHTML=m[1];
  return (box.textContent||"").trim();
}

function updateSkillPickerTrigger(){
  const sel=$("skillSelect");
  const name=$("skillPickerName");
  const hint=$("skillPickerHint");
  if(!sel||!name||!hint)return;
  if(sel.value==="random"){
    name.textContent="🎲 随机技能";
    hint.textContent="开局时随机获得1个技能";
    return;
  }
  const skill=SKILLS.find(x=>x.id===sel.value);
  name.textContent=skill?`✦ ${skill.name}`:"🎲 随机技能";
  hint.textContent=skill?skillPickerSummary(skill):"开局时随机获得1个技能";
}

function populateSkillSelect(){
  const sel=$("skillSelect");
  if(!sel)return;
  sel.innerHTML=`<option value="random">随机技能</option>` + SKILLS.map(s=>`<option value="${s.id}">${s.name}</option>`).join("");
  sel.value="random";
  updateSkillPickerTrigger();
}

function chooseLobbySkill(skillId){
  const sel=$("skillSelect");
  if(!sel)return;
  sel.value=skillId==="random"?"random":(SKILLS.some(x=>x.id===skillId)?skillId:"random");
  updateSkillPickerTrigger();
  closeModal();
}

function showSkillPicker(){
  _modalIsChoice=false;
  $("modal").classList.remove("info-modal");
  $("sheet").className="sheet";
  const current=$("skillSelect")?.value||"random";
  const skillCards=SKILLS.map(skill=>{
    const selected=current===skill.id;
    return `<button type="button" class="skill-pick-card ${selected?"selected":""}" data-pick-skill="${skill.id}">
      <div class="skill-pick-title">
        <span>✦ ${skill.name}</span>
        <span class="check">${selected?"已选择":""}</span>
      </div>
      <div class="skill-pick-desc">${skillPickerSummary(skill)}</div>
    </button>`;
  }).join("");

  const randomSelected=current==="random";
  const sheet=$("sheet");
  sheet.innerHTML=`
    <div class="skill-pick-head">
      <h3>选择本局技能</h3>
      <button id="skillPickClose" style="padding:7px 10px">关闭</button>
    </div>
    <div class="skill-pick-sub">技能在开局前确定；AI会从剩余技能中随机获得不同技能。</div>
    <div class="skill-pick-grid">
      <button type="button" class="skill-pick-card random ${randomSelected?"selected":""}" data-pick-skill="random">
        <div class="skill-pick-title">
          <span>🎲 随机技能</span>
          <span class="check">${randomSelected?"已选择":""}</span>
        </div>
        <div class="skill-pick-desc">不指定技能，进入牌桌时从全部技能中随机获得1个。</div>
      </button>
      ${skillCards}
    </div>
    <div class="skill-pick-foot"><button id="skillPickCancel" class="choice" style="width:auto;padding:9px 22px">取消</button></div>
  `;
  sheet.querySelector("#skillPickClose").onclick=closeModal;
  sheet.querySelector("#skillPickCancel").onclick=closeModal;
  sheet.querySelectorAll("[data-pick-skill]").forEach(btn=>{
    btn.onclick=()=>chooseLobbySkill(btn.dataset.pickSkill);
  });
  openModal();
}

populateSkillSelect();
ensureLogDrawerPortal();

$("playBtn").onclick=async()=>{
  if(!G||G.current!==0||G.phase!=="play")return;
  const p=G.players[0], cards=p.hand.filter(c=>selected.has(c.id));
  const cl=classify(cards,p);
  if(!cl.ok){toast(cl.msg);return}
  await executePlay(p,cards,cl.type);
};
$("hintBtn").onclick=hint;
$("passBtn").onclick=async()=>{
  if(!G||G.current!==0||G.phase!=="play")return;
  if(typeof AudioSys!=="undefined"){
    AudioSys.SFX.pass();
    AudioSys.VO.pass();
  }
  log("你选择不出。", "action"); selected.clear(); await finishTurn();
};
$("sortBtn").onclick=()=>{
  if(!G)return;
  G.players[0].hand.sort((a,b)=>RANK_VALUE[a.rank]-RANK_VALUE[b.rank] || SUITS.indexOf(a.suit)-SUITS.indexOf(b.suit));
  render();
};
$("skillBtn").onclick=async()=>{
  if(!G||G.current!==0||G.phase!=="play")return;
  const p=G.players[0];

  if(p.skill.id==="barrier"){
    if(G.extraMode||!p.barrierCanCast)return;
    await humanActivateBarrier(p);
    render();
    return;
  }

  if(p.skill.id!=="reveal"||p.revealUsed)return;
  const options=p.hand.filter(c=>!c.revealed);
  const cardId=await chooseCardFromList("选择要公开的一张牌",options);
  if(!cardId)return;
  const c=p.hand.find(x=>x.id===cardId);
  // 明牌不会从占卜情报中移除；占卜区会自动把公开牌标成金色。
  c.revealed=true;p.revealUsed=true;
  const t=await chooseTarget("选择一名玩家摸1张（可以选自己）",true);
  drawTo(G.players[t],1,"skill");
  log(`你公开 ${c.rank}${c.suit}，令 ${G.players[t].name} 摸1张。`);
  updateTrapArming();render();
  await showEventOverlay("skill","技能发动","【明牌】",`你公开 ${c.rank}${c.suit}，并令 ${G.players[t].name} 额外摸1张。`,900);
};
function returnToStart(){
  clearTimeout(aiTimer);
  G=null;
  selected.clear();
  closeModal();
  $("game").classList.add("hidden");
  $("startPanel").classList.remove("hidden");
  syncLobbyMode();
  renderStoredBalance();
}

function replayGame(){
  closeModal();
  newGame();
}

$("restartBtn").onclick=returnToStart;
$("skillPickerBtn").onclick=showSkillPicker;
document.querySelectorAll(".room-card[data-room]").forEach(card=>{
  card.onclick=()=>{
    const room=ROOMS[card.dataset.room];
    if(!room)return;
    if(beanBalances[0]<room.minBalance){
      toast(`星石不足：进入【${room.name}】至少需要 ${room.minBalance.toLocaleString("zh-CN")}。`);
      return;
    }
    selectedRoomId=room.id;
    newGame(room.id);
  };
});
$("rulesBtn").onclick=()=>showRules();
$("codexBtn").onclick=()=>showCodex("skills");
$("logToggleBtn").onclick=()=>$("logDrawer").classList.toggle("show");
$("logCloseBtn").onclick=()=>$("logDrawer").classList.remove("show");
$("modal").addEventListener("click",ev=>{if(ev.target===$("modal")&&!_modalIsChoice)closeModal()});

function sortHandCards(cards){
  return [...cards].sort((a,b)=>RANK_VALUE[a.rank]-RANK_VALUE[b.rank] || SUITS.indexOf(a.suit)-SUITS.indexOf(b.suit));
}

function choiceContextHtml(){
  if(!G || !G.players || !G.players[0])return "";
  const me=G.players[0];
  const cards=sortHandCards(me.hand);
  const handHtml=cards.length
    ? cards.map(c=>`<div class="choice-mini-card ${isRed(c.suit)?"red":""} ${c.polluted?"polluted":""}">
        <span>${c.rank}</span><span class="mini-suit">${c.suit}</span>
      </div>`).join("")
    : `<div class="small">当前手牌为空。</div>`;

  return `<div class="choice-context">
    <div class="choice-context-tools">
      <button type="button" class="choice-context-btn" data-choice-hand>
        我的手牌（${me.hand.length}）
      </button>
      <button type="button" class="choice-context-btn" data-choice-log>
        查看日志
      </button>
    </div>
    <div class="choice-hand-panel" data-choice-hand-panel>
      <div class="choice-hand-title">当前自己的完整手牌</div>
      <div class="choice-mini-hand">${handHtml}</div>
    </div>
  </div>`;
}

function bindChoiceContext(){
  const sheet=$("sheet");
  const handBtn=sheet.querySelector("[data-choice-hand]");
  const handPanel=sheet.querySelector("[data-choice-hand-panel]");
  const logBtn=sheet.querySelector("[data-choice-log]");

  if(handBtn && handPanel){
    handBtn.onclick=()=>{
      const show=!handPanel.classList.contains("show");
      handPanel.classList.toggle("show",show);
      handBtn.classList.toggle("active",show);
      handBtn.textContent=show
        ? `收起手牌（${G.players[0].hand.length}）`
        : `我的手牌（${G.players[0].hand.length}）`;
    };
  }

  if(logBtn){
    logBtn.onclick=()=>{
      ensureLogDrawerPortal();
      $("logDrawer").classList.toggle("show");
      logBtn.classList.toggle("active",$("logDrawer").classList.contains("show"));
    };
  }
}

function setChoiceSheet(html){
  _modalIsChoice=true;
  const sheet=$("sheet");
  $("modal").classList.remove("info-modal");
  sheet.className="sheet";
  sheet.innerHTML=choiceContextHtml()+html;
  bindChoiceContext();
}

async function chooseDiscardCard(p){
  const id=await chooseCardFromList("强制清仓：选择弃1张牌",p.hand);
  return p.hand.find(c=>c.id===id) || p.hand[0];
}
function chooseCardFromList(title,cards){
  return new Promise(resolve=>{
    if(!cards||cards.length===0){resolve(null);return}
    const sheet=$("sheet");setChoiceSheet(`<h3>${title}</h3><div class="cards" id="pickCards"></div>`);
    const w=sheet.querySelector("#pickCards");
    sortHandCards(cards).forEach(c=>{
      const d=document.createElement("div");d.className=`card ${isRed(c.suit)?"red":""} ${c.polluted?"polluted":""}`;
      d.innerHTML=`<span class="rank">${c.rank}</span><span class="suit">${c.suit}</span>`;
      d.onclick=()=>{closeModal();resolve(c.id)};w.appendChild(d);
    });
    openModal();
  });
}

function chooseMultipleCardsFromList(title,cards,count){
  return new Promise(resolve=>{
    let picks=[];
    const renderPicker=()=>{
      const sheet=$("sheet");
      setChoiceSheet(`<h3>${title}</h3>
        <div class="small">请选择 ${count} 张（已选 ${picks.length}/${count}）</div>
        <div class="cards" id="multiPickCards"></div>
        <button id="multiConfirm" class="choice" ${picks.length===count?"":"disabled"}>确认选择</button>`);

      const w=sheet.querySelector("#multiPickCards");
      sortHandCards(cards).forEach(c=>{
        const picked=picks.some(x=>x.id===c.id);
        const d=document.createElement("div");
        d.className=`card ${isRed(c.suit)?"red":""} ${picked?"selected":""} ${c.polluted?"polluted":""}`;
        d.innerHTML=`<span class="rank">${c.rank}</span><span class="suit">${c.suit}</span>`;
        d.onclick=()=>{
          const idx=picks.findIndex(x=>x.id===c.id);
          if(idx>=0){
            picks.splice(idx,1);
          }else if(picks.length<count){
            picks.push(c);
          }
          renderPicker();
        };
        w.appendChild(d);
      });

      sheet.querySelector("#multiConfirm").onclick=()=>{
        if(picks.length!==count)return;
        closeModal();
        resolve([...picks]);
      };
    };
    renderPicker();
    openModal();
  });
}

function chooseCardOrNone(title,cards,noneLabel="不选择"){
  return new Promise(resolve=>{
    const sheet=$("sheet");
    setChoiceSheet(`<h3>${title}</h3><div class="cards" id="pickCards"></div><button id="pickNone" class="choice">${noneLabel}</button>`);
    const w=sheet.querySelector("#pickCards");
    sortHandCards(cards).forEach(c=>{
      const d=document.createElement("div");
      d.className=`card ${isRed(c.suit)?"red":""} ${c.polluted?"polluted":""}`;
      d.innerHTML=`<span class="rank">${c.rank}</span><span class="suit">${c.suit}</span>`;
      d.onclick=()=>{closeModal();resolve(c.id)};
      w.appendChild(d);
    });
    sheet.querySelector("#pickNone").onclick=()=>{closeModal();resolve(null)};
    openModal();
  });
}

function chooseTarget(title,allowSelf){
  return new Promise(resolve=>{
    const choices=G.players.map((p,i)=>({p,i})).filter(o=>allowSelf||o.i!==G.current);
    const sheet=$("sheet");setChoiceSheet(`<h3>${title}</h3>`);
    choices.forEach(({p,i})=>{
      const b=document.createElement("button");b.className="choice";b.textContent=`${p.name} · 手牌${p.hand.length}张`;
      b.onclick=()=>{closeModal();resolve(i)};sheet.appendChild(b);
    });
    openModal();
  });
}
function chooseTwoTargets(title){
  return new Promise(resolve=>{
    let picks=[];
    const sheet=$("sheet");setChoiceSheet(`<h3>${title}</h3><div class="small">请选择两个不同玩家。</div>`);
    G.players.forEach((p,i)=>{
      const b=document.createElement("button");b.className="choice";b.textContent=`${p.name} · 手牌${p.hand.length}张`;
      b.onclick=()=>{
        if(picks.includes(i))return;
        picks.push(i);b.disabled=true;b.textContent+=" ✓";
        if(picks.length===2){closeModal();resolve(picks)}
      };sheet.appendChild(b);
    });
    openModal();
  });
}
function askYesNo(title,text){
  return new Promise(resolve=>{
    const s=$("sheet");setChoiceSheet(`<h3>${title}</h3><div style="margin-bottom:12px">${text}</div>`);
    [["是",true],["否",false]].forEach(([lab,val])=>{
      const b=document.createElement("button");b.className="choice";b.textContent=lab;b.onclick=()=>{closeModal();resolve(val)};s.appendChild(b);
    });openModal();
  });
}
function modalChoices(title,html,choices){
  return new Promise(resolve=>{
    const s=$("sheet");setChoiceSheet(`<h3>${title}</h3>${html}`);
    for(const [val,lab] of choices){
      const b=document.createElement("button");b.className="choice";b.textContent=lab;b.onclick=()=>{closeModal();resolve(val)};s.appendChild(b);
    }openModal();
  });
}
function openModal(){$("modal").classList.add("show")}
function closeModal(){
  _modalIsChoice=false;
  $("modal").classList.remove("show","info-modal");
  $("sheet").className="sheet";
  $("logDrawer").classList.remove("show");
}
function showInfo(title,html){
  _modalIsChoice=false;
  $("modal").classList.remove("info-modal");
  const s=$("sheet");
  s.className="sheet";
  s.innerHTML=`<h3>${title}</h3>${html}<button class="choice" onclick="closeModal()">关闭</button>`;
  openModal();
}
function showSkillDetail(name,desc){
  _modalIsChoice=false;
  $("modal").classList.remove("info-modal");
  const s=$("sheet");
  s.className="sheet";
  s.innerHTML=`<div class="skill-popup">
    <div class="sp-icon-wrap"><div class="sp-icon">✦</div></div>
    <h3 class="sp-title">${name}</h3>
    <div class="sp-subtitle">技能详情</div>
    <div class="sp-desc">${desc}</div>
    <button class="sp-close" onclick="closeModal()">关闭</button>
  </div>`;
  openModal();
}

let codexTab = "skills";

const CODEX_VISUALS={
  overload:{icon:"⚡",accent:"#f0b84c"},
  dice:{icon:"🎲",accent:"#d69bff"},
  trap:{icon:"✂",accent:"#ff8c75"},
  resonance:{icon:"◈",accent:"#6ed0df"},
  divine:{icon:"✦",accent:"#9db7ff"},
  reveal:{icon:"◉",accent:"#ffca73"},
  charge:{icon:"↯",accent:"#92dc6e"},
  artisan:{icon:"♠",accent:"#e3c073"},
  pollution:{icon:"☣",accent:"#c17ce3"},
  barrier:{icon:"◇",accent:"#74c6a0"}
};
const FIELD_ICONS={
  drawplus:"🌾",nosingle:"🔒",odd:"Ⅰ",even:"Ⅱ",
  chain:"⛓",discard:"↘",diceDraw:"🎲",overtime:"⏱"
};

function openInfoModal(sheetClass){
  _modalIsChoice=false;
  $("modal").classList.add("info-modal");
  $("sheet").className=`sheet ${sheetClass}`;
}

function showCodex(tab="skills"){
  codexTab = tab;
  openInfoModal("codex-sheet");
  renderCodex();
  openModal();
}

function renderCodex(){
  const sheet=$("sheet");
  const isSkills=codexTab==="skills";
  const items=isSkills?SKILLS:FIELDS;

  const htmlItems = items.map((item,idx)=>{
    let extra="";
    if(!isSkills){
      extra = `<span class="codex-tag">持续 ${item.dur} 轮</span>`;
    }else{
      if(item.id==="dice") extra = `<span class="codex-tag">随机驱动</span>`;
      else if(item.id==="charge") extra = `<span class="codex-tag">成长型</span>`;
      else if(item.id==="trap") extra = `<span class="codex-tag">反爆发</span>`;
      else if(item.id==="artisan") extra = `<span class="codex-tag">牌型强化</span>`;
      else if(item.id==="divine") extra = `<span class="codex-tag">牌堆控制</span>`;
      else if(item.id==="reveal") extra = `<span class="codex-tag">主动干扰</span>`;
      else if(item.id==="overload") extra = `<span class="codex-tag">爆发型</span>`;
      else if(item.id==="resonance") extra = `<span class="codex-tag">互动型</span>`;
      else if(item.id==="barrier") extra = `<span class="codex-tag">持续结界 · CD4</span>`;
      else if(item.id==="pollution") extra = `<span class="codex-tag">进攻压制</span>`;
    }

    const visual=isSkills
      ? (CODEX_VISUALS[item.id]||{icon:"✦",accent:"#d6ae51"})
      : {icon:FIELD_ICONS[item.id]||"◎",accent:"#77b992"};

    return `<div class="codex-item ${isSkills?"skill-entry":"field-entry"}" style="--codex-accent:${visual.accent}">
      <div class="codex-item-top">
        <div class="codex-item-icon">${visual.icon}</div>
        <div class="codex-item-heading">
          <div class="codex-index">${isSkills?"SKILL":"FIELD"} ${String(idx+1).padStart(2,"0")}</div>
          <div class="codex-item-title">${item.name}${extra}</div>
        </div>
      </div>
      <div class="codex-item-desc">${item.desc}</div>
    </div>`;
  }).join("");

  sheet.innerHTML=`
    <div class="info-scroll">
      <div class="info-hero">
        <div class="info-hero-left">
          <div class="info-hero-icon">✦</div>
          <div>
            <div class="info-hero-title">技能 / 场地图鉴</div>
            <div class="codex-hero-stats">
              <span class="codex-stat">${SKILLS.length} 个技能</span>
              <span class="codex-stat">${FIELDS.length} 个场地</span>
              <span class="codex-stat">${GAME_VERSION}</span>
            </div>
          </div>
        </div>
        <button class="info-close" id="codexCloseTop" aria-label="关闭">×</button>
      </div>

      <div class="codex-tabs">
        <button id="skillsTab" class="codex-tab ${isSkills?"active":""}">✦ 全部技能（${SKILLS.length}）</button>
        <button id="fieldsTab" class="codex-tab ${!isSkills?"active":""}">◎ 全部场地（${FIELDS.length}）</button>
      </div>

      <div class="codex-list">${htmlItems}</div>

      <div class="codex-footer">
        <button id="codexBackBtn" class="choice">返回大厅</button>
      </div>
    </div>
  `;

  sheet.querySelector("#codexCloseTop").onclick=closeModal;
  sheet.querySelector("#codexBackBtn").onclick=closeModal;
  sheet.querySelector("#skillsTab").onclick=()=>{codexTab="skills";renderCodex();};
  sheet.querySelector("#fieldsTab").onclick=()=>{codexTab="fields";renderCodex();};
}

function rulesSection(icon,title,lines){
  return `<section class="rules-section">
    <div class="rules-section-head">
      <div class="rules-section-icon">${icon}</div>
      <div class="rules-section-title">${title}</div>
      <div class="rules-section-line"></div>
    </div>
    <div class="rules-list">
      ${lines.map(line=>`<div class="ruleline rule-card">${line}</div>`).join("")}
    </div>
  </section>`;
}

function showRules(){
  openInfoModal("rules-sheet");
  const sheet=$("sheet");

  const basic=[
    roomRulesText(),
    "4副52张标准扑克混洗，不使用大小王。",
    `每人开局${MATCH_RULES.startingHandSize}张；每个正常回合先摸牌，再进入出牌阶段。`,
    "可出：单牌、三带一、四条、葫芦、5张起顺子、6张起连对；【充能】达到6后可出对子。",
    "一次打出4张及以上的合法牌型：获得1个额外回合。",
    "额外回合不摸牌；基础“4张及以上牌型”奖励默认不能在额外回合继续触发，除非技能/场地明确允许。"
  ];

  const skills=[
    "开局前点击大厅中的【本局技能】按钮，通过弹窗选择自己的技能；也可保留【随机技能】。3名AI从剩余技能中随机获得技能，所有人的技能公开。",
    "【骰命】每个自己的正常回合开始时公开投1D6，点数效果必须结算，不能拒绝；玩家只负责选择目标或具体牌。2点为【选择2】；3/4点若把自己选为目标，自己的那一份改为【选择2】；5点先强制弃2，若弃牌后手牌为0则立即获胜，否则继续【选择3】；6点的额外回合在当前正常回合结束后才真正获得。",
    "【充能】在“每次获得1张牌”时逐张判断，同点数即加能量，不区分正常摸牌、场地、处罚、他人技能或自己的技能。",
    "【共振】在别人每获得1个额外回合时必须摸1张；自己每获得1个额外回合时，其他玩家各摸1张，随后自己可以弃1张。若一次获得多个额外回合，则逐个分别结算。",
    "【充能】阈值现为2/4/6/8：额外摸牌 / 额外回合连锁 / 可出对子 / 立即获得额外回合。",
    "【占卜】只在正常摸牌阶段触发；额外回合没有摸牌阶段，处罚/技能造成的效果摸牌也不会触发占卜。",
    "【截胡】只针对其他玩家：当其他玩家中有人手牌>4时进入待触发；截胡者自己的额外回合不会触发自己的【截胡】。触发后令那名其他玩家摸2张，截胡本人再可独立选择摸1张、弃1张。",
    "【污染】在自己的正常回合打出单牌后可攻击1名其他玩家：未污染者随机被污染1张暗牌；已污染者可被引爆，效果摸1张并解除当前污染。污染牌参与4张及以上牌型会取消基础额外回合；作为非单牌组合打出时会扩散到剩余手牌，只有作为单牌打出才能稳定净化。污染不叠加，也不取消技能或场地另外给予的额外回合。"
  ];

  const info=[
    "【占卜】的私人窥牌仅占卜者本人可见；所有公开/明牌会自动同步进占卜情报区并以金色显示，无需玩家自己把两处信息相加。",
    "占卜情报按“具体实体牌”记录；同一张牌从暗牌变成明牌时不会重复显示，只会在占卜区变成金色；牌真正离手后情报才消失。",
    "AI不会读取你的暗牌，只按公开信息、自己的手牌以及它通过技能合法获得的信息做简单决策。"
  ];

  const field=[
    `每${MATCH_RULES.fieldEveryRounds}轮结束时随机抽取一个场地规则。`,
    "【加时赛】持续1轮：每名玩家先结算正常回合及该回合已经产生的其他额外回合，最后再获得1个场地额外回合。它不会额外开放连锁；普通玩家的额外回合仍不能靠4张以上牌型继续触发，只有技能本身允许连锁的玩家可以在这些额外回合中继续连锁。",
    "清空手牌获胜；技能响应先于胜利判定结算，因此【截胡】可能阻止“5+1”偷家。"
  ];

  sheet.innerHTML=`
    <div class="info-scroll">
      <div class="info-hero">
        <div class="info-hero-left">
          <div class="info-hero-icon">?</div>
          <div>
            <div class="info-hero-title">玩法规则</div>
            <div class="info-hero-sub">先掌握核心循环，再查技能与场地细节</div>
          </div>
        </div>
        <button class="info-close" id="rulesCloseTop" aria-label="关闭">×</button>
      </div>

      <div class="rules-quick">
        <div class="rules-quick-card">
          <div class="rules-quick-label">胜利目标</div>
          <div class="rules-quick-value">最先清空手牌</div>
        </div>
        <div class="rules-quick-card">
          <div class="rules-quick-label">正常回合</div>
          <div class="rules-quick-value">摸牌 → 出牌</div>
        </div>
        <div class="rules-quick-card">
          <div class="rules-quick-label">核心奖励</div>
          <div class="rules-quick-value">4+合法牌型 → 额外回合</div>
        </div>
      </div>

      ${rulesSection("♠","基础牌局",basic)}
      ${rulesSection("✦","技能与额外回合",skills)}
      ${rulesSection("◉","信息与AI",info)}
      ${rulesSection("◎","场地与胜利",field)}

      <div class="rules-footer-note">
        这里保留完整规则边界；第一次游玩只需要记住：清空手牌获胜，正常回合摸牌后出牌，4张及以上合法组合会奖励额外回合。
      </div>

      <div class="info-bottom">
        <button class="info-back" id="rulesBackBtn">我知道了</button>
      </div>
    </div>
  `;

  sheet.querySelector("#rulesCloseTop").onclick=closeModal;
  sheet.querySelector("#rulesBackBtn").onclick=closeModal;
  openModal();
}

// ============================================================
// 音频系统 · 欢乐斗地主风格音效（Web Audio API 程序化生成）
// ============================================================
const AudioSys = (() => {
  let ctx = null;
  let masterGain = null;
  let sfxGain = null;
  let musicGain = null;
  let sfxMuted = false;
  let musicMuted = false;
  let musicPlaying = false;
  let musicTimer = null;

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.7;
      masterGain.connect(ctx.destination);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.85;
      sfxGain.connect(masterGain);

      musicGain = ctx.createGain();
      musicGain.gain.value = 0.22;
      musicGain.connect(masterGain);
    } catch (e) {
      console.warn("Web Audio API 不可用", e);
    }
  }

  function resume() {
    if (ctx && ctx.state === "suspended") ctx.resume();
  }

  // ---------- 基础音色生成器 ----------
  function playTone(freq, dur, type = "sine", vol = 0.3, attack = 0.003, release = 0.08, delay = 0) {
    if (!ctx || sfxMuted) return;
    resume();
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + attack);
    gain.gain.setValueAtTime(vol, t + dur);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur + release);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(t);
    osc.stop(t + dur + release + 0.02);
  }

  // 带音高变化的音
  function playToneSlide(fromFreq, toFreq, dur, type = "sine", vol = 0.3, attack = 0.005, release = 0.05, delay = 0) {
    if (!ctx || sfxMuted) return;
    resume();
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(fromFreq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, toFreq), t + dur);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + attack);
    gain.gain.setValueAtTime(vol, t + dur * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur + release);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(t);
    osc.stop(t + dur + release + 0.02);
  }

  // 白噪声（带滤波器）
  function playNoise(dur, vol = 0.2, filterFreq = 1000, filterQ = 1, filterType = "bandpass", delay = 0) {
    if (!ctx || sfxMuted) return;
    resume();
    const t = ctx.currentTime + delay;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  // 低频轰鸣（爆炸用）
  function playBoom(dur = 0.4, vol = 0.3, delay = 0) {
    if (!ctx || sfxMuted) return;
    resume();
    const t = ctx.currentTime + delay;
    // 低频正弦下滑
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + dur);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.05);

    // 噪声冲击
    playNoise(dur * 0.8, vol * 0.5, 150, 0.5, "lowpass", delay);
  }

  // 牌击桌声（核心！模仿斗地主的清脆"啪"声）
  function playCardSlap(vol = 0.3) {
    if (!ctx || sfxMuted) return;
    resume();
    const t = ctx.currentTime;

    // 1. 高频冲击：纸牌扇动声
    const noiseOsc = ctx.createBufferSource();
    const nBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
    const nData = nBuf.getChannelData(0);
    for (let i = 0; i < nData.length; i++) {
      nData[i] = (Math.random() * 2 - 1) * (1 - i / nData.length);
    }
    noiseOsc.buffer = nBuf;
    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = "highpass";
    hpFilter.frequency.value = 2000;
    const nGain = ctx.createGain();
    nGain.gain.value = vol * 0.4;
    noiseOsc.connect(hpFilter);
    hpFilter.connect(nGain);
    nGain.connect(sfxGain);
    noiseOsc.start(t);

    // 2. 中频"啪"：牌面击打桌面
    const slapOsc = ctx.createOscillator();
    const slapGain = ctx.createGain();
    slapOsc.type = "square";
    slapOsc.frequency.setValueAtTime(600, t);
    slapOsc.frequency.exponentialRampToValueAtTime(150, t + 0.05);
    slapGain.gain.setValueAtTime(0, t);
    slapGain.gain.linearRampToValueAtTime(vol * 0.8, t + 0.003);
    slapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    slapOsc.connect(slapGain);
    slapGain.connect(sfxGain);
    slapOsc.start(t);
    slapOsc.stop(t + 0.1);

    // 3. 低频"咚"：桌面共振
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = "sine";
    thudOsc.frequency.setValueAtTime(180, t);
    thudOsc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
    thudGain.gain.setValueAtTime(0, t);
    thudGain.gain.linearRampToValueAtTime(vol * 0.5, t + 0.005);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    thudOsc.connect(thudGain);
    thudGain.connect(sfxGain);
    thudOsc.start(t);
    thudOsc.stop(t + 0.15);
  }

  // 锣鼓声（中国风）
  function playGong(vol = 0.25, dur = 0.6) {
    if (!ctx || sfxMuted) return;
    resume();
    const t = ctx.currentTime;
    // 基础音（非谐波叠加模拟锣）
    const freqs = [220, 277, 330, 440, 554];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol / (i + 2), t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur * (1 - i * 0.1));
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(t);
      osc.stop(t + dur + 0.1);
    });
    // 金属噪声
    playNoise(dur * 0.3, vol * 0.3, 3000, 2, "bandpass");
  }

  // 中式五声音阶（宫商角徵羽 = do re mi sol la）
  // C D E G A = 262 294 330 392 440
  const PENTATONIC = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];

  // 古筝音色模拟（带拨弦感）
  function playGuzheng(freq, dur = 0.3, vol = 0.2, delay = 0) {
    if (!ctx || sfxMuted) return;
    resume();
    const t = ctx.currentTime + delay;
    // 主音（三角波模拟弦音）
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq * 1.02, t); // 拨弦起始略高
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.02);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(vol * 0.5, t + dur * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.05);

    // 泛音（增加民族感）
    const harmonic = ctx.createOscillator();
    const hGain = ctx.createGain();
    harmonic.type = "sine";
    harmonic.frequency.value = freq * 2;
    hGain.gain.setValueAtTime(0, t);
    hGain.gain.linearRampToValueAtTime(vol * 0.3, t + 0.003);
    hGain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.4);
    harmonic.connect(hGain);
    hGain.connect(sfxGain);
    harmonic.start(t);
    harmonic.stop(t + dur * 0.5);
  }

  // 唢呐/管子音色（戏剧性时刻）
  function playSuonaNote(freq, dur = 0.2, vol = 0.18, delay = 0) {
    if (!ctx || sfxMuted) return;
    resume();
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq * 0.98, t);
    osc.frequency.linearRampToValueAtTime(freq, t + 0.03);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.02);
    gain.gain.setValueAtTime(vol, t + dur * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    // 带通滤波让音色更亮
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq * 2.5;
    filter.Q.value = 3;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // ---------- 游戏音效（欢乐斗地主风格） ----------
  const SFX = {
    // 发牌：快速的"唰唰"声
    deal() {
      playNoise(0.05, 0.12, 4000, 1.5, "highpass");
      playToneSlide(1200, 600, 0.04, "triangle", 0.06);
    },

    // 发牌（多张连发）
    dealMulti(n) {
      for (let i = 0; i < Math.min(n, 5); i++) {
        setTimeout(() => {
          playNoise(0.04, 0.08, 3500 + i * 200, 1.5, "highpass", i * 0.03);
        }, i * 30);
      }
    },

    // 单牌出牌：清脆一声"啪"
    playSingle() {
      playCardSlap(0.35);
      playTone(880, 0.05, "square", 0.08);
    },

    // 对子：两声清脆
    playPair() {
      playCardSlap(0.4);
      setTimeout(() => playCardSlap(0.35), 80);
      playTone(659, 0.06, "triangle", 0.1);
      setTimeout(() => playTone(784, 0.08, "triangle", 0.1), 80);
    },

    // 三带一：三声 + 一个尾巴，带提示音
    playTriple() {
      playCardSlap(0.45);
      setTimeout(() => playCardSlap(0.4), 60);
      setTimeout(() => playCardSlap(0.4), 120);
      setTimeout(() => playCardSlap(0.3), 180);
      // 标志性"三带一！"提示音（上升小三度）
      setTimeout(() => playTone(523, 0.08, "square", 0.12), 200);
      setTimeout(() => playTone(659, 0.12, "square", 0.12), 250);
    },

    // 顺子：五声音阶快速上行 + 多张牌声
    playStraight() {
      // 牌声
      for (let i = 0; i < 5; i++) {
        setTimeout(() => playCardSlap(0.25 + i * 0.03), i * 40);
      }
      // 五声音阶上行（古筝音色）
      const notes = [392, 440, 523, 587, 659]; // G A C D E
      notes.forEach((f, i) => {
        setTimeout(() => playGuzheng(f, 0.2, 0.15), i * 45 + 30);
      });
    },

    // 葫芦：厚重感 + 提示
    playFullHouse() {
      // 三声重 + 两声轻
      for (let i = 0; i < 3; i++) {
        setTimeout(() => playCardSlap(0.45), i * 50);
      }
      setTimeout(() => playCardSlap(0.35), 170);
      setTimeout(() => playCardSlap(0.35), 210);
      // 葫芦提示音（低沉有力）
      setTimeout(() => playTone(330, 0.1, "sawtooth", 0.14), 230);
      setTimeout(() => playTone(440, 0.15, "sawtooth", 0.14), 290);
    },

    // 四条（炸弹）：爆炸 + 警报 + 锣！
    playFour() {
      // 4张牌猛砸
      for (let i = 0; i < 4; i++) {
        setTimeout(() => playCardSlap(0.5), i * 40);
      }
      // 爆炸轰鸣
      setTimeout(() => playBoom(0.5, 0.35), 160);
      // 上升警报音
      setTimeout(() => playToneSlide(440, 880, 0.3, "square", 0.15), 180);
      setTimeout(() => playToneSlide(880, 440, 0.3, "square", 0.15), 360);
      // 一声锣！
      setTimeout(() => playGong(0.3, 0.8), 250);
    },

    // 连对：轻快跳跃
    playPairRun() {
      const cardCount = 6;
      for (let i = 0; i < cardCount; i++) {
        setTimeout(() => playCardSlap(0.3), i * 35);
      }
      // 连对欢快旋律（五声音阶跳跃）
      const notes = [523, 523, 587, 587, 659, 659, 784];
      notes.forEach((f, i) => {
        setTimeout(() => playGuzheng(f, 0.15, 0.12), i * 35 + 20);
      });
    },

    // 倍数翻番："叮！" + 上升
    multUp() {
      playTone(1047, 0.08, "sine", 0.2);
      setTimeout(() => playTone(1319, 0.08, "sine", 0.2), 60);
      setTimeout(() => playTone(1568, 0.15, "sine", 0.22), 120);
      // 闪烁感
      playToneSlide(2000, 4000, 0.15, "sine", 0.08, 0.005, 0.05, 100);
    },

    // 额外回合：锣鼓点 + 欢快
    extraTurn() {
      // 鼓点
      playNoise(0.05, 0.15, 200, 0.5, "lowpass");
      setTimeout(() => playNoise(0.05, 0.15, 200, 0.5, "lowpass"), 100);
      setTimeout(() => playNoise(0.08, 0.2, 300, 0.5, "lowpass"), 200);
      // 欢快上升旋律
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => {
        setTimeout(() => playGuzheng(f, 0.15, 0.15), i * 60 + 50);
      });
    },

    // 技能触发：魔法感 + 中式点缀
    skill() {
      playToneSlide(300, 900, 0.12, "sine", 0.1);
      setTimeout(() => playTone(1200, 0.08, "triangle", 0.08), 80);
      // 一点金属感
      playTone(1800, 0.05, "sine", 0.05, 0.003, 0.03, 60);
    },

    // 场地变更：锣鼓喧天
    fieldChange() {
      // 鼓点滚奏
      for (let i = 0; i < 6; i++) {
        setTimeout(() => playNoise(0.03, 0.1, 150 + i * 20, 0.8, "lowpass"), i * 30);
      }
      // 一声大锣
      setTimeout(() => playGong(0.35, 1), 180);
      // 场地出现的上升音
      setTimeout(() => playToneSlide(200, 600, 0.4, "sine", 0.12), 200);
    },

    // 获胜：喜庆唢呐 + 锣鼓 + 五声音阶胜利曲
    win() {
      // 开场锣
      playGong(0.3, 0.5);
      // 鼓点
      for (let i = 0; i < 8; i++) {
        setTimeout(() => playNoise(0.04, 0.12, 200, 0.5, "lowpass"), i * 80);
      }
      // 胜利旋律（唢呐音色，五声音阶）
      const melody = [
        [523, 0.15], [587, 0.15], [659, 0.15], [784, 0.2],
        [880, 0.2], [784, 0.15], [659, 0.15], [523, 0.3]
      ];
      let t = 200;
      melody.forEach(([f, d]) => {
        setTimeout(() => playSuonaNote(f, d, 0.15), t);
        t += d * 1000 * 0.8;
      });
      // 收尾大锣
      setTimeout(() => playGong(0.4, 1.2), t + 100);
      // 金币雨
      setTimeout(() => SFX.coins(), t + 300);
    },

    // 失败：悲伤下行
    lose() {
      // 低音锣（闷）
      playGong(0.2, 0.8);
      // 下行旋律
      const notes = [523, 440, 392, 330, 294];
      notes.forEach((f, i) => {
        setTimeout(() => playTone(f, 0.25, "sawtooth", 0.12), i * 120 + 100);
      });
      // 结尾"咚"
      setTimeout(() => playBoom(0.6, 0.2), 700);
    },

    // 按钮点击：清脆"嘀"
    click() {
      playTone(1200, 0.02, "square", 0.06);
    },

    // 弹窗："叮"
    popup() {
      playTone(880, 0.04, "sine", 0.1);
      setTimeout(() => playTone(1100, 0.06, "sine", 0.08), 30);
    },

    // 星石/金币：连续金属碰撞
    coins() {
      const notes = [1500, 1800, 2100, 2400];
      notes.forEach((f, i) => {
        setTimeout(() => {
          playTone(f, 0.05, "square", 0.08);
          playTone(f * 2, 0.03, "sine", 0.04);
        }, i * 40);
      });
    },

    // 弃牌：轻轻放下
    discard() {
      playNoise(0.06, 0.08, 1500, 2, "highpass");
      playTone(400, 0.04, "triangle", 0.06);
    },

    // 污染：腐蚀感
    pollution() {
      playToneSlide(600, 150, 0.3, "sawtooth", 0.1);
      playNoise(0.2, 0.06, 300, 3, "bandpass", 50);
    },

    // 结界施放：神圣庄严
    barrier() {
      playTone(330, 0.15, "sine", 0.12);
      setTimeout(() => playTone(440, 0.15, "sine", 0.12), 80);
      setTimeout(() => playTone(554, 0.25, "sine", 0.14), 160);
      // 泛音
      setTimeout(() => playTone(660, 0.2, "sine", 0.06), 160);
      // 钟声感
      playNoise(0.1, 0.05, 5000, 2, "highpass", 160);
    },

    // 倒计时（每"滴"一声）
    tick(high = false) {
      playTone(high ? 1600 : 1200, 0.03, "square", 0.08);
    },

    // 提示（轮到你了）
    yourTurn() {
      playTone(880, 0.06, "sine", 0.1);
      setTimeout(() => playTone(1100, 0.08, "sine", 0.12), 60);
    },

    // 不出/过牌：轻轻的空气声
    pass() {
      playNoise(0.1, 0.1, 1200, 0.8, "bandpass");
      playToneSlide(400, 300, 0.1, "sine", 0.08);
    },

    // 倒计时嘀嗒
    tick(high = false) {
      playTone(high ? 1200 : 800, 0.02, "square", 0.05);
    }
  };

  // ---------- 语音系统 (VO) · 欢乐斗地主风格 ----------
  const VO = {
    enabled: true,
    speech: window.speechSynthesis,
    voice: null,
    
    init() {
      if (!this.speech) return;
      const loadVoices = () => {
        const voices = this.speech.getVoices();
        if (voices.length > 0) {
          // 优先级：1. 晓晓/云希(微软云) 2. 慧慧/康康(Windows本地) 3. Google中文 4. 任何中文
          this.voice = voices.find(v => v.lang.includes("zh") && (v.name.includes("Xiaoxiao") || v.name.includes("晓晓"))) ||
                       voices.find(v => v.lang.includes("zh") && (v.name.includes("Yunxi") || v.name.includes("云希"))) ||
                       voices.find(v => v.lang.includes("zh") && (v.name.includes("Huihui") || v.name.includes("慧慧"))) ||
                       voices.find(v => v.lang.includes("zh") && (v.name.includes("Kangkang") || v.name.includes("康康"))) ||
                       voices.find(v => v.lang.includes("zh") && v.name.includes("Google")) ||
                       voices.find(v => v.lang.includes("zh"));
          
          if(this.voice) console.log("已锁定本地配音:", this.voice.name);
        }
      };
      if (this.speech.onvoiceschanged !== undefined) {
        this.speech.onvoiceschanged = loadVoices;
      }
      loadVoices();
    },

    speak(text, options = {}) {
      if (!this.enabled || sfxMuted || !this.speech) return;
      
      try {
        this.speech.cancel();
        
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "zh-CN"; // 强制指定中国大陆中文
        utter.rate = options.rate || 1.8; 
        utter.pitch = options.pitch || 1.3;
        utter.volume = options.volume || 1.0;
        
        if (this.voice) {
          utter.voice = this.voice;
        } else {
          const voices = this.speech.getVoices();
          // 兜底搜索本地中文嗓音
          const zh = voices.find(v => v.lang.includes("zh-CN")) || voices.find(v => v.lang.includes("zh"));
          if (zh) utter.voice = zh;
        }
        
        // 某些浏览器需要这个来打破静音限制
        utter.onstart = () => { /* 语音已开始 */ };
        utter.onerror = (e) => console.warn("VO Error:", e);
        
        this.speech.speak(utter);
      } catch (e) {
        console.warn("Speech synthesis failed:", e);
      }
    },

    playCard(type, cards) {
      let text = "";
      switch(type) {
        case "single": 
          const rank = cards[0].rank;
          text = rank === "JOKER" ? "大王" : (rank === "joker" ? "小王" : rank);
          break;
        case "pair": text = "对" + cards[0].rank; break;
        case "triple1": text = "三带一"; break;
        case "straight": text = "顺子"; break;
        case "fullhouse": text = "三带二"; break;
        case "four": text = "炸弹！"; break;
        case "pairrun": text = "连对"; break;
        default: text = "出牌";
      }
      this.speak(text);
    },

    pass() {
      const phrases = ["不出", "过", "要不起"];
      this.speak(phrases[Math.floor(Math.random() * phrases.length)]);
    },

    win() {
      this.speak("合作愉快，下次再来！", { rate: 1.2, pitch: 1.1 });
    },

    lose() {
      this.speak("你的牌打得也太好了吧！", { rate: 1.1, pitch: 0.9 });
    },

    yourTurn() {
      this.speak("你的回合", { rate: 2.0, pitch: 1.4 });
    }
  };
  VO.init(); // 立即尝试初始化语音库

  // ---------- 智能出牌音效（根据牌型选择） ----------
  function playCardSound(type, cards) {
    if (!ctx || sfxMuted) return;
    
    // 触发 SFX
    switch (type) {
      case "single": SFX.playSingle(); break;
      case "pair": SFX.playPair(); break;
      case "triple1": SFX.playTriple(); break;
      case "straight": SFX.playStraight(); break;
      case "fullhouse": SFX.playFullHouse(); break;
      case "four": SFX.playFour(); break;
      case "pairrun": SFX.playPairRun(); break;
      default: SFX.playSingle();
    }

    // 触发 VO
    if (cards && cards.length > 0) {
      VO.playCard(type, cards);
    }
  }

  // ---------- 背景音乐 · 中式欢快赌场风 ----------
  // 中国五声音阶 + 节奏鼓点 + 弹拨旋律
  const BG_PATTERN = [
    // 主旋律（五声音阶）：[频率, 拍数]
    [523.25, 0.5], [587.33, 0.5], [659.25, 0.5], [783.99, 0.5], // C D E G
    [880.00, 1.0], [783.99, 0.5], [659.25, 0.5], // A G E
    [587.33, 0.5], [523.25, 0.5], [392.00, 0.5], [440.00, 0.5], // D C G A
    [523.25, 1.0], [440.00, 0.5], [392.00, 0.5], // C A G
  ];

  // 低音线（拨弦感）
  const BASS_PATTERN = [
    [130.81, 1], [196.00, 1], // C G
    [174.61, 1], [146.83, 1], // F D
    [130.81, 1], [196.00, 1], // C G
    [164.81, 1], [146.83, 1], // E D
  ];

  let musicBeat = 0;
  let musicPatternIdx = 0;
  let bassIdx = 0;

  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    musicPlaying = false;
    musicBeat = 0;
    musicPatternIdx = 0;
    bassIdx = 0;
  }

  function playMusicNote(freq, dur, vol, type = "triangle") {
    if (!ctx || musicMuted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
    gain.gain.setValueAtTime(vol, ctx.currentTime + dur * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  }

  function playMusicDrum(vol = 0.05) {
    if (!ctx || musicMuted) return;
    const t = ctx.currentTime;
    // 低频鼓
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  function playMusicHat(vol = 0.03) {
    if (!ctx || musicMuted) return;
    const bufferSize = Math.floor(ctx.sampleRate * 0.03);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 5000;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain);
    src.start();
  }

  function startMusic() {
    if (!ctx || musicPlaying) return;
    resume();
    musicPlaying = true;
    musicBeat = 0;
    musicPatternIdx = 0;
    bassIdx = 0;

    const beatDur = 280; // 毫秒/拍，比较欢快的节奏

    musicTimer = setInterval(() => {
      if (!musicPlaying || musicMuted) { musicBeat++; return; }

      // 鼓点：每拍一个底鼓，反拍踩镲
      if (musicBeat % 2 === 0) playMusicDrum(0.06);
      else playMusicHat(0.025);

      // 主旋律
      const [mFreq, mBeats] = BG_PATTERN[musicPatternIdx];
      const beatInPattern = musicBeat % 16;
      // 简化：每两拍一个旋律音（八分音符 = 0.5拍 → 调整为每拍一个）
      if (musicBeat % 1 === 0) {
        playMusicNote(mFreq, beatDur * mBeats / 1000 * 0.9, 0.05, "triangle");
        musicPatternIdx = (musicPatternIdx + 1) % BG_PATTERN.length;
      }

      // 低音线（每2拍一个音）
      if (musicBeat % 2 === 0) {
        const [bFreq, bBeats] = BASS_PATTERN[bassIdx];
        playMusicNote(bFreq, beatDur * bBeats * 2 / 1000 * 0.9, 0.04, "sine");
        bassIdx = (bassIdx + 1) % BASS_PATTERN.length;
      }

      // 偶尔加一点弹拨装饰音
      if (musicBeat % 8 === 4) {
        playMusicNote(BG_PATTERN[(musicPatternIdx + 3) % BG_PATTERN.length][0] * 2,
          beatDur * 0.4 / 1000, 0.025, "sine");
      }

      musicBeat++;
    }, beatDur);
  }

  // ---------- 开关控制 ----------
  function toggleSfx() {
    sfxMuted = !sfxMuted;
    const btn = document.getElementById("sfxToggleBtn");
    if (btn) btn.classList.toggle("muted", sfxMuted);
    if (!sfxMuted) { init(); resume(); SFX.click(); }
    try { localStorage.setItem("happy-card-game.sfxMuted", sfxMuted ? "1" : "0"); } catch (e) {}
    return sfxMuted;
  }

  function toggleMusic() {
    init();
    musicMuted = !musicMuted;
    const btn = document.getElementById("musicToggleBtn");
    if (btn) btn.classList.toggle("muted", musicMuted);

    if (musicMuted) {
      stopMusic();
    } else {
      resume();
      startMusic();
    }
    try { localStorage.setItem("happy-card-game.musicMuted", musicMuted ? "1" : "0"); } catch (e) {}
    return musicMuted;
  }

  function loadPrefs() {
    try {
      const s = localStorage.getItem("happy-card-game.sfxMuted");
      const m = localStorage.getItem("happy-card-game.musicMuted");
      if (s === "1") sfxMuted = true;
      if (m === "1") musicMuted = true;
    } catch (e) {}
  }

  function applyPrefsUI() {
    const sBtn = document.getElementById("sfxToggleBtn");
    const mBtn = document.getElementById("musicToggleBtn");
    if (sBtn) sBtn.classList.toggle("muted", sfxMuted);
    if (mBtn) mBtn.classList.toggle("muted", musicMuted);
  }

  // ---------- 视觉特效系统 ----------
  // 获取牌桌中心位置（用于特效定位）
  function getTableCenter() {
    const arena = document.querySelector(".arena") || document.querySelector(".table-stage");
    if (arena) {
      const rect = arena.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  // 把元素定位到指定坐标（以元素中心为基准）
  function centerAt(el, x, y) {
    el.style.position = "fixed";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.transform = "translate(-50%, -50%)";
  }

  const reducedFx = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const fxCount = (normal, reduced) => reducedFx() ? reduced : normal;

  const FX = {
    // 出牌波纹
    ripple() {
      const layer = document.getElementById("fxLayer");
      if (!layer) return;
      const el = document.createElement("div");
      el.className = "fx-ripple";
      const c = getTableCenter();
      centerAt(el, c.x, c.y);
      layer.appendChild(el);
      requestAnimationFrame(() => el.classList.add("play"));
      setTimeout(() => el.remove(), 600);
    },

    // 从出牌者位置飞向牌桌中央；仅创建轻量镜像，不移动真实手牌节点。
    cardFlight(cards, playerIndex, sourceRects = []) {
      const layer = document.getElementById("fxLayer");
      if (!layer || !cards?.length || reducedFx()) return;
      const targetRect = document.getElementById("lastPlay")?.getBoundingClientRect();
      const target = targetRect
        ? { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 }
        : getTableCenter();
      const seatRect = document.querySelectorAll("#players .player")[playerIndex]?.getBoundingClientRect();
      const fallback = seatRect
        ? { x: seatRect.left + seatRect.width / 2, y: seatRect.top + seatRect.height / 2 }
        : getTableCenter();
      cards.forEach((card, index) => {
        const rect = sourceRects[index];
        const start = rect
          ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
          : fallback;
        const spread = (index - (cards.length - 1) / 2) * 18;
        const el = document.createElement("div");
        el.className = `fx-card-flight ${isRed(card.suit) ? "red" : ""}`;
        el.innerHTML = `<span class="rank">${card.rank}</span><span class="suit">${card.suit}</span>`;
        el.style.left = `${start.x}px`;
        el.style.top = `${start.y}px`;
        el.style.setProperty("--dx", `${target.x + spread - start.x}px`);
        el.style.setProperty("--dy", `${target.y - start.y}px`);
        el.style.setProperty("--from-rot", `${(index % 2 ? 1 : -1) * (5 + index * 1.5)}deg`);
        el.style.setProperty("--to-rot", `${spread / 5}deg`);
        el.style.setProperty("--delay", `${Math.min(index * 34, 170)}ms`);
        layer.appendChild(el);
        requestAnimationFrame(() => el.classList.add("play"));
        setTimeout(() => el.remove(), 760);
      });
    },

    // 炸弹爆炸
    boom() {
      const layer = document.getElementById("fxLayer");
      if (!layer) return;
      const c = getTableCenter();
      // 爆炸闪光
      const flash = document.createElement("div");
      flash.className = "fx-boom-flash";
      centerAt(flash, c.x, c.y);
      layer.appendChild(flash);
      requestAnimationFrame(() => flash.classList.add("play"));
      setTimeout(() => flash.remove(), 600);
      // 冲击波环 - 增加至三波
      [0, 150, 300].forEach((delay, i) => {
        setTimeout(() => {
          const ring = document.createElement("div");
          ring.className = "fx-boom-ring";
          if (i === 1) ring.style.borderColor = "#ffd166";
          if (i === 2) ring.style.borderColor = "#fff";
          centerAt(ring, c.x, c.y);
          layer.appendChild(ring);
          requestAnimationFrame(() => ring.classList.add("play"));
          setTimeout(() => ring.remove(), 800);
        }, delay);
      });
      // 屏幕震动
      const arena = document.querySelector(".arena");
      if (arena) {
        arena.classList.add("fx-shake");
        setTimeout(() => arena.classList.remove("fx-shake"), 500);
      }
      // 根据用户动态效果偏好控制粒子预算，避免低端设备掉帧
      for (let i = 0; i < fxCount(20, 6); i++) {
        const spark = document.createElement("div");
        spark.className = "fx-spark";
        const angle = Math.random() * Math.PI * 2;
        const dist = 100 + Math.random() * 120;
        const duration = 0.5 + Math.random() * 0.5;
        spark.style.position = "fixed";
        spark.style.left = c.x + "px";
        spark.style.top = c.y + "px";
        spark.style.setProperty("--sx", `${Math.cos(angle) * dist}px`);
        spark.style.setProperty("--sy", `${Math.sin(angle) * dist}px`);
        spark.style.setProperty("--dur", `${duration}s`);
        spark.style.color = ["#ff6b35", "#ffd166", "#fff"][Math.floor(Math.random() * 3)];
        spark.style.background = "currentColor";
        layer.appendChild(spark);
        requestAnimationFrame(() => spark.classList.add("play"));
        setTimeout(() => spark.remove(), duration * 1000 + 100);
      }
    },

    // 倍数上升
    multUp(text) {
      const layer = document.getElementById("fxLayer");
      if (!layer) return;
      const el = document.createElement("div");
      el.className = "fx-mult-pop";
      el.textContent = text || "倍数 ×2";
      const c = getTableCenter();
      centerAt(el, c.x, c.y);
      layer.appendChild(el);
      requestAnimationFrame(() => el.classList.add("play"));
      setTimeout(() => el.remove(), 900);
    },

    // 技能触发
    skill() {
      const layer = document.getElementById("fxLayer");
      if (!layer) return;
      const c = getTableCenter();
      const burst = document.createElement("div");
      burst.className = "fx-skill-burst";
      centerAt(burst, c.x, c.y);
      layer.appendChild(burst);
      requestAnimationFrame(() => burst.classList.add("play"));
      setTimeout(() => burst.remove(), 600);
      setTimeout(() => {
        const ring = document.createElement("div");
        ring.className = "fx-skill-ring";
        centerAt(ring, c.x, c.y);
        layer.appendChild(ring);
        requestAnimationFrame(() => ring.classList.add("play"));
        setTimeout(() => ring.remove(), 900);
      }, 80);
    },

    // 场地变更
    fieldChange() {
      const layer = document.getElementById("fxLayer");
      if (!layer) return;
      const sweep = document.createElement("div");
      sweep.className = "fx-field-sweep";
      layer.appendChild(sweep);
      requestAnimationFrame(() => sweep.classList.add("play"));
      setTimeout(() => sweep.remove(), 900);
    },

    // 获胜庆祝（全屏）
    win() {
      const layer = document.getElementById("fxLayer");
      if (!layer) return;
      // 光芒（屏幕中央）
      const rays = document.createElement("div");
      rays.className = "fx-win-rays";
      centerAt(rays, window.innerWidth / 2, window.innerHeight / 2);
      layer.appendChild(rays);
      requestAnimationFrame(() => rays.classList.add("play"));
      setTimeout(() => rays.remove(), 3200);
      // 金币/纸屑雨（全屏）：随机尺寸、轨迹和延迟提升空间层次
      const colors = ["#ffd166", "#ff6b35", "#4ade80", "#60a5fa", "#f472b6", "#c084fc", "#ffffff"];
      for (let i = 0; i < fxCount(42, 12); i++) {
        const conf = document.createElement("div");
        conf.className = "fx-confetti";
        conf.style.left = `${Math.random() * 100}%`;
        conf.style.top = "-20px";
        conf.style.background = colors[Math.floor(Math.random() * colors.length)];
        conf.style.animationDelay = `${Math.random() * 1.5}s`;
        conf.style.animationDuration = `${2.5 + Math.random() * 2}s`;
        conf.style.setProperty("--size", `${6 + Math.random() * 10}px`);
        conf.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
        conf.style.setProperty("--tx", `${(Math.random() - 0.5) * 200}px`);
        if (Math.random() > 0.6) conf.textContent = ["🔮", "✨", "⭐", "💰"][Math.floor(Math.random() * 4)];
        layer.appendChild(conf);
        requestAnimationFrame(() => conf.classList.add("play"));
        setTimeout(() => conf.remove(), 4500);
      }
    },

    // 失败
    lose() {
      const layer = document.getElementById("fxLayer");
      if (!layer) return;
      const sweep = document.createElement("div");
      sweep.className = "fx-field-sweep";
      sweep.style.background = "linear-gradient(90deg,transparent,rgba(100,100,120,.4),transparent)";
      layer.appendChild(sweep);
      requestAnimationFrame(() => sweep.classList.add("play"));
      setTimeout(() => sweep.remove(), 900);
    },

    // 回合提示（定位到玩家手牌区域）
    yourTurn() {
      const layer = document.getElementById("fxLayer");
      if (!layer) return;
      // 尝试获取玩家手牌区域位置
      const handArea = document.getElementById("hand");
      const ring = document.createElement("div");
      ring.className = "fx-turn-ring";
      if (handArea) {
        const rect = handArea.getBoundingClientRect();
        ring.style.position = "fixed";
        ring.style.left = (rect.left - 8) + "px";
        ring.style.top = (rect.top - 8) + "px";
        ring.style.width = (rect.width + 16) + "px";
        ring.style.height = (rect.height + 16) + "px";
        ring.style.borderRadius = "16px";
      }
      layer.appendChild(ring);
      requestAnimationFrame(() => ring.classList.add("play"));
      setTimeout(() => ring.remove(), 1300);
    },

    // 星石弹出（牌桌中央）
    coins(amount) {
      const layer = document.getElementById("fxLayer");
      if (!layer) return;
      const el = document.createElement("div");
      el.className = "fx-coin-pop";
      el.textContent = `+${amount || 100} 🔮`;
      el.style.color = "#ffd166";
      el.style.textShadow = "0 2px 8px rgba(0,0,0,.5)";
      const c = getTableCenter();
      centerAt(el, c.x, c.y);
      layer.appendChild(el);
      requestAnimationFrame(() => el.classList.add("play"));
      setTimeout(() => el.remove(), 1100);
    },

    // 额外回合（牌桌中央）
    extraTurn() {
      const layer = document.getElementById("fxLayer");
      if (!layer) return;
      const c = getTableCenter();
      const el = document.createElement("div");
      el.className = "fx-mult-pop";
      el.textContent = "额外回合！";
      el.style.fontSize = "36px";
      el.style.color = "#7eff9b";
      el.style.textShadow = "0 0 20px rgba(126,255,155,.7),0 4px 0 #1a5a2a";
      centerAt(el, c.x, c.y);
      layer.appendChild(el);
      requestAnimationFrame(() => el.classList.add("play"));
      setTimeout(() => el.remove(), 900);
      // 小火花
      for (let i = 0; i < 6; i++) {
        const spark = document.createElement("div");
        spark.className = "fx-spark";
        const angle = (i / 6) * Math.PI * 2;
        spark.style.position = "fixed";
        spark.style.left = c.x + "px";
        spark.style.top = c.y + "px";
        spark.style.setProperty("--sx", `${Math.cos(angle) * 50}px`);
        spark.style.setProperty("--sy", `${Math.sin(angle) * 50}px`);
        spark.style.background = "#7eff9b";
        layer.appendChild(spark);
        requestAnimationFrame(() => spark.classList.add("play"));
        setTimeout(() => spark.remove(), 700);
      }
    },

    // 污染（牌桌中央）
    pollution() {
      const layer = document.getElementById("fxLayer");
      if (!layer) return;
      const c = getTableCenter();
      const burst = document.createElement("div");
      burst.className = "fx-skill-burst";
      burst.style.background = "radial-gradient(circle,rgba(139,92,246,.7),transparent 70%)";
      centerAt(burst, c.x, c.y);
      layer.appendChild(burst);
      requestAnimationFrame(() => burst.classList.add("play"));
      setTimeout(() => burst.remove(), 600);
    },

    // 结界（牌桌中央，三连波）
    barrier() {
      const layer = document.getElementById("fxLayer");
      if (!layer) return;
      const c = getTableCenter();
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const ring = document.createElement("div");
          ring.className = "fx-ripple";
          ring.style.borderColor = "rgba(147,197,253,.8)";
          ring.style.animationDuration = "0.8s";
          centerAt(ring, c.x, c.y);
          layer.appendChild(ring);
          requestAnimationFrame(() => ring.classList.add("play"));
          setTimeout(() => ring.remove(), 1000);
        }, i * 150);
      }
    }
  };

  return {
    init, resume, SFX, FX, VO, playCardSound,
    startMusic, stopMusic,
    toggleSfx, toggleMusic,
    loadPrefs, applyPrefsUI,
    isSfxMuted: () => sfxMuted,
    isMusicMuted: () => musicMuted,
    isMusicPlaying: () => musicPlaying,
  };
})();

// 绑定音频按钮
document.addEventListener("DOMContentLoaded", () => {
  AudioSys.loadPrefs();
  AudioSys.applyPrefsUI();

  const sfxBtn = document.getElementById("sfxToggleBtn");
  const musicBtn = document.getElementById("musicToggleBtn");

  if (sfxBtn) sfxBtn.addEventListener("click", () => { AudioSys.toggleSfx(); });
  if (musicBtn) musicBtn.addEventListener("click", () => { AudioSys.toggleMusic(); });

  // 全局按钮点击音效
  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button, .btn, .icon-btn, .room-card, .skill-pick-card");
    if (btn && typeof AudioSys !== "undefined") {
      // 避免音频按钮自己触发双重音效
      if (btn.id === "sfxToggleBtn" || btn.id === "musicToggleBtn") return;
      AudioSys.SFX.click();
    }
  });

  // 用户首次交互时初始化音频（浏览器策略要求）
  const initOnInteract = () => {
    AudioSys.init();
    AudioSys.resume();
    if (!AudioSys.isMusicMuted()) AudioSys.startMusic();
    document.removeEventListener("click", initOnInteract);
    document.removeEventListener("keydown", initOnInteract);
  };
  document.addEventListener("click", initOnInteract, { once: false });
  document.addEventListener("keydown", initOnInteract, { once: false });
});

// ============================================================
// 管理员调试面板（密码保护）
// ============================================================
const AdminPanel = (() => {
  const PASSWORD = "admin888";
  let authed = false;
  let testSnapshot = null;

  const gameOnlyIds = [
    "adminWin","adminLose","adminMult2","adminExtraTurn","adminClearHand","adminDraw1","adminDraw5",
    "adminEnergyMax","adminForceField","adminClearField","adminRunAI","adminSaveSnapshot"
  ];

  function cloneState(value){
    if(typeof structuredClone==="function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function updateAdminStatus(extra=""){
    const el=document.getElementById("adminStatus");
    const hasGame=!!G;
    const active=hasGame && !G.gameOver;
    for(const id of gameOnlyIds){
      const btn=document.getElementById(id);
      if(btn) btn.disabled=!active;
    }
    const restoreBtn=document.getElementById("adminRestoreSnapshot");
    if(restoreBtn) restoreBtn.disabled=!testSnapshot;
    if(!el)return;
    if(!hasGame){
      el.innerHTML=`当前：<strong>未开始对局</strong>${extra?` · ${extra}`:""}`;
      return;
    }
    const p=currentPlayer();
    const phase=G.gameOver?"已结束":(G.phase==="play"?"出牌":G.phase==="draw"?"摸牌":G.phase);
    el.innerHTML=`当前：<strong>${p?.name||"未知"}</strong> · ${phase} · 手牌 ${G.players[0]?.hand.length??0} · 倍数 ${G.multiplier}× · 场地 ${G.field?.name||"无"}${extra?`<br>${extra}`:""}`;
  }

  function adminFeedback(message,button=null){
    if(typeof toast==="function") toast(message);
    updateAdminStatus(message);
    if(button){
      button.classList.remove("flash-ok");
      void button.offsetWidth;
      button.classList.add("flash-ok");
    }
  }

  function showPwd() {
    const mask = document.getElementById("adminPwdMask");
    const input = document.getElementById("adminPwdInput");
    const err = document.getElementById("adminPwdErr");
    if (!mask) return;
    mask.classList.add("show");
    if (err) err.textContent = "";
    if (input) {
      input.value = "";
      setTimeout(() => input.focus(), 50);
    }
  }

  function hidePwd() {
    const mask = document.getElementById("adminPwdMask");
    if (mask) mask.classList.remove("show");
  }

  function verify() {
    const input = document.getElementById("adminPwdInput");
    const err = document.getElementById("adminPwdErr");
    const val = input ? input.value : "";
    if (val === PASSWORD) {
      authed = true;
      hidePwd();
      showPanel();
    } else {
      if (err) err.textContent = "密码错误，请重试";
      if (input) {
        input.value = "";
        input.focus();
        input.style.animation = "none";
        input.offsetHeight;
        input.style.animation = "fxShake 0.3s ease-in-out";
      }
    }
  }

  function showPanel() {
    const panel = document.getElementById("adminPanel");
    if (panel) panel.classList.add("show");
    updateAdminStatus();
  }

  function hidePanel() {
    const panel = document.getElementById("adminPanel");
    if (panel) panel.classList.remove("show");
  }

  function open() {
    if (authed) {
      showPanel();
    } else {
      showPwd();
    }
  }

  // 初始化绑定
  function init() {
    const adminBtn = document.getElementById("adminBtn");
    if (adminBtn) adminBtn.addEventListener("click", open);

    // ===== 面板拖拽功能 =====
    const panel = document.getElementById("adminPanel");
    const header = document.getElementById("adminPanelHeader");
    let isDragging = false;
    let dragStartX = 0, dragStartY = 0;
    let panelStartLeft = 0, panelStartTop = 0;
    let hasMoved = false;

    function onDragStart(e) {
      // 忽略点击在按钮/输入框上的情况
      if (e.target.closest("button") || e.target.closest("input")) return;
      isDragging = true;
      hasMoved = false;
      const rect = panel.getBoundingClientRect();
      // 使用鼠标位置与面板左上角的偏移
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      panelStartLeft = rect.left;
      panelStartTop = rect.top;
      panel.classList.add("dragging");
      // 临时禁用 transform，改用 left/top 定位
      panel.style.transform = "none";
      panel.style.left = rect.left + "px";
      panel.style.top = rect.top + "px";
      e.preventDefault();
    }

    function onDragMove(e) {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;
      let newLeft = panelStartLeft + dx;
      let newTop = panelStartTop + dy;
      // 边界限制
      const rect = panel.getBoundingClientRect();
      const maxLeft = window.innerWidth - rect.width;
      const maxTop = window.innerHeight - rect.height;
      newLeft = Math.max(0, Math.min(newLeft, maxLeft));
      newTop = Math.max(0, Math.min(newTop, maxTop));
      panel.style.left = newLeft + "px";
      panel.style.top = newTop + "px";
    }

    function onDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      panel.classList.remove("dragging");
    }

    if (header && panel) {
      header.addEventListener("mousedown", onDragStart);
      document.addEventListener("mousemove", onDragMove);
      document.addEventListener("mouseup", onDragEnd);
      // 触摸支持
      header.addEventListener("touchstart", (e) => {
        if (e.target.closest("button") || e.target.closest("input")) return;
        const touch = e.touches[0];
        onDragStart({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => e.preventDefault(), target: e.target });
      }, { passive: false });
      document.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        onDragMove({ clientX: touch.clientX, clientY: touch.clientY });
        e.preventDefault();
      }, { passive: false });
      document.addEventListener("touchend", onDragEnd);
    }

    // 重写 showPanel 以支持重置位置（首次打开居中）
    const _origShowPanel = showPanel;
    showPanel = function() {
      if (panel) {
        // 如果从未拖动过，保持居中
        if (!panel.dataset.dragged) {
          panel.style.left = "";
          panel.style.top = "";
          panel.style.transform = "";
        }
      }
      _origShowPanel();
    };

    // 拖动结束后标记已拖动过
    if (header && panel) {
      header.addEventListener("mouseup", () => {
        if (hasMoved) panel.dataset.dragged = "1";
      });
      document.addEventListener("touchend", () => {
        if (hasMoved && panel) panel.dataset.dragged = "1";
      });
    }

    // 密码弹窗
    const pwdCancel = document.getElementById("adminPwdCancel");
    const pwdConfirm = document.getElementById("adminPwdConfirm");
    const pwdInput = document.getElementById("adminPwdInput");
    const pwdMask = document.getElementById("adminPwdMask");

    if (pwdCancel) pwdCancel.addEventListener("click", hidePwd);
    if (pwdConfirm) pwdConfirm.addEventListener("click", verify);
    if (pwdInput) {
      pwdInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") verify();
        if (e.key === "Escape") hidePwd();
      });
    }
    if (pwdMask) {
      pwdMask.addEventListener("click", (e) => {
        if (e.target === pwdMask) hidePwd();
      });
    }

    // 面板关闭 + 实时状态刷新
    const closeBtn = document.getElementById("adminPanelClose");
    if (closeBtn) closeBtn.addEventListener("click", hidePanel);
    setInterval(()=>{
      if(panel?.classList.contains("show")) updateAdminStatus();
    },500);

    // 音效测试按钮
    document.querySelectorAll("[data-sfx]").forEach(btn => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.sfx;
        if (typeof AudioSys !== "undefined" && AudioSys.SFX[name]) {
          AudioSys.SFX[name]();
        }
      });
    });

    // 视觉特效测试按钮
    document.querySelectorAll("[data-fx]").forEach(btn => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.fx;
        if (typeof AudioSys !== "undefined" && AudioSys.FX[name]) {
          AudioSys.FX[name]();
        }
      });
    });

    // 对局测试按钮
    const adminWin = document.getElementById("adminWin");
    if (adminWin) adminWin.addEventListener("click", () => {
      if (G && !G.gameOver && G.players[0]) win(G.players[0]);
    });

    const adminLose = document.getElementById("adminLose");
    if (adminLose) adminLose.addEventListener("click", () => {
      if (G && !G.gameOver && G.players[1]) win(G.players[1]);
    });

    const adminAddBeans = document.getElementById("adminAddBeans");
    if (adminAddBeans) adminAddBeans.addEventListener("click", () => {
      beanBalances[0] = (beanBalances[0] || 0) + 1000;
      saveBeanBalances();
      renderStoredBalance();
      if (G && G.players[0]) G.players[0].beans = beanBalances[0];
      if (typeof AudioSys !== "undefined") {
        AudioSys.SFX.coins();
        AudioSys.FX.coins(1000);
      }
      adminFeedback("已增加 1000 星石",adminAddBeans);
    });

    const adminMult2 = document.getElementById("adminMult2");
    if (adminMult2) adminMult2.addEventListener("click", () => {
      if (!G || G.gameOver) return;
      G.multiplier *= 2;
      render();
      if (typeof AudioSys !== "undefined") {
        AudioSys.SFX.multUp();
        AudioSys.FX.multUp(`倍数 ×${G.multiplier}`);
      }
      adminFeedback(`当前倍数 ${G.multiplier}×`,adminMult2);
    });

    const adminExtraTurn = document.getElementById("adminExtraTurn");
    if (adminExtraTurn) adminExtraTurn.addEventListener("click", () => {
      if (!G || G.gameOver || !G.players[0]) return;
      G.players[0].extraTurns++;
      if (typeof AudioSys !== "undefined") {
        AudioSys.SFX.extraTurn();
        AudioSys.FX.extraTurn();
      }
      adminFeedback(`你的额外回合：${G.players[0].extraTurns}`,adminExtraTurn);
    });

    const adminClearHand = document.getElementById("adminClearHand");
    if (adminClearHand) adminClearHand.addEventListener("click", () => {
      if (!G || G.gameOver || !G.players[0]) return;
      G.players[0].hand = [];
      selected.clear();
      render();
      adminFeedback("已清空你的手牌（不自动判胜）",adminClearHand);
    });

    const drawAdminCards=(count,btn)=>{
      if (!G || G.gameOver || !G.players[0]) return;
      drawTo(G.players[0], count, "skill");
      render();
      adminFeedback(`已摸 ${count} 张，当前手牌 ${G.players[0].hand.length}`,btn);
    };
    const adminDraw1 = document.getElementById("adminDraw1");
    if (adminDraw1) adminDraw1.addEventListener("click", () => drawAdminCards(1,adminDraw1));
    const adminDraw5 = document.getElementById("adminDraw5");
    if (adminDraw5) adminDraw5.addEventListener("click", () => drawAdminCards(5,adminDraw5));

    const adminEnergyMax=document.getElementById("adminEnergyMax");
    if(adminEnergyMax) adminEnergyMax.addEventListener("click",()=>{
      if(!G || G.gameOver || !G.players[0])return;
      G.players[0].energy=8;
      render();
      adminFeedback(G.players[0].skill.id==="charge"?"充能已设为 8":"能量值已设为 8；当前技能不是充能",adminEnergyMax);
    });

    const adminForceField = document.getElementById("adminForceField");
    if (adminForceField) adminForceField.addEventListener("click", async () => {
      if (!G || G.gameOver) return;
      await drawField();
      adminFeedback(`场地：${G.field?.name||"无"}`,adminForceField);
    });

    const adminClearField=document.getElementById("adminClearField");
    if(adminClearField) adminClearField.addEventListener("click",()=>{
      if(!G || G.gameOver)return;
      G.field=null;
      G.fieldRoundsLeft=0;
      render();
      adminFeedback("已清除当前场地",adminClearField);
    });

    const adminRunAI=document.getElementById("adminRunAI");
    if(adminRunAI) adminRunAI.addEventListener("click",()=>{
      if(!G || G.gameOver)return;
      const p=currentPlayer();
      if(!p?.isAI){adminFeedback("当前不是 AI 回合");return;}
      if(aiTimer){clearTimeout(aiTimer);aiTimer=null;}
      aiAct();
      adminFeedback(`已立即执行 ${p.name} 的 AI`,adminRunAI);
    });

    const adminSaveSnapshot=document.getElementById("adminSaveSnapshot");
    if(adminSaveSnapshot) adminSaveSnapshot.addEventListener("click",()=>{
      if(!G || G.gameOver)return;
      testSnapshot={game:cloneState(G),balances:[...beanBalances]};
      updateAdminStatus("测试快照已保存");
      adminFeedback("测试快照已保存",adminSaveSnapshot);
    });

    const adminRestoreSnapshot=document.getElementById("adminRestoreSnapshot");
    if(adminRestoreSnapshot) adminRestoreSnapshot.addEventListener("click",()=>{
      if(!testSnapshot)return;
      clearTimeout(aiTimer); aiTimer=null;
      G=cloneState(testSnapshot.game);
      beanBalances.splice(0,beanBalances.length,...testSnapshot.balances);
      selected.clear();
      saveBeanBalances();
      renderStoredBalance();
      updateTrapArming();
      render();
      if(currentPlayer()?.isAI && G.phase==="play") scheduleAI();
      adminFeedback("已恢复测试快照",adminRestoreSnapshot);
    });

    // 快捷工具
    const adminDumpState = document.getElementById("adminDumpState");
    if (adminDumpState) adminDumpState.addEventListener("click", () => {
      if (G) {
        console.log("=== 游戏状态 ===", G);
        console.log("玩家手牌:", G.players.map(p => ({
          name: p.name, hand: p.hand.length,
          cards: p.hand.map(c => c.rank + c.suit).join(" "),
          extra: p.extraTurns, skill: p.skill.name
        })));
        console.log("当前玩家:", currentPlayer().name, "阶段:", G.phase);
        console.log("倍数:", G.multiplier);
        adminFeedback("游戏状态已打印到控制台",adminDumpState);
      } else {
        adminFeedback("当前没有进行中的对局");
      }
    });

    const adminResetBeans = document.getElementById("adminResetBeans");
    if (adminResetBeans) adminResetBeans.addEventListener("click", () => {
      if (confirm(`确定重置所有玩家星石为 ${MATCH_RULES.startingBalance}？`)) {
        for (let i = 0; i < beanBalances.length; i++) beanBalances[i] = MATCH_RULES.startingBalance;
        saveBeanBalances();
        renderStoredBalance();
        if (G) {
          for (let i = 0; i < G.players.length; i++) {
            G.players[i].beans = MATCH_RULES.startingBalance;
          }
          render();
        }
        adminFeedback(`所有玩家星石已重置为 ${MATCH_RULES.startingBalance}`,adminResetBeans);
      }
    });

    // ESC 关闭面板
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        hidePanel();
        hidePwd();
      }
    });
  }

  return { open, init, isAuthed: () => authed };
})();

// 初始化管理员面板
document.addEventListener("DOMContentLoaded", () => {
  AdminPanel.init();
  initSaveTransferUI();
});

// Initial render only
renderStoredBalance();
updateLobbyRooms();
syncLobbyMode();


// V0.33 compact menu auto-close
document.addEventListener("DOMContentLoaded",()=>{document.querySelectorAll(".lobby-more-menu button,.topbar-more-menu button").forEach(btn=>btn.addEventListener("click",()=>btn.closest("details")?.removeAttribute("open")));});


// V0.33 UI: compact menus close consistently on outside click / Escape / resize.
(function initCompactMenuDismiss(){
  const closeMenus=()=>document.querySelectorAll("details.topbar-more[open],details.lobby-more[open]").forEach(el=>el.removeAttribute("open"));
  document.addEventListener("pointerdown",e=>{
    document.querySelectorAll("details.topbar-more[open],details.lobby-more[open]").forEach(el=>{
      if(!el.contains(e.target))el.removeAttribute("open");
    });
  },true);
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenus();});
  window.addEventListener("resize",closeMenus,{passive:true});
})();

