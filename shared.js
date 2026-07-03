/* ═══════════════════════════════════════
   醫院生存 note — 共用 JavaScript
   ═══════════════════════════════════════ */

// ── ACCORDION ──
function initAccordion() {
  document.querySelectorAll('.k-card').forEach(card => {
    const body = card.querySelector('.k-card-body');
    if (!body) return;
    card.addEventListener('click', e => {
      if (e.target.closest('.bm-btn')) return; // 書籤按鈕不觸發
      card.classList.toggle('expanded');
      body.classList.toggle('open');
    });
  });
}

// ── BOOKMARK ──
const BM_KEY = 'med-note-bookmarks-v2';

function getBMs()       { try { return JSON.parse(localStorage.getItem(BM_KEY)) || []; } catch { return []; } }
function saveBMs(bms)   { localStorage.setItem(BM_KEY, JSON.stringify(bms)); }
function isBM(id)       { return getBMs().some(b => b.id === id); }

function toggleBM(id) {
  const el = document.querySelector(`[data-bm-id="${id}"]`);
  if (!el) return;
  let bms = getBMs();
  if (isBM(id)) {
    bms = bms.filter(b => b.id !== id);
  } else {
    bms.push({ id, dept: el.dataset.bmDept || '', title: el.dataset.bmTitle || '', url: window.location.pathname + '#' + id });
  }
  saveBMs(bms);
  renderBMPanel();
  updateBMBtns();
}

function updateBMBtns() {
  document.querySelectorAll('.bm-btn').forEach(btn => {
    const id = btn.closest('[data-bm-id]')?.dataset.bmId;
    if (!id) return;
    btn.classList.toggle('active', isBM(id));
    btn.title = isBM(id) ? '移除書籤' : '加入書籤';
  });
  const count = getBMs().length;
  const countEl = document.getElementById('bm-count');
  if (countEl) { countEl.textContent = count; countEl.classList.toggle('show', count > 0); }
}

function renderBMPanel() {
  const list = document.getElementById('bm-list');
  if (!list) return;
  const bms = getBMs();
  if (bms.length === 0) {
    list.innerHTML = '<div class="bm-empty">還沒有書籤<br/>點標題旁的書籤圖示加入</div>';
    return;
  }
  list.innerHTML = bms.map(b => `
    <a class="bm-item" href="${b.url || '#' + b.id}">
      <div class="bm-item-text">
        <div class="bm-item-dept">${b.dept}</div>
        <div class="bm-item-title">${b.title}</div>
      </div>
      <button class="bm-remove" onclick="event.preventDefault();event.stopPropagation();removeBM('${b.id}')">✕</button>
    </a>
  `).join('');
}

function removeBM(id) {
  saveBMs(getBMs().filter(b => b.id !== id));
  renderBMPanel(); updateBMBtns();
}

function initBookmark() {
  document.querySelectorAll('.bm-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.closest('[data-bm-id]')?.dataset.bmId;
      if (id) toggleBM(id);
    });
  });
  const navBtn  = document.getElementById('nav-bm-btn');
  const panel   = document.getElementById('bm-panel');
  const closeBtn= document.getElementById('bm-close');
  if (navBtn && panel) {
    navBtn.addEventListener('click', () => panel.classList.toggle('open'));
    closeBtn?.addEventListener('click', () => panel.classList.remove('open'));
  }
  updateBMBtns();
  renderBMPanel();
}

// ── SEARCH ──
function initSearch(index) {
  const input    = document.getElementById('search-input');
  const dropdown = document.getElementById('search-dropdown');
  if (!input || !dropdown) return;

  function hl(text, q) {
    return text.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi'), '<mark>$1</mark>');
  }
  function excerpt(text, q, len=80) {
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return text.slice(0, len) + '…';
    const s = Math.max(0, i-20), e = Math.min(text.length, i+len);
    return (s>0?'…':'') + text.slice(s,e) + (e<text.length?'…':'');
  }

  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (!q) { dropdown.classList.remove('open'); return; }
    const results = index.filter(r =>
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      r.text.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 7);
    dropdown.innerHTML = results.length
      ? results.map(r => `<a class="search-result-item" href="${r.url}">
          <div class="search-result-dept">${r.dept}</div>
          <div class="search-result-title">${hl(r.title,q)}</div>
          <div class="search-result-excerpt">${hl(excerpt(r.text,q),q)}</div>
        </a>`).join('')
      : `<div class="search-empty">找不到「${q}」的相關內容</div>`;
    dropdown.classList.add('open');
  });
  input.addEventListener('keydown', e => { if (e.key==='Escape') { dropdown.classList.remove('open'); input.blur(); } });
  document.addEventListener('click', e => { if (!input.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.remove('open'); });
}

// ── SIDEBAR ACTIVE ON SCROLL ──
function initScrollSpy() {
  const blocks = document.querySelectorAll('.topic-block');
  const links  = document.querySelectorAll('.sidebar-link[href^="#"]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const a = document.querySelector(`.sidebar-link[href="#${entry.target.id}"]`);
        if (a) a.classList.add('active');
      }
    });
  }, { rootMargin: '-60px 0px -60% 0px' });
  blocks.forEach(b => obs.observe(b));
}

// ── INIT ALL ──
document.addEventListener('DOMContentLoaded', () => {
  initAccordion();
  initBookmark();
  initScrollSpy();
  // initSearch 由各頁面自行呼叫（需傳入各頁搜尋索引）
});
