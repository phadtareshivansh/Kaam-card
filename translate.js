import { readFileSync, writeFileSync } from "fs";

const src = readFileSync("app.js", "utf8");
const NL = "\r?\n";

function findObj(name, text) {
  const re = new RegExp(
    `(const ${name}\\s*=\\s*\\{)` + // prefix
    `([\\s\\S]*?)` +               // body (non-greedy)
    `(${NL}\\};?)` +               // closing line (with optional semicolon)
    `(${NL})`,                     // trailing newline
    "m"
  );
  const m = text.match(re);
  if (m) return { prefix: m[1], body: m[2], suffix: m[3] + m[4], full: m[0], idx: m.index };
  // try without semicolon
  const re2 = new RegExp(
    `(const ${name}\\s*=\\s*\\{)` +
    `([\\s\\S]*?)` +
    `(${NL}\\})` +
    `(${NL})`,
    "m"
  );
  const m2 = text.match(re2);
  if (!m2) throw new Error(`Could not find ${name}`);
  return { prefix: m2[1], body: m2[2], suffix: m2[3] + m2[4], full: m2[0], idx: m2.index };
}

function parseEntries(body) {
  const entries = {};
  const re = /"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let match;
  while ((match = re.exec(body)) !== null) {
    entries[match[1]] = match[2];
  }
  return entries;
}

function buildObjText(prefix, entries) {
  const body = Object.entries(entries)
    .map(([k, v]) => `  "${k}": "${v.replace(/"/g, '\\"')}"`)
    .join(",\r\n");
  return `${prefix}\r\n${body}\r\n};`;
}

const hi = findObj("TRANSLATIONS", src);
const ta = findObj("TRANSLATIONS_TA", src);
const te = findObj("TRANSLATIONS_TE", src);

const hiEntries = parseEntries(hi.body);
const taEntries = parseEntries(ta.body);
const teEntries = parseEntries(te.body);

const hiKeys = Object.keys(hiEntries).filter(k => hiEntries[k] !== k);

// In TA/TE, find keys where value matches the key (untranslated) or missing
const taUntranslated = Object.keys(taEntries).filter(k => taEntries[k] === k);
const teUntranslated = Object.keys(teEntries).filter(k => teEntries[k] === k);
const taMissing = hiKeys.filter(k => !(k in taEntries));
const teMissing = hiKeys.filter(k => !(k in teEntries));

const allTa = [...new Set([...taUntranslated, ...taMissing])];
const allTe = [...new Set([...teUntranslated, ...teMissing])];

console.log(`Hindi translated keys: ${hiKeys.length}`);
console.log(`TA: ${taUntranslated.length} untranslated, ${taMissing.length} missing = ${allTa.length} total`);
console.log(`TE: ${teUntranslated.length} untranslated, ${teMissing.length} missing = ${allTe.length} total`);

async function translateAll(texts, target) {
  const results = {};
  const batchSize = 30;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const query = batch.map(t => encodeURIComponent(t)).join("%0A");
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${query}`;
    console.log(`[${target}] Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} (${batch.length} strings)...`);
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      const translations = data[0];
      batch.forEach((key, idx) => {
        if (translations[idx]) {
          let val = translations[idx][0];
          if (val.endsWith("\n")) val = val.slice(0, -1);
          results[key] = val;
        } else {
          console.warn(`  No translation for: "${key}"`);
          results[key] = key; // fallback
        }
      });
    } catch (e) {
      console.error(`  Batch failed:`, e.message);
      batch.forEach(k => { results[k] = k; });
    }
    await new Promise(r => setTimeout(r, 600));
  }
  return results;
}

console.log("\n--- Translating to Tamil ---");
const taTrans = await translateAll(allTa, "ta");
console.log(`Got ${Object.keys(taTrans).length} Tamil translations`);

console.log("\n--- Translating to Telugu ---");
const teTrans = await translateAll(allTe, "te");
console.log(`Got ${Object.keys(teTrans).length} Telugu translations`);

// Merge translations into existing entries (preserving already-translated ones)
const newTaEntries = { ...taEntries };
for (const [k, v] of Object.entries(taTrans)) {
  newTaEntries[k] = v;
}
const newTeEntries = { ...teEntries };
for (const [k, v] of Object.entries(teTrans)) {
  newTeEntries[k] = v;
}

// Build new object texts (preserving the original closing style)
const newTaText = buildObjText(ta.prefix, newTaEntries);
const newTeText = buildObjText(te.prefix, newTeEntries);

// Replace in source (replace first occurrence only)
let result = src;
result = result.replace(ta.full, newTaText);
result = result.replace(te.full, newTeText);

// Quick sanity check
const taCount = (result.match(/const TRANSLATIONS_TA\s*=/g) || []).length;
const teCount = (result.match(/const TRANSLATIONS_TE\s*=/g) || []).length;
console.log(`\nTRANSLATIONS_TA count: ${taCount} (should be 1)`);
console.log(`TRANSLATIONS_TE count: ${teCount} (should be 1)`);

if (taCount === 1 && teCount === 1) {
  writeFileSync("app.js", result, "utf8");
  console.log("\nDone! app.js updated.");
} else {
  console.log("\nERROR: Replacement failed. Not writing file.");
}
