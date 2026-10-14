import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
await build({
  entryPoints: [path.join(root, "src", "browser.js")],
  bundle: true,
  format: "iife",
  globalName: "LIFE",
  minify: true,
  outfile: path.join(root, "demo", "dist", "lifecycle.js"),
  logLevel: "silent",
});
const cards = JSON.parse(
  fs.readFileSync(path.join(root, "outputs", "dark_mode_task_cards.json"), "utf8"),
);
const inputs = JSON.parse(
  fs.readFileSync(
    path.join(root, "..", "day-16-ai-coo", "inputs", "coo_inputs.demo-complete.json"),
    "utf8",
  ),
);

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Day 17 - AI-COO lifecycle</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:22px;background:#f1f3f9;color:#1b2240;font-family:system-ui,"Segoe UI",Roboto,sans-serif}
h1{margin:0 0 4px;font-size:1.4rem}.sub{margin:0 0 12px;color:#5a6280}
.grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:16px;max-width:1340px}
.panel{background:#fff;border-radius:12px;box-shadow:0 4px 16px rgb(27 34 64/10%);overflow:hidden}
.panel h2{margin:0;padding:10px 14px;font-size:.98rem;background:#eef0f8}
.waves{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;padding:10px}
.wave h4{margin:0 0 6px;font-size:.72rem;color:#5a6280;text-transform:uppercase}
.card{border:1px solid #c9ccd8;border-left-width:5px;border-radius:8px;padding:6px 8px;margin-bottom:6px;font-size:.74rem;line-height:1.3}
.card b{display:block;font-size:.78rem}.card small{color:#5a6280}
.task-agent{border-left-color:#2f4bd6}.review-agent{border-left-color:#b7791f}.human{border-left-color:#1a8f4c;background:#f2fbf5}
.stages{padding:10px 12px;display:grid;gap:5px}
.stage{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-radius:8px;background:#eef0f8;font-size:.84rem}
.stage em{font-style:normal;font-size:.68rem;font-weight:800;color:#5a6280}.stage.done{background:#e3f6ea}.stage.done::after{content:"done";font-size:.68rem;font-weight:800;color:#14633a}
.stage.current{outline:2px solid #2f4bd6}
.bar{padding:0 12px 10px;display:flex;gap:6px;flex-wrap:wrap}
button{font:inherit;font-size:.8rem;font-weight:700;padding:6px 10px;border:0;border-radius:8px;background:#2f4bd6;color:#fff;cursor:pointer}
button.bad{background:#fde8e8;color:#9b1c1c}button.alt{background:#e8ebf7;color:#1b2240}
#log{list-style:none;margin:0;padding:0;max-height:520px;overflow:auto}
#log li{padding:6px 14px;border-top:1px solid #eef0f8;font-size:.78rem}.ok{background:#f2fbf5}.no{background:#fff6f5}
.tag{font-weight:800}.ok .tag{color:#1a8f4c}.no .tag{color:#d92d20}code{background:#eef0f8;padding:0 5px;border-radius:4px}
</style></head><body>
<h1>Day 17 - AI-COO task lifecycle: "Add dark mode"</h1>
<p class="sub">Task cards from the AI-COO (left, validated by the real validator) and the lifecycle with human gates (right, the real state machine).</p>
<div class="grid">
 <section class="panel"><h2 id="cardsTitle">Task cards</h2><div class="waves" id="waves"></div></section>
 <section class="panel"><h2>Lifecycle - <span id="state"></span></h2><div class="stages" id="stages"></div>
  <div class="bar"><button id="next">Next valid step</button><button class="alt" id="reset">Reset</button></div>
  <div class="bar" id="illegal"></div>
 </section>
</div>
<section class="panel" style="max-width:1340px;margin-top:16px"><h2>Audit log (every attempt: accepted or rejected, with the reason)</h2><ul id="log"></ul></section>
<script src="dist/lifecycle.js"></script>
<script>
const CARDS=${JSON.stringify(cards.cards)};const INPUTS=${JSON.stringify(inputs)};
const A={owner:{kind:"human",id:"Mirza Yasir Abdullah Baig"},reviewer:{kind:"human",id:"Ayesha Khan"},coo:{kind:"ai_coo",id:"coo-1"},task:{kind:"task_agent",id:"task-agent-1"},review:{kind:"review_agent",id:"review-agent-1"},system:{kind:"system",id:"ci"}};
const SHA="a1b2c3d",SHA2="e4f5a6b";const checks=[{command:"npm run verify",exitCode:0}];
const HAPPY=[{type:"approve_objective",actor:A.owner},{type:"generate_tasks",actor:A.coo,payload:{cards:CARDS}},{type:"implement",actor:A.task,payload:{sha:SHA}},{type:"report_evidence",actor:A.task,payload:{sha:SHA,checks}},{type:"review",actor:A.review,payload:{sha:SHA,verdict:"approve"}},{type:"final_ci",actor:A.system,payload:{sha:SHA,status:"passed"}},{type:"approve_merge",actor:A.reviewer,payload:{}},{type:"draft_release_note",actor:A.coo,payload:{text:"Dark mode added."}}];
const ILLEGAL=[["AI agent approves merge",{type:"approve_merge",actor:A.review,payload:{}}],["Author approves own merge",{type:"approve_merge",actor:A.owner,payload:{}}],["Skip ahead: approve merge now",{type:"approve_merge",actor:A.reviewer,payload:{}}],["Implementer reviews itself",{type:"review",actor:{kind:"review_agent",id:"task-agent-1"},payload:{sha:SHA,verdict:"approve"}}],["CI 'not_run' reported",{type:"final_ci",actor:A.system,payload:{sha:SHA,status:"not_run"}}],["CI on a different SHA",{type:"final_ci",actor:A.system,payload:{sha:SHA2,status:"passed"}}],["New commit (Final Candidate Rule)",{type:"implement",actor:A.task,payload:{sha:SHA2}}]];
let run,step;const log=document.getElementById("log");
const waves=LIFE.validateTaskCards(CARDS);
document.getElementById("cardsTitle").textContent="Task cards - "+(waves.valid?"VALID":"INVALID")+": "+CARDS.length+" cards in "+waves.waves.length+" waves";
document.getElementById("waves").innerHTML=waves.waves.map((w,i)=>'<div class="wave"><h4>Wave '+(i+1)+'</h4>'+w.map(id=>{const c=CARDS.find(x=>x.id===id);return '<div class="card '+c.assignee+'"><b>'+c.id+" "+c.title+'</b><small>'+c.assignee+(c.dependsOn.length?" | after "+c.dependsOn.join(","):"")+'</small></div>'}).join("")+'</div>').join("");
function paint(){document.getElementById("state").textContent=run.state;const idx=LIFE.ORDER.indexOf(run.state);
 document.getElementById("stages").innerHTML=LIFE.STAGES.map((s,i)=>'<div class="stage '+(LIFE.ORDER.indexOf(s.state)<=idx?"done":"")+(LIFE.ORDER.indexOf(s.state)===idx+1?" current":"")+'"><span>'+(i+1)+". "+s.label+'</span><em>'+s.actor+'</em></div>').join("");}
function add(ok,text){const li=document.createElement("li");li.className=ok?"ok":"no";li.innerHTML='<span class="tag">'+(ok?"ACCEPTED":"REJECTED")+"</span> "+text;log.prepend(li);}
function attempt(label,ev){const r=LIFE.tryAdvance(run,ev);const who=ev.actor.kind+":"+ev.actor.id;
 if(r.ok){run=r.run;add(true,"<b>"+label+"</b> by "+who+" - "+run.log.at(-1).note);}else add(false,"<b>"+label+"</b> by "+who+" - <code>"+r.code+"</code> "+r.message);paint();document.body.dataset.state=run.state;}
function reset(){run=LIFE.createRun(INPUTS);step=0;log.innerHTML="";paint();document.body.dataset.state=run.state;}
document.getElementById("next").onclick=()=>{if(step<HAPPY.length){const ev=HAPPY[step];const before=run.state;attempt(ev.type,ev);if(run.state!==before||ev.type==="implement")step++;}};
document.getElementById("reset").onclick=reset;
document.getElementById("illegal").innerHTML=ILLEGAL.map((x,i)=>'<button class="bad" data-i="'+i+'">'+x[0]+"</button>").join("");
document.querySelectorAll("#illegal button").forEach(b=>b.onclick=()=>{const [l,e]=ILLEGAL[b.dataset.i];attempt(l,e);});
reset();document.body.dataset.ready="true";
</script></body></html>`;
fs.writeFileSync(path.join(root, "demo", "index.html"), html);
console.log("built demo/dist/lifecycle.js and demo/index.html");
