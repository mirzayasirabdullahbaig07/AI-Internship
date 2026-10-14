// Generates demo/index.html: side-by-side before/after with counters computed IN THE BROWSER.
const fs = require("node:fs");
const path = require("node:path");
const dir = path.join(__dirname, "..");
const verbose = fs.readFileSync(path.join(dir, "inputs/verbose_prompt.txt"), "utf8");
const brief = fs.readFileSync(path.join(dir, "outputs/task_brief_150.txt"), "utf8");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Day 13 - Prompt diet</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:24px;background:#f1f3f9;color:#1b2240;font-family:system-ui,"Segoe UI",Roboto,sans-serif}
h1{margin:0 0 4px;font-size:1.45rem}.sub{margin:0 0 16px;color:#5a6280}
.grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:18px;max-width:1300px}
.panel{background:#fff;border-radius:12px;box-shadow:0 4px 16px rgb(27 34 64/10%);overflow:hidden}
.panel h2{margin:0;padding:12px 16px;font-size:1rem}.before h2{background:#fde8e8;color:#9b1c1c}.after h2{background:#e3f6ea;color:#14633a}
.stats{display:flex;gap:10px;padding:10px 16px;flex-wrap:wrap}.chip{background:#e8ebf7;border-radius:999px;padding:3px 12px;font-size:.85rem;font-weight:700}
pre{margin:0;padding:12px 16px;white-space:pre-wrap;font:12px/1.5 ui-monospace,Consolas,monospace;max-height:560px;overflow:hidden}
.before pre{color:#555;position:relative}.after pre{background:#1e222e;color:#dde1ee;max-height:none}
.result{max-width:1300px;margin-top:16px;padding:14px 18px;background:#fff;border-radius:12px;font-weight:700}
</style></head><body>
<h1>Day 13 - Keeping AI token use low</h1>
<p class="sub">A verbose manager message (left) cut to a sterile task brief (right) without losing any acceptance criterion.</p>
<div class="grid">
 <section class="panel before"><h2>Before: verbose prompt</h2><div class="stats" id="s1"></div><pre id="t1">${esc(verbose)}</pre></section>
 <section class="panel after"><h2>After: 150-word task brief</h2><div class="stats" id="s2"></div><pre id="t2">${esc(brief)}</pre></section>
</div>
<div class="result" id="result"></div>
<script>
const words=t=>{t=t.trim();return t?t.split(/\\s+/).length:0};const est=t=>Math.ceil(t.length/4);
const a=document.getElementById("t1").textContent,b=document.getElementById("t2").textContent;
const chips=(id,t)=>document.getElementById(id).innerHTML='<span class="chip">'+words(t)+' words</span><span class="chip">~'+est(t)+' est. tokens</span><span class="chip">'+t.length+' chars</span>';
chips("s1",a);chips("s2",b);
document.getElementById("result").textContent="Words cut by "+(100-words(b)/words(a)*100).toFixed(1)+"%  |  est. tokens cut by "+(100-est(b)/est(a)*100).toFixed(1)+"%  |  all 13 acceptance criteria kept (checked by Jest)";
document.body.dataset.ready="true";
</script></body></html>`;
fs.writeFileSync(path.join(dir, "demo", "index.html"), html);
console.log("demo/index.html written");
