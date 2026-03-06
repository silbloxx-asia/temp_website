/* ═══════════════════════════════════════════
   SILBLOXX ASIA — main.js
   - Language toggle (EN / VI) — SCE-style dropdown
   - Dynamic job listings from jobs.json
   - Job detail modal
═══════════════════════════════════════════ */

const APPLY_TO = 'sebastiaan.weyler@silbloxx.com';
const APPLY_CC = 'bertrand.vanmeenen@briamgroup.com';

const LANG_LABELS = { en: 'English', vi: 'Tiếng Việt' };
const LANG_OTHER  = {
  en: { lang: 'vi', label: 'Tiếng Việt' },
  vi: { lang: 'en', label: 'English' }
};

let currentLang = localStorage.getItem('sbx-lang') || 'en';

// ── Job helpers (global — used by inline onclick) ──
function buildApplyLink(job) {
  const subject = encodeURIComponent(
    `Application – ${currentLang === 'vi' ? job.title_vi : job.title_en} (${job.location})`
  );
  const body = encodeURIComponent(
    currentLang === 'vi'
      ? `Xin chào,\n\nTôi muốn ứng tuyển vào vị trí ${job.title_vi} tại ${job.location}.\n\nTrân trọng,`
      : `Dear Hiring Team,\n\nI would like to apply for the position of ${job.title_en} (${job.location}).\n\nKind regards,`
  );
  return `mailto:${APPLY_TO}?cc=${APPLY_CC}&subject=${subject}&body=${body}`;
}

function renderJobs(jobs) {
  const bar = document.getElementById('jobs-bar');
  if (!bar) return;
  if (!jobs.length) {
    bar.innerHTML = `<div class="job-row"><span class="job-title" style="opacity:0.5">${
      currentLang === 'vi' ? 'Hiện chưa có vị trí tuyển dụng' : 'No open positions at the moment'
    }</span></div>`;
    return;
  }
  bar.innerHTML = jobs.map(job => `
    <div class="job-row">
      <span class="job-title">
        ${currentLang === 'vi' ? job.title_vi : job.title_en}
        <span class="job-location">(${job.location})</span>
      </span>
      <div style="display:flex;gap:10px;align-items:center">
        <button class="btn btn-apply" onclick="openModal(${job.id})">
          ${currentLang === 'vi' ? 'Chi tiết công việc' : 'Job Details'}
        </button>
      </div>
    </div>
  `).join('');
}

async function loadJobs() {
  try {
    const res  = await fetch('jobs.json');
    const jobs = await res.json();
    window.__jobs = jobs;
    renderJobs(jobs);
  } catch (err) {
    console.warn('Could not load jobs.json:', err);
    window.__jobs = [];
    renderJobs([]);
  }
}

// global so inline onclick="openModal(id)" works
function openModal(jobId) {
  const job = (window.__jobs || []).find(j => j.id === jobId);
  if (!job) return;
  const title        = currentLang === 'vi' ? job.title_vi   : job.title_en;
  const desc         = currentLang === 'vi' ? job.description_vi : job.description_en;
  const type         = currentLang === 'vi' ? job.type_vi    : job.type_en;
  const modalContent = document.getElementById('modal-content');
  const overlay      = document.getElementById('modal-overlay');
  if (!modalContent || !overlay) return;
  modalContent.innerHTML = `
    <h2>${title}</h2>
    <div class="modal-meta">
      <span>📍 ${job.location}</span>
      <span>🕐 ${type}</span>
    </div>
    <div class="modal-desc">${desc.replace(/\n/g, '<br>')}</div>
    <a href="${buildApplyLink(job)}" class="btn btn-apply">
      ${currentLang === 'vi' ? 'Ứng tuyển ngay' : 'Apply Now'}
    </a>
  `;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  document.getElementById('modal-close').focus();
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// ══════════════════════════════════════════════
// All DOM wiring inside DOMContentLoaded —
// a missing element never crashes the whole page
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  // ── Language dropdown ────────────────────
  const langDropdown = document.getElementById('lang-dropdown');
  const langCurrent  = document.getElementById('lang-current');
  const langLabel    = document.getElementById('lang-label');
  const langMenu     = document.getElementById('lang-menu');

  function openDropdown() {
    langDropdown && langDropdown.classList.add('open');
    langCurrent  && langCurrent.setAttribute('aria-expanded', 'true');
  }
  function closeDropdown() {
    langDropdown && langDropdown.classList.remove('open');
    langCurrent  && langCurrent.setAttribute('aria-expanded', 'false');
  }

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('sbx-lang', lang);

    if (langLabel) langLabel.textContent = LANG_LABELS[lang];

    if (langMenu) {
      const other = LANG_OTHER[lang];
      langMenu.innerHTML = `<li><button class="lang-option" data-lang="${other.lang}" role="option">${other.label}</button></li>`;
      langMenu.querySelector('.lang-option').addEventListener('click', (e) => {
        setLanguage(e.currentTarget.dataset.lang);
        closeDropdown();
      });
    }

    document.querySelectorAll('[data-en][data-vi]').forEach(el => {
      const text = el.dataset[lang];
      if (text) el.innerHTML = text;
    });

    document.documentElement.lang = lang === 'vi' ? 'vi' : 'en';
    renderJobs(window.__jobs || []);
  }

  if (langCurrent) {
    langCurrent.addEventListener('click', (e) => {
      e.stopPropagation();
      langDropdown.classList.contains('open') ? closeDropdown() : openDropdown();
    });
  }

  document.addEventListener('click', (e) => {
    if (langDropdown && !langDropdown.contains(e.target)) closeDropdown();
  });

  // ── Hamburger ───────────────────────────
  const hamburger = document.getElementById('hamburger');
  const mainNav   = document.getElementById('main-nav');

  if (hamburger && mainNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
    });
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', false);
      });
    });
  }

  // ── Modal close handlers ─────────────────
  const modalClose = document.getElementById('modal-close');
  const overlay    = document.getElementById('modal-overlay');
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (overlay)    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // ── Init ─────────────────────────────────
  setLanguage(currentLang);
  loadJobs();
});
