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
  theme: getInitialTheme(),
  lang: "en",
  details: {
    age: 29,
    occupation: "Delivery worker",
    state: "Delhi"
  },
  parseResult: null,
  profile: null,
  matches: [],
  shareOpen: false,
  copied: false,
  consentGiven: false,
  auditLogs: [],
  schemeQuery: "",
  guidanceSchemeId: null,
  guidanceStep: 1,
  schemesDb: []
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
  "For you": "आपके लिए",
  "SECURE SANDBOX": "सुरक्षित सैंडबॉक्स",
  "LOG IN / START": "लॉग इन / शुरू करें",
  "Create Your Kaam Card": "अपना काम कार्ड बनाएं",
  "How it Works": "यह कैसे काम करता है",
  "100% Private: No Aadhaar or PAN stored": "100% निजी: आधार या पैन संग्रहीत नहीं",
  "Safe: In-memory processing": "सुरक्षित: केवल मेमोरी में प्रोसेसिंग",

  // Landing page
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
  "OTP simulated for demo": "डेमो के लिए ओटीपी सिम्युलेट किया गया",
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
  "Special micro-credit facility for street vendors to access affordable working capital loans for business revival.": "व्यवसाय पुनरुद्धार के लिए किफायती कार्यशील पूंजी ऋण तक पहुंच बनाने के लिए स्ट्रीट वेंडरों के लिए विशेष सूक्ष्म-ऋण सुविधा।"
};

function t(text) {
  if (state.lang === "hi") {
    const trimmed = String(text || "").trim();
    if (TRANSLATIONS[trimmed]) {
      return TRANSLATIONS[trimmed];
    }
  }
  return text;
}

function addAuditLog(message) {
  const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  state.auditLogs.unshift({ time, message });
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

function schemeScore(scheme, details, profile) {
  const reasons = [];
  const misses = [];
  const age = Number(details.age);
  const occupation = normalizeOccupation(details.occupation);
  const monthlyIncome = profile.monthlyIncomeEstimate;
  const stateName = details.state;

  const minAge = scheme.eligibility ? scheme.eligibility.minAge : scheme.minAge;
  const maxAge = scheme.eligibility ? scheme.eligibility.maxAge : scheme.maxAge;
  const maxIncome = scheme.eligibility ? scheme.eligibility.maxIncome : scheme.maxMonthlyIncome;
  const occupations = scheme.eligibility ? scheme.eligibility.occupations : scheme.occupations;
  const states = scheme.eligibility ? scheme.eligibility.states : scheme.states;

  if (age >= minAge && age <= maxAge) {
    reasons.push(`age ${age} is within ${minAge}-${maxAge}`);
  } else {
    misses.push(`age must be ${minAge}-${maxAge}`);
  }

  if (maxIncome === null || maxIncome === undefined || monthlyIncome <= maxIncome) {
    if (maxIncome) {
      reasons.push(`estimated monthly income is below ${formatMoney(maxIncome)}`);
    } else {
      reasons.push(`no income cap holds`);
    }
  } else {
    misses.push(`income is above ${formatMoney(maxIncome)}`);
  }

  if (!occupations || occupations.length === 0 || occupations.includes(occupation)) {
    reasons.push(`${occupation.toLowerCase()} is covered`);
  } else {
    misses.push(`occupation must match: ${occupations.join(", ")}`);
  }

  if (!states || states.length === 0 || states.includes(stateName)) {
    if (states && states.length > 0) reasons.push(`${stateName} state matches`);
  } else {
    misses.push(`state must be ${states.join(" or ")}`);
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
  // SIMPLIFIED: this hackathon matcher uses transparent arithmetic rules only.
  const schemesList = state.schemesDb && state.schemesDb.length > 0 ? state.schemesDb : FALLBACK_SCHEMES;
  return schemesList.map((scheme) => schemeScore(scheme, details, profile))
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
    addAuditLog(`Income profile computed successfully.`);
    addAuditLog(`Statement parsed: ${state.parseResult.validRows} valid rows, ${state.parseResult.errors.length} skipped.`);
  } else {
    state.matches = [];
    addAuditLog(`Failed to compute income profile: no valid transactions.`);
  }
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
  const isLanding = state.route === "landing";
  const hasSession = !!state.session;
  app.innerHTML = `
    <div class="app-shell ${isLanding ? "landing-shell" : ""} ${hasSession ? "has-sidebar" : ""}">
      <div class="interactive-grid-pattern" aria-hidden="true"></div>
      
      <!-- Left Sidebar (Desktop sidebar) -->
      <aside class="side-rail" aria-label="Kaam Card navigation">
        <div class="side-rail__head">
          <div class="brand" data-go-home style="cursor: pointer">${brandMark()}<span>${t("Kaam Card")}</span></div>
          ${renderThemeToggle("rail")}
        </div>
        
        <nav class="rail-nav">
          <div class="nav-section-label" style="padding: 10px 12px 4px; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--muted); letter-spacing: 0.05em;">${t("General")}</div>
          ${navButton("Dashboard", ICONS.home, active === "Dashboard")}
          ${navButton("Connect Data", ICONS.upload, active === "Transactions")}
          
          <div class="nav-section-label" style="padding: 10px 12px 4px; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--muted); letter-spacing: 0.05em; margin-top: 10px;">${t("Insights")}</div>
          ${navButton("Income Analytics", ICONS.bars, active === "Insights")}
          ${navButton("Welfare Schemes", ICONS.schemes, active === "Schemes")}
        </nav>
        
        <div class="rail-foot">
          <div class="sidebar-promo-card" style="position: relative; padding: 14px; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--surface); margin-top: 15px;">
            <span class="promo-close" data-close-promo style="position: absolute; top: 6px; right: 10px; font-size: 1rem; font-weight: 800; cursor: pointer; color: var(--muted);">×</span>
            <div class="promo-icon" style="margin-bottom: 8px; color: var(--green);">${ICONS.shield}</div>
            <h4 style="margin: 0 0 4px 0; font-size: 0.88rem; font-weight: 800;">Secure & Private</h4>
            <p class="copy" style="font-size: 0.76rem; line-height: 1.35;">Parsed locally. Zero network leaks.</p>
          </div>
          ${hasSession ? `<button class="purge-session-btn" type="button" data-purge-session style="margin-top: 12px; width: 100%">${ICONS.alert} Purge Session Data</button>` : ""}
        </div>
      </aside>
      
      <!-- Main Content -->
      <main class="main-wrap">
        <div class="phone-stage ${layout === "wide" ? "is-wide" : ""}">
          <div class="phone-card">${content}</div>
        </div>
      </main>
      
      <!-- Right Sidebar -->
      ${hasSession && !isLanding ? renderRightSidebar() : ""}
    </div>
  `;
  bindShellNav();
  bindThemeToggle();
  if (hasSession) {
    bindPurgeSession();
    bindRightSidebarEvents();
  }
  bindGoHome();
  bindPromoClose();
}

function brandMark() {
  return `<div class="brand-logo-glass" aria-hidden="true"></div>`;
}

function navButton(label, icon, active) {
  return `<button type="button" class="${active ? "is-active" : ""}" data-nav="${escapeHtml(label)}">${icon}<span>${escapeHtml(t(label))}</span></button>`;
}

function renderLangToggle() {
  const isHi = state.lang === "hi";
  return `
    <div class="lang-switcher" role="radiogroup" aria-label="Select Language">
      <button class="lang-btn ${!isHi ? 'is-active' : ''}" data-lang="en" type="button" aria-label="English">EN</button>
      <button class="lang-btn ${isHi ? 'is-active' : ''}" data-lang="hi" type="button" aria-label="Hindi">हिं</button>
    </div>
  `;
}

function renderThemeToggle(variant = "") {
  const isDark = state.theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";
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
        addAuditLog(`Language switched to ${newLang === 'hi' ? 'Hindi (हिन्दी)' : 'English'}`);
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
        <div class="brand" data-go-home style="cursor: pointer">${brandMark()}<span>${t("Kaam Card")}</span></div>
        ${renderThemeToggle("compact")}
      </div>
      <h1 class="screen-title" id="login-title">${t("Log In & Access Portal")}</h1>
      <p class="copy">${t("Start with your mobile number. This demo keeps the session in memory only.")}</p>
      <form class="auth-form" id="phone-form">
        <label class="field-label" for="phone">${t("Mobile number")}</label>
        <div class="phone-input-row">
          <select aria-label="Country code">
            <option>+91</option>
          </select>
          <input id="phone" name="phone" inputmode="tel" autocomplete="tel" placeholder="${t("Enter mobile number")}" value="${escapeHtml(state.phoneDraft)}">
        </div>
        <button class="primary-btn" type="submit">${t("Send secure OTP link")}</button>
        <div class="divider">or</div>
        <button class="secondary-btn" type="button" data-skip-demo>${ICONS.upload} ${t("Continue with sample data")}</button>
      </form>
      <div class="privacy-line">${ICONS.shield}<span>${t("Your data stays in this browser session. We do not ask for Aadhaar, PAN, or bank account numbers.")}</span></div>
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
    state.auditLogs = [];
    addAuditLog(`Demo session started.`);
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
        <h1 id="otp-title">${t("OTP Verification")}</h1>
        ${renderThemeToggle("compact")}
      </div>
      <div class="panel" style="text-align:center">
        <p class="copy" style="color:var(--blue); font-weight:760">${t("OTP simulated for demo")}</p>
        <p class="copy" style="margin-top:10px">${t("We sent an OTP to")}<br><strong style="color:var(--ink)">+91 ${escapeHtml(state.phoneDraft)}</strong></p>
        <form id="otp-form">
          <div class="otp-grid" aria-label="OTP digits">
            <input class="otp-input" inputmode="numeric" maxlength="1" aria-label="OTP digit 1">
            <input class="otp-input" inputmode="numeric" maxlength="1" aria-label="OTP digit 2">
            <input class="otp-input" inputmode="numeric" maxlength="1" aria-label="OTP digit 3">
            <input class="otp-input" inputmode="numeric" maxlength="1" aria-label="OTP digit 4">
          </div>
          <p class="copy">${t("Any 4 digits will work in this prototype.")}</p>
          <button class="primary-btn" type="submit">${t("Verify and continue")}</button>
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
    state.auditLogs = [];
    addAuditLog(`Secure session started for +91 ******${state.phoneDraft.slice(-4)}`);
    state.route = "upload";
    render();
  });
}

function renderUpload() {
  const isConsentChecked = state.consentGiven;
  renderShell(`
    <section class="screen" aria-labelledby="upload-title">
      <div class="step-header">
        <button class="icon-btn" type="button" data-back aria-label="Back">${ICONS.back}</button>
        <h1 id="upload-title">${t("Connect Data")}</h1>
        ${renderThemeToggle("compact")}
      </div>
      
      <!-- Consent Gate Section -->
      <section class="panel consent-panel" aria-labelledby="consent-title" style="margin-bottom: 16px;">
        <h2 id="consent-title" style="display: flex; align-items: center; gap: 8px; margin: 0 0 8px 0; font-size: 0.98rem;">
          ${ICONS.shield} <span>${t("Consent & Authorization")}</span>
        </h2>
        <div class="consent-box-container">
          <p class="copy" style="font-size: 0.84rem; margin-bottom: 10px;">
            ${state.lang === "hi" ?
              `काम कार्ड आपका सुरक्षित रिकॉर्ड बनाने के लिए स्टेटमेंट को स्थानीय रूप से पार्स करता है। आगे बढ़ने से आप निम्न पर सहमत हैं:` :
              `Kaam Card parses statement details locally to build your portable record. By continuing, you agree to:`
            }
          </p>
          <ul class="consent-list" style="margin: 0 0 12px 0; padding-left: 18px; font-size: 0.78rem; color: var(--muted); line-height: 1.4;">
            <li><strong>${state.lang === "hi" ? "स्थानीय पार्सिंग:" : "Local Parsing:"}</strong> ${state.lang === "hi" ? "केवल ब्राउज़र मेमोरी में निष्पादित।" : "Executed strictly in-browser memory."}</li>
            <li><strong>${state.lang === "hi" ? "डेटा न्यूनीकरण:" : "Data Minimization:"}</strong> ${state.lang === "hi" ? "दैनिक गणना के बाद कच्चा डेटा हटा दिया जाता है।" : "Raw lines are discarded after daily stats computation."}</li>
            <li><strong>${state.lang === "hi" ? "कोई आईडी संग्रह नहीं:" : "Zero ID Collection:"}</strong> ${state.lang === "hi" ? "हम कभी भी आधार, पैन या बैंक नंबर एकत्र नहीं करते हैं।" : "We never collect Aadhaar, PAN, or full bank numbers."}</li>
          </ul>
          <label class="consent-checkbox-label" style="display: flex; align-items: flex-start; gap: 8px; cursor: pointer; font-size: 0.84rem; font-weight: 700; color: var(--ink);">
            <input type="checkbox" id="consent-check" ${isConsentChecked ? "checked" : ""} style="margin-top: 2px;">
            <span>${t("I authorize Kaam Card to parse my transaction statement.")}</span>
          </label>
        </div>
      </section>

      <p class="copy">${state.lang === "hi" ? "यूपीआई लेनदेन विवरण (date, amount, direction) वाली फ़ाइल चुनें।" : "Use a CSV with date, amount, direction. Links inside files are treated as plain text."}</p>
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

  // Card 1: Income Analytics
  const incomeAnalyticsCard = `
    <article class="google-card card-analytics">
      <div class="google-card-header">
        ${ICONS.bars}
        <span>Income Analytics</span>
      </div>
      <h3 class="google-card-title">Daily earnings trend and variations</h3>
      <div class="google-card-body">
        ${renderIncomeChart(profile)}
      </div>
      <div class="google-card-footer">
        <span>Analyzed period: ${dateLabel(profile.start)} to ${dateLabel(profile.end)}</span>
      </div>
    </article>
  `;

  // Card 2: Savings recommendation
  const savingsCard = `
    <article class="google-card card-savings">
      <div class="google-card-header">
        ${ICONS.wallet}
        <span>Smart Suggestion</span>
      </div>
      <h3 class="google-card-title">Arithmetic-based micro-savings rule</h3>
      <div class="google-card-body">
        <div class="savings-highlight">
          <strong>Save ${formatMoney(profile.savings.savePerGoodDay)}</strong>
          <span>on days earning above ${formatMoney(profile.goodThreshold)}</span>
        </div>
        <p class="copy" style="font-size: 0.9rem; margin-top: 10px;">
          Tied to your actual data, this habit will accumulate about <strong>${formatMoney(profile.savings.monthlySaving)}/month</strong> and cover up to <strong>${profile.savings.coveredLowDays}</strong> low-income days.
        </p>
      </div>
      <div class="google-card-footer">
        <span>Low-income threshold: ${formatMoney(profile.badThreshold)}</span>
      </div>
    </article>
  `;

  // Card 3: Welfare Schemes
  const schemesCard = `
    <article class="google-card card-schemes">
      <div class="google-card-header">
        ${ICONS.schemes}
        <span>Welfare Matching</span>
      </div>
      <h3 class="google-card-title">Eligible public schemes (${eligible.length} matched)</h3>
      <div class="google-card-body">
        <div class="scheme-list scheme-list--compact">
          ${shownSchemes.length ? shownSchemes.map(renderSchemeCard).join("") : `<div class="empty-state">No scheme matches found. Try adjusting search or details.</div>`}
        </div>
      </div>
    </article>
  `;

  // Card 4: Portable Summary Export
  const summaryCard = `
    <article class="google-card card-summary">
      <div class="google-card-header">
        ${ICONS.share}
        <span>Share Summary</span>
      </div>
      <h3 class="google-card-title">Export your secure worker profile</h3>
      <div class="google-card-body">
        <p class="copy" style="font-size: 0.88rem; margin-bottom: 12px;">
          Generate a portable summary of your checked parameters. No raw bank records are saved or shared.
        </p>
        <button class="primary-btn share-btn-google" type="button" data-share>${ICONS.share} Share summary text</button>
      </div>
      <div class="google-card-footer">
        <span>Session code: +91 ${state.session.phone.slice(-4)}</span>
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
        <strong>${formatMoney(profile.totalIncome)}</strong><span>total parsed credit</span>
      </div>
      <div class="bar-chart" style="grid-template-columns: repeat(${profile.dailySeries.length}, 1fr); gap: 4px;" role="img" aria-label="Daily income bar chart">${bars}</div>
      <div class="bar-labels"><span>${dateLabel(profile.start)}</span><span>${dateLabel(profile.end)}</span></div>
      <div class="stats-grid-google">
        <div class="stat-item-google">
          <span>Daily Avg</span>
          <strong>${formatMoney(profile.averageDaily)}</strong>
        </div>
        <div class="stat-item-google">
          <span>Good Days</span>
          <strong style="color: var(--green);">${profile.goodDays}</strong>
        </div>
        <div class="stat-item-google">
          <span>Bad Days</span>
          <strong style="color: var(--saffron);">${profile.badDays}</strong>
        </div>
      </div>
    </div>
  `;
}

function renderSchemeCard(match) {
  const url = getAllowedUrl(match);
  const reason = match.eligible
    ? `You qualify because your ${match.reasons.slice(0, 2).join(" and ")}.`
    : `Close match: ${match.reasons[0] || "some details match"}, but ${match.misses[0]}.`;

  const minAge = match.eligibility ? match.eligibility.minAge : match.minAge;
  const maxAge = match.eligibility ? match.eligibility.maxAge : match.maxAge;
  const maxIncome = match.eligibility ? match.eligibility.maxIncome : match.maxMonthlyIncome;

  return `
    <article class="scheme-card">
      <div class="scheme-card__top">
        <span class="scheme-icon ${match.color || "blue"}">${ICONS[match.icon || "file"]}</span>
        <div>
          <h3>${escapeHtml(match.name)}</h3>
          <p>${escapeHtml(match.benefit || match.description)}</p>
        </div>
      </div>
      <p>${escapeHtml(reason)}</p>
      <div class="scheme-meta">
        <span class="tag">${match.eligible ? "Eligible" : `${match.passed}/${match.required} matched`}</span>
        <span class="tag">Age ${minAge}-${maxAge}</span>
        ${maxIncome ? `<span class="tag">Income <= ${formatMoney(maxIncome)}</span>` : ""}
      </div>
      ${url ? `
        <div class="destination-secure">
          <div class="secure-badge">
            ${ICONS.shield}
            <span>Verified Official Portal</span>
          </div>
          <p class="destination-domain">Destination: <strong>${escapeHtml(url.hostname)}</strong></p>
          <button class="secure-link-btn" type="button" data-guide-scheme="${match.id}">
            <span>Guide me & Apply</span>
            ${ICONS.external}
          </button>
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
        <div class="danger-zone" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--line);">
          <h3 style="font-size: 0.95rem; margin: 0 0 8px; color: var(--red);">Danger Zone</h3>
          <p class="copy" style="font-size: 0.8rem; margin-bottom: 10px;">This will completely clear your parsed income profile and reset the session.</p>
          <button class="purge-session-btn danger" type="button" data-purge-session style="width: 100%">${ICONS.alert} Clear & Purge Session Data</button>
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

  bindPurgeSession();
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

function renderLanding() {
  const content = `
    <div class="landing-page">
      <!-- Header -->
      <header class="landing-header">
        <div class="brand" data-go-home style="cursor: pointer">${brandMark()}<span>${t("Kaam Card")}</span></div>
        <div class="landing-header__actions">
          ${renderThemeToggle("compact")}
          <button class="primary-btn landing-login-btn" type="button" data-login-cta>${t("LOG IN / START")}</button>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="landing-hero" aria-labelledby="hero-title">
        <div class="landing-hero__content">
          <h1 id="hero-title" class="hero-main-title">
            ${state.lang === "hi"
              ? `२ मिनट में <span class="text-gradient">प्लेटफ़ॉर्म कमाई</span> से <span class="text-gradient">कल्याणकारी योजनाओं</span> तक जाएँ।`
              : `Go from <span class="text-gradient">Platform Earnings</span> to <span class="text-gradient">Welfare Benefits</span> in 2 Minutes.`}
          </h1>
          <p class="hero-subtitle">
            ${state.lang === "hi"
              ? `काम कार्ड असंगठित और गिग श्रमिकों के लिए एक सुरक्षित रिकॉर्ड है। आसानी से अपने यूपीआई स्टेटमेंट को सत्यापित आय प्रोफ़ाइल में बदलें, योजनाओं की जांच करें और बचत करें।`
              : `Kaam Card is a portable, secure record for informal and gig workers. Easily turn your UPI statement into a verified income profile, check eligibility for government schemes, and build micro-savings suggestions.`}
          </p>
          <div class="hero-ctas">
            <button class="primary-btn hero-cta-btn" type="button" data-login-cta>${t("Create Your Kaam Card")}</button>
            <a href="#how-it-works" class="secondary-btn hero-sec-btn">${t("How it Works")}</a>
          </div>
          <div class="hero-trust">
            <span class="trust-badge">${ICONS.shield} ${t("100% Private: No Aadhaar or PAN stored")}</span>
            <span class="trust-badge">${ICONS.check} ${t("Safe: In-memory processing")}</span>
          </div>
        </div>
        <div class="landing-hero__preview">
          <div class="preview-card">
            <div class="preview-header">
              <span class="preview-dot"></span>
              <span class="preview-dot"></span>
              <span class="preview-dot"></span>
              <span class="preview-title">Income Summary Mockup</span>
            </div>
            <div class="preview-body">
              <div class="mock-stat">
                <span>Average Daily Income</span>
                <strong>Rs 780/day</strong>
              </div>
              <div class="mock-chart">
                <span class="mock-bar" style="height: 60%"></span>
                <span class="mock-bar" style="height: 80%"></span>
                <span class="mock-bar" style="height: 40%"></span>
                <span class="mock-bar" style="height: 95%"></span>
                <span class="mock-bar" style="height: 70%"></span>
              </div>
              <div class="mock-scheme">
                <span class="scheme-badge saffron">Eligible</span>
                <strong>PM Shram Yogi Maandhan</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Key Benefits / Value Proposition Section -->
      <section class="landing-benefits" id="benefits" aria-labelledby="benefits-title">
        <h2 id="benefits-title" class="section-title">${t("Why Kaam Card?")}</h2>
        <p class="section-subtitle">${t("We help gig workers accumulate data value that is normally locked away in siloed apps.")}</p>
        <div class="benefits-grid">
          <div class="benefit-item">
            <div class="benefit-icon green">${ICONS.bars}</div>
            <h3>${t("Income Analytics")}</h3>
            <p>${t("Understand your earnings variance, good days vs bad days, and average monthly income instantly.")}</p>
          </div>
          <div class="benefit-item">
            <div class="benefit-icon blue">${ICONS.schemes}</div>
            <h3>${t("Scheme Matching")}</h3>
            <p>${t("Automatically match your computed income against real criteria for e-Shram, PM-SYM, PM-JAY, and more.")}</p>
          </div>
          <div class="benefit-item">
            <div class="benefit-icon saffron">${ICONS.wallet}</div>
            <h3>${t("Smart Micro-Savings")}</h3>
            <p>${t("Get a mathematically grounded savings rule based on your actual income surplus on high-earning days.")}</p>
          </div>
        </div>
      </section>

      <!-- How it Works Section -->
      <section class="landing-steps" id="how-it-works" aria-labelledby="steps-title">
        <h2 id="steps-title" class="section-title">${t("Three Simple Steps")}</h2>
        <div class="steps-grid">
          <div class="step-card-ui">
            <div class="step-num">1</div>
            <h3>${t("Secure OTP Login")}</h3>
            <p>${t("Enter your phone number to start a secure, isolated sandbox session. No passwords required.")}</p>
          </div>
          <div class="step-card-ui">
            <div class="step-num">2</div>
            <h3>${t("Upload Statements")}</h3>
            <p>${t("Drop a bank statement or UPI statement CSV. We parse it locally in your browser and discard raw transaction details.")}</p>
          </div>
          <div class="step-card-ui">
            <div class="step-num">3</div>
            <h3>${t("Get Kaam Dashboard")}</h3>
            <p>${t("Instantly check eligible schemes, review savings recommendations, and export your portable worker card.")}</p>
          </div>
        </div>
      </section>

      <!-- Social Proof / Testimonials Section -->
      <section class="landing-social" id="testimonials" aria-labelledby="social-title">
        <h2 id="social-title" class="section-title">${t("Loved by Workers")}</h2>
        <p class="section-subtitle">${t("Hear from informal partners who verified their scheme eligibility using Kaam Card.")}</p>
        <div class="testimonials-grid">
          <blockquote>
            <p class="quote">"Using Kaam Card took less than 2 minutes. It computed my average daily income and showed me I qualified for PM-SYM pension. I registered the same day!"</p>
            <cite>
              <strong>Rajesh Kumar</strong>
              <span>${state.lang === "hi" ? "डिलीवरी पार्टनर, दिल्ली" : "Delivery Partner, Delhi"}</span>
            </cite>
          </blockquote>
          <blockquote>
            <p class="quote">"I always wanted to save but didn't know how much. The good-day surplus savings suggestion helped me set aside money on busy weekends to cover dry weekdays."</p>
            <cite>
              <strong>Amit Mishra</strong>
              <span>${state.lang === "hi" ? "कैब ड्राइवर, मुंबई" : "Cab Driver, Mumbai"}</span>
            </cite>
          </blockquote>
          <blockquote>
            <p class="quote">"I was worried about sharing bank logs, but Kaam Card's privacy focus is amazing. It runs on my browser and doesn't store my Aadhaar or transaction lists."</p>
            <cite>
              <strong>Sunita Devi</strong>
              <span>${state.lang === "hi" ? "घरेलू कार्यकर्ता, बेंगलुरु" : "Domestic Worker, Bangalore"}</span>
            </cite>
          </blockquote>
        </div>
      </section>

      <!-- Contact / Support Section -->
      <section class="landing-contact" id="contact" aria-labelledby="contact-title">
        <div class="contact-box">
          <h2 id="contact-title">Need help checking eligibility?</h2>
          <p>We are dedicated to supporting digital portability for India's gig economy. If you have questions about the pilot or scheme integration, get in touch.</p>
          <div class="contact-methods">
            <div class="contact-method">${ICONS.shield} <span>support@kaamcard.nic.in</span></div>
            <div class="contact-method">${ICONS.rupee} <span>Toll-free Helpdesk: 1800-XXX-XXXX</span></div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="footer-brand">
          <div class="brand" data-go-home style="cursor: pointer">${brandMark()}<span>Kaam Card</span></div>
          <p>© 2026 Kaam Card. Empowering Indian gig workers with portable data identity.</p>
        </div>
        <div class="footer-links">
          <a href="#benefits">Features</a>
          <a href="#how-it-works">Process</a>
          <a href="#testimonials">Reviews</a>
          <a href="#contact">Contact</a>
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
}

function purgeSession() {
  state.session = null;
  state.profile = null;
  state.parseResult = null;
  state.matches = [];
  state.phoneDraft = "";
  state.details = { age: 29, occupation: "Delivery worker", state: "Delhi" };
  state.route = "landing";
  state.shareOpen = false;
  state.consentGiven = false;
  state.auditLogs = [];
  state.schemeQuery = "";
  render();
}

function bindPurgeSession() {
  document.querySelectorAll("[data-purge-session]").forEach((button) => {
    button.addEventListener("click", () => {
      if (confirm("Are you sure you want to end your session and delete all parsed data? This cannot be undone.")) {
        purgeSession();
      }
    });
  });
}

function bindGoHome() {
  document.querySelectorAll("[data-go-home]").forEach((element) => {
    element.addEventListener("click", () => {
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
    { name: "Ayushman Bharat Portal.doc", type: "doc", url: "https://www.pmjay.gov.in/" },
    { name: "Kaam Card CSV Template.csv", type: "sheet", url: "#" }
  ].map((res) => `
    <a href="${escapeHtml(res.url)}" target="_blank" class="resource-item" rel="noopener noreferrer">
      <span class="resource-icon ${res.type}">
        ${res.type === "sheet" ? ICONS.file : ICONS.shield}
      </span>
      <span class="resource-name">${escapeHtml(res.name)}</span>
    </a>
  `).join("");

  return `
    <aside class="right-sidebar" aria-label="Welfare Knowledge & Security Logs">
      <div class="right-sidebar__section">
        <label for="scheme-search" class="field-label search-label">Search matched schemes</label>
        <div class="search-input-wrapper">
          <input type="text" id="scheme-search" placeholder="Type scheme name..." value="${escapeHtml(state.schemeQuery || "")}">
        </div>
      </div>
      
      <div class="right-sidebar__section">
        <h3 class="sidebar-heading">Knowledge Resources</h3>
        <div class="resources-list">
          ${resourceItems}
        </div>
      </div>
      
      <div class="right-sidebar__section">
        <h3 class="sidebar-heading">Local Security Audit Trail</h3>
        <div class="audit-logs-list">
          ${logItems || '<div class="empty-logs">No actions logged yet.</div>'}
        </div>
      </div>
    </aside>
  `;
}

function bindRightSidebarEvents() {
  const searchInput = document.querySelector("#scheme-search");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      state.schemeQuery = event.target.value;
      render();
      const newInput = document.querySelector("#scheme-search");
      if (newInput) {
        newInput.focus();
        newInput.setSelectionRange(newInput.value.length, newInput.value.length);
      }
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
  if (state.route === "insights") renderDashboard("Insights");
  if (state.route === "schemes") renderDashboard("Schemes");
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
      <li class="doc-checklist-item" style="list-style: none; margin: 8px 0;">
        <label class="doc-checkbox-label" style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 700; font-size: 0.92rem;">
          <input type="checkbox" class="doc-checkbox" style="width: 18px; height: 18px; accent-color: var(--green);">
          <span>${escapeHtml(t(doc))}</span>
        </label>
      </li>
    `).join("");

    stepContent = `
      <div class="guidance-step-view">
        <h4 class="guidance-step-title" style="font-size: 1.1rem; font-weight: 850; margin: 0 0 10px 0;">${t("Step 1: Check Required Documents")}</h4>
        <p class="copy" style="margin-bottom: 15px; font-size: 0.88rem;">${t("Please check off that you have these documents ready before opening the application portal:")}</p>
        <ul class="doc-checklist" style="padding: 0; margin: 0 0 15px 0;">
          ${docItems}
        </ul>
        <div class="guidance-disclaimer" style="margin-top: 15px; padding: 12px; border-radius: 8px; background: var(--blue-soft); border: 1px solid var(--line); font-size: 0.8rem; display: flex; gap: 8px; align-items: flex-start;">
          <span style="color: var(--blue); width: 16px; height: 16px; flex-shrink: 0; margin-top: 2px;">${ICONS.shield}</span>
          <span style="color: var(--blue); font-weight: 700; line-height: 1.45;">${t("Kaam Card never saves or asks for copy uploads of these documents. Keep them with you locally.")}</span>
        </div>
      </div>
    `;
  } else if (step === 2) {
    const stepItems = steps.map((s, idx) => `
      <div class="guidance-instruction-card" style="display: flex; gap: 14px; padding: 12px; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; margin-bottom: 10px;">
        <div class="instruction-num" style="width: 24px; height: 24px; border-radius: 50%; background: var(--green); color: #fff; display: grid; place-items: center; font-size: 0.85rem; font-weight: 800; flex: 0 0 auto;">${idx + 1}</div>
        <p class="instruction-desc" style="margin: 0; font-size: 0.88rem; line-height: 1.45; font-weight: 700; color: var(--ink);">${escapeHtml(t(s))}</p>
      </div>
    `).join("");

    stepContent = `
      <div class="guidance-step-view">
        <h4 class="guidance-step-title" style="font-size: 1.1rem; font-weight: 850; margin: 0 0 10px 0;">${t("Step 2: Step-by-Step Instructions")}</h4>
        <p class="copy" style="margin-bottom: 15px; font-size: 0.88rem;">${t("Follow these steps on the official portal to complete your registration:")}</p>
        <div class="instructions-timeline">
          ${stepItems}
        </div>
      </div>
    `;
  } else {
    stepContent = `
      <div class="guidance-step-view" style="text-align: center;">
        <h4 class="guidance-step-title" style="font-size: 1.1rem; font-weight: 850; margin: 0 0 10px 0;">${t("Step 3: Access Official Portal")}</h4>
        <p class="copy" style="margin-bottom: 20px; font-size: 0.88rem;">${t("You are now ready to visit the official website of the")} <strong>${escapeHtml(t(scheme.ministry || "Government of India"))}</strong>.</p>
        
        <div class="destination-secure" style="text-align: left; background: var(--surface-strong); border: 1px solid var(--line-strong); border-radius: 12px; padding: 16px; margin: 15px 0;">
          <div class="secure-badge" style="display: flex; align-items: center; gap: 6px; color: var(--green); font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
            <span style="width: 14px; height: 14px;">${ICONS.shield}</span>
            <span>${t("Verified Official Portal")}</span>
          </div>
          <p class="destination-domain" style="margin: 0 0 12px 0; font-size: 0.86rem; color: var(--ink);">${t("Destination:")} <strong>${escapeHtml(url ? url.hostname : "")}</strong></p>
          <a class="secure-link-btn" href="${escapeHtml(url ? url.href : "#")}" target="_blank" rel="noopener noreferrer" style="width: 100%; min-height: 42px; border: 1px solid var(--green); border-radius: var(--radius-sm); color: #fff !important; background: var(--green); display: inline-flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; font-size: 0.9rem; font-weight: 760; box-shadow: 0 4px 12px rgba(8, 137, 71, 0.15);">
            <span>${t("Open official portal")}</span>
            ${ICONS.external}
          </a>
        </div>
        
        <p class="copy" style="font-size: 0.8rem; color: var(--muted); margin-top: 15px;">
          ${state.lang === "hi" ?
            "कोई भी व्यक्तिगत जानकारी जमा करने से पहले हमेशा पुष्टि करें कि URL .gov.in या .nic.in पर समाप्त होता है।" :
            "Always confirm the URL ends in .gov.in or .nic.in before submitting any personal information."
          }
        </p>
      </div>
    `;
  }

  return `
    <div class="modal-backdrop" id="guidance-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: grid; place-items: center; z-index: 1000; padding: 16px;">
      <div class="modal-card is-guidance" style="background: var(--paper); border: 1px solid var(--line-strong); border-radius: 16px; width: 100%; max-width: 520px; box-shadow: 0 12px 32px rgba(0,0,0,0.15); display: flex; flex-direction: column; overflow: hidden;">
        <header class="modal-header" style="padding: 16px 20px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; background: var(--surface);">
          <h3 class="modal-title" style="margin: 0; font-size: 1.1rem; font-weight: 850; color: var(--ink);">${escapeHtml(t(scheme.shortName || scheme.name))} ${t("Guide")}</h3>
          <button class="icon-btn" type="button" data-close-guidance aria-label="${t("Close")}" style="background: none; border: none; cursor: pointer; color: var(--muted); display: grid; place-items: center;">${ICONS.back}</button>
        </header>
        
        <!-- Step progress indicators -->
        <div class="guidance-steps-bar" style="display: flex; align-items: center; justify-content: space-between; padding: 20px 40px; background: var(--surface); border-bottom: 1px solid var(--line);">
          <div class="step-indicator ${step >= 1 ? "active" : ""}" style="display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 0.72rem; font-weight: 700; color: ${step >= 1 ? "var(--green)" : "var(--muted)"};">
            <div class="step-num" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${step >= 1 ? "var(--green)" : "var(--line)"}; background: ${step >= 1 ? "var(--green)" : "var(--paper)"}; color: ${step >= 1 ? "#fff" : "var(--muted)"}; display: grid; place-items: center; font-weight: 800;">1</div>
            <span>${t("Docs")}</span>
          </div>
          <div class="step-line" style="flex: 1; height: 2px; background: ${step >= 2 ? "var(--green)" : "var(--line)"}; margin: 0 10px; margin-top: -12px;"></div>
          <div class="step-indicator ${step >= 2 ? "active" : ""}" style="display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 0.72rem; font-weight: 700; color: ${step >= 2 ? "var(--green)" : "var(--muted)"};">
            <div class="step-num" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${step >= 2 ? "var(--green)" : "var(--line)"}; background: ${step >= 2 ? "var(--green)" : "var(--paper)"}; color: ${step >= 2 ? "#fff" : "var(--muted)"}; display: grid; place-items: center; font-weight: 800;">2</div>
            <span>${t("Steps")}</span>
          </div>
          <div class="step-line" style="flex: 1; height: 2px; background: ${step >= 3 ? "var(--green)" : "var(--line)"}; margin: 0 10px; margin-top: -12px;"></div>
          <div class="step-indicator ${step >= 3 ? "active" : ""}" style="display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 0.72rem; font-weight: 700; color: ${step >= 3 ? "var(--green)" : "var(--muted)"};">
            <div class="step-num" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${step >= 3 ? "var(--green)" : "var(--line)"}; background: ${step >= 3 ? "var(--green)" : "var(--paper)"}; color: ${step >= 3 ? "#fff" : "var(--muted)"}; display: grid; place-items: center; font-weight: 800;">3</div>
            <span>${t("Apply")}</span>
          </div>
        </div>
        
        <div class="modal-body" style="padding: 24px; flex-grow: 1; overflow-y: auto; max-height: 380px;">
          ${stepContent}
        </div>
        
        <footer class="modal-footer" style="padding: 16px 20px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; gap: 10px; background: var(--surface);">
          <button class="secondary-btn" type="button" data-prev-step ${step === 1 ? "disabled" : ""} style="min-height: 38px; padding: 0 16px; border: 1px solid var(--line); border-radius: var(--radius-sm); font-weight: 700; cursor: pointer; background: var(--paper); color: var(--ink);">${t("Back")}</button>
          ${step < 3 ? `
            <button class="primary-btn" type="button" data-next-step style="min-height: 38px; padding: 0 16px; border: 1px solid var(--green); border-radius: var(--radius-sm); font-weight: 700; cursor: pointer; background: var(--green); color: #fff;">${t("Next Step")}</button>
          ` : `
            <button class="primary-btn" type="button" data-close-guidance style="min-height: 38px; padding: 0 16px; border: 1px solid var(--green); border-radius: var(--radius-sm); font-weight: 700; cursor: pointer; background: var(--green); color: #fff;">${t("Finish")}</button>
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

applyTheme(state.theme);
initInteractiveGridPattern();
initCustomCursor();
loadSchemesDb().finally(() => {
  render();
});
