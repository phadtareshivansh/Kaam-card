import { readFileSync, writeFileSync } from "fs";

const src = readFileSync("app.js", "utf8");
const NL = "\r?\n";

function findObj(name, text) {
  const re = new RegExp(
    `(const ${name}\\s*=\\s*\\{)([\\s\\S]*?)(${NL}\\};?)(${NL})`, "m"
  );
  const m = text.match(re);
  if (m) return { prefix: m[1], body: m[2], suffix: m[3] + m[4], full: m[0] };
  const re2 = new RegExp(
    `(const ${name}\\s*=\\s*\\{)([\\s\\S]*?)(${NL}\\})(${NL})`, "m"
  );
  const m2 = text.match(re2);
  if (!m2) throw new Error(`Could not find ${name}`);
  return { prefix: m2[1], body: m2[2], suffix: m2[3] + m2[4], full: m2[0] };
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
    .join(",\n");
  return `${prefix}\n${body}\n};\n`;
}

const hi = findObj("TRANSLATIONS", src);
const ta = findObj("TRANSLATIONS_TA", src);
const te = findObj("TRANSLATIONS_TE", src);
const mr = findObj("TRANSLATIONS_MR", src);

const hiEntries = parseEntries(hi.body);
const taEntries = parseEntries(ta.body);
const teEntries = parseEntries(te.body);
const mrEntries = parseEntries(mr.body);

const hiKeys = Object.keys(hiEntries).filter(k => hiEntries[k] !== k);

const taUntranslated = Object.keys(taEntries).filter(k => taEntries[k] === k);
const teUntranslated = Object.keys(teEntries).filter(k => teEntries[k] === k);
const mrUntranslated = Object.keys(mrEntries).filter(k => mrEntries[k] === k);

const taMissing = hiKeys.filter(k => !(k in taEntries));
const teMissing = hiKeys.filter(k => !(k in teEntries));
const mrMissing = hiKeys.filter(k => !(k in mrEntries));

const allTa = [...new Set([...taUntranslated, ...taMissing])];
const allTe = [...new Set([...teUntranslated, ...teMissing])];
const allMr = [...new Set([...mrUntranslated, ...mrMissing])];

console.log(`Hindi translated keys: ${hiKeys.length}`);
console.log(`TA: ${taUntranslated.length} untranslated, ${taMissing.length} missing = ${allTa.length} total`);
console.log(`TE: ${teUntranslated.length} untranslated, ${teMissing.length} missing = ${allTe.length} total`);
console.log(`MR: ${mrUntranslated.length} untranslated, ${mrMissing.length} missing = ${allMr.length} total`);

async function translateOne(text, target) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      let val = data[0][0][0];
      if (val.endsWith("\n")) val = val.slice(0, -1);
      return val;
    }
  } catch (e) {
    console.error(`  Error translating "${text.substring(0, 40)}...": ${e.message}`);
  }
  return null;
}

async function translateAll(texts, target) {
  const results = {};
  let done = 0;
  for (const text of texts) {
    const val = await translateOne(text, target);
    if (val) {
      results[text] = val;
    } else {
      console.warn(`  No translation for: "${text.substring(0, 50)}..."`);
      results[text] = text;
    }
    done++;
    if (done % 10 === 0) console.log(`  [${target}] ${done}/${texts.length} done`);
    await new Promise(r => setTimeout(r, 400));
  }
  return results;
}

console.log("\n--- Translating to Tamil ---");
const taTrans = await translateAll(allTa, "ta");
console.log(`Got ${Object.keys(taTrans).length} Tamil translations`);

console.log("\n--- Translating to Telugu ---");
const teTrans = await translateAll(allTe, "te");
console.log(`Got ${Object.keys(teTrans).length} Telugu translations`);

console.log("\n--- Translating to Marathi ---");
const mrTrans = await translateAll(allMr, "mr");
console.log(`Got ${Object.keys(mrTrans).length} Marathi translations`);

const newTaEntries = { ...taEntries };
for (const [k, v] of Object.entries(taTrans)) {
  newTaEntries[k] = v;
}
const newTeEntries = { ...teEntries };
for (const [k, v] of Object.entries(teTrans)) {
  newTeEntries[k] = v;
}
const newMrEntries = { ...mrEntries };
for (const [k, v] of Object.entries(mrTrans)) {
  newMrEntries[k] = v;
}

const newTaText = buildObjText(ta.prefix, newTaEntries);
const newTeText = buildObjText(te.prefix, newTeEntries);
const newMrText = buildObjText(mr.prefix, newMrEntries);

let result = src;
result = result.replace(ta.full, newTaText);
result = result.replace(te.full, newTeText);
result = result.replace(mr.full, newMrText);

const taCount = (result.match(/const TRANSLATIONS_TA\s*=/g) || []).length;
const teCount = (result.match(/const TRANSLATIONS_TE\s*=/g) || []).length;
const mrCount = (result.match(/const TRANSLATIONS_MR\s*=/g) || []).length;
console.log(`\nTRANSLATIONS_TA count: ${taCount} (should be 1)`);
console.log(`TRANSLATIONS_TE count: ${teCount} (should be 1)`);
console.log(`TRANSLATIONS_MR count: ${mrCount} (should be 1)`);

if (taCount === 1 && teCount === 1 && mrCount === 1) {
  writeFileSync("app.js", result, "utf8");
  console.log("\nDone! app.js updated.");
} else {
  console.log("\nERROR: Replacement failed. Not writing file.");
}
