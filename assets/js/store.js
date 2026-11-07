/* BRKX store: renders the catalog from products.js, product panel, bag and WhatsApp checkout. */
(function () {
  'use strict';
  var S = window.BRKX_STORE;
  if (!S) return;
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var P = S.products;
  var byId = {};
  P.forEach(function (p) { byId[p.id] = p; });

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function arDigits(s) { return String(s).replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }).replace(/\./g, '٫'); }
  function num(n) { return (Math.round(n * 1000) / 1000).toString(); }
  function both(ar, en) { return '<span data-l="ar">' + ar + '</span><span data-l="en">' + en + '</span>'; }
  /* prices use Western digits in both languages: the Arabic decimal mark reads like a letter in this font */
  function price(n, unitAr, unitEn) {
    return both('<bdi>' + num(n) + '</bdi> ' + (unitAr || 'د.أ'), (unitEn || 'JOD') + ' ' + num(n));
  }
  function delivAr() { return S.delivery === 1 ? 'بدينار واحد' : 'بـ' + num(S.delivery) + ' د.أ'; }
  function delivEn() { return S.delivery === 1 ? 'for 1 JOD' : 'for JOD ' + num(S.delivery); }
  function L(o) { return o ? (o[root.lang] || o.ar) : ''; }
  function colourOf(p, cid) { for (var i = 0; i < p.colours.length; i++) if (p.colours[i].id === cid) return p.colours[i]; return p.colours[0]; }
  function sizesOf(p) { return p.sizes === undefined ? S.sizesDefault : p.sizes; }
  function catName(id) { for (var i = 0; i < S.categories.length; i++) if (S.categories[i].id === id) return S.categories[i]; return { ar: id, en: id }; }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* =========================================================
     HERO (data-driven slides)
     ========================================================= */
  var heroItems = P.filter(function (p) { return p.hero; });
  (function renderHero() {
    var media = $('.hero__media'), title = $('.hero__title'), ledes = $('.hero__ledes'), prices = $('.hero__prices'), tabs = $('.hero__tabs');
    if (!media) return;
    var m = '', t = '', l = '', pr = '', tb = '';
    heroItems.forEach(function (p, i) {
      var act = i === 0 ? ' is-active' : '';
      if (p.hero.video) {
        m += '<div class="hero__layer' + act + '" data-s="' + i + '"><video class="hero__video" ' + (i === 0 ? 'autoplay preload="auto" ' : 'preload="none" ') + 'muted loop playsinline poster="' + p.hero.poster + '" aria-hidden="true">' +
          (p.hero.videoSmall ? '<source src="' + p.hero.videoSmall + '" type="video/mp4" media="(max-width: 600px)">' : '') +
          '<source src="' + p.hero.video + '" type="video/mp4"></video></div>';
      } else {
        var c0 = colourOf(p, p.hero.clips[0]);
        m += '<div class="hero__layer' + act + '" data-s="' + i + '"><video class="hero__video hero__video--clips" muted loop playsinline preload="none" poster="' + (c0.poster || c0.img) + '" aria-hidden="true"></video></div>';
      }
      t += '<span class="ht' + act + '" data-s="' + i + '"' + (i ? ' aria-hidden="true"' : '') + '>' +
        '<span data-l="ar"><span class="line"><span>' + esc(p.title.ar[0]).replace('DMC', '<bdi>DMC</bdi>') + '</span></span><span class="line"><span>' + (/[a-z]/i.test(p.title.ar[1]) ? '<bdi>' + esc(p.title.ar[1]) + '</bdi>' : esc(p.title.ar[1])) + '</span></span></span>' +
        '<span data-l="en"><span class="line"><span>' + esc(p.title.en[0]) + '</span></span><span class="line"><span>' + esc(p.title.en[1]) + '</span></span></span></span>';
      l += '<p class="hero__lede hl' + act + '" data-s="' + i + '">' +
        both((p.badge ? esc(p.badge.ar) + '. ' : '') + esc(p.tagline.ar), (p.badge ? esc(p.badge.en) + '. ' : '') + esc(p.tagline.en)) + '</p>';
      pr += '<span class="hp' + act + '" data-s="' + i + '"><span class="price"><bdi>' + num(p.price) + '</bdi></span>' +
        '<span class="price__unit">' + both('دينار', 'JOD') + '</span></span>';
      tb += '<button class="hero__tab' + act + '" type="button" role="tab" aria-selected="' + (i === 0) + '" data-s="' + i + '">' + both(esc(p.name.ar).replace(' oversize', ''), esc(p.name.en)) + '<i aria-hidden="true"></i></button>';
    });
    media.innerHTML = m; title.innerHTML = t; ledes.innerHTML = l; prices.innerHTML = pr; tabs.innerHTML = tb;
  })();

  /* =========================================================
     SHOP GRID
     ========================================================= */
  (function renderShop() {
    var grid = $('#shopGrid'), chips = $('#shopChips');
    if (!grid) return;
    var used = [];
    P.forEach(function (p) { if (used.indexOf(p.category) < 0) used.push(p.category); });
    if (chips) {
      if (used.length > 1) {
        chips.innerHTML = '<button class="chip is-active" type="button" data-cat="all">' + both('الكل', 'All') + '</button>' +
          used.map(function (c) { var n = catName(c); return '<button class="chip" type="button" data-cat="' + c + '">' + both(esc(n.ar), esc(n.en)) + '</button>'; }).join('');
      } else { chips.hidden = true; }
    }
    var html = P.map(function (p, i) {
      var c = p.colours[0];
      var sw = p.colours.length > 1 ? '<div class="pc__swatches" role="group">' + p.colours.map(function (cc, k) {
        return '<button class="pc__sw' + (k === 0 ? ' is-active' : '') + '" type="button" data-c="' + cc.id + '" style="--sw:' + cc.hex + '" aria-label="' + esc(cc.ar) + ' / ' + esc(cc.en) + '"></button>';
      }).join('') + '</div>' : '';
      return '<article class="pc reveal" data-p="' + p.id + '" data-cat="' + p.category + '" data-cursor-ar="عرض" data-cursor-en="View">' +
        '<button class="pc__media reveal-img" type="button" data-open="' + p.id + '" data-tilt aria-label="' + esc(p.name.ar) + '">' +
          '<img class="pc__img" src="' + c.img + '" srcset="' + c.img + ' 640w' + (c.imgLarge ? ', ' + c.imgLarge + ' 1080w' : '') + '" sizes="(max-width: 700px) 86vw, (max-width: 1100px) 45vw, 30vw" alt="" loading="lazy" width="640" height="853">' +
          (c.alt ? '<img class="pc__alt" src="' + c.alt + '" alt="" loading="lazy" width="640" height="853">' : '') +
          (p.badge ? '<span class="pc__badge">' + both(esc(p.badge.ar), esc(p.badge.en)) + '</span>' : '') +
          '<span class="pc__quick">' + both('اختر اللون والمقاس', 'Choose colour and size') + '</span>' +
        '</button>' +
        '<div class="pc__body">' +
          '<div class="pc__row"><h3 class="pc__name">' + both(esc(p.name.ar).replace('oversize', '<bdi>oversize</bdi>').replace('DMC', '<bdi>DMC</bdi>'), esc(p.name.en)) + '</h3>' +
          '<p class="pc__price">' + price(p.price) + '</p></div>' +
          '<p class="pc__tag">' + both(esc(p.tagline.ar), esc(p.tagline.en)) + '</p>' +
          '<div class="pc__foot">' + sw +
            '<span class="pc__count">' + both(arDigits(p.colours.length) + ' ألوان', p.colours.length + ' colours') + '</span></div>' +
        '</div></article>';
    }).join('');
    html += '<article class="pc pc--soon reveal"><a class="pc__soonbox" href="https://instagram.com/brkx.store" target="_blank" rel="noopener">' +
      '<svg class="spark" aria-hidden="true"><use href="#spark"/></svg>' +
      '<strong>' + both('قطع جديدة قريبًا', 'More pieces soon') + '</strong>' +
      '<span>' + both('تابع <bdi>@brkx.store</bdi> لتعرف أولًا', 'Follow @brkx.store to hear first') + '</span></a></article>';
    grid.innerHTML = html;

    grid.addEventListener('click', function (e) {
      var sw = e.target.closest('.pc__sw');
      if (sw) {
        var card = sw.closest('.pc'), p = byId[card.dataset.p], c = colourOf(p, sw.dataset.c);
        $$('.pc__sw', card).forEach(function (b) { b.classList.toggle('is-active', b === sw); });
        var img = $('.pc__img', card); img.srcset = c.img + ' 640w' + (c.imgLarge ? ', ' + c.imgLarge + ' 1080w' : ''); img.src = c.img;
        var alt = $('.pc__alt', card); if (alt && c.alt) alt.src = c.alt;
        card.dataset.c = c.id;
        return;
      }
      var op = e.target.closest('[data-open]') || e.target.closest('.pc__name');
      if (op) { var cd = op.closest('.pc'); openProduct(cd.dataset.p, cd.dataset.c); }
    });
    if (chips) chips.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      $$('.chip', chips).forEach(function (x) { x.classList.toggle('is-active', x === b); });
      $$('.pc', grid).forEach(function (card) { card.hidden = !(b.dataset.cat === 'all' || card.dataset.cat === b.dataset.cat || card.classList.contains('pc--soon')); });
    });
  })();

  /* =========================================================
     LOOKS RAIL
     ========================================================= */
  (function renderLooks() {
    var rail = $('#looksRail');
    if (!rail) return;
    var lists = P.map(function (p) { return (p.films || []).map(function (f) { return { p: p, f: f }; }); });
    var items = [], more = true, k = 0;
    while (more) { more = false; lists.forEach(function (l) { if (l[k]) { items.push(l[k]); more = true; } }); k++; }
    rail.innerHTML = items.map(function (it) {
      var p = it.p, f = it.f, c = colourOf(p, f.colour);
      var media = f.video ? '<video class="lazy-video" muted loop playsinline preload="none" poster="' + f.poster + '" aria-hidden="true"><source data-src="' + f.video + '" type="video/mp4"></video>'
        : '<img src="' + f.image + '" alt="" loading="lazy">';
      return '<button class="look reveal-img" type="button" data-open="' + p.id + '" data-c="' + c.id + '" data-cursor-ar="عرض" data-cursor-en="View">' + media +
        '<span class="look__cap"><span class="look__dot" style="--sw:' + c.hex + '"></span><span>' + both(esc(p.name.ar), esc(p.name.en)) + '<em>' + both(esc(c.ar) + '، <bdi>' + num(p.price) + '</bdi> د.أ', esc(c.en) + ', JOD ' + num(p.price)) + '</em></span></span></button>';
    }).join('');
    rail.addEventListener('click', function (e) { var b = e.target.closest('[data-open]'); if (b) openProduct(b.dataset.open, b.dataset.c); });
  })();

  /* =========================================================
     BAG (persisted in this browser)
     ========================================================= */
  var KEY = 'brkx-bag-v1', bag = [];
  try { bag = JSON.parse(localStorage.getItem(KEY) || '[]').filter(function (it) { return byId[it.p]; }); } catch (e) { bag = []; }
  function saveBag() { try { localStorage.setItem(KEY, JSON.stringify(bag)); } catch (e) {} }
  function bagCount() { return bag.reduce(function (s, it) { return s + it.q; }, 0); }
  function bagSubtotal() { return bag.reduce(function (s, it) { return s + byId[it.p].price * it.q; }, 0); }
  function addToBag(pid, cid, size, q) {
    var key = pid + '|' + cid + '|' + (size || '');
    for (var i = 0; i < bag.length; i++) if (bag[i].k === key) { bag[i].q += q || 1; saveBag(); renderBag(); return; }
    bag.push({ k: key, p: pid, c: cid, s: size || null, q: q || 1 }); saveBag(); renderBag();
  }

  function itemLine(it, n, lang) {
    var p = byId[it.p], c = colourOf(p, it.c);
    if (lang === 'ar') return n + ') ' + p.name.ar + '\n   اللون: ' + c.ar + (it.s ? '، المقاس: ' + it.s : '') + '، العدد: ' + it.q + '، السعر: ' + num(p.price * it.q) + ' د.أ';
    return n + ') ' + p.name.en + '\n   Colour: ' + c.en + (it.s ? ', Size: ' + it.s : '') + ', Qty: ' + it.q + ', Price: JOD ' + num(p.price * it.q);
  }
  function orderMessage(items, extra) {
    var lang = root.lang, sub = items.reduce(function (s, it) { return s + byId[it.p].price * it.q; }, 0), tot = sub + S.delivery;
    var lines = items.map(function (it, i) { return itemLine(it, i + 1, lang); }).join('\n');
    var x = extra || {};
    if (lang === 'ar') {
      return 'مرحبا قصي، بدي أطلب من BRKX:\n\n' + lines + '\n\nالمجموع: ' + num(sub) + ' د.أ\nالتوصيل: ' + num(S.delivery) + ' د.أ\nالإجمالي: ' + num(tot) + ' د.أ' +
        (x.name ? '\n\nالاسم: ' + x.name : '') + (x.gov ? '\nالمحافظة: ' + x.gov : '') + (x.addr ? '\nالعنوان: ' + x.addr : '');
    }
    return "Hi Qusai, I'd like to order from BRKX:\n\n" + lines + '\n\nSubtotal: JOD ' + num(sub) + '\nDelivery: JOD ' + num(S.delivery) + '\nTotal: JOD ' + num(tot) +
      (x.name ? '\n\nName: ' + x.name : '') + (x.gov ? '\nGovernorate: ' + x.gov : '') + (x.addr ? '\nAddress: ' + x.addr : '');
  }
  function waUrl(text) { return 'https://wa.me/' + S.phone + '?text=' + encodeURIComponent(text); }

  /* =========================================================
     OVERLAYS (product panel + bag)
     ========================================================= */
  var lastFocus = null, openLayer = null;
  function openOverlay(el) {
    if (openLayer && openLayer !== el) closeOverlay(openLayer, true);
    lastFocus = document.activeElement;
    el.hidden = false;
    requestAnimationFrame(function () { el.classList.add('is-open'); });
    root.classList.add('is-locked');
    openLayer = el;
    var f = $('[data-autofocus]', el) || $('.sheet__close', el); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 60);
  }
  function closeOverlay(el, quick) {
    if (!el || el.hidden) return;
    el.classList.remove('is-open');
    $$('video', el).forEach(function (v) { v.pause(); });
    root.classList.remove('is-locked');
    if (openLayer === el) openLayer = null;
    setTimeout(function () { el.hidden = true; }, quick ? 0 : 450);
    if (el.id === 'productSheet' && location.hash.indexOf('#p-') === 0) history.replaceState(null, '', location.pathname + location.search);
    if (!quick && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openLayer) closeOverlay(openLayer); });
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', function () { closeOverlay(b.closest('.sheet')); }); });

  /* ---------- product panel ---------- */
  var sheet = $('#productSheet'), cur = { p: null, c: null, s: null, media: 0 };
  function renderProduct() {
    var p = byId[cur.p], c = colourOf(p, cur.c), sizes = sizesOf(p);
    var gallery = [{ img: c.imgLarge || c.img }];
    if (c.alt) gallery.push({ img: c.alt });
    if (c.video) gallery.push({ video: c.video, poster: c.poster });
    if (cur.media >= gallery.length) cur.media = 0;
    var g = gallery[cur.media];
    var main = g.video ? '<video src="' + g.video + '" poster="' + g.poster + '" autoplay muted loop playsinline></video>' : '<img src="' + g.img + '" alt="">';
    var thumbs = gallery.length > 1 ? '<div class="ps__thumbs">' + gallery.map(function (x, i) {
      return '<button class="ps__thumb' + (i === cur.media ? ' is-active' : '') + '" type="button" data-m="' + i + '" aria-label="' + (i + 1) + '">' +
        (x.video ? '<img src="' + x.poster + '" alt=""><span class="ps__play" aria-hidden="true"></span>' : '<img src="' + x.img + '" alt="">') + '</button>';
    }).join('') + '</div>' : '';
    var cols = '<div class="ps__group"><p class="ps__label">' + both('اللون', 'Colour') + ': <strong>' + both(esc(c.ar), esc(c.en)) + '</strong></p><div class="ps__colours">' +
      p.colours.map(function (cc) { return '<button class="ps__col' + (cc.id === c.id ? ' is-active' : '') + '" type="button" data-c="' + cc.id + '" style="--sw:' + cc.hex + '" aria-label="' + esc(cc.ar) + ' / ' + esc(cc.en) + '"></button>'; }).join('') + '</div></div>';
    var sz = sizes && sizes.length ? '<div class="ps__group"><p class="ps__label">' + both('المقاس', 'Size') + (cur.s ? ': <strong>' + cur.s + '</strong>' : '') + '</p><div class="ps__sizes">' +
      sizes.map(function (s) { return '<button class="ps__size' + (s === cur.s ? ' is-active' : '') + '" type="button" data-s="' + s + '">' + s + '</button>'; }).join('') +
      '</div><p class="ps__hint" hidden>' + both('اختر المقاس أولًا', 'Choose a size first') + '</p><a class="ps__sizehelp js-wa" data-msg="size" target="_blank" rel="noopener" href="https://wa.me/' + S.phone + '">' + both('محتار بالمقاس؟ اسألنا', 'Not sure? Ask us') + '</a></div>' : '';
    $('.ps__body', sheet).innerHTML =
      '<div class="ps__gallery"><div class="ps__main">' + main + (p.badge ? '<span class="pc__badge">' + both(esc(p.badge.ar), esc(p.badge.en)) + '</span>' : '') + '</div>' + thumbs + '</div>' +
      '<div class="ps__info">' +
        '<p class="ps__cat">' + both(esc(catName(p.category).ar), esc(catName(p.category).en)) + '</p>' +
        '<h2 class="ps__name" id="psTitle">' + both(esc(p.name.ar).replace('oversize', '<bdi>oversize</bdi>').replace('DMC', '<bdi>DMC</bdi>'), esc(p.name.en)) + '</h2>' +
        '<p class="ps__price">' + price(p.price) + '</p>' +
        '<p class="ps__tag">' + both(esc(p.tagline.ar), esc(p.tagline.en)) + '</p>' +
        cols + sz +
        '<div class="ps__actions">' +
          '<button class="btn btn--solid ps__add" type="button" data-autofocus>' + both('أضف إلى السلة', 'Add to bag') + '</button>' +
          '<button class="btn btn--ghost ps__now" type="button">' + both('اطلب الآن عبر واتساب', 'Order now on WhatsApp') + '</button>' +
        '</div>' +
        '<p class="ps__ship"><svg class="spark" aria-hidden="true"><use href="#spark"/></svg>' + both('التوصيل لجميع محافظات المملكة ' + delivAr(), 'Delivery anywhere in Jordan ' + delivEn()) + '</p>' +
        (p.specs && p.specs.length ? '<details class="ps__specs" open><summary>' + both('المواصفات', 'Details') + '</summary><ul>' + p.specs.map(function (s) { return '<li>' + both(esc(s.ar), esc(s.en)) + '</li>'; }).join('') + '</ul></details>' : '') +
      '</div>';
  }
  function needSize() {
    var p = byId[cur.p], sizes = sizesOf(p);
    if (sizes && sizes.length && !cur.s) {
      var h = $('.ps__hint', sheet); if (h) h.hidden = false;
      var box = $('.ps__sizes', sheet); if (box) { box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); box.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); }
      return true;
    }
    return false;
  }
  function openProduct(pid, cid) {
    if (!byId[pid]) return;
    cur = { p: pid, c: cid || byId[pid].colours[0].id, s: null, media: 0 };
    renderProduct();
    $('.ps__body', sheet).scrollTop = 0;
    openOverlay(sheet);
    try { history.replaceState(null, '', '#p-' + pid + (cid ? '-' + cid : '')); } catch (e) {}
  }
  window.BRKX_open = openProduct;
  sheet.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('.ps__col'))) { cur.c = t.dataset.c; cur.media = 0; renderProduct(); return; }
    if ((t = e.target.closest('.ps__size'))) { cur.s = t.dataset.s; renderProduct(); return; }
    if ((t = e.target.closest('.ps__thumb'))) { cur.media = +t.dataset.m; renderProduct(); return; }
    if (e.target.closest('.ps__add')) {
      if (needSize()) return;
      addToBag(cur.p, cur.c, cur.s, 1);
      closeOverlay(sheet, true);
      openBag(true);
      return;
    }
    if (e.target.closest('.ps__now')) {
      if (needSize()) return;
      window.open(waUrl(orderMessage([{ p: cur.p, c: cur.c, s: cur.s, q: 1 }])), '_blank', 'noopener');
      return;
    }
    if ((t = e.target.closest('.js-wa'))) { t.href = waUrl(root.lang === 'ar' ? 'مرحبا، بدي مساعدة باختيار المقاس لـ' + byId[cur.p].name.ar + '.\nطولي: \nوزني: ' : 'Hi, could you help me pick a size for the ' + byId[cur.p].name.en + '?\nHeight: \nWeight: '); }
  });

  /* ---------- bag panel ---------- */
  var bagEl = $('#bagSheet');
  var GOVS = [['عمّان', 'Amman'], ['إربد', 'Irbid'], ['الزرقاء', 'Zarqa'], ['البلقاء', 'Balqa'], ['المفرق', 'Mafraq'], ['جرش', 'Jerash'], ['عجلون', 'Ajloun'], ['مادبا', 'Madaba'], ['الكرك', 'Karak'], ['الطفيلة', 'Tafilah'], ['معان', "Ma'an"], ['العقبة', 'Aqaba']];
  var form = { name: '', gov: '', addr: '' };
  try { form = Object.assign(form, JSON.parse(localStorage.getItem('brkx-form-v1') || '{}')); } catch (e) {}

  function renderBag() {
    var n = bagCount(), sub = bagSubtotal();
    $$('.bag-count').forEach(function (el) {
      var before = +(el.dataset.n || 0);
      el.textContent = root.lang === 'ar' ? arDigits(n) : n; el.hidden = n === 0; el.dataset.n = n;
      if (n > before) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    });
    var dock = $('#dock');
    if (dock) {
      $('.dock__text', dock).innerHTML = n
        ? '<strong>' + both('في السلة ' + arDigits(n) + (n === 1 ? ' قطعة' : n === 2 ? ' قطعتان' : n <= 10 ? ' قطع' : ' قطعة'), n + (n === 1 ? ' item' : ' items') + ' in your bag') + '</strong><span>' + both('الإجمالي <bdi>' + num(sub + S.delivery) + '</bdi> د.أ مع التوصيل', 'JOD ' + num(sub + S.delivery) + ' with delivery') + '</span>'
        : '<strong>' + both('تسوّق قطع BRKX', 'Shop BRKX') + '</strong><span>' + both('التوصيل لجميع المحافظات ' + delivAr(), 'Delivery anywhere in Jordan ' + delivEn()) + '</span>';
      var db = $('.dock__btn', dock);
      db.innerHTML = n ? both('السلة', 'Bag') : both('تسوّق', 'Shop');
      db.dataset.action = n ? 'bag' : 'shop';
    }
    if (!bagEl) return;
    var body = $('.bag__body', bagEl);
    if (!n) {
      body.innerHTML = '<div class="bag__empty"><svg class="spark" aria-hidden="true"><use href="#spark"/></svg><p>' + both('السلة فارغة.', 'Your bag is empty.') + '</p><button class="btn btn--solid" type="button" data-goshop>' + both('تسوّق الآن', 'Start shopping') + '</button></div>';
      return;
    }
    body.innerHTML = '<ul class="bag__list">' + bag.map(function (it, i) {
      var p = byId[it.p], c = colourOf(p, it.c);
      return '<li class="bi" data-i="' + i + '"><button class="bi__img" type="button" data-open="' + p.id + '" data-c="' + c.id + '"><img src="' + c.img + '" alt=""></button>' +
        '<div class="bi__info"><p class="bi__name">' + both(esc(p.name.ar).replace('oversize', '<bdi>oversize</bdi>').replace('DMC', '<bdi>DMC</bdi>'), esc(p.name.en)) + '</p>' +
        '<p class="bi__meta">' + both(esc(c.ar) + (it.s ? '، المقاس <bdi>' + it.s + '</bdi>' : ''), esc(c.en) + (it.s ? ', size ' + it.s : '')) + '</p>' +
        '<div class="bi__row"><div class="qty"><button type="button" data-q="-1" aria-label="-">−</button><span>' + both(arDigits(it.q), it.q) + '</span><button type="button" data-q="1" aria-label="+">+</button></div>' +
        '<p class="bi__price">' + price(p.price * it.q) + '</p></div>' +
        '<button class="bi__rm" type="button" data-rm aria-label="remove">' + both('إزالة', 'Remove') + '</button></div></li>';
    }).join('') + '</ul>' +
      '<div class="bag__form">' +
        '<p class="bag__formtitle">' + both('بيانات التوصيل (اختياري)', 'Delivery details (optional)') + '</p>' +
        '<label class="fld"><span>' + both('الاسم', 'Name') + '</span><input type="text" name="name" autocomplete="name" value="' + esc(form.name) + '"></label>' +
        '<label class="fld"><span>' + both('المحافظة', 'Governorate') + '</span><select name="gov"><option value="">' + (root.lang === 'ar' ? 'اختر' : 'Choose') + '</option>' +
          GOVS.map(function (g) { var v = root.lang === 'ar' ? g[0] : g[1]; return '<option value="' + esc(v) + '"' + (form.gov === g[0] || form.gov === g[1] ? ' selected' : '') + '>' + esc(v) + '</option>'; }).join('') + '</select></label>' +
        '<label class="fld fld--wide"><span>' + both('المنطقة أو العنوان', 'Area or address') + '</span><input type="text" name="addr" autocomplete="street-address" value="' + esc(form.addr) + '"></label>' +
      '</div>' +
      '<div class="bag__sum">' +
        '<p><span>' + both('المجموع', 'Subtotal') + '</span><span>' + price(sub) + '</span></p>' +
        '<p><span>' + both('التوصيل لجميع المحافظات', 'Delivery, all of Jordan') + '</span><span>' + price(S.delivery) + '</span></p>' +
        '<p class="bag__total"><span>' + both('الإجمالي', 'Total') + '</span><span>' + price(sub + S.delivery) + '</span></p>' +
      '</div>' +
      '<button class="btn btn--solid bag__checkout" type="button"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#wa"/></svg>' + both('أرسل الطلب عبر واتساب', 'Send order on WhatsApp') + '</button>' +
      '<p class="bag__note">' + both('يفتح واتساب برسالة جاهزة فيها طلبك كاملًا، وقصي يؤكد معك الطلب.', 'WhatsApp opens with your full order written out, and Qusai confirms it with you.') + '</p>';
  }
  function openBag(justAdded) {
    renderBag();
    bagEl.classList.toggle('just-added', !!justAdded);
    openOverlay(bagEl);
  }
  bagEl.addEventListener('click', function (e) {
    var li = e.target.closest('.bi'), t;
    if ((t = e.target.closest('[data-q]')) && li) {
      var it = bag[+li.dataset.i]; it.q = Math.max(1, Math.min(20, it.q + (+t.dataset.q))); saveBag(); renderBag(); return;
    }
    if (e.target.closest('[data-rm]') && li) { bag.splice(+li.dataset.i, 1); saveBag(); renderBag(); return; }
    if ((t = e.target.closest('[data-open]'))) { closeOverlay(bagEl, true); openProduct(t.dataset.open, t.dataset.c); return; }
    if (e.target.closest('[data-goshop]')) { closeOverlay(bagEl); var s = $('#shop'); if (s) s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); return; }
    if (e.target.closest('.bag__checkout')) {
      window.open(waUrl(orderMessage(bag, form)), '_blank', 'noopener');
    }
  });
  bagEl.addEventListener('input', function (e) {
    if (!e.target.name) return;
    form[e.target.name] = e.target.value.trim();
    try { localStorage.setItem('brkx-form-v1', JSON.stringify(form)); } catch (er) {}
  });
  $$('[data-bag]').forEach(function (b) { b.addEventListener('click', function () { openBag(false); }); });
  var dockBtn = $('#dock .dock__btn');
  if (dockBtn) dockBtn.addEventListener('click', function () {
    if (dockBtn.dataset.action === 'bag') openBag(false);
    else { var s = $('#shop'); if (s) s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
  });
  var lt = $('#langToggle');
  if (lt) lt.addEventListener('click', function () { setTimeout(function () { renderBag(); if (!sheet.hidden) renderProduct(); }, 0); });
  renderBag();

  /* deep link: brkx.store/#p-crew-beige opens that product */
  (function () {
    var m = /^#p-([a-z0-9]+)(?:-([a-z0-9]+))?$/i.exec(location.hash);
    if (m && byId[m[1]]) setTimeout(function () { openProduct(m[1], m[2]); }, 400);
  })();

  /* =========================================================
     HERO SLIDER (5 s per product)
     ========================================================= */
  (function () {
    var hero = $('.hero');
    if (!hero || heroItems.length < 2) return;
    var layers = $$('.hero__layer', hero), titles = $$('.hero__title .ht', hero), ledes = $$('.hero__ledes .hl', hero), prices = $$('.hero__prices .hp', hero), tabs = $$('.hero__tab', hero);
    var orderBtn = $('.hero__order', hero);
    var DUR = 5000, curS = 0, t0 = 0, paused = false, visible = true, started = false, timer;
    var clipIdx = heroItems.map(function () { return 0; });

    function loadClip(i) {
      var p = heroItems[i];
      if (!p.hero.clips) return;
      var v = $('video', layers[i]);
      var c = colourOf(p, p.hero.clips[clipIdx[i] % p.hero.clips.length]); clipIdx[i]++;
      if (!c.video) return;
      v.preload = 'auto'; v.poster = c.poster || c.img; v.src = c.video; v.load();
    }
    function show(i) {
      if (i === curS) return;
      var prev = curS; curS = i;
      clearTimeout(timer);
      layers.forEach(function (l) { l.classList.remove('is-leaving'); });
      layers[prev].classList.add('is-leaving'); layers[prev].classList.remove('is-active'); layers[i].classList.add('is-active');
      titles.forEach(function (t, k) { t.classList.toggle('is-active', k === i); t.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      ledes.forEach(function (l, k) { l.classList.toggle('is-active', k === i); });
      prices.forEach(function (l, k) { l.classList.toggle('is-active', k === i); });
      tabs.forEach(function (b, k) { b.classList.toggle('is-active', k === i); b.setAttribute('aria-selected', k === i ? 'true' : 'false'); var bar = $('i', b); bar.style.setProperty('--p', k < i ? 1 : 0); });
      var v = $('video', layers[i]);
      if (v && heroItems[i].hero.clips && !v.getAttribute('src')) loadClip(i);
      if (v) { try { v.currentTime = 0; } catch (e) {} var pp = v.play(); if (pp && pp.catch) pp.catch(function () {}); }
      timer = setTimeout(function () {
        layers[prev].classList.remove('is-leaving');
        var pv = $('video', layers[prev]); if (pv) pv.pause();
        var nx = (i + 1) % heroItems.length;
        if (nx !== i) loadClip(nx);
      }, 1150);
      t0 = performance.now();
    }
    if (orderBtn) orderBtn.addEventListener('click', function () { openProduct(heroItems[curS].id); });
    tabs.forEach(function (b, k) { b.addEventListener('click', function () { show(k); t0 = performance.now(); }); });
    var sx = null;
    hero.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) { var fwd = root.dir === 'rtl' ? dx > 0 : dx < 0; show((curS + (fwd ? 1 : heroItems.length - 1)) % heroItems.length); }
    });
    var txt = $('.hero__text', hero);
    function pval() { return parseFloat($('i', tabs[curS]).style.getPropertyValue('--p')) || 0; }
    if (finePointer && txt) {
      txt.addEventListener('pointerenter', function () { paused = true; });
      txt.addEventListener('pointerleave', function () { paused = false; t0 = performance.now() - pval() * DUR; });
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.35 }).observe(hero);
    setTimeout(function () { loadClip(1); }, 1200);
    if (reduce) return;
    (function loop(now) {
      if (!started && root.classList.contains('is-loaded')) { started = true; t0 = now + 600; }
      if (started && visible && !paused && !document.hidden && !openLayer) {
        var p = Math.max(0, Math.min(1, (now - t0) / DUR));
        $('i', tabs[curS]).style.setProperty('--p', p.toFixed(4));
        if (p >= 1) show((curS + 1) % heroItems.length);
      } else if (started) { t0 = now - pval() * DUR; }
      requestAnimationFrame(loop);
    })(performance.now());
  })();
})();
