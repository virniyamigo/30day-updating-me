const KEY = "growthTrackerV1";
const categories = [
  {id:"english",name:"English",subtitle:"30–60 хв"},
  {id:"coding",name:"Coding",subtitle:"мінімум 1 практична задача"},
  {id:"ai",name:"AI",subtitle:"1 інструмент або мініпроєкт"},
  {id:"sport",name:"Sport",subtitle:"10–20 хв"},
  {id:"mind",name:"Mind",subtitle:"щоденник / психологія"}
];

function defaultState(){
  return {
    profile:{name:"",goal:"",englishMinutes:30},
    today:{},
    notes:{},
    days:Array.from({length:30},(_,i)=>({day:i+1,done:false})),
    journal:[]
  };
}
let state = load();
function load(){
  try{return {...defaultState(),...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return defaultState()}
}
function save(){localStorage.setItem(KEY,JSON.stringify(state));renderAll()}
function dateKey(){return new Date().toISOString().slice(0,10)}
function todayObj(){const k=dateKey(); if(!state.today[k]) state.today[k]={}; return state.today[k]}

function renderToday(){
  document.getElementById("todayDate").textContent = new Intl.DateTimeFormat("uk-UA",{weekday:"long",day:"numeric",month:"long"}).format(new Date());
  const box=document.getElementById("todayTasks"); box.innerHTML="";
  const data=todayObj();
  categories.forEach(c=>{
    const el=document.createElement("button");
    el.className="task "+(data[c.id]?"done":"");
    el.innerHTML=`<div class="check">${data[c.id]?"✓":""}</div><div style="text-align:left"><strong>${c.name}</strong><small>${c.subtitle}</small></div>`;
    el.onclick=()=>{data[c.id]=!data[c.id]; save()};
    box.appendChild(el);
  });
  const done=categories.filter(c=>data[c.id]).length;
  const pct=Math.round(done/categories.length*100);
  document.getElementById("dailyPct").textContent=pct+"%";
  document.getElementById("dailyRing").style.background=`conic-gradient(var(--accent) ${pct*3.6}deg,#2a2a2f 0deg)`;
  const note=document.getElementById("quickNote");
  note.value=state.notes[dateKey()]||"";
}

function renderPlan(){
  const list=document.getElementById("daysList"); list.innerHTML="";
  state.days.forEach(d=>{
    const el=document.createElement("div"); el.className="day-row";
    el.innerHTML=`<div><div class="day-title">Day ${d.day}</div><div class="muted">Щоденний мінімум по 5 напрямках</div></div><button class="${d.done?"primary":"ghost"}">${d.done?"Готово":"Відмітити"}</button>`;
    el.querySelector("button").onclick=()=>{d.done=!d.done;save()};
    list.appendChild(el);
  });
  const done=state.days.filter(d=>d.done).length, pct=Math.round(done/30*100);
  document.getElementById("planSummary").textContent=`${done}/30`;
  document.getElementById("planBar").style.width=pct+"%";
}
function renderJournal(){
  const wrap=document.getElementById("journalEntries"); wrap.innerHTML="";
  state.journal.slice().reverse().forEach(e=>{
    const d=document.createElement("div");d.className="entry";
    d.innerHTML=`<small>${new Date(e.ts).toLocaleString("uk-UA")}</small><p style="white-space:pre-wrap;margin:8px 0 0">${escapeHtml(e.text)}</p>`;
    wrap.appendChild(d)
  });
}
function renderProgress(){
  const allToday=Object.values(state.today);
  const totalChecks=allToday.reduce((s,x)=>s+categories.filter(c=>x[c.id]).length,0);
  const activeDays=allToday.filter(x=>categories.some(c=>x[c.id])).length;
  const planDone=state.days.filter(d=>d.done).length;
  document.getElementById("statsGrid").innerHTML=`
    <div class="stat"><span class="muted">Активні дні</span><b>${activeDays}</b></div>
    <div class="stat"><span class="muted">Виконано</span><b>${totalChecks}</b></div>
    <div class="stat"><span class="muted">30-day plan</span><b>${planDone}/30</b></div>
    <div class="stat"><span class="muted">Journal</span><b>${state.journal.length}</b></div>`;
  const wrap=document.getElementById("categoryProgress");wrap.innerHTML="";
  categories.forEach(c=>{
    const hits=allToday.filter(x=>x[c.id]).length;
    const pct=activeDays?Math.round(hits/activeDays*100):0;
    const el=document.createElement("div");el.className="catline";
    el.innerHTML=`<div class="label"><span>${c.name}</span><span class="muted">${pct}%</span></div><div class="progress"><div style="width:${pct}%"></div></div>`;
    wrap.appendChild(el);
  });
}
function renderSettings(){
  userName.value=state.profile.name||"";
  mainGoal.value=state.profile.goal||"";
  englishMinutes.value=state.profile.englishMinutes||30;
}
function renderAll(){renderToday();renderPlan();renderJournal();renderProgress();renderSettings()}

function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}

document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.querySelector(`[data-page="${b.dataset.go}"]`).classList.add("active");
  document.querySelectorAll(".tabbar button").forEach(x=>x.classList.remove("active"));b.classList.add("active");
  pageTitle.textContent={today:"Today",plan:"30 Days",journal:"Journal",progress:"Progress",settings:"Settings"}[b.dataset.go];
});
quickNote.addEventListener("input",()=>{state.notes[dateKey()]=quickNote.value;localStorage.setItem(KEY,JSON.stringify(state))});
resetToday.onclick=()=>{state.today[dateKey()]={};save()};
saveJournal.onclick=()=>{
  const text=journalText.value.trim(); if(!text)return;
  state.journal.push({ts:Date.now(),text}); journalText.value="";save();
};
clearJournal.onclick=()=>journalText.value="";
saveSettings.onclick=()=>{
  state.profile={name:userName.value.trim(),goal:mainGoal.value.trim(),englishMinutes:+englishMinutes.value||30};save();
  alert("Збережено");
};
wipeData.onclick=()=>{
  if(confirm("Видалити всі локальні дані?")){localStorage.removeItem(KEY);state=defaultState();save()}
};
if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{})}
renderAll();
