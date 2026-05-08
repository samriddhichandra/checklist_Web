const LEGACY_STORAGE_KEY = "trial_sop_checklist_v1";
const TRIALS_INDEX_KEY = "trial_sop_trials_index_v1";
const ACTIVE_TRIAL_KEY = "trial_sop_active_trial_v1";

function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function trialStorageKey(trialId) {
  return `trial_sop_trial_${trialId}_v1`;
}

export function listTrials() {
  if (typeof window === "undefined") return [];
  const parsed = safeParse(window.localStorage.getItem(TRIALS_INDEX_KEY));
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.trials)) return [];
  return parsed.trials.filter((t) => t && typeof t === "object" && typeof t.trialId === "string");
}

export function upsertTrialMeta(meta) {
  if (typeof window === "undefined") return;
  try {
    const trials = listTrials();
    const idx = trials.findIndex((t) => t.trialId === meta.trialId);
    const next = {
      trialId: meta.trialId,
      title: meta.title ?? "Untitled trial",
      createdAt: meta.createdAt ?? new Date().toISOString(),
      updatedAt: meta.updatedAt ?? new Date().toISOString(),
    };
    if (idx >= 0) trials[idx] = { ...trials[idx], ...next };
    else trials.unshift(next);
    window.localStorage.setItem(TRIALS_INDEX_KEY, JSON.stringify({ trials }));
  } catch {
    // ignore
  }
}

export function deleteTrial(trialId) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(trialStorageKey(trialId));
    const trials = listTrials().filter((t) => t.trialId !== trialId);
    window.localStorage.setItem(TRIALS_INDEX_KEY, JSON.stringify({ trials }));
    const active = getActiveTrialId();
    if (active === trialId) window.localStorage.removeItem(ACTIVE_TRIAL_KEY);
  } catch {
    // ignore
  }
}

export function getActiveTrialId() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(ACTIVE_TRIAL_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setActiveTrialId(trialId) {
  if (typeof window === "undefined") return;
  try {
    if (!trialId) window.localStorage.removeItem(ACTIVE_TRIAL_KEY);
    else window.localStorage.setItem(ACTIVE_TRIAL_KEY, trialId);
  } catch {
    // ignore
  }
}

export function loadTrial(trialId) {
  if (typeof window === "undefined" || !trialId) return null;
  const parsed = safeParse(window.localStorage.getItem(trialStorageKey(trialId)));
  if (!parsed || typeof parsed !== "object") return null;
  return parsed;
}

export function saveTrial(trialId, state, meta) {
  if (typeof window === "undefined" || !trialId) return;
  try {
    window.localStorage.setItem(trialStorageKey(trialId), JSON.stringify(state));
    upsertTrialMeta({
      trialId,
      title: meta?.title,
      createdAt: meta?.createdAt,
      updatedAt: meta?.updatedAt,
    });
    setActiveTrialId(trialId);
  } catch {
    // ignore quota / private mode failures
  }
}

export function clearTrial(trialId) {
  deleteTrial(trialId);
}

function generateTrialId() {
  // short, URL-safe id
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}-${rand}`;
}

export function ensureActiveTrialId() {
  if (typeof window === "undefined") return "";
  const existing = getActiveTrialId();
  if (existing) return existing;
  const id = generateTrialId();
  setActiveTrialId(id);
  return id;
}

// ---- Legacy single-trial API (kept for backwards compatibility) ----
export function loadChecklist() {
  if (typeof window === "undefined") return null;
  const legacy = safeParse(window.localStorage.getItem(LEGACY_STORAGE_KEY));
  if (!legacy || typeof legacy !== "object") return null;
  return legacy;
}

export function saveChecklist(state) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearChecklist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}
