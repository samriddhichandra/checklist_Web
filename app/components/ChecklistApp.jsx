"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SECTIONS, TOTAL_QUESTIONS } from "../../lib/checklistData";
import {
  deleteTrial,
  ensureActiveTrialId,
  getActiveTrialId,
  listTrials,
  loadChecklist,
  loadTrial,
  saveChecklist,
  saveTrial,
  setActiveTrialId,
} from "../../lib/checklistStorage";

function utcISODate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function safeShort(s) {
  return typeof s === "string" ? s.trim() : "";
}

function deriveTrialTitle(answers) {
  const blockNo = safeShort(answers?.[15]);
  const blockDate = safeShort(answers?.[16]);
  const location = safeShort(answers?.[17]);
  const parts = [blockNo && `PTW ${blockNo}`, blockDate, location].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Untitled trial";
}

function makeBaseAnswers() {
  const base = {};
  SECTIONS.flatMap((s) => s.questions).forEach((q) => {
    if (base[q.num] !== undefined) return;
    if (q.type === "checklist") base[q.num] = { selected: {}, otherText: "" };
    else if (q.type === "yesNoOther") base[q.num] = { choice: "", otherText: "" };
    else if (q.type === "yesOther") base[q.num] = { choice: "", otherText: "" };
    else base[q.num] = "";
  });
  return base;
}

function formatIso(iso) {
  if (!iso || typeof iso !== "string") return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsvValue(v) {
  const s = String(v ?? "");
  const escaped = s.replace(/"/g, '""');
  return `"${escaped}"`;
}

function serializeAnswer(q, a) {
  if (a == null) return "";
  switch (q.type) {
    case "text":
    case "textarea":
    case "time":
    case "date":
    case "select":
      return typeof a === "string" ? a : "";
    case "yesOther":
    case "yesNoOther":
      if (!a || typeof a !== "object") return "";
      if (a.choice === "other") return a.otherText ?? "";
      return a.choice ?? "";
    case "checklist": {
      if (!a || typeof a !== "object") return "";
      const selected = a.selected && typeof a.selected === "object" ? a.selected : {};
      const chosen = Object.entries(selected)
        .filter(([, v]) => Boolean(v))
        .map(([k]) => k);
      const other = typeof a.otherText === "string" && a.otherText.trim() ? [`Other: ${a.otherText.trim()}`] : [];
      return [...chosen, ...other].join(" | ");
    }
    default:
      return "";
  }
}

function isQuestionAnswered(q, a) {
  if (!a) return false;
  switch (q.type) {
    case "text":
    case "textarea":
    case "time":
    case "date":
    case "select":
      return typeof a === "string" && a.trim() !== "";
    case "yesOther":
      if (!a || typeof a !== "object") return false;
      if (a.choice === "yes") return true;
      if (a.choice === "other") return typeof a.otherText === "string" && a.otherText.trim() !== "";
      return false;
    case "yesNoOther":
      if (!a || typeof a !== "object") return false;
      if (a.choice === "yes" || a.choice === "no") return true;
      if (a.choice === "other") return typeof a.otherText === "string" && a.otherText.trim() !== "";
      return false;
    case "checklist": {
      if (!a || typeof a !== "object") return false;
      const selected = a.selected && typeof a.selected === "object" ? a.selected : {};
      const any = Object.values(selected).some(Boolean);
      const otherOk = typeof a.otherText === "string" && a.otherText.trim() !== "";
      return any || otherOk;
    }
    default:
      return false;
  }
}

function QuestionCard({ q, answer, onChange }) {
  const requiredMark = q.required ? <span className="q-required">*</span> : null;

  if (q.type === "checklist") {
    const selected = answer?.selected && typeof answer.selected === "object" ? answer.selected : {};
    const otherText = typeof answer?.otherText === "string" ? answer.otherText : "";
    return (
      <div className={`q-card ${isQuestionAnswered(q, answer) ? "has-answer" : ""}`}>
        <div className="q-label">
          <span className="q-num">Q{q.num}</span>
          <span className="q-text">
            {q.text} {requiredMark}
          </span>
        </div>
        <div className="checklist-group">
          {q.items.map((label) => {
            const id = label;
            const checked = Boolean(selected[id]);
            return (
              <label key={id} className={`check-item ${checked ? "checked" : ""}`}>
                <input
                  className="sr-only"
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    onChange({
                      selected: { ...selected, [id]: e.target.checked },
                      otherText,
                    });
                  }}
                />
                <span className="check-box" aria-hidden="true">
                  <svg viewBox="0 0 12 10" fill="none">
                    <polyline
                      points="1,5 4.5,8.5 11,1"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {label}
              </label>
            );
          })}

          {q.hasOther ? (
            <div className="other-block">
              <div className="other-label">Other</div>
              <input
                className="q-input"
                type="text"
                placeholder="Specify..."
                value={otherText}
                onChange={(e) => onChange({ selected, otherText: e.target.value })}
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (q.type === "yesOther") {
    const choice = answer?.choice ?? "";
    const otherText = answer?.otherText ?? "";
    return (
      <div className={`q-card ${isQuestionAnswered(q, answer) ? "has-answer" : ""}`}>
        <div className="q-label">
          <span className="q-num">Q{q.num}</span>
          <span className="q-text">
            {q.text} {requiredMark}
          </span>
        </div>
        <div className="radio-group" role="radiogroup" aria-label={`Q${q.num}`}>
          <label className={`radio-item ${choice === "yes" ? "selected" : ""}`}>
            <input
              className="sr-only"
              type="radio"
              name={`q${q.num}`}
              value="yes"
              checked={choice === "yes"}
              onChange={() => onChange({ choice: "yes", otherText: "" })}
            />
            <span className="radio-circle" aria-hidden="true">
              <span className="radio-dot" />
            </span>
            {q.yesLabel ?? "Yes"}
          </label>
          <label className={`radio-item ${choice === "other" ? "selected" : ""}`}>
            <input
              className="sr-only"
              type="radio"
              name={`q${q.num}`}
              value="other"
              checked={choice === "other"}
              onChange={() => onChange({ choice: "other", otherText })}
            />
            <span className="radio-circle" aria-hidden="true">
              <span className="radio-dot" />
            </span>
            {q.otherLabel ?? "Other"}
          </label>
        </div>
        {choice === "other" ? (
          <input
            className="q-input q-input-inline"
            type="text"
            placeholder="Specify..."
            value={otherText}
            onChange={(e) => onChange({ choice, otherText: e.target.value })}
          />
        ) : null}
      </div>
    );
  }

  if (q.type === "yesNoOther") {
    const choice = answer?.choice ?? "";
    const otherText = answer?.otherText ?? "";
    return (
      <div className={`q-card ${isQuestionAnswered(q, answer) ? "has-answer" : ""}`}>
        <div className="q-label">
          <span className="q-num">Q{q.num}</span>
          <span className="q-text">
            {q.text} {requiredMark}
          </span>
        </div>
        <div className="radio-group" role="radiogroup" aria-label={`Q${q.num}`}>
          {[
            ["yes", "Yes"],
            ["no", "No"],
            ["other", "Other"],
          ].map(([val, label]) => (
            <label key={val} className={`radio-item ${choice === val ? "selected" : ""}`}>
              <input
                className="sr-only"
                type="radio"
                name={`q${q.num}`}
                value={val}
                checked={choice === val}
                onChange={() => onChange({ choice: val, otherText: val === "other" ? otherText : "" })}
              />
              <span className="radio-circle" aria-hidden="true">
                <span className="radio-dot" />
              </span>
              {label}
            </label>
          ))}
        </div>
        {choice === "other" ? (
          <input
            className="q-input q-input-inline"
            type="text"
            placeholder="Specify..."
            value={otherText}
            onChange={(e) => onChange({ choice, otherText: e.target.value })}
          />
        ) : null}
      </div>
    );
  }

  const value = typeof answer === "string" ? answer : "";
  const inputId = `q${q.num}`;
  const common = {
    id: inputId,
    name: inputId,
    value,
    onChange: (e) => onChange(e.target.value),
  };

  if (q.type === "textarea") {
    return (
      <div className={`q-card ${isQuestionAnswered(q, answer) ? "has-answer" : ""}`}>
        <div className="q-label">
          <span className="q-num">Q{q.num}</span>
          <label className="q-text" htmlFor={inputId}>
            {q.text} {requiredMark}
          </label>
        </div>
        <textarea className="q-input" rows={q.rows ?? 3} placeholder={q.placeholder ?? ""} {...common} />
      </div>
    );
  }

  if (q.type === "select") {
    return (
      <div className={`q-card ${isQuestionAnswered(q, answer) ? "has-answer" : ""}`}>
        <div className="q-label">
          <span className="q-num">Q{q.num}</span>
          <label className="q-text" htmlFor={inputId}>
            {q.text} {requiredMark}
          </label>
        </div>
        <select className="q-select" {...common}>
          {q.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={`q-card ${isQuestionAnswered(q, answer) ? "has-answer" : ""}`}>
      <div className="q-label">
        <span className="q-num">Q{q.num}</span>
        <label className="q-text" htmlFor={inputId}>
          {q.text} {requiredMark}
        </label>
      </div>
      <input
        className={q.type === "date" ? "q-date" : "q-input"}
        type={q.type === "time" ? "time" : q.type === "date" ? "date" : "text"}
        placeholder={q.placeholder ?? ""}
        {...common}
      />
    </div>
  );
}

function Section({ section, answers, setAnswer, flash }) {
  return (
    <section
      className={`section-block ${flash ? "section-flash" : ""}`}
      id={section.id}
    >
      <header className="section-header">
        <div className="section-num">{String(section.id.replace("sec", "")).padStart(2, "0")}</div>
        <div className="section-info">
          <div className="section-title">{section.title}</div>
          <div className="section-desc">{section.desc}</div>
        </div>
      </header>

      {section.questions.map((q) => (
        <QuestionCard
          key={q.num}
          q={q}
          answer={answers[q.num]}
          onChange={(next) => setAnswer(q.num, next)}
        />
      ))}
    </section>
  );
}

export default function ChecklistApp() {
  const [isLoadingUi, setIsLoadingUi] = useState(true);
  const [scrollPct, setScrollPct] = useState(0);
  const [activeSection, setActiveSection] = useState(SECTIONS[0]?.id ?? "sec1");
  const [flashSectionId, setFlashSectionId] = useState("");
  const [toast, setToast] = useState("");
  const [trialId, setTrialId] = useState("");
  const [trialTitle, setTrialTitle] = useState("Untitled trial");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [isTrialSwitcherOpen, setIsTrialSwitcherOpen] = useState(false);
  const [trials, setTrials] = useState([]);
  const [isMobileUi, setIsMobileUi] = useState(false);
  const [isActionsCollapsed, setIsActionsCollapsed] = useState(false);
  const activeSectionRef = useRef(activeSection);
  const suppressAutosaveRef = useRef(false);

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 600px)");
    const apply = () => {
      const mobile = mq.matches;
      setIsMobileUi(mobile);
      // Keep actions always visible on desktop.
      if (!mobile) setIsActionsCollapsed(false);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const [answers, setAnswers] = useState(() => makeBaseAnswers());

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search ?? "");
      const requestedId = params.get("trialId") ?? "";

      const existingTrials = listTrials();
      setTrials(existingTrials);

      const existingActive = getActiveTrialId();
      let id = requestedId || existingActive;
      if (!id && existingTrials[0]?.trialId) id = existingTrials[0].trialId;
      if (!id) id = ensureActiveTrialId();

      // One-time migration: if legacy storage exists, import it as a trial (only if no trials exist yet).
      if (!existingTrials.length) {
        const legacy = loadChecklist();
        if (legacy && typeof legacy === "object" && legacy.answers) {
          const migratedId = id || ensureActiveTrialId();
          saveTrial(
            migratedId,
            { ...legacy, migratedFromLegacy: true },
            {
              title: deriveTrialTitle(legacy.answers) || "Migrated trial",
              createdAt: legacy.createdAt,
              updatedAt: legacy.updatedAt,
            },
          );
          setTrials(listTrials());
        }
      }

      // Load the requested/active trial (or start empty if it doesn't exist yet).
      const loaded = loadTrial(id);
      suppressAutosaveRef.current = true;
      setTrialId(id);
      setActiveTrialId(id);
      if (loaded && typeof loaded === "object" && loaded.answers) {
        setAnswers({ ...makeBaseAnswers(), ...loaded.answers });
        setLastSavedAt(loaded.updatedAt ?? "");
        setTrialTitle(deriveTrialTitle(loaded.answers));
      } else {
        const base = makeBaseAnswers();
        setAnswers(base);
        setLastSavedAt("");
        setTrialTitle(deriveTrialTitle(base));
      }
      window.requestAnimationFrame(() => {
        suppressAutosaveRef.current = false;
      });
    });
  }, []);

  // Persist (debounced-ish)
  useEffect(() => {
    if (!trialId) return;
    if (suppressAutosaveRef.current) return;
    const updatedAt = new Date().toISOString();
    const title = deriveTrialTitle(answers);
    setTrialTitle(title);
    setLastSavedAt(updatedAt);
    saveTrial(trialId, { answers, updatedAt }, { title, updatedAt });

    // Keep legacy storage updated for backwards compatibility (single-trial consumers).
    saveChecklist({ answers, updatedAt, trialId });
  }, [answers, trialId]);

  useEffect(() => {
    let raf = 0;
    let warmup = 0;
    let sectionEls = [];

    const getMetrics = () => {
      const docEl = document.documentElement;
      const body = document.body;
      const scrollingEl = document.scrollingElement;

      const scrollTop = Math.max(
        window.scrollY ?? 0,
        docEl?.scrollTop ?? 0,
        body?.scrollTop ?? 0,
        scrollingEl?.scrollTop ?? 0,
      );

      const scrollHeight = Math.max(
        docEl?.scrollHeight ?? 0,
        body?.scrollHeight ?? 0,
        scrollingEl?.scrollHeight ?? 0,
      );

      const clientHeight = window.innerHeight ?? docEl?.clientHeight ?? 0;
      const max = Math.max(0, scrollHeight - clientHeight);
      const y = Math.max(0, scrollTop);
      return { max, y };
    };

    const getHeaderOffset = () => {
      const header = document.querySelector(".header");
      const progress = document.querySelector(".global-progress");
      const headerH = header instanceof HTMLElement ? header.offsetHeight : 64;
      const progressH = progress instanceof HTMLElement ? progress.offsetHeight : 14;
      return headerH + progressH + 12;
    };

    const ensureSectionEls = () => {
      if (sectionEls.length) return;
      sectionEls = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    };

    const updateActiveSectionFromScroll = () => {
      ensureSectionEls();
      if (!sectionEls.length) return;

      const offset = getHeaderOffset();
      let bestId = sectionEls[0]?.id ?? "";
      let bestTop = Number.NEGATIVE_INFINITY;

      for (const el of sectionEls) {
        const top = el.getBoundingClientRect().top;
        // Keep the active item on the section whose top has crossed the sticky header line.
        if (top <= offset + 4 && top > bestTop) {
          bestTop = top;
          bestId = el.id;
        }
      }

      if (bestId && bestId !== activeSectionRef.current) {
        setActiveSection(bestId);
        if (typeof window !== "undefined") window.history.replaceState(null, "", `#${bestId}`);
      }
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const { max, y } = getMetrics();
        const pctNow = max > 0 ? Math.round((y / max) * 100) : 0;
        setScrollPct(Math.max(0, Math.min(100, pctNow)));
        updateActiveSectionFromScroll();
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);

    // Warm up during first paint/layout so we pick up correct heights even before the first user scroll.
    const tick = () => {
      if (warmup >= 8) return;
      warmup += 1;
      onScroll();
      window.requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const allQuestions = useMemo(() => SECTIONS.flatMap((s) => s.questions), []);

  const answeredCount = useMemo(() => {
    let count = 0;
    for (const q of allQuestions) {
      if (isQuestionAnswered(q, answers[q.num])) count += 1;
    }
    return count;
  }, [allQuestions, answers]);

  const requiredStats = useMemo(() => {
    const requiredQuestions = allQuestions.filter((q) => q.required);
    const requiredAnswered = requiredQuestions.reduce(
      (acc, q) => acc + (isQuestionAnswered(q, answers[q.num]) ? 1 : 0),
      0,
    );
    return { requiredTotal: requiredQuestions.length, requiredAnswered };
  }, [allQuestions, answers]);

  const pct = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);

  const sectionStats = useMemo(() => {
    const stats = {};
    for (const s of SECTIONS) {
      const total = s.questions.length;
      const answered = s.questions.reduce((acc, q) => acc + (isQuestionAnswered(q, answers[q.num]) ? 1 : 0), 0);
      stats[s.id] = { total, answered };
    }
    return stats;
  }, [answers]);

  // Active section follows scroll position (scrollspy).

  useEffect(() => {
    // Give the app a short moment to hydrate + load persisted state for a smoother first paint.
    const t = setTimeout(() => setIsLoadingUi(false), 450);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoadingUi) return;
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const id = hash?.startsWith("#") ? hash.slice(1) : "";
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    window.requestAnimationFrame(() => {
      setActiveSection(id);
      el.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }, [isLoadingUi]);

  function setAnswer(num, next) {
    setAnswers((prev) => ({ ...prev, [num]: next }));
  }

  function resetAll() {
    // Reset just the current trial contents (keeps the trialId stable).
    setAnswers((prev) => {
      const next = { ...prev };
      for (const s of SECTIONS) {
        for (const q of s.questions) {
          if (q.type === "checklist") next[q.num] = { selected: {}, otherText: "" };
          else if (q.type === "yesNoOther") next[q.num] = { choice: "", otherText: "" };
          else if (q.type === "yesOther") next[q.num] = { choice: "", otherText: "" };
          else next[q.num] = "";
        }
      }
      next[14] = "pune";
      next[16] = utcISODate();
      return next;
    });
    setToast("Form reset successfully");
  }

  function startNewTrial() {
    const fresh = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    setActiveTrialId(fresh);
    setTrialId(fresh);
    suppressAutosaveRef.current = true;
    const base = makeBaseAnswers();
    setAnswers(base);
    setTrialTitle("Untitled trial");
    setLastSavedAt("");
    setTrials(listTrials());
    window.requestAnimationFrame(() => {
      suppressAutosaveRef.current = false;
    });
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("trialId", fresh);
      window.history.replaceState(null, "", url.toString());
    }
  }

  function switchTrial(nextTrialId) {
    if (!nextTrialId || nextTrialId === trialId) return;
    const loaded = loadTrial(nextTrialId);
    suppressAutosaveRef.current = true;
    setTrialId(nextTrialId);
    setActiveTrialId(nextTrialId);
    if (loaded && typeof loaded === "object" && loaded.answers) {
      setAnswers({ ...makeBaseAnswers(), ...loaded.answers });
      setLastSavedAt(loaded.updatedAt ?? "");
      setTrialTitle(deriveTrialTitle(loaded.answers));
    } else {
      const base = makeBaseAnswers();
      setAnswers(base);
      setLastSavedAt("");
      setTrialTitle(deriveTrialTitle(base));
    }
    setTrials(listTrials());
    window.requestAnimationFrame(() => {
      suppressAutosaveRef.current = false;
    });
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("trialId", nextTrialId);
      window.history.replaceState(null, "", url.toString());
    }
  }

  function removeTrial(id) {
    if (!id) return;
    const ok = window.confirm("Delete this trial from this device? This cannot be undone.");
    if (!ok) return;
    deleteTrial(id);
    const remaining = listTrials();
    setTrials(remaining);
    if (trialId === id) {
      const fallback = remaining[0]?.trialId || ensureActiveTrialId();
      switchTrial(fallback);
    }
  }

  function copyResumeLink(id) {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("trialId", id);
    const text = url.toString();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => setToast("Resume link copied"))
        .catch(() => setToast("Could not copy link"));
    } else {
      setToast(text);
    }
  }

  function submit() {
    if (requiredStats.requiredAnswered < requiredStats.requiredTotal) {
      const remaining = requiredStats.requiredTotal - requiredStats.requiredAnswered;
      const ok = window.confirm(
        `There are ${remaining} required questions unanswered. Export JSON anyway?`,
      );
      if (!ok) return;
    }
    const payload = {
      schemaVersion: 1,
      totalQuestions: TOTAL_QUESTIONS,
      answeredCount,
      completionPct: pct,
      submittedAt: new Date().toISOString(),
      answers,
    };
    downloadJson(`trial-sop-checklist-${utcISODate()}.json`, payload);
    setToast(`Checklist exported — ${answeredCount}/${TOTAL_QUESTIONS} (${pct}%)`);
  }

  function exportExcelCsv() {
    const rows = [["Question No", "Section", "Question", "Answer"]];
    for (const section of SECTIONS) {
      for (const q of section.questions) {
        rows.push([`Q${q.num}`, section.title, q.text ?? "", serializeAnswer(q, answers[q.num])]);
      }
    }

    const csv = rows.map((r) => r.map(toCsvValue).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trial-sop-checklist-${utcISODate()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setToast("Excel (CSV) exported");
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  function goToSection(id, e) {
    if (e) e.preventDefault();
    setActiveSection(id);
    setFlashSectionId(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (typeof window !== "undefined") window.history.replaceState(null, "", `#${id}`);
    }
    window.setTimeout(() => {
      setFlashSectionId((prev) => (prev === id ? "" : prev));
    }, 900);
  }

  return (
    <div className="app-shell">
      <header className="header">
        <div className="header-title">
          Trial Checklist <span className="header-badge">RailwayMitra POC2</span>
        </div>
        <div className="header-right">
          <span className="header-trial" title={trialTitle}>
            {trialTitle}
          </span>
          <span className="header-saved" title={lastSavedAt ? `Saved at ${lastSavedAt}` : ""}>
            {lastSavedAt ? `Saved ${formatIso(lastSavedAt)}` : "Not saved yet"}
          </span>
          <span className="header-answered">
            {answeredCount} / {TOTAL_QUESTIONS} answered
          </span>
          <span className="progress-pill">{pct}%</span>
          <button className="trial-btn" type="button" onClick={() => setIsTrialSwitcherOpen(true)}>
            Trials
          </button>
        </div>
      </header>

      {isTrialSwitcherOpen ? (
        <div
          className="trial-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Trials"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTrialSwitcherOpen(false);
          }}
        >
          <div className="trial-panel">
            <div className="trial-panel-head">
              <div className="trial-panel-title">Trials on this device</div>
              <button className="trial-panel-close" type="button" onClick={() => setIsTrialSwitcherOpen(false)}>
                ×
              </button>
            </div>

            <div className="trial-panel-actions">
              <button className="trial-new" type="button" onClick={startNewTrial}>
                + New trial
              </button>
              {trialId ? (
                <button className="trial-link" type="button" onClick={() => copyResumeLink(trialId)}>
                  Copy resume link
                </button>
              ) : null}
            </div>

            <div className="trial-list" role="list">
              {(trials.length ? trials : listTrials()).map((t) => {
                const active = t.trialId === trialId;
                return (
                  <div key={t.trialId} className={`trial-item ${active ? "active" : ""}`} role="listitem">
                    <div className="trial-item-main">
                      <div className="trial-item-title">{t.title ?? "Untitled trial"}</div>
                      <div className="trial-item-sub">
                        {t.updatedAt ? `Updated ${formatIso(t.updatedAt)}` : ""}
                        {active ? " · Current" : ""}
                      </div>
                    </div>
                    <div className="trial-item-actions">
                      <button className="trial-open" type="button" onClick={() => switchTrial(t.trialId)}>
                        Open
                      </button>
                      <button className="trial-copy" type="button" onClick={() => copyResumeLink(t.trialId)}>
                        Link
                      </button>
                      <button className="trial-del" type="button" onClick={() => removeTrial(t.trialId)}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
              {!trials.length && !listTrials().length ? <div className="trial-empty">No saved trials yet.</div> : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="global-progress" aria-hidden="true" style={{ "--progress": scrollPct }}>
        <div className="global-progress-track" />
        <div className="global-progress-fill" />
        <div className="global-progress-caret" />
      </div>

      <div className="layout">
        <nav className="sidebar" aria-label="Sections">
          <div className="sidebar-label">Sections</div>
          {SECTIONS.map((s, idx) => {
            const st = sectionStats[s.id];
            return (
              <a
                key={s.id}
                className={`sidebar-item ${activeSection === s.id ? "active" : ""}`}
                href={`#${s.id}`}
                onClick={(e) => goToSection(s.id, e)}
              >
                <span className="sidebar-dot" />
                {s.shortTitle}
                <span className="sidebar-num">S{idx + 1}</span>
                <span className="sidebar-count">
                  {st.answered}/{st.total}
                </span>
              </a>
            );
          })}
        </nav>

        <main className="main">
          {isLoadingUi ? (
            <SkeletonView />
          ) : (
            SECTIONS.map((s) => (
              <Section
                key={s.id}
                section={s}
                answers={answers}
                setAnswer={setAnswer}
                flash={flashSectionId === s.id}
              />
            ))
          )}
        </main>
      </div>

      <div
        className={`submit-bar ${isMobileUi && isActionsCollapsed ? "compact" : ""}`}
        role="region"
        aria-label="Actions"
      >
        <div className="submit-top">
          <div className="submit-stats">
            <strong>{answeredCount}</strong> of <strong>{TOTAL_QUESTIONS}</strong> answered &nbsp;·&nbsp;{" "}
            <span>{pct}%</span>
            <span className="submit-required">
              &nbsp;·&nbsp; Required: {requiredStats.requiredAnswered}/{requiredStats.requiredTotal}
            </span>
          </div>
          {isMobileUi ? (
            <button
              className="submit-toggle"
              type="button"
              aria-expanded={!isActionsCollapsed}
              aria-controls="submit-actions"
              onClick={() => setIsActionsCollapsed((v) => !v)}
              title={isActionsCollapsed ? "Open actions" : "Collapse actions"}
            >
              {isActionsCollapsed ? "↑" : "×"}
            </button>
          ) : null}
        </div>

        <div
          id="submit-actions"
          className="submit-actions"
          hidden={isMobileUi && isActionsCollapsed}
        >
          <button className="btn-reset" type="button" onClick={resetAll}>
            Reset
          </button>
          <button className="btn-secondary" type="button" onClick={exportExcelCsv}>
            Export Excel
          </button>
          <button className="btn-submit" type="button" onClick={submit}>
            Export JSON
          </button>
        </div>
      </div>

      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}

function SkeletonView() {
  return (
    <div className="skeleton">
      <div className="skeleton-section">
        <div className="skeleton-header">
          <div className="skeleton-num shimmer" />
          <div className="skeleton-lines">
            <div className="skeleton-line shimmer" style={{ width: "58%" }} />
            <div className="skeleton-line shimmer" style={{ width: "86%" }} />
          </div>
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton-card shimmer" />
        ))}
      </div>
    </div>
  );
}
