/* ===== Edit your details here ===== */
const CONFIG = {
  email: 'llanesvincelouie@gmail.com', // placeholder: replace
  links: { // placeholders: replace with your real profile URLs
    github: 'https://github.com/vincellanes',
    linkedin: 'https://www.linkedin.com/in/llanes-vince',
    facebook: 'https://www.facebook.com/cien.allsen/',
    discord: 'https://discord.com/users/not.cien',
    telegram: 'https://t.me/baekcece'
  }
};
const D = 'assets/DEMO_REEL_WEBSITES/';// function for image directory cover 
// status values: 'Completed' or 'In Progress'
const PROJECTS = [
  {
    name: 'Flories Flower Shop', status: 'Completed', pos: 'center',
    desc: 'Multi-page flower shop with a collection catalog, occasions, cart, order lookup, contact page and an admin dashboard.',
    note: 'The pages open without a server; ordering and admin need PHP + MySQL (XAMPP).',
    tech: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL'], img: D + 'Flories/images/banners/banner_intro.png',
    alt: 'Flories home page banner: A Bouquet for Every Occasion', url: D + 'Flories/index.html'
  },
  {
    name: 'House of Origami', status: 'Completed',
    desc: 'Four-page site about the art of paper folding, with lessons, an about page, a contact page and custom fonts.',
    tech: ['HTML', 'CSS'], img: D + 'ORIGAMI/images/origami_home_pic.jpeg',
    alt: 'House of Origami home page', url: D + 'ORIGAMI/html/index.html'
  },
  {
    name: 'Going Shop Shop', status: 'Completed',
    desc: 'Mini merch store: product cards with prices, a Buy Now order page and a confirmation that returns to the shop.',
    tech: ['HTML', 'CSS', 'JavaScript'], img: D + 'MINIORDERWEB/miniorder.jpeg',
    alt: 'Going Shop Shop product page', url: D + 'MINIORDERWEB/homepage.html'
  },
  {
    name: 'Messenger Replica', status: 'Completed',
    desc: 'Dark chat-list screen with tabs, a search bar, online indicators and unread markers.',
    tech: ['HTML', 'CSS'], img: D + 'MESSENGER REPLICA/messenger_pic.jpeg',
    alt: 'Messenger replica chat list', url: D + 'MESSENGER REPLICA/index.html'
  },
  {
    name: 'Login UI', status: 'Completed',
    desc: 'Split-screen login page with a curved divider, and a mobile layout that moves the buttons to the left pane.',
    tech: ['HTML', 'CSS'], img: D + 'LOGIN UI/basic_UI.jpeg',
    alt: 'Login page with an orange curved panel', url: D + 'LOGIN UI/index.html'
  }
];
// Certificate images: put files in assets/certificates/ and add { cat, img } below.
// Entries without img show an empty image placeholder. Paths start with ../ (this page lives in html/).
const CATS = ['Certificates', 'Awards', 'Competitions', 'Academic'];
const CERTS = [
  { cat: 'Certificates', img: 'assets/images/old_cert1.jpg' }, { cat: 'Certificates', img: 'assets/images/plv_cert1.jpg' },
  { cat: 'Certificates', img: 'assets/images/plv_cert2.jpg' },
  { cat: 'Certificates', img: 'assets/images/intro_cert1.png' }, { cat: 'Certificates', img: 'assets/images/cert1.png' },
  { cat: 'Certificates', img: 'assets/images/cert2.png' }, { cat: 'Certificates', img: 'assets/images/cert3.png' },
  { cat: 'Certificates', img: 'assets/images/cert4.png' }, { cat: 'Certificates', img: 'assets/images/cert5.png' },
  { cat: 'Certificates', img: 'assets/images/cert6.png' }
  // e.g. { cat: 'Certificates', img: '../assets/certificates/cisco-networking.jpg' }
];
const LINKS = [
  ['email', 'Email', 'assets/logo_svg/gmail.svg'], ['github', 'GitHub', 'assets/logo_svg/github_dark.svg'],
  ['linkedin', 'LinkedIn', 'assets/logo_svg/linked.svg'], ['facebook', 'Facebook', 'assets/logo_svg/facebook-icon.svg'],
  ['discord', 'Discord', 'assets/logo_svg/discord.svg'], ['telegram', 'Telegram', 'assets/logo_svg/telegram.svg']
];

/* ===== Code ===== */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Profile photo: shows assets/profile.jpg if it exists, otherwise the placeholder
  const photo = $('#portrait'), fig = photo.closest('figure');
  const gotPhoto = () => fig.classList.add('has-photo');
  photo.complete && photo.naturalWidth ? gotPhoto() : photo.addEventListener('load', gotPhoto);

  // Projects
  const card = (p, rv) => `<article class="card glass${rv ? ' rv' : ''}">
    <div class="media"><img src="${encodeURI(p.img)}" alt="${esc(p.alt)}" loading="lazy" style="--pos:${p.pos || 'top'}"></div>
    <div class="body"><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p>${p.note ? `<p class="note">${esc(p.note)}</p>` : ''}
    <ul class="tags">${p.tech.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <div class="foot-row"><span class="status ${p.status === 'Completed' ? '' : 'wip'}">${esc(p.status)}</span>
    <a class="btn btn-sm btn-primary" href="${encodeURI(p.url)}" target="_blank" rel="noopener">View Project<span class="sr"> ${esc(p.name)}</span></a></div></div></article>`;
  $('#project-grid').innerHTML = PROJECTS.slice(0, 3).map(p => card(p, true)).join('');
  $('#modal-projects').innerHTML = PROJECTS.map(p => card(p, false)).join('');

  // Certificates overlay: image-only tiles, category tabs, in-page preview
  const tabs = ['All', ...CATS], tabBox = $('#cert-tabs'), grid = $('#cert-grid'), lightBody = $('#light-body');
  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 9"/></svg>';
  let current = 'All', shown = [];
  const showCerts = tab => {
    current = tab;
    $$('[role=tab]', tabBox).forEach(b => { const on = b.dataset.tab === tab; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    shown = CERTS.filter(c => tab === 'All' || c.cat === tab);
    grid.innerHTML = shown.length ? shown.map((c, i) => `<button class="cert${c.img ? ' has-img' : ''}" type="button" data-i="${i}" aria-label="View ${esc(c.cat)} image ${i + 1}">${c.img ? `<img src="${encodeURI(c.img)}" alt="" loading="lazy">` : ICON}</button>`).join('')
      : '<p class="empty">Nothing here yet. Add an entry to CERTS in script.js.</p>';
  };
  tabBox.innerHTML = tabs.map(t => `<button class="tab" role="tab" data-tab="${t}">${t}</button>`).join('');
  tabBox.addEventListener('click', e => { const b = e.target.closest('[role=tab]'); if (b) showCerts(b.dataset.tab); });
  tabBox.addEventListener('keydown', e => {
    const i = tabs.indexOf(current), k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (k === undefined) return;
    e.preventDefault(); showCerts(tabs[(k + tabs.length) % tabs.length]); $('[aria-selected=true]', tabBox).focus();
  });
  grid.addEventListener('click', e => {
    const b = e.target.closest('.cert'); if (!b) return;
    const c = shown[b.dataset.i];
    lightBody.innerHTML = c.img ? `<img src="${encodeURI(c.img)}" alt="${esc(c.cat)} image">` : `<div class="ph-big">${ICON}</div>`;
    openModal('lightbox', b);
  });
  showCerts('All');

  // Overlays: blur-only backdrop, focus trap, Esc, click outside. They can stack (preview over certificates).
  const lock = on => { $$('header,main,footer').forEach(el => el.inert = on); document.documentElement.style.overflow = on ? 'hidden' : ''; };
  const openModal = (id, trigger) => {
    const m = document.getElementById(id), under = $$('.overlay.open');
    under.forEach(o => o.inert = true);
    if (!under.length) lock(true);
    m._opener = trigger;
    m.classList.add('open'); m.setAttribute('aria-hidden', 'false');
    $('.close', m).focus();
    const v = $('video', m); if (v) { const pl = v.play(); if (pl && pl.catch) pl.catch(() => { }); }
  };
  const closeModal = m => {
    m.classList.remove('open'); m.setAttribute('aria-hidden', 'true');
    const v = $('video', m); if (v) v.pause();
    const rest = $$('.overlay.open');
    if (rest.length) rest[rest.length - 1].inert = false; else lock(false);
    if (m._opener) m._opener.focus();
  };
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-open]');
    if (t) return openModal(t.dataset.open, t);
    const m = e.target.closest('.overlay');
    if (m && (e.target === m || e.target.closest('.close'))) closeModal(m);
  });
  document.addEventListener('keydown', e => {
    const m = $$('.overlay.open').pop();
    if (!m) return;
    if (e.key === 'Escape') return closeModal(m);
    if (e.key !== 'Tab') return;
    const f = $$('button,a[href],video[controls],[tabindex="0"]', m).filter(x => x.offsetParent);
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // Mobile menu
  const burger = $('.burger'), menu = $('#menu');
  const setMenu = open => { menu.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu.addEventListener('click', e => e.target.closest('a') && setMenu(false));
  document.addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));

  // Current-section underline (extra sections belong to the nearest nav item)
  const group = { about: 'home', journey: 'projects', certificates: 'projects' };
  const spy = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    const key = group[en.target.id] || en.target.id;
    $$('.menu a').forEach(a => a.setAttribute('aria-current', a.dataset.nav === key));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));

  // Scroll reveal: replay animations whenever elements enter the viewport
  const rv = new IntersectionObserver(entries => {
    entries.forEach((entry, entryIndex) => {
      const element = entry.target;

      if (entry.isIntersecting) {
        element.style.setProperty(
          '--d',
          Math.min(entryIndex * 90, 360) + 'ms'
        );

        // Restart the animation when the element re-enters
        element.classList.remove('in');

        // Force the browser to recognize the reset
        void element.offsetWidth;

        element.classList.add('in');
      } else {
        // Reset the animation after the element leaves the viewport
        element.classList.remove('in');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -6% 0px'
  });
  $$('.rv').forEach(element => rv.observe(element));

  // Contact links and form
  $('#links').innerHTML = LINKS.map(([k, label, logo]) => {
    const href = k === 'email' ? 'mailto:' + CONFIG.email : CONFIG.links[k];
    const shown = k === 'email' ? CONFIG.email : href.replace(/^https?:\/\/(www\.)?/, '');
    return `<li><a href="${esc(href)}"${k === 'email' ? '' : ' target="_blank" rel="noopener"'}>
      ${logo ? `<img src="${logo}" alt="" class="${k === 'github' ? 'lg-dark' : ''}">` : '<span class="mk">in</span>'}
      <span>${label}<small>${esc(shown)}</small></span></a></li>`;
  }).join('');
  $('#contact-form').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, msg = $('#form-msg');
    if (!f.checkValidity()) { f.reportValidity(); msg.textContent = 'Please fill in every field with a valid email.'; return; }
    const d = new FormData(f);
    location.href = 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent('Portfolio message from ' + d.get('name')) +
      '&body=' + encodeURIComponent(d.get('message') + '\n\n' + d.get('name') + ' (' + d.get('email') + ')');
    msg.textContent = 'Your email app should open with the message ready to send.';
  });
  $('#year').textContent = new Date().getFullYear();

  // Smooth scrolling for in-page links (eased, so it stays smooth even if the browser ignores CSS smooth scroll)
  let glideId = 0;
  const glide = y => {
    const from = scrollY, dist = y - from, dur = Math.min(1100, 450 + Math.abs(dist) * .25), t0 = performance.now(), id = ++glideId;
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const step = now => {
      if (id !== glideId) return; // cancelled by the user scrolling
      const p = Math.min((now - t0) / dur, 1);
      scrollTo({ top: from + dist * ease(p), left: 0, behavior: 'instant' });
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  ['wheel', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, () => glideId++, { passive: true }));
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.classList.contains('skip') || reduce.matches) return;
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    glide(t.id === 'home' ? 0 : Math.max(0, t.getBoundingClientRect().top + scrollY - 20));
    try { history.pushState(null, '', '#' + t.id); } catch (err) { /* blocked on file:// pages; scrolling still works */ }
  });

  // Parallax stars background (CSS animates them; this only places them)
  const createStars = count => {
    const w = Math.max(2560, innerWidth), shadows = [];
    for (let i = 0; i < count; i++) shadows.push(`${Math.floor(Math.random() * w)}px ${Math.floor(Math.random() * 2560)}px #FFF`);
    return shadows.join(', ');
  };
  const smallStars = document.getElementById('stars-small');
  const mediumStars = document.getElementById('stars-medium');
  const largeStars = document.getElementById('stars-large');
  if (smallStars && mediumStars && largeStars) {
    smallStars.style.boxShadow = createStars(700);
    mediumStars.style.boxShadow = createStars(200);
    largeStars.style.boxShadow = createStars(100);
  }
})();
