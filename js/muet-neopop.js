const MuetNeo = (() => {
  const LS = {
    profile:   "muet_profile",
    speaking:  "muet_speaking_sessions",
    reading:   "muet_reading_history",
    listening: "muet_listening_sessions",
    writing:   "muet_writing_sessions"
  };

  const skills = [
    ["speaking",  "Speaking",  "🎤", "speaking.html"],
    ["reading",   "Reading",   "📖", "reading.html"],
    ["listening", "Listening", "🎧", "listening.html"],
    ["writing",   "Writing",   "✍️", "writing.html"]
  ];

  const badges = [
    ["✨", "First Step",         "first_step"],
    ["🎤", "PREP Starter",       "prep_starter"],
    ["💬", "Discussion Builder", "discussion_builder"],
    ["📖", "Passage Hunter",     "passage_hunter"],
    ["🎧", "Audio Focus",        "audio_focus"],
    ["✍️", "Essay Builder",     "essay_builder"],
    ["🏆", "Vault Finisher",     "vault_finisher"],
    ["🎯", "Mock Finisher",      "mock_finisher"]
  ];

  // ── Vault definitions ────────────────────────────────────────────────────────
  // paper IDs are internal only — never rendered to student screens
  const vaults = [
    {
      id:       "VAULT-00",
      type:     "starter",
      title:    "Starter Vault",
      subtitle: "Guided sample practice — learn the app flow",
      strict:   false,
      status:   "ready",   // ready | coming-soon
      tip:      "Start here. This vault teaches you the app flow using sample questions. It does not count as one of your 10 main practice sets.",
      papers: {
        speaking:  "SPK-SAMPLE-STARTER",
        reading:   "READ-SAMPLE-STARTER",
        listening: "LIST-SAMPLE-STARTER",
        writing:   "WRITE-SAMPLE-STARTER"
      }
    },
    ...Array.from({length: 10}, (_, i) => {
      const n   = String(i + 1).padStart(2, "0");
      const num = i + 1;
      return {
        id:       `VAULT-${n}`,
        type:     "practice",
        title:    `Vault ${num}`,
        subtitle: num <= 2 ? `Foundation Practice Set ${num}`
                : num <= 4 ? `Developing Practice Set ${num - 2}`
                : num <= 6 ? `Proficient Build Set ${num - 4}`
                : num <= 8 ? `Time Pressure Practice Set ${num - 6}`
                :            `Advanced Set ${num - 8}`,
        strict:   false,
        status:   num === 1 ? "ready" : "coming-soon",
        tip:      num <= 2  ? "Foundation level — heavy guidance with tips and samples before each component."
                : num <= 4  ? "Developing level — practise more independently with component timing."
                : num <= 6  ? "Proficient level — focus on Writing thesis and Speaking interaction."
                : num <= 8  ? "Time pressure practice — mistake pattern tracking enabled."
                :             "Advanced level — near-exam conditions. Aim for Band 4 across all components.",
        papers: {
          speaking:  `SPK-V${n}`,
          reading:   `READ-V${n}`,
          listening: `LIST-V${n}`,
          writing:   `WRITE-V${n}`
        }
      };
    }),
    {
      id:       "MOCK-01",
      type:     "mock",
      title:    "Final Mock Exam 1",
      subtitle: "Real exam simulation · strict timer",
      strict:   true,
      status:   "coming-soon",
      tip:      "Strict exam mode. Complete all four components in one sitting. Timer: Listening 50 min, Writing 75 min, Reading 75 min, Speaking ~30 min.",
      papers: {
        speaking:  "SPK-MOCK01",
        reading:   "READ-MOCK01",
        listening: "LIST-MOCK01",
        writing:   "WRITE-MOCK01"
      }
    },
    {
      id:       "MOCK-02",
      type:     "mock",
      title:    "Final Mock Exam 2",
      subtitle: "Final readiness check · strict timer",
      strict:   true,
      status:   "coming-soon",
      tip:      "Final mock before your actual MUET exam. Your performance here gives your best band prediction.",
      papers: {
        speaking:  "SPK-MOCK02",
        reading:   "READ-MOCK02",
        listening: "LIST-MOCK02",
        writing:   "WRITE-MOCK02"
      }
    }
  ];

  // ── Init ────────────────────────────────────────────────────────────────────
  function init() {
    bindForms();
    if (loadProfile()) {
      show("homeScreen");
      render();
      fillEdit();
    } else {
      show("registerScreen", true);
    }
  }

  // ── Form binding ────────────────────────────────────────────────────────────
  function bindForms() {
    document.getElementById("profileForm")?.addEventListener("submit", e => {
      e.preventDefault();
      const profile = {
        name:       val("name"),
        regNo:      val("regNo"),
        group:      val("group"),
        targetBand: val("targetBand"),
        xp:         50,
        streak:     1,
        badges:     ["first_step"],
        createdAt:  new Date().toISOString()
      };
      saveProfile(profile);
      toast("Profile created. Welcome to MUET SmartHub!");
      show("homeScreen");
      render();
      fillEdit();
    });

    document.getElementById("editForm")?.addEventListener("submit", e => {
      e.preventDefault();
      const p = loadProfile() || {};
      p.name       = val("editName");
      p.regNo      = val("editRegNo");
      p.group      = val("editGroup");
      p.targetBand = val("editTarget");
      saveProfile(p);
      toast("Profile updated.");
      show("homeScreen");
      render();
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function val(id)            { return document.getElementById(id)?.value.trim() || ""; }
  function set(id, v)         { const el = document.getElementById(id); if (el) el.value = v; }
  function parse(x, fallback) { try { return x ? JSON.parse(x) : fallback; } catch { return fallback; } }
  function loadProfile()      { return parse(localStorage.getItem(LS.profile), null); }
  function saveProfile(p)     { localStorage.setItem(LS.profile, JSON.stringify(p)); }
  function arr(key)           { const x = parse(localStorage.getItem(key), []); return Array.isArray(x) ? x : []; }

  // ── Scoring ─────────────────────────────────────────────────────────────────
  function score(skill) {
    const list = arr(LS[skill]);
    if (!list.length) return 0;
    const latest = list[list.length - 1];
    if (typeof latest.score90  === "number") return latest.score90;
    if (typeof latest.score    === "number") return latest.score;
    if (typeof latest.rawScore === "number" && typeof latest.totalQ === "number")
      return Math.round(latest.rawScore / latest.totalQ * 90);
    if (typeof latest.band     === "number") return Math.round((latest.band / 5) * 90);
    return 0;
  }

  function band(total360) {
    if (total360 >= 331) return "5+";
    if (total360 >= 294) return "5.0";
    if (total360 >= 258) return "4.5";
    if (total360 >= 211) return "4.0";
    if (total360 >= 164) return "3.5";
    if (total360 >= 123) return "3.0";
    if (total360 >= 82)  return "2.5";
    if (total360 >= 36)  return "2.0";
    if (total360 >= 1)   return "1.0";
    return "0.0";
  }

  function bandMessage(b) {
    return ({
      "5+":  "Excellent control. Maintain exam discipline.",
      "5.0": "Strong performance. Refine precision.",
      "4.5": "Good readiness. Stabilise your weak component.",
      "4.0": "Target zone. Keep practising consistently.",
      "3.5": "Minimum readiness. Build structure and accuracy.",
      "3.0": "Needs targeted support and guided practice.",
      "0.0": "Complete your first task to activate tracking."
    })[b] || "Keep practising to improve your band.";
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  function render() {
    const p = loadProfile();
    if (!p) return;

    document.getElementById("welcomeName").textContent   = p.name || "MUET Learner";
    document.getElementById("streak").textContent        = p.streak || 0;
    document.getElementById("xp").textContent            = p.xp || 0;
    document.getElementById("targetDisplay").textContent = p.targetBand || "4.0";

    const scores = {};
    skills.forEach(([key]) => {
      scores[key] = score(key);
      const pc = Math.round(scores[key] / 90 * 100);
      document.getElementById(key + "Score").textContent =
        scores[key] ? `${scores[key]}/90 · ${pc}%` : "No attempt";
      document.getElementById(key + "Bar").style.width = Math.min(100, pc) + "%";
    });

    const total = scores.speaking + scores.reading + scores.listening + scores.writing;
    const b     = band(total);
    const pcAll = Math.round(total / 360 * 100);

    document.getElementById("overallBand").textContent    = "Band " + b;
    document.getElementById("bandMessage").textContent    = bandMessage(b);
    document.getElementById("overallPercent").textContent = pcAll + "%";
    document.querySelector(".band-disc").style.setProperty("--p", pcAll + "%");

    renderFocus(scores);
    renderProgress(scores);
    renderBadges(p);
  }

  // ── Focus box ───────────────────────────────────────────────────────────────
  function renderFocus(scores) {
    const ordered   = skills.slice().sort((a, b) => scores[a[0]] - scores[b[0]]);
    const [key, label, icon, link] = ordered[0];
    const tips = {
      speaking:  "Complete one Task A using PREP: Point, Reason, Example, Point again.",
      reading:   "Complete one part using the Question-First strategy.",
      listening: "Practise one part. Write keywords, not full sentences.",
      writing:   "Write one task using the rubric checklist before submitting."
    };
    document.getElementById("focusTitle").textContent = `${icon} Focus: ${label}`;
    document.getElementById("focusText").textContent  = tips[key];
    document.getElementById("focusBtn").onclick       = () => openModule(link);
  }

  // ── Cycle strip (home preview) ───────────────────────────────────────────────
  function renderCycleStrip() {
    const wrap = document.getElementById("cycleStrip");
    if (!wrap) return;
    wrap.innerHTML = vaults.slice(0, 13).map((v, i) => {
      const progress = getVaultProgress(v.id);
      const done     = progress.completed;
      const isReady  = v.status === "ready";
      const label    = v.id === "VAULT-00" ? "Starter"
                     : v.id.startsWith("MOCK") ? v.title.replace("Final Mock Exam ", "Mock ")
                     : `Vault ${i}`;
      const cls = done === 4 ? "completed" : (isReady ? "unlocked" : "");
      return `
        <div class="cycle-node ${cls}" onclick="MuetNeo.show('vaultScreen')" title="${v.title}">
          <div>${label}</div>
          <small>${isReady ? done + "/4" : "Soon"}</small>
        </div>`;
    }).join("");
  }

  // ── Vault list ───────────────────────────────────────────────────────────────
  function renderVaults() {
    const el = document.getElementById("vaultList");
    if (!el) return;
    el.innerHTML = vaults.map(v => vaultCard(v)).join("");
  }

  function vaultCard(v) {
    const progress   = getVaultProgress(v.id);
    const done       = progress.completed;
    const pct        = Math.round((done / 4) * 100);
    const statusText = done === 4 ? "Completed ✅" : (v.status === "coming-soon" ? "Coming Soon" : `${done}/4 Done`);
    const isLocked   = v.status === "coming-soon";

    const componentDefs = [
      ["speaking",  "🎤 Speaking",  "speaking.html"],
      ["reading",   "📖 Reading",   "reading.html"],
      ["listening", "🎧 Listening", "listening.html"],
      ["writing",   "✍️ Writing",  "writing.html"]
    ];

    // Component tiles — show placeholder state for locked vaults
    const componentTiles = componentDefs.map(([key, label]) => {
      const isDone = progress.components[key];
      return `
        <div class="component-tile ${isDone ? "done" : ""} ${isLocked ? "tile-locked" : ""}">
          ${label}
          <small>${isLocked ? "Placeholder" : (isDone ? "✓ Completed" : "Not started")}</small>
        </div>`;
    }).join("");

    // Action buttons — disabled for locked vaults
    const buttons = isLocked
      ? componentDefs.map(([, label]) => `
          <button class="btn-locked" disabled>${label}</button>
        `).join("")
      : componentDefs.map(([key, label, link]) => `
          <button onclick="MuetNeo.startVaultComponent('${v.id}','${key}','${link}')">${label}</button>
        `).join("");

    // Vault tip note
    const tipColor = v.id === "VAULT-00" ? "tip-starter"
                   : v.strict            ? "tip-mock"
                   : isLocked            ? "tip-locked"
                   : "tip-practice";

    const tipNote = `<div class="vault-tip ${tipColor}">${
      isLocked ? "📋 Placeholder — paper will be assigned before this vault opens." : v.tip
    }</div>`;

    // Progress bar label
    const progressLabel = isLocked
      ? `<div class="progress-label">Papers: Pending Assignment</div>`
      : `<div class="progress-label">${done}/4 components completed</div>`;

    return `
      <div class="vault-card ${v.type} ${isLocked ? "locked-card" : ""}" data-type="${v.type}">
        <div class="vault-head">
          <div class="vault-title">
            <h3>${isLocked ? "🔒 " : ""}${v.title}</h3>
            <p>${v.subtitle}</p>
          </div>
          <div class="vault-status ${isLocked ? "status-soon" : ""}">${statusText}</div>
        </div>
        <div class="vault-body">
          <div class="component-grid">${componentTiles}</div>
          <div class="vault-progress"><span style="width:${pct}%"></span></div>
          ${progressLabel}
          ${tipNote}
        </div>
        <div class="vault-actions ${isLocked ? "actions-locked" : ""}">${buttons}</div>
      </div>`;
  }

  // ── Vault progress tracking ──────────────────────────────────────────────────
  function getVaultProgress(vaultId) {
    const keys = {
      speaking:  LS.speaking,
      reading:   LS.reading,
      listening: LS.listening,
      writing:   LS.writing
    };
    const components = {};
    Object.entries(keys).forEach(([skill, key]) => {
      const list = arr(key);
      components[skill] = list.some(
        item => item.vaultId === vaultId || item.activeVaultId === vaultId
      );
    });
    return {
      components,
      completed: Object.values(components).filter(Boolean).length
    };
  }

  // ── Open a component from a vault ───────────────────────────────────────────
  function startVaultComponent(vaultId, skill, link) {
    const vault = vaults.find(v => v.id === vaultId);
    if (!vault) return;
    if (vault.status === "coming-soon") {
      toast("This vault is not yet open. Check back soon.");
      return;
    }
    localStorage.setItem("muet_active_vault", JSON.stringify({
      vaultId:    vault.id,
      vaultTitle: vault.title,
      vaultType:  vault.type,
      strict:     vault.strict,
      skill,
      startedAt:  new Date().toISOString()
      // paperId intentionally omitted — internal only
    }));
    toast(`Opening ${skill} — ${vault.title}`);
    setTimeout(() => { window.location.href = link; }, 350);
  }

  // ── Progress rows ─────────────────────────────────────────────────────────────
  function renderProgress(scores) {
    const el = document.getElementById("progressRows");
    if (!el) return;
    el.innerHTML = skills.map(([key, label, icon]) => {
      const s  = scores?.[key] ?? score(key);
      const pc = Math.round(s / 90 * 100);
      return `
        <div class="progress-row">
          <div class="top"><span>${icon} ${label}</span><span>${s}/90</span></div>
          <div class="track"><span style="width:${pc}%"></span></div>
        </div>`;
    }).join("");
  }

  // ── Badges ────────────────────────────────────────────────────────────────────
  function renderBadges(p) {
    const el     = document.getElementById("badges");
    if (!el) return;
    const earned = p.badges || [];
    el.innerHTML = badges.map(([icon, name, id]) => `
      <div class="badge ${earned.includes(id) ? "" : "locked"}">
        <span>${earned.includes(id) ? icon : "🔒"}</span>
        <b>${name}</b>
      </div>`).join("");
  }

  // ── Profile edit ─────────────────────────────────────────────────────────────
  function fillEdit() {
    const p = loadProfile();
    if (!p) return;
    set("editName",   p.name       || "");
    set("editRegNo",  p.regNo      || "");
    set("editGroup",  p.group      || "");
    set("editTarget", p.targetBand || "4.0");
  }

  // ── Screen navigation ────────────────────────────────────────────────────────
  function show(id, first = false) {
    document.querySelectorAll(".screen").forEach(s =>
      s.classList.toggle("active", s.id === id)
    );
    const navEl = document.getElementById("nav");
    if (navEl) navEl.style.display = id === "registerScreen" ? "none" : "grid";

    document.querySelectorAll(".bottom-nav button").forEach(btn =>
      btn.classList.remove("active")
    );
    const navMap = { homeScreen: 0, vaultScreen: 1, progressScreen: 2, profileScreen: 3 };
    const navBtn = document.querySelectorAll(".bottom-nav button")[navMap[id]];
    if (navBtn) navBtn.classList.add("active");

    if (!first) window.scrollTo({ top: 0, behavior: "smooth" });

    // Render on demand — avoids firing before DOM is ready
    if (id === "homeScreen" || id === "progressScreen") render();
    if (id === "homeScreen")    renderCycleStrip();
    if (id === "vaultScreen")   renderVaults();
    if (id === "profileScreen") fillEdit();
  }

  function openModule(url) { window.location.href = url; }

  function resetAll() {
    if (!confirm("Reset all local MUET SmartHub data? This cannot be undone.")) return;
    Object.values(LS).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem("muet_active_vault");
    toast("App reset.");
    setTimeout(() => location.reload(), 500);
  }

  function toast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2800);
  }

  return { init, show, openModule, resetAll, startVaultComponent };
})();

document.addEventListener("DOMContentLoaded", MuetNeo.init);
