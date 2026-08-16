const Hub = (() => {

  const BADGES = [
    ['✨','First Step','first_step'],
    ['🎤','PREP Starter','prep_starter'],
    ['💬','Discussion Builder','discussion_builder'],
    ['📖','Passage Hunter','passage_hunter'],
    ['🎧','Audio Focus','audio_focus'],
    ['✍️','Essay Builder','essay_builder'],
    ['🏆','Vault Finisher','vault_finisher'],
    ['🎯','Mock Finisher','mock_finisher'],
    ['📈','Band Climber','band_climber']
  ];

  const SKILLS = [
    ['speaking','Speaking','🎤','speaking.html'],
    ['reading','Reading','📖','reading.html'],
    ['listening','Listening','🎧','listening.html'],
    ['writing','Writing','✍️','writing.html']
  ];

  const VAULT_ORDER  = ['VAULT-01','VAULT-02','VAULT-03','MOCK-01','VAULT-04','VAULT-05','VAULT-06','MOCK-02','VAULT-07','VAULT-08','VAULT-09','MOCK-03'];
  const VAULT_LABELS = { 'VAULT-01':'Vault 1','VAULT-02':'Vault 2','VAULT-03':'Vault 3','MOCK-01':'Mock MUET Practice 1','VAULT-04':'Vault 4','VAULT-05':'Vault 5','VAULT-06':'Vault 6','MOCK-02':'Mock MUET Practice 2','VAULT-07':'Vault 7','VAULT-08':'Vault 8','VAULT-09':'Vault 9','MOCK-03':'Mock MUET Practice 3' };
  const VAULT_PAGES  = { 'VAULT-01':'vault1-welcome.html', 'VAULT-02':'vault2-welcome.html' };
  
  function resolveVaultPage(vaultId) { return VAULT_PAGES[vaultId] || 'vault1-welcome.html'; }

  function isVaultUnlocked(vaultId) {
    const idx = VAULT_ORDER.indexOf(vaultId);
    if (idx <= 0) return true;
    const prevId = VAULT_ORDER[idx - 1];
    return MUET.vaultProgress(prevId).count === 4;
  }

  function init() {
    const p = MUET.loadProfile();
    const validHash = ['homeScreen','vaultScreen','progressScreen','profileScreen'];
    const hashId = (location.hash || '').replace('#','');
    if (p) {
      goTo(validHash.includes(hashId) ? hashId : 'homeScreen');
      renderHome(); fillEdit();
    } else {
      goTo('registerScreen');
    }

    document.getElementById('regForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const p = {
        name:       document.getElementById('regName').value.trim(),
        email:      document.getElementById('regEmail').value.trim().toLowerCase(),
        regNo:      document.getElementById('regNo').value.trim(),
        group:      document.getElementById('regGroup').value.trim(),
        targetBand: document.getElementById('regBand').value,
        xp: 50, streak: 1, badges: ['first_step'],
        createdAt: new Date().toISOString()
      };
      MUET.saveProfile(p);
      if (typeof sendRegistration === 'function') sendRegistration(p);
      MUET.toast('Welcome to Smart MUET Guide! Your journey starts now.');
      goTo('homeScreen'); renderHome(); fillEdit();
    });

    document.getElementById('showRestoreBtn')?.addEventListener('click', () => {
      const box = document.getElementById('restoreForm');
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('restoreBtn')?.addEventListener('click', async () => {
      const emailInput = document.getElementById('restoreEmail');
      const msgEl = document.getElementById('restoreMsg');
      const email = emailInput.value.trim().toLowerCase();
      if (!email) { msgEl.textContent = 'Enter the email you registered with.'; return; }
      if (typeof restoreStudentData !== 'function') {
        msgEl.textContent = 'Restore is not available right now.';
        return;
      }
      msgEl.textContent = 'Looking up your progress…';
      const result = await restoreStudentData(email);
      if (!result.ok) {
        msgEl.textContent = result.message || 'No saved progress found for that email.';
        return;
      }
      MUET.saveProfile(result.profile);
      Object.entries(result.sessions || {}).forEach(([skill, list]) => MUET.saveSessions(skill, list || []));
      if (result.activeVault) MUET.saveActiveVault(result.activeVault);
      msgEl.textContent = '';
      MUET.toast('Welcome back! Your progress has been restored.');
      goTo('homeScreen'); renderHome(); fillEdit();
    });

    document.getElementById('editForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const p = MUET.loadProfile() || {};
      p.name       = document.getElementById('editName').value.trim();
      p.email      = document.getElementById('editEmail').value.trim().toLowerCase();
      p.regNo      = document.getElementById('editRegNo').value.trim();
      p.group      = document.getElementById('editGroup').value.trim();
      p.targetBand = document.getElementById('editBand').value;
      MUET.saveProfile(p);
      MUET.toast('Profile saved.');
      goTo('homeScreen'); renderHome();
    });
  }

  function goTo(id) {
    MUET.goTo(id);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      const activeScreen = document.getElementById(id);
      if (activeScreen) activeScreen.scrollTop = 0;
    });

    if (id === 'homeScreen')     renderHome();
    if (id === 'vaultScreen')    renderVault();
    if (id === 'progressScreen') { renderProgress(); progTab('dash'); }
    if (id === 'profileScreen')  fillEdit();
    const nav = document.getElementById('nav');
    if (nav) {
      nav.style.display = (id === 'registerScreen') ? 'none' : 'grid';
      document.body.classList.toggle('no-sidebar', id === 'registerScreen');
      const navMap = {
        homeScreen: 'nav-home',
        vaultScreen: 'nav-vault',
        progressScreen: 'nav-progress',
        profileScreen: 'nav-profile'
      };
      nav.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      const activeId = navMap[id];
      if (activeId) {
        const activeBtn = document.getElementById(activeId);
        if (activeBtn) activeBtn.classList.add('active');
      }
    }
  }

  function renderHome() {
    const p = MUET.loadProfile(); if (!p) return;
    document.getElementById('homeName').textContent   = p.name || 'Smart MUET Guide';
    const avatarBtn = document.getElementById('homeAvatarBtn');
    if (avatarBtn && p.name) {
      const parts    = p.name.trim().split(/\s+/);
      const initials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].substring(0, 2).toUpperCase();
      avatarBtn.textContent = initials;
    }
    const gl = document.getElementById('homeGroupLabel');
    if (gl) gl.textContent = p.group ? `${p.group} · ELU` : 'ELU · JPA · PPD';
    document.getElementById('homeStreak').textContent = p.streak || 0;
    document.getElementById('homeXP').textContent     = p.xp || 0;
    document.getElementById('homeTarget').textContent = p.targetBand || '4.0';

    const scores = {};
    SKILLS.forEach(([skill]) => {
      scores[skill] = MUET.latestScore(skill);
      const pc = Math.round(scores[skill] / 90 * 100);
      const barId = { speaking:'spkBar', reading:'readBar', listening:'lstBar', writing:'wrtBar' }[skill];
      const txtId = { speaking:'spkScore', reading:'readScore', listening:'lstScore', writing:'wrtScore' }[skill];
      const bar = document.getElementById(barId);
      const txt = document.getElementById(txtId);
      if (bar) bar.style.width = Math.min(100, pc) + '%';
      if (txt) txt.textContent = scores[skill] ? `${scores[skill]}/90 · ${pc}%` : 'No attempt';
    });

    const total = scores.speaking + scores.reading + scores.listening + scores.writing;
    const b     = MUET.calcBand(total);
    const pc    = Math.round(total / 360 * 100);
    document.getElementById('homeBand').textContent    = 'Band ' + b;
    document.getElementById('homeBandMsg').textContent = MUET.bandMessage(b);
    document.getElementById('homePercent').textContent = pc + '%';
    document.getElementById('bandDisc').style.setProperty('--p', pc + '%');

    const weakest = SKILLS.slice().sort((a,b) => scores[a[0]] - scores[b[0]])[0];
    const tips = { speaking:'Complete one Task A using PREP: Point, Reason, Example, Point again.',
                   reading:'Complete one part. Read questions first, then scan the passage.',
                   listening:'Practise one part. Write keywords only, not full sentences.',
                   writing:'Write one task. Check word count and tick the rubric before submitting.' };
    document.getElementById('focusTitle').textContent = weakest[2] + ' Focus: ' + weakest[1];
    document.getElementById('focusText').textContent  = tips[weakest[0]];
    document.getElementById('focusBtn').onclick       = () => MUET.goPage(weakest[3]);

    const continuCard  = document.getElementById('continueVaultCard');
    let continueVault  = null;
    for (const vid of VAULT_ORDER) {
      const prog = MUET.vaultProgress(vid);
      if (prog.count > 0 && !prog.complete) { continueVault = vid; break; }
    }
    if (!continueVault) {
      for (const vid of VAULT_ORDER) {
        if (MUET.vaultProgress(vid).count === 0 && isVaultUnlocked(vid)) { continueVault = vid; break; }
      }
    }
    if (continueVault && continuCard) {
      const prog  = MUET.vaultProgress(continueVault);
      const label = VAULT_LABELS[continueVault] || continueVault;
      const page  = resolveVaultPage(continueVault);
      const isNew = prog.count === 0;
      document.getElementById('continueVaultTitle').textContent  = label;
      document.getElementById('continueVaultStatus').textContent = isNew
        ? 'Not started yet — begin here'
        : `${prog.count}/4 components done · ${4 - prog.count} remaining`;
      document.getElementById('continueVaultBtn').textContent  = isNew ? 'Start →' : 'Continue →';
      document.getElementById('continueVaultBtn').onclick      = () => MUET.goPage(page);
      continuCard.style.display = 'block';
    } else if (continuCard) {
      continuCard.style.display = 'none';
    }
  }

  function renderVault() {
    const prog = MUET.vaultProgress('VAULT-01');
    const count = prog.count;
    const pct   = Math.round(count / 4 * 100);
    const el  = document.getElementById('v1Status');
    if (el) el.textContent = count === 4 ? 'Completed ✅' : count + '/4 Done';
    const bar = document.getElementById('v1Prog');
    if (bar) bar.style.width = pct + '%';
    const dots = document.getElementById('v1Dots');
    if (dots) {
      const skills = ['speaking','reading','listening','writing'];
      const icons  = ['🎤','📖','🎧','✍️'];
      dots.innerHTML = skills.map((s, si) =>
        `<div class="dot ${prog.done[s] ? 'done' : ''}">${icons[si]}</div>`
      ).join('');
    }
    renderVaultCards();
  }

  function renderVaultCards() {
    const PHASE1 = [
      { id:'VAULT-02', label:'Vault 2', tag:'Foundation', note:'Guided practice with tips and sample answers.', isMock:false },
      { id:'VAULT-03', label:'Vault 3', tag:'Foundation', note:'Consolidate foundation skills before Mock 1.', isMock:false },
      { id:'MOCK-01',  label:'Mock MUET Practice 1', tag:'🎯 Practice Exam Simulation', note:'Full 4 components · strict timing · practice Band estimate.', isMock:true }
    ];
    const PHASE2 = [
      { id:'VAULT-04', label:'Vault 4', tag:'Building Strength', note:'Question type awareness · deeper practice.', isMock:false },
      { id:'VAULT-05', label:'Vault 5', tag:'Building Strength', note:'Component-level timing introduced.', isMock:false },
      { id:'VAULT-06', label:'Vault 6', tag:'Building Strength', note:'Writing thesis and Speaking interaction focus.', isMock:false },
      { id:'MOCK-02',  label:'Mock MUET Practice 2', tag:'🎯 Progress Check', note:'Full exam · compare with Mock 1 · identify weak areas.', isMock:true }
    ];
    const PHASE3 = [
      { id:'VAULT-07', label:'Vault 7', tag:'Final Preparation', note:'Advanced practice · near-exam conditions.', isMock:false },
      { id:'VAULT-08', label:'Vault 8', tag:'Final Preparation', note:'Timed · mistake pattern focus.', isMock:false },
      { id:'VAULT-09', label:'Vault 9', tag:'Final Preparation', note:'Last full practice before final mock.', isMock:false },
      { id:'MOCK-03',  label:'Mock MUET Practice 3', tag:'🎯 Final Readiness Check', note:'Full exam · final Band report · intervention plan.', isMock:true }
    ];

    function vaultCard(v) {
      const prog       = MUET.vaultProgress(v.id);
      const hasAttempt = prog.count > 0;
      const unlocked   = isVaultUnlocked(v.id);
      const hasPage    = !!VAULT_PAGES[v.id];
      const clickable  = unlocked && hasPage;
      const accentColor = v.isMock ? 'var(--pink)' : 'var(--yellow)';
      const borderColor = v.isMock ? '#f472b6' : (unlocked ? '#0f172a' : '#94a3b8');
      const bgColor     = v.isMock ? '#fdf2f8' : 'white';
      const tagColor    = v.isMock ? '#db2777' : '#94a3b8';
      const labelColor  = v.isMock ? 'var(--ink)' : '#64748b';
      const noteColor   = v.isMock ? '#9d174d' : '#94a3b8';
      const icon        = v.isMock ? '📋' : (unlocked ? '🔓' : '🔒');
      const statusText  = v.isMock ? 'Coming soon'
                         : !unlocked ? 'Locked'
                         : hasPage ? 'Start →'
                         : 'Unlocked · Coming soon';
      const clickAttr   = clickable ? ` onclick="Hub.openVault('${v.id}')" style="cursor:pointer"` : '';

      if (hasAttempt) {
        const pct    = Math.round(prog.count / 4 * 100);
        const icons  = ['🎤','📖','🎧','✍️'];
        const skills = ['speaking','reading','listening','writing'];
        return `<div${clickAttr} style="background:var(--paper);border:var(--line);box-shadow:var(--shadow);border-radius:20px;padding:14px${clickable ? ';cursor:pointer' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px">
            <div>
              <div style="font-size:9px;font-weight:1000;text-transform:uppercase;letter-spacing:.1em;color:var(--muted)">${v.tag}</div>
              <div style="font-family:'Sora';font-weight:800;font-size:16px">${v.label}</div>
            </div>
            <div style="background:${accentColor};border:var(--line);border-radius:999px;padding:5px 10px;font-size:11px;font-weight:1000;white-space:nowrap">${prog.count}/4 Done</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:10px">
            ${skills.map((s,si) => `<div style="background:${prog.done[s]?accentColor:'white'};border:var(--line);border-radius:10px;padding:6px 4px;text-align:center;font-size:14px">${icons[si]}</div>`).join('')}
          </div>
          <div style="background:#e2e8f0;border-radius:8px;height:8px;border:2px solid var(--ink);overflow:hidden">
            <div style="background:var(--ink);height:100%;width:${pct}%;transition:width .3s"></div>
          </div>
        </div>`;
      }

      return `<div${clickAttr} style="border:3px ${unlocked ? 'solid' : 'dashed'} ${borderColor};border-radius:20px;padding:14px;background:${bgColor}${clickable ? ';cursor:pointer' : ''}">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:44px;height:44px;min-width:44px;border:2px solid ${borderColor};border-radius:50%;display:grid;place-items:center;font-size:20px;background:white">${icon}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:9px;font-weight:1000;text-transform:uppercase;letter-spacing:.1em;color:${tagColor};margin-bottom:2px">${v.tag}</div>
            <div style="font-family:'Sora';font-weight:800;font-size:15px;color:${labelColor}">${v.label}</div>
            <div style="font-size:11px;font-weight:800;color:${noteColor};margin-top:2px">${v.note}</div>
          </div>
          <div style="font-size:10px;font-weight:1000;color:${tagColor};white-space:nowrap">${statusText}</div>
        </div>
      </div>`;
    }

    const g1 = document.getElementById('phase1Grid');
    const g2 = document.getElementById('phase2Grid');
    const g3 = document.getElementById('phase3Grid');
    if (g1) g1.innerHTML = PHASE1.map(v => vaultCard(v)).join('');
    if (g2) g2.innerHTML = PHASE2.map(v => vaultCard(v)).join('');
    if (g3) g3.innerHTML = PHASE3.map(v => vaultCard(v)).join('');
  }

  function openVault(vaultId) {
    if (!isVaultUnlocked(vaultId)) {
      const idx = VAULT_ORDER.indexOf(vaultId);
      const prevLabel = idx > 0 ? (VAULT_LABELS[VAULT_ORDER[idx - 1]] || 'the previous vault') : '';
      MUET.toast(`Complete all 4 components of ${prevLabel} first to unlock ${VAULT_LABELS[vaultId] || vaultId}.`);
      return;
    }
    const vault = (MUET.VAULT_MAP && MUET.VAULT_MAP[vaultId]) || { id: vaultId, title: VAULT_LABELS[vaultId] || vaultId, type: 'practice' };
    MUET.saveActiveVault({ vaultId: vault.id, vaultTitle: vault.title, vaultType: vault.type });
    MUET.goPage(resolveVaultPage(vaultId));
  }

  function progTab(id) {
    ['dash','vaults','badges'].forEach(t => {
      document.getElementById('prog-'+t).style.display    = t === id ? 'block' : 'none';
      document.getElementById('ptab-'+t).classList.toggle('prog-tab-active', t === id);
    });
    if (id === 'vaults') renderVaultHistory();
    if (id === 'badges') renderBadges();
  }

  const SKILLS_LIST = [
    ['speaking','Speaking','🎤','#0757ff','white'],
    ['reading','Reading','📖','#19d58a','var(--ink)'],
    ['listening','Listening','🎧','#ffc400','var(--ink)'],
    ['writing','Writing','✍️','#ff70b8','var(--ink)']
  ];

  const ALL_VAULTS = [
    { id:'VAULT-01', label:'Vault 1',      type:'practice', accentColor:'var(--yellow)' },
    { id:'VAULT-02', label:'Vault 2',      type:'practice', accentColor:'var(--yellow)' },
    { id:'VAULT-03', label:'Vault 3',      type:'practice', accentColor:'var(--yellow)' },
    { id:'MOCK-01',  label:'Mock MUET Practice 1',  type:'mock',     accentColor:'var(--pink)'   },
    { id:'VAULT-04', label:'Vault 4',      type:'practice', accentColor:'var(--yellow)' },
    { id:'VAULT-05', label:'Vault 5',      type:'practice', accentColor:'var(--yellow)' },
    { id:'VAULT-06', label:'Vault 6',      type:'practice', accentColor:'var(--yellow)' },
    { id:'MOCK-02',  label:'Mock MUET Practice 2',  type:'mock',     accentColor:'var(--pink)'   },
    { id:'VAULT-07', label:'Vault 7',      type:'practice', accentColor:'var(--yellow)' },
    { id:'VAULT-08', label:'Vault 8',      type:'practice', accentColor:'var(--yellow)' },
    { id:'VAULT-09', label:'Vault 9',      type:'practice', accentColor:'var(--yellow)' },
    { id:'MOCK-03',  label:'Mock MUET Practice 3',  type:'mock',     accentColor:'var(--pink)'   }
  ];

  function getVaultScore(vaultId, skill) {
    const list = MUET.loadSessions(skill);
    const hits = list.filter(s => s.vaultId === vaultId);
    if (!hits.length) return null;
    const l = hits[hits.length - 1];
    return l.score90 ?? l.score ?? null;
  }

  function renderProgress() {
    const allScores = {};
    SKILLS_LIST.forEach(([skill]) => { allScores[skill] = MUET.latestScore(skill); });
    const total = Object.values(allScores).reduce((s,v) => s+v, 0);
    const b     = MUET.calcBand(total);
    const pct   = Math.round(total / 360 * 100);

    document.getElementById('pd-band').textContent    = 'Band ' + b;
    document.getElementById('pd-bandmsg').textContent = MUET.bandMessage(b);
    document.getElementById('pd-pct').textContent     = pct + '%';
    document.getElementById('pd-disc').style.setProperty('--p', pct + '%');
    const tsEl = document.getElementById('totalScore');
    if (tsEl) tsEl.textContent = `${total} / 360  ·  Band ${b}`;

    const pr = document.getElementById('progRows');
    if (pr) {
      pr.innerHTML = SKILLS_LIST.map(([skill, label, icon, color, tc]) => {
        const s  = allScores[skill];
        const pc = Math.round(s / 90 * 100);
        const bnd= MUET.scoreToBand(s);
        return `<div>
          <div style="display:flex;justify-content:space-between;font-weight:1000;margin-bottom:5px;align-items:center">
            <span>${icon} ${label}</span>
            <div style="display:flex;gap:8px;align-items:center">
              <span style="background:${color};color:${tc};border:2px solid var(--ink);border-radius:999px;padding:3px 9px;font-size:11px;font-weight:1000">Band ${bnd}</span>
              <span style="font-weight:1000">${s}/90</span>
            </div>
          </div>
          <div class="prog-bar"><span style="width:${pc}%;background:${color}"></span></div>
        </div>`;
      }).join('');
    }

    const p      = MUET.loadProfile();
    const target = p?.targetBand || '4.0';
    const targetScoreMap = { '3.5':164, '4.0':211, '4.5':258, '5.0':294, '5+':331 };
    const targetTotal = targetScoreMap[target] || 211;
    const gap         = Math.max(0, targetTotal - total);
    const gapEl = document.getElementById('pd-gap');
    if (gapEl) {
      if (total === 0) {
        gapEl.innerHTML = `Start your first vault to begin tracking your band gap.`;
      } else if (gap === 0) {
        gapEl.innerHTML = `🎉 You have reached your target Band ${target}! Consider pushing for a higher band.`;
      } else {
        const perComp = Math.ceil(gap / 4);
        gapEl.innerHTML = `
          <div>Your target: <b>Band ${target} (${targetTotal}/360)</b></div>
          <div style="margin-top:6px">Current total: <b>${total}/360</b></div>
          <div style="margin-top:6px">Gap to close: <b>${gap} marks</b> — approximately <b>${perComp} marks per component</b></div>
          <div style="margin-top:8px;background:white;border:2px solid var(--ink);border-radius:12px;padding:10px">
            ${SKILLS_LIST.map(([skill,label,icon]) => {
              const needed = Math.max(0, Math.ceil(targetTotal/4) - allScores[skill]);
              return `<div>${icon} ${label}: ${needed > 0 ? `need +${needed} more` : '✅ on track'}</div>`;
            }).join('')}
          </div>`;
      }
    }

    const fr = document.getElementById('feedbackRows');
    if (fr) {
      fr.innerHTML = SKILLS_LIST.map(([skill, label, icon]) => {
        const s   = allScores[skill];
        const fb  = MUET.feedbackText(skill, s);
        const clr = s >= 74 ? '#dcfce7' : s >= 53 ? '#fef9c3' : '#fce7f3';
        const list = MUET.loadSessions(skill);
        const last = list.length ? list[list.length-1] : null;
        const date = last?.date ? new Date(last.date).toLocaleDateString('en-MY',{day:'numeric',month:'short'}) : '—';
        return `<div style="background:${clr};border:2px solid var(--ink);border-radius:14px;padding:12px">
          <div style="display:flex;justify-content:space-between;font-weight:1000;margin-bottom:6px">
            <span>${icon} ${label}</span><small style="color:var(--muted)">${date}</small></div>
          <p style="font-size:13px;font-weight:800;margin:0;line-height:1.5">${fb}</p>
        </div>`;
      }).join('');
    }
  }

  function renderVaultHistory() {
    const vl = document.getElementById('vaultHistoryList');
    if (!vl) return;
    vl.innerHTML = ALL_VAULTS.map(v => {
      const vaultSessions = [];
      SKILLS_LIST.forEach(([skill]) => {
        const score = getVaultScore(v.id, skill);
        if (score !== null) vaultSessions.push(score);
      });
      const vaultTotal = vaultSessions.length === 4 ? vaultSessions.reduce((a,b)=>a+b,0) : null;
      const vaultBand  = vaultTotal ? MUET.calcBand(vaultTotal) : null;
      const allDone    = vaultSessions.length === 4;
      return `<div style="background:white;border:var(--line);border-radius:20px;padding:14px;box-shadow:var(--shadow)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <h3 style="margin:0;font-family:'Sora';font-size:16px;font-weight:800">${v.label}</h3>
          <span style="background:${v.accentColor};border:var(--line);border-radius:999px;padding:4px 10px;font-size:11px;font-weight:1000">${allDone ? 'Complete' : 'Incomplete'}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-top:10px">
          ${SKILLS_LIST.map(([skill, label, icon], idx) => {
            const score = vaultSessions[idx] || null;
            return `<div style="background:${score ? '#dcfce7' : '#f1f5f9'};border:2px solid var(--ink);border-radius:12px;padding:10px;text-align:center">
              <div style="font-size:14px;margin-bottom:4px">${icon}</div>
              <div style="font-family:'Sora';font-weight:800;font-size:14px">${score ? score + '/90' : '—'}</div>
            </div>`;
          }).join('')}
        </div>
        ${vaultTotal ? `<div style="margin-top:12px;background:#fef9c3;border:2px solid var(--ink);border-radius:12px;padding:10px;text-align:center;font-weight:1000">Total: ${vaultTotal}/360 · Band ${vaultBand}</div>` : ''}
      </div>`;
    }).join('');
  }

  function renderBadges() {
    const bg = document.getElementById('badgeGrid');
    if (!bg) return;
    bg.innerHTML = BADGES.map(([icon, label, id]) => {
      const earned = (MUET.loadProfile()?.badges || []).includes(id);
      return `<div style="background:${earned?'#fef9c3':'#e2e8f0'};border:2px solid var(--ink);border-radius:14px;padding:14px;text-align:center;opacity:${earned?'1':'.5'}">
        <div style="font-size:24px;margin-bottom:6px">${icon}</div>
        <div style="font-size:12px;font-weight:900">${label}</div>
      </div>`;
    }).join('');
  }

  function fillEdit() {
    const p = MUET.loadProfile() || {};
    document.getElementById('editName').value  = p.name || '';
    document.getElementById('editEmail').value = p.email || '';
    document.getElementById('editRegNo').value = p.regNo || '';
    document.getElementById('editGroup').value = p.group || '';
    document.getElementById('editBand').value  = p.targetBand || '4.0';
  }

  function resetAll() {
    if (!confirm('Reset all progress? This cannot be undone.')) return;
    localStorage.clear();
    sessionStorage.clear();
    MUET.toast('All data cleared. Reloading...');
    setTimeout(() => location.reload(), 500);
  }

  return {
    init, goTo, renderHome, renderVault, renderVaultCards, openVault,
    progTab, renderProgress, renderVaultHistory, renderBadges, fillEdit, resetAll
  };
})();

function toggleQI(el) {
  const exp = el.querySelector('.qi-expanded');
  if (exp) exp.style.display = exp.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => Hub.init());
