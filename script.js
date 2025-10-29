// script.js — safe to use on all pages; it only runs features that exist on the page.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // === CHARACTERS PAGE ONLY ===
  if (document.title.toLowerCase().includes('characters')) {
    const tabRosterBtn = $('.tab[data-tab="roster"]');
    const tabEditorBtn = $('.tab[data-tab="editor"]');
    const tabRoster = $('#tab-roster');
    const tabEditor = $('#tab-editor');

    const goTab = (key) => {
      if (!tabRoster || !tabEditor) return;
      [tabRosterBtn, tabEditorBtn].forEach(b => b && b.classList.remove('active'));
      if (key === 'roster') {
        tabRoster.style.display = 'block';
        tabEditor.style.display = 'none';
        tabRosterBtn && tabRosterBtn.classList.add('active');
      } else {
        tabRoster.style.display = 'none';
        tabEditor.style.display = 'block';
        tabEditorBtn && tabEditorBtn.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    tabRosterBtn && tabRosterBtn.addEventListener('click', () => goTab('roster'));
    tabEditorBtn && tabEditorBtn.addEventListener('click', () => goTab('editor'));

    // Add Character → jump to editor
    $('#btn-add') && $('#btn-add').addEventListener('click', () => goTab('editor'));

    // Sparkles toggle (visual only for now)
    const sparkBtn = $$('.pill').find(b => b.textContent.trim().toLowerCase().startsWith('sparkles'));
    if (sparkBtn) {
      sparkBtn.addEventListener('click', () => {
        document.body.classList.toggle('sparkles-off');
        sparkBtn.textContent = document.body.classList.contains('sparkles-off') ? 'Sparkles On' : 'Sparkles Off';
      });
    }

    // Search → filter cards by name, tags, or text in the card
    const search = $('#search');
    const cardsWrap = $('.cards');
    const getCardText = (card) => card.textContent.toLowerCase();
    const applySearch = () => {
      if (!cardsWrap) return;
      const q = (search?.value || '').toLowerCase().trim();
      $$('.card', cardsWrap).forEach(card => {
        const hit = !q || getCardText(card).includes(q);
        card.style.display = hit ? '' : 'none';
      });
    };
    search && search.addEventListener('input', applySearch);

    // Roster card actions via event delegation
    cardsWrap && cardsWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const card = e.target.closest('.card');
      if (!card) return;
      const name = $('.name', card)?.textContent?.trim() || 'Character';

      const label = btn.textContent.trim().toLowerCase();
      if (label.startsWith('use in writer')) {
        window.location.href = `story-writer.html?char=${encodeURIComponent(name)}`;
      } else if (label.startsWith('use in chat')) {
        // Until chat page exists, route to writer with #chat so it isn’t dead
        window.location.href = `story-writer.html#chat?char=${encodeURIComponent(name)}`;
      } else if (label === 'edit') {
        goTab('editor');
      } else if (label === 'duplicate') {
        const clone = card.cloneNode(true);
        cardsWrap.appendChild(clone);
      } else if (label === 'favorite') {
        card.classList.toggle('is-fav');
        btn.classList.toggle('primary');
      } else if (label === 'delete') {
        card.remove();
      }
    });

    // Export visible cards as JSON (preview-level)
    const collectCards = () => {
      return $$('.card', cardsWrap).filter(c => c.style.display !== 'none').map(c => ({
        name: $('.name', c)?.textContent?.trim() || '',
        tags: $$('.tag', c).map(t => t.textContent.trim()),
        avatar: $('.avatar', c)?.getAttribute('src') || ''
      }));
    };
    $('#btn-export') && $('#btn-export').addEventListener('click', () => {
      const data = { version: 1, exportedAt: new Date().toISOString(), cards: collectCards() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'characters.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });

    // Import JSON → render quick cards (preview-level)
    $('#btn-import') && $('#btn-import').addEventListener('click', async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const text = await file.text();
        let data;
        try { data = JSON.parse(text); } catch { alert('Invalid JSON'); return; }
        if (!Array.isArray(data.cards)) { alert('JSON missing "cards" array'); return; }
        data.cards.forEach(c => {
          const el = document.createElement('article');
          el.className = 'card';
          el.innerHTML = `
            <div class="top">
              <img class="avatar" src="${(c.avatar||'').replace(/"/g,'&quot;')}" alt="">
              <div>
                <div class="name">${(c.name||'Unnamed').replace(/</g,'&lt;')}</div>
                <div class="tags">${(c.tags||[]).map(t=>`<span class="tag">${String(t).replace(/</g,'&lt;')}</span>`).join('')}</div>
              </div>
            </div>
            <div class="actions">
              <button class="mini primary">Use in Chat</button>
              <button class="mini primary">Use in Writer</button>
              <button class="mini ghost">Edit</button>
              <button class="mini ghost">Duplicate</button>
              <button class="mini ghost">Favorite</button>
              <button class="mini ghost">Delete</button>
            </div>`;
          cardsWrap.appendChild(el);
        });
        goTab('roster');
      };
      input.click();
    });

    // Initial filter pass
    applySearch();
  }

  // === SITE-WIDE niceties can go here later ===

})();