const app = document.querySelector("#app");
const THEME_STORAGE_KEY = "kaam-card-theme";

const ICONS = {
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 16.5v-9Z"/><path d="M16 12h4"/><path d="M6 9h9"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
  bars: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></svg>',
  schemes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h16"/><path d="M5 10l7-6 7 6"/><path d="M6 10v9"/><path d="M10 10v9"/><path d="M14 10v9"/><path d="M18 10v9"/><path d="M4 19h16"/></svg>',
  external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v8h16v-8"/><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/></svg>',
  rupee: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12"/><path d="M6 8h12"/><path d="M6 13h3a5 5 0 0 0 5-5"/><path d="m6 13 8 8"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.4 14.5A8.2 8.2 0 0 1 9.5 3.6 8.5 8.5 0 1 0 20.4 14.5Z"/></svg>'
};

const OCCUPATIONS = [
  "Delivery worker",
  "Driver",
  "Construction worker",
  "Domestic worker",
  "Street vendor",
  "Home-based worker",
  "Other informal worker"
];

const STATES = [
  "Delhi",
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Uttar Pradesh",
  "Rajasthan",
  "West Bengal",
  "Other"
];

function getInitialTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch (error) {
    // Theme persistence is optional; no user/session data is stored here.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

const SAMPLE_DATASETS = [
  {
    id: "delivery",
    name: "Delivery worker",
    occupation: "Delivery worker",
    state: "Delhi",
    age: 29,
    csv: `date,amount,direction
2026-05-01,720,credit
2026-05-02,1160,credit
2026-05-03,430,credit
2026-05-04,880,credit
2026-05-05,1280,credit
2026-05-06,210,debit
2026-05-06,660,credit
2026-05-07,1360,credit
2026-05-08,760,credit
2026-05-09,520,credit
2026-05-10,300,credit
2026-05-11,610,credit
2026-05-12,190,credit
2026-05-13,470,credit
2026-05-14,1050,credit
2026-05-15,120,credit
2026-05-16,820,credit
2026-05-17,680,credit
2026-05-18,140,credit
2026-05-19,310,credit
2026-05-20,880,credit
2026-05-21,520,credit
2026-05-22,990,credit
2026-05-23,170,credit
2026-05-24,640,credit
2026-05-25,930,credit
2026-05-26,260,credit
2026-05-27,1120,credit
2026-05-28,390,credit
2026-05-29,1010,credit
2026-05-30,700,credit
2026-05-31,1180,credit`
  },
  {
    id: "vendor",
    name: "Street vendor",
    occupation: "Street vendor",
    state: "Maharashtra",
    age: 36,
    csv: `date,amount,direction
2026-06-01,520,credit
2026-06-02,460,credit
2026-06-03,880,credit
2026-06-04,920,credit
2026-06-05,1240,credit
2026-06-06,1310,credit
2026-06-07,260,credit
2026-06-08,410,credit
2026-06-09,690,credit
2026-06-10,740,credit
2026-06-11,340,credit
2026-06-12,1130,credit
2026-06-13,980,credit
2026-06-14,180,credit
2026-06-15,580,credit
2026-06-16,620,credit
2026-06-17,1090,credit
2026-06-18,1170,credit
2026-06-19,250,credit
2026-06-20,430,credit
2026-06-21,540,credit
2026-06-22,880,credit
2026-06-23,940,credit
2026-06-24,1060,credit
2026-06-25,310,credit
2026-06-26,660,credit
2026-06-27,1210,credit
2026-06-28,1290,credit
2026-06-29,380,credit
2026-06-30,720,credit`
  },
  {
    id: "messy",
    name: "Messy CSV",
    occupation: "Construction worker",
    state: "Delhi",
    age: 42,
    csv: `date,amount,direction
2026-04-01,900,credit
2026-04-02,1100,credit
2026-04-03,not available,credit
32-13-2026,540,credit
2026-04-05,300,debit
2026-04-06,1240,credit
2026-04-07,680,credit
2026-04-08,0,credit
2026-04-09,750,credit
2026-04-10,1180,credit
2026-04-11,460,credit
2026-04-12,980,credit
2026-04-13,620,credit
2026-04-14,1350,credit
2026-04-15,390,credit
2026-04-16,1210,credit`
  }
];

const ALLOWED_SCHEME_URLS = {
  pmSym: "https://www.labour.gov.in/pm-sym",
  eShram: "https://eshram.gov.in/indexmain",
  pmJay: "https://www.pmjay.gov.in/",
  pmjjby: "https://financialservices.gov.in/beta/en/pmjjby",
  pmsby: "https://financialservices.gov.in/beta/en/pmsby",
  delhiBocw: "https://labour.delhi.gov.in/labour/delhi-building-and-other-construction-workers-welfare-board"
};

const SCHEMES = [
  {
    id: "pmSym",
    name: "PM Shram Yogi Maandhan",
    shortName: "PM-SYM",
    benefit: "Pension support after age 60",
    minAge: 18,
    maxAge: 40,
    maxMonthlyIncome: 15000,
    occupations: ["Delivery worker", "Driver", "Construction worker", "Domestic worker", "Street vendor", "Home-based worker", "Other informal worker"],
    icon: "rupee",
    color: "green"
  },
  {
    id: "eShram",
    name: "e-Shram",
    shortName: "e-Shram",
    benefit: "National registration for unorganised workers",
    minAge: 16,
    maxAge: 59,
    maxMonthlyIncome: 30000,
    occupations: ["Delivery worker", "Driver", "Construction worker", "Domestic worker", "Street vendor", "Home-based worker", "Other informal worker"],
    icon: "file",
    color: "blue"
  },
  {
    id: "pmJay",
    name: "Ayushman Bharat PM-JAY",
    shortName: "PM-JAY",
    benefit: "Health cover for low-income families",
    minAge: 0,
    maxAge: 99,
    maxMonthlyIncome: 20000,
    occupations: ["Delivery worker", "Driver", "Construction worker", "Domestic worker", "Street vendor", "Home-based worker", "Other informal worker"],
    icon: "shield",
    color: "saffron"
  },
  {
    id: "pmjjby",
    name: "PM Jeevan Jyoti Bima Yojana",
    shortName: "PMJJBY",
    benefit: "Life insurance cover",
    minAge: 18,
    maxAge: 50,
    maxMonthlyIncome: 30000,
    occupations: ["Delivery worker", "Driver", "Construction worker", "Domestic worker", "Street vendor", "Home-based worker", "Other informal worker"],
    icon: "shield",
    color: "blue"
  },
  {
    id: "pmsby",
    name: "PM Suraksha Bima Yojana",
    shortName: "PMSBY",
    benefit: "Accident insurance cover",
    minAge: 18,
    maxAge: 70,
    maxMonthlyIncome: 30000,
    occupations: ["Delivery worker", "Driver", "Construction worker", "Domestic worker", "Street vendor", "Home-based worker", "Other informal worker"],
    icon: "shield",
    color: "green"
  },
  {
    id: "delhiBocw",
    name: "Delhi Construction Workers Welfare Board",
    shortName: "Delhi BOCW",
    benefit: "Welfare benefits for registered construction workers",
    minAge: 18,
    maxAge: 60,
    maxMonthlyIncome: 30000,
    occupations: ["Construction worker"],
    states: ["Delhi"],
    icon: "home",
    color: "saffron"
  }
];

// SIMULATED: this is an in-memory phone-keyed demo session. No password auth,
// no localStorage token, and no raw transaction persistence are used.
const state = {
  route: "login",
  session: null,
  phoneDraft: "",
  theme: getInitialTheme(),
  details: {
    age: 29,
    occupation: "Delivery worker",
    state: "Delhi"
  },
  parseResult: null,
  profile: null,
  matches: [],
  shareOpen: false,
  copied: false
};

function formatMoney(value) {
  return `Rs ${Math.round(value).toLocaleString("en-IN")}`;
}

function formatNumber(value, digits = 0) {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeOccupation(value) {
  const clean = String(value || "").trim().toLowerCase();
  return OCCUPATIONS.find((item) => item.toLowerCase() === clean) || "Other informal worker";
}

function normalizeDirection(value) {
  const clean = String(value || "").trim().toLowerCase();
  if (["credit", "in", "income", "deposit", "received", "cr"].includes(clean)) return "credit";
  if (["debit", "out", "expense", "withdrawal", "paid", "dr"].includes(clean)) return "debit";
  return "";
}

function parseDate(value) {
  const clean = String(value || "").trim();
  let year;
  let month;
  let day;

  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    [year, month, day] = clean.split("-").map(Number);
  } else if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(clean)) {
    [day, month, year] = clean.split(/[-/]/).map(Number);
  } else {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function parseTransactions(csvText) {
  const text = String(csvText || "").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const errors = [];

  if (lines.length < 2) {
    return { validRows: [], errors: [{ row: 1, issue: "CSV needs a header and at least one data row." }] };
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  const required = ["date", "amount", "direction"];
  const missing = required.filter((name) => !headers.includes(name));
  if (missing.length > 0) {
    return { validRows: [], errors: [{ row: 1, issue: `Missing column: ${missing.join(", ")}.` }] };
  }

  const indexes = Object.fromEntries(required.map((name) => [name, headers.indexOf(name)]));
  const validRows = [];

  lines.slice(1).forEach((line, lineIndex) => {
    const rowNumber = lineIndex + 2;
    const cells = parseCsvLine(line);
    const date = parseDate(cells[indexes.date]);
    const amount = Number(String(cells[indexes.amount] || "").replaceAll(",", ""));
    const direction = normalizeDirection(cells[indexes.direction]);

    if (!date) {
      errors.push({ row: rowNumber, issue: "Date is invalid. Use YYYY-MM-DD or DD-MM-YYYY." });
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      errors.push({ row: rowNumber, issue: "Amount is invalid. Use a positive number." });
      return;
    }

    if (!direction) {
      errors.push({ row: rowNumber, issue: "Direction must be credit/income or debit/expense." });
      return;
    }

    validRows.push({ date, amount, direction });
  });

  return { validRows, errors };
}

function daysBetweenInclusive(startIso, endIso) {
  const start = new Date(`${startIso}T00:00:00.000Z`);
  const end = new Date(`${endIso}T00:00:00.000Z`);
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function computeProfile(transactions) {
  const credits = transactions.filter((row) => row.direction === "credit" && row.amount > 0);
  if (credits.length === 0) {
    return null;
  }

  const sortedDates = credits.map((row) => row.date).sort();
  const start = sortedDates[0];
  const end = sortedDates[sortedDates.length - 1];
  const periodDays = daysBetweenInclusive(start, end);
  const byDay = new Map();

  credits.forEach((row) => {
    byDay.set(row.date, (byDay.get(row.date) || 0) + row.amount);
  });

  const dailySeries = Array.from({ length: periodDays }, (_, index) => {
    const date = addDays(start, index);
    return { date, amount: byDay.get(date) || 0 };
  });

  const totalIncome = dailySeries.reduce((sum, day) => sum + day.amount, 0);
  const averageDaily = totalIncome / periodDays;
  const variance =
    dailySeries.reduce((sum, day) => sum + Math.pow(day.amount - averageDaily, 2), 0) / periodDays;
  const badThreshold = averageDaily * 0.5;
  const goodThreshold = averageDaily;
  const goodDays = dailySeries.filter((day) => day.amount >= goodThreshold && day.amount > 0);
  const badDays = dailySeries.filter((day) => day.amount <= badThreshold);
  const avgBadDayIncome = badDays.length
    ? badDays.reduce((sum, day) => sum + day.amount, 0) / badDays.length
    : 0;
  const avgGoodSurplus = goodDays.length
    ? goodDays.reduce((sum, day) => sum + Math.max(0, day.amount - goodThreshold), 0) / goodDays.length
    : averageDaily * 0.2;
  const savePerGoodDay = Math.max(20, Math.round((avgGoodSurplus * 0.45) / 10) * 10);
  const expectedGoodDaysPerMonth = Math.round((goodDays.length / periodDays) * 30);
  const monthlySaving = savePerGoodDay * expectedGoodDaysPerMonth;
  const lowDayGap = Math.max(1, averageDaily - avgBadDayIncome);
  const coveredLowDays = Math.max(1, Math.floor(monthlySaving / lowDayGap));

  return {
    start,
    end,
    periodDays,
    totalIncome,
    averageDaily,
    variance,
    goodThreshold,
    badThreshold,
    goodDays: goodDays.length,
    badDays: badDays.length,
    monthlyIncomeEstimate: averageDaily * 30,
    dailySeries,
    savings: {
      savePerGoodDay,
      expectedGoodDaysPerMonth,
      monthlySaving,
      coveredLowDays
    }
  };
}

function getAllowedUrl(id) {
  const candidate = ALLOWED_SCHEME_URLS[id];
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    const host = url.hostname.toLowerCase();
    const allowedDomain = host.endsWith(".gov.in") || host.endsWith(".nic.in");
    if (url.protocol !== "https:" || !allowedDomain) return null;
    return url;
  } catch (error) {
    return null;
  }
}

function schemeScore(scheme, details, profile) {
  const reasons = [];
  const misses = [];
  const age = Number(details.age);
  const occupation = normalizeOccupation(details.occupation);
  const monthlyIncome = profile.monthlyIncomeEstimate;
  const stateName = details.state;

  if (age >= scheme.minAge && age <= scheme.maxAge) {
    reasons.push(`age ${age} is within ${scheme.minAge}-${scheme.maxAge}`);
  } else {
    misses.push(`age must be ${scheme.minAge}-${scheme.maxAge}`);
  }

  if (monthlyIncome <= scheme.maxMonthlyIncome) {
    reasons.push(`estimated monthly income is below ${formatMoney(scheme.maxMonthlyIncome)}`);
  } else {
    misses.push(`income is above ${formatMoney(scheme.maxMonthlyIncome)}`);
  }

  if (scheme.occupations.includes(occupation)) {
    reasons.push(`${occupation.toLowerCase()} is covered`);
  } else {
    misses.push(`occupation must match: ${scheme.occupations.join(", ")}`);
  }

  if (!scheme.states || scheme.states.includes(stateName)) {
    if (scheme.states) reasons.push(`${stateName} state matches`);
  } else {
    misses.push(`state must be ${scheme.states.join(" or ")}`);
  }

  const passed = reasons.length;
  const required = 3 + (scheme.states ? 1 : 0);
  return {
    ...scheme,
    passed,
    required,
    eligible: misses.length === 0,
    reasons,
    misses,
    rank: misses.length === 0 ? 100 + passed : passed
  };
}

function matchSchemes(details, profile) {
  // SIMPLIFIED: this hackathon matcher uses transparent arithmetic rules only.
  // It is not an official eligibility determination or ML model.
  return SCHEMES.map((scheme) => schemeScore(scheme, details, profile))
    .sort((a, b) => b.rank - a.rank || a.name.localeCompare(b.name));
}

function processCsv(csvText, sourceMeta = {}) {
  const parseResult = parseTransactions(csvText);
  state.parseResult = {
    totalRows: parseResult.validRows.length + parseResult.errors.length,
    validRows: parseResult.validRows.length,
    errors: parseResult.errors,
    source: sourceMeta.name || "Uploaded CSV"
  };

  const profile = computeProfile(parseResult.validRows);
  state.profile = profile;

  if (sourceMeta.occupation) state.details.occupation = sourceMeta.occupation;
  if (sourceMeta.state) state.details.state = sourceMeta.state;
  if (sourceMeta.age) state.details.age = sourceMeta.age;

  if (profile) {
    state.matches = matchSchemes(state.details, profile);
  } else {
    state.matches = [];
  }

  // Raw transaction rows are intentionally discarded here. The app retains only
  // aggregate daily income, parse counts, and issue summaries for this session.
}

function dateLabel(iso) {
  const date = new Date(`${iso}T00:00:00.000Z`);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}

function currentName() {
  const phone = state.session?.phone || "";
  return phone ? `Worker ${phone.slice(-4)}` : "friend";
}

function renderShell(content, active = "Dashboard", layout = "compact") {
  app.innerHTML = `
    <div class="app-shell">
      <div class="interactive-grid-pattern" aria-hidden="true"></div>
      <aside class="side-rail" aria-label="Kaam Card navigation">
        <div class="side-rail__head">
          <div class="brand">${brandMark()}<span>Kaam Card</span></div>
          ${renderThemeToggle("rail")}
        </div>
        <nav class="rail-nav">
          ${navButton("Dashboard", ICONS.home, active === "Dashboard")}
          ${navButton("Transactions", ICONS.file, active === "Transactions")}
          ${navButton("Insights", ICONS.bars, active === "Insights")}
          ${navButton("Schemes", ICONS.schemes, active === "Schemes")}
        </nav>
        <div class="rail-foot">
          <div class="mini-row" style="gap:8px">${ICONS.shield}<span>No Aadhaar, PAN, or bank account numbers.</span></div>
          <div class="mini-row" style="gap:8px">${ICONS.wallet}<span>Session-only demo data.</span></div>
        </div>
      </aside>
      <main class="main-wrap">
        <div class="phone-stage ${layout === "wide" ? "is-wide" : ""}">
          <div class="phone-card">${content}</div>
        </div>
      </main>
    </div>
  `;
  bindShellNav();
  bindThemeToggle();
}

function brandMark() {
  return `<span class="brand-mark" aria-hidden="true">${ICONS.wallet}</span>`;
}

function navButton(label, icon, active) {
  return `<button type="button" class="${active ? "is-active" : ""}" data-nav="${escapeHtml(label)}">${icon}<span>${escapeHtml(label)}</span></button>`;
}

function renderThemeToggle(variant = "") {
  const isDark = state.theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";
  return `
    <button
      class="theme-toggle ${variant ? `theme-toggle--${variant}` : ""}"
      type="button"
      data-theme-toggle
      aria-label="${label}"
      aria-pressed="${isDark}"
      title="${label}"
    >
      <span class="theme-toggle__track" aria-hidden="true">
        <span class="theme-toggle__icon theme-toggle__icon--sun">${ICONS.sun}</span>
        <span class="theme-toggle__icon theme-toggle__icon--moon">${ICONS.moon}</span>
        <span class="theme-toggle__thumb"></span>
      </span>
    </button>
  `;
}

function setTheme(theme) {
  state.theme = theme === "dark" ? "dark" : "light";
  applyTheme(state.theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, state.theme);
  } catch (error) {
    // Visual preference persistence is best-effort only.
  }
}

function bindThemeToggle() {
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      setTheme(state.theme === "dark" ? "light" : "dark");
      render();
    });
  });
}

function navigateTo(label) {
  if (!state.session) {
    state.route = "login";
    render();
    return;
  }

  if (label === "Dashboard") state.route = state.profile ? "dashboard" : "upload";
  if (label === "Transactions" || label === "Upload") state.route = "upload";
  if (label === "Insights") state.route = state.profile ? "insights" : "upload";
  if (label === "Schemes") state.route = state.profile ? "schemes" : "upload";

  render();
}

function bindShellNav() {
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => navigateTo(button.dataset.nav));
  });
}

function renderLogin() {
  renderShell(`
    <section class="screen" aria-labelledby="login-title">
      <div class="top-bar">
        <div class="brand">${brandMark()}<span>Kaam Card</span></div>
        ${renderThemeToggle("compact")}
      </div>
      <h1 class="screen-title" id="login-title">Welcome</h1>
      <p class="copy">Start with your mobile number. This demo keeps the session in memory only.</p>
      <form class="auth-form" id="phone-form">
        <label class="field-label" for="phone">Mobile number</label>
        <div class="phone-input-row">
          <select aria-label="Country code">
            <option>+91</option>
          </select>
          <input id="phone" name="phone" inputmode="tel" autocomplete="tel" placeholder="Enter mobile number" value="${escapeHtml(state.phoneDraft)}">
        </div>
        <button class="primary-btn" type="submit">Send OTP</button>
        <div class="divider">or</div>
        <button class="secondary-btn" type="button" data-skip-demo>${ICONS.upload} Continue with sample data</button>
      </form>
      <div class="privacy-line">${ICONS.shield}<span>Your data stays in this browser session. We do not ask for Aadhaar, PAN, or bank account numbers.</span></div>
    </section>
  `, "Dashboard");

  document.querySelector("#phone-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const phone = document.querySelector("#phone").value.replace(/\D/g, "");
    if (phone.length < 10) {
      document.querySelector("#phone").focus();
      return;
    }
    state.phoneDraft = phone.slice(-10);
    state.route = "otp";
    render();
  });

  document.querySelector("[data-skip-demo]").addEventListener("click", () => {
    state.phoneDraft = "9876543210";
    state.session = { phone: state.phoneDraft, startedAt: Date.now() };
    processCsv(SAMPLE_DATASETS[0].csv, SAMPLE_DATASETS[0]);
    state.route = "dashboard";
    render();
  });
}

function renderOtp() {
  renderShell(`
    <section class="screen" aria-labelledby="otp-title">
      <div class="step-header">
        <button class="icon-btn" type="button" data-back aria-label="Back">${ICONS.back}</button>
        <h1 id="otp-title">Enter OTP</h1>
        ${renderThemeToggle("compact")}
      </div>
      <div class="panel" style="text-align:center">
        <p class="copy" style="color:var(--blue); font-weight:760">OTP simulated for demo</p>
        <p class="copy" style="margin-top:10px">We sent an OTP to<br><strong style="color:var(--ink)">+91 ${escapeHtml(state.phoneDraft)}</strong></p>
        <form id="otp-form">
          <div class="otp-grid" aria-label="OTP digits">
            <input class="otp-input" inputmode="numeric" maxlength="1" aria-label="OTP digit 1">
            <input class="otp-input" inputmode="numeric" maxlength="1" aria-label="OTP digit 2">
            <input class="otp-input" inputmode="numeric" maxlength="1" aria-label="OTP digit 3">
            <input class="otp-input" inputmode="numeric" maxlength="1" aria-label="OTP digit 4">
          </div>
          <p class="copy">Any 4 digits will work in this prototype.</p>
          <button class="primary-btn" type="submit">Verify and continue</button>
        </form>
      </div>
    </section>
  `, "Dashboard");

  document.querySelector("[data-back]").addEventListener("click", () => {
    state.route = "login";
    render();
  });

  const inputs = Array.from(document.querySelectorAll(".otp-input"));
  inputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 1);
      if (input.value && inputs[index + 1]) inputs[index + 1].focus();
    });
  });

  document.querySelector("#otp-form").addEventListener("submit", (event) => {
    event.preventDefault();
    // SIMULATED: OTP verification is skipped for demo speed.
    state.session = { phone: state.phoneDraft, startedAt: Date.now() };
    state.route = "upload";
    render();
  });
}

function renderUpload() {
  renderShell(`
    <section class="screen" aria-labelledby="upload-title">
      <div class="step-header">
        <button class="icon-btn" type="button" data-back aria-label="Back">${ICONS.back}</button>
        <h1 id="upload-title">Upload transactions</h1>
        ${renderThemeToggle("compact")}
      </div>
      <p class="copy">Use a CSV with <strong>date, amount, direction</strong>. Links inside files are treated as plain text.</p>
      <label class="upload-zone" id="drop-zone">
        <input id="csv-file" type="file" accept=".csv,text/csv">
        <span>${ICONS.upload}<strong>Tap to upload CSV</strong><small>or drag and drop. CSV only, up to 5 MB.</small></span>
      </label>
      <section class="panel" aria-labelledby="details-title">
        <h2 id="details-title">Basic details for matching</h2>
        <div class="details-grid">
          <label>
            <span class="field-label">Age</span>
            <input class="text-input" id="age" type="number" min="16" max="99" value="${escapeHtml(state.details.age)}">
          </label>
          <label>
            <span class="field-label">Occupation</span>
            <select class="select-input" id="occupation">
              ${OCCUPATIONS.map((item) => `<option ${item === state.details.occupation ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span class="field-label">State</span>
            <select class="select-input" id="state-select">
              ${STATES.map((item) => `<option ${item === state.details.state ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
            </select>
          </label>
        </div>
      </section>
      <section class="panel" aria-labelledby="samples-title">
        <h2 id="samples-title">Sample datasets</h2>
        <div class="samples-grid">
          ${SAMPLE_DATASETS.map((sample) => `
            <button class="sample-btn" type="button" data-sample="${escapeHtml(sample.id)}">${ICONS.file}<span>${escapeHtml(sample.name)}</span></button>
          `).join("")}
        </div>
      </section>
      ${state.parseResult ? renderParseStatus() : ""}
      <button class="primary-btn" type="button" data-dashboard ${state.profile ? "" : "disabled"}>Continue to dashboard</button>
      ${state.session ? renderBottomNav("Upload") : ""}
    </section>
  `, "Transactions", "wide");

  document.querySelector("[data-back]").addEventListener("click", () => {
    state.route = "login";
    render();
  });

  document.querySelector("#age").addEventListener("input", updateDetails);
  document.querySelector("#occupation").addEventListener("change", updateDetails);
  document.querySelector("#state-select").addEventListener("change", updateDetails);

  document.querySelectorAll("[data-sample]").forEach((button) => {
    button.addEventListener("click", () => {
      const sample = SAMPLE_DATASETS.find((item) => item.id === button.dataset.sample);
      processCsv(sample.csv, sample);
      state.route = "upload";
      render();
    });
  });

  const fileInput = document.querySelector("#csv-file");
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) readCsvFile(file);
  });

  const dropZone = document.querySelector("#drop-zone");
  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add("is-dragging");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove("is-dragging");
    });
  });
  dropZone.addEventListener("drop", (event) => {
    const file = event.dataTransfer.files?.[0];
    if (file) readCsvFile(file);
  });

  const dashboardButton = document.querySelector("[data-dashboard]");
  if (dashboardButton) {
    dashboardButton.addEventListener("click", () => {
      updateDetails();
      state.route = "dashboard";
      render();
    });
  }
  bindBottomNav();
}

function updateDetails() {
  const age = Number(document.querySelector("#age")?.value || state.details.age);
  state.details.age = Number.isFinite(age) ? age : state.details.age;
  state.details.occupation = document.querySelector("#occupation")?.value || state.details.occupation;
  state.details.state = document.querySelector("#state-select")?.value || state.details.state;
  if (state.profile) state.matches = matchSchemes(state.details, state.profile);
}

function readCsvFile(file) {
  if (!file.name.toLowerCase().endsWith(".csv") && file.type && !file.type.includes("csv")) {
    state.parseResult = {
      totalRows: 0,
      validRows: 0,
      errors: [{ row: "-", issue: "Please upload a CSV file." }],
      source: file.name
    };
    state.profile = null;
    state.matches = [];
    render();
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    state.parseResult = {
      totalRows: 0,
      validRows: 0,
      errors: [{ row: "-", issue: "File is larger than 5 MB." }],
      source: file.name
    };
    state.profile = null;
    state.matches = [];
    render();
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    updateDetails();
    processCsv(String(reader.result || ""), { name: file.name });
    render();
  });
  reader.readAsText(file);
}

function renderParseStatus() {
  const result = state.parseResult;
  const issueRows = result.errors.slice(0, 4).map((error) => `
    <tr>
      <td>${escapeHtml(error.row)}</td>
      <td>${escapeHtml(error.issue)}</td>
    </tr>
  `).join("");

  return `
    <section class="panel parse-card" aria-labelledby="parse-title">
      <h2 id="parse-title">Parse status</h2>
      <div class="status-list">
        <div class="status-item">
          <span class="status-ok">${ICONS.check}</span>
          <span>${result.validRows > 0 ? "Parsed income rows" : "No usable income rows yet"}</span>
          <strong>${escapeHtml(result.validRows)} of ${escapeHtml(result.totalRows)}</strong>
        </div>
        ${result.errors.length ? `
          <div class="status-item">
            <span class="status-warn">${ICONS.alert}</span>
            <span>Rows skipped safely</span>
            <strong>${escapeHtml(result.errors.length)}</strong>
          </div>
        ` : ""}
      </div>
      ${result.errors.length ? `
        <div class="warning-box">
          <div class="warning-title">${ICONS.alert}<span>We skipped malformed rows instead of crashing.</span></div>
          <table class="issues-table">
            <thead><tr><th>Row</th><th>Issue</th></tr></thead>
            <tbody>${issueRows}</tbody>
          </table>
        </div>
      ` : ""}
      ${!state.profile ? `<p class="error-note">Add at least one valid credit/income row to continue.</p>` : ""}
    </section>
  `;
}

function renderDashboard(activeView = "Dashboard") {
  if (!state.profile) {
    state.route = "upload";
    render();
    return;
  }

  state.matches = matchSchemes(state.details, state.profile);
  const profile = state.profile;
  const eligible = state.matches.filter((item) => item.eligible);
  const nearMatches = state.matches.filter((item) => !item.eligible).slice(0, 2);
  const shownSchemes = [...eligible, ...nearMatches].slice(0, 6);
  const insightsMarkup = `
    <div>
      ${renderIncomeChart(profile)}
      <section class="section-topline">
        <h2>Smart saving suggestion</h2>
      </section>
      ${renderSavings(profile)}
    </div>
  `;
  const schemesMarkup = `
    <aside>
      <section class="section-topline">
        <h2>${activeView === "Schemes" ? "Eligible schemes" : "You may be eligible"}</h2>
        <button class="link-btn" type="button" data-refresh>Edit details</button>
      </section>
      <div class="scheme-list ${activeView === "Schemes" ? "scheme-list--grid" : ""}">
        ${shownSchemes.length ? shownSchemes.map(renderSchemeCard).join("") : `<div class="empty-state">No scheme matches yet. Try adjusting your age, occupation, or state.</div>`}
      </div>
      <button class="share-btn" type="button" data-share>${ICONS.share} Share my summary</button>
    </aside>
  `;
  const bodyMarkup = activeView === "Insights"
    ? `<div class="dashboard-single">${insightsMarkup}</div>`
    : activeView === "Schemes"
      ? `<div class="dashboard-single">${schemesMarkup}</div>`
      : `<div class="dashboard-layout">${insightsMarkup}${schemesMarkup}</div>`;

  renderShell(`
    <section class="dashboard" aria-labelledby="dashboard-title">
      <header class="dashboard-header">
        <div class="session-name">
          <h1 id="dashboard-title">Namaste, ${escapeHtml(currentName())}</h1>
          <p>${dateLabel(profile.start)} - ${dateLabel(profile.end)} income summary</p>
        </div>
        <div class="dashboard-actions">
          ${renderThemeToggle("compact")}
          <button class="icon-btn" type="button" data-reupload aria-label="Upload another CSV">${ICONS.upload}</button>
        </div>
      </header>
      <div class="dashboard-body">
        ${bodyMarkup}
      </div>
      ${renderBottomNav(activeView)}
      ${state.shareOpen ? renderShareModal() : ""}
    </section>
  `, activeView, "wide");

  document.querySelector("[data-reupload]").addEventListener("click", () => {
    state.route = "upload";
    render();
  });
  document.querySelector("[data-refresh]")?.addEventListener("click", () => {
    state.route = "upload";
    render();
  });
  document.querySelector("[data-share]")?.addEventListener("click", () => {
    state.shareOpen = true;
    state.copied = false;
    render();
  });
  bindBottomNav();
  bindShareModal();
}

function renderIncomeChart(profile) {
  const maxAmount = Math.max(...profile.dailySeries.map((day) => day.amount), 1);
  const bars = profile.dailySeries.map((day) => {
    const height = Math.max(3, (day.amount / maxAmount) * 100);
    const className = day.amount === 0 ? "is-empty" : day.amount <= profile.badThreshold ? "is-bad" : day.amount >= profile.goodThreshold ? "is-good" : "";
    return `<span class="bar ${className}" style="height:${height.toFixed(2)}%" title="${dateLabel(day.date)}: ${formatMoney(day.amount)}"></span>`;
  }).join("");

  return `
    <section class="chart-card" aria-labelledby="chart-title">
      <div class="chart-head">
        <h2 id="chart-title">Income pattern</h2>
        <span>${formatMoney(profile.totalIncome)} total</span>
      </div>
      <div class="bar-chart" style="--bar-count:${profile.dailySeries.length}" role="img" aria-label="Daily income bar chart from ${dateLabel(profile.start)} to ${dateLabel(profile.end)}">${bars}</div>
      <div class="bar-labels"><span>${dateLabel(profile.start)}</span><span>${dateLabel(profile.end)}</span></div>
      <div class="stats-grid">
        <div class="stat-card primary"><span>Average daily income</span><strong>${formatMoney(profile.averageDaily)}</strong></div>
        <div class="stat-card good"><span>Good days</span><strong>${profile.goodDays}</strong></div>
        <div class="stat-card bad"><span>Bad days</span><strong>${profile.badDays}</strong></div>
      </div>
      <div class="summary-strip">
        <div class="summary-row"><span>Good day threshold</span><strong>${formatMoney(profile.goodThreshold)} or more</strong></div>
        <div class="summary-row"><span>Bad day threshold</span><strong>${formatMoney(profile.badThreshold)} or less</strong></div>
        <div class="summary-row"><span>Income variance</span><strong>${formatNumber(profile.variance, 0)}</strong></div>
      </div>
    </section>
  `;
}

function renderSavings(profile) {
  return `
    <article class="suggestion-card">
      ${ICONS.rupee}
      <div>
        <h2>Arithmetic-based rule</h2>
        <strong>Save ${formatMoney(profile.savings.savePerGoodDay)} on days above ${formatMoney(profile.goodThreshold)}</strong>
        <p>At your current pattern, that is about ${formatMoney(profile.savings.monthlySaving)} a month and can cover around ${profile.savings.coveredLowDays} low-income day${profile.savings.coveredLowDays === 1 ? "" : "s"}.</p>
      </div>
    </article>
  `;
}

function renderSchemeCard(match) {
  const url = getAllowedUrl(match.id);
  const reason = match.eligible
    ? `You qualify because your ${match.reasons.slice(0, 2).join(" and ")}.`
    : `Close match: ${match.reasons[0] || "some details match"}, but ${match.misses[0]}.`;

  return `
    <article class="scheme-card">
      <div class="scheme-card__top">
        <span class="scheme-icon ${match.color}">${ICONS[match.icon]}</span>
        <div>
          <h3>${escapeHtml(match.name)}</h3>
          <p>${escapeHtml(match.benefit)}</p>
        </div>
      </div>
      <p>${escapeHtml(reason)}</p>
      <div class="scheme-meta">
        <span class="tag">${match.eligible ? "Eligible" : `${match.passed}/${match.required} matched`}</span>
        <span class="tag">Age ${match.minAge}-${match.maxAge}</span>
        <span class="tag">Income <= ${formatMoney(match.maxMonthlyIncome)}</span>
      </div>
      ${url ? `
        <div class="destination">
          <span>You will be taken to ${escapeHtml(url.hostname)}</span>
          <a href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer">${ICONS.external} Open verified portal</a>
        </div>
      ` : ""}
    </article>
  `;
}

function renderBottomNav(active) {
  return `
    <nav class="bottom-nav" aria-label="Main navigation">
      ${bottomNavButton("Dashboard", ICONS.home, active === "Dashboard")}
      ${bottomNavButton("Upload", ICONS.upload, active === "Upload")}
      ${bottomNavButton("Insights", ICONS.bars, active === "Insights")}
      ${bottomNavButton("Schemes", ICONS.schemes, active === "Schemes")}
      ${bottomNavButton("More", ICONS.menu, active === "More")}
    </nav>
  `;
}

function bottomNavButton(label, icon, active) {
  return `<button type="button" class="${active ? "is-active" : ""}" data-bottom-nav="${escapeHtml(label)}">${icon}<span>${escapeHtml(label)}</span></button>`;
}

function bindBottomNav() {
  document.querySelectorAll("[data-bottom-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.bottomNav === "More" && state.profile) {
        state.shareOpen = true;
        render();
        return;
      }
      navigateTo(button.dataset.bottomNav);
    });
  });
}

function shareSummaryText() {
  const profile = state.profile;
  const eligible = state.matches.filter((item) => item.eligible).slice(0, 3);
  return [
    "Kaam Card summary",
    `Phone session: +91 ${state.session?.phone || "demo"}`,
    `Average daily income: ${formatMoney(profile.averageDaily)}`,
    `Good days: ${profile.goodDays}; bad days: ${profile.badDays}`,
    `Saving rule: save ${formatMoney(profile.savings.savePerGoodDay)} on days above ${formatMoney(profile.goodThreshold)}.`,
    `Likely schemes: ${eligible.map((item) => item.shortName).join(", ") || "No exact match yet"}`,
    "Demo note: eligibility is simplified and should be verified on the official portal."
  ].join("\n");
}

function renderShareModal() {
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <section class="share-card">
        <h2 id="share-title">Shareable summary</h2>
        <p class="copy">This is a simple text summary for the demo. No raw transactions are included.</p>
        <textarea class="share-text" readonly>${escapeHtml(shareSummaryText())}</textarea>
        <div class="share-actions">
          <button class="secondary-btn" type="button" data-close-share>Close</button>
          <button class="primary-btn" type="button" data-copy-share>${ICONS.copy} ${state.copied ? "Copied" : "Copy"}</button>
        </div>
      </section>
    </div>
  `;
}

function bindShareModal() {
  const close = document.querySelector("[data-close-share]");
  if (close) {
    close.addEventListener("click", () => {
      state.shareOpen = false;
      render();
    });
  }

  const copy = document.querySelector("[data-copy-share]");
  if (copy) {
    copy.addEventListener("click", async () => {
      const text = shareSummaryText();
      try {
        await navigator.clipboard.writeText(text);
      } catch (error) {
        document.querySelector(".share-text").select();
        document.execCommand("copy");
      }
      state.copied = true;
      render();
    });
  }
}

function initCustomCursor() {
  const finePointer = window.matchMedia("(pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!finePointer.matches || reducedMotion.matches) return;

  const root = document.documentElement;
  const dot = document.createElement("span");
  const ring = document.createElement("span");
  let cursorX = window.innerWidth / 2;
  let cursorY = window.innerHeight / 2;
  let ringX = cursorX;
  let ringY = cursorY;

  dot.className = "custom-cursor";
  ring.className = "custom-cursor-ring";
  dot.setAttribute("aria-hidden", "true");
  ring.setAttribute("aria-hidden", "true");
  document.body.append(dot, ring);
  root.classList.add("has-custom-cursor");

  function isInteractive(target) {
    return (
      target instanceof Element &&
      Boolean(target.closest("a, button, input, select, textarea, label, [role='button'], .upload-zone"))
    );
  }

  function moveCursor(event) {
    cursorX = event.clientX;
    cursorY = event.clientY;
    root.style.setProperty("--cursor-x", `${cursorX}px`);
    root.style.setProperty("--cursor-y", `${cursorY}px`);
    root.classList.add("is-cursor-visible");
    root.classList.toggle("is-cursor-active", isInteractive(event.target));
  }

  function animateRing() {
    ringX += (cursorX - ringX) * 0.22;
    ringY += (cursorY - ringY) * 0.22;
    root.style.setProperty("--cursor-ring-x", `${ringX}px`);
    root.style.setProperty("--cursor-ring-y", `${ringY}px`);
    requestAnimationFrame(animateRing);
  }

  document.addEventListener("pointermove", moveCursor, { passive: true });
  document.addEventListener("pointerleave", () => root.classList.remove("is-cursor-visible"));
  document.addEventListener("pointerdown", () => root.classList.add("is-cursor-pressed"));
  document.addEventListener("pointerup", () => root.classList.remove("is-cursor-pressed"));
  requestAnimationFrame(animateRing);
}

function initInteractiveGridPattern() {
  const finePointer = window.matchMedia("(pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!finePointer.matches || reducedMotion.matches) return;

  const root = document.documentElement;
  let frame = 0;
  let x = 50;
  let y = 28;

  function updateGrid() {
    root.style.setProperty("--grid-x", `${x}%`);
    root.style.setProperty("--grid-y", `${y}%`);
    frame = 0;
  }

  document.addEventListener("pointermove", (event) => {
    x = Math.round((event.clientX / window.innerWidth) * 100);
    y = Math.round((event.clientY / window.innerHeight) * 100);
    if (!frame) frame = requestAnimationFrame(updateGrid);
  }, { passive: true });
}

function render() {
  if (state.route !== "login" && state.route !== "otp" && !state.session) {
    state.route = "login";
  }

  if (state.route === "login") renderLogin();
  if (state.route === "otp") renderOtp();
  if (state.route === "upload") renderUpload();
  if (state.route === "dashboard") renderDashboard();
  if (state.route === "insights") renderDashboard("Insights");
  if (state.route === "schemes") renderDashboard("Schemes");
}

applyTheme(state.theme);
initInteractiveGridPattern();
initCustomCursor();
render();
