import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
await build({
  entryPoints: [path.join(root, "demo", "loginform.entry.tsx")],
  bundle: true,
  minify: true,
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  outfile: path.join(root, "demo", "dist", "loginform.js"),
});
console.log("built demo/dist/loginform.js");
