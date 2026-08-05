const app = document.querySelector("#app");
const THEME_STORAGE_KEY = "kaam-card-theme";
const SESSION_STORAGE_KEY = "kaam-card-session";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const BAD_DAY_THRESHOLD_RATIO = 0.75;
const SAVINGS_RATE = 0.45;
const MIN_SAVINGS_AMOUNT = 20;
const SAVINGS_ROUNDING = 10;
const FALLBACK_SURPLUS_RATIO = 0.2;
const DAYS_IN_MONTH = 30;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const IDLE_WARN_MS = 25 * 60 * 1000;

// Offline Upload Queue
const UPLOAD_QUEUE_KEY = "kaam-card-upload-queue";

async function addToUploadQueue(file, metadata = {}) {
  const queueItem = {
    id: "upload_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9),
    fileName: file.name,
    fileType: file.name.toLowerCase().endsWith(".csv") ? "csv" : "pdf",
    fileData: await fileToBase64(file),
    metadata: {
      ...metadata,
      uploadedAt: Date.now(),
      fileSize: file.size
    },
    status: "pending",
    retries: 0
  };

  try {
    if (window.KaamDb) {
      await window.KaamDb.set(UPLOAD_QUEUE_KEY + "_" + queueItem.id, queueItem);
    } else {
      // Fallback to localStorage
      const queue = JSON.parse(localStorage.getItem(UPLOAD_QUEUE_KEY) || "[]");
      queue.push(queueItem);
      localStorage.setItem(UPLOAD_QUEUE_KEY, JSON.stringify(queue));
    }
    return queueItem;
  } catch (error) {
    console.error("Failed to add to upload queue:", error);
    return null;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function getUploadQueue() {
  try {
    if (window.KaamDb) {
      // Get all keys starting with upload queue prefix
      const db = await window.KaamDb.openDb();
      return new Promise((resolve) => {
        const tx = db.transaction("uploadQueue", "readonly");
        const store = tx.objectStore("uploadQueue");
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });
    } else {
      return JSON.parse(localStorage.getItem(UPLOAD_QUEUE_KEY) || "[]");
    }
  } catch {
    return JSON.parse(localStorage.getItem(UPLOAD_QUEUE_KEY) || "[]");
  }
}

async function processUploadQueue() {
  if (!navigator.onLine) return;
  
  const queue = await getUploadQueue();
  const pending = queue.filter(item => item.status === "pending");
  
  for (const item of pending) {
    try {
      // Update status to processing
      item.status = "processing";
      await updateUploadQueueItem(item);
      
      // Convert base64 back to file
      const file = base64ToFile(item.fileData, item.fileName, item.fileType);
      
      // Process the file (simulate upload)
      await processQueuedFile(file, item.metadata);
      
      // Mark as completed
      item.status = "completed";
      item.completedAt = Date.now();
      await updateUploadQueueItem(item);
      
      addAuditLog(`Processed offline upload: ${item.fileName}`);
    } catch (error) {
      console.error("Failed to process queued upload:", error);
      item.status = "failed";
      item.error = error.message;
      item.retries = (item.retries || 0) + 1;
      await updateUploadQueueItem(item);
    }
  }
}

function base64ToFile(base64, fileName, fileType) {
  const byteString = atob(base64);
  const mimeType = fileType === "csv" ? "text/csv" : "application/pdf";
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new File([ab], fileName, { type: mimeType });
}

async function processQueuedFile(file, metadata) {
  // Reuse the existing file processing logic
  if (file.type.includes("csv") || file.name.endsWith(".csv")) {
    const text = await file.text();
    const parseResult = parseTransactions(text);
    return { validRows: parseResult.validRows, errors: parseResult.errors };
  } else {
    const arrayBuffer = await file.arrayBuffer();
    const parseResult = await window.KaamPdfParser.parse(new Uint8Array(arrayBuffer));
    return { validRows: parseResult.validRows, errors: parseResult.errors };
  }
}

async function updateUploadQueueItem(item) {
  try {
    if (window.KaamDb) {
      await window.KaamDb.set("kaam-card-upload-queue_" + item.id, item);
    } else {
      const queue = JSON.parse(localStorage.getItem(UPLOAD_QUEUE_KEY) || "[]");
      const idx = queue.findIndex(i => i.id === item.id);
      if (idx >= 0) queue[idx] = item;
      localStorage.setItem(UPLOAD_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch (error) {
    console.error("Failed to update upload queue item:", error);
  }
}

// Register online/offline handlers
window.addEventListener("online", () => {
  addAuditLog("Connection restored. Processing pending uploads...");
  processUploadQueue();
});

window.addEventListener("offline", () => {
  addAuditLog("Connection lost. Uploads will be queued for later.");
});

// Process queue on startup
document.addEventListener("DOMContentLoaded", () => {
  if (navigator.onLine) {
    processUploadQueue();
  }
});

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
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.4 14.5A8.2 8.2 0 0 1 9.5 3.6 8.5 8.5 0 1 0 20.4 14.5Z"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>'
};

const OCCUPATION_ALIASES = {
  "cab driver": "Driver",
  "auto driver": "Driver",
  "taxi driver": "Driver",
  "truck driver": "Driver",
  "ride driver": "Driver",
  "delivery partner": "Delivery worker",
  "food delivery": "Delivery worker",
  "courier": "Delivery worker",
  "household worker": "Domestic worker",
  "maid": "Domestic worker",
  "cook": "Domestic worker",
  "sweeper": "Domestic worker",
  "vendor": "Street vendor",
  "hawker": "Street vendor",
  "market vendor": "Street vendor",
  "factory worker": "Construction worker",
  "mason": "Construction worker",
  "carpenter": "Construction worker",
  "plumber": "Construction worker",
  "electrician": "Construction worker",
  "tailor": "Home-based worker",
  "handicraft": "Home-based worker",
  "home-based": "Home-based worker"
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
  if (state.highContrast) {
    document.documentElement.classList.add("high-contrast");
  } else {
    document.documentElement.classList.remove("high-contrast");
  }
}

function toggleHighContrast() {
  state.highContrast = !state.highContrast;
  applyTheme(state.theme);
  saveSession();
  addAuditLog(`High contrast mode ${state.highContrast ? "enabled" : "disabled"}`);
  announceToScreenReader(state.highContrast ? t("High contrast enabled") : t("High contrast disabled"));
}

function toggleVoiceInput() {
  state.voiceEnabled = !state.voiceEnabled;
  saveSession();
  addAuditLog(`Voice input ${state.voiceEnabled ? "enabled" : "disabled"}`);
  announceToScreenReader(state.voiceEnabled ? t("Voice input enabled") : t("Voice input disabled"));
}

function announceToScreenReader(message) {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.style.position = "absolute";
  announcement.style.width = "1px";
  announcement.style.height = "1px";
  announcement.style.padding = "0";
  announcement.style.margin = "-1px";
  announcement.style.overflow = "hidden";
  announcement.style.clip = "rect(0, 0, 0, 0)";
  announcement.style.whiteSpace = "nowrap";
  announcement.style.border = "0";
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}

function initVoiceInput() {
  if (!state.voiceEnabled || !window.SpeechRecognition && !window.webkitSpeechRecognition) return;
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = state.lang === "hi" ? "hi-IN" : state.lang === "ta" ? "ta-IN" : state.lang === "te" ? "te-IN" : state.lang === "mr" ? "mr-IN" : "en-IN";
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const activeInput = document.activeElement;
    if (activeInput && (activeInput.tagName === "INPUT" || activeInput.tagName === "TEXTAREA")) {
      activeInput.value += (activeInput.value ? " " : "") + transcript;
      activeInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };
  
  recognition.onerror = (event) => {
    console.warn("Speech recognition error:", event.error);
  };
  
  // Add voice input button to text inputs
  document.querySelectorAll("input[type='text'], textarea").forEach(input => {
    if (!input.dataset.voiceAdded) {
      const voiceBtn = document.createElement("button");
      voiceBtn.type = "button";
      voiceBtn.className = "voice-input-btn";
      voiceBtn.innerHTML = ICONS.mic;
      voiceBtn.style.cssText = "position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:4px;color:var(--muted)";
      voiceBtn.title = t("Tap to speak");
      voiceBtn.addEventListener("click", () => {
        recognition.start();
      });
      input.style.position = "relative";
      input.parentElement.style.position = "relative";
      input.parentElement.appendChild(voiceBtn);
      input.dataset.voiceAdded = "true";
    }
  });
  
  return recognition;
}

function saveSession() {
  try {
    const data = {
      session: state.session,
      profile: state.profile,
      expenseProfile: state.expenseProfile,
      parseResult: state.parseResult,
      matches: state.matches,
      details: state.details,
      consentGiven: state.consentGiven,
      incomeEntries: state.incomeEntries,
      uploadedFiles: state.uploadedFiles,
      mergedTransactions: state.mergedTransactions,
      budgets: state.budgets,
      savingsGoals: state.savingsGoals,
      documents: state.documents,
      onboardingDone: state.onboardingDone,
      highContrast: state.highContrast,
      voiceEnabled: state.voiceEnabled
    };
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // Storage quota exceeded or private browsing — session persistence is optional.
  }
}

function loadSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data.session) state.session = data.session;
    if (data.profile) state.profile = data.profile;
    if (data.expenseProfile) state.expenseProfile = data.expenseProfile;
    if (data.parseResult) state.parseResult = data.parseResult;
    if (data.matches) state.matches = data.matches;
    if (data.details) state.details = data.details;
    if (data.consentGiven) state.consentGiven = data.consentGiven;
    if (data.incomeEntries) state.incomeEntries = data.incomeEntries;
    if (data.uploadedFiles) state.uploadedFiles = data.uploadedFiles;
    if (data.mergedTransactions) state.mergedTransactions = data.mergedTransactions;
    if (data.budgets) state.budgets = data.budgets;
    if (data.savingsGoals) state.savingsGoals = data.savingsGoals;
    if (data.documents) state.documents = data.documents;
    if (data.onboardingDone) state.onboardingDone = data.onboardingDone;
    if (data.highContrast !== undefined) state.highContrast = data.highContrast;
    if (data.voiceEnabled !== undefined) state.voiceEnabled = data.voiceEnabled;
    return Boolean(data.session);
  } catch (error) {
    return false;
  }
}

function touchActivity() {
  state.lastActivity = Date.now();
}

function checkSessionTimeout() {
  if (!state.session) return;
  const elapsed = Date.now() - state.lastActivity;
  if (elapsed > SESSION_TIMEOUT_MS) {
    addAuditLog("Session timed out due to inactivity.");
    clearSessionData();
    state.session = null;
    state.route = "landing";
    saveSession();
    render();
    return true;
  }
  return false;
}

document.addEventListener("click", touchActivity);
document.addEventListener("keydown", touchActivity);
document.addEventListener("scroll", touchActivity, { passive: true });

setInterval(checkSessionTimeout, 30000);

function clearSessionData() {
  state.session = null;
  state.phoneDraft = "";
  state.otpDebugCode = null;
  state.details = { age: 29, occupation: "Delivery worker", state: "Delhi" };
  state.parseResult = null;
  state.profile = null;
  state.expenseProfile = null;
  state.matches = [];
  state.auditLogs = [];
  state.incomeEntries = [];
  state.uploadedFiles = [];
  state.mergedTransactions = null;
  state.budgets = {};
  state.savingsGoals = [];
  state.documents = {};
  state.consentGiven = false;
  clearSessionStorage();
  try { API.purgeSession(); } catch (e) {}
}

function clearSessionStorage() {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    // Cleanup is best-effort.
  }
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
  delhiBocw: "https://labour.delhi.gov.in/labour/delhi-building-and-other-construction-workers-welfare-board",
  maharashtraBocw: "https://bocw.maharashtra.gov.in/",
  karnatakaUnorganized: "https://kwssb.karnataka.gov.in/",
  tamilNaduManual: "https://tnmwwb.tn.gov.in/",
  upBocw: "https://upbocw.in/",
  westBengalUnorganized: "https://wbunorganizedworkers.gov.in/",
  rajasthanBocw: "https://bocw.rajasthan.gov.in/",
  gujaratBocw: "https://bocw.gujarat.gov.in/",
  mpBocw: "https://bocw.mp.gov.in/",
  biharUnorganized: "https://labour.bihar.gov.in/",
  odishaUnorganized: "https://labour.odisha.gov.in/",
  pmSvanidhi: "https://pmsvanidhi.mohua.gov.in/",
  atalPension: "https://www.npscra.nsdl.co.in/",
  pmMudra: "https://www.mudra.org.in/",
  jananiSuraksha: "https://nhm.gov.in/index1.php?lang=1&level=2&sublinkid=911&lid=297",
  matruVandana: "https://wcd.nic.in/schemes/pradhan-mantri-matru-vandana-yojana",
  ayushmanBharat: "https://abha.abdm.gov.in/",
  npsVatsalya: "https://www.npscra.nsdl.co.in/",
  skillIndia: "https://www.pmkvyofficial.org/",
  standUpIndia: "https://www.standupindia.gov.in/",
  ektaMall: "https://pmsvanidhi.mohua.gov.in/ektamall"
};

const FALLBACK_SCHEMES = [
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
    color: "green",
    deadline: "2026-03-31",
    reminderDays: [60, 30, 7, 1]
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
    color: "blue",
    deadline: "2026-12-31",
    reminderDays: [90, 30, 7]
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
    color: "saffron",
    deadline: "2026-12-31",
    reminderDays: [60, 30, 7]
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
    color: "blue",
    deadline: "2026-05-31",
    reminderDays: [30, 14, 3]
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
    color: "green",
    deadline: "2026-05-31",
    reminderDays: [30, 14, 3]
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
    color: "saffron",
    deadline: "2026-09-30",
    reminderDays: [30, 7, 1]
  },
  {
    id: "maharashtraBocw",
    name: "Maharashtra Building & Other Construction Workers Welfare Board",
    shortName: "Maharashtra BOCW",
    benefit: "Welfare benefits, pension, accident cover for construction workers",
    minAge: 18,
    maxAge: 60,
    maxMonthlyIncome: 25000,
    occupations: ["Construction worker"],
    states: ["Maharashtra"],
    icon: "home",
    color: "saffron",
    deadline: "2026-10-31",
    reminderDays: [30, 7, 1]
  },
  {
    id: "karnatakaUnorganized",
    name: "Karnataka Unorganised Workers Social Security Board",
    shortName: "Karnataka UWSSB",
    benefit: "Pension, health insurance, accident cover for unorganised workers",
    minAge: 18,
    maxAge: 60,
    maxMonthlyIncome: 20000,
    occupations: ["Delivery worker", "Driver", "Construction worker", "Domestic worker", "Street vendor", "Home-based worker", "Other informal worker"],
    states: ["Karnataka"],
    icon: "shield",
    color: "blue",
    deadline: "2026-11-30",
    reminderDays: [30, 7, 1]
  },
  {
    id: "tamilNaduManual",
    name: "Tamil Nadu Manual Workers Welfare Board",
    shortName: "TN Manual Workers",
    benefit: "Pension, family pension, education assistance, accident relief",
    minAge: 18,
    maxAge: 60,
    maxMonthlyIncome: 18000,
    occupations: ["Construction worker", "Street vendor", "Domestic worker", "Home-based worker"],
    states: ["Tamil Nadu"],
    icon: "home",
    color: "green"
  },
  {
    id: "upBocw",
    name: "Uttar Pradesh Building & Other Construction Workers Welfare Board",
    shortName: "UP BOCW",
    benefit: "Pension, maternity benefit, disability pension, death benefit",
    minAge: 18,
    maxAge: 60,
    maxMonthlyIncome: 15000,
    occupations: ["Construction worker"],
    states: ["Uttar Pradesh"],
    icon: "home",
    color: "saffron"
  },
  {
    id: "westBengalUnorganized",
    name: "West Bengal Unorganised Sector Workers Welfare Board",
    shortName: "WB Unorganised",
    benefit: "Pension, health scheme, death benefit, education grant",
    minAge: 18,
    maxAge: 60,
    maxMonthlyIncome: 20000,
    occupations: ["Delivery worker", "Driver", "Construction worker", "Domestic worker", "Street vendor", "Home-based worker", "Other informal worker"],
    states: ["West Bengal"],
    icon: "shield",
    color: "blue"
  },
  {
    id: "rajasthanBocw",
    name: "Rajasthan Building & Other Construction Workers Welfare Board",
    shortName: "Rajasthan BOCW",
    benefit: "Pension, accident insurance, maternity benefit, scholarship",
    minAge: 18,
    maxAge: 60,
    maxMonthlyIncome: 20000,
    occupations: ["Construction worker"],
    states: ["Rajasthan"],
    icon: "home",
    color: "green"
  },
  {
    id: "gujaratBocw",
    name: "Gujarat Building & Other Construction Workers Welfare Board",
    shortName: "Gujarat BOCW",
    benefit: "Pension, accident cover, tool kit assistance, skill training",
    minAge: 18,
    maxAge: 60,
    maxMonthlyIncome: 15000,
    occupations: ["Construction worker"],
    states: ["Gujarat"],
    icon: "home",
    color: "saffron"
  },
  {
    id: "mpBocw",
    name: "Madhya Pradesh Building & Other Construction Workers Welfare Board",
    shortName: "MP BOCW",
    benefit: "Pension, accident insurance, marriage assistance, education grant",
    minAge: 18,
    maxAge: 60,
    maxMonthlyIncome: 15000,
    occupations: ["Construction worker"],
    states: ["Madhya Pradesh"],
    icon: "home",
    color: "blue"
  },
  {
    id: "biharUnorganized",
    name: "Bihar Unorganised Workers Social Security Board",
    shortName: "Bihar Unorganised",
    benefit: "Pension, health insurance, disability cover, death benefit",
    minAge: 18,
    maxAge: 60,
    maxMonthlyIncome: 15000,
    occupations: ["Delivery worker", "Driver", "Construction worker", "Domestic worker", "Street vendor", "Home-based worker", "Other informal worker"],
    states: ["Bihar"],
    icon: "shield",
    color: "green"
  },
  {
    id: "odishaUnorganized",
    name: "Odisha Unorganised Workers Welfare Board",
    shortName: "Odisha Unorganised",
    benefit: "Pension, accident insurance, health cover, scholarship",
    minAge: 18,
    maxAge: 60,
    maxMonthlyIncome: 15000,
    occupations: ["Delivery worker", "Driver", "Construction worker", "Domestic worker", "Street vendor", "Home-based worker", "Other informal worker"],
    states: ["Odisha"],
    icon: "shield",
    color: "saffron"
  },
  {
    id: "pmSvanidhi",
    name: "PM SVANidhi",
    shortName: "PM SVANidhi",
    benefit: "Collateral-free working capital loan up to ₹50,000 for street vendors",
    minAge: 18,
    maxAge: 70,
    maxMonthlyIncome: null,
    occupations: ["Street vendor"],
    icon: "wallet",
    color: "blue"
  },
  {
    id: "atalPension",
    name: "Atal Pension Yojana",
    shortName: "APY",
    benefit: "Guaranteed pension ₹1,000-5,000/month after age 60",
    minAge: 18,
    maxAge: 40,
    maxMonthlyIncome: null,
    occupations: ["Delivery worker", "Driver", "Construction worker", "Domestic worker", "Street vendor", "Home-based worker", "Other informal worker"],
    icon: "rupee",
    color: "saffron"
  },
  {
    id: "pmMudra",
    name: "PM MUDRA Yojana (Shishu)",
    shortName: "MUDRA Shishu",
    benefit: "Micro loan up to ₹50,000 for small business",
    minAge: 18,
    maxAge: 65,
    maxMonthlyIncome: null,
    occupations: ["Street vendor", "Home-based worker", "Other informal worker"],
    icon: "wallet",
    color: "green"
  },
  {
    id: "jananiSuraksha",
    name: "Janani Suraksha Yojana",
    shortName: "JSY",
    benefit: "Cash assistance for institutional delivery",
    minAge: 18,
    maxAge: 45,
    maxMonthlyIncome: 20000,
    occupations: ["Delivery worker", "Driver", "Construction worker", "Domestic worker", "Street vendor", "Home-based worker", "Other informal worker"],
    states: [],
    icon: "shield",
    color: "saffron"
  },
  {
    id: "matruVandana",
    name: "Pradhan Mantri Matru Vandana Yojana",
    shortName: "PMMVY",
    benefit: "₹5,000 cash incentive for first live birth",
    minAge: 18,
    maxAge: 45,
    maxMonthlyIncome: 20000,
    occupations: ["Delivery worker", "Driver", "Construction worker", "Domestic worker", "Street vendor", "Home-based worker", "Other informal worker"],
    icon: "rupee",
    color: "blue"
  },
  {
    id: "ayushmanBharat",
    name: "Ayushman Bharat Health Account (ABHA)",
    shortName: "ABHA",
    benefit: "Digital health ID for seamless healthcare access",
    minAge: 0,
    maxAge: 99,
    maxMonthlyIncome: null,
    occupations: ["Delivery worker", "Driver", "Construction worker", "Domestic worker", "Street vendor", "Home-based worker", "Other informal worker"],
    icon: "shield",
    color: "green"
  },
  {
    id: "npsVatsalya",
    name: "NPS Vatsalya",
    shortName: "NPS Vatsalya",
    benefit: "Pension account for minors, converts to regular NPS at 18",
    minAge: 0,
    maxAge: 17,
    maxMonthlyIncome: null,
    occupations: ["Delivery worker", "Driver", "Construction worker", "Domestic worker", "Street vendor", "Home-based worker", "Other informal worker"],
    icon: "rupee",
    color: "saffron"
  },
  {
    id: "skillIndia",
    name: "PM Kaushal Vikas Yojana (PMKVY)",
    shortName: "PMKVY",
    benefit: "Free skill training with certification and placement support",
    minAge: 15,
    maxAge: 45,
    maxMonthlyIncome: null,
    occupations: ["Delivery worker", "Driver", "Construction worker", "Domestic worker", "Street vendor", "Home-based worker", "Other informal worker"],
    icon: "file",
    color: "blue"
  },
  {
    id: "standUpIndia",
    name: "Stand-Up India",
    shortName: "Stand-Up India",
    benefit: "Bank loan ₹10 lakh - ₹1 crore for SC/ST/Women entrepreneurs",
    minAge: 18,
    maxAge: 65,
    maxMonthlyIncome: null,
    occupations: ["Home-based worker", "Street vendor", "Other informal worker"],
    icon: "wallet",
    color: "green"
  },
  {
    id: "ektaMall",
    name: "Ekta Mall (PM SVANidhi Extension)",
    shortName: "Ekta Mall",
    benefit: "E-commerce platform for street vendors to sell online",
    minAge: 18,
    maxAge: 70,
    maxMonthlyIncome: null,
    occupations: ["Street vendor"],
    icon: "wallet",
    color: "saffron"
  }
];

// SIMULATED: this is an in-memory phone-keyed demo session. No password auth,
// no localStorage token, and no raw transaction persistence are used.
let introShown = false;

const state = {
  route: "landing",
  session: null,
  phoneDraft: "",
  otpDebugCode: null,
  theme: getInitialTheme(),
  lang: "en",
  details: {
    age: 29,
    occupation: "Delivery worker",
    state: "Delhi"
  },
  parseResult: null,
  profile: null,
  expenseProfile: null,
  matches: [],
  shareOpen: false,
  copied: false,
  consentGiven: false,
  auditLogs: [],
  schemeQuery: "",
  guidanceSchemeId: null,
  guidanceStep: 1,
  schemesDb: [],
  drawerOpen: false,
  searchOpen: false,
  rightSidebarOpen: false,
  incomeEntries: [],
  uploadedFiles: [],
  mergedTransactions: null,
  budgets: {},
  savingsGoals: [],
  documents: {},
  onboardingDone: false,
  highContrast: false,
  voiceEnabled: true,
  lastActivity: Date.now()
};

const TRANSLATIONS = {
  // Brand / Navigation
  "Kaam Card": "काम कार्ड",
  "Dashboard": "डैशबोर्ड",
  "Connect Data": "डेटा कनेक्ट करें",
  "Income Analytics": "आय विश्लेषण",
  "Welfare Schemes": "कल्याणकारी योजनाएं",
  "General": "सामान्य",
  "Insights": "इनसाइट्स",
  "Secure & Private": "सुरक्षित और निजी",
  "Parsed locally. Zero network leaks.": "स्थानीय रूप से पार्स किया गया। कोई डेटा लीक नहीं।",
  "Purge Session Data": "सत्र डेटा साफ़ करें",
  "Purge Session": "सत्र साफ़ करें",
  "Export Card": "कार्ड निर्यात करें",
  "Light Mode": "लाइट मोड",
  "Dark Mode": "डार्क मोड",
  "High Contrast": "हाई कंट्रास्ट",
  "Voice Input": "वॉयस इनपुट",
  "Screen Reader": "स्क्रीन रीडर",
  "Enable High Contrast": "हाई कंट्रास्ट सक्षम करें",
  "Disable High Contrast": "हाई कंट्रास्ट अक्षम करें",
  "Enable Voice Input": "वॉयस इनपुट सक्षम करें",
  "Disable Voice Input": "वॉयस इनपुट अक्षम करें",
  "High contrast enabled": "हाई कंट्रास्ट सक्षम",
  "High contrast disabled": "हाई कंट्रास्ट अक्षम",
  "Voice input enabled": "वॉयस इनपुट सक्षम",
  "Voice input disabled": "वॉयस इनपुट अक्षम",
  "Tap to speak": "बोलने के लिए टैप करें",
  "Listening...": "सुन रहा है...",
  "For you": "आपके लिए",
  "SECURE SANDBOX": "सुरक्षित सैंडबॉक्स",
  "LOG IN / START": "लॉग इन / शुरू करें",
  "Create Your Kaam Card": "अपना काम कार्ड बनाएं",
  "How it Works": "यह कैसे काम करता है",
  "100% Private: No Aadhaar or PAN stored": "100% निजी: आधार या पैन संग्रहीत नहीं",
  "Safe: In-memory processing": "सुरक्षित: केवल मेमोरी में प्रोसेसिंग",
  "Go from Platform Earnings to Welfare Benefits in 2 Minutes.": "२ मिनट में प्लेटफ़ॉर्म कमाई से कल्याणकारी योजनाओं तक जाएँ।",
  "Kaam Card is a portable, secure record for informal and gig workers.": "काम कार्ड असंगठित और गिग श्रमिकों के लिए एक सुरक्षित रिकॉर्ड है।",
  "Aadhaar Card": "आधार कार्ड",

  // Landing page
  "What We Do": "हम क्या करते हैं",
  "Designed for India's Informal Workforce": "भारत के असंगठित कार्यबल के लिए डिज़ाइन किया गया",
  "2 min": "२ मिनट",
  "Average setup time": "औसत सेटअप समय",
  "Zero": "शून्य",
  "Data stored on servers": "सर्वर पर संग्रहीत डेटा",
  "Go from daily wages to safe public welfare benefits": "दैनिक मजदूरी से सुरक्षित सरकारी कल्याण योजनाओं तक",
  "Verify your eligibility instantly and register on official portals without middleman risk.": "बिचौलियों के जोखिम के बिना अपनी पात्रता तुरंत सत्यापित करें और आधिकारिक पोर्टलों पर पंजीकरण करें।",
  "Verify eligibility & register": "पात्रता सत्यापित करें और पंजीकरण करें",
  "Punchlist's Quality": "गुणवत्ता आश्वासन",
  "Go from design to build without losing crucial details.": "महत्वपूर्ण विवरण खोए बिना डिज़ाइन से निर्माण तक जाएँ।",
  "Security Audit": "सुरक्षा ऑडिट",
  "No data is shared or stored without explicit consent.": "स्पष्ट सहमति के बिना कोई डेटा साझा या संग्रहीत नहीं किया जाता है।",
  "Why Kaam Card?": "काम कार्ड क्यों?",
  "We help gig workers accumulate data value that is normally locked away in siloed apps.": "हम गिग श्रमिकों को ऐसा डेटा मूल्य बनाने में मदद करते हैं जो आम तौर पर अलग-अलग ऐप्स में बंद रहता है।",
  "Income Analytics": "आय विश्लेषण",
  "Understand your earnings variance, good days vs bad days, and average monthly income instantly.": "अपनी कमाई में उतार-चढ़ाव, अच्छे दिन बनाम बुरे दिन, और औसत मासिक आय तुरंत समझें।",
  "Scheme Matching": "योजना मिलान",
  "Automatically match your computed income against real criteria for e-Shram, PM-SYM, PM-JAY, and more.": "e-Shram, PM-SYM, PM-JAY और अन्य के वास्तविक मानदंडों से अपनी गणना की गई आय को स्वतः मिलाएं।",
  "Smart Micro-Savings": "स्मार्ट सूक्ष्म बचत",
  "Get a mathematically grounded savings rule based on your actual income surplus on high-earning days.": "उच्च-आय वाले दिनों में आपकी वास्तविक आय अधिशेष के आधार पर गणितीय बचत नियम प्राप्त करें।",
  "Three Simple Steps": "तीन सरल चरण",
  "Secure OTP Login": "सुरक्षित ओटीपी लॉगिन",
  "Enter your phone number to start a secure, isolated sandbox session. No passwords required.": "सुरक्षित, अलग सैंडबॉक्स सत्र शुरू करने के लिए अपना फोन नंबर दर्ज करें। पासवर्ड की आवश्यकता नहीं है।",
  "Upload Statements": "स्टेटमेंट अपलोड करें",
  "Drop a bank statement or UPI statement CSV. We parse it locally in your browser and discard raw transaction details.": "बैंक स्टेटमेंट या UPI स्टेटमेंट CSV अपलोड करें। हम इसे आपके ब्राउज़र में स्थानीय रूप से पार्स करते हैं और कच्चे लेनदेन विवरण हटा देते हैं।",
  "Get Kaam Dashboard": "काम डैशबोर्ड खोलें",
  "Instantly check eligible schemes, review savings recommendations, and export your portable worker card.": "योग्य योजनाएं तुरंत जांचें, बचत सुझाव देखें, और अपना पोर्टेबल वर्कर कार्ड एक्सपोर्ट करें।",
  "Loved by Workers": "श्रमिकों द्वारा पसंद किया गया",
  "Hear from informal partners who verified their scheme eligibility using Kaam Card.": "उन असंगठित साथियों की बातें सुनें जिन्होंने काम कार्ड से अपनी योजना पात्रता सत्यापित की।",

  // Login
  "Log In & Access Portal": "लॉग इन और पोर्टल एक्सेस",
  "Start with your mobile number. This demo keeps the session in memory only.": "अपने मोबाइल नंबर से शुरू करें। यह डेमो सत्र को केवल मेमोरी में रखता है।",
  "Mobile number": "मोबाइल नंबर",
  "Enter mobile number": "अपना मोबाइल नंबर दर्ज करें",
  "Enter 10 digit number to receive a secure OTP verification check.": "सुरक्षित ओटीपी सत्यापन प्राप्त करने के लिए 10 अंकों का नंबर दर्ज करें।",
  "Send secure OTP link": "सुरक्षित ओटीपी लिंक भेजें",
  "Continue with sample data": "नमूना डेटा के साथ जारी रखें",
  "OTP Verification": "ओटीपी सत्यापन",
  "OTP sent via server": "सर्वर के माध्यम से भेजा गया ओटीपी",
  "We sent an OTP to": "हमने ओटीपी भेजा है",
  "Any 4 digits will work in this prototype.": "इस प्रोटोटाइप में कोई भी 4 अंक काम करेंगे।",
  "Verify code": "कोड सत्यापित करें",
  "Verify and continue": "सत्यापित करें और जारी रखें",
  "Switch to light theme": "लाइट थीम पर स्विच करें",
  "Switch to dark theme": "डार्क थीम पर स्विच करें",

  // Consent / Upload
  "Consent & Authorization": "सहमति और प्राधिकरण",
  "Kaam Card parses statement details locally to build your portable record. By continuing, you agree to:": "काम कार्ड आपके पोर्टेबल रिकॉर्ड को बनाने के लिए स्टेटमेंट विवरण को स्थानीय रूप से पार्स करता है। आगे बढ़कर आप सहमत होते हैं:",
  "Local Parsing:": "स्थानीय पार्सिंग:",
  "Executed strictly in-browser memory.": "सिर्फ ब्राउज़र मेमोरी में निष्पादित।",
  "Data Minimization:": "डेटा न्यूनीकरण:",
  "Raw lines are discarded after daily stats computation.": "दैनिक आँकड़े बनने के बाद कच्ची पंक्तियाँ हटा दी जाती हैं।",
  "Zero ID Collection:": "कोई पहचान-संग्रह नहीं:",
  "We never collect Aadhaar, PAN, or full bank numbers.": "हम कभी आधार, पैन, या पूरा बैंक नंबर एकत्र नहीं करते।",
  "I authorize Kaam Card to parse my transaction statement.": "मैं काम कार्ड को अपने लेनदेन स्टेटमेंट को पार्स करने की अनुमति देता/देती हूँ।",
  "Kaam Card parses statement details locally to build your portable record. By continuing, you agree to:": "काम कार्ड आपका सुरक्षित रिकॉर्ड बनाने के लिए स्टेटमेंट को स्थानीय रूप से पार्स करता है। आगे बढ़ने से आप निम्न पर सहमत हैं:",
  "Local Parsing:": "स्थानीय पार्सिंग:",
  "Data Minimization:": "डेटा न्यूनीकरण:",
  "Zero ID Collection:": "कोई आईडी संग्रह नहीं:",
  "Executed strictly in-browser memory.": "केवल ब्राउज़र मेमोरी में निष्पादित।",
  "Raw lines are discarded after daily stats computation.": "दैनिक गणना के बाद कच्चा डेटा हटा दिया जाता है।",
  "We never collect Aadhaar, PAN, or full bank numbers.": "हम कभी भी आधार, पैन या बैंक नंबर एकत्र नहीं करते हैं।",
  "Your data stays in this browser session. We do not ask for Aadhaar, PAN, or bank account numbers.": "आपका डेटा इसी ब्राउज़र सत्र में रहता है। हम आधार, पैन, या बैंक खाता नंबर नहीं मांगते।",
  "Use a CSV with date, amount, direction. Links inside files are treated as plain text.": "date, amount, direction वाले CSV का उपयोग करें। फ़ाइलों के अंदर के लिंक सामान्य टेक्स्ट माने जाते हैं।",
  "Tap to upload CSV": "CSV अपलोड करने के लिए टैप करें",
  "or drag and drop. CSV only, up to 5 MB.": "या ड्रैग और ड्रॉप करें। केवल CSV, अधिकतम 5 MB।",
  "Basic details for matching": "मिलान के लिए मूल विवरण",
  "Age": "आयु",
  "Occupation": "पेशा",
  "State": "राज्य",
  "Sample datasets": "नमूना डेटासेट",
  "Choose Bank Statement Dataset": "बैंक स्टेटमेंट डेटासेट चुनें",
  "Continue to dashboard": "डैशबोर्ड पर जारी रखें",

  // Dashboard
  "Welcome, Worker": "स्वागत है, कार्यकर्ता",
  "This dashboard tracks your calculated income averages and verifies matching state schemes.": "यह डैशबोर्ड आपकी आय के औसत को ट्रैक करता है और पात्रता सत्यापित करता है।",
  "Daily earnings trend and variations": "दैनिक कमाई का रुझान और बदलाव",
  "Daily Avg": "दैनिक औसत",
  "Good Days": "अच्छे दिन",
  "Bad Days": "बुरे दिन",
  "Smart Suggestion": "स्मार्ट सुझाव",
  "Arithmetic-based micro-savings rule": "गणित-आधारित सूक्ष्म-बचत नियम",
  "Tied to your actual data, this habit will accumulate about": "आपके वास्तविक डेटा से जुड़ा, यह नियम लगभग संचय करेगा",
  "low-income days.": "कम आय वाले दिन।",
  "on days earning above": "उन दिनों में जिनकी कमाई अधिक है",
  "Save Rs": "बचत करें रु",
  "and cover up to": "और कवर करेगा",
  "Welfare Matching": "कल्याण मिलान",
  "Search matched schemes": "योजनाएं खोजें",
  "Type scheme name...": "योजना का नाम टाइप करें...",
  "Knowledge Resources": "ज्ञान संसाधन",
  "Local Security Audit Trail": "स्थानीय सुरक्षा ऑडिट लॉग",
  "Guide me & Apply": "मार्गदर्शन और आवेदन",
  "Eligible public schemes": "पात्र सरकारी योजनाएं",
  "matched": "योजनाएं मिलीं",
  "low-income days": "कम आय वाले दिन",
  "total parsed credit": "कुल पार्स की गई आय",
  "Low-income threshold": "कम आय सीमा",
  "Export your secure worker profile": "अपना सुरक्षित प्रोफ़ाइल एक्सपोर्ट करें",
  "Generate a portable summary of your checked parameters. No raw bank records are saved or shared.": "अपनी पात्रता का सारांश जनरेट करें। कोई बैंक रिकॉर्ड सहेजा नहीं जाता है।",
  "Generate Profile": "प्रोफ़ाइल जनरेट करें",

  // Guidance Wizard
  "Required documents check": "आवश्यक दस्तावेजों की जांच",
  "Official Application Steps": "आधिकारिक आवेदन चरण",
  "Secure portal verification redirect": "सुरक्षित पोर्टल रीडायरेक्ट",
  "Finish": "समाप्त",
  "Next Step": "अगला चरण",
  "Previous Step": "पिछला चरण",
  "Check Documents": "दस्तावेज़ जांचें",
  "Steps & Timeline": "चरण और समय सीमा",
  "Safe Redirect": "सुरक्षित रीडायरेक्ट",
  "Application Stepper Guide": "आवेदन चरणबद्ध गाइड",
  "No documents are uploaded or stored.": "कोई दस्तावेज़ अपलोड या सहेजा नहीं जाता है।",
  "Close": "बंद करें",
  "Verified Portal Redirect": "सत्यापित पोर्टल रीडायरेक्ट",
  "Guide": "गाइड",
  "Docs": "दस्तावेज़",
  "Steps": "चरण",
  "Apply": "आवेदन करें",
  "Back": "वापस",
  "Step 1: Check Required Documents": "चरण 1: आवश्यक दस्तावेज़ जांचें",
  "Please check off that you have these documents ready before opening the application portal:": "आवेदन पोर्टल खोलने से पहले सुनिश्चित करें कि आपके पास ये दस्तावेज़ तैयार हैं:",
  "Kaam Card never saves or asks for copy uploads of these documents. Keep them with you locally.": "काम कार्ड इन दस्तावेज़ों की कॉपी कभी नहीं सहेजता और न ही अपलोड मांगता है। इन्हें अपने पास स्थानीय रूप से रखें।",
  "Step 2: Step-by-Step Instructions": "चरण 2: चरण-दर-चरण निर्देश",
  "Follow these steps on the official portal to complete your registration:": "अपना पंजीकरण पूरा करने के लिए आधिकारिक पोर्टल पर इन चरणों का पालन करें:",
  "Step 3: Access Official Portal": "चरण 3: आधिकारिक पोर्टल खोलें",
  "You are now ready to visit the official website of the": "अब आप आधिकारिक वेबसाइट पर जाने के लिए तैयार हैं:",
  "Verified Official Portal": "सत्यापित आधिकारिक पोर्टल",
  "Destination:": "गंतव्य:",
  "Open official portal": "आधिकारिक पोर्टल खोलें",
  "Always confirm the URL ends in .gov.in or .nic.in before submitting any personal information.": "कोई भी व्यक्तिगत जानकारी जमा करने से पहले हमेशा पुष्टि करें कि URL .gov.in या .nic.in पर समाप्त होता है।",
  
  // Scheme Names & Details
  "Atal Pension Yojana": "अटल पेंशन योजना",
  "Pension scheme for unorganized workers providing guaranteed minimum pension of Rs. 1,000 to Rs. 5,000 per month after age 60.": "असंगठित श्रमिकों के लिए पेंशन योजना जो 60 वर्ष की आयु के बाद प्रति माह 1,000 से 5,000 रुपये की न्यूनतम पेंशन प्रदान करती है।",
  "e-Shram Registration": "ई-श्रम पंजीकरण",
  "National database for unorganized workers to facilitate social security benefits and direct benefit transfers.": "असंगठित श्रमिकों के लिए सामाजिक सुरक्षा लाभ और प्रत्यक्ष लाभ हस्तांतरण की सुविधा प्रदान करने वाला राष्ट्रीय डेटाबेस।",
  "Pradhan Mantri Shram Yogi Maan-dhan": "प्रधानमंत्री श्रम योगी मान-धन",
  "Voluntary pension scheme for unorganized workers with monthly contribution matching by Central Government.": "असंगठित श्रमिकों के लिए स्वैच्छिक पेंशन योजना जिसमें केंद्र सरकार द्वारा मासिक योगदान का मिलान किया जाता है।",
  "Ayushman Bharat PM-JAY": "आयुष्मान भारत पीएम-जेएवाई",
  "Free health insurance coverage up to Rs. 5 Lakhs per family per year for secondary and tertiary care hospitalization.": "माध्यमिक और तृतीयक देखभाल अस्पताल में भर्ती के लिए प्रति वर्ष प्रति परिवार 5 लाख रुपये तक का मुफ्त स्वास्थ्य बीमा कवरेज।",
  "PM SVANidhi Scheme": "पीएम स्वनिधि योजना",
  "Special micro-credit facility for street vendors to access affordable working capital loans for business revival.": "व्यवसाय पुनरुद्धार के लिए किफायती कार्यशील पूंजी ऋण तक पहुंच बनाने के लिए स्ट्रीट वेंडरों के लिए विशेष सूक्ष्म-ऋण सुविधा।",

  // Fallback scheme names
  "PM Shram Yogi Maandhan": "पीएम श्रम योगी मानधन",
  "e-Shram": "ई-श्रम",
  "PM Jeevan Jyoti Bima Yojana": "पीएम जीवन ज्योति बीमा योजना",
  "PM Suraksha Bima Yojana": "पीएम सुरक्षा बीमा योजना",
  "Delhi Construction Workers Welfare Board": "दिल्ली निर्माण श्रमिक कल्याण बोर्ड",
  "Pension support after age 60": "60 वर्ष की आयु के बाद पेंशन सहायता",
  "National registration for unorganised workers": "असंगठित श्रमिकों के लिए राष्ट्रीय पंजीकरण",
  "Health cover for low-income families": "कम आय वाले परिवारों के लिए स्वास्थ्य कवर",
  "Life insurance cover": "जीवन बीमा कवर",
  "Accident insurance cover": "दुर्घटना बीमा कवर",
  "Welfare benefits for registered construction workers": "पंजीकृत निर्माण श्रमिकों के लिए कल्याण लाभ",

  // New state-specific schemes
  "Maharashtra Building & Other Construction Workers Welfare Board": "महाराष्ट्र भवन और अन्य निर्माण श्रमिक कल्याण बोर्ड",
  "Karnataka Unorganised Workers Social Security Board": "कर्नाटक असंगठित श्रमिक सामाजिक सुरक्षा बोर्ड",
  "Tamil Nadu Manual Workers Welfare Board": "तमिलनाडु शारीरिक श्रमिक कल्याण बोर्ड",
  "Uttar Pradesh Building & Other Construction Workers Welfare Board": "उत्तर प्रदेश भवन और अन्य निर्माण श्रमिक कल्याण बोर्ड",
  "West Bengal Unorganised Sector Workers Welfare Board": "पश्चिम बंगाल असंगठित क्षेत्र श्रमिक कल्याण बोर्ड",
  "Rajasthan Building & Other Construction Workers Welfare Board": "राजस्थान भवन और अन्य निर्माण श्रमिक कल्याण बोर्ड",
  "Gujarat Building & Other Construction Workers Welfare Board": "गुजरात भवन और अन्य निर्माण श्रमिक कल्याण बोर्ड",
  "Madhya Pradesh Building & Other Construction Workers Welfare Board": "मध्य प्रदेश भवन और अन्य निर्माण श्रमिक कल्याण बोर्ड",
  "Bihar Unorganised Workers Social Security Board": "बिहार असंगठित श्रमिक सामाजिक सुरक्षा बोर्ड",
  "Odisha Unorganised Workers Welfare Board": "ओडिशा असंगठित श्रमिक कल्याण बोर्ड",
  "PM SVANidhi": "पीएम स्वनिधि",
  "Atal Pension Yojana": "अटल पेंशन योजना",
  "PM MUDRA Yojana (Shishu)": "पीएम मुद्रा योजना (शिशु)",
  "Janani Suraksha Yojana": "जननी सुरक्षा योजना",
  "Pradhan Mantri Matru Vandana Yojana": "प्रधानमंत्री मातृ वंदना योजना",
  "Ayushman Bharat Health Account (ABHA)": "आयुष्मान भारत स्वास्थ्य खाता (एबीएचए)",
  "NPS Vatsalya": "एनपीएस वात्सल्य",
  "PM Kaushal Vikas Yojana (PMKVY)": "पीएम कौशल विकास योजना (पीएमकेवीवाई)",
  "Stand-Up India": "स्टैंड-अप इंडिया",
  "Ekta Mall (PM SVANidhi Extension)": "एकता मॉल (पीएम स्वनिधि विस्तार)",
  "Welfare benefits for registered construction workers": "पंजीकृत निर्माण श्रमिकों के लिए कल्याण लाभ",
  "Pension, accident insurance, maternity benefit, death benefit": "पेंशन, दुर्घटना बीमा, मातृत्व लाभ, मृत्यु लाभ",
  "Pension, accident cover, tool kit assistance, skill training": "पेंशन, दुर्घटना कवर, टूल किट सहायता, कौशल प्रशिक्षण",
  "Pension, accident insurance, marriage assistance, education grant": "पेंशन, दुर्घटना बीमा, विवाह सहायता, शिक्षा अनुदान",
  "Pension, health insurance, disability cover, death benefit": "पेंशन, स्वास्थ्य बीमा, विकलांगता कवर, मृत्यु लाभ",
  "Pension, accident insurance, health cover, scholarship": "पेंशन, दुर्घटना बीमा, स्वास्थ्य कवर, छात्रवृत्ति",
  "Collateral-free working capital loan up to ₹50,000 for street vendors": "स्ट्रीट वेंडरों के लिए ₹50,000 तक का संपार्श्विक-मुक्त कार्यशील पूंजी ऋण",
  "Guaranteed pension ₹1,000-5,000/month after age 60": "60 वर्ष की आयु के बाद ₹1,000-5,000/माह गारंटीकृत पेंशन",
  "Micro loan up to ₹50,000 for small business": "लघु व्यवसाय के लिए ₹50,000 तक का सूक्ष्म ऋण",
  "Cash assistance for institutional delivery": "संस्थागत प्रसव के लिए नकद सहायता",
  "₹5,000 cash incentive for first live birth": "पहले जीवित जन्म के लिए ₹5,000 नकद प्रोत्साहन",
  "Digital health ID for seamless healthcare access": "निर्बाध स्वास्थ्य सेवा पहुंच के लिए डिजिटल स्वास्थ्य आईडी",
  "Pension account for minors, converts to regular NPS at 18": "नाबालिगों के लिए पेंशन खाता, 18 वर्ष पर नियमित NPS में परिवर्तित",
  "Free skill training with certification and placement support": "प्रमाणन और प्लेसमेंट समर्थन के साथ मुफ्त कौशल प्रशिक्षण",
  "Bank loan ₹10 lakh - ₹1 crore for SC/ST/Women entrepreneurs": "SC/ST/महिला उद्यमियों के लिए ₹10 लाख - ₹1 करोड़ बैंक ऋण",
  "E-commerce platform for street vendors to sell online": "स्ट्रीट वेंडरों के लिए ऑनलाइन बिक्री हेतु ई-कॉमर्स प्लेटफॉर्म",

  // Loan product names
  "PM SVANidhi": "पीएम स्वनिधि",
  "MUDRA Loan (Shishu)": "मुद्रा ऋण (शिशु)",
  "Micro Enterprise Loan": "सूक्ष्म उद्यम ऋण",
  "Working capital loan up to ₹10,000 for street vendors, repayable in monthly installments.": "स्ट्रीट वेंडरों के लिए ₹10,000 तक का कार्यशील पूंजी ऋण, मासिक किश्तों में देय।",
  "Loans up to ₹50,000 for income-generating activities in non-corporate small business sector.": "गैर-कॉर्पोरेट लघु व्यवसाय क्षेत्र में आय-सृजन गतिविधियों के लिए ₹50,000 तक का ऋण।",
  "Small business loan for informal workers to expand livelihood activities.": "असंगठित श्रमिकों के लिए आजीविका गतिविधियों के विस्तार हेतु लघु व्यवसाय ऋण।",

  // Landing testimonials
  "Delivery Partner, Delhi": "डिलीवरी पार्टनर, दिल्ली",
  "Cab Driver, Mumbai": "कैब ड्राइवर, मुंबई",
  "Domestic Worker, Bangalore": "घरेलू कार्यकर्ता, बेंगलुरु",

  // Contact section
  "Need help checking eligibility?": "पात्रता जांचने में सहायता चाहिए?",
  "We are dedicated to supporting digital portability for India's gig economy. If you have questions about the pilot or scheme integration, get in touch.": "हम भारत की गिग अर्थव्यवस्था के लिए डिजिटल पोर्टेबिलिटी का समर्थन करने के लिए समर्पित हैं। पायलट या योजना एकीकरण के बारे में प्रश्न हैं तो संपर्क करें।",
  "Toll-free Helpdesk: 1800-11-0031 (Demo)": "टोल-फ्री हेल्पडेस्क: 1800-11-0031 (डेमो)",

  // Footer
  "Features": "सुविधाएँ",
  "Process": "प्रक्रिया",
  "Reviews": "समीक्षाएँ",
  "Contact": "संपर्क",
  "Empowering Indian gig workers with portable data identity.": "भारतीय गिग श्रमिकों को पोर्टेबल डेटा पहचान के साथ सशक्त बनाना।",
  "Product": "उत्पाद",
  "Testimonials": "प्रशंसापत्र",
  "Support": "सहायता",
  "Email": "ईमेल",
  "Legal": "कानूनी",
  "Privacy": "गोपनीयता",
  "Terms": "शर्तें",

  // Added missing translations
  "or": "या",
  "Select Language": "भाषा चुनें",
  "English": "अंग्रेज़ी",
  "Hindi": "हिंदी",
  "Tamil": "तमिल",
  "Telugu": "तेलुगु",
  "Marathi": "मराठी",
  "Country code": "देश कोड",
  "Back": "वापस",
  "OTP digits": "ओटीपी अंक",
  "OTP digit 1": "ओटीपी अंक 1",
  "OTP digit 2": "ओटीपी अंक 2",
  "OTP digit 3": "ओटीपी अंक 3",
  "OTP digit 4": "ओटीपी अंक 4",
  "OTP digit 5": "ओटीपी अंक 5",
  "OTP digit 6": "ओटीपी अंक 6",
  "Demo code:": "डेमो कोड:",
  "Parse status": "पार्स स्थिति",
  "Parsed income rows": "पार्स की गई आय पंक्तियाँ",
  "No usable income rows yet": "अभी तक कोई उपयोगी आय पंक्तियाँ नहीं",
  "Rows skipped safely": "पंक्तियाँ सुरक्षित रूप से छोड़ी गईं",
  "We skipped malformed rows instead of crashing.": "हमने क्रैश होने के बजाय खराब पंक्तियों को छोड़ दिया।",
  "Row": "पंक्ति",
  "Issue": "समस्या",
  "Add at least one valid credit/income row to continue.": "जारी रखने के लिए कम से कम एक वैध क्रेडिट/आय पंक्ति जोड़ें।",
  "Analyzed period:": "विश्लेषित अवधि:",
  "Eligible public schemes (": "पात्र सरकारी योजनाएं (",
  " matched)": " मिलान)",
  "No scheme matches found. Try adjusting search or details.": "कोई योजना मिलान नहीं मिला। खोज या विवरण समायोजित करने का प्रयास करें।",
  "Share Summary": "सारांश साझा करें",
  "Share summary text": "सारांश टेक्स्ट साझा करें",
  "Session code:": "सत्र कोड:",
  "Daily income bar chart": "दैनिक आय बार चार्ट",
  "Eligible": "पात्र",
  "Welfare Knowledge & Security Logs": "कल्याण ज्ञान और सुरक्षा लॉग",
  "No actions logged yet.": "अभी तक कोई कार्रवाई लॉग नहीं हुई।",
  "Shareable summary": "साझा करने योग्य सारांश",
  "This is a simple text summary for the demo. No raw transactions are included.": "यह डेमो के लिए एक सरल टेक्स्ट सारांश है। कोई कच्चा लेन-देन शामिल नहीं है।",
  "Copied": "कॉपी हो गया",
  "Copy": "कॉपी करें",
  "Danger Zone": "खतरे का क्षेत्र",
  "This will completely clear your parsed income profile and reset the session.": "यह आपकी पार्स की गई आय प्रोफ़ाइल को पूरी तरह से साफ़ कर देगा और सत्र को रीसेट कर देगा।",
  "Clear & Purge Session Data": "सत्र डेटा साफ़ करें और हटाएं",
  "Upload": "अपलोड",
  "More": "और",
  "Main navigation": "मुख्य नेविगेशन",
  "From phone to dashboard in under 2 minutes": "फ़ोन से डैशबोर्ड तक 2 मिनट से भी कम समय में",
  "Kaam Card navigation": "काम कार्ड नेविगेशन",
  "Language switched to": "भाषा बदली गई",
  "Are you sure you want to end your session and delete all parsed data? This cannot be undone.": "क्या आप वाकई अपना सत्र समाप्त करना और सभी पार्स किए गए डेटा को हटाना चाहते हैं? यह पूर्ववत नहीं किया जा सकता।",
  "Something went wrong": "कुछ गलत हो गया",
  "The app encountered an unexpected error. Please refresh the page to try again.": "एप्लिकेशन में एक अप्रत्याशित त्रुटि हुई। कृपया पुनः प्रयास करने के लिए पेज रिफ्रेश करें।",
  "Refresh Page": "पेज रिफ्रेश करें",
  "Kaam Card summary": "काम कार्ड सारांश",
  "Phone session:": "फ़ोन सत्र:",
  "Average daily income:": "औसत दैनिक आय:",
  "Good days:": "अच्छे दिन:",
  "bad days:": "बुरे दिन:",
  "Saving rule: save": "बचत नियम: बचत करें",
  "on days above": "उपरोक्त दिनों में",
  "Likely schemes:": "संभावित योजनाएं:",
  "No exact match yet": "अभी तक कोई सटीक मिलान नहीं",
  "Demo note: eligibility is simplified and should be verified on the official portal.": "डेमो नोट: पात्रता सरलीकृत है और आधिकारिक पोर्टल पर सत्यापित की जानी चाहिए।",
  "Income Profile": "आय प्रोफ़ाइल",
  "Daily Average": "दैनिक औसत",
  "Monthly Estimate": "मासिक अनुमान",
  "Low Days": "कम आय वाले दिन",
  "Savings Recommendation": "बचत अनुशंसा",
  "Matched Welfare Schemes": "मिलान कल्याण योजनाएं",
  "Generated by Kaam Card | Eligibility is simplified, verify on official portals": "काम कार्ड द्वारा तैयार | पात्रता सरलीकृत है, आधिकारिक पोर्टलों पर सत्यापित करें",
  "Income": "आय",
  "Using Kaam Card took less than 2 minutes. It computed my average daily income and showed me I qualified for PM-SYM pension. I registered the same day!": "काम कार्ड का उपयोग करने में 2 मिनट से भी कम समय लगा। इसने मेरी औसत दैनिक आय की गणना की और मुझे दिखाया कि मैं PM-SYM पेंशन के लिए पात्र हूं। मैंने उसी दिन पंजीकरण कर लिया!",
  "I always wanted to save but didn't know how much. The good-day surplus savings suggestion helped me set aside money on busy weekends to cover dry weekdays.": "मैं हमेशा बचत करना चाहता था लेकिन पता नहीं था कितना। अच्छे दिन के अधिशेष बचत सुझाव ने मुझे व्यस्त सप्ताहांतों पर पैसे अलग रखने में मदद की ताकि सूखे सप्ताह के दिनों को कवर किया जा सके।",
  "I was worried about sharing bank logs, but Kaam Card's privacy focus is amazing. It runs on my browser and doesn't store my Aadhaar or transaction lists.": "मुझे बैंक लॉग साझा करने की चिंता थी, लेकिन काम कार्ड का गोपनीयता फोकस अद्भुत है। यह मेरे ब्राउज़र पर चलता है और मेरा आधार या लेन-देन सूची संग्रहीत नहीं करता है।",
  "© 2026 Kaam Card.": "© 2026 काम कार्ड।",
  " of ": " का ",
  " to ": " से ",
  "/month": "/माह",
  "You qualify because your ": "आप पात्र हैं क्योंकि आपका ",
  " and ": " और ",
  "Close match: ": "नज़दीकी मिलान: ",
  "some details match": "कुछ विवरण मेल खाते हैं",
  ", but ": ", लेकिन ",
  "age ": "आयु ",
  " is within ": " के भीतर है ",
  "age must be ": "आयु होनी चाहिए ",
  "estimated monthly income is below ": "अनुमानित मासिक आय इससे कम है ",
  "no income cap holds": "कोई आय सीमा नहीं",
  "income is above ": "आय इससे अधिक है ",
  " is covered": " शामिल है",
  "occupation must match: ": "पेशा मेल खाना चाहिए: ",
  " state matches": " राज्य मेल खाता है",
  "state must be ": "राज्य होना चाहिए ",
  " or ": " या ",
  "Worker ": "कार्यकर्ता ",
  "Save ": "बचत करें ",
  " on good days (above ": " अच्छे दिनों में (ऊपर ",
  ")": ")",
  " | +91 ": " | +91 ",
  "-": "-",
  "CSV needs a header and at least one data row.": "CSV में एक हेडर और कम से कम एक डेटा पंक्ति होनी चाहिए।",
  "Missing column: ": "गुम कॉलम: ",
  "Date is invalid. Use YYYY-MM-DD or DD-MM-YYYY.": "तारीख अमान्य है। YYYY-MM-DD या DD-MM-YYYY का उपयोग करें।",
  "Amount is invalid. Use a positive number.": "राशि अमान्य है। एक सकारात्मक संख्या का उपयोग करें।",
  "Direction must be credit/income or debit/expense.": "दिशा क्रेडिट/आय या डेबिट/व्यय होनी चाहिए।",
  "Please upload a CSV file.": "कृपया CSV फ़ाइल अपलोड करें।",
  "Detected format:": "पहचाना गया प्रारूप:",
  "Expense Summary": "व्यय सारांश",
  "Spending breakdown from your statement": "आपके स्टेटमेंट से खर्च का विवरण",
  "Total Expenses": "कुल व्यय",
  "Avg daily": "औसत दैनिक",
  "Top Category": "शीर्ष श्रेणी",
  "Income Insights": "आय अंतर्दृष्टि",
  "Income Stability": "आय स्थिरता",
  "Stability score based on income variance": "आय भिन्नता पर आधारित स्थिरता स्कोर",
  "Daily Income": "दैनिक आय",
  "Weekly Breakdown": "साप्ताहिक विवरण",
  "Income trend week by week": "सप्ताह दर सप्ताह आय का रुझान",
  "Income vs Expenses": "आय बनाम व्यय",
  "How your earnings compare to spending": "आपकी कमाई और खर्च की तुलना",
  "Expense Ratio": "व्यय अनुपात",
  "Savings Projection": "बचत अनुमान",
  "Project your savings forward": "अपनी बचत का अनुमान लगाएं",
  "Monthly": "मासिक",
  "3 Months": "३ महीने",
  "6 Months": "६ महीने",
  "This will cover up to": "यह कवर करेगा",
  "low-income days per month.": "कम आय वाले दिन प्रति माह।",
  "Range": "सीमा",
  "above": "ऊपर",
  "below": "नीचे",
  "No Income": "कोई आय नहीं",
  "File is larger than 5 MB.": "फ़ाइल 5 MB से बड़ी है।",
  "Log Out": "लॉग आउट",
  "Generated by Kaam Card | Eligibility is simplified, verify on official portals": "काम कार्ड द्वारा तैयार | पात्रता सरलीकृत है, आधिकारिक पोर्टलों पर सत्यापित करें",
  "Kaam Card - ": "काम कार्ड - ",
  "worker": "कार्यकर्ता",
  "friend": "मित्र",
  "Uploaded files": "अपलोड की गई फ़ाइलें",
  "Upload a CSV or bank statement PDF. Links inside files are treated as plain text.": "CSV या बैंक स्टेटमेंट PDF अपलोड करें। फ़ाइलों के अंदर के लिंक सादे टेक्स्ट माने जाते हैं।",
  "Tap to upload CSV or PDF": "CSV या PDF अपलोड करने के लिए टैप करें",
  "or drag and drop. CSV or PDF, up to 5 MB.": "या ड्रैग और ड्रॉप करें। CSV या PDF, अधिकतम 5 MB।",
  "Manual income entry": "मैन्युअल आय प्रविष्टि",
  "Date": "तारीख",
  "Amount": "राशि",
  "Source": "स्रोत",
  "Platform credit": "प्लेटफ़ॉर्म क्रेडिट",
  "Bank transfer": "बैंक ट्रांसफर",
  "Add entry": "प्रविष्टि जोड़ें",
  "Remove entry": "प्रविष्टि हटाएं",
  "Cash": "नकद",
  "rows": "पंक्तियाँ",
  "Budget": "बजट",
  "documents ready": "दस्तावेज़ तैयार",
  "Loan Eligibility": "ऋण पात्रता",
  "loan options available": "ऋण विकल्प उपलब्ध",
  "No loans match your profile": "आपकी प्रोफ़ाइल से कोई ऋण मेल नहीं खाता",
  "Try adjusting your details or uploading more income data to improve eligibility.": "पात्रता सुधारने के लिए अपनी जानकारी या अधिक आय डेटा अपलोड करने का प्रयास करें।",
  "Up to": "अधिकतम",
  "Tax Estimation": "कर अनुमान",
  "Estimated annual tax liability": "अनुमानित वार्षिक कर देयता",
  "Annual income": "वार्षिक आय",
  "Estimated tax": "अनुमानित कर",
  "Net income after tax": "कर के बाद शुद्ध आय",
  "Effective tax rate": "प्रभावी कर दर",
  "This is a simplified estimate. Consult a CA for accurate tax planning.": "यह एक सरल अनुमान है। सटीक योजना के लिए CA से सलाह लें।",
  "Claim": "दावा",
  "Claim Documents": "दावा दस्तावेज़",
  "Step 3: Claim Documents": "चरण 3: दावा दस्तावेज़",
  "Step 4: File a Claim": "चरण 4: दावा दायर करें",
  "Prepare these documents if you need to file a claim:": "दावा दायर करने के लिए ये दस्तावेज़ तैयार रखें:",
  "Follow these steps to file a claim on the official portal:": "आधिकारिक पोर्टल पर दावा दायर करने के लिए इन चरणों का पालन करें:",
  "Policy document / enrollment number": "पॉलिसी दस्तावेज़ / नामांकन संख्या",
  "Claim form (download from portal)": "दावा फॉर्म (पोर्टल से डाउनलोड करें)",
  "Supporting documents (hospital bills / death certificate)": "सहायक दस्तावेज़ (अस्पताल बिल / मृत्यु प्रमाण पत्र)",
  "Download the claim form from the official portal.": "आधिकारिक पोर्टल से दावा फॉर्म डाउनलोड करें।",
  "Fill in the policyholder details and policy number.": "पॉलिसीधारक विवरण और पॉलिसी नंबर भरें।",
  "Attach all required supporting documents.": "सभी आवश्यक सहायक दस्तावेज़ संलग्न करें।",
  "Submit the form at the nearest branch or online portal.": "निकटतम शाखा या ऑनलाइन पोर्टल पर फॉर्म जमा करें।",
  "Track claim status using the acknowledgment number.": "पावती संख्या का उपयोग करके दावा स्थिति ट्रैक करें।",
  "Skip": "छोड़ें",
  "Next": "अगला",
  "Welcome to Kaam Card": "काम कार्ड में आपका स्वागत है",
  "This is your dashboard. Here you'll see your income analysis, savings recommendations, and welfare scheme matches.": "यह आपका डैशबोर्ड है। यहां आप अपनी आय विश्लेषण, बचत सुझाव और कल्याण योजना मिलान देखेंगे।",
  "Your daily earnings chart shows good days and bad days, helping you understand your income patterns.": "आपका दैनिक कमाई चार्ट अच्छे और बुरे दिन दिखाता है, जिससे आप अपनी आय पैटर्न समझ सकते हैं।",
  "Use the smart savings suggestion and check which government schemes you qualify for.": "स्मार्ट बचत सुझाव का उपयोग करें और जांचें कि आप किन सरकारी योजनाओं के लिए पात्र हैं।",
  "Tap Upload to add more statements or manual entries anytime.": "कभी भी अधिक स्टेटमेंट या मैन्युअल प्रविष्टियां जोड़ने के लिए अपलोड पर टैप करें।",
  "Remove": "हटाएं",
  "Please upload a CSV or PDF file.": "कृपया CSV या PDF फ़ाइल अपलोड करें।",
  "Bank PDF": "बैंक PDF",
  "Ration card": "राशन कार्ड",
  "Voter ID": "वोटर आईडी",
  "Driving license": "ड्राइविंग लाइसेंस",
  "Income certificate": "आय प्रमाण पत्र",
  "Minimum age": "न्यूनतम आयु",
  "Maximum age": "अधिकतम आयु",
  "Minimum monthly income": "न्यूनतम मासिक आय",
  "Income must be below": "आय इससे कम होनी चाहिए",
  "Occupation must be": "पेशा होना चाहिए",
  "State must be": "राज्य होना चाहिए",
  "Monthly income": "मासिक आय",
  "Income stability": "आय स्थिरता",
  "Eligible": "पात्र",
  "Listen": "सुनें",
  "UPI": "UPI",
  "Manual": "मैन्युअल",
  "Generic CSV": "सामान्य CSV",
  "Google Pay": "Google Pay",
  "PhonePe": "PhonePe",
  "PayTM": "PayTM",
  "High": "उच्च",
  "Medium": "मध्यम",
  "Low": "निम्न",
  "PAN Card": "पैन कार्ड",
  "Bank account passbook": "बैंक खाता पासबुक",
  "Savings bank account passbook": "बैंक बचत खाता पासबुक",
  "Bank account details": "बैंक खाता विवरण",
  "Mobile number linked with Aadhaar": "आधार से लिंक मोबाइल नंबर",
  "Show QR Code": "QR कोड दिखाएं",
  "Worker Card QR Code": "वर्कर कार्ड QR कोड",
  "Scan to share your Kaam Card profile": "अपना काम कार्ड प्रोफ़ाइल साझा करने के लिए स्कैन करें",
  "Expires in 24 hours": "24 घंटे में समाप्त होता है",
  "Download QR": "QR डाउनलोड करें",
  "Export Card (HTML)": "कार्ड निर्यात करें (HTML)",
  "Save as PDF": "PDF के रूप में सहेजें",
  "Share via App": "ऐप के माध्यम से साझा करें",
  "Kaam Card Summary": "काम कार्ड सारांश",
  "Open the official verified portal.": "आधिकारिक सत्यापित पोर्टल खोलें।",
  "Verify using Aadhaar-linked OTP.": "आधार-लिंक्ड OTP से सत्यापित करें।",
  "Submit your occupation details and get registered.": "अपना व्यवसाय विवरण जमा करें और पंजीकृत करें।",
  "Upload a statement to see spending breakdown": "खर्च विवरण देखने के लिए स्टेटमेंट अपलोड करें",
  "Upload a bank statement to get automatic expense categorization and budgeting insights.": "स्वचालित व्यय वर्गीकरण और बजट जानकारी प्राप्त करने के लिए बैंक स्टेटमेंट अपलोड करें।",

  "Application Deadlines": "आवेदन की अंतिम तिथियाँ",
  "Upcoming scheme application deadlines": "आगामी योजना आवेदन की अंतिम तिथियाँ",
  "No upcoming deadlines right now": "अभी कोई आगामी अंतिम तिथि नहीं",
  "Check back later for scheme application deadlines.": "योजना आवेदन की अंतिम तिथियों के लिए बाद में जाँच करें।",
  "Deadlines are indicative. Verify on official portals.": "अंतिम तिथियाँ संकेतात्मक हैं। आधिकारिक पोर्टल पर सत्यापित करें।",
  "days left": "दिन शेष",
  "Smart Tips": "स्मार्ट टिप्स",
  "Personalized financial guidance": "वैयक्तिकृत वित्तीय मार्गदर्शन",
  "Track your saving targets": "अपने बचत लक्ष्यों पर नज़र रखें",
  "Set a saving target": "बचत लक्ष्य निर्धारित करें",
  "Add Goal": "लक्ष्य जोड़ें",
  "Create First Goal": "पहला लक्ष्य बनाएं",
  "Knowledge & Logs": "ज्ञान और लॉग",
  "Create a goal to save for emergencies, festivals, or big purchases.": "आपातकालीन, त्योहारों या बड़ी खरीदारी के लिए बचत का लक्ष्य बनाएं।",
  "Government of India": "भारत सरकार",
  "Welfare benefits, pension, accident cover for construction workers": "निर्माण श्रमिकों के लिए कल्याण लाभ, पेंशन, दुर्घटना कवर",
  "Pension, health insurance, accident cover for unorganised workers": "असंगठित श्रमिकों के लिए पेंशन, स्वास्थ्य बीमा, दुर्घटना कवर",
  "Pension, family pension, education assistance, accident relief": "पेंशन, पारिवारिक पेंशन, शिक्षा सहायता, दुर्घटना राहत",
  "Pension, health scheme, death benefit, education grant": "पेंशन, स्वास्थ्य योजना, मृत्यु लाभ, शिक्षा अनुदान",
  "Pension, accident insurance, maternity benefit, scholarship": "पेंशन, दुर्घटना बीमा, मातृत्व लाभ, छात्रवृत्ति",
  "Check which government schemes you qualify for based on your profile and income.": "जांचें कि आपकी प्रोफ़ाइल और आय के आधार पर आप किन सरकारी योजनाओं के लिए पात्र हैं।",
  "Keep track of upcoming scheme deadlines so you never miss an application window.": "आगामी योजना की अंतिम तिथियों पर नज़र रखें ताकि आप कभी भी आवेदन विंडो न चूकें।",
  "Set personal saving targets for emergencies, festivals, or big purchases.": "आपातकाल, त्योहारों या बड़ी खरीदारी के लिए व्यक्तिगत बचत लक्ष्य निर्धारित करें।",
  "The savings card shows how much to save on good days to cover low-income days automatically.": "बचत कार्ड दिखाता है कि कम आय वाले दिनों को स्वचालित रूप से कवर करने के लिए अच्छे दिनों में कितनी बचत करनी है।",
  "Track your spending by category and set budgets to stay in control.": "श्रेणी के अनुसार अपने खर्च पर नज़र रखें और नियंत्रण में रहने के लिए बजट निर्धारित करें।",
  "Generate a portable summary of your verified profile to share with employers or schemes.": "नियोक्ताओं या योजनाओं के साथ साझा करने के लिए अपने सत्यापित प्रोफ़ाइल का एक पोर्टेबल सारांश तैयार करें।",
  "Your daily earnings chart shows good days and bad days, helping you understand your income patterns.": "आपका दैनिक आय चार्ट अच्छे और बुरे दिनों को दिखाता है, जिससे आपको अपने आय पैटर्न को समझने में मदद मिलती है।",
  "Schemes": "योजनाएं",
  "Messy CSV": "गड़बड़ CSV",
  // 2026-08-04: Missing keys (translated)
  "Analyzed period": "विश्लेषित अवधि",
  "Category Dominance": "श्रेणी प्रभुत्व",
  "Close menu": "मेनू बंद करें",
  "Create a goal (e.g., \"Emergency Fund ₹10,000\") to stay motivated. The app will calculate your daily target.": "प्रेरित रहने के लिए एक लक्ष्य बनाएं (उदाहरण के लिए, \"आपातकालीन निधि ₹10,000\")। ऐप आपके दैनिक लक्ष्य की गणना करेगा।",
  "Daily earnings trend": "दैनिक कमाई का रुझान",
  "Documents": "दस्तावेज़",
  "Download PDF / Print": "पीडीएफ डाउनलोड करें/प्रिंट करें",
  "Goal name (e.g., Emergency Fund, Festival, Vehicle):": "लक्ष्य का नाम (जैसे, आपातकालीन निधि, त्यौहार, वाहन):",
  "Good Day Advantage": "अच्छे दिन का लाभ",
  "High Expense Ratio": "उच्च व्यय अनुपात",
  "High Income Volatility": "उच्च आय अस्थिरता",
  "In 3 months": "3 महीने में",
  "In 6 months": "6 महीने में",
  "Look for cheaper alternatives or set a budget.": "सस्ते विकल्प खोजें या बजट निर्धारित करें।",
  "Low Monthly Savings": "कम मासिक बचत",
  "Low-income threshold:": "निम्न-आय सीमा:",
  "Moderate Expense Ratio": "मध्यम व्यय अनुपात",
  "Monthly saving": "मासिक बचत",
  "No Budgets Set": "कोई बजट सेट नहीं",
  "OTP sent via SMS": "एसएमएस के जरिए भेजा गया ओटीपी",
  "OTP sent via SMS. Check your phone for the 6-digit code.": "एसएमएस के जरिए भेजा गया ओटीपी. 6-अंकीय कोड के लिए अपने फ़ोन की जाँच करें।",
  "Open menu": "मेनू खोलें",
  "Other": "अन्य",
  "Over 40% of expenses go to": "40% से ज्यादा खर्च हो जाता है",
  "Projected monthly savings under ₹500. Even ₹50/day on good days builds emergency fund.": "₹500 से कम मासिक बचत का अनुमान। अच्छे दिनों में प्रतिदिन ₹50 भी आपातकालीन निधि बनाता है।",
  "QR Code": "QR कोड",
  "Savings Goals": "बचत लक्ष्य",
  "Set a Savings Goal": "बचत लक्ष्य निर्धारित करें",
  "Set monthly budgets per category to track spending. Start with your top 3 categories.": "खर्च पर नज़र रखने के लिए प्रति श्रेणी मासिक बजट निर्धारित करें। अपनी शीर्ष 3 श्रेणियों से प्रारंभ करें।",
  "Smart Savings": "स्मार्ट बचत",
  "Spending 70-90% of income leaves little buffer. Try the 50/30/20 rule: needs/wants/savings.": "आय का 70-90% खर्च करने से थोड़ा बफर बचता है। 50/30/20 नियम आज़माएँ: आवश्यकताएँ/इच्छाएँ/बचत।",
  "Tap anywhere to skip": "छोड़ने के लिए कहीं भी टैप करें",
  "Target amount (₹):": "लक्ष्य राशि (₹):",
  "Target date (YYYY-MM-DD, optional):": "लक्ष्य तिथि (YYYY-MM-DD, वैकल्पिक):",
  "Total Income": "कुल आय",
  "Use your browser's Print to PDF option to save": "सहेजने के लिए अपने ब्राउज़र के प्रिंट टू पीडीएफ विकल्प का उपयोग करें",
  "Worker:": "कार्यकर्ता:",
  "You have more good days than bad. Save aggressively on good days to cover bad ones automatically.": "आपके पास बुरे दिनों की तुलना में अधिक अच्छे दिन हैं। बुरे दिनों को स्वचालित रूप से कवर करने के लिए अच्छे दिनों पर आक्रामक रूप से बचत करें।",
  "You're spending over 90% of your income. Review top categories for savings.": "आप अपनी आय का 90% से अधिक खर्च कर रहे हैं। बचत के लिए शीर्ष श्रेणियों की समीक्षा करें।",
  "Your daily income varies by more than 50%. Consider building a 2-month expense buffer.": "आपकी दैनिक आय 50% से अधिक भिन्न होती है। 2 महीने का व्यय बफर बनाने पर विचार करें।",
  "on good days": "अच्छे दिनों पर",
  "per month": "प्रति माह",
  "to": "से",
};

const TRANSLATIONS_TA = {
  "Kaam Card": "காம் கார்டு",
  "Dashboard": "டாஷ்போர்டு",
  "Connect Data": "தரவை இணைக்கவும்",
  "Income Analytics": "வருமான பகுப்பாய்வு",
  "Welfare Schemes": "நலத்திட்டங்கள்",
  "General": "பொது",
  "Insights": "நுண்ணறிவுகள்",
  "Secure & Private": "பாதுகாப்பான & தனிப்பட்ட",
  "Parsed locally. Zero network leaks.": "உள்ளூரில் பாகுபடுத்தப்பட்டது. நெட் ஒர்க் கசிவு இல்லை.",
  "Purge Session Data": "அமர்வு தரவை அழிக்கவும்",
  "Purge Session": "அமர்வை அழிக்கவும்",
  "Export Card": "கார்டை ஏற்றுமதி செய்க",
  "Light Mode": "லைட் பயன்முறை",
  "Dark Mode": "டார்க் பயன்முறை",
  "For you": "உங்களுக்காக",
  "SECURE SANDBOX": "பாதுகாப்பான சாண்ட்பாக்ஸ்",
  "LOG IN / START": "உள்நுழைக / தொடங்கு",
  "Create Your Kaam Card": "உங்கள் காம் கார்டை உருவாக்கவும்",
  "How it Works": "இது எவ்வாறு இயங்குகிறது",
  "100% Private: No Aadhaar or PAN stored": "100% தனிப்பட்டது: ஆதார் அல்லது பான் எதுவும் சேமிக்கப்படவில்லை",
  "Safe: In-memory processing": "பாதுகாப்பானது: நினைவகத்தில் செயலாக்கம்",
  "Go from Platform Earnings to Welfare Benefits in 2 Minutes.": "பிளாட்ஃபார்ம் வருமானத்திலிருந்து 2 நிமிடங்களில் நலப் பலன்களுக்குச் செல்லுங்கள்.",
  "Kaam Card is a portable, secure record for informal and gig workers.": "காம் கார்டு என்பது முறைசாரா மற்றும் கிக் தொழிலாளர்களுக்கான கையடக்க, பாதுகாப்பான பதிவாகும்.",
  "Aadhaar Card": "ஆதார் அட்டை",
  "What We Do": "நாங்கள் என்ன செய்கிறோம்",
  "Designed for India's Informal Workforce": "இந்தியாவின் முறைசாரா தொழிலாளர்களுக்காக வடிவமைக்கப்பட்டது",
  "2 min": "2 நிமிடம்",
  "Average setup time": "சராசரி அமைவு நேரம்",
  "Zero": "பூஜ்யம்",
  "Data stored on servers": "சேவையகங்களில் தரவு சேமிக்கப்படுகிறது",
  "Go from daily wages to safe public welfare benefits": "தினசரி ஊதியத்திலிருந்து பாதுகாப்பான பொது நலப் பலன்களுக்குச் செல்லுங்கள்",
  "Verify your eligibility instantly and register on official portals without middleman risk.": "உங்கள் தகுதியை உடனடியாகச் சரிபார்த்து, இடைத்தரகர் ஆபத்து இல்லாமல் அதிகாரப்பூர்வ இணையதளங்களில் பதிவு செய்யுங்கள்.",
  "Verify eligibility & register": "தகுதியை சரிபார்த்து பதிவு செய்யவும்",
  "Punchlist's Quality": "பஞ்ச்லிஸ்ட்டின் தரம்",
  "Go from design to build without losing crucial details.": "முக்கியமான விவரங்களை இழக்காமல் வடிவமைப்பிலிருந்து உருவாக்கத்திற்குச் செல்லவும்.",
  "Security Audit": "பாதுகாப்பு தணிக்கை",
  "No data is shared or stored without explicit consent.": "வெளிப்படையான அனுமதியின்றி எந்தத் தரவும் பகிரப்படுவதில்லை அல்லது சேமிக்கப்படுவதில்லை.",
  "Why Kaam Card?": "காம் கார்டு எதற்கு?",
  "We help gig workers accumulate data value that is normally locked away in siloed apps.": "சில்ட் பயன்பாடுகளில் பொதுவாகப் பூட்டப்பட்டிருக்கும் தரவு மதிப்பைக் குவிக்க, கிக் பணியாளர்களுக்கு நாங்கள் உதவுகிறோம்.",
  "Understand your earnings variance, good days vs bad days, and average monthly income instantly.": "உங்கள் வருவாய் மாறுபாடு, நல்ல நாட்கள் மற்றும் மோசமான நாட்கள் மற்றும் சராசரி மாத வருமானம் ஆகியவற்றை உடனடியாகப் புரிந்து கொள்ளுங்கள்.",
  "Scheme Matching": "திட்ட பொருத்தம்",
  "Automatically match your computed income against real criteria for e-Shram, PM-SYM, PM-JAY, and more.": "e-Shram, PM-SYM, PM-JAY மற்றும் பலவற்றிற்கான உண்மையான அளவுகோல்களுடன் உங்கள் கணக்கிடப்பட்ட வருமானத்தை தானாகவே பொருத்தவும்.",
  "Smart Micro-Savings": "ஸ்மார்ட் மைக்ரோ சேமிப்பு",
  "Get a mathematically grounded savings rule based on your actual income surplus on high-earning days.": "அதிக வருவாய் ஈட்டும் நாட்களில் உங்களின் உண்மையான வருமான உபரியின் அடிப்படையில் கணித அடிப்படையிலான சேமிப்பு விதியைப் பெறுங்கள்.",
  "Three Simple Steps": "மூன்று எளிய படிகள்",
  "Secure OTP Login": "பாதுகாப்பான OTP உள்நுழைவு",
  "Enter your phone number to start a secure, isolated sandbox session. No passwords required.": "பாதுகாப்பான, தனிமைப்படுத்தப்பட்ட சாண்ட்பாக்ஸ் அமர்வைத் தொடங்க, உங்கள் ஃபோன் எண்ணை உள்ளிடவும். கடவுச்சொற்கள் தேவையில்லை.",
  "Upload Statements": "அறிக்கைகளைப் பதிவேற்றவும்",
  "Drop a bank statement or UPI statement CSV. We parse it locally in your browser and discard raw transaction details.": "பேங்க் ஸ்டேட்மெண்ட் அல்லது UPI ஸ்டேட்மெண்ட் CSVஐ போடவும். நாங்கள் அதை உங்கள் உலாவியில் உள்நாட்டில் அலசுவோம் மற்றும் மூல பரிவர்த்தனை விவரங்களை நிராகரிக்கிறோம்.",
  "Get Kaam Dashboard": "காம் டாஷ்போர்டைப் பெறுங்கள்",
  "Instantly check eligible schemes, review savings recommendations, and export your portable worker card.": "தகுதியான திட்டங்களை உடனடியாகச் சரிபார்த்து, சேமிப்புப் பரிந்துரைகளை மதிப்பாய்வு செய்து, உங்கள் போர்ட்டபிள் தொழிலாளர் அட்டையை ஏற்றுமதி செய்யுங்கள்.",
  "Loved by Workers": "தொழிலாளர்களால் விரும்பப்படுகிறது",
  "Hear from informal partners who verified their scheme eligibility using Kaam Card.": "காம் கார்டைப் பயன்படுத்தி தங்கள் திட்டத் தகுதியைச் சரிபார்த்த முறைசாரா கூட்டாளர்களிடமிருந்து கேளுங்கள்.",
  "Log In & Access Portal": "உள்நுழைந்து & அணுகல் போர்டல்",
  "Start with your mobile number. This demo keeps the session in memory only.": "உங்கள் மொபைல் எண்ணுடன் தொடங்கவும். இந்த டெமோ அமர்வை நினைவகத்தில் மட்டுமே வைத்திருக்கும்.",
  "Mobile number": "மொபைல் எண்",
  "Enter mobile number": "மொபைல் எண்ணை உள்ளிடவும்",
  "Enter 10 digit number to receive a secure OTP verification check.": "பாதுகாப்பான OTP சரிபார்ப்பைப் பெற, 10 இலக்க எண்ணை உள்ளிடவும்.",
  "Send secure OTP link": "பாதுகாப்பான OTP இணைப்பை அனுப்பவும்",
  "Continue with sample data": "மாதிரி தரவுகளுடன் தொடரவும்",
  "OTP Verification": "OTP சரிபார்ப்பு",
  "OTP sent via server": "OTP சர்வர் வழியாக அனுப்பப்பட்டது",
  "We sent an OTP to": "க்கு OTP அனுப்பினோம்",
  "Any 4 digits will work in this prototype.": "இந்த முன்மாதிரியில் ஏதேனும் 4 இலக்கங்கள் வேலை செய்யும்.",
  "Verify code": "குறியீட்டைச் சரிபார்க்கவும்",
  "Verify and continue": "சரிபார்த்து தொடரவும்",
  "Switch to light theme": "ஒளி தீமுக்கு மாறவும்",
  "Switch to dark theme": "இருண்ட தீமுக்கு மாறவும்",
  "Consent & Authorization": "ஒப்புதல் & அங்கீகாரம்",
  "Kaam Card parses statement details locally to build your portable record. By continuing, you agree to:": "உங்கள் கையடக்க பதிவை உருவாக்க காம் கார்டு அறிக்கை விவரங்களை உள்நாட்டில் அலசுகிறது. தொடர்வதன் மூலம், நீங்கள் ஒப்புக்கொள்கிறீர்கள்:",
  "Local Parsing:": "உள்ளூர் பாகுபடுத்துதல்:",
  "Executed strictly in-browser memory.": "உலாவி நினைவகத்தில் கண்டிப்பாக செயல்படுத்தப்பட்டது.",
  "Data Minimization:": "தரவுக் குறைப்பு:",
  "Raw lines are discarded after daily stats computation.": "தினசரி புள்ளிவிவரக் கணக்கீட்டிற்குப் பிறகு மூலக் கோடுகள் நிராகரிக்கப்படுகின்றன.",
  "Zero ID Collection:": "ஜீரோ ஐடி சேகரிப்பு:",
  "We never collect Aadhaar, PAN, or full bank numbers.": "நாங்கள் ஒருபோதும் ஆதார், பான் அல்லது முழு வங்கி எண்களை சேகரிப்பதில்லை.",
  "I authorize Kaam Card to parse my transaction statement.": "எனது பரிவர்த்தனை அறிக்கையை அலசுவதற்கு காம் கார்டை அங்கீகரிக்கிறேன்.",
  "Your data stays in this browser session. We do not ask for Aadhaar, PAN, or bank account numbers.": "இந்த உலாவி அமர்வில் உங்கள் தரவு இருக்கும். நாங்கள் ஆதார், பான் எண் அல்லது வங்கி கணக்கு எண்களைக் கேட்பதில்லை.",
  "Use a CSV with date, amount, direction. Links inside files are treated as plain text.": "தேதி, தொகை, திசையுடன் கூடிய CSVஐப் பயன்படுத்தவும். கோப்புகளுக்குள் உள்ள இணைப்புகள் எளிய உரையாகக் கருதப்படுகின்றன.",
  "Tap to upload CSV": "CSV ஐப் பதிவேற்ற தட்டவும்",
  "or drag and drop. CSV only, up to 5 MB.": "அல்லது இழுத்து விடுங்கள். CSV மட்டும், 5 MB வரை.",
  "Basic details for matching": "பொருத்தத்திற்கான அடிப்படை விவரங்கள்",
  "Age": "வயது",
  "Occupation": "தொழில்",
  "State": "மாநிலம்",
  "Sample datasets": "மாதிரி தரவுத்தொகுப்புகள்",
  "Choose Bank Statement Dataset": "வங்கி அறிக்கை தரவுத்தொகுப்பைத் தேர்ந்தெடுக்கவும்",
  "Continue to dashboard": "டாஷ்போர்டில் தொடரவும்",
  "Welcome, Worker": "வரவேற்கிறோம், தொழிலாளி",
  "This dashboard tracks your calculated income averages and verifies matching state schemes.": "இந்த டாஷ்போர்டு உங்களின் கணக்கிடப்பட்ட வருமான சராசரிகளைக் கண்காணித்து, பொருந்தக்கூடிய மாநிலத் திட்டங்களைச் சரிபார்க்கிறது.",
  "Daily earnings trend and variations": "தினசரி வருவாய் போக்கு மற்றும் மாறுபாடுகள்",
  "Daily Avg": "தினசரி சராசரி",
  "Good Days": "நல்ல நாட்கள்",
  "Bad Days": "மோசமான நாட்கள்",
  "Smart Suggestion": "ஸ்மார்ட் பரிந்துரை",
  "Arithmetic-based micro-savings rule": "எண்கணித அடிப்படையிலான மைக்ரோ சேமிப்பு விதி",
  "Tied to your actual data, this habit will accumulate about": "உங்கள் உண்மையான தரவுகளுடன் பிணைக்கப்பட்டுள்ளது, இந்த பழக்கம் சுமார் குவிந்துவிடும்",
  "low-income days.": "குறைந்த வருமானம் கொண்ட நாட்கள்.",
  "on days earning above": "மேலே சம்பாதிக்கும் நாட்களில்",
  "Save Rs": "ரூ. சேமிக்கவும்",
  "and cover up to": "மற்றும் வரை மறைக்க",
  "Welfare Matching": "நலப் பொருத்தம்",
  "Search matched schemes": "பொருந்திய திட்டங்களைத் தேடுங்கள்",
  "Type scheme name...": "திட்டத்தின் பெயர் வகை...",
  "Knowledge Resources": "அறிவு வளங்கள்",
  "Local Security Audit Trail": "உள்ளூர் பாதுகாப்பு தணிக்கை பாதை",
  "Guide me & Apply": "எனக்கு வழிகாட்டி விண்ணப்பிக்கவும்",
  "Eligible public schemes": "தகுதியான பொது திட்டங்கள்",
  "matched": "பொருந்தியது",
  "low-income days": "குறைந்த வருமானம் கொண்ட நாட்கள்",
  "total parsed credit": "மொத்த பாகுபடுத்தப்பட்ட கடன்",
  "Low-income threshold": "குறைந்த வருமான வரம்பு",
  "Export your secure worker profile": "உங்கள் பாதுகாப்பான பணியாளர் சுயவிவரத்தை ஏற்றுமதி செய்யவும்",
  "Generate a portable summary of your checked parameters. No raw bank records are saved or shared.": "உங்கள் சரிபார்க்கப்பட்ட அளவுருக்களின் சிறிய சுருக்கத்தை உருவாக்கவும். மூல வங்கி பதிவுகள் எதுவும் சேமிக்கப்படவில்லை அல்லது பகிரப்படவில்லை.",
  "Generate Profile": "சுயவிவரத்தை உருவாக்கவும்",
  "Required documents check": "தேவையான ஆவணங்களை சரிபார்க்கவும்",
  "Official Application Steps": "அதிகாரப்பூர்வ விண்ணப்ப படிகள்",
  "Secure portal verification redirect": "பாதுகாப்பான போர்டல் சரிபார்ப்பு திசைதிருப்பல்",
  "Finish": "முடிந்தது",
  "Next Step": "அடுத்த படி",
  "Previous Step": "முந்தைய படி",
  "Check Documents": "ஆவணங்களைச் சரிபார்க்கவும்",
  "Steps & Timeline": "படிகள் & காலவரிசை",
  "Safe Redirect": "பாதுகாப்பான வழிமாற்று",
  "Application Stepper Guide": "விண்ணப்ப படிமுறை வழிகாட்டி",
  "No documents are uploaded or stored.": "எந்த ஆவணங்களும் பதிவேற்றப்படவில்லை அல்லது சேமிக்கப்படவில்லை.",
  "Close": "மூடுக",
  "Verified Portal Redirect": "சரிபார்க்கப்பட்ட போர்ட்டல் திருப்பிவிடப்பட்டது",
  "Guide": "வழிகாட்டி",
  "Docs": "ஆவணங்கள்",
  "Steps": "படிகள்",
  "Apply": "விண்ணப்பிக்கவும்",
  "Back": "பின்",
  "Step 1: Check Required Documents": "படி 1: தேவையான ஆவணங்களைச் சரிபார்க்கவும்",
  "Please check off that you have these documents ready before opening the application portal:": "பயன்பாட்டு போர்ட்டலைத் திறப்பதற்கு முன், உங்களிடம் இந்த ஆவணங்கள் தயாராக உள்ளதா என்பதைச் சரிபார்க்கவும்:",
  "Kaam Card never saves or asks for copy uploads of these documents. Keep them with you locally.": "இந்த ஆவணங்களின் நகல் பதிவேற்றங்களை காம் கார்டு ஒருபோதும் சேமிக்காது அல்லது கேட்காது. அவற்றை உள்ளூரில் வைத்துக்கொள்ளுங்கள்.",
  "Step 2: Step-by-Step Instructions": "படி 2: படிப்படியான வழிமுறைகள்",
  "Follow these steps on the official portal to complete your registration:": "உங்கள் பதிவை முடிக்க அதிகாரப்பூர்வ போர்ட்டலில் பின்வரும் படிகளைப் பின்பற்றவும்:",
  "Step 3: Access Official Portal": "படி 3: அதிகாரப்பூர்வ போர்ட்டலை அணுகவும்",
  "You are now ready to visit the official website of the": "இன் அதிகாரப்பூர்வ வலைத்தளத்தைப் பார்வையிட நீங்கள் இப்போது தயாராக உள்ளீர்கள்",
  "Verified Official Portal": "சரிபார்க்கப்பட்ட அதிகாரப்பூர்வ போர்டல்",
  "Destination:": "சேருமிடம்:",
  "Open official portal": "அதிகாரப்பூர்வ போர்ட்டலைத் திறக்கவும்",
  "Always confirm the URL ends in .gov.in or .nic.in before submitting any personal information.": "தனிப்பட்ட தகவலைச் சமர்ப்பிக்கும் முன் .gov.in அல்லது .nic.in இல் URL முடிவடைகிறது என்பதை எப்போதும் உறுதிப்படுத்தவும்.",
  "Atal Pension Yojana": "அடல் பென்ஷன் யோஜனா",
  "Pension scheme for unorganized workers providing guaranteed minimum pension of Rs. 1,000 to Rs. 5,000 per month after age 60.": "அமைப்புசாரா தொழிலாளர்களுக்கான ஓய்வூதியத் திட்டம் உத்தரவாதமான குறைந்தபட்ச ஓய்வூதியமாக ரூ. 1,000 முதல் ரூ. 5,000 வரை மாதம் 60 வயதிற்குப் பிறகு.",
  "e-Shram Registration": "இ-ஷ்ரம் பதிவு",
  "National database for unorganized workers to facilitate social security benefits and direct benefit transfers.": "அமைப்புசாரா தொழிலாளர்களுக்கான தேசிய தரவுத்தளம் சமூக பாதுகாப்பு நலன்கள் மற்றும் நேரடி பலன் பரிமாற்றங்களை எளிதாக்குகிறது.",
  "Pradhan Mantri Shram Yogi Maan-dhan": "பிரதான் மந்திரி ஷ்ரம் யோகி மான்-தன்",
  "Voluntary pension scheme for unorganized workers with monthly contribution matching by Central Government.": "அமைப்புசாரா தொழிலாளர்களுக்கு மத்திய அரசின் மாதாந்திர பங்களிப்புடன் கூடிய தன்னார்வ ஓய்வூதிய திட்டம்.",
  "Ayushman Bharat PM-JAY": "ஆயுஷ்மான் பாரத் PM-JAY",
  "Free health insurance coverage up to Rs. 5 Lakhs per family per year for secondary and tertiary care hospitalization.": "ரூ. 5 லட்சம் வரை இலவச சுகாதார காப்பீடு ஒரு குடும்பத்திற்கு ஆண்டுக்கு இரண்டாம் நிலை மற்றும் மூன்றாம் நிலை பராமரிப்பு மருத்துவமனையில் சேர்க்கை.",
  "PM SVANidhi Scheme": "PM ஸ்வாநிதி திட்டம்",
  "Special micro-credit facility for street vendors to access affordable working capital loans for business revival.": "தெரு வணிகர்களுக்கான சிறப்பு நுண் கடன் வசதி, வணிக மீட்புக்கான மலிவு மூலதன கடன்களை அணுக.",
  "Delivery Partner, Delhi": "டெல்லி, டெலிவரி பார்ட்னர்",
  "Cab Driver, Mumbai": "காப் டிரைவர், மும்பை",
  "Domestic Worker, Bangalore": "வீட்டு வேலை செய்பவர், பெங்களூர்",
  "Need help checking eligibility?": "தகுதியைச் சரிபார்க்க உதவி தேவையா?",
  "We are dedicated to supporting digital portability for India's gig economy. If you have questions about the pilot or scheme integration, get in touch.": "இந்தியாவின் கிக் பொருளாதாரத்திற்கான டிஜிட்டல் போர்ட்டபிலிட்டியை ஆதரிப்பதில் நாங்கள் அர்ப்பணித்துள்ளோம். பைலட் அல்லது திட்ட ஒருங்கிணைப்பு பற்றி உங்களுக்கு கேள்விகள் இருந்தால், தொடர்பு கொள்ளவும்.",
  "Toll-free Helpdesk: 1800-11-0031 (Demo)": "கட்டணமில்லா உதவி மையம்: 1800-11-0031 (டெமோ)",
  "Features": "அம்சங்கள்",
  "Process": "செயல்முறை",
  "Reviews": "விமர்சனங்கள்",
  "Contact": "தொடர்பு கொள்ளவும்",
  "Empowering Indian gig workers with portable data identity.": "கையடக்க தரவு அடையாளத்துடன் இந்திய கிக் தொழிலாளர்களை மேம்படுத்துதல்.",
  "Product": "தயாரிப்பு",
  "Testimonials": "சான்றுகள்",
  "Support": "ஆதரவு",
  "Email": "மின்னஞ்சல்",
  "Legal": "சட்டப்படி",
  "Privacy": "தனியுரிமை",
  "Terms": "விதிமுறைகள்",
  "or": "அல்லது",
  "Select Language": "மொழியைத் தேர்ந்தெடுக்கவும்",
  "English": "ஆங்கிலம்",
  "Hindi": "இந்தி",
  "Tamil": "தமிழ்",
  "Telugu": "தெலுங்கு",
  "Marathi": "மராத்தி",
  "Country code": "நாட்டின் குறியீடு",
  "OTP digits": "OTP இலக்கங்கள்",
  "OTP digit 1": "OTP இலக்கம் 1",
  "OTP digit 2": "OTP இலக்கம் 2",
  "OTP digit 3": "OTP இலக்கம் 3",
  "OTP digit 4": "OTP இலக்கம் 4",
  "OTP digit 5": "OTP இலக்கம் 5",
  "OTP digit 6": "OTP இலக்கம் 6",
  "Demo code:": "டெமோ குறியீடு:",
  "Parse status": "பாகுபடுத்தும் நிலை",
  "Parsed income rows": "பாகுபடுத்தப்பட்ட வருமான வரிசைகள்",
  "No usable income rows yet": "இதுவரை பயன்படுத்தக்கூடிய வருமான வரிசைகள் இல்லை",
  "Rows skipped safely": "வரிசைகள் பாதுகாப்பாக தவிர்க்கப்பட்டன",
  "We skipped malformed rows instead of crashing.": "செயலிழப்பதற்குப் பதிலாக தவறான வரிசைகளைத் தவிர்த்துவிட்டோம்.",
  "Row": "வரிசை",
  "Issue": "பிரச்சினை",
  "Add at least one valid credit/income row to continue.": "தொடர குறைந்தபட்சம் ஒரு செல்லுபடியாகும் கிரெடிட்/வருமான வரிசையைச் சேர்க்கவும்.",
  "Analyzed period:": "பகுப்பாய்வு செய்யப்பட்ட காலம்:",
  "Eligible public schemes (": "தகுதியான பொதுத் திட்டங்கள் (",
  " matched)": "பொருந்தியது)",
  "No scheme matches found. Try adjusting search or details.": "திட்டப் பொருத்தங்கள் எதுவும் இல்லை. தேடல் அல்லது விவரங்களை சரிசெய்ய முயற்சிக்கவும்.",
  "Share Summary": "சுருக்கத்தைப் பகிரவும்",
  "Share summary text": "சுருக்க உரையைப் பகிரவும்",
  "Session code:": "அமர்வு குறியீடு:",
  "Daily income bar chart": "தினசரி வருமானம் பட்டை விளக்கப்படம்",
  "Eligible": "தகுதியானவர்",
  "Welfare Knowledge & Security Logs": "நலன்புரி அறிவு & பாதுகாப்பு பதிவுகள்",
  "No actions logged yet.": "இதுவரை எந்த செயல்களும் பதிவு செய்யப்படவில்லை.",
  "Shareable summary": "பகிரக்கூடிய சுருக்கம்",
  "This is a simple text summary for the demo. No raw transactions are included.": "இது டெமோவிற்கான எளிய உரை சுருக்கம். மூல பரிவர்த்தனைகள் எதுவும் சேர்க்கப்படவில்லை.",
  "Copied": "நகலெடுக்கப்பட்டது",
  "Copy": "நகலெடுக்கவும்",
  "Danger Zone": "ஆபத்து மண்டலம்",
  "This will completely clear your parsed income profile and reset the session.": "இது உங்கள் பாகுபடுத்தப்பட்ட வருமான சுயவிவரத்தை முழுவதுமாக அழித்து அமர்வை மீட்டமைக்கும்.",
  "Clear & Purge Session Data": "அமர்வுத் தரவை அழிக்கவும் மற்றும் சுத்தப்படுத்தவும்",
  "Upload": "பதிவேற்றவும்",
  "More": "மேலும்",
  "Main navigation": "முக்கிய வழிசெலுத்தல்",
  "From phone to dashboard in under 2 minutes": "ஃபோனிலிருந்து டாஷ்போர்டிற்கு 2 நிமிடங்களுக்குள்",
  "Kaam Card navigation": "காம் கார்டு வழிசெலுத்தல்",
  "Language switched to": "மொழி மாறியது",
  "Are you sure you want to end your session and delete all parsed data? This cannot be undone.": "உங்கள் அமர்வை முடித்துவிட்டு, பாகுபடுத்தப்பட்ட எல்லா தரவையும் நீக்க விரும்புகிறீர்களா? இதை செயல்தவிர்க்க முடியாது.",
  "Something went wrong": "ஏதோ தவறாகிவிட்டது",
  "The app encountered an unexpected error. Please refresh the page to try again.": "ஆப்ஸ் எதிர்பாராத பிழையை எதிர்கொண்டது. மீண்டும் முயற்சிக்க பக்கத்தைப் புதுப்பிக்கவும்.",
  "Refresh Page": "பக்கத்தைப் புதுப்பிக்கவும்",
  "Kaam Card summary": "காம் அட்டை சுருக்கம்",
  "Phone session:": "தொலைபேசி அமர்வு:",
  "Average daily income:": "சராசரி தினசரி வருமானம்:",
  "Good days:": "நல்ல நாட்கள்:",
  "bad days:": "கெட்ட நாட்கள்:",
  "Saving rule: save": "சேமிப்பு விதி: சேமிக்கவும்",
  "on days above": "மேலே உள்ள நாட்களில்",
  "Likely schemes:": "சாத்தியமான திட்டங்கள்:",
  "No exact match yet": "இன்னும் சரியான பொருத்தம் இல்லை",
  "Demo note: eligibility is simplified and should be verified on the official portal.": "டெமோ குறிப்பு: தகுதி எளிமைப்படுத்தப்பட்டுள்ளது மற்றும் அதிகாரப்பூர்வ போர்ட்டலில் சரிபார்க்கப்பட வேண்டும்.",
  "Income Profile": "வருமான சுயவிவரம்",
  "Daily Average": "தினசரி சராசரி",
  "Monthly Estimate": "மாதாந்திர மதிப்பீடு",
  "Low Days": "குறைந்த நாட்கள்",
  "Savings Recommendation": "சேமிப்பு பரிந்துரை",
  "Matched Welfare Schemes": "பொருந்திய நலத்திட்டங்கள்",
  "Generated by Kaam Card | Eligibility is simplified, verify on official portals": "காம் கார்டு மூலம் உருவாக்கப்பட்டது | தகுதி எளிமைப்படுத்தப்பட்டுள்ளது, அதிகாரப்பூர்வ இணையதளங்களில் சரிபார்க்கவும்",
  "Income": "வருமானம்",
  "Using Kaam Card took less than 2 minutes. It computed my average daily income and showed me I qualified for PM-SYM pension. I registered the same day!": "காம் கார்டைப் பயன்படுத்த 2 நிமிடங்களுக்கும் குறைவாகவே ஆகும். இது எனது சராசரி தினசரி வருமானத்தைக் கணக்கிட்டு, PM-SYM ஓய்வூதியத்திற்கு நான் தகுதி பெற்றுள்ளேன் என்பதைக் காட்டியது. அன்றே பதிவு செய்தேன்!",
  "I always wanted to save but didn't know how much. The good-day surplus savings suggestion helped me set aside money on busy weekends to cover dry weekdays.": "நான் எப்போதும் சேமிக்க விரும்பினேன் ஆனால் எவ்வளவு என்று தெரியவில்லை. நல்ல நாள் உபரி சேமிப்புப் பரிந்துரையானது, பிஸியான வார இறுதி நாட்களில், வறண்ட வார நாட்களை ஈடுகட்ட பணத்தை ஒதுக்க எனக்கு உதவியது.",
  "I was worried about sharing bank logs, but Kaam Card's privacy focus is amazing. It runs on my browser and doesn't store my Aadhaar or transaction lists.": "வங்கிப் பதிவுகளைப் பகிர்வதைப் பற்றி நான் கவலைப்பட்டேன், ஆனால் காம் கார்டின் தனியுரிமைக் கவனம் ஆச்சரியமாக இருக்கிறது. இது எனது உலாவியில் இயங்குகிறது மற்றும் எனது ஆதார் அல்லது பரிவர்த்தனை பட்டியல்களை சேமிக்காது.",
  "© 2026 Kaam Card.": "© 2026 காம் கார்டு.",
  " of ": "இன் ",
  " to ": " செய்ய ",
  "/month": "/மாதம்",
  "You qualify because your ": "நீங்கள் தகுதி பெறுகிறீர்கள், ஏனென்றால் உங்களுடையது",
  " and ": " மற்றும் ",
  "Close match: ": "மூடு பொருத்தம்: ",
  "some details match": "சில விவரங்கள் பொருந்தும்",
  ", but ": ", ஆனால் ",
  "age ": "வயது ",
  " is within ": " உள்ளே உள்ளது ",
  "age must be ": "வயது இருக்க வேண்டும் ",
  "estimated monthly income is below ": "மதிப்பிடப்பட்ட மாத வருமானம் கீழே உள்ளது ",
  "no income cap holds": "வருமான வரம்பு இல்லை",
  "income is above ": "வருமானம் மேலே உள்ளது ",
  " is covered": " சேர்க்கப்பட்டுள்ளது",
  "occupation must match: ": "தொழில் பொருந்த வேண்டும்: ",
  " state matches": " மாநிலம் பொருந்துகிறது",
  "state must be ": "மாநிலம் இருக்க வேண்டும் ",
  " or ": " அல்லது ",
  "Worker ": "தொழிலாளி ",
  "Save ": "சேமிக்கவும் ",
  " on good days (above ": " நல்ல நாட்களில் (மேலே ",
  ")": ")",
  " | +91 ": " | +91 ",
  "-": "-",
  "CSV needs a header and at least one data row.": "CSV க்கு தலைப்பு மற்றும் குறைந்தது ஒரு தரவு வரிசை தேவை.",
  "Missing column: ": "விடுபட்ட நெடுவரிசை: ",
  "Date is invalid. Use YYYY-MM-DD or DD-MM-YYYY.": "தேதி தவறானது. YYYY-MM-DD அல்லது DD-MM-YYYY ஐப் பயன்படுத்தவும்.",
  "Amount is invalid. Use a positive number.": "தொகை செல்லாது. நேர்மறை எண்ணைப் பயன்படுத்தவும்.",
  "Direction must be credit/income or debit/expense.": "திசை கிரெடிட்/வருமானம் அல்லது டெபிட்/செலவாக இருக்க வேண்டும்.",
  "Please upload a CSV file.": "CSV கோப்பைப் பதிவேற்றவும்.",
  "Detected format:": "கண்டறியப்பட்ட வடிவம்:",
  "Expense Summary": "செலவு சுருக்கம்",
  "Spending breakdown from your statement": "உங்கள் அறிக்கையிலிருந்து செலவு முறிவு",
  "Total Expenses": "மொத்த செலவுகள்",
  "Avg daily": "சராசரி தினசரி",
  "Top Category": "முதல் பிரிவு",
  "Income Insights": "வருமான நுண்ணறிவுகள்",
  "Income Stability": "வருமான நிலைத்தன்மை",
  "Stability score based on income variance": "வருமான மாறுபாட்டின் அடிப்படையில் ஸ்திரத்தன்மை மதிப்பெண்",
  "Daily Income": "தினசரி வருமானம்",
  "Weekly Breakdown": "வாராந்திர விவரம்",
  "Income trend week by week": "வாரம் வாரம் வருமான போக்கு",
  "Income vs Expenses": "வருமானம் vs செலவுகள்",
  "How your earnings compare to spending": "உங்கள் வருமானம் மற்றும் செலவுகளின் ஒப்பீடு",
  "Expense Ratio": "செலவு விகிதம்",
  "Savings Projection": "சேமிப்பு முன்கணிப்பு",
  "Project your savings forward": "உங்கள் சேமிப்பை முன்னோக்கி திட்டமிடுங்கள்",
  "Monthly": "மாதாந்திர",
  "3 Months": "3 மாதங்கள்",
  "6 Months": "6 மாதங்கள்",
  "This will cover up to": "இது வரை கவர் செய்யும்",
  "low-income days per month.": "குறைந்த வருமான நாட்கள் மாதத்திற்கு.",
  "Range": "வரம்பு",
  "above": "மேலே",
  "below": "கீழே",
  "No Income": "வருமானம் இல்லை",
  "File is larger than 5 MB.": "கோப்பு 5 MB ஐ விட பெரியது.",
  "Log Out": "வெளியேறு",
  "Kaam Card - ": "காம் அட்டை -",
  "worker": "தொழிலாளி",
  "friend": "நண்பர்",
  "Uploaded files": "பதிவேற்றப்பட்ட கோப்புகள்",
  "Upload a CSV or bank statement PDF. Links inside files are treated as plain text.": "CSV அல்லது பேங்க் ஸ்டேட்மெண்ட் PDFஐப் பதிவேற்றவும். கோப்புகளுக்குள் உள்ள இணைப்புகள் எளிய உரையாகக் கருதப்படுகின்றன.",
  "Tap to upload CSV or PDF": "CSV அல்லது PDF ஐப் பதிவேற்ற தட்டவும்",
  "or drag and drop. CSV or PDF, up to 5 MB.": "அல்லது இழுத்து விடுங்கள். CSV அல்லது PDF, 5 MB வரை.",
  "Manual income entry": "கைமுறை வருமான நுழைவு",
  "Date": "தேதி",
  "Amount": "தொகை",
  "Source": "ஆதாரம்",
  "Platform credit": "மேடை கடன்",
  "Bank transfer": "வங்கி பரிமாற்றம்",
  "Add entry": "உள்ளீட்டைச் சேர்க்கவும்",
  "Remove entry": "உள்ளீட்டை அகற்று",
  "Cash": "பணம்",
  "rows": "வரிசைகள்",
  "Budget": "பட்ஜெட்",
  "documents ready": "ஆவணங்கள் தயார்",
  "Loan Eligibility": "கடன் தகுதி",
  "loan options available": "கடன் விருப்பங்கள் உள்ளன",
  "No loans match your profile": "உங்கள் சுயவிவரத்துடன் எந்தக் கடன்களும் பொருந்தவில்லை",
  "Try adjusting your details or uploading more income data to improve eligibility.": "தகுதியை மேம்படுத்த உங்கள் விவரங்களைச் சரிசெய்து அல்லது அதிக வருமானத் தரவைப் பதிவேற்ற முயற்சிக்கவும்.",
  "Up to": "வரை",
  "Tax Estimation": "வரி மதிப்பீடு",
  "Estimated annual tax liability": "மதிப்பிடப்பட்ட வருடாந்திர வரி பொறுப்பு",
  "Annual income": "ஆண்டு வருமானம்",
  "Estimated tax": "மதிப்பிடப்பட்ட வரி",
  "Net income after tax": "வரிக்குப் பிறகு நிகர வருமானம்",
  "Effective tax rate": "பயனுள்ள வரி விகிதம்",
  "This is a simplified estimate. Consult a CA for accurate tax planning.": "இது ஒரு எளிமையான மதிப்பீடு. துல்லியமான வரி திட்டமிடலுக்கு CA ஐ அணுகவும்.",
  "Claim": "உரிமைகோரவும்",
  "Claim Documents": "உரிமைகோரல் ஆவணங்கள்",
  "Step 3: Claim Documents": "படி 3: உரிமைகோரல் ஆவணங்கள்",
  "Step 4: File a Claim": "படி 4: ஒரு உரிமைகோரலைப் பதிவு செய்யவும்",
  "Prepare these documents if you need to file a claim:": "நீங்கள் உரிமைகோரலைப் பதிவு செய்ய வேண்டுமானால், இந்த ஆவணங்களைத் தயாரிக்கவும்:",
  "Follow these steps to file a claim on the official portal:": "அதிகாரப்பூர்வ போர்ட்டலில் உரிமைகோரலைப் பதிவு செய்ய இந்தப் படிகளைப் பின்பற்றவும்:",
  "Policy document / enrollment number": "கொள்கை ஆவணம் / பதிவு எண்",
  "Claim form (download from portal)": "உரிமைகோரல் படிவம் (போர்ட்டலில் இருந்து பதிவிறக்கவும்)",
  "Supporting documents (hospital bills / death certificate)": "ஆதார ஆவணங்கள் (மருத்துவமனை பில்கள் / இறப்பு சான்றிதழ்)",
  "Download the claim form from the official portal.": "அதிகாரப்பூர்வ போர்ட்டலில் இருந்து உரிமைகோரல் படிவத்தைப் பதிவிறக்கவும்.",
  "Fill in the policyholder details and policy number.": "பாலிசிதாரர் விவரங்களையும் பாலிசி எண்ணையும் நிரப்பவும்.",
  "Attach all required supporting documents.": "தேவையான அனைத்து ஆதார ஆவணங்களையும் இணைக்கவும்.",
  "Submit the form at the nearest branch or online portal.": "அருகிலுள்ள கிளை அல்லது ஆன்லைன் போர்ட்டலில் படிவத்தை சமர்ப்பிக்கவும்.",
  "Track claim status using the acknowledgment number.": "ஒப்புகை எண்ணைப் பயன்படுத்தி உரிமைகோரல் நிலையைக் கண்காணிக்கவும்.",
  "Skip": "தவிர்க்கவும்",
  "Next": "அடுத்து",
  "Welcome to Kaam Card": "காம் கார்டுக்கு வரவேற்கிறோம்",
  "This is your dashboard. Here you'll see your income analysis, savings recommendations, and welfare scheme matches.": "இது உங்கள் டாஷ்போர்டு. உங்கள் வருமான பகுப்பாய்வு, சேமிப்புப் பரிந்துரைகள் மற்றும் நலன்புரி திட்டப் பொருத்தங்களை இங்கே பார்க்கலாம்.",
  "Your daily earnings chart shows good days and bad days, helping you understand your income patterns.": "உங்கள் வருமான பகுப்பாய்வு, சேமிப்புப் பரிந்துரைகள் மற்றும் நலன்புரி திட்டப் பொருத்தங்களை இங்கே பார்க்கலாம்.",
  "Use the smart savings suggestion and check which government schemes you qualify for.": "ஸ்மார்ட் சேமிப்புப் பரிந்துரையைப் பயன்படுத்தி, எந்த அரசாங்கத் திட்டங்களுக்கு நீங்கள் தகுதி பெறுகிறீர்கள் என்பதைச் சரிபார்க்கவும்.",
  "Tap Upload to add more statements or manual entries anytime.": "எந்த நேரத்திலும் கூடுதல் அறிக்கைகள் அல்லது கைமுறை உள்ளீடுகளைச் சேர்க்க, பதிவேற்று என்பதைத் தட்டவும்.",
  "Remove": "அகற்று",
  "Please upload a CSV or PDF file.": "CSV அல்லது PDF கோப்பைப் பதிவேற்றவும்.",
  "Bank PDF": "வங்கி PDF",
  "Ration card": "ரேஷன் கார்டு",
  "Voter ID": "வாக்காளர் அடையாள அட்டை",
  "Driving license": "ஓட்டுநர் உரிமம்",
  "Income certificate": "வருமான சான்றிதழ்",
  "Minimum age": "குறைந்தபட்ச வயது",
  "Maximum age": "அதிகபட்ச வயது",
  "Minimum monthly income": "குறைந்தபட்ச மாத வருமானம்",
  "Income must be below": "வருமானம் கீழே இருக்க வேண்டும்",
  "Occupation must be": "தொழில் இருக்க வேண்டும்",
  "State must be": "மாநிலம் இருக்க வேண்டும்",
  "Monthly income": "மாத வருமானம்",
  "Income stability": "வருமான ஸ்திரத்தன்மை",
  "Listen": "கேளுங்கள்",
  "UPI": "UPI",
  "Manual": "கைமுறை",
  "Generic CSV": "பொது CSV",
  "Google Pay": "Google Pay",
  "PhonePe": "PhonePe",
  "PayTM": "PayTM",
  "High": "உயர்",
  "Medium": "நடுத்தர",
  "Low": "குறைந்த",
  "High Contrast": "உயர் மாறுபாடு",
  "Voice Input": "குரல் உள்ளீடு",
  "Screen Reader": "ஸ்கிரீன் ரீடர்",
  "Enable High Contrast": "உயர் மாறுபாட்டை இயக்கு",
  "Disable High Contrast": "உயர் மாறுபாட்டை முடக்கு",
  "Enable Voice Input": "குரல் உள்ளீட்டை இயக்கு",
  "Disable Voice Input": "குரல் உள்ளீட்டை முடக்கு",
  "High contrast enabled": "உயர் மாறுபாடு இயக்கப்பட்டது",
  "High contrast disabled": "உயர் மாறுபாடு முடக்கப்பட்டுள்ளது",
  "Voice input enabled": "குரல் உள்ளீடு இயக்கப்பட்டது",
  "Voice input disabled": "குரல் உள்ளீடு முடக்கப்பட்டது",
  "Tap to speak": "பேச தட்டவும்",
  "Listening...": "கேட்கிறது...",
  "PM Shram Yogi Maandhan": "பிரதமர் ஷ்ரம் யோகி மந்தன்",
  "e-Shram": "இ-ஷ்ரம்",
  "PM Jeevan Jyoti Bima Yojana": "பிரதமர் ஜீவன் ஜோதி பீமா யோஜனா",
  "PM Suraksha Bima Yojana": "PM சுரக்ஷா பீமா யோஜனா",
  "Delhi Construction Workers Welfare Board": "டெல்லி கட்டுமான தொழிலாளர்கள் நல வாரியம்",
  "Pension support after age 60": "60 வயதிற்குப் பிறகு ஓய்வூதியம்",
  "National registration for unorganised workers": "அமைப்புசாரா தொழிலாளர்களுக்கான தேசிய பதிவு",
  "Health cover for low-income families": "குறைந்த வருமானம் கொண்ட குடும்பங்களுக்கு சுகாதார பாதுகாப்பு",
  "Life insurance cover": "ஆயுள் காப்பீடு",
  "Accident insurance cover": "விபத்து காப்பீடு",
  "Welfare benefits for registered construction workers": "பதிவு செய்யப்பட்ட கட்டுமானத் தொழிலாளர்களுக்கு நலத்திட்ட உதவிகள்",
  "Maharashtra Building & Other Construction Workers Welfare Board": "மகாராஷ்டிரா கட்டிடம் மற்றும் பிற கட்டுமானத் தொழிலாளர்கள் நல வாரியம்",
  "Karnataka Unorganised Workers Social Security Board": "கர்நாடக அமைப்புசாரா தொழிலாளர் சமூக பாதுகாப்பு வாரியம்",
  "Tamil Nadu Manual Workers Welfare Board": "தமிழ்நாடு உடலுழைப்பு தொழிலாளர்கள் நல வாரியம்",
  "Uttar Pradesh Building & Other Construction Workers Welfare Board": "உத்தரபிரதேச கட்டிடம் மற்றும் பிற கட்டுமான தொழிலாளர்கள் நல வாரியம்",
  "West Bengal Unorganised Sector Workers Welfare Board": "மேற்கு வங்காள அமைப்புசாரா துறை தொழிலாளர்கள் நல வாரியம்",
  "Rajasthan Building & Other Construction Workers Welfare Board": "ராஜஸ்தான் கட்டிடம் மற்றும் பிற கட்டுமானத் தொழிலாளர்கள் நல வாரியம்",
  "Gujarat Building & Other Construction Workers Welfare Board": "குஜராத் கட்டிடம் மற்றும் பிற கட்டுமானத் தொழிலாளர்கள் நல வாரியம்",
  "Madhya Pradesh Building & Other Construction Workers Welfare Board": "மத்தியப் பிரதேச கட்டிடம் மற்றும் பிற கட்டுமானத் தொழிலாளர்கள் நல வாரியம்",
  "Bihar Unorganised Workers Social Security Board": "பீகார் அமைப்புசாரா தொழிலாளர்கள் சமூக பாதுகாப்பு வாரியம்",
  "Odisha Unorganised Workers Welfare Board": "ஒடிசா அமைப்புசாரா தொழிலாளர் நல வாரியம்",
  "PM SVANidhi": "PM ஸ்வாநிதி",
  "PM MUDRA Yojana (Shishu)": "PM முத்ரா யோஜனா (ஷிஷு)",
  "Janani Suraksha Yojana": "ஜனனி சுரக்ஷா யோஜனா",
  "Pradhan Mantri Matru Vandana Yojana": "பிரதான் மந்திரி மாத்ரு வந்தனா யோஜனா",
  "Ayushman Bharat Health Account (ABHA)": "ஆயுஷ்மான் பாரத் சுகாதார கணக்கு (ABHA)",
  "NPS Vatsalya": "என்.பி.எஸ்.வத்சல்யா",
  "PM Kaushal Vikas Yojana (PMKVY)": "PM கவுசல் விகாஸ் யோஜனா (PMKVY)",
  "Stand-Up India": "ஸ்டாண்ட்-அப் இந்தியா",
  "Ekta Mall (PM SVANidhi Extension)": "ஏக்தா மால் (பிஎம் எஸ்விநிதி நீட்டிப்பு)",
  "Pension, accident insurance, maternity benefit, death benefit": "ஓய்வூதியம், விபத்து காப்பீடு, மகப்பேறு பலன், இறப்பு பலன்",
  "Pension, accident cover, tool kit assistance, skill training": "ஓய்வூதியம், விபத்து பாதுகாப்பு, கருவி கருவி உதவி, திறன் பயிற்சி",
  "Pension, accident insurance, marriage assistance, education grant": "ஓய்வூதியம், விபத்து காப்பீடு, திருமண உதவி, கல்வி உதவித்தொகை",
  "Pension, health insurance, disability cover, death benefit": "ஓய்வூதியம், உடல்நலக் காப்பீடு, ஊனமுற்றோர் பாதுகாப்பு, இறப்பு நலன்",
  "Pension, accident insurance, health cover, scholarship": "ஓய்வூதியம், விபத்து காப்பீடு, சுகாதார காப்பீடு, உதவித்தொகை",
  "Collateral-free working capital loan up to ₹50,000 for street vendors": "தெருவோர வியாபாரிகளுக்கு ₹50,000 வரை பிணையில்லாத செயல்பாட்டு மூலதனக் கடன்",
  "Guaranteed pension ₹1,000-5,000/month after age 60": "60 வயதிற்குப் பிறகு உத்தரவாத ஓய்வூதியம் ₹1,000-5,000/மாதம்",
  "Micro loan up to ₹50,000 for small business": "சிறு வணிகத்திற்கு ₹50,000 வரை சிறு கடன்",
  "Cash assistance for institutional delivery": "நிறுவன விநியோகத்திற்கான பண உதவி",
  "₹5,000 cash incentive for first live birth": "முதல் பிறப்புக்கு ₹5,000 ரொக்க ஊக்கத்தொகை",
  "Digital health ID for seamless healthcare access": "தடையற்ற சுகாதார அணுகலுக்கான டிஜிட்டல் ஹெல்த் ஐடி",
  "Pension account for minors, converts to regular NPS at 18": "சிறார்களுக்கான ஓய்வூதியக் கணக்கு, 18ல் வழக்கமான NPS ஆக மாற்றப்படும்",
  "Free skill training with certification and placement support": "சான்றிதழ் மற்றும் வேலை வாய்ப்பு ஆதரவுடன் இலவச திறன் பயிற்சி",
  "Bank loan ₹10 lakh - ₹1 crore for SC/ST/Women entrepreneurs": "வங்கிக் கடன் ₹10 லட்சம் - எஸ்சி/எஸ்டி/பெண்கள் தொழில்முனைவோருக்கு ₹1 கோடி",
  "E-commerce platform for street vendors to sell online": "தெருவோர வியாபாரிகளுக்கு ஆன்லைனில் விற்கும் ஈ-காமர்ஸ் தளம்",
  "MUDRA Loan (Shishu)": "முத்ரா கடன் (ஷிஷு)",
  "Micro Enterprise Loan": "மைக்ரோ எண்டர்பிரைஸ் கடன்",
  "Working capital loan up to ₹10,000 for street vendors, repayable in monthly installments.": "தெருவோர வியாபாரிகளுக்கு ₹10,000 வரையிலான செயல்பாட்டு மூலதனக் கடன், மாதத் தவணைகளில் திருப்பிச் செலுத்தப்படும்.",
  "Loans up to ₹50,000 for income-generating activities in non-corporate small business sector.": "கார்ப்பரேட் அல்லாத சிறு வணிகத் துறையில் வருமானம் ஈட்டும் நடவடிக்கைகளுக்கு ₹50,000 வரை கடன்.",
  "Small business loan for informal workers to expand livelihood activities.": "வாழ்வாதார நடவடிக்கைகளை விரிவுபடுத்த முறைசாரா தொழிலாளர்களுக்கு சிறு தொழில் கடன்.",
  "PAN Card": "பான் கார்டு",
  "Bank account passbook": "வங்கி கணக்கு பாஸ்புக்",
  "Savings bank account passbook": "சேமிப்பு வங்கி கணக்கு பாஸ்புக்",
  "Bank account details": "வங்கி கணக்கு விவரங்கள்",
  "Mobile number linked with Aadhaar": "ஆதாருடன் இணைக்கப்பட்ட மொபைல் எண்",
  "Show QR Code": "QR குறியீட்டைக் காட்டு",
  "Worker Card QR Code": "தொழிலாளர் அட்டை QR குறியீடு",
  "Scan to share your Kaam Card profile": "உங்கள் காம் கார்டு சுயவிவரத்தைப் பகிர ஸ்கேன் செய்யவும்",
  "Expires in 24 hours": "24 மணிநேரத்தில் காலாவதியாகிறது",
  "Download QR": "QR ஐப் பதிவிறக்கவும்",
  "Export Card (HTML)": "ஏற்றுமதி அட்டை (HTML)",
  "Save as PDF": "PDF ஆக சேமிக்கவும்",
  "Share via App": "ஆப் மூலம் பகிரவும்",
  "Kaam Card Summary": "காம் அட்டை சுருக்கம்",
  "Open the official verified portal.": "அதிகாரப்பூர்வ சரிபார்க்கப்பட்ட போர்ட்டலைத் திறக்கவும்.",
  "Verify using Aadhaar-linked OTP.": "ஆதார் இணைக்கப்பட்ட OTP ஐப் பயன்படுத்தி சரிபார்க்கவும்.",
  "Submit your occupation details and get registered.": "உங்கள் தொழில் விவரங்களைச் சமர்ப்பித்து பதிவு செய்யுங்கள்.",
  "Upload a statement to see spending breakdown": "செலவினச் சரிவைக் காண அறிக்கையைப் பதிவேற்றவும்",
  "Upload a bank statement to get automatic expense categorization and budgeting insights.": "தானியங்கி செலவு வகைப்பாடு மற்றும் பட்ஜெட் நுண்ணறிவுகளைப் பெற, வங்கி அறிக்கையைப் பதிவேற்றவும்.",

  "Application Deadlines": "விண்ணப்ப காலக்கெடு",
  "Upcoming scheme application deadlines": "வரவிருக்கும் திட்ட விண்ணப்ப காலக்கெடு",
  "No upcoming deadlines right now": "தற்போது வரவிருக்கும் காலக்கெடு எதுவும் இல்லை",
  "Check back later for scheme application deadlines.": "திட்ட விண்ணப்ப காலக்கெடுக்கு பின்னர் சரிபார்க்கவும்.",
  "Deadlines are indicative. Verify on official portals.": "காலக்கெடு குறிப்பானது. அதிகாரப்பூர்வ போர்ட்டல்களில் சரிபார்க்கவும்.",
  "days left": "நாட்கள் மீதம்",
  "Smart Tips": "நுண்ணறிவு உதவிக்குறிப்புகள்",
  "Personalized financial guidance": "தனிப்பயனாக்கப்பட்ட நிதி வழிகாட்டுதல்",
  "Track your saving targets": "உங்கள் சேமிப்பு இலக்குகளைக் கண்காணிக்கவும்",
  "Set a saving target": "சேமிப்பு இலக்கை அமைக்கவும்",
  "Add Goal": "இலக்கைச் சேர்க்கவும்",
  "Create First Goal": "முதல் இலக்கை உருவாக்கவும்",
  "Knowledge & Logs": "அறிவு & பதிவுகள்",
  "Create a goal to save for emergencies, festivals, or big purchases.": "அவசரம், பண்டிகைகள் அல்லது பெரிய கொள்முதல்களுக்காக சேமிக்க ஒரு இலக்கை உருவாக்கவும்.",
  "Government of India": "இந்திய அரசு",
  "Welfare benefits, pension, accident cover for construction workers": "கட்டுமானத் தொழிலாளர்களுக்கு நலன்புரி நன்மைகள், ஓய்வூதியம், விபத்து கவரேஜ்",
  "Pension, health insurance, accident cover for unorganised workers": "ஒழுங்கமைக்கப்படாத தொழிலாளர்களுக்கு ஓய்வூதியம், உடல்நலக் காப்பீடு, விபத்து கவரேஜ்",
  "Pension, family pension, education assistance, accident relief": "ஓய்வூதியம், குடும்ப ஓய்வூதியம், கல்வி உதவி, விபத்து நிவாரணம்",
  "Pension, health scheme, death benefit, education grant": "ஓய்வூதியம், சுகாதாரத் திட்டம், இறப்பு நன்மை, கல்வி மானியம்",
  "Pension, accident insurance, maternity benefit, scholarship": "ஓய்வூதியம், விபத்து காப்பீடு, மகப்பேறு சலுகை, உதவித்தொகை",
  "Check which government schemes you qualify for based on your profile and income.": "உங்கள் சுயவிவரம் மற்றும் வருமானத்தின் அடிப்படையில் எந்த அரசுத் திட்டங்களுக்கு நீங்கள் தகுதியானவர் என்பதைச் சரிபார்க்கவும்.",
  "Keep track of upcoming scheme deadlines so you never miss an application window.": "வரவிருக்கும் திட்ட காலக்கெடுவைக் கண்காணித்து, விண்ணப்ப சாளரத்தை தவறவிடாதீர்கள்.",
  "Set personal saving targets for emergencies, festivals, or big purchases.": "அவசரநிலைகள், பண்டிகைகள் அல்லது பெரிய கொள்முதல்களுக்கு தனிப்பட்ட சேமிப்பு இலக்குகளை அமைக்கவும்.",
  "The savings card shows how much to save on good days to cover low-income days automatically.": "சேமிப்பு அட்டை, குறைந்த வருமான நாட்களை தானாக ஈடுகட்ட நல்ல நாட்களில் எவ்வளவு சேமிக்க வேண்டும் என்பதைக் காட்டுகிறது.",
  "Track your spending by category and set budgets to stay in control.": "வகை வாரியாக உங்கள் செலவினங்களைக் கண்காணித்து, கட்டுக்கோப்பாக இருக்க பட்ஜெட்டுகளை அமைக்கவும்.",
  "Generate a portable summary of your verified profile to share with employers or schemes.": "முதலாளிகள் அல்லது திட்டங்களுடன் பகிர்ந்து கொள்ள உங்கள் சரிபார்க்கப்பட்ட சுயவிவரத்தின் சிறிய சுருக்கத்தை உருவாக்கவும்.",
  "Your daily earnings chart shows good days and bad days, helping you understand your income patterns.": "உங்கள் தினசரி வருவாய் விளக்கப்படம் நல்ல நாட்களையும் கெட்ட நாட்களையும் காட்டுகிறது, உங்கள் வருமான முறைகளைப் புரிந்துகொள்ள உதவுகிறது.",
  "Schemes": "திட்டங்கள்",
  "Messy CSV": "குழப்பமான CSV",
  // 2026-08-04: Missing keys (translated)
  "Analyzed period": "பகுப்பாய்வு செய்யப்பட்ட காலம்",
  "Category Dominance": "வகை ஆதிக்கம்",
  "Close menu": "மெனுவை மூடு",
  "Create a goal (e.g., \"Emergency Fund ₹10,000\") to stay motivated. The app will calculate your daily target.": "உத்வேகத்துடன் இருக்க ஒரு இலக்கை உருவாக்கவும் (எ.கா. \"அவசர நிதி ₹10,000\"). பயன்பாடு உங்கள் தினசரி இலக்கைக் கணக்கிடும்.",
  "Daily earnings trend": "தினசரி வருவாய் போக்கு",
  "Documents": "ஆவணங்கள்",
  "Download PDF / Print": "PDF / பிரிண்ட் பதிவிறக்கவும்",
  "Goal name (e.g., Emergency Fund, Festival, Vehicle):": "இலக்கின் பெயர் (எ.கா., அவசர நிதி, திருவிழா, வாகனம்):",
  "Good Day Advantage": "நல்ல நாள் நன்மை",
  "High Expense Ratio": "அதிக செலவு விகிதம்",
  "High Income Volatility": "உயர் வருமான நிலையற்ற தன்மை",
  "In 3 months": "3 மாதங்களில்",
  "In 6 months": "6 மாதங்களில்",
  "Look for cheaper alternatives or set a budget.": "மலிவான மாற்றுகளைத் தேடுங்கள் அல்லது பட்ஜெட்டை அமைக்கவும்.",
  "Low Monthly Savings": "குறைந்த மாதாந்திர சேமிப்பு",
  "Low-income threshold:": "குறைந்த வருமான வரம்பு:",
  "Moderate Expense Ratio": "மிதமான செலவு விகிதம்",
  "Monthly saving": "மாதாந்திர சேமிப்பு",
  "No Budgets Set": "பட்ஜெட் எதுவும் அமைக்கப்படவில்லை",
  "OTP sent via SMS": "எஸ்எம்எஸ் மூலம் OTP அனுப்பப்பட்டது",
  "OTP sent via SMS. Check your phone for the 6-digit code.": "எஸ்எம்எஸ் மூலம் OTP அனுப்பப்பட்டது. உங்கள் ஃபோனில் 6 இலக்கக் குறியீட்டைச் சரிபார்க்கவும்.",
  "Open menu": "மெனுவைத் திற",
  "Other": "மற்றவை",
  "Over 40% of expenses go to": "40% க்கும் அதிகமான செலவுகள் செல்கின்றன",
  "Projected monthly savings under ₹500. Even ₹50/day on good days builds emergency fund.": "மாதாந்திர சேமிப்பு ₹500க்கு கீழ். நல்ல நாட்களில் ஒரு நாளைக்கு ₹50 கூட அவசர நிதியை உருவாக்குகிறது.",
  "QR Code": "QR குறியீடு",
  "Savings Goals": "சேமிப்பு இலக்குகள்",
  "Set a Savings Goal": "சேமிப்பு இலக்கை அமைக்கவும்",
  "Set monthly budgets per category to track spending. Start with your top 3 categories.": "செலவுகளைக் கண்காணிக்க ஒரு வகைக்கு மாதாந்திர பட்ஜெட்டுகளை அமைக்கவும். உங்கள் முதல் 3 வகைகளுடன் தொடங்கவும்.",
  "Smart Savings": "ஸ்மார்ட் சேமிப்பு",
  "Spending 70-90% of income leaves little buffer. Try the 50/30/20 rule: needs/wants/savings.": "வருமானத்தில் 70-90% செலவழிப்பது சிறிய இடையகத்தை விட்டுச்செல்கிறது. 50/30/20 விதியை முயற்சிக்கவும்: தேவைகள்/விருப்பங்கள்/சேமிப்புகள்.",
  "Tap anywhere to skip": "தவிர்க்க எங்கு வேண்டுமானாலும் தட்டவும்",
  "Target amount (₹):": "இலக்கு தொகை (₹):",
  "Target date (YYYY-MM-DD, optional):": "இலக்கு தேதி (YYYY-MM-DD, விருப்பத்தேர்வு):",
  "Total Income": "மொத்த வருமானம்",
  "Use your browser's Print to PDF option to save": "சேமிக்க உங்கள் உலாவியின் Print to PDF விருப்பத்தைப் பயன்படுத்தவும்",
  "Worker:": "தொழிலாளி:",
  "You have more good days than bad. Save aggressively on good days to cover bad ones automatically.": "உங்களுக்கு கெட்ட நாட்களை விட நல்ல நாட்கள் அதிகம். கெட்ட நாட்களை தானாகவே மறைப்பதற்கு நல்ல நாட்களில் தீவிரமாகச் சேமிக்கவும்.",
  "You're spending over 90% of your income. Review top categories for savings.": "உங்கள் வருமானத்தில் 90% க்கும் அதிகமாக செலவழிக்கிறீர்கள். சேமிப்பிற்கான சிறந்த வகைகளை மதிப்பாய்வு செய்யவும்.",
  "Your daily income varies by more than 50%. Consider building a 2-month expense buffer.": "உங்கள் தினசரி வருமானம் 50%க்கும் அதிகமாக மாறுபடும். 2 மாத செலவு இடையகத்தை உருவாக்குவதைக் கவனியுங்கள்.",
  "on good days": "நல்ல நாட்களில்",
  "per month": "மாதத்திற்கு",
  "to": "செய்ய",
};
const TRANSLATIONS_TE = {
  "Kaam Card": "కామ్ కార్డ్",
  "Dashboard": "డాష్‌బోర్డ్",
  "Connect Data": "డేటాను కనెక్ట్ చేయండి",
  "Income Analytics": "ఆదాయ విశ్లేషణలు",
  "Welfare Schemes": "సంక్షేమ పథకాలు",
  "General": "సాధారణ",
  "Insights": "అంతర్దృష్టులు",
  "Secure & Private": "సురక్షితం & ప్రైవేట్",
  "Parsed locally. Zero network leaks.": "స్థానికంగా పార్స్ చేయబడింది. నెట్‌వర్క్ లీక్ లేదు.",
  "Purge Session Data": "సెషన్ డేటాను తొలగించండి",
  "Purge Session": "సెషన్ తొలగించండి",
  "Export Card": "కార్డ్ ఎగుమతి చేయండి",
  "Light Mode": "లైట్ మోడ్",
  "Dark Mode": "డార్క్ మోడ్",
  "For you": "మీ కోసం",
  "SECURE SANDBOX": "సురక్షిత శాండ్‌బాక్స్",
  "LOG IN / START": "లాగిన్ / ప్రారంభించండి",
  "Create Your Kaam Card": "మీ కామ్ కార్డ్‌ని సృష్టించండి",
  "How it Works": "ఇది ఎలా పనిచేస్తుంది",
  "100% Private: No Aadhaar or PAN stored": "100% ప్రైవేట్: ఆధార్ లేదా పాన్ నిల్వ చేయబడలేదు",
  "Safe: In-memory processing": "సురక్షిత: ఇన్-మెమరీ ప్రాసెసింగ్",
  "Go from Platform Earnings to Welfare Benefits in 2 Minutes.": "ప్లాట్‌ఫారమ్ ఆదాయాల నుండి 2 నిమిషాల్లో సంక్షేమ ప్రయోజనాలకు వెళ్లండి.",
  "Kaam Card is a portable, secure record for informal and gig workers.": "కామ్ కార్డ్ అనేది అనధికారిక మరియు గిగ్ కార్మికులకు పోర్టబుల్, సురక్షితమైన రికార్డు.",
  "Aadhaar Card": "ఆధార్ కార్డ్",
  "What We Do": "మేము ఏమి చేస్తాము",
  "Designed for India's Informal Workforce": "భారతదేశం యొక్క అనధికారిక వర్క్‌ఫోర్స్ కోసం రూపొందించబడింది",
  "2 min": "2 నిమి",
  "Average setup time": "సగటు సెటప్ సమయం",
  "Zero": "సున్నా",
  "Data stored on servers": "సర్వర్‌లలో డేటా నిల్వ చేయబడుతుంది",
  "Go from daily wages to safe public welfare benefits": "రోజువారీ వేతనాల నుండి సురక్షితమైన ప్రజా సంక్షేమ ప్రయోజనాలకు వెళ్లండి",
  "Verify your eligibility instantly and register on official portals without middleman risk.": "మీ అర్హతను తక్షణమే ధృవీకరించండి మరియు మధ్యవర్తి ప్రమాదం లేకుండా అధికారిక పోర్టల్‌లలో నమోదు చేసుకోండి.",
  "Verify eligibility & register": "అర్హతను ధృవీకరించండి & నమోదు చేయండి",
  "Punchlist's Quality": "పంచ్‌లిస్ట్ నాణ్యత",
  "Go from design to build without losing crucial details.": "కీలకమైన వివరాలను కోల్పోకుండా డిజైన్ నుండి నిర్మాణానికి వెళ్లండి.",
  "Security Audit": "సెక్యూరిటీ ఆడిట్",
  "No data is shared or stored without explicit consent.": "స్పష్టమైన సమ్మతి లేకుండా ఏ డేటా షేర్ చేయబడదు లేదా నిల్వ చేయబడదు.",
  "Why Kaam Card?": "కామ్ కార్డ్ ఎందుకు?",
  "We help gig workers accumulate data value that is normally locked away in siloed apps.": "సాధారణంగా సైల్డ్ యాప్‌లలో లాక్ చేయబడిన డేటా విలువను సేకరించడంలో మేము గిగ్ వర్కర్లకు సహాయం చేస్తాము.",
  "Understand your earnings variance, good days vs bad days, and average monthly income instantly.": "మీ ఆదాయ వ్యత్యాసాన్ని, మంచి రోజులు మరియు చెడు రోజులు మరియు సగటు నెలవారీ ఆదాయాన్ని తక్షణమే అర్థం చేసుకోండి.",
  "Scheme Matching": "పథకం సరిపోలిక",
  "Automatically match your computed income against real criteria for e-Shram, PM-SYM, PM-JAY, and more.": "e-Shram, PM-SYM, PM-JAY మరియు మరిన్నింటికి సంబంధించిన వాస్తవ ప్రమాణాలతో మీ కంప్యూటెడ్ ఆదాయాన్ని స్వయంచాలకంగా సరిపోల్చండి.",
  "Smart Micro-Savings": "స్మార్ట్ మైక్రో సేవింగ్స్",
  "Get a mathematically grounded savings rule based on your actual income surplus on high-earning days.": "అధిక సంపాదన ఉన్న రోజులలో మీ వాస్తవ ఆదాయ మిగులు ఆధారంగా గణితశాస్త్ర ప్రాతిపదికన పొదుపు నియమాన్ని పొందండి.",
  "Three Simple Steps": "మూడు సాధారణ దశలు",
  "Secure OTP Login": "సురక్షిత OTP లాగిన్",
  "Enter your phone number to start a secure, isolated sandbox session. No passwords required.": "సురక్షితమైన, వివిక్త శాండ్‌బాక్స్ సెషన్‌ను ప్రారంభించడానికి మీ ఫోన్ నంబర్‌ను నమోదు చేయండి. పాస్‌వర్డ్‌లు అవసరం లేదు.",
  "Upload Statements": "స్టేట్‌మెంట్‌లను అప్‌లోడ్ చేయండి",
  "Drop a bank statement or UPI statement CSV. We parse it locally in your browser and discard raw transaction details.": "బ్యాంక్ స్టేట్‌మెంట్ లేదా UPI స్టేట్‌మెంట్ CSVని వదలండి. మేము దీన్ని మీ బ్రౌజర్‌లో స్థానికంగా అన్వయిస్తాము మరియు ముడి లావాదేవీ వివరాలను విస్మరిస్తాము.",
  "Get Kaam Dashboard": "కామ్ డాష్‌బోర్డ్‌ని పొందండి",
  "Instantly check eligible schemes, review savings recommendations, and export your portable worker card.": "అర్హత ఉన్న పథకాలను తక్షణమే తనిఖీ చేయండి, పొదుపు సిఫార్సులను సమీక్షించండి మరియు మీ పోర్టబుల్ వర్కర్ కార్డ్‌ని ఎగుమతి చేయండి.",
  "Loved by Workers": "కార్మికులకు నచ్చింది",
  "Hear from informal partners who verified their scheme eligibility using Kaam Card.": "కామ్ కార్డ్‌ని ఉపయోగించి తమ స్కీమ్ అర్హతను ధృవీకరించిన అనధికారిక భాగస్వాముల నుండి వినండి.",
  "Log In & Access Portal": "లాగిన్ & యాక్సెస్ పోర్టల్",
  "Start with your mobile number. This demo keeps the session in memory only.": "మీ మొబైల్ నంబర్‌తో ప్రారంభించండి. ఈ డెమో సెషన్‌ను మెమరీలో మాత్రమే ఉంచుతుంది.",
  "Mobile number": "మొబైల్ నంబర్",
  "Enter mobile number": "మొబైల్ నంబర్‌ను నమోదు చేయండి",
  "Enter 10 digit number to receive a secure OTP verification check.": "సురక్షిత OTP ధృవీకరణ తనిఖీని స్వీకరించడానికి 10 అంకెల సంఖ్యను నమోదు చేయండి.",
  "Send secure OTP link": "సురక్షిత OTP లింక్‌ని పంపండి",
  "Continue with sample data": "నమూనా డేటాతో కొనసాగించండి",
  "OTP Verification": "OTP ధృవీకరణ",
  "OTP sent via server": "OTP సర్వర్ ద్వారా పంపబడింది",
  "We sent an OTP to": "మేము ఒక OTPని పంపాము",
  "Any 4 digits will work in this prototype.": "ఈ ప్రోటోటైప్‌లో ఏదైనా 4 అంకెలు పని చేస్తాయి.",
  "Verify code": "కోడ్‌ని ధృవీకరించండి",
  "Verify and continue": "ధృవీకరించండి మరియు కొనసాగించండి",
  "Switch to light theme": "లైట్ థీమ్‌కి మారండి",
  "Switch to dark theme": "డార్క్ థీమ్‌కి మారండి",
  "Consent & Authorization": "సమ్మతి & ఆథరైజేషన్",
  "Kaam Card parses statement details locally to build your portable record. By continuing, you agree to:": "కామ్ కార్డ్ మీ పోర్టబుల్ రికార్డ్‌ను రూపొందించడానికి స్టేట్‌మెంట్ వివరాలను స్థానికంగా అన్వయిస్తుంది. కొనసాగించడం ద్వారా, మీరు వీటిని అంగీకరిస్తున్నారు:",
  "Local Parsing:": "స్థానిక పార్సింగ్:",
  "Executed strictly in-browser memory.": "బ్రౌజర్ మెమరీలో ఖచ్చితంగా అమలు చేయబడింది.",
  "Data Minimization:": "డేటా కనిష్టీకరణ:",
  "Raw lines are discarded after daily stats computation.": "రోజువారీ గణాంకాల గణన తర్వాత ముడి పంక్తులు విస్మరించబడతాయి.",
  "Zero ID Collection:": "జీరో ID సేకరణ:",
  "We never collect Aadhaar, PAN, or full bank numbers.": "మేము ఎప్పుడూ ఆధార్, పాన్ లేదా పూర్తి బ్యాంక్ నంబర్‌లను సేకరించము.",
  "I authorize Kaam Card to parse my transaction statement.": "నా లావాదేవీ ప్రకటనను అన్వయించడానికి నేను కామ్ కార్డ్‌కి అధికారం ఇస్తున్నాను.",
  "Your data stays in this browser session. We do not ask for Aadhaar, PAN, or bank account numbers.": "ఈ బ్రౌజర్ సెషన్‌లో మీ డేటా అలాగే ఉంటుంది. మేము ఆధార్, పాన్ లేదా బ్యాంక్ ఖాతా నంబర్లను అడగము.",
  "Use a CSV with date, amount, direction. Links inside files are treated as plain text.": "తేదీ, మొత్తం, దిశతో కూడిన CSVని ఉపయోగించండి. ఫైల్‌లలోని లింక్‌లు సాదా వచనంగా పరిగణించబడతాయి.",
  "Tap to upload CSV": "CSVని అప్‌లోడ్ చేయడానికి నొక్కండి",
  "or drag and drop. CSV only, up to 5 MB.": "లేదా డ్రాగ్ అండ్ డ్రాప్. CSV మాత్రమే, గరిష్టంగా 5 MB.",
  "Basic details for matching": "సరిపోలిక కోసం ప్రాథమిక వివరాలు",
  "Age": "వయస్సు",
  "Occupation": "వృత్తి",
  "State": "రాష్ట్రం",
  "Sample datasets": "నమూనా డేటాసెట్‌లు",
  "Choose Bank Statement Dataset": "బ్యాంక్ స్టేట్‌మెంట్ డేటాసెట్‌ని ఎంచుకోండి",
  "Continue to dashboard": "డాష్‌బోర్డ్‌కి కొనసాగించండి",
  "Welcome, Worker": "స్వాగతం, కార్మికుడు",
  "This dashboard tracks your calculated income averages and verifies matching state schemes.": "ఈ డ్యాష్‌బోర్డ్ మీ లెక్కించిన ఆదాయ సగటులను ట్రాక్ చేస్తుంది మరియు సరిపోలే రాష్ట్ర పథకాలను ధృవీకరిస్తుంది.",
  "Daily earnings trend and variations": "రోజువారీ ఆదాయ ధోరణి మరియు వైవిధ్యాలు",
  "Daily Avg": "రోజువారీ సగటు",
  "Good Days": "మంచి రోజులు",
  "Bad Days": "చెడ్డ రోజులు",
  "Smart Suggestion": "స్మార్ట్ సూచన",
  "Arithmetic-based micro-savings rule": "గణిత ఆధారిత మైక్రో-పొదుపు నియమం",
  "Tied to your actual data, this habit will accumulate about": "మీ వాస్తవ డేటాతో ముడిపడి ఉంటే, ఈ అలవాటు దాదాపుగా పేరుకుపోతుంది",
  "low-income days.": "తక్కువ ఆదాయం ఉన్న రోజులు.",
  "on days earning above": "పైన సంపాదించే రోజుల్లో",
  "Save Rs": "రూ. ఆదా చేయండి",
  "and cover up to": "మరియు వరకు కవర్",
  "Welfare Matching": "సంక్షేమ సరిపోలిక",
  "Search matched schemes": "సరిపోలిన పథకాలను శోధించండి",
  "Type scheme name...": "పథకం పేరు రకం...",
  "Knowledge Resources": "జ్ఞాన వనరులు",
  "Local Security Audit Trail": "లోకల్ సెక్యూరిటీ ఆడిట్ ట్రైల్",
  "Guide me & Apply": "నాకు మార్గనిర్దేశం చేయండి & దరఖాస్తు చేయండి",
  "Eligible public schemes": "అర్హులైన ప్రజా పథకాలు",
  "matched": "సరిపోయింది",
  "low-income days": "తక్కువ ఆదాయం ఉన్న రోజులు",
  "total parsed credit": "మొత్తం అన్వయించిన క్రెడిట్",
  "Low-income threshold": "తక్కువ-ఆదాయ పరిమితి",
  "Export your secure worker profile": "మీ సురక్షిత కార్యకర్త ప్రొఫైల్‌ను ఎగుమతి చేయండి",
  "Generate a portable summary of your checked parameters. No raw bank records are saved or shared.": "మీరు తనిఖీ చేసిన పారామితుల యొక్క పోర్టబుల్ సారాంశాన్ని రూపొందించండి. ముడి బ్యాంకు రికార్డులు ఏవీ సేవ్ చేయబడవు లేదా భాగస్వామ్యం చేయబడవు.",
  "Generate Profile": "ప్రొఫైల్‌ని రూపొందించండి",
  "Required documents check": "అవసరమైన పత్రాల తనిఖీ",
  "Official Application Steps": "అధికారిక అప్లికేషన్ దశలు",
  "Secure portal verification redirect": "సురక్షిత పోర్టల్ ధృవీకరణ దారి మళ్లింపు",
  "Finish": "ముగించు",
  "Next Step": "తదుపరి దశ",
  "Previous Step": "మునుపటి దశ",
  "Check Documents": "పత్రాలను తనిఖీ చేయండి",
  "Steps & Timeline": "దశలు & కాలక్రమం",
  "Safe Redirect": "సురక్షిత దారిమార్పు",
  "Application Stepper Guide": "అప్లికేషన్ స్టెప్పర్ గైడ్",
  "No documents are uploaded or stored.": "ఏ పత్రాలు అప్‌లోడ్ చేయబడవు లేదా నిల్వ చేయబడవు.",
  "Close": "మూసివేయి",
  "Verified Portal Redirect": "ధృవీకరించబడిన పోర్టల్ దారిమార్పు",
  "Guide": "గైడ్",
  "Docs": "డాక్స్",
  "Steps": "దశలు",
  "Apply": "దరఖాస్తు చేసుకోండి",
  "Back": "వెనుకకు",
  "Step 1: Check Required Documents": "దశ 1: అవసరమైన పత్రాలను తనిఖీ చేయండి",
  "Please check off that you have these documents ready before opening the application portal:": "అప్లికేషన్ పోర్టల్‌ను తెరవడానికి ముందు దయచేసి మీరు ఈ పత్రాలు సిద్ధంగా ఉన్నారో లేదో తనిఖీ చేయండి:",
  "Kaam Card never saves or asks for copy uploads of these documents. Keep them with you locally.": "ఈ పత్రాల కాపీ అప్‌లోడ్‌లను కామ్ కార్డ్ ఎప్పుడూ సేవ్ చేయదు లేదా అడగదు. వాటిని స్థానికంగా మీ దగ్గర ఉంచుకోండి.",
  "Step 2: Step-by-Step Instructions": "దశ 2: దశల వారీ సూచనలు",
  "Follow these steps on the official portal to complete your registration:": "మీ రిజిస్ట్రేషన్‌ను పూర్తి చేయడానికి అధికారిక పోర్టల్‌లో ఈ దశలను అనుసరించండి:",
  "Step 3: Access Official Portal": "దశ 3: అధికారిక పోర్టల్‌ను యాక్సెస్ చేయండి",
  "You are now ready to visit the official website of the": "మీరు ఇప్పుడు అధికారిక వెబ్‌సైట్‌ను సందర్శించడానికి సిద్ధంగా ఉన్నారు",
  "Verified Official Portal": "ధృవీకరించబడిన అధికారిక పోర్టల్",
  "Destination:": "గమ్యం:",
  "Open official portal": "అధికారిక పోర్టల్‌ని తెరవండి",
  "Always confirm the URL ends in .gov.in or .nic.in before submitting any personal information.": "ఏదైనా వ్యక్తిగత సమాచారాన్ని సమర్పించే ముందు .gov.in లేదా .nic.inలో URL ముగుస్తుందని ఎల్లప్పుడూ నిర్ధారించండి.",
  "Atal Pension Yojana": "అటల్ పెన్షన్ యోజన",
  "Pension scheme for unorganized workers providing guaranteed minimum pension of Rs. 1,000 to Rs. 5,000 per month after age 60.": "అసంఘటిత కార్మికులకు పెన్షన్ పథకం హామీ కనీస పెన్షన్ రూ. 1,000 నుండి రూ. 5,000 వరకు 60 ఏళ్ల తర్వాత నెలకు.",
  "e-Shram Registration": "ఇ-శ్రమ్ నమోదు",
  "National database for unorganized workers to facilitate social security benefits and direct benefit transfers.": "సామాజిక భద్రతా ప్రయోజనాలు మరియు ప్రత్యక్ష ప్రయోజనాల బదిలీలను సులభతరం చేయడానికి అసంఘటిత కార్మికుల కోసం జాతీయ డేటాబేస్.",
  "Pradhan Mantri Shram Yogi Maan-dhan": "ప్రధాన మంత్రి శ్రమ యోగి మాన్-ధన్",
  "Voluntary pension scheme for unorganized workers with monthly contribution matching by Central Government.": "అసంఘటిత కార్మికులకు స్వచ్ఛంద పెన్షన్ స్కీమ్ కేంద్ర ప్రభుత్వంచే నెలవారీ కంట్రిబ్యూషన్ మ్యాచింగ్.",
  "Ayushman Bharat PM-JAY": "ఆయుష్మాన్ భారత్ PM-JAY",
  "Free health insurance coverage up to Rs. 5 Lakhs per family per year for secondary and tertiary care hospitalization.": "రూ. 5 లక్షల వరకు ఉచిత ఆరోగ్య బీమా కవరేజీ ప్రతి కుటుంబానికి సంవత్సరానికి సెకండరీ మరియు తృతీయ కేర్ ఆసుపత్రిలో చేరడానికి.",
  "PM SVANidhi Scheme": "PM స్వనిధి పథకం",
  "Special micro-credit facility for street vendors to access affordable working capital loans for business revival.": "వ్యాపార పునరుద్ధరణ కోసం సరసమైన వర్కింగ్ క్యాపిటల్ రుణాలను పొందేందుకు స్ట్రీట్ వెండర్ల కోసం ప్రత్యేక మైక్రో-క్రెడిట్ సౌకర్యం.",
  "Delivery Partner, Delhi": "డెలివరీ పార్టనర్, ఢిల్లీ",
  "Cab Driver, Mumbai": "క్యాబ్ డ్రైవర్, ముంబై",
  "Domestic Worker, Bangalore": "ఇంటి పనివాడు, బెంగళూరు",
  "Need help checking eligibility?": "అర్హతను తనిఖీ చేయడంలో సహాయం కావాలా?",
  "We are dedicated to supporting digital portability for India's gig economy. If you have questions about the pilot or scheme integration, get in touch.": "భారతదేశ గిగ్ ఎకానమీ కోసం డిజిటల్ పోర్టబిలిటీకి మద్దతు ఇవ్వడానికి మేము అంకితభావంతో ఉన్నాము. పైలట్ లేదా స్కీమ్ ఇంటిగ్రేషన్ గురించి మీకు ఏవైనా ప్రశ్నలు ఉంటే, సంప్రదించండి.",
  "Toll-free Helpdesk: 1800-11-0031 (Demo)": "టోల్-ఫ్రీ హెల్ప్‌డెస్క్: 1800-11-0031 (డెమో)",
  "Features": "ఫీచర్లు",
  "Process": "ప్రక్రియ",
  "Reviews": "సమీక్షలు",
  "Contact": "సంప్రదించండి",
  "Empowering Indian gig workers with portable data identity.": "పోర్టబుల్ డేటా గుర్తింపుతో భారతీయ గిగ్ వర్కర్లకు సాధికారత కల్పించడం.",
  "Product": "ఉత్పత్తి",
  "Testimonials": "టెస్టిమోనియల్స్",
  "Support": "మద్దతు",
  "Email": "ఇమెయిల్",
  "Legal": "చట్టపరమైన",
  "Privacy": "గోప్యత",
  "Terms": "నిబంధనలు",
  "or": "లేదా",
  "Select Language": "భాషను ఎంచుకోండి",
  "English": "ఆంగ్లం",
  "Hindi": "హిందీ",
  "Tamil": "తమిళం",
  "Telugu": "తెలుగు",
  "Marathi": "మరాఠీ",
  "Country code": "దేశం కోడ్",
  "OTP digits": "OTP అంకెలు",
  "OTP digit 1": "OTP అంకె 1",
  "OTP digit 2": "OTP అంకె 2",
  "OTP digit 3": "OTP అంకె 3",
  "OTP digit 4": "OTP అంకె 4",
  "OTP digit 5": "OTP అంకె 5",
  "OTP digit 6": "OTP అంకె 6",
  "Demo code:": "డెమో కోడ్:",
  "Parse status": "స్థితిని అన్వయించండి",
  "Parsed income rows": "అన్వయించబడిన ఆదాయ వరుసలు",
  "No usable income rows yet": "ఇంకా ఉపయోగించదగిన ఆదాయ వరుసలు లేవు",
  "Rows skipped safely": "అడ్డు వరుసలు సురక్షితంగా దాటవేయబడ్డాయి",
  "We skipped malformed rows instead of crashing.": "మేము క్రాష్ చేయడానికి బదులుగా తప్పుగా ఉన్న అడ్డు వరుసలను దాటవేసాము.",
  "Row": "వరుస",
  "Issue": "సమస్య",
  "Add at least one valid credit/income row to continue.": "కొనసాగించడానికి కనీసం ఒక చెల్లుబాటు అయ్యే క్రెడిట్/ఆదాయ వరుసను జోడించండి.",
  "Analyzed period:": "విశ్లేషించబడిన కాలం:",
  "Eligible public schemes (": "అర్హతగల ప్రజా పథకాలు (",
  " matched)": "సరిపోలింది)",
  "No scheme matches found. Try adjusting search or details.": "పథకం సరిపోలికలు ఏవీ కనుగొనబడలేదు. శోధన లేదా వివరాలను సర్దుబాటు చేయడానికి ప్రయత్నించండి.",
  "Share Summary": "సారాంశాన్ని భాగస్వామ్యం చేయండి",
  "Share summary text": "సారాంశ టెక్స్ట్ షేర్ చేయండి",
  "Session code:": "సెషన్ కోడ్:",
  "Daily income bar chart": "రోజువారీ ఆదాయ బార్ చార్ట్",
  "Eligible": "అర్హులు",
  "Welfare Knowledge & Security Logs": "సంక్షేమ నాలెడ్జ్ & సెక్యూరిటీ లాగ్‌లు",
  "No actions logged yet.": "ఇంకా చర్యలు ఏవీ లాగ్ చేయబడలేదు.",
  "Shareable summary": "భాగస్వామ్యం చేయదగిన సారాంశం",
  "This is a simple text summary for the demo. No raw transactions are included.": "ఇది డెమో కోసం ఒక సాధారణ వచన సారాంశం. ముడి లావాదేవీలు ఏవీ చేర్చబడలేదు.",
  "Copied": "కాపీ చేయబడింది",
  "Copy": "కాపీ చేయండి",
  "Danger Zone": "డేంజర్ జోన్",
  "This will completely clear your parsed income profile and reset the session.": "ఇది మీ అన్వయించబడిన ఆదాయ ప్రొఫైల్‌ను పూర్తిగా క్లియర్ చేస్తుంది మరియు సెషన్‌ను రీసెట్ చేస్తుంది.",
  "Clear & Purge Session Data": "సెషన్ డేటాను క్లియర్ & ప్రక్షాళన చేయండి",
  "Upload": "అప్‌లోడ్ చేయండి",
  "More": "మరిన్ని",
  "Main navigation": "ప్రధాన నావిగేషన్",
  "From phone to dashboard in under 2 minutes": "ఫోన్ నుండి డ్యాష్‌బోర్డ్‌కి 2 నిమిషాలలోపు",
  "Kaam Card navigation": "కామ్ కార్డ్ నావిగేషన్",
  "Language switched to": "భాష మార్చబడింది",
  "Are you sure you want to end your session and delete all parsed data? This cannot be undone.": "మీరు ఖచ్చితంగా మీ సెషన్‌ను ముగించి, అన్వయించిన డేటా మొత్తాన్ని తొలగించాలనుకుంటున్నారా? ఇది రద్దు చేయబడదు.",
  "Something went wrong": "ఏదో తప్పు జరిగింది",
  "The app encountered an unexpected error. Please refresh the page to try again.": "యాప్ ఊహించని లోపాన్ని ఎదుర్కొంది. దయచేసి మళ్లీ ప్రయత్నించడానికి పేజీని రిఫ్రెష్ చేయండి.",
  "Refresh Page": "పేజీని రిఫ్రెష్ చేయండి",
  "Kaam Card summary": "కామ్ కార్డ్ సారాంశం",
  "Phone session:": "ఫోన్ సెషన్:",
  "Average daily income:": "సగటు రోజువారీ ఆదాయం:",
  "Good days:": "మంచి రోజులు:",
  "bad days:": "చెడ్డ రోజులు:",
  "Saving rule: save": "పొదుపు నియమం: సేవ్",
  "on days above": "పైన రోజులలో",
  "Likely schemes:": "సంభావ్య పథకాలు:",
  "No exact match yet": "ఇంకా ఖచ్చితమైన సరిపోలిక లేదు",
  "Demo note: eligibility is simplified and should be verified on the official portal.": "డెమో గమనిక: అర్హత సరళీకృతం చేయబడింది మరియు అధికారిక పోర్టల్‌లో ధృవీకరించబడాలి.",
  "Income Profile": "ఆదాయ ప్రొఫైల్",
  "Daily Average": "రోజువారీ సగటు",
  "Monthly Estimate": "నెలవారీ అంచనా",
  "Low Days": "తక్కువ రోజులు",
  "Savings Recommendation": "పొదుపు సిఫార్సు",
  "Matched Welfare Schemes": "సంక్షేమ పథకాలతో సరిపోయింది",
  "Generated by Kaam Card | Eligibility is simplified, verify on official portals": "కామ్ కార్డ్ ద్వారా రూపొందించబడింది | అర్హత సరళీకృతం చేయబడింది, అధికారిక పోర్టల్‌లలో ధృవీకరించండి",
  "Income": "ఆదాయం",
  "Using Kaam Card took less than 2 minutes. It computed my average daily income and showed me I qualified for PM-SYM pension. I registered the same day!": "కామ్ కార్డ్‌ని ఉపయోగించడానికి 2 నిమిషాల కంటే తక్కువ సమయం పట్టింది. ఇది నా సగటు రోజువారీ ఆదాయాన్ని లెక్కించింది మరియు నేను PM-SYM పెన్షన్‌కు అర్హత సాధించానని నాకు చూపించింది. నేను అదే రోజు నమోదు చేసుకున్నాను!",
  "I always wanted to save but didn't know how much. The good-day surplus savings suggestion helped me set aside money on busy weekends to cover dry weekdays.": "నేను ఎప్పుడూ పొదుపు చేయాలనుకున్నాను కానీ ఎంత అని నాకు తెలియదు. మంచి-రోజు మిగులు పొదుపు సూచన, పొడి వారాంతపు రోజులను కవర్ చేయడానికి బిజీగా ఉన్న వారాంతాల్లో డబ్బును కేటాయించడంలో నాకు సహాయపడింది.",
  "I was worried about sharing bank logs, but Kaam Card's privacy focus is amazing. It runs on my browser and doesn't store my Aadhaar or transaction lists.": "నేను బ్యాంక్ లాగ్‌లను షేర్ చేయడం గురించి ఆందోళన చెందాను, కానీ కామ్ కార్డ్ గోప్యతా దృష్టి అద్భుతంగా ఉంది. ఇది నా బ్రౌజర్‌లో నడుస్తుంది మరియు నా ఆధార్ లేదా లావాదేవీ జాబితాలను నిల్వ చేయదు.",
  "© 2026 Kaam Card.": "© 2026 కామ్ కార్డ్.",
  " of ": "యొక్క ",
  " to ": " కు ",
  "/month": "/నెల",
  "You qualify because your ": "మీరు అర్హులు ఎందుకంటే మీ",
  " and ": " మరియు ",
  "Close match: ": "ముగింపు మ్యాచ్: ",
  "some details match": "కొన్ని వివరాలు సరిపోతాయి",
  ", but ": ", కానీ ",
  "age ": "వయస్సు ",
  " is within ": " లోపల ఉంది ",
  "age must be ": "వయస్సు ఉండాలి ",
  "estimated monthly income is below ": "అంచనా వేసిన నెలవారీ ఆదాయం క్రింద ఉంది ",
  "no income cap holds": "ఆదాయ పరిమితి లేదు",
  "income is above ": "ఆదాయం పైన ఉంది ",
  " is covered": " చేర్చబడింది",
  "occupation must match: ": "వృత్తి సరిపోలాలి: ",
  " state matches": " రాష్ట్రం సరిపోలింది",
  "state must be ": "రాష్ట్రం ఉండాలి ",
  " or ": " లేదా ",
  "Worker ": "కార్మికుడు ",
  "Save ": "సేవ్ చేయండి ",
  " on good days (above ": " మంచి రోజులలో (పైన ",
  ")": ")",
  " | +91 ": " | +91 ",
  "-": "-",
  "CSV needs a header and at least one data row.": "CSVకి హెడర్ మరియు కనీసం ఒక డేటా అడ్డు వరుస అవసరం.",
  "Missing column: ": "నిలువు వరుస లేదు: ",
  "Date is invalid. Use YYYY-MM-DD or DD-MM-YYYY.": "తేదీ చెల్లదు. YYYY-MM-DD లేదా DD-MM-YYYYని ఉపయోగించండి.",
  "Amount is invalid. Use a positive number.": "మొత్తం చెల్లదు. సానుకూల సంఖ్యను ఉపయోగించండి.",
  "Direction must be credit/income or debit/expense.": "దిశ క్రెడిట్/ఆదాయం లేదా డెబిట్/ఖర్చు అయి ఉండాలి.",
  "Please upload a CSV file.": "దయచేసి CSV ఫైల్‌ను అప్‌లోడ్ చేయండి.",
  "Detected format:": "గుర్తించిన ఫార్మాట్:",
  "Expense Summary": "ఖర్చు సారాంశం",
  "Spending breakdown from your statement": "మీ స్టేట్‌మెంట్ నుండి ఖర్చుల విభజన",
  "Total Expenses": "మొత్తం ఖర్చులు",
  "Avg daily": "సగటు రోజువారీ",
  "Top Category": "టాప్ వర్గం",
  "Income Insights": "ఆదాయ అంతర్దృష్టులు",
  "Income Stability": "ఆదాయ స్థిరత్వం",
  "Stability score based on income variance": "ఆదాయ వ్యత్యాసం ఆధారంగా స్థిరత్వ స్కోర్",
  "Daily Income": "రోజువారీ ఆదాయం",
  "Weekly Breakdown": "వీక్లీ బ్రేక్‌డౌన్",
  "Income trend week by week": "వారం వారీగా ఆదాయ ధోరణి",
  "Income vs Expenses": "ఆదాయం vs ఖర్చులు",
  "How your earnings compare to spending": "మీ ఆదాయం మరియు ఖర్చుల పోలిక",
  "Expense Ratio": "ఖర్చు నిష్పత్తి",
  "Savings Projection": "పొదుపు అంచనా",
  "Project your savings forward": "మీ పొదుపును ముందుకు ప్రొజెక్ట్ చేయండి",
  "Monthly": "నెలవారీ",
  "3 Months": "3 నెలలు",
  "6 Months": "6 నెలలు",
  "This will cover up to": "ఇది వరకు కవర్ చేస్తుంది",
  "low-income days per month.": "నెలకు తక్కువ ఆదాయ రోజులు.",
  "Range": "పరిధి",
  "above": "పైన",
  "below": "కింద",
  "No Income": "ఆదాయం లేదు",
  "File is larger than 5 MB.": "ఫైల్ 5 MB కంటే పెద్దది.",
  "Log Out": "లాగ్ అవుట్ చేయండి",
  "Kaam Card - ": "కామ్ కార్డ్ -",
  "worker": "కార్మికుడు",
  "friend": "స్నేహితుడు",
  "Uploaded files": "కామ్ కార్డ్ - ",
  "Upload a CSV or bank statement PDF. Links inside files are treated as plain text.": "కార్మికుడు",
  "Tap to upload CSV or PDF": "స్నేహితుడు",
  "or drag and drop. CSV or PDF, up to 5 MB.": "అప్‌లోడ్ చేసిన ఫైల్‌లు",
  "Manual income entry": "CSV లేదా బ్యాంక్ స్టేట్‌మెంట్ PDFని అప్‌లోడ్ చేయండి. ",
  "Date": "ఫైల్‌లలోని లింక్‌లు సాదా వచనంగా పరిగణించబడతాయి.",
  "Amount": "CSV లేదా PDFని అప్‌లోడ్ చేయడానికి నొక్కండి",
  "Source": "లేదా డ్రాగ్ అండ్ డ్రాప్. ",
  "Platform credit": "CSV లేదా PDF, గరిష్టంగా 5 MB.",
  "Bank transfer": "మాన్యువల్ ఆదాయ ప్రవేశం",
  "Add entry": "తేదీ",
  "Remove entry": "ఎంట్రీని తీసివేయండి",
  "Cash": "నగదు",
  "rows": "వరుసలు",
  "Budget": "బడ్జెట్",
  "documents ready": "పత్రాలు సిద్ధంగా ఉన్నాయి",
  "Loan Eligibility": "రుణ అర్హత",
  "loan options available": "రుణ ఎంపికలు అందుబాటులో ఉన్నాయి",
  "No loans match your profile": "మీ ప్రొఫైల్‌కు సరిపోలే రుణాలు లేవు",
  "Try adjusting your details or uploading more income data to improve eligibility.": "అర్హతను మెరుగుపరచడానికి మీ వివరాలను సర్దుబాటు చేయడానికి లేదా మరింత ఆదాయ డేటాను అప్‌లోడ్ చేయడానికి ప్రయత్నించండి.",
  "Up to": "వరకు",
  "Tax Estimation": "పన్ను అంచనా",
  "Estimated annual tax liability": "అంచనా వేసిన వార్షిక పన్ను బాధ్యత",
  "Annual income": "వార్షిక ఆదాయం",
  "Estimated tax": "అంచనా వేసిన పన్ను",
  "Net income after tax": "పన్ను తర్వాత నికర ఆదాయం",
  "Effective tax rate": "ప్రభావవంతమైన పన్ను రేటు",
  "This is a simplified estimate. Consult a CA for accurate tax planning.": "ఇది సరళీకృత అంచనా. ",
  "Claim": "ఖచ్చితమైన పన్ను ప్రణాళిక కోసం CA ని సంప్రదించండి.",
  "Claim Documents": "దావా వేయండి",
  "Step 3: Claim Documents": "దావా పత్రాలు",
  "Step 4: File a Claim": "దశ 3: పత్రాలను క్లెయిమ్ చేయండి",
  "Prepare these documents if you need to file a claim:": "దశ 4: దావా వేయండి",
  "Follow these steps to file a claim on the official portal:": "మీరు దావా వేయాలంటే ఈ పత్రాలను సిద్ధం చేయండి:",
  "Policy document / enrollment number": "అధికారిక పోర్టల్‌లో దావా వేయడానికి ఈ దశలను అనుసరించండి:",
  "Claim form (download from portal)": "విధాన పత్రం / నమోదు సంఖ్య",
  "Supporting documents (hospital bills / death certificate)": "దావా ఫారమ్ (పోర్టల్ నుండి డౌన్‌లోడ్ చేయండి)",
  "Download the claim form from the official portal.": "సహాయక పత్రాలు (ఆసుపత్రి బిల్లులు / మరణ ధృవీకరణ పత్రం)",
  "Fill in the policyholder details and policy number.": "అధికారిక పోర్టల్ నుండి దావా ఫారమ్‌ను డౌన్‌లోడ్ చేయండి.",
  "Attach all required supporting documents.": "పాలసీదారు వివరాలను మరియు పాలసీ నంబర్‌ను పూరించండి.",
  "Submit the form at the nearest branch or online portal.": "అవసరమైన అన్ని సహాయక పత్రాలను అటాచ్ చేయండి.",
  "Track claim status using the acknowledgment number.": "రసీదు సంఖ్యను ఉపయోగించి క్లెయిమ్ స్థితిని ట్రాక్ చేయండి.",
  "Skip": "దాటవేయి",
  "Next": "తదుపరి",
  "Welcome to Kaam Card": "కామ్ కార్డ్‌కి స్వాగతం",
  "This is your dashboard. Here you'll see your income analysis, savings recommendations, and welfare scheme matches.": "ఇది మీ డ్యాష్‌బోర్డ్. ",
  "Your daily earnings chart shows good days and bad days, helping you understand your income patterns.": "ఇక్కడ మీరు మీ ఆదాయ విశ్లేషణ, పొదుపు సిఫార్సులు మరియు సంక్షేమ పథకాల సరిపోలికలను చూస్తారు.",
  "Use the smart savings suggestion and check which government schemes you qualify for.": "మీ రోజువారీ ఆదాయాల చార్ట్ మీ ఆదాయ విధానాలను అర్థం చేసుకోవడంలో మీకు మంచి రోజులు మరియు చెడు రోజులను చూపుతుంది.",
  "Tap Upload to add more statements or manual entries anytime.": "స్మార్ట్ సేవింగ్స్ సూచనను ఉపయోగించండి మరియు మీరు ఏ ప్రభుత్వ పథకాలకు అర్హత పొందారో తనిఖీ చేయండి.",
  "Remove": "ఎప్పుడైనా మరిన్ని స్టేట్‌మెంట్‌లు లేదా మాన్యువల్ ఎంట్రీలను జోడించడానికి అప్‌లోడ్ నొక్కండి.",
  "Please upload a CSV or PDF file.": "తొలగించు",
  "Bank PDF": "దయచేసి CSV లేదా PDF ఫైల్‌ను అప్‌లోడ్ చేయండి.",
  "Ration card": "బ్యాంక్ PDF",
  "Voter ID": "రేషన్ కార్డు",
  "Driving license": "ఓటరు ID",
  "Income certificate": "డ్రైవింగ్ లైసెన్స్",
  "Minimum age": "ఆదాయ ధృవీకరణ పత్రం",
  "Maximum age": "కనీస వయస్సు",
  "Minimum monthly income": "గరిష్ట వయస్సు",
  "Income must be below": "కనీస నెలవారీ ఆదాయం",
  "Occupation must be": "ఆదాయం తక్కువగా ఉండాలి",
  "State must be": "వృత్తి ఉండాలి",
  "Monthly income": "రాష్ట్రం ఉండాలి",
  "Income stability": "నెలవారీ ఆదాయం",
  "Listen": "వినండి",
  "UPI": "UPI",
  "Manual": "మాన్యువల్",
  "Generic CSV": "సాధారణ CSV",
  "Google Pay": "Google Pay",
  "PhonePe": "PhonePe",
  "PayTM": "PayTM",
  "High": "అధిక",
  "Medium": "మధ్యస్థ",
  "Low": "తక్కువ",
  "High Contrast": "అధిక కాంట్రాస్ట్",
  "Voice Input": "వాయిస్ ఇన్‌పుట్",
  "Screen Reader": "స్క్రీన్ రీడర్",
  "Enable High Contrast": "అధిక కాంట్రాస్ట్‌ని ప్రారంభించండి",
  "Disable High Contrast": "అధిక కాంట్రాస్ట్‌ని నిలిపివేయండి",
  "Enable Voice Input": "వాయిస్ ఇన్‌పుట్‌ని ప్రారంభించండి",
  "Disable Voice Input": "వాయిస్ ఇన్‌పుట్‌ని నిలిపివేయండి",
  "High contrast enabled": "అధిక కాంట్రాస్ట్ ప్రారంభించబడింది",
  "High contrast disabled": "అధిక కాంట్రాస్ట్ నిలిపివేయబడింది",
  "Voice input enabled": "వాయిస్ ఇన్‌పుట్ ప్రారంభించబడింది",
  "Voice input disabled": "వాయిస్ ఇన్‌పుట్ నిలిపివేయబడింది",
  "Tap to speak": "మాట్లాడటానికి నొక్కండి",
  "Listening...": "వింటూ...",
  "PM Shram Yogi Maandhan": "PM శ్రమ యోగి మంధన్",
  "e-Shram": "ఇ-శ్రామ్",
  "PM Jeevan Jyoti Bima Yojana": "ప్రధానమంత్రి జీవన్ జ్యోతి బీమా యోజన",
  "PM Suraksha Bima Yojana": "ప్రధానమంత్రి సురక్ష బీమా యోజన",
  "Delhi Construction Workers Welfare Board": "ఢిల్లీ భవన నిర్మాణ కార్మికుల సంక్షేమ బోర్డు",
  "Pension support after age 60": "60 ఏళ్ల తర్వాత పెన్షన్ మద్దతు",
  "National registration for unorganised workers": "అసంఘటిత కార్మికులకు జాతీయ నమోదు",
  "Health cover for low-income families": "తక్కువ ఆదాయ కుటుంబాలకు ఆరోగ్య రక్షణ",
  "Life insurance cover": "జీవిత బీమా కవర్",
  "Accident insurance cover": "ప్రమాద బీమా రక్షణ",
  "Welfare benefits for registered construction workers": "నమోదిత నిర్మాణ కార్మికులకు సంక్షేమ ప్రయోజనాలు",
  "Maharashtra Building & Other Construction Workers Welfare Board": "మహారాష్ట్ర బిల్డింగ్ & ఇతర నిర్మాణ కార్మికుల సంక్షేమ బోర్డు",
  "Karnataka Unorganised Workers Social Security Board": "కర్ణాటక అసంఘటిత కార్మికుల సామాజిక భద్రతా బోర్డు",
  "Tamil Nadu Manual Workers Welfare Board": "తమిళనాడు మాన్యువల్ వర్కర్స్ వెల్ఫేర్ బోర్డు",
  "Uttar Pradesh Building & Other Construction Workers Welfare Board": "ఉత్తర ప్రదేశ్ బిల్డింగ్ & ఇతర నిర్మాణ కార్మికుల సంక్షేమ బోర్డు",
  "West Bengal Unorganised Sector Workers Welfare Board": "పశ్చిమ బెంగాల్ అసంఘటిత రంగ కార్మికుల సంక్షేమ బోర్డు",
  "Rajasthan Building & Other Construction Workers Welfare Board": "రాజస్థాన్ బిల్డింగ్ & ఇతర నిర్మాణ కార్మికుల సంక్షేమ బోర్డు",
  "Gujarat Building & Other Construction Workers Welfare Board": "గుజరాత్ బిల్డింగ్ & ఇతర నిర్మాణ కార్మికుల సంక్షేమ బోర్డు",
  "Madhya Pradesh Building & Other Construction Workers Welfare Board": "మధ్యప్రదేశ్ బిల్డింగ్ & ఇతర నిర్మాణ కార్మికుల సంక్షేమ బోర్డు",
  "Bihar Unorganised Workers Social Security Board": "బీహార్ అసంఘటిత కార్మికుల సామాజిక భద్రతా బోర్డు",
  "Odisha Unorganised Workers Welfare Board": "ఒడిశా అసంఘటిత కార్మికుల సంక్షేమ బోర్డు",
  "PM SVANidhi": "పిఎమ్ స్వనిధి",
  "PM MUDRA Yojana (Shishu)": "ప్రధాన మంత్రి ముద్ర యోజన (శిశు)",
  "Janani Suraksha Yojana": "జననీ సురక్ష యోజన",
  "Pradhan Mantri Matru Vandana Yojana": "ప్రధాన మంత్రి మాతృ వందన యోజన",
  "Ayushman Bharat Health Account (ABHA)": "ఆయుష్మాన్ భారత్ హెల్త్ అకౌంట్ (ABHA)",
  "NPS Vatsalya": "NPS వాత్సల్య",
  "PM Kaushal Vikas Yojana (PMKVY)": "PM కౌశల్ వికాస్ యోజన (PMKVY)",
  "Stand-Up India": "స్టాండ్-అప్ ఇండియా",
  "Ekta Mall (PM SVANidhi Extension)": "ఏక్తా మాల్ (PM SVANidhi ఎక్స్‌టెన్షన్)",
  "Pension, accident insurance, maternity benefit, death benefit": "పెన్షన్, ప్రమాద బీమా, ప్రసూతి ప్రయోజనం, మరణ ప్రయోజనం",
  "Pension, accident cover, tool kit assistance, skill training": "పెన్షన్, ప్రమాద కవర్, టూల్ కిట్ సహాయం, నైపుణ్య శిక్షణ",
  "Pension, accident insurance, marriage assistance, education grant": "పెన్షన్, ప్రమాద బీమా, వివాహ సహాయం, విద్య మంజూరు",
  "Pension, health insurance, disability cover, death benefit": "పెన్షన్, ఆరోగ్య బీమా, అంగవైకల్యం, మరణ ప్రయోజనం",
  "Pension, accident insurance, health cover, scholarship": "పెన్షన్, ప్రమాద బీమా, ఆరోగ్య రక్షణ, స్కాలర్‌షిప్",
  "Collateral-free working capital loan up to ₹50,000 for street vendors": "వీధి వ్యాపారులకు ₹50,000 వరకు కొలేటరల్ రహిత వర్కింగ్ క్యాపిటల్ లోన్",
  "Guaranteed pension ₹1,000-5,000/month after age 60": "60 ఏళ్ల తర్వాత నెలకు ₹1,000-5,000 హామీ పెన్షన్",
  "Micro loan up to ₹50,000 for small business": "చిన్న వ్యాపారం కోసం ₹50,000 వరకు సూక్ష్మ రుణం",
  "Cash assistance for institutional delivery": "సంస్థాగత డెలివరీ కోసం నగదు సహాయం",
  "₹5,000 cash incentive for first live birth": "మొదటి లైవ్ బర్త్ కోసం ₹5,000 నగదు ప్రోత్సాహకం",
  "Digital health ID for seamless healthcare access": "అతుకులు లేని ఆరోగ్య సంరక్షణ యాక్సెస్ కోసం డిజిటల్ హెల్త్ ID",
  "Pension account for minors, converts to regular NPS at 18": "మైనర్లకు పెన్షన్ ఖాతా, 18 వద్ద సాధారణ NPSకి మారుతుంది",
  "Free skill training with certification and placement support": "ధృవీకరణ మరియు ప్లేస్‌మెంట్ మద్దతుతో ఉచిత నైపుణ్య శిక్షణ",
  "Bank loan ₹10 lakh - ₹1 crore for SC/ST/Women entrepreneurs": "SC/ST/మహిళా వ్యాపారవేత్తలకు బ్యాంక్ లోన్ ₹10 లక్షలు - ₹1 కోట్లు",
  "E-commerce platform for street vendors to sell online": "వీధి వ్యాపారులు ఆన్‌లైన్‌లో విక్రయించడానికి ఇ-కామర్స్ ప్లాట్‌ఫారమ్",
  "MUDRA Loan (Shishu)": "ముద్ర లోన్ (శిశు)",
  "Micro Enterprise Loan": "మైక్రో ఎంటర్‌ప్రైజ్ లోన్",
  "Working capital loan up to ₹10,000 for street vendors, repayable in monthly installments.": "వీధి వ్యాపారులకు ₹10,000 వరకు వర్కింగ్ క్యాపిటల్ లోన్, నెలవారీ వాయిదాలలో తిరిగి చెల్లించబడుతుంది.",
  "Loans up to ₹50,000 for income-generating activities in non-corporate small business sector.": "కార్పొరేట్ యేతర చిన్న వ్యాపార రంగంలో ఆదాయాన్ని పెంచే కార్యకలాపాల కోసం ₹50,000 వరకు రుణాలు.",
  "Small business loan for informal workers to expand livelihood activities.": "జీవనోపాధి కార్యకలాపాలను విస్తరించేందుకు అనధికారిక కార్మికులకు చిన్న వ్యాపార రుణం.",
  "PAN Card": "పాన్ కార్డ్",
  "Bank account passbook": "బ్యాంక్ ఖాతా పాస్ బుక్",
  "Savings bank account passbook": "సేవింగ్స్ బ్యాంక్ ఖాతా పాస్‌బుక్",
  "Bank account details": "బ్యాంక్ ఖాతా వివరాలు",
  "Mobile number linked with Aadhaar": "మొబైల్ నంబర్ ఆధార్‌తో లింక్ చేయబడింది",
  "Show QR Code": "QR కోడ్‌ని చూపించు",
  "Worker Card QR Code": "వర్కర్ కార్డ్ QR కోడ్",
  "Scan to share your Kaam Card profile": "మీ కామ్ కార్డ్ ప్రొఫైల్‌ను షేర్ చేయడానికి స్కాన్ చేయండి",
  "Expires in 24 hours": "24 గంటల్లో గడువు ముగుస్తుంది",
  "Download QR": "QRని డౌన్‌లోడ్ చేయండి",
  "Export Card (HTML)": "ఎగుమతి కార్డ్ (HTML)",
  "Save as PDF": "PDFగా సేవ్ చేయండి",
  "Share via App": "యాప్ ద్వారా షేర్ చేయండి",
  "Kaam Card Summary": "కామ్ కార్డ్ సారాంశం",
  "Open the official verified portal.": "అధికారిక ధృవీకరించబడిన పోర్టల్‌ను తెరవండి.",
  "Verify using Aadhaar-linked OTP.": "ఆధార్-లింక్ చేయబడిన OTPని ఉపయోగించి ధృవీకరించండి.",
  "Submit your occupation details and get registered.": "మీ వృత్తి వివరాలను సమర్పించి నమోదు చేసుకోండి.",
  "Upload a statement to see spending breakdown": "ఖర్చుల విభజనను చూడటానికి స్టేట్‌మెంట్‌ను అప్‌లోడ్ చేయండి",
  "Upload a bank statement to get automatic expense categorization and budgeting insights.": "ఆటోమేటిక్ ఖర్చు వర్గీకరణ మరియు బడ్జెట్ అంతర్దృష్టులను పొందడానికి బ్యాంక్ స్టేట్‌మెంట్‌ను అప్‌లోడ్ చేయండి.",

  "Application Deadlines": "దరఖాస్తు గడువులు",
  "Upcoming scheme application deadlines": "రాబోయే పథకం దరఖాస్తు గడువులు",
  "No upcoming deadlines right now": "ప్రస్తుతం రాబోయే గడువులు ఏవీ లేవు",
  "Check back later for scheme application deadlines.": "పథకం దరఖాస్తు గడువుల కోసం తర్వాత తనిఖీ చేయండి.",
  "Deadlines are indicative. Verify on official portals.": "గడువులు సూచించదగినవి. అధికారిక పోర్టల్‌లలో ధృవీకరించండి.",
  "days left": "రోజులు మిగిలి ఉన్నాయి",
  "Smart Tips": "స్మార్ట్ చిట్కాలు",
  "Personalized financial guidance": "వ్యక్తిగతీకరించిన ఆర్థిక మార్గదర్శకత్వం",
  "Track your saving targets": "మీ పొదుపు లక్ష్యాలను ట్రాక్ చేయండి",
  "Set a saving target": "పొదుపు లక్ష్యాన్ని సెట్ చేయండి",
  "Add Goal": "లక్ష్యాన్ని జోడించండి",
  "Create First Goal": "మొదటి లక్ష్యాన్ని సృష్టించండి",
  "Knowledge & Logs": "జ్ఞానం & లాగ్‌లు",
  "Create a goal to save for emergencies, festivals, or big purchases.": "అత్యవసరాలు, పండుగలు లేదా పెద్ద కొనుగోళ్ల కోసం పొదుపు చేయడానికి ఒక లక్ష్యాన్ని సృష్టించండి.",
  "Government of India": "భారత ప్రభుత్వం",
  "Welfare benefits, pension, accident cover for construction workers": "నిర్మాణ కార్మికులకు సంక్షేమ ప్రయోజనాలు, పెన్షన్, ప్రమాద కవరేజ్",
  "Pension, health insurance, accident cover for unorganised workers": "వ్యవస్థీకృతం కాని కార్మికులకు పెన్షన్, ఆరోగ్య బీమా, ప్రమాద కవరేజ్",
  "Pension, family pension, education assistance, accident relief": "పెన్షన్, కుటుంబ పెన్షన్, విద్యా సహాయం, ప్రమాద ఉపశమనం",
  "Pension, health scheme, death benefit, education grant": "పెన్షన్, ఆరోగ్య పథకం, మరణ ప్రయోజనం, విద్య మంజూరు",
  "Pension, accident insurance, maternity benefit, scholarship": "పెన్షన్, ప్రమాద బీమా, ప్రసూతి ప్రయోజనం, స్కాలర్‌షిప్",
  "Check which government schemes you qualify for based on your profile and income.": "మీ ప్రొఫైల్ మరియు ఆదాయం ఆధారంగా మీరు ఏ ప్రభుత్వ పథకాలకు అర్హులో తనిఖీ చేయండి.",
  "Keep track of upcoming scheme deadlines so you never miss an application window.": "రాబోయే పథకం గడువులను ట్రాక్ చేయండి, తద్వారా మీరు దరఖాస్తు విండోను కోల్పోరు.",
  "Set personal saving targets for emergencies, festivals, or big purchases.": "అత్యవసరాలు, పండుగలు లేదా పెద్ద కొనుగోళ్ల కోసం వ్యక్తిగత పొదుపు లక్ష్యాలను సెట్ చేయండి.",
  "The savings card shows how much to save on good days to cover low-income days automatically.": "సేవింగ్స్ కార్డ్ తక్కువ ఆదాయ రోజులను స్వయంచాలకంగా కవర్ చేయడానికి మంచి రోజులలో ఎంత పొదుపు చేయాలో చూపిస్తుంది.",
  "Track your spending by category and set budgets to stay in control.": "వర్గం వారీగా మీ ఖర్చులను ట్రాక్ చేయండి మరియు నియంత్రణలో ఉండటానికి బడ్జెట్‌లను సెట్ చేయండి.",
  "Generate a portable summary of your verified profile to share with employers or schemes.": "యజమానులు లేదా పథకాలతో భాగస్వామ్యం చేయడానికి మీ ధృవీకరించబడిన ప్రొఫైల్ యొక్క పోర్టబుల్ సారాంశాన్ని రూపొందించండి.",
  "Your daily earnings chart shows good days and bad days, helping you understand your income patterns.": "మీ రోజువారీ ఆదాయాల చార్ట్ మంచి రోజులు మరియు చెడు రోజులను చూపిస్తుంది, మీ ఆదాయ నమూనాలను అర్థం చేసుకోవడంలో మీకు సహాయపడుతుంది.",
  "Schemes": "పథకాలు",
  "Messy CSV": "గజిబిజి CSV",
  // 2026-08-04: Missing keys (translated)
  "Analyzed period": "విశ్లేషించబడిన కాలం",
  "Category Dominance": "వర్గం ఆధిపత్యం",
  "Close menu": "మెనుని మూసివేయండి",
  "Create a goal (e.g., \"Emergency Fund ₹10,000\") to stay motivated. The app will calculate your daily target.": "ప్రేరణతో ఉండేందుకు ఒక లక్ష్యాన్ని (ఉదా., \"అత్యవసర నిధి ₹10,000\") సృష్టించండి. యాప్ మీ రోజువారీ లక్ష్యాన్ని లెక్కిస్తుంది.",
  "Daily earnings trend": "రోజువారీ ఆదాయాల ట్రెండ్",
  "Documents": "పత్రాలు",
  "Download PDF / Print": "PDF / ప్రింట్ డౌన్‌లోడ్ చేయండి",
  "Goal name (e.g., Emergency Fund, Festival, Vehicle):": "లక్ష్యం పేరు (ఉదా., అత్యవసర నిధి, పండుగ, వాహనం):",
  "Good Day Advantage": "మంచి రోజు ప్రయోజనం",
  "High Expense Ratio": "అధిక వ్యయ నిష్పత్తి",
  "High Income Volatility": "అధిక ఆదాయ అస్థిరత",
  "In 3 months": "3 నెలల్లో",
  "In 6 months": "6 నెలల్లో",
  "Look for cheaper alternatives or set a budget.": "చౌకైన ప్రత్యామ్నాయాల కోసం చూడండి లేదా బడ్జెట్‌ను సెట్ చేయండి.",
  "Low Monthly Savings": "తక్కువ నెలవారీ పొదుపులు",
  "Low-income threshold:": "తక్కువ ఆదాయ పరిమితి:",
  "Moderate Expense Ratio": "మితమైన వ్యయ నిష్పత్తి",
  "Monthly saving": "నెలవారీ పొదుపు",
  "No Budgets Set": "బడ్జెట్‌లు సెట్ చేయబడలేదు",
  "OTP sent via SMS": "OTP SMS ద్వారా పంపబడింది",
  "OTP sent via SMS. Check your phone for the 6-digit code.": "OTP SMS ద్వారా పంపబడింది. 6-అంకెల కోడ్ కోసం మీ ఫోన్‌ని తనిఖీ చేయండి.",
  "Open menu": "మెనుని తెరవండి",
  "Other": "ఇతర",
  "Over 40% of expenses go to": "40% పైగా ఖర్చులు వెళ్తాయి",
  "Projected monthly savings under ₹500. Even ₹50/day on good days builds emergency fund.": "అంచనా వేసిన నెలవారీ పొదుపు ₹500లోపు. మంచి రోజుల్లో రోజుకు ₹50 కూడా అత్యవసర నిధిని నిర్మిస్తుంది.",
  "QR Code": "QR కోడ్",
  "Savings Goals": "పొదుపు లక్ష్యాలు",
  "Set a Savings Goal": "పొదుపు లక్ష్యాన్ని సెట్ చేయండి",
  "Set monthly budgets per category to track spending. Start with your top 3 categories.": "ఖర్చును ట్రాక్ చేయడానికి ఒక్కో వర్గానికి నెలవారీ బడ్జెట్‌లను సెట్ చేయండి. మీ టాప్ 3 కేటగిరీలతో ప్రారంభించండి.",
  "Smart Savings": "స్మార్ట్ పొదుపు",
  "Spending 70-90% of income leaves little buffer. Try the 50/30/20 rule: needs/wants/savings.": "ఆదాయంలో 70-90% ఖర్చు చేయడం వల్ల తక్కువ బఫర్ మిగిలి ఉంటుంది. 50/30/20 నియమాన్ని ప్రయత్నించండి: అవసరాలు/కోరికలు/పొదుపులు.",
  "Tap anywhere to skip": "దాటవేయడానికి ఎక్కడైనా నొక్కండి",
  "Target amount (₹):": "లక్ష్యం మొత్తం (₹):",
  "Target date (YYYY-MM-DD, optional):": "లక్ష్య తేదీ (YYYY-MM-DD, ఐచ్ఛికం):",
  "Total Income": "మొత్తం ఆదాయం",
  "Use your browser's Print to PDF option to save": "సేవ్ చేయడానికి మీ బ్రౌజర్ యొక్క ప్రింట్ టు PDF ఎంపికను ఉపయోగించండి",
  "Worker:": "కార్మికుడు:",
  "You have more good days than bad. Save aggressively on good days to cover bad ones automatically.": "మీకు చెడు కంటే మంచి రోజులు ఎక్కువ. చెడు వాటిని స్వయంచాలకంగా కవర్ చేయడానికి మంచి రోజులలో దూకుడుగా ఆదా చేయండి.",
  "You're spending over 90% of your income. Review top categories for savings.": "మీరు మీ ఆదాయంలో 90% పైగా ఖర్చు చేస్తున్నారు. పొదుపు కోసం అగ్ర వర్గాలను సమీక్షించండి.",
  "Your daily income varies by more than 50%. Consider building a 2-month expense buffer.": "మీ రోజువారీ ఆదాయం 50% కంటే ఎక్కువ మారుతుంది. 2-నెలల ఖర్చు బఫర్‌ను నిర్మించడాన్ని పరిగణించండి.",
  "on good days": "మంచి రోజులలో",
  "per month": "నెలకు",
  "to": "కు",
};
const TRANSLATIONS_MR = {
  "Kaam Card": "काम कार्ड",
  "Dashboard": "डॅशबोर्ड",
  "Connect Data": "डेटा कनेक्ट करा",
  "Income Analytics": "उत्पन्न विश्लेषण",
  "Welfare Schemes": "कल्याणकारी योजना",
  "General": "सामान्य",
  "Insights": "अंतर्दृष्टी",
  "Secure & Private": "सुरक्षित आणि खाजगी",
  "Parsed locally. Zero network leaks.": "स्थानिकरित्या पार्स केले. शून्य नेटवर्क गळती.",
  "Purge Session Data": "सत्र डेटा साफ करा",
  "Purge Session": "सत्र साफ करा",
  "Export Card": "कार्ड निर्यात करा",
  "Light Mode": "लाइट मोड",
  "Dark Mode": "डार्क मोड",
  "For you": "तुमच्यासाठी",
  "SECURE SANDBOX": "सुरक्षित सँडबॉक्स",
  "LOG IN / START": "लॉग इन / सुरू करा",
  "Create Your Kaam Card": "तुमचे काम कार्ड तयार करा",
  "How it Works": "हे कसे कार्य करते",
  "100% Private: No Aadhaar or PAN stored": "100% खाजगी: आधार किंवा PAN संग्रहित नाही",
  "Safe: In-memory processing": "सुरक्षित: मेमरीमध्ये प्रक्रिया",
  "Go from Platform Earnings to Welfare Benefits in 2 Minutes.": "२ मिनिटांत प्लॅटफॉर्म कमाईपासून कल्याणकारी योजनांपर्यंत जा.",
  "Kaam Card is a portable, secure record for informal and gig workers.": "काम कार्ड हे अनौपचारिक आणि गिग कामगारांसाठी एक पोर्टेबल, सुरक्षित रेकॉर्ड आहे.",
  "Aadhaar Card": "आधार कार्ड",
  "What We Do": "आम्ही काय करतो",
  "Designed for India's Informal Workforce": "भारताच्या अनौपचारिक कामगारांसाठी डिझाइन केलेले",
  "2 min": "२ मिनिटे",
  "Average setup time": "सरासरी सेटअप वेळ",
  "Zero": "शून्य",
  "Data stored on servers": "सर्व्हरवर संग्रहित डेटा",
  "Go from daily wages to safe public welfare benefits": "दैनंदिन मजुरीपासून सुरक्षित सरकारी कल्याणकारी योजनांपर्यंत जा",
  "Verify your eligibility instantly and register on official portals without middleman risk.": "तुमची पात्रता त्वरित सत्यापित करा आणि मध्यस्थाच्या जोखमीशिवाय अधिकृत पोर्टलवर नोंदणी करा.",
  "Verify eligibility & register": "पात्रता सत्यापित करा आणि नोंदणी करा",
  "Punchlist's Quality": "गुणवत्ता आश्वासन",
  "Go from design to build without losing crucial details.": "महत्त्वाचे तपशील न गमावता डिझाइनपासून बांधकामापर्यंत जा.",
  "Security Audit": "सुरक्षा ऑडिट",
  "No data is shared or stored without explicit consent.": "स्पष्ट संमतीशिवाय कोणताही डेटा सामायिक किंवा संग्रहित केला जात नाही.",
  "Why Kaam Card?": "काम कार्ड का?",
  "We help gig workers accumulate data value that is normally locked away in siloed apps.": "आम्ही गिग कामगारांना डेटा मूल्य जमा करण्यात मदत करतो जे सामान्यतः वेगळ्या अ‍ॅप्समध्ये बंद असते.",
  "Understand your earnings variance, good days vs bad days, and average monthly income instantly.": "तुमच्या कमाईतील चढउतार, चांगले दिवस विरुद्ध वाईट दिवस आणि सरासरी मासिक उत्पन्न त्वरित समजून घ्या.",
  "Scheme Matching": "योजना जुळवणी",
  "Automatically match your computed income against real criteria for e-Shram, PM-SYM, PM-JAY, and more.": "e-Shram, PM-SYM, PM-JAY आणि इतरांच्या वास्तविक निकषांशी तुमची गणना केलेली आपोआप जुळवा.",
  "Smart Micro-Savings": "स्मार्ट सूक्ष्म-बचत",
  "Get a mathematically grounded savings rule based on your actual income surplus on high-earning days.": "उच्च-कमाईच्या दिवशी तुमच्या वास्तविक उत्पन्न अधिशेषावर आधारित गणितीय बचत नियम मिळवा.",
  "Three Simple Steps": "तीन सोपी पावले",
  "Secure OTP Login": "सुरक्षित OTP लॉगिन",
  "Enter your phone number to start a secure, isolated sandbox session. No passwords required.": "सुरक्षित, पृथक सँडबॉक्स सत्र सुरू करण्यासाठी तुमचा फोन नंबर प्रविष्ट करा. पासवर्डची आवश्यकता नाही.",
  "Upload Statements": "स्टेटमेंट अपलोड करा",
  "Drop a bank statement or UPI statement CSV. We parse it locally in your browser and discard raw transaction details.": "बँक स्टेटमेंट किंवा UPI स्टेटमेंट CSV टाका. आम्ही ते तुमच्या ब्राउझरमध्ये स्थानिकरित्या पार्स करतो आणि कच्चे व्यवहार तपशील टाकून देतो.",
  "Get Kaam Dashboard": "काम डॅशबोर्ड मिळवा",
  "Instantly check eligible schemes, review savings recommendations, and export your portable worker card.": "पात्र योजना त्वरित तपासा, बचत शिफारशींचे पुनरावलोकन करा आणि तुमचे पोर्टेबल वर्कर कार्ड निर्यात करा.",
  "Loved by Workers": "कामगारांनी आवडलेले",
  "Hear from informal partners who verified their scheme eligibility using Kaam Card.": "काम कार्ड वापरून योजना पात्रता सत्यापित केलेल्या अनौपचारिक भागीदारांचे ऐका.",
  "Log In & Access Portal": "लॉग इन आणि पोर्टल प्रवेश",
  "Start with your mobile number. This demo keeps the session in memory only.": "तुमच्या मोबाइल नंबरने सुरू करा. हे डेमो सत्र फक्त मेमरीमध्ये ठेवते.",
  "Mobile number": "मोबाइल नंबर",
  "Enter mobile number": "मोबाइल नंबर प्रविष्ट करा",
  "Enter 10 digit number to receive a secure OTP verification check.": "सुरक्षित OTP सत्यापन प्राप्त करण्यासाठी 10 अंकी नंबर प्रविष्ट करा.",
  "Send secure OTP link": "सुरक्षित OTP लिंक पाठवा",
  "Continue with sample data": "नमुना डेटासह सुरू ठेवा",
  "OTP Verification": "OTP सत्यापन",
  "OTP sent via server": "सर्व्हरद्वारे पाठवलेले OTP",
  "We sent an OTP to": "आम्ही OTP पाठवले",
  "Any 4 digits will work in this prototype.": "या प्रोटोटाइपमध्ये कोणतेही 4 अंक कार्य करतील.",
  "Verify code": "कोड सत्यापित करा",
  "Verify and continue": "सत्यापित करा आणि सुरू ठेवा",
  "Switch to light theme": "लाइट थीमवर स्विच करा",
  "Switch to dark theme": "डार्क थीमवर स्विच करा",
  "Consent & Authorization": "संमती आणि अधिकार",
  "Kaam Card parses statement details locally to build your portable record. By continuing, you agree to:": "काम कार्ड तुमचा पोर्टेबल रेकॉर्ड तयार करण्यासाठी स्टेटमेंट तपशील स्थानिकरित्या पार्स करते. पुढे चालू ठेवून तुम्ही सहमती देता:",
  "Local Parsing:": "स्थानिक पार्सिंग:",
  "Executed strictly in-browser memory.": "केवळ ब्राउझर मेमरीमध्ये अंमलात आणले.",
  "Data Minimization:": "डेटा कमी करणे:",
  "Raw lines are discarded after daily stats computation.": "दैनिक आकडेवारी गणनेनंतर कच्च्या ओळी टाकून दिल्या जातात.",
  "Zero ID Collection:": "शून्य ID संकलन:",
  "We never collect Aadhaar, PAN, or full bank numbers.": "आम्ही कधीही आधार, PAN किंवा पूर्ण बँक नंबर गोळा करत नाही.",
  "I authorize Kaam Card to parse my transaction statement.": "मी काम कार्डला माझे व्यवहार स्टेटमेंट पार्स करण्यास अधिकृत करतो.",
  "Your data stays in this browser session. We do not ask for Aadhaar, PAN, or bank account numbers.": "तुमचा डेटा याच ब्राउझर सत्रात राहतो. आम्ही आधार, PAN किंवा बँक खाते क्रमांक विचारत नाही.",
  "Use a CSV with date, amount, direction. Links inside files are treated as plain text.": "date, amount, direction असलेले CSV वापरा. फायलीतील लिंक्स सामान्य मजकूर मानल्या जातात.",
  "Tap to upload CSV": "CSV अपलोड करण्यासाठी टॅप करा",
  "or drag and drop. CSV only, up to 5 MB.": "किंवा ड्रॅग आणि ड्रॉप करा. फक्त CSV, 5 MB पर्यंत.",
  "Basic details for matching": "जुळवणीसाठी मूलभूत तपशील",
  "Age": "वय",
  "Occupation": "व्यवसाय",
  "State": "राज्य",
  "Sample datasets": "नमुना डेटासेट",
  "Choose Bank Statement Dataset": "बँक स्टेटमेंट डेटासेट निवडा",
  "Continue to dashboard": "डॅशबोर्डवर सुरू ठेवा",
  "Welcome, Worker": "स्वागत आहे, कामगार",
  "This dashboard tracks your calculated income averages and verifies matching state schemes.": "हे डॅशबोर्ड तुमच्या गणना केलेल्या उत्पन्न सरासरीचा मागोवा घेते आणि जुळणाऱ्या राज्य योजना सत्यापित करते.",
  "Daily earnings trend and variations": "दैनिक कमाईचा कल आणि चढउतार",
  "Daily Avg": "दैनिक सरासरी",
  "Good Days": "चांगले दिवस",
  "Bad Days": "वाईट दिवस",
  "Smart Suggestion": "स्मार्ट सूचना",
  "Arithmetic-based micro-savings rule": "अंकगणित-आधारित सूक्ष्म-बचत नियम",
  "Tied to your actual data, this habit will accumulate about": "तुमच्या वास्तविक डेटाशी जोडलेली, ही सवय जमा करेल अंदाजे",
  "low-income days": "कमी उत्पन्नाचे दिवस",
  "low-income days.": "कमी उत्पन्नाचे दिवस.",
  "on days earning above": "ज्या दिवशी कमाई जास्त आहे",
  "Save Rs": "बचत करा रु",
  "and cover up to": "आणि कव्हर करेल",
  "Welfare Matching": "कल्याण जुळवणी",
  "Search matched schemes": "जुळणाऱ्या योजना शोधा",
  "Type scheme name...": "योजनेचे नाव टाइप करा...",
  "Knowledge Resources": "ज्ञान संसाधने",
  "Local Security Audit Trail": "स्थानिक सुरक्षा ऑडिट ट्रेल",
  "Guide me & Apply": "मार्गदर्शन आणि अर्ज",
  "Eligible public schemes": "पात्र सार्वजनिक योजना",
  "matched": "जुळल्या",
  "total parsed credit": "एकूण पार्स केलेले क्रेडिट",
  "Low-income threshold": "कमी उत्पन्न मर्यादा",
  "Export your secure worker profile": "तुमचे सुरक्षित वर्कर प्रोफाइल निर्यात करा",
  "Generate a portable summary of your checked parameters. No raw bank records are saved or shared.": "तपासलेल्या पॅरामीटर्सचा पोर्टेबल सारांश तयार करा. कोणतेही कच्चे बँक रेकॉर्ड जतन किंवा सामायिक केले जात नाहीत.",
  "Generate Profile": "प्रोफाइल तयार करा",
  "Required documents check": "आवश्यक कागदपत्रे तपासा",
  "Official Application Steps": "अधिकृत अर्ज पायऱ्या",
  "Secure portal verification redirect": "सुरक्षित पोर्टल सत्यापन पुनर्निर्देशन",
  "Finish": "पूर्ण",
  "Next Step": "पुढील पायरी",
  "Previous Step": "मागील पायरी",
  "Check Documents": "कागदपत्रे तपासा",
  "Steps & Timeline": "पायऱ्या आणि वेळ",
  "Safe Redirect": "सुरक्षित पुनर्निर्देशन",
  "Application Stepper Guide": "अर्ज स्टेपर मार्गदर्शक",
  "No documents are uploaded or stored.": "कोणतीही कागदपत्रे अपलोड किंवा संग्रहित केली जात नाहीत.",
  "Close": "बंद करा",
  "Verified Portal Redirect": "सत्यापित पोर्टल पुनर्निर्देशन",
  "Guide": "मार्गदर्शक",
  "Docs": "कागदपत्रे",
  "Steps": "पायऱ्या",
  "Apply": "अर्ज करा",
  "Back": "मागे",
  "Step 1: Check Required Documents": "पायरी १: आवश्यक कागदपत्रे तपासा",
  "Please check off that you have these documents ready before opening the application portal:": "अर्ज पोर्टल उघडण्यापूर्वी ही कागदपत्रे तयार आहेत याची खात्री करा:",
  "Kaam Card never saves or asks for copy uploads of these documents. Keep them with you locally.": "काम कार्ड ही कागदपत्रांच्या प्रती कधीही जतन करत नाही किंवा अपलोड करण्यास सांगत नाही. ती तुमच्याकडे स्थानिकरित्या ठेवा.",
  "Step 2: Step-by-Step Instructions": "पायरी २: चरण-दर-चरण सूचना",
  "Follow these steps on the official portal to complete your registration:": "तुमची नोंदणी पूर्ण करण्यासाठी अधिकृत पोर्टलवर या पायऱ्या फॉलो करा:",
  "Step 3: Access Official Portal": "पायरी ३: अधिकृत पोर्टल उघडा",
  "You are now ready to visit the official website of the": "तुम्ही आता अधिकृत वेबसाइटला भेट देण्यास तयार आहात:",
  "Verified Official Portal": "सत्यापित अधिकृत पोर्टल",
  "Destination:": "गंतव्य:",
  "Open official portal": "अधिकृत पोर्टल उघडा",
  "Always confirm the URL ends in .gov.in or .nic.in before submitting any personal information.": "कोणतीही वैयक्तिक माहिती सबमिट करण्यापूर्वी URL .gov.in किंवा .nic.in ने संपते याची नेहमी खात्री करा.",
  "Atal Pension Yojana": "अटल पेन्शन योजना",
  "Pension scheme for unorganized workers providing guaranteed minimum pension of Rs. 1,000 to Rs. 5,000 per month after age 60.": "असंघटित कामगारांसाठी पेन्शन योजना जी ६० वर्षांनंतर दरमहा रु. १,००० ते रु. ५,००० किमान पेन्शन प्रदान करते.",
  "e-Shram Registration": "ई-श्रम नोंदणी",
  "National database for unorganized workers to facilitate social security benefits and direct benefit transfers.": "असंघटित कामगारांसाठी सामाजिक सुरक्षा लाभ आणि थेट लाभ हस्तांतरण सुलभ करणारा राष्ट्रीय डेटाबेस.",
  "Pradhan Mantri Shram Yogi Maan-dhan": "प्रधानमंत्री श्रम योगी मान-धन",
  "Voluntary pension scheme for unorganized workers with monthly contribution matching by Central Government.": "असंघटित कामगारांसाठी स्वैच्छिक पेन्शन योजना ज्यामध्ये केंद्र सरकारद्वारे मासिक योगदान जुळवले जाते.",
  "Ayushman Bharat PM-JAY": "आयुष्मान भारत PM-JAY",
  "Free health insurance coverage up to Rs. 5 Lakhs per family per year for secondary and tertiary care hospitalization.": "दुय्यम आणि तृतीयक काळजी हॉस्पिटलायझेशनसाठी प्रति वर्ष प्रति कुटुंब रु. ५ लाख पर्यंत मोफत आरोग्य विमा कव्हरेज.",
  "PM SVANidhi Scheme": "PM स्वनिधी योजना",
  "Special micro-credit facility for street vendors to access affordable working capital loans for business revival.": "व्यवसाय पुनरुज्जीवनासाठी परवडणारे कार्यरत भांडवल कर्ज मिळवण्यासाठी स्ट्रीट वेंडर्ससाठी विशेष सूक्ष्म-कर्ज सुविधा.",
  "PM Shram Yogi Maandhan": "पीएम श्रम योगी मानधन",
  "e-Shram": "ई-श्रम",
  "PM Jeevan Jyoti Bima Yojana": "पीएम जीवन ज्योती विमा योजना",
  "PM Suraksha Bima Yojana": "पीएम सुरक्षा विमा योजना",
  "Delhi Construction Workers Welfare Board": "दिल्ली बांधकाम कामगार कल्याण मंडळ",
  "Pension support after age 60": "६० वर्षांनंतर पेन्शन सहाय्य",
  "National registration for unorganised workers": "असंघटित कामगारांसाठी राष्ट्रीय नोंदणी",
  "Health cover for low-income families": "कमी उत्पन्न कुटुंबांसाठी आरोग्य कव्हर",
  "Life insurance cover": "जीवन विमा कव्हर",
  "Accident insurance cover": "अपघात विमा कव्हर",
  "Welfare benefits for registered construction workers": "नोंदणीकृत बांधकाम कामगारांसाठी कल्याण लाभ",
  "PM SVANidhi": "पीएम स्वनिधी",
  "MUDRA Loan (Shishu)": "मुद्रा कर्ज (शिशु)",
  "Micro Enterprise Loan": "सूक्ष्म उद्यम कर्ज",
  "Working capital loan up to ₹10,000 for street vendors, repayable in monthly installments.": "स्ट्रीट वेंडर्ससाठी ₹१०,००० पर्यंत कार्यरत भांडवल कर्ज, मासिक हप्त्यांमध्ये देय.",
  "Loans up to ₹50,000 for income-generating activities in non-corporate small business sector.": "गैर-कॉर्पोरेट लघु व्यवसाय क्षेत्रात उत्पन्न-निर्मिती क्रियाकलापांसाठी ₹५०,००० पर्यंत कर्ज.",
  "Small business loan for informal workers to expand livelihood activities.": "असंघटित कामगारांसाठी उपजीविका क्रियाकलाप वाढविण्यासाठी लघु व्यवसाय कर्ज.",
  "Delivery Partner, Delhi": "डिलिव्हरी पार्टनर, दिल्ली",
  "Cab Driver, Mumbai": "कॅब ड्रायव्हर, मुंबई",
  "Domestic Worker, Bangalore": "घरगुती कामगार, बंगळुरू",
  "Need help checking eligibility?": "पात्रता तपासण्यासाठी मदत हवी आहे?",
  "We are dedicated to supporting digital portability for India's gig economy. If you have questions about the pilot or scheme integration, get in touch.": "आम्ही भारताच्या गिग अर्थव्यवस्थेसाठी डिजिटल पोर्टेबिलिटीचे समर्थन करण्यासाठी समर्पित आहोत. पायलट किंवा योजना एकत्रीकरणाबद्दल प्रश्न असल्यास संपर्क साधा.",
  "Toll-free Helpdesk: 1800-11-0031 (Demo)": "टोल-फ्री हेल्पडेस्क: 1800-11-0031 (डेमो)",
  "Features": "वैशिष्ट्ये",
  "Process": "प्रक्रिया",
  "Reviews": "पुनरावलोकने",
  "Contact": "संपर्क",
  "Empowering Indian gig workers with portable data identity.": "भारतीय गिग कामगारांना पोर्टेबल डेटा ओळखीने सक्षम करणे.",
  "Product": "उत्पादन",
  "Testimonials": "प्रशंसापत्रे",
  "Support": "मदत",
  "Email": "ईमेल",
  "Legal": "कायदेशीर",
  "Privacy": "गोपनीयता",
  "Terms": "अटी",
  "or": "किंवा",
  "Select Language": "भाषा निवडा",
  "English": "इंग्रजी",
  "Hindi": "हिंदी",
  "Marathi": "मराठी",
  "Tamil": "तामिळ",
  "Telugu": "तेलुगू",
  "Country code": "देश कोड",
  "OTP digits": "OTP अंक",
  "OTP digit 1": "OTP अंक १",
  "OTP digit 2": "OTP अंक २",
  "OTP digit 3": "OTP अंक ३",
  "OTP digit 4": "OTP अंक ४",
  "OTP digit 5": "OTP अंक ५",
  "OTP digit 6": "OTP अंक ६",
  "Demo code:": "डेमो कोड:",
  "Parse status": "पार्स स्थिती",
  "Parsed income rows": "पार्स केलेल्या उत्पन्न रांगा",
  "No usable income rows yet": "अद्याप कोणत्याही उपयुक्त उत्पन्न रांगा नाहीत",
  "Rows skipped safely": "रांगा सुरक्षितपणे वगळल्या",
  "We skipped malformed rows instead of crashing.": "आम्ही क्रॅश होण्याऐवजी दोषपूर्ण रांगा वगळल्या.",
  "Row": "रांग",
  "Issue": "समस्या",
  "Add at least one valid credit/income row to continue.": "सुरू ठेवण्यासाठी किमान एक वैध क्रेडिट/उत्पन्न रांग जोडा.",
  "Analyzed period:": "विश्लेषित कालावधी:",
  "Eligible public schemes (": "पात्र सार्वजनिक योजना (",
  " matched)": " जुळल्या)",
  "No scheme matches found. Try adjusting search or details.": "कोणतीही योजना जुळणी आढळली नाही. शोध किंवा तपशील समायोजित करण्याचा प्रयत्न करा.",
  "Share Summary": "सारांश शेअर करा",
  "Share summary text": "सारांश मजकूर शेअर करा",
  "Session code:": "सत्र कोड:",
  "Daily income bar chart": "दैनिक उत्पन्न बार चार्ट",
  "Eligible": "पात्र",
  "Welfare Knowledge & Security Logs": "कल्याण ज्ञान आणि सुरक्षा लॉग",
  "No actions logged yet.": "अद्याप कोणत्याही कृती लॉग केल्या नाहीत.",
  "Shareable summary": "शेअर करण्यायोग्य सारांश",
  "This is a simple text summary for the demo. No raw transactions are included.": "डेमोसाठी हा एक साधा मजकूर सारांश आहे. कोणतेही कच्चे व्यवहार समाविष्ट नाहीत.",
  "Copied": "कॉपी झाले",
  "Copy": "कॉपी करा",
  "Danger Zone": "धोक्याचे क्षेत्र",
  "This will completely clear your parsed income profile and reset the session.": "हे तुमचे पार्स केलेले उत्पन्न प्रोफाइल पूर्णपणे साफ करेल आणि सत्र रीसेट करेल.",
  "Clear & Purge Session Data": "सत्र डेटा साफ करा आणि हटवा",
  "Upload": "अपलोड",
  "More": "अधिक",
  "Main navigation": "मुख्य नेव्हिगेशन",
  "From phone to dashboard in under 2 minutes": "फोनपासून डॅशबोर्डपर्यंत २ मिनिटांत",
  "Kaam Card navigation": "काम कार्ड नेव्हिगेशन",
  "Language switched to": "भाषा बदलली",
  "Are you sure you want to end your session and delete all parsed data? This cannot be undone.": "तुम्हाला तुमचे सत्र संपवून सर्व पार्स केलेला डेटा हटवायचा आहे याची खात्री आहे का? हे पूर्ववत करता येणार नाही.",
  "Something went wrong": "काहीतरी चूक झाली",
  "The app encountered an unexpected error. Please refresh the page to try again.": "अ‍ॅपमध्ये अनपेक्षित त्रुटी आली. पुन्हा प्रयत्न करण्यासाठी कृपया पेज रिफ्रेश करा.",
  "Refresh Page": "पेज रिफ्रेश करा",
  "Kaam Card summary": "काम कार्ड सारांश",
  "Phone session:": "फोन सत्र:",
  "Average daily income:": "सरासरी दैनिक उत्पन्न:",
  "Good days:": "चांगले दिवस:",
  "bad days:": "वाईट दिवस:",
  "Saving rule: save": "बचत नियम: बचत करा",
  "on days above": "वरील दिवशी",
  "Likely schemes:": "संभाव्य योजना:",
  "No exact match yet": "अद्याप कोणतेही अचूक जुळणी नाही",
  "Demo note: eligibility is simplified and should be verified on the official portal.": "डेमो नोंद: पात्रता सरलीकृत आहे आणि अधिकृत पोर्टलवर सत्यापित केली पाहिजे.",
  "Income Profile": "उत्पन्न प्रोफाइल",
  "Daily Average": "दैनिक सरासरी",
  "Monthly Estimate": "मासिक अंदाज",
  "Low Days": "कमी उत्पन्न दिवस",
  "Savings Recommendation": "बचत शिफारस",
  "Matched Welfare Schemes": "जुळणाऱ्या कल्याण योजना",
  "Generated by Kaam Card | Eligibility is simplified, verify on official portals": "काम कार्डद्वारे तयार | पात्रता सरलीकृत आहे, अधिकृत पोर्टलवर सत्यापित करा",
  "Income": "उत्पन्न",
  "Using Kaam Card took less than 2 minutes. It computed my average daily income and showed me I qualified for PM-SYM pension. I registered the same day!": "काम कार्ड वापरल्यास २ मिनिटांपेक्षा कमी वेळ लागला. त्याने माझे सरासरी दैनिक उत्पन्न मोजले आणि मी PM-SYM पेन्शनसाठी पात्र आहे हे दाखवले. मी त्याच दिवशी नोंदणी केली!",
  "I always wanted to save but didn't know how much. The good-day surplus savings suggestion helped me set aside money on busy weekends to cover dry weekdays.": "मला नेहमी बचत करायची होती पण किती हे माहीत नव्हते. चांगल्या दिवसाच्या अधिशेष बचत सूचनेने मला व्यस्त आठवड्याच्या शेवटी पैसे बाजूला ठेवण्यास मदत केली ज्यामुळे कोरड्या आठवड्याचे दिवस कव्हर होतील.",
  "I was worried about sharing bank logs, but Kaam Card's privacy focus is amazing. It runs on my browser and doesn't store my Aadhaar or transaction lists.": "मला बँक लॉग शेअर करण्याची काळजी होती, पण काम कार्डचे गोपनीयता लक्ष केंद्रित अप्रतिम आहे. हे माझ्या ब्राउझरवर चालते आणि माझा आधार किंवा व्यवहार सूची संग्रहित करत नाही.",
  "© 2026 Kaam Card.": "© २०२६ काम कार्ड.",
  " of ": " चा ",
  " to ": " ते ",
  "/month": "/महिना",
  "You qualify because your ": "तुम्ही पात्र आहात कारण तुमचे ",
  " and ": " आणि ",
  "Close match: ": "जवळची जुळणी: ",
  "some details match": "काही तपशील जुळतात",
  ", but ": ", पण ",
  "age ": "वय ",
  " is within ": " आत आहे ",
  "age must be ": "वय हवे ",
  "estimated monthly income is below ": "अंदाजे मासिक उत्पन्न यापेक्षा कमी आहे ",
  "no income cap holds": "उत्पन्न मर्यादा नाही",
  "income is above ": "उत्पन्न यापेक्षा जास्त आहे ",
  " is covered": " कव्हर केले आहे",
  "occupation must match: ": "व्यवसाय जुळला पाहिजे: ",
  " state matches": " राज्य जुळते",
  "state must be ": "राज्य हवे ",
  " or ": " किंवा ",
  "Worker ": "कामगार ",
  "Save ": "बचत करा ",
  " on good days (above ": " चांगल्या दिवशी (वरील ",
  ")": ")",
  " | +91 ": " | +९१ ",
  "-": "-",
  "CSV needs a header and at least one data row.": "CSV मध्ये हेडर आणि किमान एक डेटा रांग हवी.",
  "Missing column: ": "गहाळ स्तंभ: ",
  "Date is invalid. Use YYYY-MM-DD or DD-MM-YYYY.": "तारीख अवैध आहे. YYYY-MM-DD किंवा DD-MM-YYYY वापरा.",
  "Amount is invalid. Use a positive number.": "रक्कम अवैध आहे. सकारात्मक संख्या वापरा.",
  "Direction must be credit/income or debit/expense.": "दिशा क्रेडिट/उत्पन्न किंवा डेबिट/खर्च हवी.",
  "Please upload a CSV file.": "कृपया CSV फाइल अपलोड करा.",
  "Detected format:": "आढळलेला फॉरमॅट:",
  "Expense Summary": "खर्च सारांश",
  "Spending breakdown from your statement": "तुमच्या स्टेटमेंटवरून खर्चाचे विभाजन",
  "Total Expenses": "एकूण खर्च",
  "Avg daily": "सरासरी दैनिक",
  "Top Category": "शीर्ष श्रेणी",
  "Income Insights": "उत्पन्न अंतर्दृष्टी",
  "Income Stability": "उत्पन्न स्थिरता",
  "Stability score based on income variance": "उत्पन्न भिन्नतेवर आधारित स्थिरता स्कोअर",
  "Daily Income": "दैनिक उत्पन्न",
  "Weekly Breakdown": "साप्ताहिक विभाजन",
  "Income trend week by week": "आठवड्यागणिक उत्पन्नाचा कल",
  "Income vs Expenses": "उत्पन्न विरुद्ध खर्च",
  "How your earnings compare to spending": "तुमची कमाई आणि खर्च यांची तुलना",
  "Expense Ratio": "खर्च प्रमाण",
  "Savings Projection": "बचत अंदाज",
  "Project your savings forward": "तुमच्या बचतीचा अंदाज लावा",
  "Monthly": "मासिक",
  "3 Months": "३ महिने",
  "6 Months": "६ महिने",
  "This will cover up to": "हे कव्हर करेल",
  "low-income days per month.": "दरमहा कमी उत्पन्नाचे दिवस.",
  "Range": "श्रेणी",
  "above": "वर",
  "below": "खाली",
  "No Income": "उत्पन्न नाही",
  "File is larger than 5 MB.": "फाइल ५ MB पेक्षा मोठी आहे.",
  "Log Out": "लॉग आउट",
  "Kaam Card - ": "काम कार्ड - ",
  "worker": "कामगार",
  "friend": "मित्र",
  "Uploaded files": "अपलोड केलेल्या फायली",
  "Upload a CSV or bank statement PDF. Links inside files are treated as plain text.": "CSV किंवा बँक स्टेटमेंट PDF अपलोड करा. फायलीतील लिंक्स सामान्य मजकूर मानल्या जातात.",
  "Tap to upload CSV or PDF": "CSV किंवा PDF अपलोड करण्यासाठी टॅप करा",
  "or drag and drop. CSV or PDF, up to 5 MB.": "किंवा ड्रॅग आणि ड्रॉप करा. CSV किंवा PDF, 5 MB पर्यंत.",
  "Manual income entry": "मॅन्युअल उत्पन्न नोंद",
  "Date": "तारीख",
  "Amount": "रक्कम",
  "Source": "स्रोत",
  "Platform credit": "प्लॅटफॉर्म क्रेडिट",
  "Bank transfer": "बँक ट्रान्सफर",
  "Add entry": "नोंद जोडा",
  "Remove entry": "नोंद काढा",
  "Cash": "रोख",
  "rows": "रांगा",
  "Budget": "बजेट",
  "documents ready": "कागदपत्रे तयार",
  "Loan Eligibility": "कर्ज पात्रता",
  "loan options available": "कर्ज पर्याय उपलब्ध",
  "No loans match your profile": "तुमच्या प्रोफाइलशी कोणतेही कर्ज जुळत नाही",
  "Try adjusting your details or uploading more income data to improve eligibility.": "पात्रता सुधारण्यासाठी तुमचे तपशील किंवा अधिक उत्पन्न डेटा अपलोड करण्याचा प्रयत्न करा.",
  "Up to": "पर्यंत",
  "Tax Estimation": "कर अंदाज",
  "Estimated annual tax liability": "अंदाजे वार्षिक कर देयता",
  "Annual income": "वार्षिक उत्पन्न",
  "Estimated tax": "अंदाजे कर",
  "Net income after tax": "करानंतर निव्वळ उत्पन्न",
  "Effective tax rate": "प्रभावी कर दर",
  "This is a simplified estimate. Consult a CA for accurate tax planning.": "हा एक सरलीकृत अंदाज आहे. अचूक नियोजनासाठी CA चा सल्ला घ्या.",
  "Claim": "दावा",
  "Claim Documents": "दावा कागदपत्रे",
  "Step 3: Claim Documents": "पायरी ३: दावा कागदपत्रे",
  "Step 4: File a Claim": "पायरी ४: दावा दाखल करा",
  "Prepare these documents if you need to file a claim:": "दावा दाखल करण्यासाठी ही कागदपत्रे तयार ठेवा:",
  "Follow these steps to file a claim on the official portal:": "अधिकृत पोर्टलवर दावा दाखल करण्यासाठी या पायऱ्या फॉलो करा:",
  "Policy document / enrollment number": "पॉलिसी दस्तऐवज / नोंदणी क्रमांक",
  "Claim form (download from portal)": "दावा फॉर्म (पोर्टलवरून डाउनलोड करा)",
  "Supporting documents (hospital bills / death certificate)": "सहाय्यक कागदपत्रे (हॉस्पिटल बिल / मृत्यू प्रमाणपत्र)",
  "Download the claim form from the official portal.": "अधिकृत पोर्टलवरून दावा फॉर्म डाउनलोड करा.",
  "Fill in the policyholder details and policy number.": "पॉलिसीधारक तपशील आणि पॉलिसी क्रमांक भरा.",
  "Attach all required supporting documents.": "सर्व आवश्यक सहाय्यक कागदपत्रे संलग्न करा.",
  "Submit the form at the nearest branch or online portal.": "जवळच्या शाखेत किंवा ऑनलाइन पोर्टलवर फॉर्म सबमिट करा.",
  "Track claim status using the acknowledgment number.": "पावती क्रमांक वापरून दावा स्थिती ट्रॅक करा.",
  "Skip": "वगळा",
  "Next": "पुढे",
  "Welcome to Kaam Card": "काम कार्डमध्ये आपले स्वागत आहे",
  "This is your dashboard. Here you'll see your income analysis, savings recommendations, and welfare scheme matches.": "हा तुमचा डॅशबोर्ड आहे. येथे तुम्हाला उत्पन्न विश्लेषण, बचत शिफारसी आणि कल्याण योजना जुळणी दिसतील.",
  "Your daily earnings chart shows good days and bad days, helping you understand your income patterns.": "तुमचा दैनिक कमाई चार्ट चांगले आणि वाईट दिवस दाखवतो, ज्यामुळे तुम्हाला तुमचे उत्पन्न नमुने समजतात.",
  "Use the smart savings suggestion and check which government schemes you qualify for.": "स्मार्ट बचत सूचना वापरा आणि तुम्ही कोणत्या सरकारी योजनांसाठी पात्र आहात ते तपासा.",
  "Tap Upload to add more statements or manual entries anytime.": "कधीही अधिक स्टेटमेंट किंवा मॅन्युअल नोंदी जोडण्यासाठी अपलोडवर टॅप करा.",
  "Remove": "काढा",
  "Please upload a CSV or PDF file.": "कृपया CSV किंवा PDF फाइल अपलोड करा.",
  "Bank PDF": "बँक PDF",
  "Ration card": "रेशन कार्ड",
  "Voter ID": "मतदार ओळखपत्र",
  "Driving license": "ड्रायव्हिंग लायसन्स",
  "Income certificate": "उत्पन्न प्रमाणपत्र",
  "Minimum age": "किमान वय",
  "Maximum age": "कमाल वय",
  "Minimum monthly income": "किमान मासिक उत्पन्न",
  "Income must be below": "उत्पन्न यापेक्षा कमी हवे",
  "Occupation must be": "व्यवसाय हवा",
  "State must be": "राज्य हवे",
  "Monthly income": "मासिक उत्पन्न",
  "Income stability": "उत्पन्न स्थिरता",
  "Listen": "ऐका",
  "UPI": "UPI",
  "Manual": "मॅन्युअल",
  "Generic CSV": "सामान्य CSV",
  "Google Pay": "Google Pay",
  "PhonePe": "फोनपे",
  "PayTM": "पेटीएम",
  "High": "उच्च",
  "Medium": "मध्यम",
  "Low": "निम्न",
  "High Contrast": "उच्च कॉन्ट्रास्ट",
  "Voice Input": "व्हॉइस इनपुट",
  "Screen Reader": "स्क्रीन रीडर",
  "Enable High Contrast": "उच्च कॉन्ट्रास्ट सक्षम करा",
  "Disable High Contrast": "उच्च कॉन्ट्रास्ट अक्षम करा",
  "Enable Voice Input": "व्हॉइस इनपुट सक्षम करा",
  "Disable Voice Input": "व्हॉइस इनपुट अक्षम करा",
  "High contrast enabled": "उच्च कॉन्ट्रास्ट सक्षम",
  "High contrast disabled": "उच्च कॉन्ट्रास्ट अक्षम",
  "Voice input enabled": "व्हॉइस इनपुट सक्षम केले",
  "Voice input disabled": "व्हॉइस इनपुट अक्षम",
  "Tap to speak": "बोलण्यासाठी टॅप करा",
  "Listening...": "ऐकत आहे...",
  "Maharashtra Building & Other Construction Workers Welfare Board": "महाराष्ट्र इमारत व इतर बांधकाम कामगार कल्याणकारी मंडळ",
  "Karnataka Unorganised Workers Social Security Board": "कर्नाटक असंघटित कामगार सामाजिक सुरक्षा मंडळ",
  "Tamil Nadu Manual Workers Welfare Board": "तामिळनाडू मॅन्युअल कामगार कल्याण मंडळ",
  "Uttar Pradesh Building & Other Construction Workers Welfare Board": "उत्तर प्रदेश इमारत आणि इतर बांधकाम कामगार कल्याण मंडळ",
  "West Bengal Unorganised Sector Workers Welfare Board": "पश्चिम बंगाल असंघटित क्षेत्र कामगार कल्याण मंडळ",
  "Rajasthan Building & Other Construction Workers Welfare Board": "राजस्थान इमारत आणि इतर बांधकाम कामगार कल्याण मंडळ",
  "Gujarat Building & Other Construction Workers Welfare Board": "गुजरात इमारत आणि इतर बांधकाम कामगार कल्याण मंडळ",
  "Madhya Pradesh Building & Other Construction Workers Welfare Board": "मध्य प्रदेश इमारत आणि इतर बांधकाम कामगार कल्याण मंडळ",
  "Bihar Unorganised Workers Social Security Board": "बिहार असंघटित कामगार सामाजिक सुरक्षा मंडळ",
  "Odisha Unorganised Workers Welfare Board": "ओडिशा असंघटित कामगार कल्याण मंडळ",
  "PM MUDRA Yojana (Shishu)": "पंतप्रधान मुद्रा योजना (शिशू)",
  "Janani Suraksha Yojana": "जननी सुरक्षा योजना",
  "Pradhan Mantri Matru Vandana Yojana": "प्रधानमंत्री मातृ वंदना योजना",
  "Ayushman Bharat Health Account (ABHA)": "आयुष्मान भारत आरोग्य खाते (ABHA)",
  "NPS Vatsalya": "NPS वात्सल्य",
  "PM Kaushal Vikas Yojana (PMKVY)": "पंतप्रधान कौशल विकास योजना (PMKVY)",
  "Stand-Up India": "स्टँड-अप इंडिया",
  "Ekta Mall (PM SVANidhi Extension)": "एकता मॉल (पीएम स्वनिधी विस्तार)",
  "Pension, accident insurance, maternity benefit, death benefit": "पेन्शन, अपघात विमा, मातृत्व लाभ, मृत्यू लाभ",
  "Pension, accident cover, tool kit assistance, skill training": "पेन्शन, अपघात संरक्षण, टूल किट सहाय्य, कौशल्य प्रशिक्षण",
  "Pension, accident insurance, marriage assistance, education grant": "पेन्शन, अपघात विमा, विवाह मदत, शिक्षण अनुदान",
  "Pension, health insurance, disability cover, death benefit": "पेन्शन, आरोग्य विमा, अपंगत्व संरक्षण, मृत्यू लाभ",
  "Pension, accident insurance, health cover, scholarship": "पेन्शन, अपघात विमा, आरोग्य कवच, शिष्यवृत्ती",
  "Collateral-free working capital loan up to ₹50,000 for street vendors": "रस्त्यावरील विक्रेत्यांसाठी ₹50,000 पर्यंत संपार्श्विक-मुक्त कार्यरत भांडवल कर्ज",
  "Guaranteed pension ₹1,000-5,000/month after age 60": "वयाच्या ६० नंतर ₹१,०००-५,०००/महिना हमी पेन्शन",
  "Micro loan up to ₹50,000 for small business": "लहान व्यवसायासाठी ₹50,000 पर्यंत सूक्ष्म कर्ज",
  "Cash assistance for institutional delivery": "संस्थात्मक वितरणासाठी रोख मदत",
  "₹5,000 cash incentive for first live birth": "पहिल्या जिवंत जन्मासाठी ₹5,000 रोख प्रोत्साहन",
  "Digital health ID for seamless healthcare access": "अखंड आरोग्य सेवा प्रवेशासाठी डिजिटल आरोग्य आयडी",
  "Pension account for minors, converts to regular NPS at 18": "अल्पवयीनांसाठी पेन्शन खाते, 18 वाजता नियमित NPS मध्ये रूपांतरित होते",
  "Free skill training with certification and placement support": "प्रमाणपत्र आणि प्लेसमेंट समर्थनासह विनामूल्य कौशल्य प्रशिक्षण",
  "Bank loan ₹10 lakh - ₹1 crore for SC/ST/Women entrepreneurs": "एससी/एसटी/महिला उद्योजकांसाठी बँक कर्ज ₹10 लाख - ₹1 कोटी",
  "E-commerce platform for street vendors to sell online": "रस्त्यावरील विक्रेत्यांसाठी ऑनलाइन विक्रीसाठी ई-कॉमर्स प्लॅटफॉर्म",
  "PAN Card": "पॅन कार्ड",
  "Bank account passbook": "बँक खाते पासबुक",
  "Savings bank account passbook": "बचत बँक खाते पासबुक",
  "Bank account details": "बँक खाते तपशील",
  "Mobile number linked with Aadhaar": "मोबाईल नंबर आधारशी लिंक केला आहे",
  "Show QR Code": "QR कोड दाखवा",
  "Worker Card QR Code": "कामगार कार्ड QR कोड",
  "Scan to share your Kaam Card profile": "तुमचे काम कार्ड प्रोफाइल शेअर करण्यासाठी स्कॅन करा",
  "Expires in 24 hours": "२४ तासांत कालबाह्य होईल",
  "Download QR": "QR डाउनलोड करा",
  "Export Card (HTML)": "निर्यात कार्ड (HTML)",
  "Save as PDF": "PDF म्हणून सेव्ह करा",
  "Share via App": "ॲपद्वारे शेअर करा",
  "Kaam Card Summary": "काम कार्ड सारांश",
  "Open the official verified portal.": "अधिकृत सत्यापित पोर्टल उघडा.",
  "Verify using Aadhaar-linked OTP.": "आधार-लिंक केलेला OTP वापरून पडताळणी करा.",
  "Submit your occupation details and get registered.": "तुमचा व्यवसाय तपशील सबमिट करा आणि नोंदणी करा.",
  "Upload a statement to see spending breakdown": "खर्चाचे ब्रेकडाउन पाहण्यासाठी विधान अपलोड करा",
  "Upload a bank statement to get automatic expense categorization and budgeting insights.": "स्वयंचलित खर्च वर्गीकरण आणि अंदाजपत्रक अंतर्दृष्टी मिळविण्यासाठी बँक स्टेटमेंट अपलोड करा.",

  "Application Deadlines": "अर्जाची अंतिम मुदत",
  "Upcoming scheme application deadlines": "आगामी योजना अर्जाची अंतिम मुदत",
  "No upcoming deadlines right now": "आत्ता कोणतीही आगामी अंतिम मुदत नाही",
  "Check back later for scheme application deadlines.": "योजना अर्जाच्या अंतिम मुदतीसाठी नंतर तपासा.",
  "Deadlines are indicative. Verify on official portals.": "अंतिम मुदत सूचक आहे. अधिकृत पोर्टलवर सत्यापित करा.",
  "days left": "दिवस शिल्लक",
  "Smart Tips": "स्मार्ट टिप्स",
  "Personalized financial guidance": "वैयक्तिकृत आर्थिक मार्गदर्शन",
  "Track your saving targets": "तुमच्या बचत लक्ष्यांचा मागोवा घ्या",
  "Set a saving target": "बचत लक्ष्य सेट करा",
  "Add Goal": "लक्ष्य जोडा",
  "Create First Goal": "पहिले लक्ष्य तयार करा",
  "Knowledge & Logs": "ज्ञान आणि लॉग",
  "Create a goal to save for emergencies, festivals, or big purchases.": "आणीबाणी, सण किंवा मोठ्या खरेदीसाठी बचत करण्याचे लक्ष्य तयार करा.",
  "Government of India": "भारत सरकार",
  "Welfare benefits, pension, accident cover for construction workers": "बांधकाम कामगारांसाठी कल्याण लाभ, पेन्शन, अपघात कव्हर",
  "Pension, health insurance, accident cover for unorganised workers": "असंघटित कामगारांसाठी पेन्शन, आरोग्य विमा, अपघात कव्हर",
  "Pension, family pension, education assistance, accident relief": "पेन्शन, कुटुंब पेन्शन, शिक्षण सहाय्य, अपघात मदत",
  "Pension, health scheme, death benefit, education grant": "पेन्शन, आरोग्य योजना, मृत्यू लाभ, शिक्षण अनुदान",
  "Pension, accident insurance, maternity benefit, scholarship": "पेन्शन, अपघात विमा, मातृत्व लाभ, शिष्यवृत्ती",
  "Check which government schemes you qualify for based on your profile and income.": "तुमच्या प्रोफाइल आणि उत्पन्नाच्या आधारावर तुम्ही कोणत्या सरकारी योजनांसाठी पात्र आहात ते तपासा.",
  "Keep track of upcoming scheme deadlines so you never miss an application window.": "आगामी योजनेच्या अंतिम मुदतीचा मागोवा ठेवा जेणेकरून तुम्ही अर्ज विंडो कधीही चुकवू नका.",
  "Set personal saving targets for emergencies, festivals, or big purchases.": "आणीबाणी, सण किंवा मोठ्या खरेदीसाठी वैयक्तिक बचत लक्ष्य सेट करा.",
  "The savings card shows how much to save on good days to cover low-income days automatically.": "बचत कार्ड दर्शविते की कमी उत्पन्नाच्या दिवसांना आपोआप कव्हर करण्यासाठी चांगल्या दिवसात किती बचत करावी.",
  "Track your spending by category and set budgets to stay in control.": "श्रेणीनुसार तुमचा खर्च ट्रॅक करा आणि नियंत्रणात राहण्यासाठी बजेट सेट करा.",
  "Generate a portable summary of your verified profile to share with employers or schemes.": "नियोक्ते किंवा योजनांसह सामायिक करण्यासाठी तुमच्या सत्यापित प्रोफाइलचा पोर्टेबल सारांश तयार करा.",
  "Your daily earnings chart shows good days and bad days, helping you understand your income patterns.": "तुमचा दैनिक कमाई चार्ट चांगले आणि वाईट दिवस दर्शवितो, ज्यामुळे तुम्हाला तुमच्या उत्पन्नाचे नमुने समजण्यास मदत होते.",
  "Schemes": "योजना",
  "Messy CSV": "गडबड CSV",
  // 2026-08-04: Missing keys (translated)
  "Analyzed period": "विश्लेषण कालावधी",
  "Category Dominance": "श्रेणी वर्चस्व",
  "Close menu": "मेनू बंद करा",
  "Create a goal (e.g., \"Emergency Fund ₹10,000\") to stay motivated. The app will calculate your daily target.": "प्रेरित राहण्यासाठी एक ध्येय तयार करा (उदा. \"इमर्जन्सी फंड ₹10,000\") ॲप तुमच्या दैनंदिन लक्ष्याची गणना करेल.",
  "Daily earnings trend": "दैनिक कमाईचा ट्रेंड",
  "Documents": "कागदपत्रे",
  "Download PDF / Print": "PDF/प्रिंट डाउनलोड करा",
  "Goal name (e.g., Emergency Fund, Festival, Vehicle):": "ध्येयाचे नाव (उदा. आपत्कालीन निधी, उत्सव, वाहन):",
  "Good Day Advantage": "शुभ दिवसाचा फायदा",
  "High Expense Ratio": "उच्च खर्चाचे प्रमाण",
  "High Income Volatility": "उच्च उत्पन्न अस्थिरता",
  "In 3 months": "3 महिन्यांत",
  "In 6 months": "6 महिन्यांत",
  "Look for cheaper alternatives or set a budget.": "स्वस्त पर्याय शोधा किंवा बजेट सेट करा.",
  "Low Monthly Savings": "कमी मासिक बचत",
  "Low-income threshold:": "कमी-उत्पन्न थ्रेशोल्ड:",
  "Moderate Expense Ratio": "मध्यम खर्चाचे प्रमाण",
  "Monthly saving": "मासिक बचत",
  "No Budgets Set": "कोणतेही बजेट सेट नाही",
  "OTP sent via SMS": "एसएमएसद्वारे ओटीपी पाठवला",
  "OTP sent via SMS. Check your phone for the 6-digit code.": "एसएमएसद्वारे ओटीपी पाठवला. 6-अंकी कोडसाठी तुमचा फोन तपासा.",
  "Open menu": "मेनू उघडा",
  "Other": "इतर",
  "Over 40% of expenses go to": "40% पेक्षा जास्त खर्च जातो",
  "Projected monthly savings under ₹500. Even ₹50/day on good days builds emergency fund.": "₹५०० च्या खाली अंदाजित मासिक बचत. चांगल्या दिवसात ₹50/दिवस सुद्धा आपत्कालीन निधी तयार करतात.",
  "QR Code": "QR कोड",
  "Savings Goals": "बचत गोल",
  "Set a Savings Goal": "बचतीचे ध्येय सेट करा",
  "Set monthly budgets per category to track spending. Start with your top 3 categories.": "खर्चाचा मागोवा घेण्यासाठी प्रति श्रेणी मासिक बजेट सेट करा. आपल्या शीर्ष 3 श्रेणींसह प्रारंभ करा.",
  "Smart Savings": "स्मार्ट बचत",
  "Spending 70-90% of income leaves little buffer. Try the 50/30/20 rule: needs/wants/savings.": "उत्पन्नाच्या 70-90% खर्च केल्याने थोडासा बफर राहतो. 50/30/20 नियम वापरून पहा: गरजा/इच्छा/बचत.",
  "Tap anywhere to skip": "वगळण्यासाठी कुठेही टॅप करा",
  "Target amount (₹):": "लक्ष्य रक्कम (₹):",
  "Target date (YYYY-MM-DD, optional):": "लक्ष्य तारीख (YYYY-MM-DD, पर्यायी):",
  "Total Income": "एकूण उत्पन्न",
  "Use your browser's Print to PDF option to save": "सेव्ह करण्यासाठी तुमच्या ब्राउझरचा प्रिंट टू पीडीएफ पर्याय वापरा",
  "Worker:": "कामगार:",
  "You have more good days than bad. Save aggressively on good days to cover bad ones automatically.": "तुमच्याकडे वाईटापेक्षा चांगले दिवस जास्त आहेत. वाईट दिवस आपोआप कव्हर करण्यासाठी आक्रमकपणे बचत करा.",
  "You're spending over 90% of your income. Review top categories for savings.": "तुम्ही तुमच्या उत्पन्नाच्या 90% पेक्षा जास्त खर्च करत आहात. बचतीसाठी शीर्ष श्रेणींचे पुनरावलोकन करा.",
  "Your daily income varies by more than 50%. Consider building a 2-month expense buffer.": "तुमचे दैनंदिन उत्पन्न ५०% पेक्षा जास्त बदलते. 2-महिन्यांचा खर्च बफर तयार करण्याचा विचार करा.",
  "on good days": "चांगल्या दिवसांवर",
  "per month": "दरमहा",
  "to": "ते",
};


function t(text) {
  const trimmed = String(text || "").trim();
  if (state.lang === "hi" && TRANSLATIONS[trimmed]) {
    return TRANSLATIONS[trimmed];
  }
  if (state.lang === "ta" && TRANSLATIONS_TA[trimmed]) {
    return TRANSLATIONS_TA[trimmed];
  }
  if (state.lang === "te" && TRANSLATIONS_TE[trimmed]) {
    return TRANSLATIONS_TE[trimmed];
  }
  if (state.lang === "mr" && TRANSLATIONS_MR[trimmed]) {
    return TRANSLATIONS_MR[trimmed];
  }
  return text;
}

function addAuditLog(message) {
  const time = new Date().toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  state.auditLogs.unshift({ time, message });
}

const ICON_SPEAK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:16px;height:16px"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';

const ICON_SPEAK_MUTED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:16px;height:16px"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M23 9l-6 6"/><path d="M17 9l6 6"/></svg>';

function speakText(text, lang) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const langMap = { hi: "hi-IN", ta: "ta-IN", te: "te-IN", mr: "mr-IN" };
  utterance.lang = langMap[lang] || "en-IN";
  utterance.rate = 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function speakBtn(textKey, lang) {
  return `<button type="button" class="speak-btn" data-speak="${escapeHtml(textKey)}" aria-label="${t("Listen")}" title="${t("Listen")}">${ICON_SPEAK}</button>`;
}

function locale() {
  return { hi: "hi-IN", ta: "ta-IN", te: "te-IN", mr: "mr-IN", en: "en-IN" }[state.lang] || "en-IN";
}

function formatMoney(value) {
return `₹${Math.round(value).toLocaleString(locale())}`;
}

function formatNumber(value, digits = 0) {
  return Number(value || 0).toLocaleString(locale(), {
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
  if (OCCUPATION_ALIASES[clean]) return OCCUPATION_ALIASES[clean];
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
  const result = window.KaamCsvParser.parse(csvText);
  if (result.errors.length > 0) {
    const hasHeaderError = result.errors.some(e => e.row === 1);
    if (hasHeaderError && result.format === "unknown") {
      result.errors[0].issue = "Could not detect CSV format. Use date,amount,direction or a GPay/PhonePe/PayTM export.";
    }
  }
  result.validRows.forEach(row => {
    if (row.description) {
      row._desc = row.description;
    }
    delete row.description;
  });
  return { validRows: result.validRows.map(r => ({ date: r.date, amount: r.amount, direction: r.direction, description: r._desc || "" })), errors: result.errors, format: result.format };
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

function recomputeAll() {
  const allTransactions = [];

  state.uploadedFiles.forEach((file) => {
    if (file.validRows) {
      file.validRows.forEach((row) => {
        allTransactions.push({
          date: row.date,
          amount: row.amount,
          direction: row.direction,
          description: row.description || "",
          _source: file.name
        });
      });
    }
  });

  state.incomeEntries.forEach((entry) => {
    allTransactions.push({
      date: entry.date,
      amount: entry.amount,
      direction: "credit",
      description: entry.source || "Manual entry",
      _source: "Manual"
    });
  });

  allTransactions.sort((a, b) => a.date.localeCompare(b.date));

  state.mergedTransactions = allTransactions;

  state.profile = computeProfile(allTransactions);
  state.expenseProfile = computeExpenseProfile(allTransactions);
  state.matches = matchSchemes(state.details, state.profile);

  saveSession();
  render();
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
  const badThreshold = averageDaily * BAD_DAY_THRESHOLD_RATIO;
  const goodThreshold = averageDaily;
  const goodDays = dailySeries.filter((day) => day.amount > goodThreshold);
  const badDays = dailySeries.filter((day) => day.amount <= badThreshold);
  const avgBadDayIncome = badDays.length
    ? badDays.reduce((sum, day) => sum + day.amount, 0) / badDays.length
    : 0;
  const avgGoodSurplus = goodDays.length
    ? goodDays.reduce((sum, day) => sum + Math.max(0, day.amount - goodThreshold), 0) / goodDays.length
    : averageDaily * FALLBACK_SURPLUS_RATIO;
  const savePerGoodDay = Math.max(MIN_SAVINGS_AMOUNT, Math.round((avgGoodSurplus * SAVINGS_RATE) / SAVINGS_ROUNDING) * SAVINGS_ROUNDING);
  const expectedGoodDaysPerMonth = Math.round((goodDays.length / periodDays) * DAYS_IN_MONTH);
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
    monthlyIncomeEstimate: averageDaily * DAYS_IN_MONTH,
    dailySeries,
    savings: {
      savePerGoodDay,
      expectedGoodDaysPerMonth,
      monthlySaving,
      coveredLowDays
    }
  };
}

const EXPENSE_CATEGORIES = {
  "Food & Dining": ["swiggy", "zomato", "food", "restaurant", "hotel", "cafe", "eat", "dine", "pizza", "burger", "mcdonald", "domino", "snacks", "chai", "tiffin", "mess", "bakery", "cloud kitchen"],
  "Transport": ["uber", "ola", "fuel", "petrol", "diesel", "metro", "bus", "auto", "rickshaw", "cab", "taxi", "toll", "rapido", "parking", "indrive", "blusmart"],
  "Mobile & Bills": ["recharge", "airtel", "jio", "vodafone", "idea", "broadband", "wifi", "electricity", "bill", "bsnl", "dth", "postpaid", "prepaid"],
  "Groceries": ["grocery", "supermarket", "bigbasket", "zepto", "blinkit", "fresh", "vegetable", "milk", "dairy", "kirana", "instamart", "dunzo", "jiomart", "greenmart"],
  "Healthcare": ["hospital", "doctor", "clinic", "medicine", "pharmacy", "medical", "health", "diagnostic", "dentist", "eye", "lab", "chemist", "ayurveda"],
  "Entertainment": ["netflix", "prime", "hotstar", "movie", "theatre", "gaming", "spotify", "youtube", "music", "ott", "ticket", "sports"],
  "Shopping": ["amazon", "flipkart", "myntra", "meesho", "clothing", "apparel", "shoe", "electronics", "fashion", "ajio", "nykaa", "lenskart"],
  "Housing": ["rent", "maintenance", "society", "housing", "lease", "broker", "deposit"],
  "Education": ["school", "college", "tuition", "course", "book", "stationery", "exam", "fee", "university", "coaching"],
  "Transfer": ["transfer", "to self", "mobile number", "bank transfer", "wallet", "upi ref", "payment to self", "saving"]
};

function categorizeTransaction(description) {
  const desc = String(description || "").toLowerCase().trim();
  if (!desc) return "Uncategorized";
  for (const [category, keywords] of Object.entries(EXPENSE_CATEGORIES)) {
    if (keywords.some(kw => desc.includes(kw))) return category;
  }
  return "Other";
}

function computeExpenseProfile(transactions) {
  const debits = transactions.filter(row => row.direction === "debit" && row.amount > 0);
  if (debits.length === 0) return null;

  const totalExpenses = debits.reduce((sum, row) => sum + row.amount, 0);
  const byCategory = {};
  debits.forEach(row => {
    const cat = categorizeTransaction(row.description || "");
    byCategory[cat] = (byCategory[cat] || 0) + row.amount;
  });

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const topCategory = sorted.length > 0 ? sorted[0][0] : "None";
  const topCategoryAmount = sorted.length > 0 ? sorted[0][1] : 0;

  const avgDailyExpense = totalExpenses / Math.max(1, debits.length);

  return {
    totalExpenses,
    transactionCount: debits.length,
    avgDailyExpense,
    byCategory,
    sortedCategories: sorted,
    topCategory,
    topCategoryAmount,
    topCategoryPct: totalExpenses > 0 ? Math.round((topCategoryAmount / totalExpenses) * 100) : 0
  };
}

function generateFinancialTips(profile, expenseProfile) {
  const tips = [];
  
  if (!profile && !expenseProfile) return tips;

  // Income volatility tip
  if (profile && profile.variance && profile.averageDaily > 0) {
    const cv = Math.sqrt(profile.variance) / profile.averageDaily;
    if (cv > 0.5) {
      tips.push(`<strong>${t("High Income Volatility")}</strong>: ${t("Your daily income varies by more than 50%. Consider building a 2-month expense buffer.")}`);
    }
  }

  // Expense ratio tip
  if (profile && expenseProfile && profile.totalIncome > 0) {
    const expenseRatio = (expenseProfile.totalExpenses / profile.totalIncome) * 100;
    if (expenseRatio > 90) {
      tips.push(`<strong>${t("High Expense Ratio")}</strong>: ${t("You're spending over 90% of your income. Review top categories for savings.")}`);
    } else if (expenseRatio > 70) {
      tips.push(`<strong>${t("Moderate Expense Ratio")}</strong>: ${t("Spending 70-90% of income leaves little buffer. Try the 50/30/20 rule: needs/wants/savings.")}`);
    }
  }

  // Top category dominance
  if (expenseProfile && expenseProfile.topCategoryPct > 40) {
    tips.push(`<strong>${t("Category Dominance")}</strong>: ${t("Over 40% of expenses go to")} ${expenseProfile.topCategory}. ${t("Look for cheaper alternatives or set a budget.")}`);
  }

  // Low savings rate
  if (profile && profile.savings && profile.savings.monthlySaving < 500) {
    tips.push(`<strong>${t("Low Monthly Savings")}</strong>: ${t("Projected monthly savings under ₹500. Even ₹50/day on good days builds emergency fund.")}`);
  }

  // No budgets set
  if (expenseProfile && Object.keys(state.budgets || {}).length === 0) {
    tips.push(`<strong>${t("No Budgets Set")}</strong>: ${t("Set monthly budgets per category to track spending. Start with your top 3 categories.")}`);
  }

  // Savings goal tip
  if (state.savingsGoals && state.savingsGoals.length === 0 && profile && profile.savings) {
    tips.push(`<strong>${t("Set a Savings Goal")}</strong>: ${t("Create a goal (e.g., \"Emergency Fund ₹10,000\") to stay motivated. The app will calculate your daily target.")}`);
  }

  // Good days utilization
  if (profile && profile.goodDays > 0 && profile.badDays > 0) {
    const goodDayRatio = profile.goodDays / (profile.goodDays + profile.badDays);
    if (goodDayRatio > 0.6) {
      tips.push(`<strong>${t("Good Day Advantage")}</strong>: ${t("You have more good days than bad. Save aggressively on good days to cover bad ones automatically.")}`);
    }
  }

  return tips.slice(0, 3); // Limit to 3 tips
}

function getAllowedUrl(scheme) {
  const candidate = scheme.verifiedUrl || ALLOWED_SCHEME_URLS[scheme.id];
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

function normalizeScheme(scheme) {
  if (scheme.eligibility) {
    return {
      id: scheme.id,
      name: scheme.name,
      shortName: scheme.shortName,
      description: scheme.description || "",
      ministry: scheme.ministry || "",
      verifiedUrl: scheme.verifiedUrl || "",
      benefit: scheme.description || scheme.shortName,
      minAge: scheme.eligibility.minAge,
      maxAge: scheme.eligibility.maxAge,
      maxMonthlyIncome: scheme.eligibility.maxIncome,
      occupations: scheme.eligibility.occupations || [],
      states: scheme.eligibility.states || [],
      documents: scheme.documents || [],
      steps: scheme.steps || [],
      icon: scheme.icon || "shield",
      color: scheme.color || "blue",
      deadline: scheme.deadline || null,
      reminderDays: scheme.reminderDays || [30, 7, 1]
    };
  }
  return {
    id: scheme.id,
    name: scheme.name,
    shortName: scheme.shortName,
    description: scheme.benefit || "",
    ministry: scheme.ministry || "",
    verifiedUrl: scheme.verifiedUrl || "",
    benefit: scheme.benefit || scheme.shortName,
    minAge: scheme.minAge,
    maxAge: scheme.maxAge,
    maxMonthlyIncome: scheme.maxMonthlyIncome,
    occupations: scheme.occupations || [],
    states: scheme.states || [],
    documents: scheme.documents || [],
    steps: scheme.steps || [],
    icon: scheme.icon || "shield",
    color: scheme.color || "blue",
    deadline: scheme.deadline || null,
    reminderDays: scheme.reminderDays || [30, 7, 1]
  };
}

function schemeScore(scheme, details, profile) {
  const reasons = [];
  const misses = [];
  const age = Number(details.age);
  const occupation = normalizeOccupation(details.occupation);
  const monthlyIncome = profile.monthlyIncomeEstimate;
  const stateName = details.state;

  const { minAge, maxAge, maxMonthlyIncome: maxIncome, occupations, states } = scheme;

  if (age >= minAge && age <= maxAge) {
    reasons.push(`${t("age ")}${age}${t(" is within ")}${minAge}${t("-")}${maxAge}`);
  } else {
    misses.push(`${t("age must be ")}${minAge}${t("-")}${maxAge}`);
  }

  if (maxIncome === null || maxIncome === undefined || monthlyIncome <= maxIncome) {
    if (maxIncome) {
      reasons.push(`${t("estimated monthly income is below ")}${formatMoney(maxIncome)}`);
    } else {
      reasons.push(t("no income cap holds"));
    }
  } else {
    misses.push(`${t("income is above ")}${formatMoney(maxIncome)}`);
  }

  if (!occupations || occupations.length === 0 || occupations.includes(occupation)) {
    reasons.push(`${occupation.toLowerCase()}${t(" is covered")}`);
  } else {
    misses.push(`${t("occupation must match: ")}${occupations.join(", ")}`);
  }

  if (!states || states.length === 0 || states.includes(stateName)) {
    if (states && states.length > 0) reasons.push(`${stateName}${t(" state matches")}`);
  } else {
    misses.push(`${t("state must be ")}${states.join(t(" or "))}`);
  }

  const passed = reasons.length;
  const required = 3 + (states && states.length > 0 ? 1 : 0);
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
  const schemesList = state.schemesDb && state.schemesDb.length > 0
    ? state.schemesDb.map(normalizeScheme)
    : FALLBACK_SCHEMES;
  return schemesList.map((scheme) => schemeScore(scheme, details, profile))
    .sort((a, b) => b.rank - a.rank || a.name.localeCompare(b.name));
}

const LOAN_PRODUCTS = [
  {
    id: "pm-svanidhi",
    name: "PM SVANidhi",
    description: "Working capital loan up to ₹10,000 for street vendors, repayable in monthly installments.",
    maxAmount: 10000,
    interestRate: "0% (subsidized)",
    minMonthlyIncome: 3000,
    maxMonthlyIncome: 25000,
    minAge: 18,
    maxAge: 60,
    occupations: ["Street vendor"],
    states: []
  },
  {
    id: "pm-mudra",
    name: "MUDRA Loan (Shishu)",
    description: "Loans up to ₹50,000 for income-generating activities in non-corporate small business sector.",
    maxAmount: 50000,
    interestRate: "8-12% p.a.",
    minMonthlyIncome: 5000,
    maxMonthlyIncome: 50000,
    minAge: 18,
    maxAge: 65,
    occupations: [],
    states: []
  },
  {
    id: "micro-loan",
    name: "Micro Enterprise Loan",
    description: "Small business loan for informal workers to expand livelihood activities.",
    maxAmount: 25000,
    interestRate: "10-14% p.a.",
    minMonthlyIncome: 4000,
    maxMonthlyIncome: 40000,
    minAge: 20,
    maxAge: 60,
    occupations: [],
    states: []
  }
];

function checkLoanEligibility(details, profile) {
  if (!profile) return [];
  const monthlyIncome = profile.monthlyIncomeEstimate;
  const stabilityScore = profile.averageDaily > 0
    ? Math.round((1 - Math.sqrt(profile.variance) / profile.averageDaily) * 100)
    : 0;

  return LOAN_PRODUCTS.map((loan) => {
    const reasons = [];
    const misses = [];
    const age = Number(details.age);

    if (age < loan.minAge) misses.push(`${t("Minimum age")} ${loan.minAge}`);
    if (age > loan.maxAge) misses.push(`${t("Maximum age")} ${loan.maxAge}`);
    if (loan.minMonthlyIncome > 0 && monthlyIncome < loan.minMonthlyIncome) {
      misses.push(`${t("Minimum monthly income")} ${formatMoney(loan.minMonthlyIncome)}`);
    }
    if (loan.maxMonthlyIncome > 0 && monthlyIncome > loan.maxMonthlyIncome) {
      misses.push(`${t("Income must be below")} ${formatMoney(loan.maxMonthlyIncome)}`);
    }
    if (loan.occupations.length > 0 && !loan.occupations.includes(details.occupation)) {
      misses.push(`${t("Occupation must be")} ${loan.occupations.join(", ")}`);
    }
    if (loan.states.length > 0 && !loan.states.includes(details.state)) {
      misses.push(`${t("State must be")} ${loan.states.join(", ")}`);
    }

    const eligible = misses.length === 0;
    const rank = eligible ? 1 : 0;

    if (eligible) reasons.push(`${t("Monthly income")} ${formatMoney(monthlyIncome)}`);
    if (stabilityScore >= 35 && eligible) reasons.push(`${t("Income stability")}: ${stabilityScore}%`);

    return {
      ...loan,
      eligible,
      reasons,
      misses,
      rank,
      stabilityScore
    };
  }).sort((a, b) => b.rank - a.rank);
}

function processCsv(csvText, sourceMeta = {}) {
  const parseResult = parseTransactions(csvText);
  state.parseResult = {
    totalRows: parseResult.validRows.length + parseResult.errors.length,
    validRows: parseResult.validRows.length,
    errors: parseResult.errors,
    source: sourceMeta.name || "Uploaded CSV",
    format: parseResult.format || "generic"
  };

  const profile = computeProfile(parseResult.validRows);
  state.profile = profile;

  const expenseProfile = computeExpenseProfile(parseResult.validRows);
  state.expenseProfile = expenseProfile;

  if (sourceMeta.occupation) state.details.occupation = sourceMeta.occupation;
  if (sourceMeta.state) state.details.state = sourceMeta.state;
  if (sourceMeta.age) state.details.age = sourceMeta.age;

  if (profile) {
    state.matches = matchSchemes(state.details, profile);
    addAuditLog(`Income profile computed successfully.`);
    addAuditLog(`Statement parsed: ${state.parseResult.validRows} valid rows, ${state.parseResult.errors.length} skipped.`);
  } else {
    state.matches = [];
    addAuditLog(`Failed to compute income profile: no valid transactions.`);
  }
  saveSession();

  API.saveProfile({
    profile: state.profile,
    expenseProfile: state.expenseProfile,
    parseResult: state.parseResult ? { totalRows: state.parseResult.totalRows, validRows: state.parseResult.validRows, source: state.parseResult.source, format: state.parseResult.format } : null,
    matches: state.matches.map((m) => ({ id: m.id, name: m.name, shortName: m.shortName, eligible: m.eligible })),
    details: state.details
  }).catch(() => {});
}

function dateLabel(iso) {
  const date = new Date(`${iso}T00:00:00.000Z`);
  return date.toLocaleDateString(locale(), { day: "numeric", month: "short", timeZone: "UTC" });
}

function currentName() {
  const phone = state.session?.phone || "";
  return phone ? `${t("worker")} ${phone.slice(-4)}` : t("friend");
}

function renderShell(content, active = "Dashboard", layout = "compact") {
  const isLanding = state.route === "landing";
  const hasSession = !!state.session;

  if (hasSession && !isLanding && window.innerWidth >= 980 && state.__drawerInit === undefined) {
    state.drawerOpen = true;
    state.__drawerInit = true;
  }

  app.innerHTML = `
    <div class="app-shell ${isLanding ? "landing-shell" : ""} ${hasSession ? "has-sidebar" : ""} ${state.drawerOpen ? "drawer-open" : ""} ${state.searchOpen ? "search-open" : ""} ${state.rightSidebarOpen ? "sidebar-right-open" : ""}">
      <div class="interactive-grid-pattern" aria-hidden="true"></div>
      
      <!-- Drawer Overlay -->
      <div class="drawer-overlay" data-close-drawer data-close-search data-close-right-sidebar></div>
      
      <!-- Left Sidebar Drawer -->
      <aside class="side-rail" aria-label="${t("Kaam Card navigation")}">
        <div class="side-rail__head">
          <div class="brand brand-clickable" data-go-home>${brandMark()}<span>${t("Kaam Card")}</span></div>
          <button type="button" class="icon-btn drawer-close-btn" data-close-drawer aria-label="${t("Close menu")}">${ICONS.back}</button>
        </div>
        
        <nav class="rail-nav">
          <div class="nav-section-label nav-section-general">${t("General")}</div>
          ${navButton("Dashboard", ICONS.home, active === "Dashboard")}
          ${navButton("Connect Data", ICONS.upload, active === "Transactions")}
          
          <div class="nav-section-label nav-section-insights">${t("Insights")}</div>
          ${navButton("Income Analytics", ICONS.bars, active === "Insights")}
          ${navButton("Welfare Schemes", ICONS.schemes, active === "Schemes")}
        </nav>
        
        <div class="rail-foot">
          <div class="sidebar-promo-card sidebar-promo-inline">
            <span class="promo-close sidebar-promo-close" data-close-promo>×</span>
            <div class="promo-icon sidebar-promo-icon">${ICONS.shield}</div>
            <h4 class="sidebar-promo-title">${t("Secure & Private")}</h4>
            <p class="copy sidebar-promo-desc">${t("Parsed locally. Zero network leaks.")}</p>
          </div>
          ${hasSession ? `
          <button class="secondary-btn" type="button" data-toggle-right-sidebar style="width:100%;justify-content:flex-start;min-height:44px;border-radius:12px;font-size:0.85rem">${ICONS.list} ${t("Knowledge & Logs")}</button>
          <button class="purge-session-btn sidebar-promo-purge" type="button" data-purge-session>${ICONS.alert} ${t("Purge Session Data")}</button>
          <button class="purge-session-btn" type="button" data-logout style="background:transparent;border-color:var(--line);color:var(--muted)">${ICONS.back} ${t("Log Out")}</button>` : ""}
        </div>
      </aside>
      
      <!-- Mobile Toolbar (visible when session exists) -->
      ${hasSession && !isLanding ? `
      <div class="mobile-toolbar">
        <div class="mobile-toolbar-left">
          <button type="button" class="icon-btn mobile-menu-btn" data-toggle-drawer aria-label="${t("Open menu")}">${ICONS.menu}</button>
        </div>
        <div class="brand brand-clickable" data-go-home>${brandMark()}<span>${t("Kaam Card")}</span></div>
        <div class="mobile-toolbar-right">
          ${renderThemeToggle("compact")}
          <button type="button" class="icon-btn" data-toggle-right-sidebar aria-label="${t("Knowledge & Logs")}">${ICONS.list}</button>
        </div>
      </div>
      ` : ""}
      
      <!-- Main Content -->
      <main class="main-wrap">
        <div class="phone-stage ${layout === "wide" ? "is-wide" : ""}">
          <div class="phone-card">${content}</div>
        </div>
      </main>
      
      <!-- Right Sidebar (Desktop only) -->
      ${hasSession && !isLanding ? renderRightSidebar() : ""}
    </div>
  `;
  bindShellNav();
  bindThemeToggle();
  if (hasSession) {
    bindPurgeSession();
    bindRightSidebarEvents();
    bindDrawerEvents();
    bindSearchEvents();
  }
  bindGoHome();
  bindPromoClose();
  bindSpeakButtons();
}

function brandMark() {
  return `<img src="./logo.svg" alt="Kaam Card" class="brand-logo-glass">`;
}

function navButton(label, icon, active) {
  return `<button type="button" class="${active ? "is-active" : ""}" data-nav="${escapeHtml(label)}">${icon}<span>${escapeHtml(t(label))}</span></button>`;
}

function renderBudgetRows(expenseProfile) {
  return expenseProfile.sortedCategories.slice(0, 6).map(function(pair) {
    var cat = pair[0], spent = pair[1];
    var budget = state.budgets[cat] || 0;
    var pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
    var overBudget = budget > 0 && spent > budget;
    var pctDisplay = Math.max(2, pct).toFixed(0);
    var bgColor = overBudget ? "var(--red)" : pct > 80 ? "var(--accent)" : "var(--green)";
    var spentStr = formatMoney(spent);
    var budgetStr = budget > 0 ? "/ " + formatMoney(budget) : "";
    var warnIcon = overBudget ? '<span style="color:var(--red);margin-left:4px">⚠</span>' : "";
    var budgetVal = budget > 0 ? budget : "";
    return '<div class="budget-row" data-budget-cat="' + escapeHtml(cat) + '">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
      + '<span style="font-size:0.85rem;font-weight:500">' + cat + '</span>'
      + '<span style="font-size:0.82rem"><strong>' + spentStr + '</strong> ' + budgetStr + ' ' + warnIcon + '</span>'
      + '</div>'
      + '<div style="display:flex;gap:8px;align-items:center">'
      + '<div style="flex:1;height:8px;background:var(--surface);border-radius:4px;overflow:hidden">'
      + '<div style="height:100%;background:' + bgColor + ';border-radius:4px;width:' + pctDisplay + '%"></div>'
      + '</div>'
      + '<input class="budget-input" type="number" min="0" step="100" placeholder="0" value="' + budgetVal + '" data-budget-amount="' + escapeHtml(cat) + '">'
      + '</div>'
      + '</div>';
  }).join("");
}

function renderLangToggle() {
  const current = state.lang;
  return `
    <div class="lang-switcher" role="radiogroup" aria-label="${t("Select Language")}">
      <button class="lang-btn ${current === 'en' ? 'is-active' : ''}" data-lang="en" type="button" aria-label="${t("English")}">EN</button>
      <button class="lang-btn ${current === 'hi' ? 'is-active' : ''}" data-lang="hi" type="button" aria-label="${t("Hindi")}">हिं</button>
      <button class="lang-btn ${current === 'ta' ? 'is-active' : ''}" data-lang="ta" type="button" aria-label="${t("Tamil")}">த</button>
      <button class="lang-btn ${current === 'te' ? 'is-active' : ''}" data-lang="te" type="button" aria-label="${t("Telugu")}">తె</button>
      <button class="lang-btn ${current === 'mr' ? 'is-active' : ''}" data-lang="mr" type="button" aria-label="${t("Marathi")}">मरा</button>
    </div>
  `;
}

function renderThemeToggle(variant = "") {
  const isDark = state.theme === "dark";
  const label = isDark ? t("Switch to light theme") : t("Switch to dark theme");
  return `
    <div class="header-controls">
      ${renderLangToggle()}
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
    </div>
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

  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const newLang = btn.getAttribute("data-lang");
      if (state.lang !== newLang) {
        state.lang = newLang;
        const langName = { hi: t("Hindi"), ta: t("Tamil"), te: t("Telugu"), mr: t("Marathi") }[newLang] || t("English");
        addAuditLog(`${t("Language switched to")} ${langName}`);
        render();
      }
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
  if (label === "Upload" || label === "Connect Data" || label === "Transactions") state.route = "upload";
  if (label === "Insights" || label === "Income Analytics") state.route = state.profile ? "insights" : "upload";
  if (label === "Schemes" || label === "Welfare Schemes") state.route = state.profile ? "schemes" : "upload";

  closeDrawer();
  render();
}

function bindSpeakButtons() {
  document.querySelectorAll("[data-speak]").forEach(btn => {
    btn.addEventListener("click", () => {
      const text = btn.getAttribute("data-speak");
      if (text) speakText(text, state.lang);
    });
  });
}

function bindShellNav() {
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => navigateTo(button.dataset.nav));
  });
}

function renderLogin() {
  renderShell(`
    <section class="screen screen-centered" aria-labelledby="login-title">
      <div class="top-bar">
        <div class="brand brand-clickable" data-go-home>${brandMark()}<span>${t("Kaam Card")}</span></div>
        ${renderThemeToggle("compact")}
      </div>
      <h1 class="screen-title" id="login-title">${t("Log In & Access Portal")}</h1>
      <p class="copy">${t("Start with your mobile number. This demo keeps the session in memory only.")}</p>
      <form class="auth-form" id="phone-form">
        <label class="field-label" for="phone">${t("Mobile number")}</label>
        <div class="phone-input-row">
          <select aria-label="${t("Country code")}">
            <option>+91</option>
          </select>
          <input id="phone" name="phone" inputmode="tel" autocomplete="tel" placeholder="${t("Enter mobile number")}" value="${escapeHtml(state.phoneDraft)}">
        </div>
        <button class="primary-btn" type="submit">${t("Send secure OTP link")}</button>
        <div class="divider">${t("or")}</div>
        <button class="secondary-btn" type="button" data-skip-demo>${ICONS.upload} ${t("Continue with sample data")}</button>
      </form>
      <div class="privacy-line">${ICONS.shield}<span>${t("Your data stays in this browser session. We do not ask for Aadhaar, PAN, or bank account numbers.")}</span></div>
    </section>
  `, "Dashboard");

  document.querySelector("#phone-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const phone = document.querySelector("#phone").value.replace(/\D/g, "");
    if (phone.length < 10) {
      document.querySelector("#phone").focus();
      return;
    }
    state.phoneDraft = phone.slice(-10);

    try {
      const result = await API.sendOtp(state.phoneDraft);
      addAuditLog(`OTP sent to +91 ******${state.phoneDraft.slice(-4)}`);
      state.otpDebugCode = result._debug ? result._debug.code : null;
      state.route = "otp";
      render();
    } catch (err) {
      addAuditLog(`OTP send failed: ${err.message}`);
      alert(err.message);
    }
  });

  document.querySelector("[data-skip-demo]").addEventListener("click", () => {
    state.phoneDraft = "9876543210";
    state.session = { phone: state.phoneDraft, startedAt: Date.now() };
    state.auditLogs = [];
    addAuditLog(`Demo session started.`);
    const sample = SAMPLE_DATASETS[0];
    const parseResult = parseTransactions(sample.csv);
    state.uploadedFiles.push({
      id: "file_" + Date.now(),
      name: sample.name + " (sample)",
      type: "csv",
      validRows: parseResult.validRows,
      errors: parseResult.errors,
      format: parseResult.format || "generic"
    });
    state.details.occupation = sample.occupation;
    state.details.state = sample.state;
    state.details.age = sample.age;
    state.profile = computeProfile(parseResult.validRows);
    state.expenseProfile = computeExpenseProfile(parseResult.validRows);
    state.matches = matchSchemes(state.details, state.profile);
    state.route = "dashboard";
    saveSession();
    render();
  });
}

function renderOtp() {
  renderShell(`
    <section class="screen" aria-labelledby="otp-title">
      <div class="step-header">
        <button class="icon-btn" type="button" data-back aria-label="${t("Back")}">${ICONS.back}</button>
        <h1 id="otp-title">${t("OTP Verification")}</h1>
        ${renderThemeToggle("compact")}
      </div>
      <div class="panel" style="text-align:center">
        <p class="copy otp-simulated">${t("OTP sent via SMS")}</p>
        <p class="copy otp-phone">${t("We sent an OTP to")}<br><strong>+91 ${escapeHtml(state.phoneDraft)}</strong></p>
        <form id="otp-form">
          <div class="otp-grid" aria-label="${t("OTP digits")}">
            <input class="otp-input" inputmode="numeric" maxlength="1" aria-label="${t("OTP digit 1")}">
            <input class="otp-input" inputmode="numeric" maxlength="1" aria-label="${t("OTP digit 2")}">
            <input class="otp-input" inputmode="numeric" maxlength="1" aria-label="${t("OTP digit 3")}">
            <input class="otp-input" inputmode="numeric" maxlength="1" aria-label="${t("OTP digit 4")}">
            <input class="otp-input" inputmode="numeric" maxlength="1" aria-label="${t("OTP digit 5")}">
            <input class="otp-input" inputmode="numeric" maxlength="1" aria-label="${t("OTP digit 6")}">
          </div>
          <p class="copy">${t("OTP sent via SMS. Check your phone for the 6-digit code.")}</p>
          ${state.otpDebugCode ? `<p class="otp-fallback-code" style="margin-top:8px;font-size:0.85rem;color:var(--muted);background:var(--surface);border:1px dashed var(--line-strong);border-radius:var(--radius-sm);padding:8px 12px;display:inline-block">${t("Demo code:")} <strong style="font-family:monospace;font-size:1.2rem;letter-spacing:0.15em;color:var(--accent)">${state.otpDebugCode}</strong></p>` : ""}
          <button class="primary-btn" type="submit">${t("Verify and continue")}</button>
        </form>
      </div>
    </section>
  `, "Dashboard");

  document.querySelector("[data-back]").addEventListener("click", () => {
    state.route = "login";
    state.otpDebugCode = null;
    render();
  });

  const inputs = Array.from(document.querySelectorAll(".otp-input"));
  inputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 1);
      if (input.value && inputs[index + 1]) inputs[index + 1].focus();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && inputs[index - 1]) {
        inputs[index - 1].focus();
      }
    });
  });

  document.querySelector("#otp-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const code = inputs.map((i) => i.value).join("");
    if (code.length < 4) return;

    try {
      const result = await API.verifyOtp(state.phoneDraft, code);
      state.session = result.session;
      state.auditLogs = [];
      addAuditLog(`Secure session started for +91 ******${state.phoneDraft.slice(-4)}`);
      state.route = "upload";
      saveSession();
      render();
    } catch (err) {
      addAuditLog(`OTP verification failed: ${err.message}`);
      alert(err.message);
    }
  });
}

function renderUpload() {
  const isConsentChecked = state.consentGiven;
  renderShell(`
    <section class="screen" aria-labelledby="upload-title" style="padding-bottom: 84px">
      <div class="step-header">
        <button class="icon-btn" type="button" data-back aria-label="${t("Back")}">${ICONS.back}</button>
        <h1 id="upload-title">${t("Connect Data")}</h1>
        ${renderThemeToggle("compact")}
      </div>
      
      <!-- Consent Gate Section -->
      <section class="panel consent-panel consent-section" aria-labelledby="consent-title">
        <h2 id="consent-title" class="consent-title">
          ${ICONS.shield} <span>${t("Consent & Authorization")}</span>
        </h2>
        <div class="consent-box-container">
          <p class="copy consent-desc">${t("Kaam Card parses statement details locally to build your portable record. By continuing, you agree to:")}</p>
          <ul class="consent-list">
            <li><strong>${t("Local Parsing:")}</strong> ${t("Executed strictly in-browser memory.")}</li>
            <li><strong>${t("Data Minimization:")}</strong> ${t("Raw lines are discarded after daily stats computation.")}</li>
            <li><strong>${t("Zero ID Collection:")}</strong> ${t("We never collect Aadhaar, PAN, or full bank numbers.")}</li>
          </ul>
          <label class="consent-checkbox-label consent-checkbox">
            <input type="checkbox" id="consent-check" ${isConsentChecked ? "checked" : ""} class="consent-checkbox-input">
            <span>${t("I authorize Kaam Card to parse my transaction statement.")}</span>
          </label>
        </div>
      </section>

      <div class="consent-gated-content ${isConsentChecked ? "" : "is-disabled"}">
      <p class="copy">${t("Upload a CSV or bank statement PDF. Links inside files are treated as plain text.")}</p>
      <label class="upload-zone" id="drop-zone">
        <input id="csv-file" type="file" accept=".csv,.pdf,text/csv,application/pdf">
        <span>${ICONS.upload}<strong>${t("Tap to upload CSV or PDF")}</strong><small>${t("or drag and drop. CSV or PDF, up to 5 MB.")}</small></span>
      </label>

      ${state.uploadedFiles.length > 0 ? `
      <section class="panel" aria-labelledby="files-title">
        <h2 id="files-title">${t("Uploaded files")}</h2>
        <div class="uploaded-files-list">
          ${state.uploadedFiles.map((file) => `
            <div class="uploaded-file-item" data-file-id="${escapeHtml(file.id)}">
              <div class="uploaded-file-info">
                <span class="uploaded-file-name">${escapeHtml(file.name)}</span>
                <span class="uploaded-file-meta">${file.validRows.length} ${t("rows")} · ${t(file.format === "pdf" ? "Bank PDF" : "CSV")}</span>
              </div>
              <button class="icon-btn icon-btn--small" type="button" data-remove-file="${escapeHtml(file.id)}" aria-label="${t("Remove")} ${escapeHtml(file.name)}">${ICONS.close}</button>
            </div>
          `).join("")}
        </div>
      </section>
      ` : ""}

      <section class="panel" aria-labelledby="details-title">
        <h2 id="details-title">${t("Basic details for matching")}</h2>
        <div class="details-grid">
          <label>
            <span class="field-label">${t("Age")}</span>
            <input class="text-input" id="age" type="number" min="16" max="99" value="${escapeHtml(state.details.age)}">
          </label>
          <label>
            <span class="field-label">${t("Occupation")}</span>
            <select class="select-input" id="occupation">
              ${OCCUPATIONS.map((item) => `<option ${item === state.details.occupation ? "selected" : ""} value="${escapeHtml(item)}">${escapeHtml(t(item))}</option>`).join("")}
            </select>
          </label>
          <label>
            <span class="field-label">${t("State")}</span>
            <select class="select-input" id="state-select">
              ${STATES.map((item) => `<option ${item === state.details.state ? "selected" : ""} value="${escapeHtml(item)}">${escapeHtml(t(item))}</option>`).join("")}
            </select>
          </label>
        </div>
      </section>
      <section class="panel" aria-labelledby="manual-title">
        <h2 id="manual-title">
          <button class="collapse-toggle" type="button" data-toggle-manual aria-expanded="false" aria-controls="manual-section">${t("Manual income entry")}</button>
        </h2>
        <div id="manual-section" class="manual-section" hidden>
          <div class="manual-form">
            <label>
              <span class="field-label">${t("Date")}</span>
              <input class="text-input" id="manual-date" type="date" value="${new Date().toISOString().slice(0, 10)}">
            </label>
            <label>
              <span class="field-label">${t("Amount")}</span>
              <input class="text-input" id="manual-amount" type="number" min="1" step="1" placeholder="500">
            </label>
            <label>
              <span class="field-label">${t("Source")}</span>
              <select class="select-input" id="manual-source">
                <option value="Cash">${t("Cash")}</option>
                <option value="UPI">UPI</option>
                <option value="Platform credit">${t("Platform credit")}</option>
                <option value="Bank transfer">${t("Bank transfer")}</option>
                <option value="Other">${t("Other")}</option>
              </select>
            </label>
            <button class="secondary-btn" type="button" data-add-manual-entry>+ ${t("Add entry")}</button>
          </div>
          ${state.incomeEntries.length > 0 ? `
          <div class="manual-entries-list">
            ${state.incomeEntries.map((entry, i) => `
              <div class="manual-entry-row">
                <span class="manual-entry-date">${entry.date}</span>
                <span class="manual-entry-amount">₹${entry.amount.toLocaleString(locale())}</span>
                <span class="manual-entry-source">${entry.source}</span>
                <button class="icon-btn icon-btn--small" type="button" data-remove-manual="${i}" aria-label="${t("Remove entry")}">${ICONS.close}</button>
              </div>
            `).join("")}
          </div>
          ` : ""}
        </div>
      </section>

      <section class="panel" aria-labelledby="samples-title">
        <h2 id="samples-title">${t("Sample datasets")}</h2>
        <div class="samples-grid">
          ${SAMPLE_DATASETS.map((sample) => `
            <button class="sample-btn" type="button" data-sample="${escapeHtml(sample.id)}">${ICONS.file}<span>${escapeHtml(t(sample.name))}</span></button>
          `).join("")}
        </div>
      </section>
      </div>
      ${state.parseResult ? renderParseStatus() : ""}
      <button class="primary-btn" type="button" data-dashboard ${state.profile ? "" : "disabled"}>${t("Continue to dashboard")}</button>
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

  const toggleManual = document.querySelector("[data-toggle-manual]");
  if (toggleManual) {
    toggleManual.addEventListener("click", () => {
      const section = document.querySelector("#manual-section");
      const expanded = toggleManual.getAttribute("aria-expanded") === "true";
      toggleManual.setAttribute("aria-expanded", !expanded);
      section.hidden = expanded;
    });
  }

  document.querySelector("[data-add-manual-entry]")?.addEventListener("click", () => {
    const dateInput = document.querySelector("#manual-date");
    const amountInput = document.querySelector("#manual-amount");
    const sourceSelect = document.querySelector("#manual-source");
    const date = dateInput?.value;
    const amount = parseFloat(amountInput?.value);
    const source = sourceSelect?.value || "Manual";

    if (!date) { alert("Please select a date."); return; }
    if (!Number.isFinite(amount) || amount <= 0) { alert("Please enter a valid amount."); return; }

    state.incomeEntries.push({ date, amount, source });
    addAuditLog(`Manual entry added: ₹${amount} on ${date} (${source})`);
    recomputeAll();
  });

  document.querySelectorAll("[data-remove-manual]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-remove-manual"), 10);
      if (!isNaN(idx) && idx >= 0 && idx < state.incomeEntries.length) {
        const removed = state.incomeEntries[idx];
        state.incomeEntries.splice(idx, 1);
        addAuditLog(`Manual entry removed: ₹${removed.amount} on ${removed.date}`);
        recomputeAll();
      }
    });
  });

  const consentCheck = document.querySelector("#consent-check");
  if (consentCheck) {
    consentCheck.addEventListener("change", (event) => {
      state.consentGiven = event.target.checked;
      addAuditLog(state.consentGiven ? "Consent authorized: user agreed to browser-local transaction processing." : "Consent revoked.");
      const gated = document.querySelector(".consent-gated-content");
      if (gated) {
        gated.classList.toggle("is-disabled", !state.consentGiven);
      }
      saveSession();
    });
  }

  document.querySelectorAll("[data-sample]").forEach((button) => {
    button.addEventListener("click", () => {
      const sample = SAMPLE_DATASETS.find((item) => item.id === button.dataset.sample);
      addAuditLog(`Loaded sample dataset: ${sample.name}`);
      const parseResult = parseTransactions(sample.csv);
      const fileEntry = {
        id: "file_" + Date.now(),
        name: sample.name + " (sample)",
        type: "csv",
        validRows: parseResult.validRows,
        errors: parseResult.errors,
        format: parseResult.format || "generic"
      };
      state.uploadedFiles.push(fileEntry);
      if (sample.occupation) state.details.occupation = sample.occupation;
      if (sample.state) state.details.state = sample.state;
      if (sample.age) state.details.age = sample.age;
      state.parseResult = {
        totalRows: parseResult.validRows.length + parseResult.errors.length,
        validRows: parseResult.validRows.length,
        errors: parseResult.errors,
        source: fileEntry.name,
        format: parseResult.format || "generic"
      };
      recomputeAll();
    });
  });

  const fileInput = document.querySelector("#csv-file");
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) {
      addAuditLog(`Selected statement file: ${file.name}`);
      handleFileUpload(file);
    }
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
    if (file) {
      addAuditLog(`Dropped statement file: ${file.name}`);
      handleFileUpload(file);
    }
  });

  const dashboardButton = document.querySelector("[data-dashboard]");
  if (dashboardButton) {
    dashboardButton.addEventListener("click", () => {
      updateDetails();
      state.route = "dashboard";
      render();
    });
  }

  document.querySelectorAll("[data-remove-file]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fileId = btn.getAttribute("data-remove-file");
      const idx = state.uploadedFiles.findIndex((f) => f.id === fileId);
      if (idx !== -1) {
        const removed = state.uploadedFiles[idx];
        state.uploadedFiles.splice(idx, 1);
        addAuditLog(`Removed file: ${removed.name}`);
        if (state.uploadedFiles.length === 0) {
          state.mergedTransactions = null;
          state.profile = null;
          state.expenseProfile = null;
          state.matches = [];
          state.parseResult = null;
          saveSession();
          render();
        } else {
          recomputeAll();
        }
      }
    });
  });

  bindBottomNav();
}

function updateDetails() {
  const oldAge = state.details.age;
  const oldOcc = state.details.occupation;
  const oldState = state.details.state;

  const age = Number(document.querySelector("#age")?.value || state.details.age);
  state.details.age = Number.isFinite(age) ? age : state.details.age;
  state.details.occupation = document.querySelector("#occupation")?.value || state.details.occupation;
  state.details.state = document.querySelector("#state-select")?.value || state.details.state;
  
  if (state.profile) {
    state.matches = matchSchemes(state.details, state.profile);
  }

  if (oldAge !== state.details.age || oldOcc !== state.details.occupation || oldState !== state.details.state) {
    addAuditLog(`Worker parameters updated: Age=${state.details.age}, Occupation=${state.details.occupation}, State=${state.details.state}`);
    addAuditLog(`Re-calculated matches: ${state.matches.filter(m => m.eligible).length} schemes eligible.`);
    saveSession();
  }
}

function handleFileUpload(file) {
  const isCsv = file.name.toLowerCase().endsWith(".csv") || (file.type && file.type.includes("csv"));
  const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";

  if (!isCsv && !isPdf) {
    state.parseResult = {
      totalRows: 0,
      validRows: 0,
      errors: [{ row: "-", issue: "Please upload a CSV or PDF file." }],
      source: file.name
    };
    state.profile = null;
    state.matches = [];
    render();
    return;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
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

  if (isCsv) {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      updateDetails();
      const csvText = String(reader.result || "");
      const parseResult = parseTransactions(csvText);
      const fileEntry = {
        id: "file_" + Date.now(),
        name: file.name,
        type: "csv",
        validRows: parseResult.validRows,
        errors: parseResult.errors,
        format: parseResult.format || "generic"
      };
      state.uploadedFiles.push(fileEntry);
      state.parseResult = {
        totalRows: parseResult.validRows.length + parseResult.errors.length,
        validRows: parseResult.validRows.length,
        errors: parseResult.errors,
        source: file.name,
        format: parseResult.format || "generic"
      };
      recomputeAll();
    });
    reader.readAsText(file);
  } else if (isPdf) {
    const reader = new FileReader();
    reader.addEventListener("load", async () => {
      updateDetails();
      try {
        const pdfData = new Uint8Array(reader.result);
        const parseResult = await window.KaamPdfParser.parse(pdfData);
        const fileEntry = {
          id: "file_" + Date.now(),
          name: file.name,
          type: "pdf",
          validRows: parseResult.validRows,
          errors: parseResult.errors,
          format: "pdf"
        };
        state.uploadedFiles.push(fileEntry);
        state.parseResult = {
          totalRows: parseResult.validRows.length + parseResult.errors.length,
          validRows: parseResult.validRows.length,
          errors: parseResult.errors,
          source: file.name,
          format: "pdf"
        };
        recomputeAll();
      } catch (error) {
        state.parseResult = {
          totalRows: 0,
          validRows: 0,
          errors: [{ row: "-", issue: "PDF parsing error: " + error.message }],
          source: file.name
        };
        state.profile = null;
        state.matches = [];
        render();
      }
    });
    reader.readAsArrayBuffer(file);
  }
}

function renderParseStatus() {
  const result = state.parseResult;
  const issueRows = result.errors.slice(0, 4).map((error) => `
    <tr>
      <td>${escapeHtml(error.row)}</td>
      <td>${escapeHtml(t(error.issue))}</td>
    </tr>
  `).join("");

  const formatLabels = { generic: "Generic CSV", gpay: "Google Pay", phonepe: "PhonePe", paytm: "PayTM", pdf: "Bank PDF" };

  return `
    <section class="panel parse-card" aria-labelledby="parse-title">
      <h2 id="parse-title">${t("Parse status")}</h2>
      <div class="status-list">
        <div class="status-item">
          <span class="status-ok">${ICONS.check}</span>
          <span>${result.validRows > 0 ? t("Parsed income rows") : t("No usable income rows yet")}</span>
          <strong>${escapeHtml(result.validRows)}${t(" of ")}${escapeHtml(result.totalRows)}</strong>
        </div>
        <div class="status-item">
          <span class="status-ok" style="color:var(--muted)">${ICONS.file}</span>
          <span>${t("Detected format:")}</span>
          <strong>${escapeHtml(formatLabels[result.format] || result.format || "Generic CSV")}</strong>
        </div>
        ${result.errors.length ? `
          <div class="status-item">
            <span class="status-warn">${ICONS.alert}</span>
            <span>${t("Rows skipped safely")}</span>
            <strong>${escapeHtml(result.errors.length)}</strong>
          </div>
        ` : ""}
      </div>
      ${result.errors.length ? `
        <div class="warning-box">
          <div class="warning-title">${ICONS.alert}<span>${t("We skipped malformed rows instead of crashing.")}</span></div>
          <table class="issues-table">
            <thead><tr><th>${t("Row")}</th><th>${t("Issue")}</th></tr></thead>
            <tbody>${issueRows}</tbody>
          </table>
        </div>
      ` : ""}
      ${!state.profile ? `<p class="error-note">${t("Add at least one valid credit/income row to continue.")}</p>` : ""}
    </section>
  `;
}

function renderInsightsPage() {
  if (!state.profile) {
    state.route = "upload";
    render();
    return;
  }

  const profile = state.profile;
  const expenseProfile = state.expenseProfile;
  const maxAmount = Math.max(...profile.dailySeries.map((day) => day.amount), 1);

  const variance = profile.variance;
  const avgDaily = profile.averageDaily;
  const stabilityScore = avgDaily > 0 ? Math.round((1 - Math.sqrt(variance) / avgDaily) * 100) : 0;
  const stabilityLabel = stabilityScore >= 60 ? "High" : stabilityScore >= 35 ? "Medium" : "Low";
  const stabilityColor = stabilityScore >= 60 ? "var(--green, #22c55e)" : stabilityScore >= 35 ? "var(--accent)" : "var(--red)";

  const weeks = [];
  for (let i = 0; i < profile.dailySeries.length; i += 7) {
    const week = profile.dailySeries.slice(i, i + 7);
    const total = week.reduce((s, d) => s + d.amount, 0);
    const label = dateLabel(week[0].date) + (week.length > 1 ? `-${dateLabel(week[week.length-1].date)}` : "");
    weeks.push({ label, total, days: week.length });
  }

  const threeMonthProjection = (profile.savings.monthlySaving * 3);
  const sixMonthProjection = (profile.savings.monthlySaving * 6);

  const insightContent = `
    <section class="dashboard-assistant-view">
      <div class="dashboard-breadcrumbs">
        <span class="crumb">${t("For you")}</span>
        <span class="crumb-separator">/</span>
        <span class="crumb active">${t("Income Analytics")}</span>
        <span class="demo-badge">${t("SECURE SANDBOX")}</span>
      </div>

      <div class="dashboard-intro">
        <h1 class="main-dashboard-title">${t("Income Insights")}</h1>
        <p class="copy">${t("Understand your earnings variance, good days vs bad days, and average monthly income instantly.")}</p>
      </div>

      <div style="display:grid;gap:24px">
        <!-- Stability Card -->
        <article class="google-card">
          <div class="google-card-header">${ICONS.shield} <span>${t("Income Stability")}</span></div>
          <div style="display:flex;align-items:center;gap:16px;padding:16px 0 8px">
            <div style="width:72px;height:72px;border-radius:50%;border:4px solid ${stabilityColor};display:grid;place-items:center;flex:0 0 auto">
              <span style="font-size:1.05rem;font-weight:700;color:var(--ink)">${stabilityLabel}</span>
            </div>
            <div>
              <div style="font-size:1.8rem;font-weight:600;color:var(--ink)">${stabilityScore}%</div>
              <div style="font-size:0.82rem;color:var(--muted)">${t("Stability score based on income variance")}</div>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="stat-item-google"><span>${t("Daily Avg")}</span><strong>${formatMoney(avgDaily)}</strong></div>
            <div class="stat-item-google"><span>${t("Monthly Estimate")}</span><strong>${formatMoney(profile.monthlyIncomeEstimate)}</strong></div>
            <div class="stat-item-google"><span>${t("Good Days")}</span><strong>${profile.goodDays}/${profile.periodDays}</strong></div>
            <div class="stat-item-google"><span>${t("Bad Days")}</span><strong>${profile.badDays}/${profile.periodDays}</strong></div>
          </div>
        </article>

        <!-- Income Chart (full width) -->
        <article class="google-card">
          <div class="google-card-header">${ICONS.bars} <span>${t("Daily Income")}</span> ${speakBtn(`${t("Daily Income")}. ${t("Daily Avg")}: ${formatMoney(avgDaily)}. ${t("Range")}: ${formatMoney(Math.min(...profile.dailySeries.filter(d => d.amount > 0).map(d => d.amount)))} ${t("to")} ${formatMoney(Math.max(...profile.dailySeries.map(d => d.amount)))}.`, state.lang)}</div>
          <h3 class="google-card-title">${t("Daily earnings trend")} — ${dateLabel(profile.start)} ${t("to")} ${dateLabel(profile.end)}</h3>
          <div style="margin-top:12px">
            <div class="bar-chart" style="grid-template-columns: repeat(${profile.dailySeries.length}, 1fr); gap: 3px; height: 200px;" role="img" aria-label="${t("Daily income bar chart")}">
              ${profile.dailySeries.map((day) => {
                const height = Math.max(3, (day.amount / maxAmount) * 100);
                const cls = day.amount === 0 ? "is-empty" : day.amount <= profile.badThreshold ? "is-bad" : day.amount >= profile.goodThreshold ? "is-good" : "";
                return `<span class="bar ${cls}" style="height:${height.toFixed(2)}%" title="${dateLabel(day.date)}: ${formatMoney(day.amount)}"></span>`;
              }).join("")}
            </div>
            <div class="bar-labels" style="margin-top:8px"><span>${dateLabel(profile.start)}</span><span>${dateLabel(profile.end)}</span></div>
          </div>
          <div style="margin-top:12px;display:flex;gap:16px;font-size:0.82rem;color:var(--muted);flex-wrap:wrap">
            <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--accent);margin-right:4px"></span> ${t("Good Days")} (${t("above")} ${formatMoney(profile.goodThreshold)})</span>
            <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--muted);margin-right:4px"></span> ${t("Bad Days")} (${t("below")} ${formatMoney(profile.badThreshold)})</span>
            <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--line);margin-right:4px"></span> ${t("No Income")}</span>
          </div>
        </article>

        <!-- Week-over-week breakdown -->
        ${weeks.length > 1 ? `
        <article class="google-card">
          <div class="google-card-header">${ICONS.bars} <span>${t("Weekly Breakdown")}</span></div>
          <h3 class="google-card-title">${t("Income trend week by week")}</h3>
          <div style="margin-top:12px;display:grid;gap:8px">
            ${weeks.map((w, i) => {
              const pct = (w.total / maxAmount / weeks.length) * 100;
              const prev = i > 0 ? weeks[i-1].total : w.total;
              const change = prev > 0 ? Math.round(((w.total - prev) / prev) * 100) : 0;
              const changeIcon = change > 5 ? "▲" : change < -5 ? "▼" : "—";
              const changeColor = change > 5 ? "#22c55e" : change < -5 ? "var(--red)" : "var(--muted)";
              return `
                <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--line)">
                  <div style="min-width:90px;font-size:0.78rem;color:var(--muted)">${w.label}</div>
                  <div style="flex:1;height:20px;background:var(--surface);border-radius:4px;overflow:hidden">
                    <div style="height:100%;width:${Math.max(3, (w.total / Math.max(...weeks.map(x => x.total))) * 100).toFixed(1)}%;background:var(--accent);border-radius:4px;min-width:4px"></div>
                  </div>
                  <div style="min-width:80px;text-align:right;font-weight:600;font-size:0.85rem">${formatMoney(w.total)}</div>
                  <div style="min-width:40px;text-align:right;font-size:0.78rem;color:${changeColor};font-weight:600">${changeIcon} ${Math.abs(change)}%</div>
                </div>
              `;
            }).join("")}
          </div>
        </article>
        ` : ""}

        <!-- Expense vs Income Comparison -->
        ${expenseProfile ? `
        <article class="google-card">
          <div class="google-card-header">${ICONS.wallet} <span>${t("Income vs Expenses")}</span></div>
          <h3 class="google-card-title">${t("How your earnings compare to spending")}</h3>
          <div style="margin-top:16px;display:grid;gap:16px">
            <div style="display:flex;align-items:center;gap:16px">
              <div style="flex:1">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:0.82rem">
                  <span>${t("Total Income")}</span>
                  <strong>${formatMoney(profile.totalIncome)}</strong>
                </div>
                <div style="height:12px;background:var(--surface);border-radius:6px;overflow:hidden">
                  <div style="height:100%;background:var(--accent);border-radius:6px;width:100%"></div>
                </div>
              </div>
              <div style="flex:1">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:0.82rem">
                  <span>${t("Total Expenses")}</span>
                  <strong>${formatMoney(expenseProfile.totalExpenses)}</strong>
                </div>
                <div style="height:12px;background:var(--surface);border-radius:6px;overflow:hidden">
                  <div style="height:100%;background:var(--muted);border-radius:6px;width:${Math.min(100, (expenseProfile.totalExpenses / Math.max(1, profile.totalIncome)) * 100).toFixed(1)}%"></div>
                </div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="stat-item-google"><span>${t("Expense Ratio")}</span><strong>${profile.totalIncome > 0 ? Math.round((expenseProfile.totalExpenses / profile.totalIncome) * 100) : 0}%</strong></div>
              <div class="stat-item-google"><span>${t("Top Category")}</span><strong>${expenseProfile.topCategory}</strong></div>
            </div>
          </div>
        </article>

        <article class="google-card">
          <div class="google-card-header">${ICONS.list} <span>${t("Budget")}</span></div>
          <div style="margin-top:12px">
            ${renderBudgetRows(expenseProfile)}
          </div>
        </article>
        ` : ""}

        <!-- Savings Projection -->
        <article class="google-card">
          <div class="google-card-header">${ICONS.rupee} <span>${t("Savings Projection")}</span> ${speakBtn(`${t("Savings Projection")}. ${t("Save Rs")} ${formatMoney(profile.savings.savePerGoodDay)} ${t("on good days")}. ${t("Monthly saving")}: ${formatMoney(profile.savings.monthlySaving)}. ${t("In 3 months")}: ${formatMoney(threeMonthProjection)}. ${t("In 6 months")}: ${formatMoney(sixMonthProjection)}.`, state.lang)}</div>
          <h3 class="google-card-title">${t("Project your savings forward")}</h3>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px">
            <div class="stat-item-google" style="text-align:center;padding:16px 8px;background:var(--surface);border-radius:12px">
              <span>${t("Monthly")}</span>
              <strong style="font-size:1.3rem">${formatMoney(profile.savings.monthlySaving)}</strong>
            </div>
            <div class="stat-item-google" style="text-align:center;padding:16px 8px;background:var(--surface);border-radius:12px">
              <span>${t("3 Months")}</span>
              <strong style="font-size:1.3rem">${formatMoney(threeMonthProjection)}</strong>
            </div>
            <div class="stat-item-google" style="text-align:center;padding:16px 8px;background:var(--surface);border-radius:12px">
              <span>${t("6 Months")}</span>
              <strong style="font-size:1.3rem">${formatMoney(sixMonthProjection)}</strong>
            </div>
          </div>
          <p class="copy" style="margin-top:14px;font-size:0.86rem">${t("Save Rs")} ${formatMoney(profile.savings.savePerGoodDay)} ${t("on days earning above")} ${formatMoney(profile.goodThreshold)}. ${t("This will cover up to")} ${profile.savings.coveredLowDays} ${t("low-income days per month.")}</p>
        </article>

        <!-- Tax Estimation -->
        <article class="google-card">
          <div class="google-card-header">${ICONS.shield} <span>${t("Tax Estimation")}</span></div>
          <h3 class="google-card-title">${t("Estimated annual tax liability")}</h3>
          ${(() => {
            const annualIncome = profile.monthlyIncomeEstimate * 12;
            let tax = 0;
            if (annualIncome > 1200000) tax = (annualIncome - 1200000) * 0.3 + 150000;
            else if (annualIncome > 1000000) tax = (annualIncome - 1000000) * 0.2 + 100000;
            else if (annualIncome > 800000) tax = (annualIncome - 800000) * 0.15 + 50000;
            else if (annualIncome > 600000) tax = (annualIncome - 600000) * 0.1 + 25000;
            else if (annualIncome > 400000) tax = (annualIncome - 400000) * 0.05;
            else tax = 0;
            const netIncome = annualIncome - tax;
            return `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px">
              <div class="stat-item-google"><span>${t("Annual income")}</span><strong>${formatMoney(annualIncome)}</strong></div>
              <div class="stat-item-google"><span>${t("Estimated tax")}</span><strong>${formatMoney(tax)}</strong></div>
              <div class="stat-item-google"><span>${t("Net income after tax")}</span><strong>${formatMoney(netIncome)}</strong></div>
              <div class="stat-item-google"><span>${t("Effective tax rate")}</span><strong>${annualIncome > 0 ? ((tax / annualIncome) * 100).toFixed(1) : 0}%</strong></div>
            </div>
            <div class="google-card-footer" style="margin-top:12px;padding:8px 12px;background:var(--surface);border-radius:8px">
              <small style="color:var(--muted)">${t("This is a simplified estimate. Consult a CA for accurate tax planning.")}</small>
            </div>`;
          })()}
        </article>
      </div>

      ${renderBottomNav("Insights")}
    </section>
  `;

  renderShell(insightContent, "Insights", "wide");

  document.querySelectorAll("[data-budget-amount]").forEach((input) => {
    input.addEventListener("change", () => {
      const cat = input.getAttribute("data-budget-amount");
      const val = parseFloat(input.value);
      state.budgets[cat] = Number.isFinite(val) && val >= 0 ? val : 0;
      saveSession();
    });
  });

  bindSpeakButtons();
  bindBottomNav();
}

function renderDashboard(activeView = "Dashboard") {
  if (!state.profile) {
    state.route = "upload";
    render();
    return;
  }

  // Recalculate matches
  state.matches = matchSchemes(state.details, state.profile);

  const profile = state.profile;
  
  // Filter matches based on search query
  let filteredMatches = state.matches;
  if (state.schemeQuery) {
    const query = state.schemeQuery.toLowerCase();
    filteredMatches = state.matches.filter(
      (m) => m.name.toLowerCase().includes(query) || m.shortName.toLowerCase().includes(query)
    );
  }
  
  const eligible = filteredMatches.filter((item) => item.eligible);
  const nearMatches = filteredMatches.filter((item) => !item.eligible).slice(0, 2);
  const shownSchemes = [...eligible, ...nearMatches].slice(0, 6);

  function incomeSpeakText() {
    return `${t("Income Analytics")}. ${t("Daily earnings trend and variations")}. ${t("Daily Avg")}: ${formatMoney(profile.averageDaily)}. ${t("Good Days")}: ${profile.goodDays}. ${t("Bad Days")}: ${profile.badDays}. ${t("Analyzed period")}: ${dateLabel(profile.start)} ${t("to")} ${dateLabel(profile.end)}.`;
  }

  // Card 1: Income Analytics
  const incomeAnalyticsCard = `
    <article class="google-card card-analytics">
      <div class="google-card-header">
        ${ICONS.bars}
        <span>${t("Income Analytics")}</span>
        ${speakBtn(incomeSpeakText(), state.lang)}
      </div>
      <h3 class="google-card-title">${t("Daily earnings trend and variations")}</h3>
      <div class="google-card-body">
        ${renderIncomeChart(profile)}
      </div>
      <div class="google-card-footer">
        <span>${t("Analyzed period:")} ${dateLabel(profile.start)}${t(" to ")}${dateLabel(profile.end)}</span>
      </div>
    </article>
  `;

  function savingsSpeakText() {
    return `${t("Smart Suggestion")}. ${t("Save Rs")} ${formatMoney(profile.savings.savePerGoodDay)} ${t("on days earning above")} ${formatMoney(profile.goodThreshold)}. ${t("Tied to your actual data, this habit will accumulate about")} ${formatMoney(profile.savings.monthlySaving)} ${t("per month")} ${t("and cover up to")} ${profile.savings.coveredLowDays} ${t("low-income days.")}`;
  }

  // Card 2: Savings recommendation
  const savingsCard = `
    <article class="google-card card-savings">
      <div class="google-card-header">
        ${ICONS.wallet}
        <span>${t("Smart Suggestion")}</span>
        ${speakBtn(savingsSpeakText(), state.lang)}
      </div>
      <h3 class="google-card-title">${t("Arithmetic-based micro-savings rule")}</h3>
      <div class="google-card-body">
        <div class="savings-highlight">
          <strong>${t("Save Rs")} ${formatMoney(profile.savings.savePerGoodDay)}</strong>
          <span>${t("on days earning above")} ${formatMoney(profile.goodThreshold)}</span>
        </div>
        <p class="copy" style="font-size: 0.9rem; margin-top: 10px;">
          ${t("Tied to your actual data, this habit will accumulate about")} <strong>${formatMoney(profile.savings.monthlySaving)}/month</strong> ${t("and cover up to")} <strong>${profile.savings.coveredLowDays}</strong> ${t("low-income days.")}
        </p>
      </div>
      <div class="google-card-footer">
        <span>${t("Low-income threshold:")} ${formatMoney(profile.badThreshold)}</span>
      </div>
    </article>
  `;

  // Card 3 (optional): Expense Summary
  const expenseProfile = state.expenseProfile;
  const expenseCard = `
    <article class="google-card card-expense">
      <div class="google-card-header">
        ${ICONS.wallet}
        <span>${t("Expense Summary")}</span>
      </div>
      <h3 class="google-card-title">${expenseProfile ? t("Spending breakdown from your statement") : t("Upload a statement to see spending breakdown")}</h3>
      <div class="google-card-body">
        ${expenseProfile ? `
        <div class="stats-grid-google">
          <div class="stat-item-google">
            <span>${t("Total Expenses")}</span>
            <strong>${formatMoney(expenseProfile.totalExpenses)}</strong>
          </div>
          <div class="stat-item-google">
            <span>${t("Avg daily")}</span>
            <strong>${formatMoney(expenseProfile.avgDailyExpense)}</strong>
          </div>
          <div class="stat-item-google">
            <span>${t("Top Category")}</span>
            <strong class="expense-top-cat">${expenseProfile.topCategory}</strong>
          </div>
        </div>
        <div style="margin-top:12px">
          <div class="expense-category-bar" style="display:flex;gap:4px;height:24px;border-radius:6px;overflow:hidden">
            ${expenseProfile.sortedCategories.slice(0, 5).map(([cat, amount]) => {
              const pct = Math.max(3, (amount / expenseProfile.totalExpenses) * 100);
              const colors = ["#C85A32","#8C857B","#B8A99A","#D9D5CC","#E8E5DE"];
              const idx = expenseProfile.sortedCategories.slice(0, 5).findIndex(([c]) => c === cat);
              return `<span style="width:${pct.toFixed(1)}%;background:${colors[idx]};min-width:4px" title="${cat}: ${formatMoney(amount)}"></span>`;
            }).join("")}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;font-size:0.75rem;color:var(--muted)">
            ${expenseProfile.sortedCategories.slice(0, 5).map(([cat, amount], i) => {
              const colors = ["#C85A32","#8C857B","#B8A99A","#D9D5CC","#E8E5DE"];
              return `<span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:2px;background:${colors[i]};display:inline-block"></span>${cat} (${Math.round((amount / expenseProfile.totalExpenses) * 100)}%)</span>`;
            }).join("")}
          </div>
        </div>
        ` : `<p class="copy">${t("Upload a bank statement to get automatic expense categorization and budgeting insights.")}</p>`}
      </div>
    </article>
  `;

  // Card 4: Loan Eligibility
  const loans = checkLoanEligibility(state.details, state.profile);
  const eligibleLoans = loans.filter((l) => l.eligible);
  const loanCard = `
    <article class="google-card card-loan">
      <div class="google-card-header">
        ${ICONS.rupee}
        <span>${t("Loan Eligibility")}</span>
      </div>
      <h3 class="google-card-title">${eligibleLoans.length > 0 ? `${eligibleLoans.length} ${t("loan options available")}` : t("No loans match your profile")}</h3>
      <div class="google-card-body">
        ${eligibleLoans.length > 0 ? eligibleLoans.slice(0, 3).map((loan) => `
          <div class="loan-item" style="padding:10px 0;border-bottom:1px solid var(--border)">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <strong>${t(loan.name)}</strong>
              <span style="font-size:0.82rem;color:var(--green)">${t("Eligible")}</span>
            </div>
            <p class="copy" style="font-size:0.82rem;margin:4px 0">${t(loan.description)}</p>
            <div style="display:flex;gap:12px;font-size:0.78rem;color:var(--muted)">
              <span>${t("Up to")} ${formatMoney(loan.maxAmount)}</span>
              <span>${loan.interestRate}</span>
            </div>
          </div>
        `).join("") : `
          <p class="copy" style="font-size:0.85rem">${t("Try adjusting your details or uploading more income data to improve eligibility.")}</p>
        `}
      </div>
    </article>
  `;

  // Card 5: Document Checklist
  const ALL_DOCUMENTS = ["Aadhaar Card", "PAN Card", "Bank account passbook", "Mobile number linked with Aadhaar", "Ration card", "Voter ID", "Driving license", "Income certificate"];
  const checkedCount = ALL_DOCUMENTS.filter((d) => state.documents[d]).length;
  const documentCard = `
    <article class="google-card card-docs">
      <div class="google-card-header">
        ${ICONS.file}
        <span>${t("Documents")}</span>
      </div>
      <h3 class="google-card-title">${checkedCount}/${ALL_DOCUMENTS.length} ${t("documents ready")}</h3>
      <div class="google-card-body">
        <div style="height:8px;background:var(--surface);border-radius:4px;overflow:hidden;margin-bottom:12px">
          <div style="height:100%;background:var(--accent);border-radius:4px;width:${(checkedCount / ALL_DOCUMENTS.length) * 100}%"></div>
        </div>
        <div class="doc-checklist-grid">
          ${ALL_DOCUMENTS.map((doc) => `
            <label class="doc-check-item">
              <input type="checkbox" ${state.documents[doc] ? "checked" : ""} data-doc="${escapeHtml(doc)}">
              <span>${t(doc)}</span>
            </label>
          `).join("")}
        </div>
      </div>
    </article>
  `;

  // Card 6: Welfare Schemes
  const schemesCard = `
    <article class="google-card card-schemes">
      <div class="google-card-header">
        ${ICONS.schemes}
        <span>${t("Welfare Matching")}</span>
      </div>
      <h3 class="google-card-title">${t("Eligible public schemes (")}${eligible.length}${t(" matched)")}</h3>
      <div class="google-card-body">
        <div class="scheme-list scheme-list--compact">
          ${shownSchemes.length ? shownSchemes.map(renderSchemeCard).join("") : `<div class="empty-state">${t("No scheme matches found. Try adjusting search or details.")}</div>`}
        </div>
      </div>
    </article>
  `;

  // Card: Deadline Calendar
  const deadlineCalendarCard = (() => {
    const allSchemes = [...FALLBACK_SCHEMES, ...state.schemesDb];
    const now = new Date();
    const upcomingDeadlines = allSchemes
      .filter(s => s.deadline)
      .map(s => {
        const deadline = new Date(s.deadline);
        const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        return { ...s, deadlineDate: deadline, daysLeft };
      })
      .filter(s => s.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 6);

    return `
      <article class="google-card card-deadlines">
        <div class="google-card-header">
          ${ICONS.shield}
          <span>${t("Application Deadlines")}</span>
        </div>
        <h3 class="google-card-title">${upcomingDeadlines.length > 0 ? t("Upcoming scheme application deadlines") : t("No upcoming deadlines right now")}</h3>
        <div class="google-card-body">
          ${upcomingDeadlines.length > 0 ? `
          <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">
            ${upcomingDeadlines.map(s => {
              const isUrgent = s.daysLeft <= 7;
              const isWarning = s.daysLeft <= 30;
              return `
                <li style="padding:10px;background:var(--surface);border-radius:8px;border-left:3px solid ${isUrgent ? 'var(--red)' : isWarning ? 'var(--accent)' : 'var(--green)'};font-size:0.85rem;line-height:1.5;display:flex;justify-content:space-between;align-items:center">
                  <div>
                    <strong>${escapeHtml(t(s.shortName || s.name))}</strong>
                    <span style="margin-left:8px;padding:2px 6px;border-radius:4px;font-size:0.7rem;font-weight:600;background:${isUrgent ? 'var(--red-soft)' : isWarning ? 'var(--accent-soft)' : 'var(--green-soft)'};color:${isUrgent ? 'var(--red)' : isWarning ? 'var(--accent)' : 'var(--green)'}">${s.daysLeft} ${t("days left")}</span>
                  </div>
                  <span style="color:var(--muted);font-size:0.75rem">${s.deadlineDate.toLocaleDateString(locale())}</span>
                </li>
              `;
            }).join("")}
          </ul>
          ` : `<p class="copy">${t("Check back later for scheme application deadlines.")}</p>`}
          <p class="copy" style="margin-top:12px;font-size:0.75rem">${t("Deadlines are indicative. Verify on official portals.")}</p>
        </div>
      </article>
    `;
  })();

  // Card 7: Financial Literacy Tips
  const financialTipsCard = (expenseProfile && state.profile) ? (() => {
    const tips = generateFinancialTips(state.profile, expenseProfile);
    if (tips.length === 0) return "";
    return `
      <article class="google-card card-tips">
        <div class="google-card-header">
          ${ICONS.shield}
          <span>${t("Smart Tips")}</span>
        </div>
        <h3 class="google-card-title">${t("Personalized financial guidance")}</h3>
        <div class="google-card-body">
          <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">
            ${tips.slice(0, 3).map(tip => `
              <li style="padding:10px;background:var(--surface);border-radius:8px;border-left:3px solid var(--accent);font-size:0.85rem;line-height:1.5">
                ${tip}
              </li>
            `).join("")}
          </ul>
        </div>
      </article>
    `;
  })() : "";

  // Card 8: Savings Goals
  const savingsGoalsCard = state.savingsGoals && state.savingsGoals.length > 0 ? (() => {
    const goals = state.savingsGoals.filter(g => g.isActive !== false);
    if (goals.length === 0) return "";
    return `
      <article class="google-card card-goals">
        <div class="google-card-header">
          ${ICONS.wallet}
          <span>${t("Savings Goals")}</span>
        </div>
        <h3 class="google-card-title">${t("Track your saving targets")}</h3>
        <div class="google-card-body">
          ${goals.slice(0, 3).map(goal => {
            const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
            const daysLeft = goal.targetDate ? Math.ceil((new Date(goal.targetDate) - new Date()) / (1000*60*60*24)) : null;
            return `
              <div style="margin-bottom:16px;padding:12px;background:var(--surface);border-radius:8px">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                  <strong>${escapeHtml(goal.name)}</strong>
                  <span style="font-size:0.82rem;color:var(--muted)">${daysLeft !== null ? daysLeft + " " + t("days left") : ""}</span>
                </div>
                <div style="height:8px;background:var(--line);border-radius:4px;overflow:hidden;margin-bottom:6px">
                  <div style="height:100%;background:var(--accent);border-radius:4px;width:${progress}%"></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--muted)">
                  <span>${formatMoney(goal.currentAmount)} / ${formatMoney(goal.targetAmount)}</span>
                  <span>${progress.toFixed(0)}%</span>
                </div>
              </div>
            `;
          }).join("")}
          <button class="primary-btn" style="width:100%;margin-top:8px" data-add-goal>${ICONS.plus} ${t("Add Goal")}</button>
        </div>
      </article>
    `;
  })() : `
      <article class="google-card card-goals">
        <div class="google-card-header">
          ${ICONS.wallet}
          <span>${t("Savings Goals")}</span>
        </div>
        <h3 class="google-card-title">${t("Set a saving target")}</h3>
        <div class="google-card-body">
          <p class="copy" style="margin-bottom:12px">${t("Create a goal to save for emergencies, festivals, or big purchases.")}</p>
          <button class="primary-btn" style="width:100%" data-add-goal>${ICONS.plus} ${t("Create First Goal")}</button>
        </div>
      </article>
    `;

  // Card 4: Portable Summary Export
  const summaryCard = `
    <article class="google-card card-summary">
      <div class="google-card-header">
        ${ICONS.share}
        <span>${t("Share Summary")}</span>
      </div>
      <h3 class="google-card-title">${t("Export your secure worker profile")}</h3>
      <div class="google-card-body">
        <p class="copy" style="font-size: 0.88rem; margin-bottom: 12px;">
          ${t("Generate a portable summary of your checked parameters. No raw bank records are saved or shared.")}
        </p>
        <button class="primary-btn share-btn-google" type="button" data-share>${ICONS.share} ${t("Share summary text")}</button>
      </div>
      <div class="google-card-footer">
        <span>${t("Session code:")} +91 ${state.session.phone.slice(-4)}</span>
      </div>
    </article>
  `;

  // Filter content based on activeView navigation links
  let contentGrid = "";
  if (activeView === "Insights") {
    contentGrid = `
      <div class="google-dashboard-grid is-single">
        ${incomeAnalyticsCard}
        ${savingsCard}
        ${expenseCard}
        ${loanCard}
        ${documentCard}
      </div>
    `;
  } else if (activeView === "Schemes") {
    contentGrid = `
      <div class="google-dashboard-grid is-single">
        ${schemesCard}
      </div>
    `;
  } else {
    // Dashboard: All cards in 2-column assistant layout
    contentGrid = `
      <div class="google-dashboard-grid">
        ${incomeAnalyticsCard}
        ${savingsCard}
        ${expenseCard}
        ${loanCard}
        ${documentCard}
        ${schemesCard}
        ${summaryCard}
        ${deadlineCalendarCard}
        ${financialTipsCard}
        ${savingsGoalsCard}
      </div>
    `;
  }

  const activeScheme = state.guidanceSchemeId ? (state.schemesDb.find(s => s.id === state.guidanceSchemeId) || FALLBACK_SCHEMES.find(s => s.id === state.guidanceSchemeId)) : null;

  const onboardingSteps = [
    { title: t("Welcome to Kaam Card"), text: t("This is your dashboard. Here you'll see your income analysis, savings recommendations, and welfare scheme matches."), target: null },
    { title: t("Income Analytics"), text: t("Your daily earnings chart shows good days and bad days, helping you understand your income patterns."), target: ".card-analytics" },
    { title: t("Smart Savings"), text: t("The savings card shows how much to save on good days to cover low-income days automatically."), target: ".card-savings" },
    { title: t("Expense Summary"), text: t("Track your spending by category and set budgets to stay in control."), target: ".card-expense" },
    { title: t("Welfare Schemes"), text: t("Check which government schemes you qualify for based on your profile and income."), target: ".card-schemes" },
    { title: t("Share Summary"), text: t("Generate a portable summary of your verified profile to share with employers or schemes."), target: ".card-summary" },
    { title: t("Application Deadlines"), text: t("Keep track of upcoming scheme deadlines so you never miss an application window."), target: ".card-deadlines" },
    { title: t("Savings Goals"), text: t("Set personal saving targets for emergencies, festivals, or big purchases."), target: ".card-goals" }
  ];
  const onboardingTour = !state.onboardingDone && activeView === "Dashboard" ? `
    <div class="onboarding-overlay" id="onboarding-tour">
      <div class="onboarding-spotlight" id="onboarding-spotlight"></div>
      <div class="onboarding-card" id="onboarding-card">
        <div class="onboarding-step-content">
          <h3 class="onboarding-step-title">${onboardingSteps[0].title}</h3>
          <p class="onboarding-step-text">${onboardingSteps[0].text}</p>
        </div>
        <div class="onboarding-progress">
          <span class="onboarding-dot active"></span>
          <span class="onboarding-dot"></span>
          <span class="onboarding-dot"></span>
          <span class="onboarding-dot"></span>
          <span class="onboarding-dot"></span>
          <span class="onboarding-dot"></span>
          <span class="onboarding-dot"></span>
          <span class="onboarding-dot"></span>
        </div>
        <div class="onboarding-actions">
          <button class="secondary-btn" type="button" data-onboarding-skip>${t("Skip")}</button>
          <button class="primary-btn" type="button" data-onboarding-next>${t("Next")}</button>
        </div>
      </div>
    </div>
  ` : "";

  const dashboardContent = `
    <section class="dashboard-assistant-view">
      ${onboardingTour}
      <div class="dashboard-breadcrumbs">
        <span class="crumb">${t("For you")}</span>
        <span class="crumb-separator">/</span>
        <span class="crumb active">${t(activeView === "Transactions" ? "Connect Data" : activeView)}</span>
        <span class="demo-badge">${t("SECURE SANDBOX")}</span>
      </div>
      
      <div class="dashboard-intro">
        <h1 class="main-dashboard-title">${t("Welcome, Worker")} ${escapeHtml(currentName().split(" ").slice(-1)[0])}</h1>
        <p class="copy">${t("This dashboard tracks your calculated income averages and verifies matching state schemes.")}</p>
      </div>
      
      ${contentGrid}
      
      ${renderBottomNav(activeView)}
      ${state.shareOpen ? renderShareModal() : ""}
      ${activeScheme ? renderGuidanceModal(activeScheme) : ""}
    </section>
  `;

  renderShell(dashboardContent, activeView, "wide");

  // Re-bind actions
  document.querySelector("[data-share]")?.addEventListener("click", () => {
    state.shareOpen = true;
    state.copied = false;
    render();
    addAuditLog("Shareable summary viewed.");
  });

  // Bind onboarding tour with coach marks
  const onboardingOverlay = document.querySelector("#onboarding-tour");
  if (onboardingOverlay) {
    let onboardingIndex = 0;
    let prevOverflow;
    function lockScroll() { prevOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; }
    function unlockScroll() { document.body.style.overflow = prevOverflow || ""; }
    lockScroll();
    const steps = [
      { title: t("Welcome to Kaam Card"), text: t("This is your dashboard. Here you'll see your income analysis, savings recommendations, and welfare scheme matches."), target: null },
      { title: t("Income Analytics"), text: t("Your daily earnings chart shows good days and bad days, helping you understand your income patterns."), target: ".card-analytics" },
      { title: t("Smart Savings"), text: t("The savings card shows how much to save on good days to cover low-income days automatically."), target: ".card-savings" },
      { title: t("Expense Summary"), text: t("Track your spending by category and set budgets to stay in control."), target: ".card-expense" },
      { title: t("Welfare Schemes"), text: t("Check which government schemes you qualify for based on your profile and income."), target: ".card-schemes" },
      { title: t("Share Summary"), text: t("Generate a portable summary of your verified profile to share with employers or schemes."), target: ".card-summary" },
      { title: t("Application Deadlines"), text: t("Keep track of upcoming scheme deadlines so you never miss an application window."), target: ".card-deadlines" },
      { title: t("Savings Goals"), text: t("Set personal saving targets for emergencies, festivals, or big purchases."), target: ".card-goals" }
    ];
    const titleEl = onboardingOverlay.querySelector(".onboarding-step-title");
    const textEl = onboardingOverlay.querySelector(".onboarding-step-text");
    const dots = onboardingOverlay.querySelectorAll(".onboarding-dot");
    const spotlight = onboardingOverlay.querySelector("#onboarding-spotlight");
    const card = onboardingOverlay.querySelector("#onboarding-card");

    function positionSpotlight(targetSelector) {
      if (!targetSelector || !spotlight) return;
      const target = document.querySelector(targetSelector);
      if (!target) return;
      const rect = target.getBoundingClientRect();
      spotlight.style.top = `${rect.top - 8}px`;
      spotlight.style.left = `${rect.left - 8}px`;
      spotlight.style.width = `${rect.width + 16}px`;
      spotlight.style.height = `${rect.height + 16}px`;
      spotlight.style.opacity = "1";
      spotlight.style.pointerEvents = "none";
    }

    function positionCard(step) {
      const target = document.querySelector(step.target);
      if (!target) return;
      const r = target.getBoundingClientRect();
      const cw = card.offsetWidth, ch = card.offsetHeight;
      const pad = 16;
      const maxW = innerWidth - cw - pad;
      const maxH = innerHeight - ch - pad;
      let top = r.bottom + 12;
      if (top + ch > innerHeight - pad) {
        top = r.top - ch - 12 >= pad && r.top - ch - 12 <= maxH
          ? r.top - ch - 12
          : (innerHeight - ch) / 2;
      }
      top = Math.max(pad, Math.min(top, maxH));
      let left = r.left + r.width / 2 - cw / 2;
      left = Math.max(pad, Math.min(left, maxW));
      card.style.transform = "none";
      card.style.top = `${top}px`;
      card.style.left = `${left}px`;
      if (spotlight) positionSpotlight(step.target);
    }

    function isFixed(el) {
      return el && getComputedStyle(el).position === "fixed";
    }

    function updateOnboardingStep(index) {
      const step = steps[index];
      titleEl.textContent = step.title;
      textEl.textContent = step.text;
      dots.forEach((dot, i) => dot.classList.toggle("active", i === index));

      if (!card) return;

      if (spotlight && !step.target) spotlight.style.opacity = "0";

      if (step.target) {
        const el = document.querySelector(step.target);
        if (el && !isFixed(el)) {
          const html = document.documentElement;
          const prev = html.style.scrollBehavior;
          html.style.scrollBehavior = "auto";
          el.scrollIntoView({ block: "center", inline: "nearest" });
          html.style.scrollBehavior = prev;
        }
        positionCard(step);
      } else {
        card.style.top = "50%";
        card.style.left = "50%";
        card.style.transform = "translate(-50%, -50%)";
      }
    }

    // Initial position
    updateOnboardingStep(0);

    onboardingOverlay.querySelector("[data-onboarding-next]").addEventListener("click", () => {
      onboardingIndex++;
      if (onboardingIndex >= steps.length) {
        state.onboardingDone = true;
        saveSession();
        unlockScroll();
        onboardingOverlay.remove();
      } else {
        updateOnboardingStep(onboardingIndex);
      }
    });

    onboardingOverlay.querySelector("[data-onboarding-skip]").addEventListener("click", () => {
      state.onboardingDone = true;
      saveSession();
      unlockScroll();
      onboardingOverlay.remove();
    });
  }

  // Bind document checklist
  document.querySelectorAll("[data-doc]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const doc = checkbox.getAttribute("data-doc");
      state.documents[doc] = checkbox.checked;
      addAuditLog(`Document ${checkbox.checked ? "marked ready" : "unmarked"}: ${doc}`);
      saveSession();
      render();
    });
  });

  // Bind Add Goal buttons
  document.querySelectorAll("[data-add-goal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = prompt(t("Goal name (e.g., Emergency Fund, Festival, Vehicle):"));
      if (!name) return;
      const target = parseInt(prompt(t("Target amount (₹):")), 10);
      if (!target || target <= 0) return;
      const dateStr = prompt(t("Target date (YYYY-MM-DD, optional):"));
      state.savingsGoals.push({
        id: "goal_" + Date.now(),
        name: name.trim(),
        targetAmount: target,
        currentAmount: 0,
        targetDate: dateStr || null,
        isActive: true,
        createdAt: Date.now()
      });
      saveSession();
      addAuditLog(`Created savings goal: ${name} for ₹${target}`);
      render();
    });
  });

  // Bind guide me triggers
  document.querySelectorAll("[data-guide-scheme]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.guidanceSchemeId = btn.dataset.guideScheme;
      state.guidanceStep = 1;
      render();
      addAuditLog(`Opened step-by-step guidance wizard for scheme: ${state.guidanceSchemeId}`);
    });
  });

  bindBottomNav();
  bindShareModal();
  if (activeScheme) {
    bindGuidanceModalEvents();
  }
}

function renderIncomeChart(profile) {
  const maxAmount = Math.max(...profile.dailySeries.map((day) => day.amount), 1);
  const bars = profile.dailySeries.map((day) => {
    const height = Math.max(3, (day.amount / maxAmount) * 100);
    const className = day.amount === 0 ? "is-empty" : day.amount <= profile.badThreshold ? "is-bad" : day.amount >= profile.goodThreshold ? "is-good" : "";
    return `<span class="bar ${className}" style="height:${height.toFixed(2)}%" title="${dateLabel(day.date)}: ${formatMoney(day.amount)}"></span>`;
  }).join("");

  return `
    <div class="chart-card-google">
      <div class="chart-head-google">
        <strong>${formatMoney(profile.totalIncome)}</strong><span>${t("total parsed credit")}</span>
      </div>
      <div class="bar-chart" style="grid-template-columns: repeat(${profile.dailySeries.length}, 1fr); gap: 4px;" role="img" aria-label="${t("Daily income bar chart")}">${bars}</div>
      <div class="bar-labels"><span>${dateLabel(profile.start)}</span><span>${dateLabel(profile.end)}</span></div>
      <div class="stats-grid-google">
        <div class="stat-item-google">
          <span>${t("Daily Avg")}</span>
          <strong>${formatMoney(profile.averageDaily)}</strong>
        </div>
        <div class="stat-item-google">
          <span>${t("Good Days")}</span>
          <strong class="chart-good-count">${profile.goodDays}</strong>
        </div>
        <div class="stat-item-google">
          <span>${t("Bad Days")}</span>
          <strong class="chart-bad-count">${profile.badDays}</strong>
        </div>
      </div>
    </div>
  `;
}

function renderSchemeCard(match) {
  const url = getAllowedUrl(match);
  const reason = match.eligible
    ? `${t("You qualify because your ")}${match.reasons.slice(0, 2).join(t(" and "))}.`
    : `${t("Close match: ")}${match.reasons[0] || t("some details match")}${t(", but ")}${match.misses[0]}.`;

  const minAge = match.eligibility ? match.eligibility.minAge : match.minAge;
  const maxAge = match.eligibility ? match.eligibility.maxAge : match.maxAge;
  const maxIncome = match.eligibility ? match.eligibility.maxIncome : match.maxMonthlyIncome;

  const schemeSpeakText = `${t(match.name)}. ${t(match.benefit || match.description)}. ${reason}`;

  return `
    <article class="scheme-card">
      <div class="scheme-card__top">
        <span class="scheme-icon ${match.color || "blue"}">${ICONS[match.icon || "file"]}</span>
        <div>
          <h3>${escapeHtml(t(match.name))} ${speakBtn(schemeSpeakText, state.lang)}</h3>
          <p>${escapeHtml(t(match.benefit || match.description))}</p>
        </div>
      </div>
      <p>${escapeHtml(reason)}</p>
      <div class="scheme-meta">
        <span class="tag">${match.eligible ? t("Eligible") : `${match.passed}/${match.required} ${t("matched")}`}</span>
        <span class="tag">${t("Age")} ${minAge}-${maxAge}</span>
        ${maxIncome ? `<span class="tag">${t("Income")} <= ${formatMoney(maxIncome)}</span>` : ""}
      </div>
      ${url ? `
        <div class="destination-secure">
          <div class="secure-badge">
            ${ICONS.shield}
            <span>${t("Verified Official Portal")}</span>
          </div>
          <p class="destination-domain">${t("Destination:")} <strong>${escapeHtml(url.hostname)}</strong></p>
          <button class="secure-link-btn" type="button" data-guide-scheme="${match.id}">
            <span>${t("Guide me & Apply")}</span>
            ${ICONS.external}
          </button>
        </div>
      ` : ""}
    </article>
  `;
}

function renderBottomNav(active) {
  return `
    <nav class="bottom-nav" aria-label="${t("Main navigation")}">
      ${bottomNavButton("Dashboard", ICONS.home, active === "Dashboard")}
      ${bottomNavButton("Upload", ICONS.upload, active === "Upload")}
      ${bottomNavButton("Insights", ICONS.bars, active === "Insights")}
      ${bottomNavButton("Schemes", ICONS.schemes, active === "Schemes")}
      ${bottomNavButton("More", ICONS.menu, active === "More")}
    </nav>
  `;
}

function bottomNavButton(label, icon, active) {
  return `<button type="button" class="${active ? "is-active" : ""}" data-bottom-nav="${escapeHtml(label)}">${icon}<span>${escapeHtml(t(label))}</span></button>`;
}

function bindBottomNav() {
  document.querySelectorAll("[data-bottom-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.bottomNav === "More") {
        toggleMoreMenu();
        return;
      }
      navigateTo(button.dataset.bottomNav);
    });
  });
}

function toggleMoreMenu() {
  const existing = document.querySelector(".more-menu-overlay");
  if (existing) {
    existing.remove();
    return;
  }
  const overlay = document.createElement("div");
  overlay.className = "more-menu-overlay";
  overlay.innerHTML = `
    <div class="more-menu">
      ${state.profile ? `<button type="button" class="more-menu-item" data-more-action="share">${ICONS.share}<span>${t("Share Summary")}</span></button>` : ""}
      ${state.profile ? `<button type="button" class="more-menu-item" data-more-action="export">${ICONS.file}<span>${t("Export Card")}</span></button>` : ""}
      ${state.profile ? `<button type="button" class="more-menu-item" data-more-action="qr">${ICONS.share}<span>${t("Show QR Code")}</span></button>` : ""}
      ${state.session ? `<button type="button" class="more-menu-item more-menu-danger" data-more-action="purge">${ICONS.alert}<span>${t("Purge Session")}</span></button>` : ""}
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
      return;
    }
    const action = e.target.closest("[data-more-action]")?.dataset.moreAction;
    if (!action) return;
    overlay.remove();
    if (action === "share") {
      state.shareOpen = true;
      render();
    } else if (action === "export") {
      exportWorkerCard();
    } else if (action === "qr") {
      showQRCode();
    } else if (action === "purge") {
      purgeSession();
    }
  });
}

function showQRCode() {
  const profile = state.profile;
  const phone = state.session?.phone || "demo";
  const workerName = `${t("Worker ")}${phone.slice(-4)}`;
  
  const cardData = {
    v: 1,
    n: workerName,
    p: phone.slice(-4),
    i: profile?.averageDaily || 0,
    m: profile?.monthlyIncomeEstimate || 0,
    g: profile?.goodDays || 0,
    b: profile?.badDays || 0,
    s: profile?.savings?.monthlySaving || 0,
    t: Date.now()
  };
  
  const jsonStr = JSON.stringify(cardData);
  const encoded = btoa(jsonStr);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(encoded)}`;
  
  const modalHtml = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="qr-title">
      <section class="share-card" style="max-width:320px;text-align:center">
        <h2 id="qr-title">${t("Worker Card QR Code")}</h2>
        <p class="copy">${t("Scan to share your Kaam Card profile")}</p>
        <img src="${qrUrl}" alt="${t("QR Code")}" style="width:256px;height:256px;border-radius:12px;background:#fff;margin:16px 0;box-shadow:var(--shadow)">
        <p style="font-size:0.75rem;color:var(--muted);margin-bottom:8px">${t("Worker:")} ${escapeHtml(workerName)}</p>
        <p style="font-size:0.75rem;color:var(--muted);margin-bottom:16px">${t("Expires in 24 hours")}</p>
        <div class="share-actions">
          <button class="secondary-btn" type="button" data-close-qr>${t("Close")}</button>
          <button class="primary-btn" type="button" data-download-qr>${ICONS.file} ${t("Download QR")}</button>
        </div>
      </section>
    </div>
  `;
  
  const existing = document.querySelector(".modal-backdrop");
  if (existing) existing.remove();
  
  document.body.insertAdjacentHTML("beforeend", modalHtml);
  
  document.querySelector("[data-close-qr]")?.addEventListener("click", () => {
    document.querySelector(".modal-backdrop")?.remove();
  });
  
  document.querySelector("[data-download-qr]")?.addEventListener("click", async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kaam-card-qr-${phone.slice(-4)}.png`;
      a.click();
      URL.revokeObjectURL(url);
      addAuditLog("Downloaded worker card QR code.");
    } catch (error) {
      console.error("QR download failed:", error);
    }
  });
}

function shareSummaryText() {
  const profile = state.profile;
  const eligible = state.matches.filter((item) => item.eligible).slice(0, 3);
  return [
    t("Kaam Card summary"),
    `${t("Phone session:")} +91 ${state.session?.phone || "demo"}`,
    `${t("Average daily income:")} ${formatMoney(profile.averageDaily)}`,
    `${t("Good days:")} ${profile.goodDays}; ${t("bad days:")} ${profile.badDays}`,
    `${t("Saving rule: save")} ${formatMoney(profile.savings.savePerGoodDay)} ${t("on days above")} ${formatMoney(profile.goodThreshold)}.`,
    `${t("Likely schemes:")} ${eligible.map((item) => t(item.shortName)).join(", ") || t("No exact match yet")}`,
    t("Demo note: eligibility is simplified and should be verified on the official portal.")
  ].join("\n");
}

function renderShareModal() {
  const canShare = navigator.share && navigator.canShare && navigator.canShare({ text: shareSummaryText() });
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <section class="share-card">
        <h2 id="share-title">${t("Shareable summary")}</h2>
        <p class="copy">${t("This is a simple text summary for the demo. No raw transactions are included.")}</p>
        <textarea class="share-text" readonly>${escapeHtml(shareSummaryText())}</textarea>
        <div class="share-actions">
          <button class="secondary-btn" type="button" data-close-share>${t("Close")}</button>
          <button class="secondary-btn" type="button" data-export-card>${ICONS.file} ${t("Export Card (HTML)")}</button>
          <button class="secondary-btn" type="button" data-export-pdf>${ICONS.share} ${t("Save as PDF")}</button>
          ${canShare ? `<button class="secondary-btn" type="button" data-native-share>${ICONS.share} ${t("Share via App")}</button>` : ''}
          <button class="primary-btn" type="button" data-copy-share>${ICONS.copy} ${state.copied ? t("Copied") : t("Copy")}</button>
        </div>
        <div class="danger-zone-section">
          <h3 class="danger-zone-title">${t("Danger Zone")}</h3>
          <p class="copy danger-zone-desc">${t("This will completely clear your parsed income profile and reset the session.")}</p>
          <button class="purge-session-btn danger-zone-purge" type="button" data-purge-session>${ICONS.alert} ${t("Clear & Purge Session Data")}</button>
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

  const exportCard = document.querySelector("[data-export-card]");
  if (exportCard) {
    exportCard.addEventListener("click", () => exportWorkerCard());
  }

  const exportPdf = document.querySelector("[data-export-pdf]");
  if (exportPdf) {
    exportPdf.addEventListener("click", () => {
      exportWorkerCard(); // Opens printable view, user can save as PDF via browser print
      addAuditLog("Exported worker card as PDF.");
    });
  }

  const nativeShare = document.querySelector("[data-native-share]");
  if (nativeShare) {
    nativeShare.addEventListener("click", async () => {
      const text = shareSummaryText();
      try {
        await navigator.share({
          title: t("Kaam Card Summary"),
          text: text
        });
        addAuditLog("Shared worker card via native share.");
      } catch (error) {
        if (error.name !== "AbortError") {
          console.warn("Share failed:", error);
        }
      }
    });
  }

  bindPurgeSession();
}

function exportWorkerCard() {
  const profile = state.profile;
  const eligible = state.matches.filter((item) => item.eligible).slice(0, 5);
  const phone = state.session?.phone || "demo";
  const workerName = `${t("Worker ")}${phone.slice(-4)}`;

  const cardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Kaam Card - ${escapeHtml(workerName)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #F9F8F6; display: grid; place-items: center; min-height: 100vh; padding: 24px; }
  .card { background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); max-width: 480px; width: 100%; overflow: hidden; }
  .card-header { background: linear-gradient(135deg, #C85A32, #B04E2D); color: #fff; padding: 24px; text-align: center; }
  .card-header h1 { font-size: 1.4rem; font-weight: 800; margin-bottom: 4px; }
  .card-header p { font-size: 0.85rem; opacity: 0.9; }
  .card-body { padding: 20px 24px; }
  .section { margin-bottom: 16px; }
  .section:last-child { margin-bottom: 0; }
  .section-title { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #8C857B; margin-bottom: 8px; }
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .stat { background: #F0EEE9; border-radius: 8px; padding: 12px; }
  .stat-label { font-size: 0.72rem; color: #8C857B; font-weight: 700; }
  .stat-value { font-size: 1.1rem; font-weight: 800; color: #1A1A1A; }
  .savings-box { background: linear-gradient(135deg, #F5E8E2, #F9F8F6); border: 1px solid #E8E5DE; border-radius: 10px; padding: 14px; text-align: center; }
  .savings-amount { font-size: 1.3rem; font-weight: 800; color: #C85A32; }
  .savings-label { font-size: 0.8rem; color: #8C857B; margin-top: 4px; }
  .scheme-list { list-style: none; }
  .scheme-item { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #E8E5DE; font-size: 0.85rem; }
  .scheme-item:last-child { border-bottom: none; }
  .scheme-dot { width: 8px; height: 8px; border-radius: 50%; background: #C85A32; flex-shrink: 0; }
  .card-footer { background: #F0EEE9; padding: 16px 24px; text-align: center; font-size: 0.75rem; color: #8C857B; border-top: 1px solid #E8E5DE; }
  @media print { body { background: none; padding: 0; } .card { box-shadow: none; border: 1px solid #D9D5CC; } }
  .no-print { display: block; text-align: center; margin: 16px 0; }
  @media print { .no-print { display: none !important; } }
</style>
</head>
<body>
<div class="card">
  <div class="card-header">
    <h1>${t("Kaam Card")}</h1>
    <p>${escapeHtml(workerName)}${t(" | +91 ")}${escapeHtml(phone)}</p>
  </div>
  <div class="card-body">
    <div class="section">
      <div class="section-title">${t("Income Profile")}</div>
      <div class="stat-grid">
        <div class="stat"><div class="stat-label">${t("Daily Average")}</div><div class="stat-value">${formatMoney(profile.averageDaily)}</div></div>
        <div class="stat"><div class="stat-label">${t("Monthly Estimate")}</div><div class="stat-value">${formatMoney(profile.monthlyIncomeEstimate)}</div></div>
        <div class="stat"><div class="stat-label">${t("Good Days")}</div><div class="stat-value">${profile.goodDays}</div></div>
        <div class="stat"><div class="stat-label">${t("Low Days")}</div><div class="stat-value">${profile.badDays}</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">${t("Savings Recommendation")}</div>
      <div class="savings-box">
        <div class="savings-amount">${formatMoney(profile.savings.monthlySaving)}${t("/month")}</div>
        <div class="savings-label">${t("Save ")}${formatMoney(profile.savings.savePerGoodDay)}${t(" on good days (above ")}${formatMoney(profile.goodThreshold)}${t(")")}</div>
      </div>
    </div>
    ${eligible.length > 0 ? `
    <div class="section">
      <div class="section-title">${t("Matched Welfare Schemes")}</div>
      <ul class="scheme-list">
        ${eligible.map((s) => `<li class="scheme-item"><span class="scheme-dot"></span><strong>${escapeHtml(t(s.shortName))}</strong> &mdash; ${escapeHtml(t(s.benefit || s.description || ""))}</li>`).join("")}
      </ul>
    </div>` : ""}
  </div>
  <div class="card-footer">
    ${t("Generated by Kaam Card | Eligibility is simplified, verify on official portals")}
  </div>
</div>
<div class="no-print">
  <button onclick="window.print()" class="primary-btn" style="padding:12px 24px;border-radius:30px;border:none;background:#C85A32;color:#fff;font-weight:500;cursor:pointer">${ICONS.file} ${t("Download PDF / Print")}</button>
  <p class="copy" style="margin-top:8px;font-size:0.8rem">${t("Use your browser's Print to PDF option to save")}</p>
</div>
</body>
</html>`;

  const cardWindow = window.open("", "_blank");
  if (cardWindow) {
    cardWindow.document.write(cardHtml);
    cardWindow.document.close();
    addAuditLog("Exported worker card to printable view.");
  }
}

function exportWorkerCardPDF() {
  // Generate the same HTML content but trigger print directly
  const profile = state.profile;
  const eligible = state.matches.filter((item) => item.eligible).slice(0, 5);
  const phone = state.session?.phone || "demo";
  const workerName = `${t("Worker ")}${phone.slice(-4)}`;

  const cardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Kaam Card - ${escapeHtml(workerName)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #F9F8F6; display: grid; place-items: center; min-height: 100vh; padding: 24px; }
  .card { background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); max-width: 480px; width: 100%; overflow: hidden; }
  .card-header { background: linear-gradient(135deg, #C85A32, #B04E2D); color: #fff; padding: 24px; text-align: center; }
  .card-header h1 { font-size: 1.4rem; font-weight: 800; margin-bottom: 4px; }
  .card-header p { font-size: 0.85rem; opacity: 0.9; }
  .card-body { padding: 20px 24px; }
  .section { margin-bottom: 16px; }
  .section:last-child { margin-bottom: 0; }
  .section-title { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #8C857B; margin-bottom: 8px; }
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .stat { background: #F0EEE9; border-radius: 8px; padding: 12px; }
  .stat-label { font-size: 0.72rem; color: #8C857B; font-weight: 700; }
  .stat-value { font-size: 1.1rem; font-weight: 800; color: #1A1A1A; }
  .savings-box { background: linear-gradient(135deg, #F5E8E2, #F9F8F6); border: 1px solid #E8E5DE; border-radius: 10px; padding: 14px; text-align: center; }
  .savings-amount { font-size: 1.3rem; font-weight: 800; color: #C85A32; }
  .savings-label { font-size: 0.8rem; color: #8C857B; margin-top: 4px; }
  .scheme-list { list-style: none; }
  .scheme-item { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #E8E5DE; font-size: 0.85rem; }
  .scheme-item:last-child { border-bottom: none; }
  .scheme-dot { width: 8px; height: 8px; border-radius: 50%; background: #C85A32; flex-shrink: 0; }
  .card-footer { background: #F0EEE9; padding: 16px 24px; text-align: center; font-size: 0.75rem; color: #8C857B; border-top: 1px solid #E8E5DE; }
  @media print { body { background: none; padding: 0; } .card { box-shadow: none; border: 1px solid #D9D5CC; } }
</style>
</head>
<body>
<div class="card">
  <div class="card-header">
    <h1>${t("Kaam Card")}</h1>
    <p>${escapeHtml(workerName)}${t(" | +91 ")}${escapeHtml(phone)}</p>
  </div>
  <div class="card-body">
    <div class="section">
      <div class="section-title">${t("Income Profile")}</div>
      <div class="stat-grid">
        <div class="stat"><div class="stat-label">${t("Daily Average")}</div><div class="stat-value">${formatMoney(profile.averageDaily)}</div></div>
        <div class="stat"><div class="stat-label">${t("Monthly Estimate")}</div><div class="stat-value">${formatMoney(profile.monthlyIncomeEstimate)}</div></div>
        <div class="stat"><div class="stat-label">${t("Good Days")}</div><div class="stat-value">${profile.goodDays}</div></div>
        <div class="stat"><div class="stat-label">${t("Low Days")}</div><div class="stat-value">${profile.badDays}</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">${t("Savings Recommendation")}</div>
      <div class="savings-box">
        <div class="savings-amount">${formatMoney(profile.savings.monthlySaving)}${t("/month")}</div>
        <div class="savings-label">${t("Save ")}${formatMoney(profile.savings.savePerGoodDay)}${t(" on good days (above ")}${formatMoney(profile.goodThreshold)}${t(")")}</div>
      </div>
    </div>
    ${eligible.length > 0 ? `
    <div class="section">
      <div class="section-title">${t("Matched Welfare Schemes")}</div>
      <ul class="scheme-list">
        ${eligible.map((s) => `<li class="scheme-item"><span class="scheme-dot"></span><strong>${escapeHtml(t(s.shortName))}</strong> &mdash; ${escapeHtml(t(s.benefit || s.description || ""))}</li>`).join("")}
      </ul>
    </div>` : ""}
  </div>
  <div class="card-footer">
    ${t("Generated by Kaam Card | Eligibility is simplified, verify on official portals")}
  </div>
</div>
<script>
  window.onload = function() { window.print(); };
<\/script>
</body>
</html>`;

  const cardWindow = window.open("", "_blank");
  if (cardWindow) {
    cardWindow.document.write(cardHtml);
    cardWindow.document.close();
    addAuditLog("Exported worker card as PDF.");
  }
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

function renderLanding() {
  const content = `
    <div class="landing-page">
      <!-- Header -->
      <header class="landing-header">
        <div class="brand brand-clickable" data-go-home>${brandMark()}<span>${t("Kaam Card")}</span></div>
        <div class="landing-header__actions">
          ${renderThemeToggle("compact")}
          <button class="primary-btn landing-login-btn" type="button" data-login-cta>${t("LOG IN / START")}</button>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="landing-hero section-with-blobs" aria-labelledby="hero-title">
        <div class="section-blob blob-1"></div>
        <div class="landing-hero__content">
          <h1 id="hero-title" class="hero-main-title">
            <span class="text-gradient">${t("Go from Platform Earnings to Welfare Benefits in 2 Minutes.")}</span>
          </h1>
          <p class="hero-subtitle">
            ${t("Kaam Card is a portable, secure record for informal and gig workers.")}
          </p>
          <div class="hero-ctas">
            <button class="cta-displace" type="button" data-login-cta>${t("Create Your Kaam Card")}</button>
          </div>
          <div class="hero-trust">
            <span class="trust-badge">${ICONS.shield} ${t("100% Private: No Aadhaar or PAN stored")}</span>
            <span class="trust-badge">${ICONS.check} ${t("Safe: In-memory processing")}</span>
          </div>
        </div>
      </section>

      <!-- Key Benefits / What We Do -->
      <section class="landing-benefits section-with-blobs" id="benefits" aria-labelledby="benefits-title">
        <h2 id="benefits-title" class="section-title">${t("What We Do")}</h2>
        <p class="section-subtitle">${t("We help gig workers accumulate data value that is normally locked away in siloed apps.")}</p>
        <div class="benefits-grid">
          <div class="benefit-item displace-card animate-on-scroll">
            <div class="benefit-icon green">${ICONS.bars}</div>
            <h3>${t("Income Analytics")}</h3>
            <p>${t("Understand your earnings variance, good days vs bad days, and average monthly income instantly.")}</p>
          </div>
          <div class="benefit-item displace-card animate-on-scroll">
            <div class="benefit-icon blue">${ICONS.schemes}</div>
            <h3>${t("Scheme Matching")}</h3>
            <p>${t("Automatically match your computed income against real criteria for e-Shram, PM-SYM, PM-JAY, and more.")}</p>
          </div>
          <div class="benefit-item displace-card animate-on-scroll">
            <div class="benefit-icon saffron">${ICONS.wallet}</div>
            <h3>${t("Smart Micro-Savings")}</h3>
            <p>${t("Get a mathematically grounded savings rule based on your actual income surplus on high-earning days.")}</p>
          </div>
        </div>
      </section>

      <!-- Metrics / Stats Strip -->
      <section class="landing-metrics section-with-blobs" aria-labelledby="metrics-title">
        <div class="section-blob blob-3"></div>
        <h2 id="metrics-title" class="section-title">${t("Designed for India's Informal Workforce")}</h2>
        <div class="stat-displace">
          <div class="stat-card animate-on-scroll">
            <div class="stat-value green">${t("2 min")}</div>
            <div class="stat-label">${t("Average setup time")}</div>
          </div>
          <div class="stat-card animate-on-scroll">
            <div class="stat-value saffron">100%</div>
            <div class="stat-label">${t("100% Private: No Aadhaar or PAN stored")}</div>
          </div>
          <div class="stat-card animate-on-scroll">
            <div class="stat-value blue">${t("Zero")}</div>
            <div class="stat-label">${t("Data stored on servers")}</div>
          </div>
        </div>
      </section>

      <!-- How it Works -->
      <section class="landing-steps section-with-blobs" id="how-it-works" aria-labelledby="steps-title">
        <div class="section-blob blob-4"></div>
        <h2 id="steps-title" class="section-title">${t("Three Simple Steps")}</h2>
        <p class="section-subtitle">${t("From phone to dashboard in under 2 minutes")}</p>
        <div style="display:flex;flex-direction:column;gap:24px;max-width:640px;margin:0 auto">
          <div class="step-nom animate-on-scroll">
            <div class="step-nom__num">1</div>
            <div class="step-nom__body">
              <h3>${t("Secure OTP Login")}</h3>
              <p>${t("Enter your phone number to start a secure, isolated sandbox session. No passwords required.")}</p>
            </div>
          </div>
          <div class="step-nom animate-on-scroll">
            <div class="step-nom__num">2</div>
            <div class="step-nom__body">
              <h3>${t("Upload Statements")}</h3>
              <p>${t("Drop a bank statement or UPI statement CSV. We parse it locally in your browser and discard raw transaction details.")}</p>
            </div>
          </div>
          <div class="step-nom animate-on-scroll">
            <div class="step-nom__num">3</div>
            <div class="step-nom__body">
              <h3>${t("Get Kaam Dashboard")}</h3>
              <p>${t("Instantly check eligible schemes, review savings recommendations, and export your portable worker card.")}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Testimonials -->
      <section class="landing-social section-with-blobs" id="testimonials" aria-labelledby="social-title">
        <div class="section-blob blob-2"></div>
        <h2 id="social-title" class="section-title">${t("Loved by Workers")}</h2>
        <p class="section-subtitle">${t("Hear from informal partners who verified their scheme eligibility using Kaam Card.")}</p>
        <div class="benefits-grid testimonial-displace">
          <blockquote class="animate-on-scroll">
            <p class="quote">"${t("Using Kaam Card took less than 2 minutes. It computed my average daily income and showed me I qualified for PM-SYM pension. I registered the same day!")}"</p>
            <cite>
              <strong>Rajesh Kumar</strong>
              <span>${t("Delivery Partner, Delhi")}</span>
            </cite>
          </blockquote>
          <blockquote class="animate-on-scroll">
            <p class="quote">"${t("I always wanted to save but didn't know how much. The good-day surplus savings suggestion helped me set aside money on busy weekends to cover dry weekdays.")}"</p>
            <cite>
              <strong>Amit Mishra</strong>
              <span>${t("Cab Driver, Mumbai")}</span>
            </cite>
          </blockquote>
          <blockquote class="animate-on-scroll">
            <p class="quote">"${t("I was worried about sharing bank logs, but Kaam Card's privacy focus is amazing. It runs on my browser and doesn't store my Aadhaar or transaction lists.")}"</p>
            <cite>
              <strong>Sunita Devi</strong>
              <span>${t("Domestic Worker, Bangalore")}</span>
            </cite>
          </blockquote>
        </div>
      </section>

      <!-- CTA / Contact -->
      <section class="landing-contact section-with-blobs" id="contact" aria-labelledby="contact-title">
        <div class="section-blob blob-1"></div>
        <div class="contact-box">
          <h2 id="contact-title">${t("Need help checking eligibility?")}</h2>
          <p>${t("We are dedicated to supporting digital portability for India's gig economy. If you have questions about the pilot or scheme integration, get in touch.")}</p>
          <div class="hero-ctas" style="margin-bottom:16px">
            <button class="cta-displace" type="button" data-login-cta>${t("Create Your Kaam Card")}</button>
          </div>
          <div class="contact-methods">
            <div class="contact-method">${ICONS.shield} <span>support@kaamcard.nic.in</span></div>
            <div class="contact-method">${ICONS.rupee} <span>${t("Toll-free Helpdesk: 1800-11-0031 (Demo)")}</span></div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="footer-grid">
          <div class="footer-grid-links">
            <div class="footer-col">
              <h4>${t("Product")}</h4>
              <a href="#benefits">${t("Features")}</a>
              <a href="#how-it-works">${t("How it Works")}</a>
              <a href="#testimonials">${t("Testimonials")}</a>
            </div>
            <div class="footer-col">
              <h4>${t("Support")}</h4>
              <a href="#contact">${t("Contact")}</a>
              <a href="mailto:support@kaamcard.nic.in">${t("Email")}</a>
            </div>
            <div class="footer-col">
              <h4>${t("Legal")}</h4>
              <a href="#">${t("Privacy")}</a>
              <a href="#">${t("Terms")}</a>
            </div>
          </div>
          <div class="footer-grid-brand">
            <div class="brand brand-clickable" data-go-home>${brandMark()}<span>${t("Kaam Card")}</span></div>
            <p>${t("© 2026 Kaam Card.")} ${t("Empowering Indian gig workers with portable data identity.")}</p>
          </div>
        </div>
      </footer>
    </div>
  `;

  app.innerHTML = `
    <div class="app-shell landing-shell">
      <div class="interactive-grid-pattern" aria-hidden="true"></div>
      <main class="main-wrap is-landing">
        ${content}
      </main>
    </div>
  `;

  bindLandingActions();
  bindThemeToggle();
  bindGoHome();
  initScrollAnimations();
}

function bindLandingActions() {
  document.querySelectorAll("[data-login-cta]").forEach((button) => {
    button.addEventListener("click", () => {
      state.route = "login";
      render();
    });
  });
  bindScrollAnimations();
}

function bindScrollAnimations() {
  const targets = document.querySelectorAll(".landing-page section, .benefit-item, .step-nom, .testimonial-displace blockquote, .stat-card, .contact-box, .landing-header");
  if (!targets.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.setProperty("--anim-state", "running");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
  targets.forEach((el, i) => {
    el.style.setProperty("--anim-state", "paused");
    el.style.setProperty("--anim-delay", `${i * 0.05}s`);
    el.style.animation = "fadeInUp 0.5s ease both";
    el.style.animationDelay = "var(--anim-delay)";
    el.style.animationPlayState = "var(--anim-state)";
    obs.observe(el);
  });
}

function purgeSession() {
  API.purgeSession().catch(() => {});
  state.session = null;
  state.profile = null;
  state.expenseProfile = null;
  state.parseResult = null;
  state.matches = [];
  state.phoneDraft = "";
  state.otpDebugCode = null;
  state.details = { age: 29, occupation: "Delivery worker", state: "Delhi" };
  state.route = "landing";
  state.shareOpen = false;
  state.consentGiven = false;
  state.auditLogs = [];
  state.schemeQuery = "";
  state.drawerOpen = false;
  state.rightSidebarOpen = false;
  delete state.__drawerInit;
  clearSessionStorage();
  render();
}

function bindPurgeSession() {
  document.querySelectorAll("[data-purge-session]").forEach((button) => {
    button.addEventListener("click", () => {
      if (confirm(t("Are you sure you want to end your session and delete all parsed data? This cannot be undone."))) {
        purgeSession();
      }
    });
  });
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", logout);
  });
}

function initScrollAnimations() {
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll(".animate-on-scroll").forEach(function (el) {
    observer.observe(el);
  });
}

function logout() {
  API.setToken(null);
  try { localStorage.removeItem("kaam-card-api-session"); } catch (e) {}
  try { localStorage.removeItem("kaam-card-api-profile"); } catch (e) {}
  state.session = null;
  state.profile = null;
  state.expenseProfile = null;
  state.parseResult = null;
  state.matches = [];
  state.phoneDraft = "";
  state.otpDebugCode = null;
  state.details = { age: 29, occupation: "Delivery worker", state: "Delhi" };
  state.route = "landing";
  state.shareOpen = false;
  state.consentGiven = false;
  state.drawerOpen = false;
  state.rightSidebarOpen = false;
  delete state.__drawerInit;
  clearSessionStorage();
  render();
}

function bindGoHome() {
  document.querySelectorAll("[data-go-home]").forEach((element) => {
    element.addEventListener("click", () => {
      closeDrawer();
      if (state.session) {
        state.route = state.profile ? "dashboard" : "upload";
      } else {
        state.route = "landing";
      }
      render();
    });
  });
}

function renderRightSidebar() {
  if (!state.session) return "";

  const logItems = state.auditLogs.map((log) => `
    <div class="audit-log-item">
      <span class="audit-log-time">${escapeHtml(log.time)}</span>
      <span class="audit-log-text">${escapeHtml(log.message)}</span>
    </div>
  `).join("");

  const resourceItems = [
    { name: "e-Shram Rules & Benefits.pdf", type: "doc", url: "https://eshram.gov.in/" },
    { name: "PM-SYM Scheme Guidelines.pdf", type: "doc", url: "https://www.labour.gov.in/pm-sym" },
    { name: "Ayushman Bharat Portal.doc", type: "doc", url: "https://www.pmjay.gov.in/" }
  ].map((res) => `
    <a href="${escapeHtml(res.url)}" target="_blank" class="resource-item" rel="noopener noreferrer">
      <span class="resource-icon ${res.type}">
        ${res.type === "sheet" ? ICONS.file : ICONS.shield}
      </span>
      <span class="resource-name">${escapeHtml(res.name)}</span>
    </a>
  `).join("");

  return `
    <aside class="right-sidebar" aria-label="${t("Welfare Knowledge & Security Logs")}">
      <div class="search-slide-header">
        <label for="scheme-search" class="field-label search-label">${t("Welfare Knowledge & Security Logs")}</label>
        <button type="button" class="icon-btn" data-close-right-sidebar aria-label="${t("Close")}">${ICONS.back}</button>
      </div>
      <div class="right-sidebar__body">
        <div class="right-sidebar__section">
          <label for="scheme-search" class="field-label search-label">${t("Search matched schemes")}</label>
          <div class="search-input-wrapper">
            <input type="text" id="scheme-search" placeholder="${t("Type scheme name...")}" value="${escapeHtml(state.schemeQuery || "")}">
          </div>
        </div>
        
        <div class="right-sidebar__section">
          <h3 class="sidebar-heading">${t("Knowledge Resources")}</h3>
          <div class="resources-list">
            ${resourceItems}
          </div>
        </div>
        
        <div class="right-sidebar__section">
          <h3 class="sidebar-heading">${t("Local Security Audit Trail")}</h3>
          <div class="audit-logs-list">
            ${logItems || `<div class="empty-logs">${t("No actions logged yet.")}</div>`}
          </div>
        </div>
      </div>
    </aside>
  `;
}

function bindRightSidebarEvents() {
  const searchInput = document.querySelector("#scheme-search");
  if (searchInput) {
    let searchTimer;
    searchInput.addEventListener("input", (event) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.schemeQuery = event.target.value;
        render();
        const newInput = document.querySelector("#scheme-search");
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(newInput.value.length, newInput.value.length);
        }
      }, 200);
    });
  }
}

function closeDrawer() {
  state.drawerOpen = false;
  const shell = document.querySelector(".app-shell");
  if (shell) shell.classList.remove("drawer-open");
}

function closeSearch() {
  state.searchOpen = false;
  const shell = document.querySelector(".app-shell");
  if (shell) shell.classList.remove("search-open");
}

function closeRightSidebar() {
  state.rightSidebarOpen = false;
  const shell = document.querySelector(".app-shell");
  if (shell) shell.classList.remove("sidebar-right-open");
}

function bindDrawerEvents() {
  document.querySelectorAll("[data-toggle-drawer]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.drawerOpen = !state.drawerOpen;
      const shell = document.querySelector(".app-shell");
      if (shell) shell.classList.toggle("drawer-open", state.drawerOpen);
    });
  });
  document.querySelectorAll("[data-close-drawer]").forEach((btn) => {
    btn.addEventListener("click", closeDrawer);
  });
  document.querySelectorAll("[data-toggle-right-sidebar]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.rightSidebarOpen = !state.rightSidebarOpen;
      const shell = document.querySelector(".app-shell");
      if (shell) shell.classList.toggle("sidebar-right-open", state.rightSidebarOpen);
    });
  });
  document.querySelectorAll("[data-close-right-sidebar]").forEach((btn) => {
    btn.addEventListener("click", closeRightSidebar);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (state.drawerOpen) closeDrawer();
      if (state.searchOpen) closeSearch();
      if (state.rightSidebarOpen) closeRightSidebar();
    }
  });
}

function bindSearchEvents() {
  document.querySelectorAll("[data-toggle-search]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.searchOpen = !state.searchOpen;
      const shell = document.querySelector(".app-shell");
      if (shell) shell.classList.toggle("search-open", state.searchOpen);
      if (state.searchOpen) {
        setTimeout(() => document.querySelector("#scheme-search-slide")?.focus(), 100);
      }
    });
  });
  document.querySelectorAll("[data-close-search]").forEach((btn) => {
    btn.addEventListener("click", closeSearch);
  });
  const searchInput = document.querySelector("#scheme-search-slide");
  if (searchInput) {
    let searchTimer;
    searchInput.addEventListener("input", (event) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.schemeQuery = event.target.value;
        render();
        const newInput = document.querySelector("#scheme-search-slide");
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(newInput.value.length, newInput.value.length);
        }
      }, 200);
    });
  }
}

function bindPromoClose() {
  const close = document.querySelector("[data-close-promo]");
  if (close) {
    close.addEventListener("click", () => {
      const card = document.querySelector(".sidebar-promo-card");
      if (card) card.style.display = "none";
    });
  }
}

function showIntroVideo(callback) {
  if (introShown || state.route !== "landing") {
    callback();
    return;
  }

  app.innerHTML = "";

  const overlay = document.createElement("div");
  overlay.className = "video-intro-overlay";
  overlay.innerHTML = `
    <video src="./land.mp4" autoplay muted playsinline preload="auto"></video>
    <div class="video-intro-skip-hint">${t("Tap anywhere to skip")}</div>
  `;
  document.body.appendChild(overlay);

  const video = overlay.querySelector("video");
  const hint = overlay.querySelector(".video-intro-skip-hint");

  function dismiss() {
    if (overlay.classList.contains("slide-out")) return;
    callback();
    overlay.classList.add("slide-out");
    removeEventListener("keydown", onKey);
    setTimeout(() => {
      overlay.remove();
      introShown = true;
    }, 900);
  }

  function onKey(e) {
    if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
      e.preventDefault();
      dismiss();
    }
  }
  addEventListener("keydown", onKey);

  video.addEventListener("ended", dismiss);
  overlay.addEventListener("click", dismiss);

  video.play().catch(function () {});
}

function render() {
  if (state.route !== "landing" && state.route !== "login" && state.route !== "otp" && !state.session) {
    state.route = "landing";
  }

  if (state.route === "landing") renderLanding();
  if (state.route === "login") renderLogin();
  if (state.route === "otp") renderOtp();
  if (state.route === "upload") renderUpload();
  if (state.route === "dashboard") renderDashboard();
  if (state.route === "insights") renderInsightsPage();
  if (state.route === "schemes") renderDashboard("Schemes");

  // Focus management: move focus to main content for screen readers
  const mainContent = app.querySelector(".phone-card, .landing-hero, .screen");
  if (mainContent && !mainContent.hasAttribute("tabindex")) {
    mainContent.setAttribute("tabindex", "-1");
    mainContent.focus({ preventScroll: true });
  }
}

function renderGuidanceModal(scheme) {
  const step = state.guidanceStep || 1;
  const url = getAllowedUrl(scheme);
  const documents = scheme.documents || ["Aadhaar Card", "Mobile number linked with Aadhaar", "Savings bank account passbook"];
  const steps = scheme.steps || [
    "Open the official verified portal.",
    "Verify using Aadhaar-linked OTP.",
    "Submit your occupation details and get registered."
  ];
  const isInsurance = ["pmjjby", "pmsby", "pmJay", "pm-jay"].includes(scheme.id);
  const totalSteps = isInsurance ? 4 : 3;

  const claimDocs = [
    "Policy document / enrollment number",
    "Aadhaar Card",
    "Bank account details",
    "Claim form (download from portal)",
    "Supporting documents (hospital bills / death certificate)"
  ];
  const claimSteps = [
    "Download the claim form from the official portal.",
    "Fill in the policyholder details and policy number.",
    "Attach all required supporting documents.",
    "Submit the form at the nearest branch or online portal.",
    "Track claim status using the acknowledgment number."
  ];

  let stepContent = "";
  if (step === 1) {
    const docItems = documents.map((doc) => `
      <li class="guidance-doc-item">
        <label class="guidance-doc-label">
          <input type="checkbox" class="guidance-doc-checkbox doc-checkbox">
          <span>${escapeHtml(t(doc))}</span>
        </label>
      </li>
    `).join("");

    stepContent = `
      <div class="guidance-step-view">
        <h4 class="guidance-step-title">${t("Step 1: Check Required Documents")}</h4>
        <p class="copy" style="margin-bottom: 15px; font-size: 0.88rem;">${t("Please check off that you have these documents ready before opening the application portal:")}</p>
        <ul class="guidance-doc-checklist">
          ${docItems}
        </ul>
        <div class="guidance-disclaimer">
          <span class="guidance-disclaimer-icon">${ICONS.shield}</span>
          <span class="guidance-disclaimer-text">${t("Kaam Card never saves or asks for copy uploads of these documents. Keep them with you locally.")}</span>
        </div>
      </div>
    `;
  } else if (step === 2) {
    const stepItems = steps.map((s, idx) => `
      <div class="guidance-instruction-card">
        <div class="guidance-instruction-num">${idx + 1}</div>
        <p class="guidance-instruction-desc">${escapeHtml(t(s))}</p>
      </div>
    `).join("");

    stepContent = `
      <div class="guidance-step-view">
        <h4 class="guidance-step-title">${t("Step 2: Step-by-Step Instructions")}</h4>
        <p class="copy" style="margin-bottom: 15px; font-size: 0.88rem;">${t("Follow these steps on the official portal to complete your registration:")}</p>
        <div class="instructions-timeline">
          ${stepItems}
        </div>
      </div>
    `;
  } else if (step === 3 && !isInsurance) {
    stepContent = `
      <div class="guidance-step-view" style="text-align: center;">
        <h4 class="guidance-step-title">${t("Step 3: Access Official Portal")}</h4>
        <p class="copy" style="margin-bottom: 20px; font-size: 0.88rem;">${t("You are now ready to visit the official website of the")} <strong>${escapeHtml(t(scheme.ministry || "Government of India"))}</strong>.</p>
        
        <div class="guidance-portal-card">
          <div class="guidance-portal-badge">
            <span class="guidance-portal-badge-icon">${ICONS.shield}</span>
            <span>${t("Verified Official Portal")}</span>
          </div>
          <p class="guidance-portal-domain">${t("Destination:")} <strong>${escapeHtml(url ? url.hostname : "")}</strong></p>
          <a class="secure-link-btn guidance-portal-link" href="${escapeHtml(url ? url.href : "#")}" target="_blank" rel="noopener noreferrer">
            <span>${t("Open official portal")}</span>
            ${ICONS.external}
          </a>
        </div>
        
        <p class="copy" style="font-size: 0.8rem; color: var(--muted); margin-top: 15px;">
          ${t("Always confirm the URL ends in .gov.in or .nic.in before submitting any personal information.")}
        </p>
      </div>
    `;
  } else if (step === 3 && isInsurance) {
    const claimDocItems = claimDocs.map((doc) => `
      <li class="guidance-doc-item">
        <label class="guidance-doc-label">
          <input type="checkbox" class="guidance-doc-checkbox doc-checkbox">
          <span>${escapeHtml(t(doc))}</span>
        </label>
      </li>
    `).join("");
    stepContent = `
      <div class="guidance-step-view">
        <h4 class="guidance-step-title">${t("Step 3: Claim Documents")}</h4>
        <p class="copy" style="margin-bottom: 15px; font-size: 0.88rem;">${t("Prepare these documents if you need to file a claim:")}</p>
        <ul class="guidance-doc-checklist">
          ${claimDocItems}
        </ul>
      </div>
    `;
  } else {
    const claimStepItems = claimSteps.map((s, idx) => `
      <div class="guidance-instruction-card">
        <div class="guidance-instruction-num">${idx + 1}</div>
        <p class="guidance-instruction-desc">${escapeHtml(t(s))}</p>
      </div>
    `).join("");
    stepContent = `
      <div class="guidance-step-view">
        <h4 class="guidance-step-title">${t("Step 4: File a Claim")}</h4>
        <p class="copy" style="margin-bottom: 15px; font-size: 0.88rem;">${t("Follow these steps to file a claim on the official portal:")}</p>
        <div class="instructions-timeline">
          ${claimStepItems}
        </div>
        <div class="guidance-portal-card" style="margin-top:16px">
          <div class="guidance-portal-badge">
            <span class="guidance-portal-badge-icon">${ICONS.shield}</span>
            <span>${t("Verified Official Portal")}</span>
          </div>
          <a class="secure-link-btn guidance-portal-link" href="${escapeHtml(url ? url.href : "#")}" target="_blank" rel="noopener noreferrer">
            <span>${t("Open official portal")}</span>
            ${ICONS.external}
          </a>
        </div>
      </div>
    `;
  }

  return `
    <div class="guidance-modal-backdrop" id="guidance-modal">
      <div class="guidance-modal-card">
        <header class="guidance-modal-header">
          <h3 class="guidance-modal-title">${escapeHtml(t(scheme.shortName || scheme.name))} ${t("Guide")}</h3>
          <button class="guidance-close-btn" type="button" data-close-guidance aria-label="${t("Close")}">${ICONS.back}</button>
        </header>
        
        <!-- Step progress indicators -->
        <div class="guidance-steps-bar">
          <div class="guidance-step-indicator ${step >= 1 ? "active" : ""}">
            <div class="guidance-step-num">1</div>
            <span>${t("Docs")}</span>
          </div>
          <div class="guidance-step-line ${step >= 2 ? "active" : ""}"></div>
          <div class="guidance-step-indicator ${step >= 2 ? "active" : ""}">
            <div class="guidance-step-num">2</div>
            <span>${t("Steps")}</span>
          </div>
          <div class="guidance-step-line ${step >= 3 ? "active" : ""}"></div>
          <div class="guidance-step-indicator ${step >= 3 ? "active" : ""}">
            <div class="guidance-step-num">3</div>
            <span>${isInsurance ? t("Claim") : t("Apply")}</span>
          </div>
          ${isInsurance ? `
          <div class="guidance-step-line ${step >= 4 ? "active" : ""}"></div>
          <div class="guidance-step-indicator ${step >= 4 ? "active" : ""}">
            <div class="guidance-step-num">4</div>
            <span>${t("Apply")}</span>
          </div>
          ` : ""}
        </div>
        
        <div class="guidance-modal-body">
          ${stepContent}
        </div>
        
        <footer class="guidance-modal-footer">
          <button class="secondary-btn" type="button" data-prev-step ${step === 1 ? "disabled" : ""}>${t("Back")}</button>
          ${step < totalSteps ? `
            <button class="primary-btn" type="button" data-next-step>${t("Next Step")}</button>
          ` : `
            <button class="primary-btn" type="button" data-close-guidance>${t("Finish")}</button>
          `}
        </footer>
      </div>
    </div>
  `;
}

function bindGuidanceModalEvents() {
  const modal = document.querySelector("#guidance-modal");
  if (!modal) return;

  modal.querySelectorAll("[data-close-guidance]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.guidanceSchemeId = null;
      state.guidanceStep = 1;
      render();
    });
  });

  modal.querySelector("[data-prev-step]")?.addEventListener("click", () => {
    if (state.guidanceStep > 1) {
      state.guidanceStep -= 1;
      render();
    }
  });

  modal.querySelector("[data-next-step]")?.addEventListener("click", () => {
    if (state.guidanceStep < 4) {
      state.guidanceStep += 1;
      render();
    }
  });
  
  modal.querySelectorAll(".doc-checkbox").forEach((cb, idx) => {
    cb.addEventListener("change", (e) => {
      addAuditLog(`Guidance document checkbox ${idx + 1} marked ${e.target.checked ? "checked" : "unchecked"}.`);
    });
  });
}

async function loadSchemesDb() {
  try {
    const response = await fetch("schemes_db.json");
    if (response.ok) {
      state.schemesDb = await response.json();
      addAuditLog(`Loaded ${state.schemesDb.length} schemes dynamically from scraped database.`);
    } else {
      throw new Error(`HTTP status ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to load schemes_db.json, using fallback schemes:", error);
    state.schemesDb = FALLBACK_SCHEMES;
    addAuditLog("Using offline fallback welfare schemes.");
  }
}

window.onerror = function (message, source, lineno, colno, error) {
  console.error("Uncaught error:", { message, source, lineno, colno, error });
  if (app) {
    app.innerHTML = `
      <div style="padding:40px;text-align:center;font-family:system-ui,sans-serif;">
        <h2>${t("Something went wrong")}</h2>
        <p style="color:#8C857B;margin:16px 0;">${t("The app encountered an unexpected error. Please refresh the page to try again.")}</p>
        <button onclick="location.reload()" style="padding:10px 24px;border:none;border-radius:8px;background:#C85A32;color:#fff;font-weight:700;cursor:pointer;">${t("Refresh Page")}</button>
      </div>
    `;
  }
  return true;
};

window.addEventListener("unhandledrejection", function (event) {
  console.error("Unhandled promise rejection:", event.reason);
});


applyTheme(state.theme);
initInteractiveGridPattern();
loadSchemesDb().finally(async () => {
  if (API.loadToken()) {
    try {
      const data = await API.getSession();
      state.session = data.session;
      if (data.profile) {
        state.profile = data.profile.profile;
        state.expenseProfile = data.profile.expenseProfile || null;
        state.parseResult = data.profile.parseResult;
        state.matches = data.profile.matches || [];
        state.details = data.profile.details || state.details;
      }
      state.route = state.profile ? "dashboard" : "upload";
      return;
    } catch {
      API.setToken(null);
    }
  }
  if (loadSession()) {
    state.route = state.profile ? "dashboard" : "upload";
  }
  showIntroVideo(render);
});


