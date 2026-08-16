/* ═══════════════════════════════════════════════════════════════════════
   MUET SmartHub 2026 — muet-shared.js
   Blueprint v3.2 — Shared utilities, vault data, scoring, profile
═══════════════════════════════════════════════════════════════════════ */

const MUET = (() => {

  // ── localStorage keys ──────────────────────────────────────────────
  const LS = {
    profile:    'muet_profile',
    activeVault:'muet_active_vault',
    speaking:   'muet_speaking_sessions',
    reading:    'muet_reading_history',
    listening:  'muet_listening_sessions',
    writing:    'muet_writing_sessions',
    selfcheck:  'muet_selfcheck',
    roundup:    'muet_roundup'
  };

  // ── Vault content map (paper IDs internal only, never shown) ───────
  const VAULT_MAP = {
    'VAULT-00': {
      id:'VAULT-00', title:'Starter Vault', type:'starter', strict:false,
      papers:{ speaking:'SPK-SAMPLE', reading:'READ-SAMPLE', listening:'LIST-SAMPLE', writing:'WRITE-SAMPLE' }
    },
    'VAULT-01': {
      id:'VAULT-01', title:'Vault 1', type:'practice', strict:false,
      papers:{ speaking:'SPK-V01', reading:'READ-V01', listening:'LIST-V01', writing:'WRITE-V01' }
    }
    // Vault 2–10 and Mocks added here when papers are verified and assigned
  };

  // ── Band thresholds ────────────────────────────────────────────────
  function calcBand(total360) {
    if (total360 >= 331) return '5+';
    if (total360 >= 294) return '5.0';
    if (total360 >= 258) return '4.5';
    if (total360 >= 211) return '4.0';
    if (total360 >= 164) return '3.5';
    if (total360 >= 123) return '3.0';
    if (total360 >= 82)  return '2.5';
    if (total360 >= 36)  return '2.0';
    if (total360 >= 1)   return '1.0';
    return '0.0';
  }

  function bandFromScore90(s) { return calcBand(s * 4); }

  function scoreToBand(s) {
    if (s >= 83) return '5.0';
    if (s >= 74) return '4.5';
    if (s >= 64) return '4.0';
    if (s >= 53) return '3.5';
    if (s >= 41) return '3.0';
    if (s >= 31) return '2.5';
    if (s >= 20) return '2.0';
    return '1.0';
  }

  function bandMessage(b) {
    const m = {
      '5+': 'Excellent control. Maintain exam discipline and refine accuracy.',
      '5.0':'Strong performance. Focus on precision and natural expression.',
      '4.5':'Good readiness. Strengthen your weak component to stabilise band.',
      '4.0':'Target zone. Practise consistently and avoid task fulfilment errors.',
      '3.5':'Minimum readiness. Build content, structure and accuracy.',
      '3.0':'Needs targeted practice and lecturer support.',
      '0.0':'Complete your first task to activate tracking.'
    };
    return m[b] || 'Keep practising to improve your band.';
  }

  // ── Component colours ──────────────────────────────────────────────
  const COMP_COLOR = { speaking:'#0757ff', reading:'#19d58a', listening:'#ffc400', writing:'#ff70b8' };
  const COMP_ICON  = { speaking:'🎤', reading:'📖', listening:'🎧', writing:'✍️' };
  const COMP_LABEL = { speaking:'Speaking', reading:'Reading', listening:'Listening', writing:'Writing' };

  // ── LocalStorage helpers ───────────────────────────────────────────
  function parse(x, fb) { try { return x ? JSON.parse(x) : fb; } catch { return fb; } }
  function loadProfile() { return parse(localStorage.getItem(LS.profile), null); }
  function saveProfile(p) { localStorage.setItem(LS.profile, JSON.stringify(p)); }
  function loadActiveVault() { return parse(localStorage.getItem(LS.activeVault), null); }
  function saveActiveVault(v) { localStorage.setItem(LS.activeVault, JSON.stringify(v)); }
  function loadSessions(skill) {
    const key = LS[skill];
    const x = parse(localStorage.getItem(key), []);
    return Array.isArray(x) ? x : [];
  }
  function saveSessions(skill, list) { localStorage.setItem(LS[skill], JSON.stringify(list)); }
  function loadSelfCheck(vaultId) { return parse(localStorage.getItem(LS.selfcheck + '_' + vaultId), null); }
  function saveSelfCheck(vaultId, data) { localStorage.setItem(LS.selfcheck + '_' + vaultId, JSON.stringify(data)); }
  function loadRoundup(vaultId) { return parse(localStorage.getItem(LS.roundup + '_' + vaultId), null); }
  function saveRoundup(vaultId, data) { localStorage.setItem(LS.roundup + '_' + vaultId, JSON.stringify(data)); }

  // ── Get latest score for a skill ──────────────────────────────────
  function latestScore(skill) {
    const list = loadSessions(skill);
    if (!list.length) return 0;
    const l = list[list.length - 1];
    if (typeof l.score90 === 'number') return l.score90;
    if (typeof l.score   === 'number') return l.score;
    if (typeof l.rawScore === 'number' && typeof l.totalQ === 'number')
      return Math.round(l.rawScore / l.totalQ * 90);
    return 0;
  }

  // ── Vault progress: which components done for a vaultId ───────────
  function vaultProgress(vaultId) {
    const skills = ['speaking','reading','listening','writing'];
    const done = {};
    skills.forEach(skill => {
      const list = loadSessions(skill);
      done[skill] = list.some(item => item.vaultId === vaultId);
    });
    const count = Object.values(done).filter(Boolean).length;
    return { done, count, complete: count === 4 };
  }

  // ── Badge helpers ──────────────────────────────────────────────────
  function awardBadge(badgeId) {
    const p = loadProfile(); if (!p) return;
    p.badges = p.badges || [];
    if (!p.badges.includes(badgeId)) {
      p.badges.push(badgeId);
      saveProfile(p);
    }
  }

  function addXP(amount) {
    const p = loadProfile(); if (!p) return;
    p.xp = (p.xp || 0) + amount;
    saveProfile(p);
  }

  // ── Toast ──────────────────────────────────────────────────────────
  function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2600);
  }

  // ── Nav: go to a screen ───────────────────────────────────────────
  function goTo(screenId) {
    document.querySelectorAll('.screen').forEach(s =>
      s.classList.toggle('active', s.id === screenId)
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Update nav highlight
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
    const map = { homeScreen:0, vaultScreen:1, progressScreen:2, profileScreen:3 };
    const btn = document.querySelectorAll('.bottom-nav button')[map[screenId]];
    if (btn) btn.classList.add('active');
    const nav = document.getElementById('nav');
    if (nav) nav.style.display = screenId === 'registerScreen' ? 'none' : 'grid';
  }

  // ── Navigate to another page ──────────────────────────────────────
  function goPage(url) { window.location.href = url; }

  // ── Feedback text by score ────────────────────────────────────────
  const FEEDBACK = {
    speaking: {
      high: 'Strong response. Your PREP structure is clear. Now refine delivery and natural expression.',
      mid:  'Good attempt. Strengthen your example and check that you answered the question directly.',
      low:  'Focus on task fulfilment first. Use PREP every time: Point → Reason → Example → Point again.'
    },
    reading: {
      high: 'Excellent accuracy. Review your weakest question type to stay consistent across all parts.',
      mid:  'Good effort. Identify whether errors are direct retrieval, paraphrase or inference type.',
      low:  'Read questions before the passage every time. Scan for keywords before selecting answers.'
    },
    listening: {
      high: 'Strong performance. Watch for distractors — first option mentioned is often corrected later.',
      mid:  'Good notes. Practise writing shorter keywords and waiting for signal words before answering.',
      low:  'Read all options before audio plays. Write only 2–3 keywords per blank and complete after.'
    },
    writing: {
      high: 'Well-structured response. Refine vocabulary choices and ensure your thesis is stated clearly.',
      mid:  'Good base. Cover all bullet points in Task 1. Use PEEL structure clearly in Task 2.',
      low:  'Plan before writing. Check word count and tick the rubric checklist before you submit.'
    }
  };

  function feedbackText(skill, score90) {
    const lib = FEEDBACK[skill] || {};
    if (score90 >= 74) return lib.high || '';
    if (score90 >= 53) return lib.mid  || '';
    return lib.low || '';
  }

  // ── Expose public API ──────────────────────────────────────────────
  return {
    LS, VAULT_MAP, COMP_COLOR, COMP_ICON, COMP_LABEL,
    calcBand, bandFromScore90, scoreToBand, bandMessage, feedbackText,
    loadProfile, saveProfile, loadActiveVault, saveActiveVault,
    loadSessions, saveSessions, loadSelfCheck, saveSelfCheck,
    loadRoundup, saveRoundup,
    latestScore, vaultProgress, awardBadge, addXP,
    toast, goTo, goPage
  };
})();
