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
    const webp = list[active].dataset.photoWebp;
    dialog().querySelector('source').srcset = webp || '';
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
  const carousel = document.querySelector('[data-carousel]');
  if (carousel) {
    const track = carousel.querySelector('.carousel-track');
    const slides = [...carousel.querySelectorAll('.hero-slide')];
    const dots = [...carousel.querySelectorAll('.carousel-dots button')];
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    let slide = 0, timer;
    const render = () => {
      track.style.transform = `translate3d(${-slide * 100}%,0,0)`;
      slides.forEach((el, i) => { el.classList.toggle('is-active', i === slide); el.toggleAttribute('aria-hidden', i !== slide); });
      dots.forEach((dot, i) => dot.toggleAttribute('aria-current', i === slide));
    };
    const goTo = (index, resume = true) => {
      slide = (index + slides.length) % slides.length;
      render();
      clearInterval(timer);
      if (resume && !still.matches) timer = setInterval(() => goTo(slide + 1, false), 6000);
    };
    on(carousel, 'click', event => {
      const hit = event.target.closest('.carousel-arrow, .carousel-dots button');
      if (!hit) return;
      if (hit.matches('.prev')) goTo(slide - 1);
      else if (hit.matches('.next')) goTo(slide + 1);
      else goTo(dots.indexOf(hit));
    });
    // Przeciąganie palcem na ekranach dotykowych.
    let startX = null;
    on(carousel, 'pointerdown', event => { startX = event.clientX; });
    on(carousel, 'pointerup', event => {
      if (startX === null) return;
      const dx = event.clientX - startX; startX = null;
      if (Math.abs(dx) > 45) goTo(slide + (dx < 0 ? 1 : -1));
    });
    on(document, 'visibilitychange', () => { if (document.hidden) clearInterval(timer); else goTo(slide); });
    goTo(0);
  }

  const breakpoint = matchMedia('(max-width: 680px)');
  on(breakpoint, 'change', event => { if (!event.matches) toggleMenu(false); });
})();
