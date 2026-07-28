import { readFileSync } from "fs";
const src = readFileSync("app.js", "utf8");
const name = "TRANSLATIONS";
const re = new RegExp(`(const ${name}\\s*=\\s*\\{)([\\s\\S]*?)(\\n\\};?)(\\n)`);
const m = src.match(re);
if (m) {
  console.log("Found! Groups:");
  console.log("  Group 1 (prefix):", JSON.stringify(m[1].slice(0, 50)));
  console.log("  Group 2 (body) length:", m[2].length);
  console.log("  Group 2 (body) first 100:", JSON.stringify(m[2].slice(0, 100)));
  console.log("  Group 2 (body) last 100:", JSON.stringify(m[2].slice(-100)));
  console.log("  Group 3 (suffix):", JSON.stringify(m[3]));
  console.log("  Group 4:", JSON.stringify(m[4]));
  console.log("  Full match length:", m[0].length);
} else {
  console.log("No match found");
  // Let's see what's around line 962
  const idx = src.indexOf("const TRANSLATIONS =");
  console.log("Found at index:", idx);
  console.log("Context:", JSON.stringify(src.slice(idx, idx + 100)));
  console.log("End context:", JSON.stringify(src.slice(idx + 10000, idx + 10100)));
}
