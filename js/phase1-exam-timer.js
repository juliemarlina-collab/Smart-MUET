
(() => {
  const SESSIONS = {
    'S1-2026': {
      label:'MUET Session 1 · 2026',
      written:'2026-04-25T08:00:00+08:00',
      date:'25 April 2026',
      speaking:'Speaking date: refer to your MUET/D slip'
    },
    'S2-2026': {
      label:'MUET Session 2 · 2026',
      written:'2026-06-27T08:00:00+08:00',
      date:'27 June 2026',
      speaking:'Speaking date: refer to your MUET/D slip'
    },
    'S3-2026': {
      label:'MUET Session 3 · 2026',
      written:'2026-10-17T08:00:00+08:00',
      date:'17 October 2026',
      speaking:'Speaking window: 6, 7, 8, 12, 13 & 14 Oct 2026'
    }
  };
  let intervalId = null;

  const loadProfile = () => {
    try { return JSON.parse(localStorage.getItem('muet_profile') || 'null'); }
    catch (_) { return null; }
  };
  const saveProfile = p => localStorage.setItem('muet_profile', JSON.stringify(p));

  function patchProfileFromForms() {
    const p = loadProfile();
    if (!p) return;
    const regSession = document.getElementById('examSession');
    const editSession = document.getElementById('editExamSession');
    const speakDate = document.getElementById('editSpeakingDate');

    if (editSession && editSession.value) p.examSession = editSession.value;
    else if (regSession && regSession.value) p.examSession = regSession.value;
    if (speakDate) p.speakingDate = speakDate.value || p.speakingDate || '';
    saveProfile(p);
  }

  function bindForms() {
    const reg = document.getElementById('profileForm');
    if (reg) reg.addEventListener('submit', () => setTimeout(() => {
      patchProfileFromForms(); fillSettings(); renderCountdown();
    }, 0));

    const edit = document.getElementById('editForm');
    if (edit) edit.addEventListener('submit', () => setTimeout(() => {
      patchProfileFromForms(); fillSettings(); renderCountdown();
    }, 0));

    const editSession = document.getElementById('editExamSession');
    if (editSession) editSession.addEventListener('change', () => {
      patchProfileFromForms(); renderCountdown();
    });
  }

  function fillSettings() {
    const p = loadProfile();
    if (!p) return;
    const editSession = document.getElementById('editExamSession');
    const editSpeaking = document.getElementById('editSpeakingDate');
    if (editSession) editSession.value = p.examSession || 'S3-2026';
    if (editSpeaking) editSpeaking.value = p.speakingDate || '';
  }

  function renderCountdown() {
    clearInterval(intervalId);
    const p = loadProfile() || {};
    const id = p.examSession || 'S3-2026';
    const cfg = SESSIONS[id] || SESSIONS['S3-2026'];

    const title = document.getElementById('examCountdownTitle');
    const date = document.getElementById('examWrittenDate');
    const speaking = document.getElementById('speakingWindow');
    if (!title) return;

    title.textContent = cfg.label;
    date.textContent = 'Written test · ' + cfg.date;
    speaking.textContent = p.speakingDate
      ? 'My Speaking date · ' + new Date(p.speakingDate + 'T12:00:00+08:00').toLocaleDateString('en-MY',{day:'numeric',month:'short',year:'numeric'})
      : cfg.speaking;

    const target = new Date(cfg.written).getTime();

    const tick = () => {
      let diff = Math.max(0, target - Date.now());
      const days = Math.floor(diff / 86400000); diff %= 86400000;
      const hours = Math.floor(diff / 3600000); diff %= 3600000;
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      [['examDays',days],['examHours',hours],['examMinutes',minutes],['examSeconds',seconds]]
        .forEach(([id,val]) => {
          const el = document.getElementById(id);
          if (el) el.textContent = String(val).padStart(2,'0');
        });
    };
    tick();
    intervalId = setInterval(tick,1000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindForms(); fillSettings(); renderCountdown();

    // MuetNeo switches screens without reloading; refresh countdown/settings after profile screen actions.
    document.addEventListener('click', e => {
      if (e.target.closest('[onclick*="profileScreen"], [onclick*="homeScreen"]')) {
        setTimeout(() => { fillSettings(); renderCountdown(); }, 50);
      }
    });
  });
})();
