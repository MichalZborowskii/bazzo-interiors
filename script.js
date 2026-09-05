(() => {
  if (window.bazzoCleanup) window.bazzoCleanup();
  const controller = new AbortController();
  const on = (target, name, handler, options = {}) => target.addEventListener(name, handler, { ...options, signal: controller.signal });
  window.bazzoCleanup = () => controller.abort();
  let active = 0;
  const photos = () => [...document.querySelectorAll('[data-photo]')];
  const dialog = () => document.querySelector('#lightbox');
  const toggleMenu = (open, restoreFocus = false) => {
    const menu = document.querySelector('.menu-toggle');
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
    document.querySelector('nav').classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    document.querySelector('main').inert = open;
    document.querySelector('footer').inert = open;
    document.querySelector('.menu-label').textContent = open ? 'ZAMKNIJ' : 'MENU';
    if (restoreFocus) menu.focus();
  };
  const showPhoto = (index) => {
    const list = photos(); active = (index + list.length) % list.length;
    dialog().querySelector('img').src = list[active].dataset.photo;
    dialog().querySelector('img').alt = list[active].querySelector('img').alt;
    document.querySelector('#photo-counter').textContent = `${String(active + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
  };
  on(document, 'click', (event) => {
    const target = event.target.closest('a,button,dialog');
    if (!target) return;
    if (target.matches('.menu-toggle')) toggleMenu(target.getAttribute('aria-expanded') !== 'true');
    if (target.matches('nav a, header .logo, .header-contact')) toggleMenu(false);
    if (target.matches('[data-photo]')) { showPhoto(photos().indexOf(target)); dialog().showModal(); document.body.style.overflow = 'hidden'; }
    if (target.matches('.close-dialog')) dialog().close();
    if (target.matches('#previous')) showPhoto(active - 1);
    if (target.matches('#next')) showPhoto(active + 1);
    if (target === dialog()) { const r = target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) target.close(); }
  });
  on(document, 'close', event => { if (event.target === dialog()) { document.body.style.overflow = ''; photos()[active]?.focus(); } }, { capture: true });
  on(document, 'keydown', event => {
    if (document.body.classList.contains('menu-open')) {
      if (event.key === 'Escape') toggleMenu(false, true);
      if (event.key === 'Tab') {
        const focusables = [...document.querySelectorAll('header a,header button')].filter(el => el.getClientRects().length);
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    if (dialog().open) { if (event.key === 'ArrowRight') showPhoto(active + 1); if (event.key === 'ArrowLeft') showPhoto(active - 1); }
  });
  const breakpoint = matchMedia('(max-width: 680px)');
  on(breakpoint, 'change', event => { if (!event.matches) toggleMenu(false); });
})();
