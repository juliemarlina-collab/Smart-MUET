/* =================================================
   MUET SmartHub — vault-hero.js
   Blueprint v3.3 — dynamic vault hero renderer
   Reads activeVault from localStorage so it works
   for both Starter Vault (VAULT-00) and Vault 1+
================================================= */

document.addEventListener('DOMContentLoaded', function () {
  const mount = document.getElementById('vaultHeroMount');
  if (!mount) return;

  // Read active vault context
  let vaultId    = 'VAULT-01';
  let vaultTitle = 'Vault 1';
  let vaultType  = 'practice';
  try {
    const av = JSON.parse(localStorage.getItem('muet_active_vault') || '{}');
    if (av.vaultId)    vaultId    = av.vaultId;
    if (av.vaultTitle) vaultTitle = av.vaultTitle;
    if (av.vaultType)  vaultType  = av.vaultType;
  } catch (_) {}

  // Progress count
  let count = 0;
  try {
    if (window.MUET && typeof MUET.vaultProgress === 'function') {
      count = MUET.vaultProgress(vaultId).count || 0;
    }
  } catch (_) {}

  // Vault-specific config
  const isStarter = vaultId === 'VAULT-00';
  const label     = isStarter ? 'Starter Vault · Sample Practice' : 'Foundation Practice Set 1';
  const title     = isStarter ? 'Starter Vault' : 'Vault 1 Guided Journey';
  const subtitle  = isStarter
    ? 'Learn the app flow using sample questions. Does not count toward your main vault scores.'
    : 'Start strong with guided MUET practice across all four tested components.';
  const image     = isStarter
    ? 'assets/heroes/welcome-hero.svg'           // reuse welcome hero for starter
    : 'assets/heroes/vault-1-guided-journey-card.png';

  const progressLabel = count === 4 ? '✅ All 4 Components Done' : `🏆 ${count} / 4 Completed`;

  mount.innerHTML = `
    <div class="vault-hero-wrap">
      <div class="vault-hero-card">
        <img
          src="${image}"
          alt="${title} hero image"
          class="vault-hero-image"
          onerror="this.style.display='none'"
        >
        <div class="vault-hero-caption">
          <div class="vault-hero-label">${label}</div>
          <h2 class="vault-hero-title">${title}</h2>
          <p class="vault-hero-subtitle">${subtitle}</p>
          <div class="vault-hero-meta">
            <div class="vault-meta-pill speaking">🎤<span>Speaking<br><small>800/2</small></span></div>
            <div class="vault-meta-pill reading">📖<span>Reading<br><small>800/3</small></span></div>
            <div class="vault-meta-pill listening">🎧<span>Listening<br><small>800/1</small></span></div>
            <div class="vault-meta-pill writing">✍️<span>Writing<br><small>800/4</small></span></div>
            <div class="vault-meta-pill progress" id="heroProgressChip">${progressLabel}</div>
          </div>
        </div>
      </div>
    </div>`;

  // Keep hero progress chip in sync whenever updateVaultProgress() runs
  const _origUpdate = window.updateVaultProgress;
  if (typeof _origUpdate === 'function') {
    window.updateVaultProgress = function () {
      _origUpdate();
      try {
        const prog = MUET.vaultProgress(vaultId);
        const chip = document.getElementById('heroProgressChip');
        if (chip) chip.textContent = prog.count === 4 ? '✅ All 4 Components Done' : `🏆 ${prog.count} / 4 Completed`;
      } catch (_) {}
    };
  }
});
