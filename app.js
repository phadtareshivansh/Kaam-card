const app = document.querySelector("#app");
const THEME_STORAGE_KEY = "kaam-card-theme";
const SESSION_STORAGE_KEY = "kaam-card-session";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const BAD_DAY_THRESHOLD_RATIO = 0.5;
const SAVINGS_RATE = 0.45;
const MIN_SAVINGS_AMOUNT = 20;
const SAVINGS_ROUNDING = 10;
const FALLBACK_SURPLUS_RATIO = 0.2;
const DAYS_IN_MONTH = 30;

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
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.4 14.5A8.2 8.2 0 0 1 9.5 3.6 8.5 8.5 0 1 0 20.4 14.5Z"/></svg>'
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
      consentGiven: state.consentGiven
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
    return Boolean(data.session);
  } catch (error) {
    return false;
  }
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
  delhiBocw: "https://labour.delhi.gov.in/labour/delhi-building-and-other-construction-workers-welfare-board"
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
  rightSidebarOpen: false
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
  "friend": "मित्र"
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
  "100% Private: No Aadhaar or PAN stored": "100% Private: No Aadhaar or PAN stored",
  "Safe: In-memory processing": "Safe: In-memory processing",
  "Go from Platform Earnings to Welfare Benefits in 2 Minutes.": "Go from Platform Earnings to Welfare Benefits in 2 Minutes.",
  "Kaam Card is a portable, secure record for informal and gig workers.": "Kaam Card is a portable, secure record for informal and gig workers.",
  "Aadhaar Card": "Aadhaar Card",
  "What We Do": "நாங்கள் என்ன செய்கிறோம்",
  "Designed for India's Informal Workforce": "Designed for India's Informal Workforce",
  "2 min": "2 min",
  "Average setup time": "Average setup time",
  "Zero": "Zero",
  "Data stored on servers": "Data stored on servers",
  "Go from daily wages to safe public welfare benefits": "Go from daily wages to safe public welfare benefits",
  "Verify your eligibility instantly and register on official portals without middleman risk.": "Verify your eligibility instantly and register on official portals without middleman risk.",
  "Verify eligibility & register": "Verify eligibility & register",
  "Punchlist's Quality": "Punchlist's Quality",
  "Go from design to build without losing crucial details.": "Go from design to build without losing crucial details.",
  "Security Audit": "Security Audit",
  "No data is shared or stored without explicit consent.": "No data is shared or stored without explicit consent.",
  "Why Kaam Card?": "Why Kaam Card?",
  "We help gig workers accumulate data value that is normally locked away in siloed apps.": "We help gig workers accumulate data value that is normally locked away in siloed apps.",
  "Income Analytics": "வருமான பகுப்பாய்வு",
  "Understand your earnings variance, good days vs bad days, and average monthly income instantly.": "Understand your earnings variance, good days vs bad days, and average monthly income instantly.",
  "Scheme Matching": "Scheme Matching",
  "Automatically match your computed income against real criteria for e-Shram, PM-SYM, PM-JAY, and more.": "Automatically match your computed income against real criteria for e-Shram, PM-SYM, PM-JAY, and more.",
  "Smart Micro-Savings": "Smart Micro-Savings",
  "Get a mathematically grounded savings rule based on your actual income surplus on high-earning days.": "Get a mathematically grounded savings rule based on your actual income surplus on high-earning days.",
  "Three Simple Steps": "Three Simple Steps",
  "Secure OTP Login": "Secure OTP Login",
  "Enter your phone number to start a secure, isolated sandbox session. No passwords required.": "Enter your phone number to start a secure, isolated sandbox session. No passwords required.",
  "Upload Statements": "Upload Statements",
  "Drop a bank statement or UPI statement CSV. We parse it locally in your browser and discard raw transaction details.": "Drop a bank statement or UPI statement CSV. We parse it locally in your browser and discard raw transaction details.",
  "Get Kaam Dashboard": "Get Kaam Dashboard",
  "Instantly check eligible schemes, review savings recommendations, and export your portable worker card.": "Instantly check eligible schemes, review savings recommendations, and export your portable worker card.",
  "Loved by Workers": "Loved by Workers",
  "Hear from informal partners who verified their scheme eligibility using Kaam Card.": "Hear from informal partners who verified their scheme eligibility using Kaam Card.",
  "Log In & Access Portal": "Log In & Access Portal",
  "Start with your mobile number. This demo keeps the session in memory only.": "Start with your mobile number. This demo keeps the session in memory only.",
  "Mobile number": "Mobile number",
  "Enter mobile number": "Enter mobile number",
  "Enter 10 digit number to receive a secure OTP verification check.": "Enter 10 digit number to receive a secure OTP verification check.",
  "Send secure OTP link": "Send secure OTP link",
  "Continue with sample data": "Continue with sample data",
  "OTP Verification": "OTP Verification",
  "OTP sent via server": "OTP sent via server",
  "We sent an OTP to": "We sent an OTP to",
  "Any 4 digits will work in this prototype.": "Any 4 digits will work in this prototype.",
  "Verify code": "Verify code",
  "Verify and continue": "Verify and continue",
  "Switch to light theme": "Switch to light theme",
  "Switch to dark theme": "Switch to dark theme",
  "Consent & Authorization": "Consent & Authorization",
  "Kaam Card parses statement details locally to build your portable record. By continuing, you agree to:": "Kaam Card parses statement details locally to build your portable record. By continuing, you agree to:",
  "Local Parsing:": "Local Parsing:",
  "Executed strictly in-browser memory.": "Executed strictly in-browser memory.",
  "Data Minimization:": "Data Minimization:",
  "Raw lines are discarded after daily stats computation.": "Raw lines are discarded after daily stats computation.",
  "Zero ID Collection:": "Zero ID Collection:",
  "We never collect Aadhaar, PAN, or full bank numbers.": "We never collect Aadhaar, PAN, or full bank numbers.",
  "I authorize Kaam Card to parse my transaction statement.": "I authorize Kaam Card to parse my transaction statement.",
  "Kaam Card parses statement details locally to build your portable record. By continuing, you agree to:": "Kaam Card parses statement details locally to build your portable record. By continuing, you agree to:",
  "Local Parsing:": "Local Parsing:",
  "Data Minimization:": "Data Minimization:",
  "Zero ID Collection:": "Zero ID Collection:",
  "Executed strictly in-browser memory.": "Executed strictly in-browser memory.",
  "Raw lines are discarded after daily stats computation.": "Raw lines are discarded after daily stats computation.",
  "We never collect Aadhaar, PAN, or full bank numbers.": "We never collect Aadhaar, PAN, or full bank numbers.",
  "Your data stays in this browser session. We do not ask for Aadhaar, PAN, or bank account numbers.": "Your data stays in this browser session. We do not ask for Aadhaar, PAN, or bank account numbers.",
  "Use a CSV with date, amount, direction. Links inside files are treated as plain text.": "Use a CSV with date, amount, direction. Links inside files are treated as plain text.",
  "Tap to upload CSV": "Tap to upload CSV",
  "or drag and drop. CSV only, up to 5 MB.": "or drag and drop. CSV only, up to 5 MB.",
  "Basic details for matching": "Basic details for matching",
  "Age": "வயது",
  "Occupation": "தொழில்",
  "State": "மாநிலம்",
  "Sample datasets": "Sample datasets",
  "Choose Bank Statement Dataset": "Choose Bank Statement Dataset",
  "Continue to dashboard": "Continue to dashboard",
  "Welcome, Worker": "வரவேற்கிறோம், தொழிலாளி",
  "This dashboard tracks your calculated income averages and verifies matching state schemes.": "This dashboard tracks your calculated income averages and verifies matching state schemes.",
  "Daily earnings trend and variations": "தினசரி வருவாய் போக்கு மற்றும் மாறுபாடுகள்",
  "Daily Avg": "தினசரி சராசரி",
  "Good Days": "நல்ல நாட்கள்",
  "Bad Days": "கெட்ட நாட்கள்",
  "Smart Suggestion": "ஸ்மார்ட் பரிந்துரை",
  "Arithmetic-based micro-savings rule": "எண்கணித அடிப்படையிலான நுண் சேமிப்பு விதி",
  "Tied to your actual data, this habit will accumulate about": "Tied to your actual data, this habit will accumulate about",
  "low-income days.": "low-income days.",
  "on days earning above": "on days earning above",
  "Save Rs": "Save Rs",
  "and cover up to": "and cover up to",
  "Welfare Matching": "Welfare Matching",
  "Search matched schemes": "Search matched schemes",
  "Type scheme name...": "Type scheme name...",
  "Knowledge Resources": "Knowledge Resources",
  "Local Security Audit Trail": "Local Security Audit Trail",
  "Guide me & Apply": "Guide me & Apply",
  "Eligible public schemes": "Eligible public schemes",
  "matched": "matched",
  "low-income days": "low-income days",
  "total parsed credit": "total parsed credit",
  "Low-income threshold": "Low-income threshold",
  "Export your secure worker profile": "Export your secure worker profile",
  "Generate a portable summary of your checked parameters. No raw bank records are saved or shared.": "Generate a portable summary of your checked parameters. No raw bank records are saved or shared.",
  "Generate Profile": "Generate Profile",
  "Required documents check": "Required documents check",
  "Official Application Steps": "Official Application Steps",
  "Secure portal verification redirect": "Secure portal verification redirect",
  "Finish": "Finish",
  "Next Step": "Next Step",
  "Previous Step": "Previous Step",
  "Check Documents": "Check Documents",
  "Steps & Timeline": "Steps & Timeline",
  "Safe Redirect": "Safe Redirect",
  "Application Stepper Guide": "Application Stepper Guide",
  "No documents are uploaded or stored.": "No documents are uploaded or stored.",
  "Close": "மூடுக",
  "Verified Portal Redirect": "Verified Portal Redirect",
  "Guide": "வழிகாட்டி",
  "Docs": "ஆவணங்கள்",
  "Steps": "படிகள்",
  "Apply": "விண்ணப்பிக்கவும்",
  "Back": "பின்",
  "Step 1: Check Required Documents": "Step 1: Check Required Documents",
  "Please check off that you have these documents ready before opening the application portal:": "Please check off that you have these documents ready before opening the application portal:",
  "Kaam Card never saves or asks for copy uploads of these documents. Keep them with you locally.": "Kaam Card never saves or asks for copy uploads of these documents. Keep them with you locally.",
  "Step 2: Step-by-Step Instructions": "Step 2: Step-by-Step Instructions",
  "Follow these steps on the official portal to complete your registration:": "Follow these steps on the official portal to complete your registration:",
  "Step 3: Access Official Portal": "Step 3: Access Official Portal",
  "You are now ready to visit the official website of the": "You are now ready to visit the official website of the",
  "Verified Official Portal": "Verified Official Portal",
  "Destination:": "Destination:",
  "Open official portal": "Open official portal",
  "Always confirm the URL ends in .gov.in or .nic.in before submitting any personal information.": "Always confirm the URL ends in .gov.in or .nic.in before submitting any personal information.",
  "Atal Pension Yojana": "Atal Pension Yojana",
  "Pension scheme for unorganized workers providing guaranteed minimum pension of Rs. 1,000 to Rs. 5,000 per month after age 60.": "Pension scheme for unorganized workers providing guaranteed minimum pension of Rs. 1,000 to Rs. 5,000 per month after age 60.",
  "e-Shram Registration": "e-Shram Registration",
  "National database for unorganized workers to facilitate social security benefits and direct benefit transfers.": "National database for unorganized workers to facilitate social security benefits and direct benefit transfers.",
  "Pradhan Mantri Shram Yogi Maan-dhan": "Pradhan Mantri Shram Yogi Maan-dhan",
  "Voluntary pension scheme for unorganized workers with monthly contribution matching by Central Government.": "Voluntary pension scheme for unorganized workers with monthly contribution matching by Central Government.",
  "Ayushman Bharat PM-JAY": "Ayushman Bharat PM-JAY",
  "Free health insurance coverage up to Rs. 5 Lakhs per family per year for secondary and tertiary care hospitalization.": "Free health insurance coverage up to Rs. 5 Lakhs per family per year for secondary and tertiary care hospitalization.",
  "PM SVANidhi Scheme": "PM SVANidhi Scheme",
  "Special micro-credit facility for street vendors to access affordable working capital loans for business revival.": "Special micro-credit facility for street vendors to access affordable working capital loans for business revival.",
  "Delivery Partner, Delhi": "Delivery Partner, Delhi",
  "Cab Driver, Mumbai": "Cab Driver, Mumbai",
  "Domestic Worker, Bangalore": "Domestic Worker, Bangalore",
  "Need help checking eligibility?": "Need help checking eligibility?",
  "We are dedicated to supporting digital portability for India's gig economy. If you have questions about the pilot or scheme integration, get in touch.": "We are dedicated to supporting digital portability for India's gig economy. If you have questions about the pilot or scheme integration, get in touch.",
  "Toll-free Helpdesk: 1800-11-0031 (Demo)": "Toll-free Helpdesk: 1800-11-0031 (Demo)",
  "Features": "Features",
  "Process": "Process",
  "Reviews": "Reviews",
  "Contact": "Contact",
  "Empowering Indian gig workers with portable data identity.": "Empowering Indian gig workers with portable data identity.",
  "Product": "Product",
  "Testimonials": "Testimonials",
  "Support": "Support",
  "Email": "Email",
  "Legal": "Legal",
  "Privacy": "Privacy",
  "Terms": "Terms",
  "or": "or",
  "Select Language": "மொழியைத் தேர்ந்தெடுக்கவும்",
  "English": "ஆங்கிலம்",
  "Hindi": "இந்தி",
  "Country code": "Country code",
  "Back": "பின்",
  "OTP digits": "OTP digits",
  "OTP digit 1": "OTP digit 1",
  "OTP digit 2": "OTP digit 2",
  "OTP digit 3": "OTP digit 3",
  "OTP digit 4": "OTP digit 4",
  "OTP digit 5": "OTP digit 5",
  "OTP digit 6": "OTP digit 6",
  "Demo code:": "Demo code:",
  "Parse status": "Parse status",
  "Parsed income rows": "Parsed income rows",
  "No usable income rows yet": "No usable income rows yet",
  "Rows skipped safely": "Rows skipped safely",
  "We skipped malformed rows instead of crashing.": "We skipped malformed rows instead of crashing.",
  "Row": "Row",
  "Issue": "Issue",
  "Add at least one valid credit/income row to continue.": "Add at least one valid credit/income row to continue.",
  "Analyzed period:": "Analyzed period:",
  "Eligible public schemes (": "Eligible public schemes (",
  " matched)": " matched)",
  "No scheme matches found. Try adjusting search or details.": "No scheme matches found. Try adjusting search or details.",
  "Share Summary": "சுருக்கத்தைப் பகிரவும்",
  "Share summary text": "சுருக்க உரையைப் பகிரவும்",
  "Session code:": "Session code:",
  "Daily income bar chart": "Daily income bar chart",
  "Eligible": "தகுதியானது",
  "Welfare Knowledge & Security Logs": "Welfare Knowledge & Security Logs",
  "No actions logged yet.": "No actions logged yet.",
  "Shareable summary": "Shareable summary",
  "This is a simple text summary for the demo. No raw transactions are included.": "This is a simple text summary for the demo. No raw transactions are included.",
  "Copied": "நகலெடுக்கப்பட்டது",
  "Copy": "நகலெடு",
  "Danger Zone": "Danger Zone",
  "This will completely clear your parsed income profile and reset the session.": "This will completely clear your parsed income profile and reset the session.",
  "Clear & Purge Session Data": "Clear & Purge Session Data",
  "Upload": "பதிவேற்றவும்",
  "More": "மேலும்",
  "Main navigation": "Main navigation",
  "From phone to dashboard in under 2 minutes": "From phone to dashboard in under 2 minutes",
  "Kaam Card navigation": "Kaam Card navigation",
  "Language switched to": "Language switched to",
  "Are you sure you want to end your session and delete all parsed data? This cannot be undone.": "Are you sure you want to end your session and delete all parsed data? This cannot be undone.",
  "Something went wrong": "Something went wrong",
  "The app encountered an unexpected error. Please refresh the page to try again.": "The app encountered an unexpected error. Please refresh the page to try again.",
  "Refresh Page": "Refresh Page",
  "Kaam Card summary": "Kaam Card summary",
  "Phone session:": "Phone session:",
  "Average daily income:": "Average daily income:",
  "Good days:": "Good days:",
  "bad days:": "bad days:",
  "Saving rule: save": "Saving rule: save",
  "on days above": "on days above",
  "Likely schemes:": "Likely schemes:",
  "No exact match yet": "No exact match yet",
  "Demo note: eligibility is simplified and should be verified on the official portal.": "Demo note: eligibility is simplified and should be verified on the official portal.",
  "Income Profile": "வருமான சுயவிவரம்",
  "Daily Average": "தினசரி சராசரி",
  "Monthly Estimate": "மாதாந்திர மதிப்பீடு",
  "Low Days": "குறைந்த நாட்கள்",
  "Savings Recommendation": "சேமிப்பு பரிந்துரை",
  "Matched Welfare Schemes": "Matched Welfare Schemes",
  "Generated by Kaam Card | Eligibility is simplified, verify on official portals": "Generated by Kaam Card | Eligibility is simplified, verify on official portals",
  "Income": "Income",
  "Using Kaam Card took less than 2 minutes. It computed my average daily income and showed me I qualified for PM-SYM pension. I registered the same day!": "Using Kaam Card took less than 2 minutes. It computed my average daily income and showed me I qualified for PM-SYM pension. I registered the same day!",
  "I always wanted to save but didn't know how much. The good-day surplus savings suggestion helped me set aside money on busy weekends to cover dry weekdays.": "I always wanted to save but didn't know how much. The good-day surplus savings suggestion helped me set aside money on busy weekends to cover dry weekdays.",
  "I was worried about sharing bank logs, but Kaam Card's privacy focus is amazing. It runs on my browser and doesn't store my Aadhaar or transaction lists.": "I was worried about sharing bank logs, but Kaam Card's privacy focus is amazing. It runs on my browser and doesn't store my Aadhaar or transaction lists.",
  "© 2026 Kaam Card.": "© 2026 Kaam Card.",
  " of ": " of ",
  " to ": " to ",
  "/month": "/month",
  "You qualify because your ": "You qualify because your ",
  " and ": " and ",
  "Close match: ": "Close match: ",
  "some details match": "some details match",
  ", but ": ", but ",
  "age ": "age ",
  " is within ": " is within ",
  "age must be ": "age must be ",
  "estimated monthly income is below ": "estimated monthly income is below ",
  "no income cap holds": "no income cap holds",
  "income is above ": "income is above ",
  " is covered": " is covered",
  "occupation must match: ": "occupation must match: ",
  " state matches": " state matches",
  "state must be ": "state must be ",
  " or ": " or ",
  "Worker ": "Worker ",
  "Save ": "Save ",
  " on good days (above ": " on good days (above ",
  ")": ")",
  " | +91 ": " | +91 ",
  "-": "-",
  "CSV needs a header and at least one data row.": "CSV needs a header and at least one data row.",
  "Missing column: ": "Missing column: ",
  "Date is invalid. Use YYYY-MM-DD or DD-MM-YYYY.": "Date is invalid. Use YYYY-MM-DD or DD-MM-YYYY.",
  "Amount is invalid. Use a positive number.": "Amount is invalid. Use a positive number.",
  "Direction must be credit/income or debit/expense.": "Direction must be credit/income or debit/expense.",
  "Please upload a CSV file.": "Please upload a CSV file.",
  "Detected format:": "கண்டறியப்பட்ட வடிவம்:",
  "Expense Summary": "செலவு சுருக்கம்",
  "Spending breakdown from your statement": "Spending breakdown from your statement",
  "Total Expenses": "மொத்த செலவுகள்",
  "Avg daily": "சராசரி தினசரி",
  "Top Category": "முதல் பிரிவு",
  "Income Insights": "வருமான நுண்ணறிவுகள்",
  "Income Stability": "வருமான நிலைத்தன்மை",
  "Stability score based on income variance": "வருமான மாறுபாட்டின் அடிப்படையில் நிலைத்தன்மை மதிப்பெண்",
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
  "File is larger than 5 MB.": "File is larger than 5 MB.",
  "Log Out": "வெளியேறு",
  "Generated by Kaam Card | Eligibility is simplified, verify on official portals": "Generated by Kaam Card | Eligibility is simplified, verify on official portals",
  "Kaam Card - ": "Kaam Card - ",
  "worker": "worker",
  "friend": "friend"
}



const TRANSLATIONS_TE = {
  "Kaam Card": "కామ్ కార్డ్",
  "Dashboard": "డాష్‌బోర్డ్",
  "Connect Data": "డేటాను కనెక్ట్ చేయండి",
  "Income Analytics": "ఆదాయ విశ్లేషణ",
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
  "SECURE SANDBOX": "సురక్షిత సాండ్‌బాక్స్",
  "LOG IN / START": "లాగిన్ / ప్రారంభించండి",
  "Create Your Kaam Card": "మీ కామ్ కార్డ్ సృష్టించండి",
  "How it Works": "ఇది ఎలా పనిచేస్తుంది",
  "100% Private: No Aadhaar or PAN stored": "100% Private: No Aadhaar or PAN stored",
  "Safe: In-memory processing": "Safe: In-memory processing",
  "Go from Platform Earnings to Welfare Benefits in 2 Minutes.": "Go from Platform Earnings to Welfare Benefits in 2 Minutes.",
  "Kaam Card is a portable, secure record for informal and gig workers.": "Kaam Card is a portable, secure record for informal and gig workers.",
  "Aadhaar Card": "Aadhaar Card",
  "What We Do": "మేము ఏమి చేస్తాము",
  "Designed for India's Informal Workforce": "Designed for India's Informal Workforce",
  "2 min": "2 min",
  "Average setup time": "Average setup time",
  "Zero": "Zero",
  "Data stored on servers": "Data stored on servers",
  "Go from daily wages to safe public welfare benefits": "Go from daily wages to safe public welfare benefits",
  "Verify your eligibility instantly and register on official portals without middleman risk.": "Verify your eligibility instantly and register on official portals without middleman risk.",
  "Verify eligibility & register": "Verify eligibility & register",
  "Punchlist's Quality": "Punchlist's Quality",
  "Go from design to build without losing crucial details.": "Go from design to build without losing crucial details.",
  "Security Audit": "Security Audit",
  "No data is shared or stored without explicit consent.": "No data is shared or stored without explicit consent.",
  "Why Kaam Card?": "Why Kaam Card?",
  "We help gig workers accumulate data value that is normally locked away in siloed apps.": "We help gig workers accumulate data value that is normally locked away in siloed apps.",
  "Income Analytics": "ఆదాయ విశ్లేషణ",
  "Understand your earnings variance, good days vs bad days, and average monthly income instantly.": "Understand your earnings variance, good days vs bad days, and average monthly income instantly.",
  "Scheme Matching": "Scheme Matching",
  "Automatically match your computed income against real criteria for e-Shram, PM-SYM, PM-JAY, and more.": "Automatically match your computed income against real criteria for e-Shram, PM-SYM, PM-JAY, and more.",
  "Smart Micro-Savings": "Smart Micro-Savings",
  "Get a mathematically grounded savings rule based on your actual income surplus on high-earning days.": "Get a mathematically grounded savings rule based on your actual income surplus on high-earning days.",
  "Three Simple Steps": "Three Simple Steps",
  "Secure OTP Login": "Secure OTP Login",
  "Enter your phone number to start a secure, isolated sandbox session. No passwords required.": "Enter your phone number to start a secure, isolated sandbox session. No passwords required.",
  "Upload Statements": "Upload Statements",
  "Drop a bank statement or UPI statement CSV. We parse it locally in your browser and discard raw transaction details.": "Drop a bank statement or UPI statement CSV. We parse it locally in your browser and discard raw transaction details.",
  "Get Kaam Dashboard": "Get Kaam Dashboard",
  "Instantly check eligible schemes, review savings recommendations, and export your portable worker card.": "Instantly check eligible schemes, review savings recommendations, and export your portable worker card.",
  "Loved by Workers": "Loved by Workers",
  "Hear from informal partners who verified their scheme eligibility using Kaam Card.": "Hear from informal partners who verified their scheme eligibility using Kaam Card.",
  "Log In & Access Portal": "Log In & Access Portal",
  "Start with your mobile number. This demo keeps the session in memory only.": "Start with your mobile number. This demo keeps the session in memory only.",
  "Mobile number": "Mobile number",
  "Enter mobile number": "Enter mobile number",
  "Enter 10 digit number to receive a secure OTP verification check.": "Enter 10 digit number to receive a secure OTP verification check.",
  "Send secure OTP link": "Send secure OTP link",
  "Continue with sample data": "Continue with sample data",
  "OTP Verification": "OTP Verification",
  "OTP sent via server": "OTP sent via server",
  "We sent an OTP to": "We sent an OTP to",
  "Any 4 digits will work in this prototype.": "Any 4 digits will work in this prototype.",
  "Verify code": "Verify code",
  "Verify and continue": "Verify and continue",
  "Switch to light theme": "Switch to light theme",
  "Switch to dark theme": "Switch to dark theme",
  "Consent & Authorization": "Consent & Authorization",
  "Kaam Card parses statement details locally to build your portable record. By continuing, you agree to:": "Kaam Card parses statement details locally to build your portable record. By continuing, you agree to:",
  "Local Parsing:": "Local Parsing:",
  "Executed strictly in-browser memory.": "Executed strictly in-browser memory.",
  "Data Minimization:": "Data Minimization:",
  "Raw lines are discarded after daily stats computation.": "Raw lines are discarded after daily stats computation.",
  "Zero ID Collection:": "Zero ID Collection:",
  "We never collect Aadhaar, PAN, or full bank numbers.": "We never collect Aadhaar, PAN, or full bank numbers.",
  "I authorize Kaam Card to parse my transaction statement.": "I authorize Kaam Card to parse my transaction statement.",
  "Kaam Card parses statement details locally to build your portable record. By continuing, you agree to:": "Kaam Card parses statement details locally to build your portable record. By continuing, you agree to:",
  "Local Parsing:": "Local Parsing:",
  "Data Minimization:": "Data Minimization:",
  "Zero ID Collection:": "Zero ID Collection:",
  "Executed strictly in-browser memory.": "Executed strictly in-browser memory.",
  "Raw lines are discarded after daily stats computation.": "Raw lines are discarded after daily stats computation.",
  "We never collect Aadhaar, PAN, or full bank numbers.": "We never collect Aadhaar, PAN, or full bank numbers.",
  "Your data stays in this browser session. We do not ask for Aadhaar, PAN, or bank account numbers.": "Your data stays in this browser session. We do not ask for Aadhaar, PAN, or bank account numbers.",
  "Use a CSV with date, amount, direction. Links inside files are treated as plain text.": "Use a CSV with date, amount, direction. Links inside files are treated as plain text.",
  "Tap to upload CSV": "Tap to upload CSV",
  "or drag and drop. CSV only, up to 5 MB.": "or drag and drop. CSV only, up to 5 MB.",
  "Basic details for matching": "Basic details for matching",
  "Age": "వయస్సు",
  "Occupation": "వృత్తి",
  "State": "రాష్ట్రం",
  "Sample datasets": "Sample datasets",
  "Choose Bank Statement Dataset": "Choose Bank Statement Dataset",
  "Continue to dashboard": "Continue to dashboard",
  "Welcome, Worker": "స్వాగతం, కార్మికుడు",
  "This dashboard tracks your calculated income averages and verifies matching state schemes.": "This dashboard tracks your calculated income averages and verifies matching state schemes.",
  "Daily earnings trend and variations": "రోజువారీ ఆదాయ ధోరణి మరియు వైవిధ్యాలు",
  "Daily Avg": "రోజువారీ సగటు",
  "Good Days": "మంచి రోజులు",
  "Bad Days": "చెడ్డ రోజులు",
  "Smart Suggestion": "స్మార్ట్ సూచన",
  "Arithmetic-based micro-savings rule": "గణిత ఆధారిత మైక్రో-పొదుపు నియమం",
  "Tied to your actual data, this habit will accumulate about": "Tied to your actual data, this habit will accumulate about",
  "low-income days.": "low-income days.",
  "on days earning above": "on days earning above",
  "Save Rs": "Save Rs",
  "and cover up to": "and cover up to",
  "Welfare Matching": "Welfare Matching",
  "Search matched schemes": "Search matched schemes",
  "Type scheme name...": "Type scheme name...",
  "Knowledge Resources": "Knowledge Resources",
  "Local Security Audit Trail": "Local Security Audit Trail",
  "Guide me & Apply": "Guide me & Apply",
  "Eligible public schemes": "Eligible public schemes",
  "matched": "matched",
  "low-income days": "low-income days",
  "total parsed credit": "total parsed credit",
  "Low-income threshold": "Low-income threshold",
  "Export your secure worker profile": "Export your secure worker profile",
  "Generate a portable summary of your checked parameters. No raw bank records are saved or shared.": "Generate a portable summary of your checked parameters. No raw bank records are saved or shared.",
  "Generate Profile": "Generate Profile",
  "Required documents check": "Required documents check",
  "Official Application Steps": "Official Application Steps",
  "Secure portal verification redirect": "Secure portal verification redirect",
  "Finish": "Finish",
  "Next Step": "Next Step",
  "Previous Step": "Previous Step",
  "Check Documents": "Check Documents",
  "Steps & Timeline": "Steps & Timeline",
  "Safe Redirect": "Safe Redirect",
  "Application Stepper Guide": "Application Stepper Guide",
  "No documents are uploaded or stored.": "No documents are uploaded or stored.",
  "Close": "మూసివేయి",
  "Verified Portal Redirect": "Verified Portal Redirect",
  "Guide": "గైడ్",
  "Docs": "డాక్స్",
  "Steps": "దశలు",
  "Apply": "దరఖాస్తు",
  "Back": "వెనుకకు",
  "Step 1: Check Required Documents": "Step 1: Check Required Documents",
  "Please check off that you have these documents ready before opening the application portal:": "Please check off that you have these documents ready before opening the application portal:",
  "Kaam Card never saves or asks for copy uploads of these documents. Keep them with you locally.": "Kaam Card never saves or asks for copy uploads of these documents. Keep them with you locally.",
  "Step 2: Step-by-Step Instructions": "Step 2: Step-by-Step Instructions",
  "Follow these steps on the official portal to complete your registration:": "Follow these steps on the official portal to complete your registration:",
  "Step 3: Access Official Portal": "Step 3: Access Official Portal",
  "You are now ready to visit the official website of the": "You are now ready to visit the official website of the",
  "Verified Official Portal": "Verified Official Portal",
  "Destination:": "Destination:",
  "Open official portal": "Open official portal",
  "Always confirm the URL ends in .gov.in or .nic.in before submitting any personal information.": "Always confirm the URL ends in .gov.in or .nic.in before submitting any personal information.",
  "Atal Pension Yojana": "Atal Pension Yojana",
  "Pension scheme for unorganized workers providing guaranteed minimum pension of Rs. 1,000 to Rs. 5,000 per month after age 60.": "Pension scheme for unorganized workers providing guaranteed minimum pension of Rs. 1,000 to Rs. 5,000 per month after age 60.",
  "e-Shram Registration": "e-Shram Registration",
  "National database for unorganized workers to facilitate social security benefits and direct benefit transfers.": "National database for unorganized workers to facilitate social security benefits and direct benefit transfers.",
  "Pradhan Mantri Shram Yogi Maan-dhan": "Pradhan Mantri Shram Yogi Maan-dhan",
  "Voluntary pension scheme for unorganized workers with monthly contribution matching by Central Government.": "Voluntary pension scheme for unorganized workers with monthly contribution matching by Central Government.",
  "Ayushman Bharat PM-JAY": "Ayushman Bharat PM-JAY",
  "Free health insurance coverage up to Rs. 5 Lakhs per family per year for secondary and tertiary care hospitalization.": "Free health insurance coverage up to Rs. 5 Lakhs per family per year for secondary and tertiary care hospitalization.",
  "PM SVANidhi Scheme": "PM SVANidhi Scheme",
  "Special micro-credit facility for street vendors to access affordable working capital loans for business revival.": "Special micro-credit facility for street vendors to access affordable working capital loans for business revival.",
  "Delivery Partner, Delhi": "Delivery Partner, Delhi",
  "Cab Driver, Mumbai": "Cab Driver, Mumbai",
  "Domestic Worker, Bangalore": "Domestic Worker, Bangalore",
  "Need help checking eligibility?": "Need help checking eligibility?",
  "We are dedicated to supporting digital portability for India's gig economy. If you have questions about the pilot or scheme integration, get in touch.": "We are dedicated to supporting digital portability for India's gig economy. If you have questions about the pilot or scheme integration, get in touch.",
  "Toll-free Helpdesk: 1800-11-0031 (Demo)": "Toll-free Helpdesk: 1800-11-0031 (Demo)",
  "Features": "Features",
  "Process": "Process",
  "Reviews": "Reviews",
  "Contact": "Contact",
  "Empowering Indian gig workers with portable data identity.": "Empowering Indian gig workers with portable data identity.",
  "Product": "Product",
  "Testimonials": "Testimonials",
  "Support": "Support",
  "Email": "Email",
  "Legal": "Legal",
  "Privacy": "Privacy",
  "Terms": "Terms",
  "or": "or",
  "Select Language": "భాషను ఎంచుకోండి",
  "English": "ఆంగ్లం",
  "Hindi": "హిందీ",
  "Country code": "Country code",
  "Back": "వెనుకకు",
  "OTP digits": "OTP digits",
  "OTP digit 1": "OTP digit 1",
  "OTP digit 2": "OTP digit 2",
  "OTP digit 3": "OTP digit 3",
  "OTP digit 4": "OTP digit 4",
  "OTP digit 5": "OTP digit 5",
  "OTP digit 6": "OTP digit 6",
  "Demo code:": "Demo code:",
  "Parse status": "Parse status",
  "Parsed income rows": "Parsed income rows",
  "No usable income rows yet": "No usable income rows yet",
  "Rows skipped safely": "Rows skipped safely",
  "We skipped malformed rows instead of crashing.": "We skipped malformed rows instead of crashing.",
  "Row": "Row",
  "Issue": "Issue",
  "Add at least one valid credit/income row to continue.": "Add at least one valid credit/income row to continue.",
  "Analyzed period:": "Analyzed period:",
  "Eligible public schemes (": "Eligible public schemes (",
  " matched)": " matched)",
  "No scheme matches found. Try adjusting search or details.": "No scheme matches found. Try adjusting search or details.",
  "Share Summary": "సారాంశాన్ని భాగస్వామ్యం చేయండి",
  "Share summary text": "సారాంశ టెక్స్ట్ షేర్ చేయండి",
  "Session code:": "Session code:",
  "Daily income bar chart": "Daily income bar chart",
  "Eligible": "అర్హత",
  "Welfare Knowledge & Security Logs": "Welfare Knowledge & Security Logs",
  "No actions logged yet.": "No actions logged yet.",
  "Shareable summary": "Shareable summary",
  "This is a simple text summary for the demo. No raw transactions are included.": "This is a simple text summary for the demo. No raw transactions are included.",
  "Copied": "కాపీ చేయబడింది",
  "Copy": "కాపీ",
  "Danger Zone": "Danger Zone",
  "This will completely clear your parsed income profile and reset the session.": "This will completely clear your parsed income profile and reset the session.",
  "Clear & Purge Session Data": "Clear & Purge Session Data",
  "Upload": "అప్‌లోడ్",
  "More": "మరిన్ని",
  "Main navigation": "Main navigation",
  "From phone to dashboard in under 2 minutes": "From phone to dashboard in under 2 minutes",
  "Kaam Card navigation": "Kaam Card navigation",
  "Language switched to": "Language switched to",
  "Are you sure you want to end your session and delete all parsed data? This cannot be undone.": "Are you sure you want to end your session and delete all parsed data? This cannot be undone.",
  "Something went wrong": "Something went wrong",
  "The app encountered an unexpected error. Please refresh the page to try again.": "The app encountered an unexpected error. Please refresh the page to try again.",
  "Refresh Page": "Refresh Page",
  "Kaam Card summary": "Kaam Card summary",
  "Phone session:": "Phone session:",
  "Average daily income:": "Average daily income:",
  "Good days:": "Good days:",
  "bad days:": "bad days:",
  "Saving rule: save": "Saving rule: save",
  "on days above": "on days above",
  "Likely schemes:": "Likely schemes:",
  "No exact match yet": "No exact match yet",
  "Demo note: eligibility is simplified and should be verified on the official portal.": "Demo note: eligibility is simplified and should be verified on the official portal.",
  "Income Profile": "ఆదాయ ప్రొఫైల్",
  "Daily Average": "రోజువారీ సగటు",
  "Monthly Estimate": "నెలవారీ అంచనా",
  "Low Days": "తక్కువ రోజులు",
  "Savings Recommendation": "పొదుపు సిఫార్సు",
  "Matched Welfare Schemes": "Matched Welfare Schemes",
  "Generated by Kaam Card | Eligibility is simplified, verify on official portals": "Generated by Kaam Card | Eligibility is simplified, verify on official portals",
  "Income": "Income",
  "Using Kaam Card took less than 2 minutes. It computed my average daily income and showed me I qualified for PM-SYM pension. I registered the same day!": "Using Kaam Card took less than 2 minutes. It computed my average daily income and showed me I qualified for PM-SYM pension. I registered the same day!",
  "I always wanted to save but didn't know how much. The good-day surplus savings suggestion helped me set aside money on busy weekends to cover dry weekdays.": "I always wanted to save but didn't know how much. The good-day surplus savings suggestion helped me set aside money on busy weekends to cover dry weekdays.",
  "I was worried about sharing bank logs, but Kaam Card's privacy focus is amazing. It runs on my browser and doesn't store my Aadhaar or transaction lists.": "I was worried about sharing bank logs, but Kaam Card's privacy focus is amazing. It runs on my browser and doesn't store my Aadhaar or transaction lists.",
  "© 2026 Kaam Card.": "© 2026 Kaam Card.",
  " of ": " of ",
  " to ": " to ",
  "/month": "/month",
  "You qualify because your ": "You qualify because your ",
  " and ": " and ",
  "Close match: ": "Close match: ",
  "some details match": "some details match",
  ", but ": ", but ",
  "age ": "age ",
  " is within ": " is within ",
  "age must be ": "age must be ",
  "estimated monthly income is below ": "estimated monthly income is below ",
  "no income cap holds": "no income cap holds",
  "income is above ": "income is above ",
  " is covered": " is covered",
  "occupation must match: ": "occupation must match: ",
  " state matches": " state matches",
  "state must be ": "state must be ",
  " or ": " or ",
  "Worker ": "Worker ",
  "Save ": "Save ",
  " on good days (above ": " on good days (above ",
  ")": ")",
  " | +91 ": " | +91 ",
  "-": "-",
  "CSV needs a header and at least one data row.": "CSV needs a header and at least one data row.",
  "Missing column: ": "Missing column: ",
  "Date is invalid. Use YYYY-MM-DD or DD-MM-YYYY.": "Date is invalid. Use YYYY-MM-DD or DD-MM-YYYY.",
  "Amount is invalid. Use a positive number.": "Amount is invalid. Use a positive number.",
  "Direction must be credit/income or debit/expense.": "Direction must be credit/income or debit/expense.",
  "Please upload a CSV file.": "Please upload a CSV file.",
  "Detected format:": "గుర్తించిన ఫార్మాట్:",
  "Expense Summary": "ఖర్చు సారాంశం",
  "Spending breakdown from your statement": "Spending breakdown from your statement",
  "Total Expenses": "మొత్తం ఖర్చులు",
  "Avg daily": "సగటు రోజువారీ",
  "Top Category": "టాప్ వర్గం",
  "Income Insights": "ఆదాయ అంతర్దృష్టులు",
  "Income Stability": "ఆదాయ స్థిరత్వం",
  "Stability score based on income variance": "ఆదాయ వ్యత్యాసం ఆధారంగా స్థిరత్వ స్కోరు",
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
  "File is larger than 5 MB.": "File is larger than 5 MB.",
  "Log Out": "లాగ్ అవుట్",
  "Generated by Kaam Card | Eligibility is simplified, verify on official portals": "Generated by Kaam Card | Eligibility is simplified, verify on official portals",
  "Kaam Card - ": "Kaam Card - ",
  "worker": "worker",
  "friend": "friend"
}



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
  return text;
}

function addAuditLog(message) {
  const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  state.auditLogs.unshift({ time, message });
}

const ICON_SPEAK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:16px;height:16px"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';

const ICON_SPEAK_MUTED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:16px;height:16px"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M23 9l-6 6"/><path d="M17 9l6 6"/></svg>';

function speakText(text, lang) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const langMap = { hi: "hi-IN", ta: "ta-IN", te: "te-IN" };
  utterance.lang = langMap[lang] || "en-IN";
  utterance.rate = 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function speakBtn(textKey, lang) {
  return `<button type="button" class="speak-btn" data-speak="${escapeHtml(textKey)}" aria-label="Listen" title="Listen">${ICON_SPEAK}</button>`;
}

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
  const goodDays = dailySeries.filter((day) => day.amount >= goodThreshold && day.amount > 0);
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
  "Mobile & Bills": ["recharge", "airtel", "jio", "vi", "vodafone", "idea", "broadband", "wifi", "electricity", "bill", "bsnl", "dth", "postpaid", "prepaid"],
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
      color: scheme.color || "blue"
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
    color: scheme.color || "blue"
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
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
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

function renderLangToggle() {
  const current = state.lang;
  return `
    <div class="lang-switcher" role="radiogroup" aria-label="${t("Select Language")}">
      <button class="lang-btn ${current === 'en' ? 'is-active' : ''}" data-lang="en" type="button" aria-label="${t("English")}">EN</button>
      <button class="lang-btn ${current === 'hi' ? 'is-active' : ''}" data-lang="hi" type="button" aria-label="${t("Hindi")}">हिं</button>
      <button class="lang-btn ${current === 'ta' ? 'is-active' : ''}" data-lang="ta" type="button" aria-label="${t("Tamil")}">த</button>
      <button class="lang-btn ${current === 'te' ? 'is-active' : ''}" data-lang="te" type="button" aria-label="${t("Telugu")}">తె</button>
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
        addAuditLog(`${t("Language switched to")} ${newLang === 'hi' ? t("Hindi") : t("English")}`);
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
    processCsv(SAMPLE_DATASETS[0].csv, SAMPLE_DATASETS[0]);
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

      <p class="copy">${t("Use a CSV with date, amount, direction. Links inside files are treated as plain text.")}</p>
      <label class="upload-zone ${isConsentChecked ? "" : "is-disabled"}" id="drop-zone">
        <input id="csv-file" type="file" accept=".csv,text/csv" ${isConsentChecked ? "" : "disabled"}>
        <span>${ICONS.upload}<strong>${t("Tap to upload CSV")}</strong><small>${t("or drag and drop. CSV only, up to 5 MB.")}</small></span>
      </label>
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
      <section class="panel" aria-labelledby="samples-title">
        <h2 id="samples-title">${t("Sample datasets")}</h2>
        <div class="samples-grid">
          ${SAMPLE_DATASETS.map((sample) => `
            <button class="sample-btn" type="button" data-sample="${escapeHtml(sample.id)}" ${isConsentChecked ? "" : "disabled"}>${ICONS.file}<span>${escapeHtml(t(sample.name))}</span></button>
          `).join("")}
        </div>
      </section>
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

  const consentCheck = document.querySelector("#consent-check");
  if (consentCheck) {
    consentCheck.addEventListener("change", (event) => {
      state.consentGiven = event.target.checked;
      addAuditLog(state.consentGiven ? "Consent authorized: user agreed to browser-local transaction processing." : "Consent revoked.");
      const fileInput = document.querySelector("#csv-file");
      if (fileInput) fileInput.disabled = !state.consentGiven;
      const dropZone = document.querySelector("#drop-zone");
      if (dropZone) {
        if (state.consentGiven) {
          dropZone.classList.remove("is-disabled");
        } else {
          dropZone.classList.add("is-disabled");
        }
      }
      document.querySelectorAll("[data-sample]").forEach((btn) => {
        btn.disabled = !state.consentGiven;
      });
      saveSession();
    });
  }

  document.querySelectorAll("[data-sample]").forEach((button) => {
    button.addEventListener("click", () => {
      const sample = SAMPLE_DATASETS.find((item) => item.id === button.dataset.sample);
      addAuditLog(`Loaded sample dataset: ${sample.name}`);
      processCsv(sample.csv, sample);
      state.route = "upload";
      render();
    });
  });

  const fileInput = document.querySelector("#csv-file");
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) {
      addAuditLog(`Selected statement file: ${file.name}`);
      readCsvFile(file);
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
      readCsvFile(file);
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
      <td>${escapeHtml(t(error.issue))}</td>
    </tr>
  `).join("");

  const formatLabels = { generic: "Generic CSV", gpay: "Google Pay", phonepe: "PhonePe", paytm: "PayTM" };

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
      </div>

      ${renderBottomNav("Insights")}
    </section>
  `;

  renderShell(insightContent, "Insights", "wide");
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
  const expenseCard = expenseProfile ? `
    <article class="google-card card-expense">
      <div class="google-card-header">
        ${ICONS.wallet}
        <span>${t("Expense Summary")}</span>
      </div>
      <h3 class="google-card-title">${t("Spending breakdown from your statement")}</h3>
      <div class="google-card-body">
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
      </div>
    </article>
  ` : "";

  // Card 4: Welfare Schemes
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
        ${schemesCard}
        ${summaryCard}
      </div>
    `;
  }

  const activeScheme = state.guidanceSchemeId ? (state.schemesDb.find(s => s.id === state.guidanceSchemeId) || FALLBACK_SCHEMES.find(s => s.id === state.guidanceSchemeId)) : null;

  const dashboardContent = `
    <section class="dashboard-assistant-view">
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

  const schemeSpeakText = `${match.name}. ${match.benefit || match.description}. ${reason}`;

  return `
    <article class="scheme-card">
      <div class="scheme-card__top">
        <span class="scheme-icon ${match.color || "blue"}">${ICONS[match.icon || "file"]}</span>
        <div>
          <h3>${escapeHtml(match.name)} ${speakBtn(schemeSpeakText, state.lang)}</h3>
          <p>${escapeHtml(match.benefit || match.description)}</p>
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
    } else if (action === "purge") {
      purgeSession();
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
    `${t("Likely schemes:")} ${eligible.map((item) => item.shortName).join(", ") || t("No exact match yet")}`,
    t("Demo note: eligibility is simplified and should be verified on the official portal.")
  ].join("\n");
}

function renderShareModal() {
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <section class="share-card">
        <h2 id="share-title">${t("Shareable summary")}</h2>
        <p class="copy">${t("This is a simple text summary for the demo. No raw transactions are included.")}</p>
        <textarea class="share-text" readonly>${escapeHtml(shareSummaryText())}</textarea>
        <div class="share-actions">
          <button class="secondary-btn" type="button" data-close-share>${t("Close")}</button>
          <button class="secondary-btn" type="button" data-export-card>${ICONS.file} ${t("Export Card")}</button>
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
        ${eligible.map((s) => `<li class="scheme-item"><span class="scheme-dot"></span><strong>${escapeHtml(s.shortName)}</strong> &mdash; ${escapeHtml(s.benefit || s.description || "")}</li>`).join("")}
      </ul>
    </div>` : ""}
  </div>
  <div class="card-footer">
    ${t("Generated by Kaam Card | Eligibility is simplified, verify on official portals")}
  </div>
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
        <div class="section-blob blob-2"></div>
        <h2 id="benefits-title" class="section-title">${t("What We Do")}</h2>
        <p class="section-subtitle">${t("We help gig workers accumulate data value that is normally locked away in siloed apps.")}</p>
        <div class="benefits-grid">
          <div class="benefit-item displace-card">
            <div class="benefit-icon green">${ICONS.bars}</div>
            <h3>${t("Income Analytics")}</h3>
            <p>${t("Understand your earnings variance, good days vs bad days, and average monthly income instantly.")}</p>
          </div>
          <div class="benefit-item displace-card">
            <div class="benefit-icon blue">${ICONS.schemes}</div>
            <h3>${t("Scheme Matching")}</h3>
            <p>${t("Automatically match your computed income against real criteria for e-Shram, PM-SYM, PM-JAY, and more.")}</p>
          </div>
          <div class="benefit-item displace-card">
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
          <div class="stat-card">
            <div class="stat-value green">${t("2 min")}</div>
            <div class="stat-label">${t("Average setup time")}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value saffron">100%</div>
            <div class="stat-label">${t("Private: No Aadhaar stored")}</div>
          </div>
          <div class="stat-card">
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
          <div class="step-nom">
            <div class="step-nom__num">1</div>
            <div class="step-nom__body">
              <h3>${t("Secure OTP Login")}</h3>
              <p>${t("Enter your phone number to start a secure, isolated sandbox session. No passwords required.")}</p>
            </div>
          </div>
          <div class="step-nom">
            <div class="step-nom__num">2</div>
            <div class="step-nom__body">
              <h3>${t("Upload Statements")}</h3>
              <p>${t("Drop a bank statement or UPI statement CSV. We parse it locally in your browser and discard raw transaction details.")}</p>
            </div>
          </div>
          <div class="step-nom">
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
          <blockquote>
            <p class="quote">"${t("Using Kaam Card took less than 2 minutes. It computed my average daily income and showed me I qualified for PM-SYM pension. I registered the same day!")}"</p>
            <cite>
              <strong>Rajesh Kumar</strong>
              <span>${t("Delivery Partner, Delhi")}</span>
            </cite>
          </blockquote>
          <blockquote>
            <p class="quote">"${t("I always wanted to save but didn't know how much. The good-day surplus savings suggestion helped me set aside money on busy weekends to cover dry weekdays.")}"</p>
            <cite>
              <strong>Amit Mishra</strong>
              <span>${t("Cab Driver, Mumbai")}</span>
            </cite>
          </blockquote>
          <blockquote>
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

function logout() {
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
  } else {
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
            <span>${t("Apply")}</span>
          </div>
        </div>
        
        <div class="guidance-modal-body">
          ${stepContent}
        </div>
        
        <footer class="guidance-modal-footer">
          <button class="secondary-btn" type="button" data-prev-step ${step === 1 ? "disabled" : ""}>${t("Back")}</button>
          ${step < 3 ? `
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
    if (state.guidanceStep < 3) {
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
      render();
      return;
    } catch {
      API.setToken(null);
    }
  }
  if (loadSession()) {
    state.route = state.profile ? "dashboard" : "upload";
  }
  render();
});
