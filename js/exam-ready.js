/**
 * Smart MUET Guide Phase 1 — Exam Ready enhancement
 * Designed specifically for the ORIGINAL Neo-Academic / Neo-Pop UI.
 * No redesign: this file injects new functionality into the existing screens.
 */
(() => {
  'use strict';

  const SESSION_FALLBACK = {
    'S1-2026': {label:'MUET Session 1 · 2026', written:'2026-04-25T08:00:00+08:00', writtenLabel:'25 April 2026'},
    'S2-2026': {label:'MUET Session 2 · 2026', written:'2026-06-27T08:00:00+08:00', writtenLabel:'27 June 2026'},
    'S3-2026': {
      label:'MUET Session 3 · 2026',
      written:'2026-10-17T08:00:00+08:00',
      writtenLabel:'17 October 2026',
      speakingWindow:'6, 7, 8, 12, 13 & 14 October 2026'
    }
  };

  const MPM = {
    timetable:'https://www.mpm.edu.my/en/muet/muet-timetable',
    slip:'https://www.mpm.edu.my/en/muet/registration-slip-muet-d-checking',
    results:'https://mecea.mpm.edu.my/MUETR',
    certificate:'https://sijil.mpm.edu.my/muet'
  };

  let serverConfig = null;
  let countdownTimer = null;

  const $ = (sel, root=document) => root.querySelector(sel);

  function loadProfile(){
    try {
      if (window.MUET && typeof MUET.loadProfile === 'function') return MUET.loadProfile();
      return JSON.parse(localStorage.getItem('muet_profile') || 'null');
    } catch(_) { return null; }
  }

  function saveProfile(p){
    if (window.MUET && typeof MUET.saveProfile === 'function') MUET.saveProfile(p);
    else localStorage.setItem('muet_profile', JSON.stringify(p));
  }

  function injectRegistrationSession(){
    const form = $('#regForm');
    if (!form || $('#regExamSession')) return;

    const submit = form.querySelector('button[type="submit"]');
    const wrap = document.createElement('label');
    wrap.innerHTML = `MUET Exam Session
      <select id="regExamSession" required>
        <option value="">Choose your session</option>
        <option value="S1-2026">MUET Session 1 · 2026</option>
        <option value="S2-2026">MUET Session 2 · 2026</option>
        <option value="S3-2026">MUET Session 3 · 2026</option>
      </select>
      <small class="exam-help">Your dashboard countdown and exam-ready plan will follow this session.</small>`;
    form.insertBefore(wrap, submit);

    form.addEventListener('submit', () => {
      // Hub saves the base profile in its own handler; add the exam session immediately after.
      setTimeout(() => {
        const p = loadProfile();
        if (!p) return;
        p.examSession = $('#regExamSession')?.value || p.examSession || 'S3-2026';
        p.lastLogin = new Date().toISOString();
        saveProfile(p);
        if (typeof updateSmartMuetProfile === 'function') updateSmartMuetProfile(p);
        renderExamReady();
      }, 0);
    });
  }

  function injectProfileExamSettings(){
    const editForm = $('#editForm');
    if (!editForm || $('#editExamSession')) return;

    const submit = editForm.querySelector('button[type="submit"]');
    const box = document.createElement('div');
    box.className = 'exam-settings-block';
    box.innerHTML = `
      <div class="exam-section-tag">🗓️ MY MUET EXAM</div>
      <label>MUET Exam Session
        <select id="editExamSession">
          <option value="S1-2026">MUET Session 1 · 2026</option>
          <option value="S2-2026">MUET Session 2 · 2026</option>
          <option value="S3-2026">MUET Session 3 · 2026</option>
        </select>
      </label>
      <label>My Speaking Date <span class="optional-label">optional</span>
        <input id="editSpeakingDate" type="date"/>
        <small class="exam-help">Use the exact date shown on your MUET/D slip.</small>
      </label>`;
    editForm.insertBefore(box, submit);

    const p = loadProfile();
    if (p) {
      $('#editExamSession').value = p.examSession || 'S3-2026';
      $('#editSpeakingDate').value = p.speakingDate || '';
    }

    editForm.addEventListener('submit', () => {
      setTimeout(() => {
        const p2 = loadProfile();
        if (!p2) return;
        p2.examSession = $('#editExamSession')?.value || p2.examSession || 'S3-2026';
        p2.speakingDate = $('#editSpeakingDate')?.value || '';
        saveProfile(p2);
        if (typeof updateSmartMuetProfile === 'function') updateSmartMuetProfile(p2);
        renderExamReady();
      }, 0);
    });
  }

  function getSessionConfig(sessionId){
    const local = SESSION_FALLBACK[sessionId] || SESSION_FALLBACK['S3-2026'];
    if (!serverConfig || !serverConfig.sessions) return local;
    return {...local, ...(serverConfig.sessions[sessionId] || {})};
  }

  function buildHomeCards(){
    const home = $('#homeScreen');
    if (!home || $('#examReadyCountdown')) return;

    const hero = home.querySelector('img[src*="home-hero-banner-main"]')?.closest('div');
    if (!hero) return;

    const p = loadProfile();
    const sessionId = p?.examSession || 'S3-2026';
    const cfg = getSessionConfig(sessionId);

    const card = document.createElement('section');
    card.id = 'examReadyCountdown';
    card.className = 'exam-ready-countdown';
    card.innerHTML = `
      <div class="exam-ready-kicker">⏱️ MY MUET EXAM COUNTDOWN</div>
      <div class="exam-ready-head">
        <div>
          <div id="examSessionLabel" class="exam-session-label">${cfg.label || sessionId}</div>
          <h2>Walk in ready.</h2>
        </div>
        <button class="exam-edit-btn" type="button" id="examEditBtn">Edit</button>
      </div>

      <div class="exam-time-grid" aria-label="Live countdown">
        <div class="exam-time-box"><b id="examDays">--</b><span>DAYS</span></div>
        <div class="exam-time-box"><b id="examHours">--</b><span>HRS</span></div>
        <div class="exam-time-box"><b id="examMinutes">--</b><span>MIN</span></div>
        <div class="exam-time-box"><b id="examSeconds">--</b><span>SEC</span></div>
      </div>

      <div class="exam-date-strip">
        <div><small>WRITTEN TEST</small><strong id="writtenDateLabel">${cfg.writtenLabel || ''}</strong></div>
        <div><small>SPEAKING</small><strong id="speakingDateLabel">${p?.speakingDate ? friendlyDate(p.speakingDate) : 'Check MUET/D slip'}</strong></div>
      </div>

      <div class="exam-official-row">
        <a href="${MPM.slip}" target="_blank" rel="noopener">🎫 MUET/D Slip ↗</a>
        <a href="${MPM.timetable}" target="_blank" rel="noopener">📅 Official Timetable ↗</a>
      </div>
    `;
    hero.insertAdjacentElement('afterend', card);

    const readiness = document.createElement('section');
    readiness.id = 'examReadinessCard';
    readiness.className = 'exam-readiness-card';
    readiness.innerHTML = `
      <div class="readiness-top">
        <div>
          <div class="exam-ready-kicker dark">🎯 EXAM READINESS</div>
          <h2>How exam ready are you?</h2>
          <p id="readinessMessage">Build readiness through meaningful practice — not page clicks.</p>
        </div>
        <div class="readiness-disc" id="readinessDisc" style="--readiness:0">
          <span id="readinessPct">0%</span>
        </div>
      </div>
      <div class="readiness-bars" id="readinessBars"></div>
      <div class="next-best-step">
        <small>NEXT BEST STEP</small>
        <strong id="nextBestStep">Start one guided component.</strong>
      </div>
    `;

    const progressPill = Array.from(home.querySelectorAll('.home-section-pill'))
      .find(el => el.textContent.includes('YOUR PROGRESS'));
    if (progressPill) progressPill.insertAdjacentElement('beforebegin', readiness);
    else card.insertAdjacentElement('afterend', readiness);

    const checklist = document.createElement('section');
    checklist.id = 'examChecklistCard';
    checklist.className = 'exam-checklist-card';
    checklist.innerHTML = `
      <div class="exam-ready-kicker dark">✅ EXAM READY CHECKLIST</div>
      <h2>Important before exam day</h2>
      <label><input type="checkbox" data-exam-check="slip"> I have checked/downloaded my MUET/D slip.</label>
      <label><input type="checkbox" data-exam-check="venue"> I know my test centre and reporting time.</label>
      <label><input type="checkbox" data-exam-check="id"> I have prepared the required identification.</label>
      <label><input type="checkbox" data-exam-check="timetable"> I have checked the official MPM timetable.</label>
      <div class="result-link-row">
        <a href="${MPM.results}" target="_blank" rel="noopener">📊 Official MUET Results ↗</a>
        <a href="${MPM.certificate}" target="_blank" rel="noopener">🏅 MUET e-Certificate ↗</a>
      </div>
    `;

    const cta = Array.from(home.querySelectorAll('.home-section-pill'))
      .find(el => el.textContent.includes('HOW TO USE'));
    if (cta) cta.insertAdjacentElement('beforebegin', checklist);
    else home.appendChild(checklist);

    bindChecklist();
    $('#examEditBtn')?.addEventListener('click', () => {
      if (window.Hub && typeof Hub.goTo === 'function') Hub.goTo('profileScreen');
    });
  }

  function friendlyDate(value){
    if (!value) return '';
    try {
      return new Date(value + 'T12:00:00+08:00').toLocaleDateString('en-MY',{
        day:'numeric',month:'short',year:'numeric'
      });
    } catch(_) { return value; }
  }

  function startCountdown(){
    clearInterval(countdownTimer);
    const p = loadProfile();
    if (!p || !$('#examReadyCountdown')) return;
    const cfg = getSessionConfig(p.examSession || 'S3-2026');
    const target = new Date(cfg.written);
    if (Number.isNaN(target.getTime())) return;

    function tick(){
      let diff = target.getTime() - Date.now();
      if (diff <= 0) diff = 0;
      const d = Math.floor(diff / 86400000); diff %= 86400000;
      const h = Math.floor(diff / 3600000); diff %= 3600000;
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const set = (id,val) => { const el=$(id); if(el) el.textContent=String(val).padStart(2,'0'); };
      set('#examDays',d); set('#examHours',h); set('#examMinutes',m); set('#examSeconds',s);
    }
    tick();
    countdownTimer = setInterval(tick,1000);
  }

  function calculateReadiness(){
    const skills = ['speaking','reading','listening','writing'];
    const scores = {};
    let attempted = 0;
    skills.forEach(skill => {
      let score = 0;
      try { score = window.MUET ? MUET.latestScore(skill) : 0; } catch(_) {}
      scores[skill] = score;
      if (score > 0) attempted++;
    });

    const performance = skills.reduce((sum,s)=>sum + Math.min(100,(scores[s]/90)*100),0)/4;
    const coverage = attempted/4*100;

    let vaultCoverage = 0;
    try {
      const v1 = MUET.vaultProgress('VAULT-01').count;
      const v2 = MUET.vaultProgress('VAULT-02').count;
      vaultCoverage = Math.min(100, ((v1+v2)/8)*100);
    } catch(_) {}

    const checks = loadChecklist();
    const examPrep = Object.values(checks).filter(Boolean).length / 4 * 100;

    const overall = Math.round(
      performance*0.45 +
      coverage*0.20 +
      vaultCoverage*0.20 +
      examPrep*0.15
    );

    const weakest = skills
      .map(s => ({skill:s, score:scores[s]}))
      .sort((a,b)=>a.score-b.score)[0];

    return {overall, performance, coverage, vaultCoverage, examPrep, weakest, scores};
  }

  function renderReadiness(){
    const box = $('#examReadinessCard');
    if (!box) return;
    const r = calculateReadiness();
    $('#readinessPct').textContent = r.overall + '%';
    $('#readinessDisc').style.setProperty('--readiness', r.overall);

    const labels = [
      ['Practice performance', r.performance],
      ['4-skill coverage', r.coverage],
      ['Vault journey', r.vaultCoverage],
      ['Exam preparation', r.examPrep]
    ];
    $('#readinessBars').innerHTML = labels.map(([name,val]) => `
      <div class="readiness-row">
        <div><span>${name}</span><b>${Math.round(val)}%</b></div>
        <div class="readiness-line"><i style="width:${Math.round(val)}%"></i></div>
      </div>
    `).join('');

    let message = 'Start small. One meaningful activity is better than opening many pages.';
    if (r.overall >= 80) message = 'Strong preparation. Protect your routine and focus on exam execution.';
    else if (r.overall >= 60) message = 'You are building solid readiness. Strengthen the weakest component next.';
    else if (r.overall >= 35) message = 'Good start. Build consistency and complete all four components.';
    $('#readinessMessage').textContent = message;

    const icon = {speaking:'🎤',reading:'📖',listening:'🎧',writing:'✍️'}[r.weakest.skill];
    const label = r.weakest.skill[0].toUpperCase()+r.weakest.skill.slice(1);
    $('#nextBestStep').textContent = r.weakest.score === 0
      ? `${icon} Start ${label} — it has no recorded attempt yet.`
      : `${icon} Strengthen ${label} — currently your lowest recorded component.`;
  }

  function loadChecklist(){
    try {
      return JSON.parse(localStorage.getItem('muet_exam_checklist') || '{}');
    } catch(_) { return {}; }
  }

  function bindChecklist(){
    const state = loadChecklist();
    document.querySelectorAll('[data-exam-check]').forEach(cb => {
      cb.checked = !!state[cb.dataset.examCheck];
      cb.addEventListener('change', () => {
        state[cb.dataset.examCheck] = cb.checked;
        localStorage.setItem('muet_exam_checklist', JSON.stringify(state));
        renderReadiness();
        logActivity('exam_checklist', cb.dataset.examCheck + ':' + cb.checked);
      });
    });
  }

  function logActivity(action,value=''){
    const p = loadProfile() || {};
    if (typeof logSmartMuetActivity === 'function') {
      logSmartMuetActivity({
        studentEmail:(p.email || '').toLowerCase(),
        studentName:p.name || '',
        examSession:p.examSession || '',
        page:location.pathname.split('/').pop() || 'index.html',
        action,
        value,
        timestamp:new Date().toISOString(),
        device:navigator.userAgent
      });
    }
  }

  async function loadServerConfig(){
    if (typeof fetchExamConfig !== 'function') return;
    try {
      const r = await fetchExamConfig();
      if (r && r.ok && r.config) {
        serverConfig = r.config;
        renderExamReady();
      }
    } catch(_) {}
  }

  function renderExamReady(){
    injectRegistrationSession();
    injectProfileExamSettings();
    buildHomeCards();

    const p = loadProfile();
    if (p && $('#editExamSession')) {
      $('#editExamSession').value = p.examSession || 'S3-2026';
      $('#editSpeakingDate').value = p.speakingDate || '';
    }

    if (p && $('#examReadyCountdown')) {
      const cfg = getSessionConfig(p.examSession || 'S3-2026');
      $('#examSessionLabel').textContent = cfg.label || p.examSession;
      $('#writtenDateLabel').textContent = cfg.writtenLabel || friendlyDate(String(cfg.written).slice(0,10));
      $('#speakingDateLabel').textContent = p.speakingDate
        ? friendlyDate(p.speakingDate)
        : (cfg.speakingWindow ? 'Window: '+cfg.speakingWindow : 'Check MUET/D slip');
      startCountdown();
      renderReadiness();
    }
  }

  function observeOriginalApp(){
    const observer = new MutationObserver(() => {
      renderExamReady();
    });
    observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
  }

  function init(){
    injectRegistrationSession();
    injectProfileExamSettings();
    renderExamReady();
    observeOriginalApp();
    loadServerConfig();
    logActivity('page_view');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
