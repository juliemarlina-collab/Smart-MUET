/**
 * Smart MUET Guide — backend-config.js v3.0 · Phase 1 Exam Ready
 * Drop-in replacement for the ORIGINAL Smart-MUET-Guide repo.
 *
 * Keeps the original save-attempt contract and adds:
 * - email-based restore/login
 * - profile/session updates
 * - activity logging
 * - automatic Exam Ready UI loader
 */

const SMART_MUET_BACKEND_ENABLED = true;
const SMART_MUET_BACKEND_URL = 'PASTE_YOUR_NEW_APPS_SCRIPT_WEB_APP_URL_HERE';

// Load Phase 1 Exam Ready enhancement without touching the original index.html.
(function loadExamReadyEnhancement(){
  if (!document.querySelector('link[data-exam-ready]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'css/exam-ready.css?v=20260815-1';
    css.dataset.examReady = '1';
    document.head.appendChild(css);
  }
  if (!document.querySelector('script[data-exam-ready]')) {
    const s = document.createElement('script');
    s.src = 'js/exam-ready.js?v=20260815-1';
    s.defer = true;
    s.dataset.examReady = '1';
    document.head.appendChild(s);
  }
})();

function backendReady_(){
  return SMART_MUET_BACKEND_ENABLED &&
    SMART_MUET_BACKEND_URL &&
    !SMART_MUET_BACKEND_URL.includes('PASTE_');
}

// ── Primary save function (keeps original behaviour) ─────────────────
async function saveSmartMuetAttempt(payload) {
  _saveAttemptLocally(payload);

  if (!backendReady_()) return { ok:false, localOnly:true };

  try {
    await fetch(SMART_MUET_BACKEND_URL, {
      method:'POST',
      mode:'no-cors',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({action:'saveAttempt', ...payload})
    });
    return {ok:true, sent:true};
  } catch(err) {
    return {ok:false, error:String(err)};
  }
}

// ── Registration / returning user ────────────────────────────────────
async function sendRegistration(profile) {
  if (!backendReady_()) return {ok:false, localOnly:true};
  try {
    await fetch(SMART_MUET_BACKEND_URL, {
      method:'POST',
      mode:'no-cors',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({
        action:'register',
        studentName:profile.name || '',
        studentEmail:(profile.email || '').toLowerCase(),
        studentRegNo:profile.regNo || '',
        classGroup:profile.group || '',
        targetBand:profile.targetBand || '',
        examSession:profile.examSession || '',
        speakingDate:profile.speakingDate || '',
        registeredAt:profile.createdAt || new Date().toISOString(),
        lastLogin:new Date().toISOString()
      })
    });
    return {ok:true};
  } catch(err) {
    return {ok:false, error:String(err)};
  }
}

// Apps Script cross-origin reads use JSONP so GitHub Pages can read them reliably.
function jsonpRequest_(params, timeoutMs=12000) {
  return new Promise((resolve) => {
    if (!backendReady_()) return resolve({ok:false, localOnly:true});
    const cb = '__smartMuetCb_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    const qs = new URLSearchParams({...params, callback:cb});
    const script = document.createElement('script');
    let done = false;

    function finish(data){
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { delete window[cb]; } catch(_) {}
      script.remove();
      resolve(data || {ok:false});
    }

    window[cb] = finish;
    script.onerror = () => finish({ok:false, message:'Unable to contact progress service.'});
    script.src = SMART_MUET_BACKEND_URL + '?' + qs.toString();
    document.body.appendChild(script);
    const timer = setTimeout(() => finish({ok:false, message:'Progress service timed out.'}), timeoutMs);
  });
}

async function restoreStudentData(email) {
  return jsonpRequest_({
    action:'restore',
    email:String(email || '').trim().toLowerCase()
  });
}

async function fetchExamConfig() {
  return jsonpRequest_({action:'config'});
}

async function updateSmartMuetProfile(profile) {
  if (!backendReady_()) return {ok:false, localOnly:true};
  try {
    await fetch(SMART_MUET_BACKEND_URL, {
      method:'POST',
      mode:'no-cors',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({action:'updateProfile', profile})
    });
    return {ok:true};
  } catch(err) {
    return {ok:false, error:String(err)};
  }
}

async function logSmartMuetActivity(payload) {
  _saveActivityLocally(payload);
  if (!backendReady_()) return {ok:false, localOnly:true};

  try {
    await fetch(SMART_MUET_BACKEND_URL, {
      method:'POST',
      mode:'no-cors',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({action:'activity', ...payload})
    });
    return {ok:true};
  } catch(err) {
    return {ok:false, error:String(err)};
  }
}

function _saveAttemptLocally(payload) {
  try {
    const key='muet_attempt_log';
    const log=JSON.parse(localStorage.getItem(key)||'[]');
    log.push({...payload,_savedAt:new Date().toISOString()});
    if(log.length>200) log.splice(0,log.length-200);
    localStorage.setItem(key,JSON.stringify(log));
  } catch(_) {}
}

function _saveActivityLocally(payload) {
  try {
    const key='muet_activity_log';
    const log=JSON.parse(localStorage.getItem(key)||'[]');
    log.push({...payload,_savedAt:new Date().toISOString()});
    if(log.length>300) log.splice(0,log.length-300);
    localStorage.setItem(key,JSON.stringify(log));
  } catch(_) {}
}
