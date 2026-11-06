// ===================================
// 毎日自動更新！ 開催場リスト
// times: 各レースの実際の発走時刻 ["HH:MM", ...] 12本
// ===================================
const VENUES = [
  { name:'桐生',   jcd:'01', series:'第38回日本モーターボート選手会会長杯', times:['08:30','08:55','09:20','09:45','10:10','10:35','11:00','11:25','11:50','12:15','12:40','13:05'] },
  { name:'江戸川', jcd:'03', series:'第2回Sammyカップ',                    times:['10:30','10:55','11:20','11:45','12:10','12:35','13:00','13:25','13:50','14:15','14:40','15:05'] },
  { name:'平和島', jcd:'04', series:'第1回FC東京杯',                       times:['10:15','10:40','11:05','11:30','11:55','12:20','12:45','13:10','13:35','14:00','14:25','14:50'] },
  { name:'常滑',   jcd:'08', series:'マリンキング決定戦',                  times:['10:30','10:55','11:20','11:45','12:10','12:35','13:00','13:25','13:50','14:15','14:40','15:05'] },
  { name:'津',     jcd:'09', series:'津オールレディース マクール杯',       times:['10:20','10:45','11:10','11:35','12:00','12:25','12:50','13:15','13:40','14:05','14:30','14:55'] },
  { name:'三国',   jcd:'10', series:'新東通信杯',                         times:['10:30','10:55','11:20','11:45','12:10','12:35','13:00','13:25','13:50','14:15','14:40','15:05'] },
  { name:'びわこ', jcd:'11', series:'びわこお魚0929CUP',                  times:['11:00','11:25','11:50','12:15','12:40','13:05','13:30','13:55','14:20','14:45','15:10','15:35'] },
  { name:'住之江', jcd:'12', series:'第54回高松宮記念特別競走',           times:['10:30','10:55','11:20','11:45','12:10','12:35','13:00','13:25','13:50','14:15','14:40','15:05'] },
  { name:'丸亀',   jcd:'15', series:'楽天銀行賞',                         times:['10:00','10:25','10:50','11:15','11:40','12:05','12:30','12:55','13:20','13:45','14:10','14:35'] },
  { name:'宮島',   jcd:'17', series:'ルーキーシリーズ第21戦',             times:['10:00','10:25','10:50','11:15','11:40','12:05','12:30','12:55','13:20','13:45','14:10','14:35'] },
  { name:'芦屋',   jcd:'21', series:'BTS開設15周年記念',                  times:['10:00','10:25','10:50','11:15','11:40','12:05','12:30','12:55','13:20','13:45','14:10','14:35'] },
  { name:'福岡',   jcd:'22', series:'ばんえい十勝杯',                     times:['10:30','10:55','11:20','11:45','12:10','12:35','13:00','13:25','13:50','14:15','14:40','15:05'] },
];

const TODAY = new Date();
const DATENUM = TODAY.getFullYear()*10000+(TODAY.getMonth()+1)*100+TODAY.getDate();

function seeded(s){ const x=Math.sin(s+1)*10000; return x-Math.floor(x); }

const BOAT_POSITIVE=['モーター出足◎','展示タイム最速','スタート安定','前付け積極的','ターン巧み','気配抜群'];
const BOAT_NEUTRAL=['展示平均的','スタート普通','前走並み','モーター標準','ターン無難','様子見'];
const BOAT_NEGATIVE=['スタートに不安','モーター出足×','展示タイム遅め','前走凡走','ターン膨らみ','気配イマイチ'];

const SAFE_COMMENTS=[
  '1号艇が抜群のスタート展示。展示タイムも上々で軸として信頼。',
  '1号艇の前付けが決まる展開。スタート展示でも好調を確認。',
  '1号艇モーター替え効果あり。2・3号艇の気配も上々。',
  '1号艇が今節ベストのスタート展示。内枠有利な展開へ。',
  '直前情報で1号艇の出足評価が上がった。内枠勢で固める。',
];
const BOLD_COMMENTS=[
  '5・6号艇がダッシュで強気の展開。高配当狙いで。',
  '外枠勢が激しく競り合う展開。万舟の可能性あり。',
  '4・5号艇の展示タイムが際立って速い。逆転の一手。',
  '6号艇が今節好調。穴狙いに最適な気配。',
  '中穴以上を狙うなら今レース。外枠の仕掛けに注目。',
];

function getBoatEval(r){ return r<0.4?'good':r<0.7?'mid':'bad'; }
function getBoatComment(r,ev){
  const idx=Math.floor(r*6);
  return ev==='good'?BOAT_POSITIVE[idx%6]:ev==='mid'?BOAT_NEUTRAL[idx%6]:BOAT_NEGATIVE[idx%6];
}
const EV_LABEL={'good':'好調','mid':'普通','bad':'不調'};

function getPreds(vi, ri){
  const base=DATENUM+vi*1000+ri*7;
  const r1=seeded(base);
  const sec=r1<0.5?2:3;
  const nirenF=`1-${sec}`;
  const others=[2,3,4,5,6].filter(n=>n!==sec);
  const r2=seeded(base+1);
  const thr=others[Math.floor(r2*others.length)];
  const rVar=seeded(base+11);
  let sanF;
  const rPos=seeded(base+14);
  let sanArr;
  if(rVar<0.4){
    const hi=[3,4,5,6];
    const ra=seeded(base+12),rb=seeded(base+13);
    const ha=hi[Math.floor(ra*hi.length)];
    const hb=hi.filter(n=>n!==ha)[Math.floor(rb*(hi.length-1))];
    sanArr=[ha,hb,1];
  } else {
    sanArr=[sec,thr,1];
  }
  const pos=Math.floor(rPos*3);
  const others2=sanArr.filter(n=>n!==1);
  if(pos===0) sanArr=[1,others2[0],others2[1]];
  else if(pos===1) sanArr=[others2[0],1,others2[1]];
  else sanArr=[others2[0],others2[1],1];
  sanF=sanArr.join('-');
  const boldPairs=[[6,5],[5,6],[6,4],[4,6],[5,4],[4,5],[6,3],[3,6],[5,3],[3,5],[4,3],[3,4]];
  const r3=seeded(base+2);
  const pair=boldPairs[Math.floor(r3*boldPairs.length)];
  const nirenT=pair.join('-');
  const remAll=[1,2,3,4,5,6].filter(n=>!pair.includes(n));
  const remHi=remAll.filter(n=>n>=3);
  const r4=seeded(base+3);
  const remPool=remHi.length>0?remHi:remAll;
  const t3=remPool[Math.floor(r4*remPool.length)];
  const sanT=[...pair,t3].join('-');
  const r5=seeded(base+4);
  const safeC=SAFE_COMMENTS[Math.floor(r5*SAFE_COMMENTS.length)];
  const r6=seeded(base+5);
  const boldC=BOLD_COMMENTS[Math.floor(r6*BOLD_COMMENTS.length)];
  const nFOdds=(2+seeded(base+6)*3).toFixed(1);
  const nTOdds=(5+seeded(base+7)*15).toFixed(1);
  const sFOdds=(8+seeded(base+8)*20).toFixed(1);
  const sTOdds=(30+seeded(base+9)*200).toFixed(0);
  const boats=[];
  for(let b=1;b<=6;b++){
    const br=seeded(base+b*10);
    const ev=getBoatEval(br);
    const bc=getBoatComment(seeded(base+b*10+1),ev);
    boats.push({num:b,ev,comment:bc});
  }
  return {nirenF,nirenT,sanF,sanT,safeC,boldC,nFOdds,nTOdds,sFOdds,sTOdds,boats};
}

function getRaceTimes(v){
  return v.times.map(t=>{const[h,m]=t.split(':').map(Number);return{h,m};});
}

function getStatus(rt,now){
  const rm=rt.h*60+rt.m;
  const nm=now.getHours()*60+now.getMinutes();
  const diff=rm-nm;
  if(diff>7) return {s:'wait',diff};
  if(diff>=-15) return {s:'open',diff};
  return {s:'done',diff};
}

function pad2(n){return String(n).padStart(2,'0')}
function formatTime(rt){return `${pad2(rt.h)}:${pad2(rt.m)}`}


let currentVenue=0;
let selectedAmt={};

function renderTabs(){
  const tb=document.getElementById('tabs');
  tb.innerHTML='';
  VENUES.forEach((v,i)=>{
    const btn=document.createElement('button');
    btn.className='tab'+(i===currentVenue?' on':'');
    btn.textContent=v.name;
    btn.onclick=()=>{currentVenue=i;selectedAmt={};renderTabs();renderMain();};
    tb.appendChild(btn);
  });
}

function renderMain(){
  const now=new Date();
  const v=VENUES[currentVenue];
  const times=getRaceTimes(v);

  document.getElementById('vtitle').innerHTML=
    `<strong>ボートレース${v.name}</strong>　${v.series}`;


  const rc=document.getElementById('races');
  rc.innerHTML='';
  times.forEach((rt,i)=>{
    const ri=i+1;
    const st=getStatus(rt,now);
    const p=getPreds(currentVenue,ri);
    const card=document.createElement('div');
    card.className='card';
    let inner='';
    const badge=st.s==='wait'
      ?`<span class="badge b-wait">事前・直前情報待ち</span>`
      :st.s==='open'
      ?`<span class="badge b-open">&#9654; 予想公開中</span>`
      :`<span class="badge b-done">発走済</span>`;
    inner+=`<div class="card-hdr">
      <span class="r-num">第${ri}レース</span>
      <span class="r-time">${formatTime(rt)} 発走</span>
      ${badge}
    </div>`;
    if(st.s==='wait'){
      let soon='';
      if(st.diff<=30) soon=`<div class="wait-soon">&#9203; あと約${st.diff}分で予想公開</div>`;
      inner+=`<div class="wait-body">
        <div class="wait-icon">&#128225;</div>
        <div class="wait-txt">事前・直前情報 収集中...</div>
        <div class="wait-sub">展示タイム・スタート展示・選手コメント 情報待ち</div>
        ${soon}
      </div>`;
    } else if(st.s==='open'){
      const cls=['c1','c2','c3','c4','c5','c6'];
      const boatRows=p.boats.map(b=>{
        const ev=b.ev;
        return `<tr>
          <td class="boat-no"><span class="bn2 ${cls[b.num-1]}">${b.num}</span></td>
          <td class="boat-comment">${b.comment}</td>
          <td><span class="boat-eval ev-${ev}">${EV_LABEL[ev]}</span></td>
        </tr>`;
      }).join('');
      const amt=selectedAmt[ri]||100;
      const simId=`sim-${ri}`;
      inner+=`<div class="pred-wrap">
        <div class="pred-comment">
          &#128309; 安定軸：${p.safeC}<br>
          &#128312; 大穴狙：${p.boldC}
        </div>
        <table class="boat-table">
          <tr><th>艇</th><th>直前コメント</th><th>気配</th></tr>
          ${boatRows}
        </table>
        <div class="pred-grid">
          <div class="pbox">
            <div class="plabel">2連複 ◆安定</div>
            <div class="pval c-blue">${p.nirenF}</div>
            <div class="phint">推定オッズ ${p.nFOdds}倍</div>
          </div>
          <div class="pbox">
            <div class="plabel">2連単 ◆穴</div>
            <div class="pval c-red">${p.nirenT}</div>
            <div class="phint">推定オッズ ${p.nTOdds}倍</div>
          </div>
          <div class="pbox">
            <div class="plabel">3連複 ◆安定</div>
            <div class="pval c-purple">${p.sanF}</div>
            <div class="phint">推定オッズ ${p.sFOdds}倍</div>
          </div>
          <div class="pbox">
            <div class="plabel">3連単 ◆本命穴</div>
            <div class="pval c-gold">${p.sanT}</div>
            <div class="phint">推定オッズ ${p.sTOdds}倍</div>
          </div>
        </div>
        <div class="sim-wrap" id="${simId}">
          <div class="sim-title">&#128180; 払い戻しシミュレーター</div>
          <div class="sim-btns">
            ${[100,300,500,1000,3000].map(a=>
              `<button class="sim-btn${a===amt?' on':''}" onclick="selectAmt(${ri},${a},'${simId}',${p.nFOdds},${p.nTOdds},${p.sFOdds},${p.sTOdds})">${a.toLocaleString()}円</button>`
            ).join('')}
          </div>
          <div class="sim-result" id="${simId}-res">
            ${simResult(amt,p.nFOdds,p.nTOdds,p.sFOdds,p.sTOdds)}
          </div>
        </div>
        <div class="card-footer">※本予想はエンタメ目的のダミーです。賭けは自己責任で。</div>
      </div>`;
    } else {
      inner+=`<div class="done-body">レース終了</div>`;
    }
    card.innerHTML=inner;
    rc.appendChild(card);
  });
}

function simResult(amt,nF,nT,sF,sT){
  return `
    <div class="sim-row"><span class="sim-label">2連複</span><span class="sim-pay">¥${Math.round(amt*nF).toLocaleString()}</span></div>
    <div class="sim-row"><span class="sim-label">2連単</span><span class="sim-pay">¥${Math.round(amt*nT).toLocaleString()}</span></div>
    <div class="sim-row"><span class="sim-label">3連複</span><span class="sim-pay">¥${Math.round(amt*sF).toLocaleString()}</span></div>
    <div class="sim-row"><span class="sim-label">3連単</span><span class="sim-pay">¥${Math.round(amt*sT).toLocaleString()}</span></div>`;
}

function selectAmt(ri,amt,simId,nF,nT,sF,sT){
  selectedAmt[ri]=amt;
  const wrap=document.getElementById(simId);
  wrap.querySelectorAll('.sim-btn').forEach(b=>{
    b.classList.toggle('on',b.textContent===amt.toLocaleString()+'円');
  });
  document.getElementById(simId+'-res').innerHTML=simResult(amt,nF,nT,sF,sT);
}

function updateClock(){
  const now=new Date();
  document.getElementById('clock').textContent=
    `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
}

const VENUE_NAMES_MAP={1:'桐生',2:'戸田',3:'江戸川',4:'平和島',5:'多摩川',6:'浜名湖',7:'蒲郡',8:'常滑',9:'津',10:'三国',11:'びわこ',12:'住之江',13:'尼崎',14:'鳴門',15:'丸亀',16:'児島',17:'宮島',18:'徳山',19:'下関',20:'若松',21:'芦屋',22:'福岡',23:'唐津',24:'大村'};

async function fetchRealData(){
  const backup=[...VENUES];
  try{
    const ctrl=new AbortController();
    const tid=setTimeout(()=>ctrl.abort(),8000);
    const res=await fetch('https://boatraceopenapi.github.io/programs/v3/today.json',{cache:'no-store',signal:ctrl.signal});
    clearTimeout(tid);
    if(!res.ok) return;
    const data=await res.json();
    if(!data.programs||!data.programs.length) return;
    const venueMap={};
    for(const p of data.programs){
      const sn=p.stadium_number;
      if(!venueMap[sn]) venueMap[sn]={raceNums:[],times:[]};
      venueMap[sn].raceNums.push(p.number);
      const t=p.closed_at?p.closed_at.slice(11,16):'';
      venueMap[sn].times.push(t);
    }
    const newVenues=[];
    for(const sn of Object.keys(venueMap).map(Number).sort((a,b)=>a-b)){
      const v=venueMap[sn];
      const jcd=String(sn).padStart(2,'0');
      newVenues.push({
        name: VENUE_NAMES_MAP[sn]||`会場${sn}`,
        jcd,
        series:'',
        times: v.times.slice(0,12)
      });
    }
    if(newVenues.length>0){
      VENUES.length=0;
      for(const v of newVenues) VENUES.push(v);
    }
  }catch(e){}
  if(VENUES.length===0){
    for(const v of backup) VENUES.push(v);
  }
}

async function init(){
  const now=new Date();
  const y=now.getFullYear(),mo=now.getMonth()+1,d=now.getDate();
  const days=['日','月','火','水','木','金','土'];
  document.getElementById('today-date').textContent=`${y}年${mo}月${d}日（${days[now.getDay()]}）`;
  document.getElementById('venue-count').textContent=`読み込み中...`;
  updateClock();
  setInterval(updateClock,1000);
  await fetchRealData();
  document.getElementById('venue-count').textContent=`本日${VENUES.length}場開催`;
  renderTabs();
  renderMain();
  setInterval(renderMain,30000);
}


init();
