import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
await build({
  entryPoints: [path.join(root, "src", "validateCooInputs.js")],
  bundle: true,
  format: "iife",
  globalName: "COO",
  minify: true,
  outfile: path.join(root, "demo", "dist", "validator.js"),
  logLevel: "silent",
});
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, "inputs", f), "utf8"));
const real = read("coo_inputs.json");
const complete = read("coo_inputs.demo-complete.json");
const agentMerge = structuredClone(complete);
agentMerge.permissions["task-agent"].merge = true;
agentMerge.permissions["review-agent"].write = "own-branch";
const selfReview = structuredClone(complete);
selfReview.humanReviewer = "Mirza Yasir Abdullah Baig";
const presets = { real, complete, agentMerge, selfReview };

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Day 16 - AI-COO inputs checker</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:24px;background:#f1f3f9;color:#1b2240;font-family:system-ui,"Segoe UI",Roboto,sans-serif}
h1{margin:0 0 4px;font-size:1.45rem}.sub{margin:0 0 14px;color:#5a6280}
.bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
button{font:inherit;font-weight:700;padding:7px 14px;border:0;border-radius:8px;background:#2f4bd6;color:#fff;cursor:pointer}
button.alt{background:#e8ebf7;color:#1b2240}button.active{background:#2f4bd6;color:#fff}
.grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px;max-width:1300px}
.panel{background:#fff;border-radius:12px;box-shadow:0 4px 16px rgb(27 34 64/10%);overflow:hidden}
.panel h2{margin:0;padding:11px 16px;font-size:1rem;background:#eef0f8}
textarea{width:100%;height:520px;border:0;padding:12px 16px;font:12px/1.5 ui-monospace,Consolas,monospace;resize:none;outline:none}
ul{list-style:none;margin:0;padding:6px 0}li{padding:7px 16px;border-top:1px solid #eef0f8;font-size:.9rem;display:flex;gap:10px}
.tag{font-weight:800;min-width:48px}.ok .tag{color:#1a8f4c}.no .tag{color:#d92d20}.no{background:#fff6f5}
#result{margin:0;padding:12px 16px;font-weight:800}.valid{background:#e3f6ea;color:#14633a}.invalid{background:#fde8e8;color:#9b1c1c}
</style></head><body>
<h1>Day 16 - AI-COO minimum operating inputs</h1>
<p class="sub">The real validator (src/validateCooInputs.js) running in the browser. Edit the JSON or pick a preset.</p>
<div class="bar">
 <button class="alt" data-p="real">This repo's real inputs (reviewer blank)</button>
 <button class="alt" data-p="complete">Complete set (valid)</button>
 <button class="alt" data-p="agentMerge">Agent allowed to merge</button>
 <button class="alt" data-p="selfReview">Reviewer = owner</button>
</div>
<div class="grid">
 <section class="panel"><h2>coo_inputs.json</h2><textarea id="json" spellcheck="false"></textarea></section>
 <section class="panel"><h2>Checks</h2><p id="result"></p><ul id="checks"></ul></section>
</div>
<script src="dist/validator.js"></script>
<script>
const PRESETS=${JSON.stringify(presets)};
const ta=document.getElementById("json");
function run(){let r;try{r=COO.validateCooInputs(JSON.parse(ta.value))}catch(e){r={valid:false,errors:[{message:"Invalid JSON"}],checks:[]}}
 const res=document.getElementById("result");res.className=r.valid?"valid":"invalid";
 res.textContent=r.valid?"VALID - the AI-COO may start":"INVALID - "+r.errors.length+" problem(s): the AI-COO must NOT start";
 document.getElementById("checks").innerHTML=r.checks.map(c=>'<li class="'+(c.pass?"ok":"no")+'"><span class="tag">'+(c.pass?"PASS":"FAIL")+'</span><span>'+c.label+'</span></li>').join("");
 document.body.dataset.ready="true";}
function load(name){ta.value=JSON.stringify(PRESETS[name],null,2);document.querySelectorAll("button[data-p]").forEach(b=>b.classList.toggle("active",b.dataset.p===name));run();}
document.querySelectorAll("button[data-p]").forEach(b=>b.addEventListener("click",()=>load(b.dataset.p)));
ta.addEventListener("input",run);load("real");
</script></body></html>`;
fs.writeFileSync(path.join(root, "demo", "index.html"), html);
console.log("built demo/dist/validator.js and demo/index.html");
