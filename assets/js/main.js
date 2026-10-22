(function () {
  'use strict';
  var root = document.documentElement;
  var PHONE = '962796673484';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var isRTL = function () { return root.dir === 'rtl'; };

  /* =========================================================
     Language
     ========================================================= */
  function setLang(l) {
    root.lang = l;
    root.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.title = l === 'ar' ? 'BRKX | بريكس من قصي قنديل' : 'BRKX | by Qusai Qandeel';
    try { localStorage.setItem('brkx-lang', l); } catch (e) {}
    updateWaLinks();
    if (ticker) ticker.measure();
  }
  var toggle = document.getElementById('langToggle');
  if (toggle) toggle.addEventListener('click', function () { setLang(root.lang === 'ar' ? 'en' : 'ar'); });

  /* =========================================================
     WhatsApp
     ========================================================= */
  var MSG = {
    general: { ar: 'مرحبا قصي، حابب أطلب من BRKX.', en: "Hi Qusai, I'd like to order from BRKX." },
    colours: { ar: 'مرحبا قصي، ممكن صور الألوان الثانية المتوفرة؟', en: 'Hi Qusai, could you send me photos of the other colours?' },
    size: { ar: 'مرحبا قصي، بدي مساعدة باختيار المقاس.\nطولي: \nوزني: ', en: 'Hi Qusai, could you help me with sizing?\nHeight: \nWeight: ' }
  };
  function orderText(colour, size) {
    if (root.lang === 'ar') return 'مرحبا قصي، بدي أطلب كنزة البولو المحبوكة.\nاللون: ' + colour + '\nالمقاس: ' + (size || 'بحاجة مساعدة');
    return "Hi Qusai, I'd like to order the knit polo.\nColour: " + colour + '\nSize: ' + (size || 'need help choosing');
  }
  function buildHref(a) {
    var type = a.getAttribute('data-msg') || 'general';
    var text;
    if (type === 'product') {
      var card = a.closest('.card');
      var sel = card && card.querySelector('.sizes [aria-checked="true"]');
      text = orderText(a.getAttribute('data-' + root.lang), sel ? sel.textContent.trim() : null);
    } else if (type === 'stage') {
      var act = document.querySelector('.stage__btn.is-active [data-l="' + root.lang + '"]');
      text = orderText(act ? act.textContent.trim() : '', null);
    } else {
      text = (MSG[type] || MSG.general)[root.lang];
    }
    return 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(text);
  }
  function updateWaLinks() {
    document.querySelectorAll('.js-wa').forEach(function (a) { a.href = buildHref(a); });
  }
  updateWaLinks();

  /* =========================================================
     Ripple + size pickers
     ========================================================= */
  function ripple(el, e) {
    if (reduce) return;
    var r = el.getBoundingClientRect();
    var s = document.createElement('span');
    s.className = 'ripple';
    s.style.left = ((e.clientX || r.left + r.width / 2) - r.left) + 'px';
    s.style.top = ((e.clientY || r.top + r.height / 2) - r.top) + 'px';
    el.appendChild(s);
    setTimeout(function () { s.remove(); }, 650);
  }
  document.querySelectorAll('.sizes').forEach(function (group) {
    group.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      ripple(b, e);
      var on = b.getAttribute('aria-checked') === 'true';
      group.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-checked', 'false'); });
      b.setAttribute('aria-checked', on ? 'false' : 'true');
      var link = group.parentNode.querySelector('.js-wa');
      if (link) link.href = buildHref(link);
    });
  });

  /* =========================================================
     Split headings into words
     ========================================================= */
  function splitEl(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          if (parts.join('').trim() === '') return;
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var inner = document.createElement('span'); inner.textContent = p; inner.style.setProperty('--i', i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          walk(n);
        }
      });
    })(el);
    el.classList.add('is-split');
  }
  if (!reduce) document.querySelectorAll('[data-split]').forEach(splitEl);

  /* =========================================================
     Reveal on scroll
     ========================================================= */
  var revealEls = document.querySelectorAll('.reveal, .reveal-img');
  if (!('IntersectionObserver' in window) || reduce) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        if (en.target._revealKids) {
          en.target._revealKids.forEach(function (k, n) { k.style.transitionDelay = (n * 120) + 'ms'; k.classList.add('is-in'); });
          if (en.target.classList.contains('reveal')) en.target.classList.add('is-in');
          io.unobserve(en.target);
          return;
        }
        var el = en.target;
        if (el.classList.contains('reveal') && !el.classList.contains('is-split')) {
          var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList.contains('reveal'); });
          el.style.transitionDelay = Math.min(Math.max(0, sibs.indexOf(el)) * 90, 360) + 'ms';
        }
        el.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealEls.forEach(function (el) {
      if (el.closest('.hero')) return;
      // clip-path hides the element from IntersectionObserver, so watch its parent
      if (el.classList.contains('reveal-img')) { var pn = el.parentNode; (pn._revealKids = pn._revealKids || []).push(el); io.observe(pn); }
      else io.observe(el);
    });
  }

  /* =========================================================
     Videos: lazy load, play only in view
     ========================================================= */
  var vids = document.querySelectorAll('video');
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) {
          if (v.classList.contains('lazy-video') && !v.dataset.loaded) {
            v.querySelectorAll('source[data-src]').forEach(function (s) { s.src = s.dataset.src; });
            v.load(); v.dataset.loaded = '1';
          }
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        } else { v.pause(); }
      });
    }, { rootMargin: '250px 0px', threshold: 0.01 });
    vids.forEach(function (v) { vio.observe(v); });
  }

  /* =========================================================
     Loader + intro
     ========================================================= */
  var loader = document.getElementById('loader');
  function startIntro() {
    root.classList.add('is-loaded');
    document.querySelectorAll('.hero .reveal').forEach(function (el) { el.classList.add('is-in'); });
  }
  (function () {
    var seen = false;
    try { seen = sessionStorage.getItem('brkx-intro') === '1'; } catch (e) {}
    if (!loader || reduce || seen) {
      if (loader) loader.classList.add('is-gone');
      var go = function () { requestAnimationFrame(startIntro); };
      if (document.fonts && document.fonts.ready) { document.fonts.ready.then(go); setTimeout(go, 900); } else go();
      return;
    }
    root.classList.add('is-locked');
    var minTime = new Promise(function (r) { setTimeout(r, 1700); });
    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var cap = new Promise(function (r) { setTimeout(r, 3200); });
    Promise.race([Promise.all([minTime, fonts]), cap]).then(function () {
      loader.classList.add('is-out');
      root.classList.remove('is-locked');
      setTimeout(startIntro, 250);
      setTimeout(function () { loader.classList.add('is-gone'); }, 1200);
      try { sessionStorage.setItem('brkx-intro', '1'); } catch (e) {}
    });
  })();

  /* =========================================================
     Custom cursor
     ========================================================= */
  var cursor = document.getElementById('cursor');
  if (cursor && finePointer && !reduce) {
    root.classList.add('has-cursor');
    var label = cursor.querySelector('.cursor__label');
    var cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; cursor.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('pointerleave', function () { cursor.classList.add('is-hidden'); });
    document.addEventListener('mouseover', function (e) {
      var card = e.target.closest('[data-cursor-ar]');
      var media = e.target.closest('.card__media');
      if (card && media) {
        label.textContent = card.getAttribute('data-cursor-' + root.lang);
        cursor.classList.add('is-label'); cursor.classList.remove('is-link');
        return;
      }
      cursor.classList.remove('is-label');
      cursor.classList.toggle('is-link', !!e.target.closest('a, button, .size-row span'));
    });
    (function loop() {
      cx = lerp(cx, tx, 0.2); cy = lerp(cy, ty, 0.2);
      cursor.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      requestAnimationFrame(loop);
    })();
  }

  /* =========================================================
     Magnetic buttons
     ========================================================= */
  if (finePointer && !reduce) {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + dx * 0.25 + 'px,' + dy * 0.35 + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* =========================================================
     3D tilt on product images
     ========================================================= */
  if (finePointer && !reduce) {
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.classList.add('is-tilting');
        el.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-(y - 0.5) * 8).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* =========================================================
     Colour stage: pinned, scroll picks the colour
     ========================================================= */
  (function () {
    var stage = document.querySelector('.stage');
    if (!stage) return;
    var scroller = stage.querySelector('.stage__scroller');
    var imgs = stage.querySelectorAll('.stage__img');
    var btns = stage.querySelectorAll('.stage__btn');
    var bars = stage.querySelectorAll('.stage__progress i');
    var cta = stage.querySelector('.stage__cta');
    var n = imgs.length, current = 0;
    function show(i) {
      if (i === current) return;
      imgs.forEach(function (im) { im.classList.remove('is-leaving'); });
      imgs[current].classList.add('is-leaving');
      imgs[current].classList.remove('is-active');
      imgs[i].classList.add('is-active');
      btns[current].classList.remove('is-active');
      btns[i].classList.add('is-active');
      current = i;
      if (cta) cta.href = buildHref(cta);
    }
    function range() {
      var top = scroller.getBoundingClientRect().top + scrollY;
      var len = scroller.offsetHeight - innerHeight;
      return { top: top, len: Math.max(1, len) };
    }
    function update() {
      var r = range();
      var p = clamp((scrollY - r.top) / r.len, 0, 0.9999);
      var idx = Math.floor(p * n);
      show(idx);
      var f = p * n - idx;
      bars.forEach(function (b, k) { b.style.setProperty('--p', k < idx ? 1 : k === idx ? f.toFixed(3) : 0); });
    }
    btns.forEach(function (b, i) {
      b.addEventListener('click', function (e) {
        ripple(b, e);
        var r = range();
        if (reduce || r.len < 10) { show(i); return; }
        window.scrollTo({ top: r.top + r.len * ((i + 0.5) / n), behavior: 'smooth' });
      });
    });
    // swipe on touch
    var view = stage.querySelector('.stage__view'), sx = null;
    view.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    view.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) < 40) return;
      var fwd = isRTL() ? dx > 0 : dx < 0;
      var i = clamp(current + (fwd ? 1 : -1), 0, n - 1);
      var r = range();
      window.scrollTo({ top: r.top + r.len * ((i + 0.5) / n), behavior: 'smooth' });
    });
    if (!reduce) {
      window.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
      window.addEventListener('resize', update);
      update();
    }
  })();

  /* =========================================================
     Ticker: speed follows scroll velocity
     ========================================================= */
  var ticker = (function () {
    var track = document.querySelector('.ticker__track');
    if (!track) return null;
    var w = 0, x = 0, vel = 0, dir = 1, lastY = scrollY;
    function measure() { w = track.children[0].getBoundingClientRect().width; }
    measure();
    window.addEventListener('resize', measure);
    if (reduce) return { measure: measure };
    window.addEventListener('scroll', function () {
      var d = scrollY - lastY; lastY = scrollY;
      if (Math.abs(d) > 0.5) dir = d > 0 ? 1 : -1;
      vel = clamp(vel + Math.abs(d) * 0.08, 0, 14);
    }, { passive: true });
    (function loop() {
      vel *= 0.92;
      var step = (0.6 + vel) * dir;
      x -= step;
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      var tx = isRTL() ? -x : x;
      track.style.transform = 'translate3d(' + tx.toFixed(2) + 'px,0,0)';
      requestAnimationFrame(loop);
    })();
    return { measure: measure };
  })();

  /* =========================================================
     Scroll-driven effects
     ========================================================= */
  var nav = document.getElementById('nav');
  var dock = document.getElementById('dock');
  var hero = document.querySelector('.hero');
  var heroMedia = hero && hero.querySelector('.hero__media');
  var heroVideo = hero && hero.querySelector('.hero__video');
  var heroText = hero && hero.querySelector('.hero__text');
  var parallaxEls = document.querySelectorAll('[data-parallax]');
  var clipEls = document.querySelectorAll('[data-clip]');
  var lastY = scrollY, ticking = false;

  function onScroll() {
    var y = scrollY, vh = innerHeight, desktop = innerWidth >= 1000;
    var heroH = hero ? hero.offsetHeight : vh;

    // nav
    nav.classList.toggle('is-solid', y > (desktop ? 40 : heroH - 140));
    nav.classList.toggle('is-dark', !desktop && y <= heroH - 140);
    if (y > heroH && y > lastY + 4) nav.classList.add('is-hidden');
    if (y < lastY - 4 || y < heroH) nav.classList.remove('is-hidden');

    // dock
    if (dock) {
      var nearEnd = (vh + y) >= document.body.scrollHeight - 560;
      var st = document.querySelector('.stage__scroller');
      var inStage = false;
      if (st) { var sr = st.getBoundingClientRect(); inStage = sr.top < vh * 0.5 && sr.bottom > vh * 0.5; }
      dock.classList.toggle('is-on', y > heroH * 0.6 && !nearEnd && !inStage);
    }

    if (!reduce && hero && y < heroH * 1.2) {
      var p = clamp(y / heroH, 0, 1);
      if (desktop) {
        heroMedia.style.transform = 'scale(' + (1 - p * 0.08).toFixed(4) + ')';
        heroText.style.transform = 'translateY(' + (-p * 90).toFixed(1) + 'px)';
        heroText.style.opacity = (1 - p * 0.9).toFixed(3);
      } else {
        heroMedia.style.transform = 'translateY(' + (p * 30).toFixed(1) + '%)';
        heroText.style.transform = 'translateY(' + (-p * 60).toFixed(1) + 'px)';
        heroText.style.opacity = (1 - p * 1.2).toFixed(3);
      }
    }

    if (!reduce) {
      parallaxEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var off = (r.top + r.height / 2 - vh / 2) * parseFloat(el.getAttribute('data-parallax'));
        var target = el.classList.contains('about__portrait') ? el.querySelector('img') : el;
        target.style.translate = '0 ' + (-off).toFixed(1) + 'px';
      });
      clipEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var q = clamp((vh - r.top) / (vh * 0.85), 0, 1);
        el.style.setProperty('--clip', ((1 - q) * 14).toFixed(2) + '%');
        el.style.setProperty('--clip-n', ((1 - q) * 0.14).toFixed(4));
      });
    }

    lastY = y; ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* current section in nav */
  if ('IntersectionObserver' in window) {
    var links = document.querySelectorAll('.nav__links a');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = map[en.target.id];
        if (a && en.isIntersecting) { links.forEach(function (l) { l.classList.remove('is-current'); }); a.classList.add('is-current'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) sio.observe(s); });
  }

  /* =========================================================
     Price count-up
     ========================================================= */
  var fmtAr = window.Intl ? new Intl.NumberFormat('ar-EG') : null;
  document.querySelectorAll('.count').forEach(function (el) {
    var to = parseInt(el.getAttribute('data-to'), 10);
    var ar = el.getAttribute('data-fmt') === 'ar';
    var fmt = function (n) { return ar && fmtAr ? fmtAr.format(n) : String(n); };
    if (reduce || !('IntersectionObserver' in window)) return;
    el.textContent = fmt(1);
    var done = false;
    new IntersectionObserver(function (en, obs) {
      if (!en[0].isIntersecting || done) return;
      done = true; obs.disconnect();
      var t0 = performance.now(), D = 1500;
      (function step(now) {
        var k = clamp((now - t0) / D, 0, 1);
        var e = 1 - Math.pow(1 - k, 4);
        el.textContent = fmt(Math.max(1, Math.round(e * to)));
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: 0.6 }).observe(el);
  });
})();
