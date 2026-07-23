const API_TOKEN_KEY = "kaam-card-api-token";
const API_SESSION_KEY = "kaam-card-api-session";
const API_PROFILE_KEY = "kaam-card-api-profile";

function apiGet(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function apiSet(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // best-effort
  }
}

function apiRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // best-effort
  }
}

const API = {
  sendOtp(phone) {
    return new Promise((resolve) => {
      const code = "0000";
      const expiresAt = Date.now() + 5 * 60 * 1000;
      apiSet(API_SESSION_KEY, { phone, code, expiresAt });
      setTimeout(() => {
        resolve({ _debug: { code } });
      }, 800);
    });
  },

  verifyOtp(phone, code) {
    return new Promise((resolve, reject) => {
      const session = apiGet(API_SESSION_KEY);
      if (!session || session.phone !== phone || session.code !== code) {
        setTimeout(() => reject(new Error("Invalid or expired OTP")), 500);
        return;
      }
      if (Date.now() > session.expiresAt) {
        setTimeout(() => reject(new Error("OTP has expired")), 500);
        return;
      }
      const token = "tok_" + Math.random().toString(36).slice(2);
      apiSet(API_TOKEN_KEY, token);
      const sessionData = { phone, startedAt: Date.now() };
      apiSet(API_SESSION_KEY, { ...session, verified: true, token, session: sessionData });
      setTimeout(() => {
        resolve({ session: sessionData });
      }, 600);
    });
  },

  saveProfile(data) {
    return new Promise((resolve) => {
      apiSet(API_PROFILE_KEY, data);
      setTimeout(() => resolve({ ok: true }), 300);
    });
  },

  getSession() {
    return new Promise((resolve, reject) => {
      const token = API.loadToken();
      if (!token) {
        setTimeout(() => reject(new Error("No session")), 200);
        return;
      }
      const session = apiGet(API_SESSION_KEY);
      if (!session || session.token !== token) {
        setTimeout(() => reject(new Error("Invalid session")), 200);
        return;
      }
      const profile = apiGet(API_PROFILE_KEY);
      setTimeout(() => {
        resolve({ session: session.session, profile });
      }, 300);
    });
  },

  loadToken() {
    return apiGet(API_TOKEN_KEY);
  },

  setToken(token) {
    if (token) {
      apiSet(API_TOKEN_KEY, token);
    } else {
      apiRemove(API_TOKEN_KEY);
    }
  },

  purgeSession() {
    return new Promise((resolve) => {
      apiRemove(API_TOKEN_KEY);
      apiRemove(API_SESSION_KEY);
      apiRemove(API_PROFILE_KEY);
      setTimeout(() => resolve({ ok: true }), 200);
    });
  }
};
