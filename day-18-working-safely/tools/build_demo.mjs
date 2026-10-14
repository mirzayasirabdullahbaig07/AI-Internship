import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
await build({
  entryPoints: [path.join(root, "src", "browser.js")],
  bundle: true,
  format: "iife",
  globalName: "SAFE",
  minify: true,
  outfile: path.join(root, "demo", "dist", "safe.js"),
  logLevel: "silent",
});
const audit = JSON.parse(
  fs.readFileSync(path.join(root, "evidence", "repo_safety.json"), "utf8"),
);
const handoff = fs.readFileSync(
  path.join(root, "outputs", "HANDOFF_DAYS_11-18.md"),
  "utf8",
);

// NOTE: sample secrets are assembled from fragments in the browser, so this file never contains a complete one.
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Day 18 - Working safely with agents</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:22px;background:#f1f3f9;color:#1b2240;font-family:system-ui,"Segoe UI",Roboto,sans-serif}
h1{margin:0 0 4px;font-size:1.4rem}.sub{margin:0 0 14px;color:#5a6280}
.panel{background:#fff;border-radius:12px;box-shadow:0 4px 16px rgb(27 34 64/10%);overflow:hidden;max-width:1320px;margin-bottom:16px}
.panel h2{margin:0;padding:10px 16px;font-size:1rem;background:#eef0f8}
.two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
table{border-collapse:collapse;width:100%;font-size:.85rem}td,th{padding:6px 14px;border-top:1px solid #eef0f8;text-align:left;vertical-align:top}
.st{font-weight:800;font-size:.72rem;padding:2px 9px;border-radius:999px;color:#fff;white-space:nowrap}
.PASS{background:#1a8f4c}.FAIL{background:#d92d20}.WARN{background:#b7791f}.MANUAL{background:#5a6280}
textarea{width:100%;height:230px;border:0;padding:10px 14px;font:12px/1.5 ui-monospace,Consolas,monospace;resize:none;outline:none}
.bar{padding:8px 14px;display:flex;gap:8px;border-top:1px solid #eef0f8}
button{font:inherit;font-weight:700;font-size:.82rem;padding:6px 14px;border:0;border-radius:8px;background:#2f4bd6;color:#fff;cursor:pointer}button.alt{background:#e8ebf7;color:#1b2240}
ul{list-style:none;margin:0;padding:8px 14px;font-size:.84rem}li{padding:4px 0}li b{color:#d92d20}.good{color:#14633a;font-weight:800}.bad{color:#9b1c1c;font-weight:800}
code{background:#eef0f8;padding:0 5px;border-radius:4px}
</style></head><body>
<h1>Day 18 - Working safely with agents</h1>
<p class="sub">The real scanner, audit and handoff validator, running in the browser.</p>
<section class="panel"><h2>1. Repository safety audit (real run: npm run safety)</h2><div id="audit"></div></section>
<section class="panel two">
 <div><h2 style="margin:0;padding:10px 16px;font-size:1rem;background:#eef0f8">2. Secret scanner: paste text, then Scan</h2><textarea id="code" spellcheck="false"></textarea><div class="bar"><button id="scan">Scan</button></div></div>
 <div><h2 style="margin:0;padding:10px 16px;font-size:1rem;background:#eef0f8">Findings (secret values are never shown)</h2><div id="findings"></div></div>
</section>
<section class="panel two">
 <div><h2 style="margin:0;padding:10px 16px;font-size:1rem;background:#eef0f8">3. Handoff report: edit, then Validate</h2><textarea id="handoff" spellcheck="false" style="height:330px"></textarea>
  <div class="bar"><button class="alt" id="good">Real handoff</button><button class="alt" id="bad">Unsafe handoff</button><button id="validate">Validate</button></div></div>
 <div><h2 style="margin:0;padding:10px 16px;font-size:1rem;background:#eef0f8">Validation result</h2><div id="hres"></div></div>
</section>
<script src="dist/safe.js"></script>
<script>
const AUDIT=${JSON.stringify(audit)};const GOOD=${JSON.stringify(handoff)};
const j=(...p)=>p.join("");
const SAMPLE=["const config = {",
 "  region: 'eu-west-1',",
 "  awsKey: '"+j("AKIA","QWERTYUIOPASDFGH")+"',",
 "  github: '"+j("ghp_","a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8")+"',",
 "  db: '"+j("postgres://appuser", ":Zx9wQ4tLm2@db.internal/app")+"',",
 "  "+j("pass","word")+": '"+j("Sup3rS3cret","Value")+"',",
 "  fakeUser: { "+j("pass","word")+": 'lab-pass-yasir-1' },   // fake lab value: suppressed",
 "  timeout: process.env.TIMEOUT_MS",
 "};"].join("\\n");
const BAD=GOOD.replace("## Remaining blockers","## Implementation notes\\nHere is the fix:\\n\`\`\`js\\nconst token = '"+j("ghp_","a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8")+"';\\n\`\`\`\\n\\n## Remaining blockers");
document.getElementById("audit").innerHTML='<table><tr><th>Status</th><th>Check</th><th>Detail</th></tr>'+AUDIT.checks.map(c=>'<tr><td><span class="st '+c.status+'">'+c.status+'</span></td><td>'+c.title+'</td><td>'+c.detail.replace(/</g,"&lt;")+'</td></tr>').join("")+'</table>';
document.getElementById("code").value=SAMPLE;document.getElementById("handoff").value=GOOD;
function scan(){const r=SAFE.scanText(document.getElementById("code").value,{file:"config.js"});
 document.getElementById("findings").innerHTML='<ul>'+r.findings.map(f=>'<li><b>FOUND</b> line '+f.line+' <code>'+f.rule+'</code> preview <code>'+f.preview+'</code></li>').join("")+r.suppressed.map(f=>'<li>suppressed (fake value) line '+f.line+' <code>'+f.rule+'</code></li>').join("")+'<li>'+(r.findings.length?'<span class="bad">'+r.findings.length+' secret(s): commit would be BLOCKED</span>':'<span class="good">no secrets: commit allowed</span>')+'</li></ul>';}
function validate(){const r=SAFE.validateHandoff(document.getElementById("handoff").value);
 document.getElementById("hres").innerHTML='<ul><li>'+(r.valid?'<span class="good">VALID: only PR link, SHA, objective, evidence, blockers</span>':'<span class="bad">INVALID: '+r.errors.length+' problem(s)</span>')+'</li>'+r.errors.map(e=>'<li><b>'+e.code+'</b> '+e.message.replace(/</g,"&lt;")+'</li>').join("")+'</ul>';}
document.getElementById("scan").onclick=scan;document.getElementById("validate").onclick=validate;
document.getElementById("good").onclick=()=>{document.getElementById("handoff").value=GOOD;validate();};
document.getElementById("bad").onclick=()=>{document.getElementById("handoff").value=BAD;validate();};
scan();validate();document.body.dataset.ready="true";
</script></body></html>`;
fs.writeFileSync(path.join(root, "demo", "index.html"), html);
console.log("built demo/dist/safe.js and demo/index.html");
