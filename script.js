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
    const list = photos(); if (!list.length || !dialog()) return;
    active = (index + list.length) % list.length;
    dialog().querySelector('img').src = list[active].dataset.photo;
    dialog().querySelector('img').alt = list[active].querySelector('img').alt;
    document.querySelector('#photo-counter').textContent = `${String(active + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
  };
  on(document, 'click', (event) => {
    const target = event.target.closest('a,button,dialog');
    if (!target) return;
    if (target.matches('.menu-toggle')) toggleMenu(target.getAttribute('aria-expanded') !== 'true');
    if (target.matches('nav a, header .logo, .header-contact')) toggleMenu(false);
    if (target.matches('[data-photo]') && dialog()) { showPhoto(photos().indexOf(target)); dialog().showModal(); document.body.style.overflow = 'hidden'; }
    if (target.matches('.close-dialog')) dialog()?.close();
    if (target.matches('#previous')) showPhoto(active - 1);
    if (target.matches('#next')) showPhoto(active + 1);
    if (dialog() && target === dialog()) { const r = target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) target.close(); }
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
    if (dialog()?.open) { if (event.key === 'ArrowRight') showPhoto(active + 1); if (event.key === 'ArrowLeft') showPhoto(active - 1); }
  });
  const carousel = document.querySelector('[data-carousel]');
  if (carousel) {
    const track = carousel.querySelector('.carousel-track');
    const slides = [...carousel.querySelectorAll('.hero-slide')];
    const dots = [...carousel.querySelectorAll('.carousel-dots button')];
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    let slide = 0, timer;
    const wskaznik = carousel.querySelector('.carousel-dots');
    const render = () => {
      track.style.transform = `translate3d(${-slide * 100}%,0,0)`;
      slides.forEach((el, i) => { el.classList.toggle('is-active', i === slide); el.toggleAttribute('aria-hidden', i !== slide); });
      dots.forEach((dot, i) => dot.toggleAttribute('aria-current', i === slide));
      // Licznik i linia postępu - widoczne tylko na wąskich ekranach (patrz CSS).
      if (wskaznik) {
        const nr = String(slide + 1).padStart(2, '0');
        const ile = String(slides.length).padStart(2, '0');
        wskaznik.setAttribute('data-licznik', `${nr}/${ile}`);
        wskaznik.style.setProperty('--postep', `${((slide + 1) / slides.length) * 100}%`);
      }
    };
    // Autoplay chodzi bez przerwy; każda interakcja tylko resetuje odliczanie.
    const start = () => {
      clearInterval(timer);
      if (!still.matches) timer = setInterval(() => { slide = (slide + 1) % slides.length; render(); }, 5000);
    };
    const goTo = (index) => {
      slide = (index + slides.length) % slides.length;
      render();
      start();
    };
    on(carousel, 'click', event => {
      const hit = event.target.closest('.carousel-dots button');
      if (hit) goTo(dots.indexOf(hit));
    });
    // Przeciąganie myszą i palcem - jedyny sposób przewijania poza kropkami.
    let startX = null, dragging = false;
    on(carousel, 'pointerdown', event => {
      if (event.target.closest('.carousel-dots')) return;
      startX = event.clientX; dragging = true;
      carousel.setPointerCapture?.(event.pointerId);
    });
    on(carousel, 'pointermove', event => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      // podąża za palcem, żeby gest był wyczuwalny
      track.style.transition = 'none';
      track.style.transform = `translate3d(calc(${-slide * 100}% + ${dx}px),0,0)`;
    });
    const endDrag = (event) => {
      if (!dragging) return;
      dragging = false;
      track.style.transition = '';
      const dx = event.clientX - startX; startX = null;
      if (Math.abs(dx) > 50) goTo(slide + (dx < 0 ? 1 : -1)); else goTo(slide);
    };
    on(carousel, 'pointerup', endDrag);
    on(carousel, 'pointercancel', endDrag);
    on(carousel, 'dragstart', event => event.preventDefault());
    // Strzałki klawiatury działają, gdy karuzela ma fokus.
    carousel.tabIndex = 0;
    carousel.setAttribute('aria-label', 'Realizacje - użyj strzałek lub przeciągnij');
    on(carousel, 'keydown', event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); goTo(slide + 1); }
      if (event.key === 'ArrowLeft')  { event.preventDefault(); goTo(slide - 1); }
    });
    on(document, 'visibilitychange', () => { if (document.hidden) clearInterval(timer); else start(); });
    goTo(0);
  }

  const breakpoint = matchMedia('(max-width: 680px)');
  on(breakpoint, 'change', event => { if (!event.matches) toggleMenu(false); });
})();

/* Baner zgód sterujący Google Consent Mode v2.
   Wybór trafia do localStorage, a przy kolejnych wizytach jest odtwarzany
   w <head> jeszcze przed załadowaniem GTM. */
(() => {
  const baner = document.getElementById('zgody');
  if (!baner) return;
  const KLUCZ = 'bazzo-zgody';
  const szczegoly = baner.querySelector('#zgody-szczegoly');
  const wiecej = baner.querySelector('[data-zgoda="ustawienia"]');
  const analityka = baner.querySelector('#zg-analityka');
  const marketing = baner.querySelector('#zg-marketing');

  const zapisz = (wybor) => {
    try { localStorage.setItem(KLUCZ, JSON.stringify(wybor)); } catch (e) {}
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        ad_storage: wybor.marketing ? 'granted' : 'denied',
        ad_user_data: wybor.marketing ? 'granted' : 'denied',
        ad_personalization: wybor.marketing ? 'granted' : 'denied',
        analytics_storage: wybor.analityka ? 'granted' : 'denied',
        personalization_storage: wybor.analityka ? 'granted' : 'denied'
      });
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'zgody_zapisane', zgody: wybor });
    ukryj();
  };

  const wczytaj = () => {
    try { return JSON.parse(localStorage.getItem(KLUCZ)); } catch (e) { return null; }
  };

  let wracaFokusDo = null;

  const pokaz = () => {
    baner.setAttribute('data-widoczny', '');
    baner.setAttribute('aria-modal', 'true');
    document.body.classList.add('zgody-blokada');
  };

  const ukryj = () => {
    baner.removeAttribute('data-widoczny');
    baner.setAttribute('aria-modal', 'false');
    document.body.classList.remove('zgody-blokada');
    szczegoly.removeAttribute('data-otwarte');
    wiecej.setAttribute('aria-expanded', 'false');
    if (wracaFokusDo) { wracaFokusDo.focus(); wracaFokusDo = null; }
  };

  // Zamknąć bez wyboru można tylko wtedy, gdy zgoda już kiedyś zapadła.
  const mozeZamknac = () => !!wczytaj();

  // Checkboxy pokazują poprzedni wybór, żeby ponowne wejście w ustawienia
  // nie sugerowało, że wszystko jest odznaczone.
  const zapisany = wczytaj();
  if (zapisany) {
    analityka.checked = !!zapisany.analityka;
    marketing.checked = !!zapisany.marketing;
  } else {
    pokaz();
    // Po animacji wjazdu, żeby fokus nie przepadł przy starcie strony.
    requestAnimationFrame(() => baner.querySelector('[data-zgoda="wszystko"]').focus());
  }

  // Gdy wybór jest wymagany, fokus nie może uciec poza modal (np. na pasek adresu
  // i z powrotem na stronę pod spodem).
  document.addEventListener('focusin', (event) => {
    if (!baner.hasAttribute('data-widoczny') || mozeZamknac()) return;
    if (!baner.contains(event.target)) {
      baner.querySelector('[data-zgoda="wszystko"]').focus();
    }
  });

  baner.addEventListener('click', (event) => {
    const akcja = event.target.closest('[data-zgoda]')?.dataset.zgoda;
    if (!akcja) return;
    if (akcja === 'ustawienia') {
      const otwarte = szczegoly.hasAttribute('data-otwarte');
      szczegoly.toggleAttribute('data-otwarte', !otwarte);
      wiecej.setAttribute('aria-expanded', String(!otwarte));
      return;
    }
    if (akcja === 'wszystko') zapisz({ analityka: true, marketing: true });
    if (akcja === 'nic') zapisz({ analityka: false, marketing: false });
    if (akcja === 'wybrane') zapisz({ analityka: analityka.checked, marketing: marketing.checked });
  });

  // Ponowne otwarcie ustawień z linku "Pliki cookie" w stopce
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href="#zgody"]');
    if (!link) return;
    event.preventDefault();
    const teraz = wczytaj();
    if (teraz) {
      analityka.checked = !!teraz.analityka;
      marketing.checked = !!teraz.marketing;
    }
    wracaFokusDo = link;
    pokaz();
    szczegoly.setAttribute('data-otwarte', '');
    wiecej.setAttribute('aria-expanded', 'true');
    analityka.focus();
  });

  // Klik w przyciemnione tło zamyka - ale tylko przy zmianie zdania,
  // nie przy pierwszej wizycie, gdzie wybór jest wymagany.
  baner.addEventListener('mousedown', (event) => {
    if (event.target === baner && mozeZamknac()) ukryj();
  });

  document.addEventListener('keydown', (event) => {
    if (!baner.hasAttribute('data-widoczny')) return;

    if (event.key === 'Escape') {
      if (mozeZamknac()) ukryj();
      return;
    }

    // Fokus nie wychodzi poza modal, dopóki wybór nie zapadł.
    if (event.key !== 'Tab') return;
    const pola = [...baner.querySelectorAll('button, input:not(:disabled), a[href]')]
      .filter(el => el.offsetParent !== null);
    if (!pola.length) return;
    const pierwszy = pola[0];
    const ostatni = pola[pola.length - 1];
    if (event.shiftKey && document.activeElement === pierwszy) {
      event.preventDefault();
      ostatni.focus();
    } else if (!event.shiftKey && document.activeElement === ostatni) {
      event.preventDefault();
      pierwszy.focus();
    }
  });
})();
