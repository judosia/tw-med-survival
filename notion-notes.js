// notion-notes.js
// 前端載入 Notion 筆記並注入到各 topic-block
 
(function () {
  const API = 'https://tw-med-survival.vercel.app/api/notion-notes';
 
  // 在每個 topic-block 底部插入筆記區塊
  function injectNoteUI(blockEl, note) {
    // 避免重複插入
    if (blockEl.querySelector('.notion-note')) return;
 
    const div = document.createElement('div');
    div.className = 'notion-note';
    div.innerHTML = `
      <div class="notion-note-head">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        <span>我的筆記</span>
        <span class="notion-note-time">${formatTime(note.updated)}</span>
      </div>
      <div class="notion-note-body">${escapeHtml(note.content)}</div>
    `;
    blockEl.appendChild(div);
  }
 
  function formatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} 更新`;
  }
 
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }
 
  // 主流程：fetch 所有筆記，依 block_id 注入
  async function loadNotes() {
    try {
      const res = await fetch(API);
      if (!res.ok) return;
      const { notes } = await res.json();
      if (!notes || notes.length === 0) return;
 
      notes.forEach((note) => {
        if (!note.block_id || !note.content || !note.show) return;
        const blockEl = document.getElementById(note.block_id);
        if (blockEl) injectNoteUI(blockEl, note);
      });
    } catch (e) {
      // 靜默失敗（網路問題或筆記為空時不影響正常使用）
      console.debug('[notion-notes] 無法載入筆記:', e.message);
    }
  }
 
  // DOM ready 後執行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNotes);
  } else {
    loadNotes();
  }
})();
