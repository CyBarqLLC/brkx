/* BRKX STORE: product grid, one-image product sheet, bag and one-screen WhatsApp checkout.
   All products, prices, delivery and the offer come from products.js. */
(function () {
  'use strict';
  var S = window.BRKX_STORE;
  if (!S) return;
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var P = S.products, byId = {};
  P.forEach(function (p) { byId[p.id] = p; });

  /* ---------- helpers ---------- */
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(n) { return (Math.round(n * 1000) / 1000).toString(); }
  function both(ar, en) { return '<span data-l="ar">' + ar + '</span><span data-l="en">' + en + '</span>'; }
  function price(n) { return both('<bdi>' + num(n) + '</bdi> د.أ', 'JOD ' + num(n)); }
  function isAr() { return root.lang !== 'en'; }
  function nameHtml(p) { return both(esc(p.name.ar).replace(/(oversize|DMC)/g, '<bdi>$1</bdi>'), esc(p.name.en)); }
  function colourOf(p, id) { for (var i = 0; i < p.colours.length; i++) if (p.colours[i].id === id) return p.colours[i]; return p.colours[0]; }
  function sizesOf(p) { return p.sizes === undefined ? S.sizesDefault : p.sizes; }
  function piecesAr(n) { return n === 1 ? 'قطعة وحدة' : n === 2 ? 'قطعتين' : n + (n <= 10 ? ' قطع' : ' قطعة'); }
  function piecesEn(n) { return n + (n === 1 ? ' piece' : ' pieces'); }
  function waUrl(text) { return 'https://wa.me/' + S.phone + (text ? '?text=' + encodeURIComponent(text) : ''); }

  /* static numbers follow products.js */
  $$('.js-deliv').forEach(function (el) { el.textContent = num(S.delivery); });
  if (S.offer) $$('.js-offer-price').forEach(function (el) { el.textContent = num(S.offer.price); });
  else { $$('.strip, #offerBand, .hero__sub').forEach(function (el) { el.remove(); }); }

  /* ---------- language ---------- */
  var langBtn = $('#lang');
  if (langBtn) langBtn.addEventListener('click', function () {
    var en = root.lang !== 'en';
    root.lang = en ? 'en' : 'ar'; root.dir = en ? 'ltr' : 'rtl';
    try { localStorage.setItem('brkx-lang', root.lang); } catch (e) {}
    renderBar(); if (typeof renderGrid === 'function') renderGrid();
    if (state && $('#product').classList.contains('is-on') && !state.done) renderProduct();
    if ($('#checkout').classList.contains('is-on')) renderCheckout();
  });

  /* ---------- header ---------- */
  var top = $('.top');
  function onScroll() { if (top) top.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- bag ---------- */
  var bag = [];
  try { bag = JSON.parse(localStorage.getItem('brkx-bag-v1') || '[]').filter(function (it) { return byId[it.p]; }); } catch (e) { bag = []; }
  function saveBag() { try { localStorage.setItem('brkx-bag-v1', JSON.stringify(bag)); } catch (e) {} }
  function count() { return bag.reduce(function (s, it) { return s + it.q; }, 0); }
  function subtotal(items) { return items.reduce(function (s, it) { return s + byId[it.p].price * it.q; }, 0); }
  /* bundle offer: every group of offer.qty eligible pieces costs offer.price; dearest pieces grouped first */
  function offerInfo(items) {
    var O = S.offer, units = [];
    if (!O) return { disc: 0, n: 0, left: 0 };
    items.forEach(function (it) { var p = byId[it.p]; if (p && p.category === O.category) for (var k = 0; k < it.q; k++) units.push(p.price); });
    units.sort(function (a, b) { return b - a; });
    var groups = Math.floor(units.length / O.qty), full = 0;
    for (var i = 0; i < groups * O.qty; i++) full += units[i];
    return { disc: Math.max(0, Math.round((full - groups * O.price) * 1000) / 1000), n: units.length, groups: groups, left: (O.qty - units.length % O.qty) % O.qty };
  }
  function totals(items) {
    var sub = subtotal(items), o = offerInfo(items);
    return { sub: sub, disc: o.disc, offer: o, total: sub - o.disc + (items.length ? S.delivery : 0) };
  }
  function addToBag(p, c, s) {
    for (var i = 0; i < bag.length; i++) if (bag[i].p === p && bag[i].c === c && bag[i].s === s) { bag[i].q = Math.min(20, bag[i].q + 1); saveBag(); renderBar(true); return; }
    bag.push({ p: p, c: c, s: s, q: 1 }); saveBag(); renderBar(true);
  }
  function nudgeHtml(o) {
    if (!S.offer || !o.n) return '';
    if (!o.left) return '<p class="nudge is-got"><svg aria-hidden="true"><use href="#check"/></svg>' + both('تم تطبيق عرض الـ' + S.offer.qty + ' بلايز بـ<bdi>' + num(S.offer.price) + '</bdi> د.أ', S.offer.qty + '-piece offer applied') + '</p>';
    return '<p class="nudge"><svg aria-hidden="true"><use href="#spark"/></svg>' + both(
      (o.left === 1 ? 'أضف قطعة وحدة كمان' : 'أضف قطعتين كمان') + ' وخذ الـ' + S.offer.qty + ' بـ<bdi>' + num(S.offer.price) + '</bdi> د.أ',
      'Add ' + o.left + ' more and get ' + S.offer.qty + ' for JOD ' + num(S.offer.price)) + '</p>';
  }

  /* ---------- bag bar + header count ---------- */
  var bar = $('#bar');
  function renderBar(bump) {
    var n = count(), t = totals(bag);
    $$('.js-count').forEach(function (el) {
      el.textContent = n; el.hidden = !n;
      if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    });
    if (!bar) return;
    bar.hidden = !n;
    $('.js-bar-count', bar).innerHTML = both(piecesAr(n) + '، شامل التوصيل', piecesEn(n) + ', delivery incl.');
    $('.js-bar-total', bar).innerHTML = price(t.total);
  }

  /* ---------- toast ---------- */
  function toast(html) {
    var t = $('#toast'); if (!t) return;
    t.innerHTML = html; t.classList.add('is-on');
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('is-on'); }, 2200);
  }

  /* =========================================================
     CATALOG: every colour is its own item, like a real store
     ========================================================= */
  var ITEMS = [];
  (function () {
    // featured order: round-robin across models so the grid shows variety
    var maxC = Math.max.apply(null, P.map(function (p) { return p.colours.length; }));
    for (var k = 0; k < maxC; k++) P.forEach(function (p, pi) {
      var c = p.colours[k]; if (c) ITEMS.push({ p: p, c: c, key: p.id + '-' + c.id, rank: k * 100 + pi });
    });
  })();
  var COLOURS = [];  // colour families for the filter, unique by Arabic name
  ITEMS.forEach(function (it) { if (!COLOURS.some(function (c) { return c.ar === it.c.ar; })) COLOURS.push({ ar: it.c.ar, en: it.c.en, hex: it.c.hex }); });
  var PRICES = P.map(function (p) { return p.price; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });

  var F = { model: [], colour: [], price: [], q: '', sort: 'featured' };
  function nActive() { return F.model.length + F.colour.length + F.price.length + (F.q ? 1 : 0); }
  function match(it, skip) {
    if (skip !== 'model' && F.model.length && F.model.indexOf(it.p.id) < 0) return false;
    if (skip !== 'colour' && F.colour.length && F.colour.indexOf(it.c.ar) < 0) return false;
    if (skip !== 'price' && F.price.length && F.price.indexOf(String(it.p.price)) < 0) return false;
    if (F.q) {
      var hay = (it.p.name.ar + ' ' + it.p.name.en + ' ' + it.c.ar + ' ' + it.c.en + ' ' + (it.p.badge ? it.p.badge.ar + ' ' + it.p.badge.en : '')).toLowerCase();
      if (F.q.toLowerCase().split(/\s+/).some(function (w) { return w && hay.indexOf(w) < 0; })) return false;
    }
    return true;
  }
  function results() {
    var r = ITEMS.filter(function (it) { return match(it); });
    if (F.sort === 'low') r.sort(function (a, b) { return a.p.price - b.p.price || a.rank - b.rank; });
    else if (F.sort === 'high') r.sort(function (a, b) { return b.p.price - a.p.price || a.rank - b.rank; });
    else if (F.sort === 'new') r.sort(function (a, b) { return (b.p.badge ? 1 : 0) - (a.p.badge ? 1 : 0) || a.rank - b.rank; });
    else r.sort(function (a, b) { return a.rank - b.rank; });
    return r;
  }
  function itemsAr(n) { return n === 0 ? 'ولا قطعة' : n === 1 ? 'قطعة وحدة' : n === 2 ? 'قطعتين' : n + (n <= 10 ? ' قطع' : ' قطعة'); }
  function shortName(p) { return { ar: p.name.ar.replace(/^بلوزة\s+/, ''), en: p.name.en }; }

  /* ---------- wishlist ---------- */
  var wish = [];
  try { wish = JSON.parse(localStorage.getItem('brkx-wish-v1') || '[]').filter(function (k) { return ITEMS.some(function (it) { return it.key === k; }); }); } catch (e) { wish = []; }
  function saveWish() { try { localStorage.setItem('brkx-wish-v1', JSON.stringify(wish)); } catch (e) {} renderWishCount(); }
  function isWish(k) { return wish.indexOf(k) > -1; }
  function toggleWish(k) {
    var i = wish.indexOf(k);
    if (i > -1) { wish.splice(i, 1); toast(both('انشالت من المفضلة', 'Removed from wishlist')); }
    else { wish.push(k); toast(both('انحفظت بالمفضلة', 'Saved to wishlist')); }
    saveWish();
    $$('[data-wish="' + k + '"]').forEach(function (b) { b.classList.toggle('is-on', isWish(k)); b.setAttribute('aria-pressed', isWish(k)); });
  }
  function renderWishCount() {
    $$('.js-wish-count').forEach(function (el) { el.textContent = wish.length; el.hidden = !wish.length; });
  }
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-9.2-9.3C1.7 7.4 3.8 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.2 0 5.3 2.9 4.2 6.2C19.5 15.4 12 20 12 20Z" fill="var(--heart-fill, none)" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';

  /* ---------- cards ---------- */
  var grid = $('#grid');
  function cardHtml(it) {
    var p = it.p, c = it.c, n = p.colours.length;
    return '<article class="card" data-key="' + it.key + '" data-p="' + p.id + '" data-c="' + c.id + '">' +
      '<div class="card__media"><a class="card__img" href="#p-' + it.key + '" data-open aria-label="' + esc(p.name.ar + ' ' + c.ar) + '"><img src="' + c.img + '" alt="' + esc(p.name.ar + ' ' + c.ar) + '" loading="lazy" width="640" height="853">' +
        (p.badge ? '<span class="badge">' + both(esc(p.badge.ar), esc(p.badge.en)) + '</span>' : '') + '</a>' +
      '<button class="card__heart' + (isWish(it.key) ? ' is-on' : '') + '" type="button" data-wish="' + it.key + '" aria-pressed="' + isWish(it.key) + '" aria-label="wishlist">' + HEART + '</button>' +
      '<button class="card__quick" type="button" data-quick aria-label="quick add"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg></button></div>' +
      '<a class="card__body" href="#p-' + it.key + '" data-open>' +
        '<span class="card__price">' + price(p.price) + '</span>' +
        '<span class="card__name">' + nameHtml(p) + '</span>' +
        '<span class="card__meta">' + both(esc(c.ar) + (n > 1 ? '، و' + (n - 1 === 1 ? 'لون ثاني' : n - 1 === 2 ? 'لونين كمان' : (n - 1) + ' ألوان كمان') : ''), esc(c.en) + (n > 1 ? ', +' + (n - 1) + ' colours' : '')) + '</span>' +
      '</a>' +
    '</article>';
  }

  /* ---------- toolbar, tabs, chips, filter panel ---------- */
  function renderTabs() {
    var tabs = $('#tabs'); if (!tabs) return;
    var one = F.model.length === 1 ? F.model[0] : null;
    tabs.innerHTML = '<button type="button" class="tab' + (!F.model.length ? ' is-on' : '') + '" data-tab="">' + both('الكل', 'All') + '</button>' +
      P.map(function (p) { var sn = shortName(p); return '<button type="button" class="tab' + (one === p.id ? ' is-on' : '') + '" data-tab="' + p.id + '">' + both(esc(sn.ar).replace(/(oversize|DMC)/g, '<bdi>$1</bdi>'), esc(sn.en)) + '</button>'; }).join('');
  }
  function chipsHtml() {
    var out = [];
    F.model.forEach(function (id) { var sn = shortName(byId[id]); out.push(['model', id, both(esc(sn.ar), esc(sn.en))]); });
    F.colour.forEach(function (ar) { var c = COLOURS.filter(function (x) { return x.ar === ar; })[0]; out.push(['colour', ar, '<i class="chip__dot" style="background:' + c.hex + '"></i>' + both(esc(c.ar), esc(c.en))]); });
    F.price.forEach(function (v) { out.push(['price', v, price(+v)]); });
    if (F.q) out.push(['q', F.q, '"' + esc(F.q) + '"']);
    if (!out.length) return '';
    return out.map(function (o) { return '<button type="button" class="fchip" data-unset="' + o[0] + '" data-val="' + esc(o[1]) + '">' + o[2] + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="2"/></svg></button>'; }).join('') +
      '<button type="button" class="fchip fchip--clear" data-clear>' + both('مسح الكل', 'Clear all') + '</button>';
  }
  var SORT_L = { featured: ['المميز', 'Featured'], 'new': ['الجديد أولاً', 'Newest'], low: ['السعر: من الأقل', 'Price: low to high'], high: ['السعر: من الأعلى', 'Price: high to low'] };
  function renderGrid() {
    if (!grid) return;
    $$('#sort option').forEach(function (o) { o.textContent = SORT_L[o.value][isAr() ? 0 : 1]; });
    var si0 = $('#search'); if (si0) si0.placeholder = isAr() ? 'ابحث بالاسم أو اللون، مثلاً: كحلي' : 'Search by name or colour, e.g. navy';
    var r = results();
    grid.innerHTML = r.length ? r.map(cardHtml).join('') :
      '<div class="noresults"><p>' + both('ما في قطع بهالفلترة.', 'Nothing matches these filters.') + '</p><button type="button" class="btn btn--line" data-clear>' + both('مسح الفلترة', 'Clear filters') + '</button></div>';
    $$('.js-shop-count').forEach(function (el) { el.innerHTML = both(itemsAr(r.length), r.length + (r.length === 1 ? ' item' : ' items')); });
    var fb = $('#filterBtn .js-fcount'); if (fb) { var n = F.model.length + F.colour.length + F.price.length; fb.textContent = n; fb.hidden = !n; }
    var ch = $('#chips'); if (ch) { ch.innerHTML = chipsHtml(); ch.hidden = !ch.innerHTML; }
    renderTabs();
    if ($('#filters') && $('#filters').classList.contains('is-on')) renderFilters();
  }
  function countFor(dim, val) {
    return ITEMS.filter(function (it) {
      if (!match(it, dim)) return false;
      return dim === 'model' ? it.p.id === val : dim === 'colour' ? it.c.ar === val : String(it.p.price) === val;
    }).length;
  }
  function renderFilters() {
    var box = $('#fbody'); if (!box) return;
    function opt(dim, val, label, extra) {
      var on = F[dim].indexOf(val) > -1, n = countFor(dim, val);
      return '<button type="button" class="fopt' + (on ? ' is-on' : '') + (n || on ? '' : ' is-empty') + '" data-dim="' + dim + '" data-val="' + esc(val) + '" aria-pressed="' + on + '">' +
        '<span class="fopt__box">' + (extra || '') + '</span><span class="fopt__label">' + label + '</span><span class="fopt__n">' + n + '</span></button>';
    }
    box.innerHTML =
      '<section class="fgroup"><h3>' + both('الموديل', 'Style') + '</h3>' + P.map(function (p) { return opt('model', p.id, nameHtml(p)); }).join('') + '</section>' +
      '<section class="fgroup"><h3>' + both('اللون', 'Colour') + '</h3><div class="fcolours">' + COLOURS.map(function (c) {
        var on = F.colour.indexOf(c.ar) > -1, n = countFor('colour', c.ar);
        return '<button type="button" class="fcol' + (on ? ' is-on' : '') + (n || on ? '' : ' is-empty') + '" data-dim="colour" data-val="' + esc(c.ar) + '" aria-pressed="' + on + '"><i style="background:' + c.hex + '"></i><span>' + both(esc(c.ar), esc(c.en)) + '</span></button>';
      }).join('') + '</div></section>' +
      '<section class="fgroup"><h3>' + both('السعر', 'Price') + '</h3>' + PRICES.map(function (v) { return opt('price', String(v), price(v)); }).join('') + '</section>';
    var go = $('#fapply'); if (go) { var n = results().length; go.innerHTML = both('اعرض ' + itemsAr(n), 'Show ' + n + (n === 1 ? ' item' : ' items')); }
  }
  function toggleIn(arr, v) { var i = arr.indexOf(v); if (i > -1) arr.splice(i, 1); else arr.push(v); }
  function clearAll() { F.model = []; F.colour = []; F.price = []; F.q = ''; var si = $('#search'); if (si) si.value = ''; renderGrid(); }
  function toShop() { var s = $('#shop'); if (s) s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }

  if (grid) {
    renderGrid(); renderWishCount();
    document.addEventListener('click', function (e) {
      var t;
      if ((t = e.target.closest('[data-wish]'))) { e.preventDefault(); toggleWish(t.dataset.wish); return; }
      if ((t = e.target.closest('.card [data-quick]'))) { var cd = t.closest('.card'); openQuick(cd.dataset.p, cd.dataset.c); return; }
      if ((t = e.target.closest('.card [data-open]'))) { e.preventDefault(); var cd2 = t.closest('.card'); openProduct(cd2.dataset.p, cd2.dataset.c); return; }
      if ((t = e.target.closest('[data-tab]'))) { F.model = t.dataset.tab ? [t.dataset.tab] : []; renderGrid(); return; }
      if ((t = e.target.closest('[data-unset]'))) {
        var dim = t.dataset.unset, v = t.dataset.val;
        if (dim === 'q') { F.q = ''; var si = $('#search'); if (si) si.value = ''; } else toggleIn(F[dim], v);
        renderGrid(); return;
      }
      if (e.target.closest('[data-clear]')) { clearAll(); return; }
      if ((t = e.target.closest('#filters [data-dim]'))) { toggleIn(F[t.dataset.dim], t.dataset.val); renderGrid(); return; }
      if (e.target.closest('#filterBtn')) { renderFilters(); showSheet($('#filters')); return; }
      if (e.target.closest('#fapply')) { hideSheet($('#filters')); toShop(); return; }
      if ((t = e.target.closest('[data-shop-model]'))) { e.preventDefault(); F.model = [t.dataset.shopModel]; renderGrid(); toShop(); return; }
      if ((t = e.target.closest('[data-shop-filter]'))) { e.preventDefault(); clearAll(); if (t.dataset.shopFilter === 'new') F.sort = 'new'; var so = $('#sort'); if (so) so.value = F.sort; renderGrid(); toShop(); return; }
    });
    var sort = $('#sort'); if (sort) sort.addEventListener('change', function () { F.sort = sort.value; renderGrid(); });
    var search = $('#search'), st;
    if (search) search.addEventListener('input', function () { clearTimeout(st); st = setTimeout(function () { F.q = search.value.trim(); renderGrid(); }, 160); });
    var focusSearch = $('[data-search]');
    if (focusSearch) focusSearch.addEventListener('click', function () { toShop(); setTimeout(function () { if (search) search.focus({ preventScroll: true }); }, reduce ? 0 : 450); });
  }

  /* ---------- shop by model tiles ---------- */
  var tiles = $('#tiles');
  if (tiles) tiles.innerHTML = P.map(function (p) {
    var c = p.colours[0], n = p.colours.length;
    return '<a class="tile" href="#shop" data-shop-model="' + p.id + '"><span class="tile__img"><img src="' + (c.imgLarge || c.img) + '" alt="" loading="lazy"></span>' +
      '<span class="tile__text"><b>' + nameHtml(p) + '</b><span>' + both(n + ' ألوان، ' + '<bdi>' + num(p.price) + '</bdi> د.أ', n + ' colours, JOD ' + num(p.price)) + '</span></span>' +
      '<svg class="arr" aria-hidden="true"><use href="#arrow"/></svg></a>';
  }).join('');

  /* ---------- wishlist sheet ---------- */
  function renderWishSheet() {
    var box = $('#wbody'); if (!box) return;
    var list = ITEMS.filter(function (it) { return isWish(it.key); });
    box.innerHTML = list.length ? '<ul class="items">' + list.map(function (it) {
      return '<li class="item" data-key="' + it.key + '"><img src="' + it.c.img + '" alt="">' +
        '<div><p class="item__name">' + nameHtml(it.p) + '</p><p class="item__meta">' + both(esc(it.c.ar), esc(it.c.en)) + '</p><p class="item__price">' + price(it.p.price) + '</p></div>' +
        '<div class="item__end"><button type="button" class="btn btn--solid wbtn" data-wopen="' + it.key + '">' + both('اختار المقاس', 'Choose size') + '</button>' +
        '<button type="button" class="wrm" data-wish="' + it.key + '">' + both('إزالة', 'Remove') + '</button></div></li>';
    }).join('') + '</ul>' : '<div class="empty">' + HEART + '<p>' + both('ما في شي بالمفضلة لسا.', 'Your wishlist is empty.') + '</p><p class="empty__sub">' + both('اضغط على القلب بأي قطعة لتحفظها هون.', 'Tap the heart on any piece to save it here.') + '</p></div>';
  }
  $$('[data-wishlist]').forEach(function (b) { b.addEventListener('click', function () { renderWishSheet(); showSheet($('#wish')); }); });
  var wsheet = $('#wish');
  if (wsheet) wsheet.addEventListener('click', function (e) {
    var t = e.target.closest('[data-wopen]');
    if (t) { var it = ITEMS.filter(function (x) { return x.key === t.dataset.wopen; })[0]; hideSheet(wsheet, true); openProduct(it.p.id, it.c.id); return; }
    if (e.target.closest('[data-wish]')) setTimeout(renderWishSheet, 0);
  });

  /* ---------- quick add (from the card) ---------- */
  var quick = { p: null, c: null };
  function openQuick(pid, cid) {
    var p = byId[pid], c = colourOf(p, cid), sz = sizesOf(p);
    if (!sz) { addToBag(p.id, c.id, null); toast(both('انضافت للسلة', 'Added to bag')); return; }
    quick = { p: p, c: c };
    $('#qbody').innerHTML = '<div class="q__item"><img src="' + c.img + '" alt=""><div><p class="item__name">' + nameHtml(p) + '</p><p class="item__meta">' + both(esc(c.ar), esc(c.en)) + '</p><p class="item__price">' + price(p.price) + '</p></div></div>' +
      '<p class="pd__label">' + both('اختار المقاس وبتنضاف للسلة', 'Pick a size to add it') + '</p>' +
      '<div class="sizes">' + sz.map(function (s) { return '<button type="button" class="size" data-qsize="' + s + '">' + s + '</button>'; }).join('') + '</div>' +
      '<button type="button" class="q__more" data-qmore>' + both('شوف التفاصيل', 'View details') + '</button>';
    showSheet($('#quick'));
  }
  var qs = $('#quick');
  if (qs) qs.addEventListener('click', function (e) {
    var t = e.target.closest('[data-qsize]');
    if (t) {
      t.classList.add('is-on');
      addToBag(quick.p.id, quick.c.id, t.dataset.qsize);
      setTimeout(function () { hideSheet(qs); toast(both('انضافت للسلة، المقاس <bdi>' + t.dataset.qsize + '</bdi>', 'Added to bag, size ' + t.dataset.qsize)); }, 180);
      return;
    }
    if (e.target.closest('[data-qmore]')) { hideSheet(qs, true); openProduct(quick.p.id, quick.c.id); }
  });

  /* ---------- films (home page only) ---------- */
  var rail = $('#films-rail');
  if (rail) {
    var seen = {}, films = [];
    P.forEach(function (p) {
      p.colours.forEach(function (c) { if (c.video && !seen[c.video]) { seen[c.video] = 1; films.push({ p: p, c: c, video: c.video, poster: c.poster }); } });
      (p.films || []).forEach(function (f) { if (f.video && !seen[f.video]) { seen[f.video] = 1; films.push({ p: p, c: colourOf(p, f.colour), video: f.video, poster: f.poster }); } });
    });
    rail.innerHTML = films.map(function (f) {
      return '<button class="film" type="button" data-p="' + f.p.id + '" data-c="' + f.c.id + '">' +
        '<video muted playsinline loop preload="none" poster="' + (f.poster || f.c.img) + '" data-src="' + f.video + '"></video>' +
        '<span class="film__label"><b>' + nameHtml(f.p) + '</b><span>' + both(esc(f.c.ar), esc(f.c.en)) + '</span></span></button>';
    }).join('');
    rail.addEventListener('click', function (e) { var f = e.target.closest('.film'); if (f) openProduct(f.dataset.p, f.dataset.c); });
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          var v = en.target;
          if (en.isIntersecting) { if (!v.src) v.src = v.dataset.src; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
          else v.pause();
        });
      }, { threshold: .45 });
      $$('video', rail).forEach(function (v) { io.observe(v); });
    }
  }
  var heroV = $('.hero__video');
  if (heroV && reduce) { heroV.removeAttribute('autoplay'); heroV.pause(); }

  /* ---------- sheets ---------- */
  var openSheet = null, lastFocus = null;
  function showSheet(el) {
    if (openSheet && openSheet !== el) hideSheet(openSheet, true);
    lastFocus = document.activeElement;
    el.hidden = false; void el.offsetWidth; el.classList.add('is-on');
    document.body.classList.add('sheet-open'); openSheet = el;
    var x = $('.sheet__x', el); if (x) x.focus({ preventScroll: true });
  }
  function hideSheet(el, quick) {
    el.classList.remove('is-on');
    if (openSheet === el) openSheet = null;
    if (!openSheet) document.body.classList.remove('sheet-open');
    var done = function () { if (!el.classList.contains('is-on')) el.hidden = true; };
    if (quick) done(); else setTimeout(done, 420);
    if (!quick && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    if (el.id === 'product' && /^#p-/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
  }
  $$('.sheet').forEach(function (sh) {
    sh.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) hideSheet(sh); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openSheet && !Z) hideSheet(openSheet); });

  /* ---------- product sheet: one image, colour, size, add ---------- */
  var pdEl = $('#pd'), state = null;
  function openProduct(pid, cid) {
    var p = byId[pid]; if (!p) return;
    state = { p: p, c: colourOf(p, cid).id, s: null, done: false, warn: false };
    var sz = sizesOf(p); if (sz && sz.length === 1) state.s = sz[0];
    renderProduct();
    showSheet($('#product'));
    $$('#product .pd, #product .pd__side').forEach(function (el) { el.scrollTop = 0; });
    history.replaceState(null, '', '#p-' + p.id + '-' + state.c);
  }
  function relatedHtml(p, c) {
    var others = ITEMS.filter(function (it) { return it.p.id !== p.id; }).sort(function (x, y) { return x.rank - y.rank; });
    var same = ITEMS.filter(function (it) { return it.p.id === p.id && it.c.id !== c.id; });
    var list = others.slice(0, 4).concat(same.slice(0, 4)).slice(0, 8);
    if (!list.length) return '';
    return '<div class="related"><h3>' + both('قد يعجبك كمان', 'You may also like') + '</h3><div class="related__rail">' + list.map(function (it) {
      return '<button type="button" class="rcard" data-rel="' + it.key + '"><span class="rcard__img"><img src="' + it.c.img + '" alt="" loading="lazy"></span><span class="rcard__price">' + price(it.p.price) + '</span><span class="rcard__name">' + nameHtml(it.p) + '</span><span class="rcard__meta">' + both(esc(it.c.ar), esc(it.c.en)) + '</span></button>';
    }).join('') + '</div></div>';
  }
  function renderProduct() {
    var p = state.p, c = colourOf(p, state.c), sz = sizesOf(p), inOffer = S.offer && p.category === S.offer.category;
    pdEl.innerHTML =
      '<div class="pd__media"><button class="pd__zoom" type="button" data-zoom aria-label="zoom"><img class="pd__img" src="' + (c.imgLarge || c.img) + '" alt="' + esc(p.name.ar + ' ' + c.ar) + '" draggable="false">' +
        '<span class="pd__zoomhint"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M15.5 15.5 20 20M10.5 7.5v6M7.5 10.5h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span></button></div>' +
      '<div class="pd__side">' +
        '<div class="pd__scroll"><div class="pd__info">' +
          '<nav class="crumbs" aria-label="breadcrumb"><a href="#top" data-close>' + both('الرئيسية', 'Home') + '</a><span>/</span><a href="#shop" data-close data-crumb-all>' + both('البلايز', 'Knitwear') + '</a><span>/</span><b>' + nameHtml(p) + '</b></nav>' +
          '<div class="pd__top">' + (p.badge ? '<p class="pd__badge">' + both(esc(p.badge.ar), esc(p.badge.en)) + '</p>' : '') +
            '<div class="pd__titlerow"><h2 class="pd__name" id="pTitle">' + nameHtml(p) + '</h2>' +
            '<button class="pd__heart' + (isWish(p.id + '-' + c.id) ? ' is-on' : '') + '" type="button" data-wish="' + p.id + '-' + c.id + '" aria-pressed="' + isWish(p.id + '-' + c.id) + '" aria-label="wishlist">' + HEART + '</button></div>' +
            '<p class="pd__price">' + price(p.price) + '</p>' +
            (inOffer ? '<p class="pd__deal"><svg aria-hidden="true"><use href="#spark"/></svg>' + both('أي ' + S.offer.qty + ' بلايز بـ<bdi>' + num(S.offer.price) + '</bdi> د.أ', 'Any ' + S.offer.qty + ' for JOD ' + num(S.offer.price)) + '</p>' : '') +
          '</div>' +
          (p.colours.length > 1 ? '<div class="pd__block"><p class="pd__label">' + both('اللون', 'Colour') + '<b>' + both(esc(c.ar), esc(c.en)) + '</b></p>' +
            '<div class="swatches">' + p.colours.map(function (k) {
              return '<button class="swatch' + (k.id === c.id ? ' is-on' : '') + '" type="button" data-colour="' + k.id + '" aria-label="' + esc(isAr() ? k.ar : k.en) + '" aria-pressed="' + (k.id === c.id) + '"><img src="' + k.img + '" alt="" draggable="false"></button>';
            }).join('') + '</div></div>' : '') +
          (sz ? '<div class="pd__block"><p class="pd__label">' + both('المقاس', 'Size') + (state.s ? '<b>' + state.s + '</b>' : '') + '</p>' +
            '<div class="sizes' + (state.warn ? ' is-shake' : '') + '">' + sz.map(function (s) {
              return '<button class="size' + (state.s === s ? ' is-on' : '') + '" type="button" data-size="' + s + '" aria-pressed="' + (state.s === s) + '">' + s + '</button>';
            }).join('') + '</div>' +
            (state.warn ? '<p class="pd__warn">' + both('اختار المقاس أول', 'Please choose a size') + '</p>' : '') +
            '<a class="pd__help" href="' + waUrl(isAr() ? 'مرحبا، بدي مساعدة باختيار مقاس ' + p.name.ar + '. طولي: ، وزني: ' : 'Hi, I need help choosing a size for the ' + p.name.en + '. Height: , weight: ') + '" target="_blank" rel="noopener">' + both('مش متأكد من مقاسك؟ اسألنا على واتساب', 'Not sure? Ask us on WhatsApp') + '</a></div>' : '') +
          '<div class="pd__more">' +
            '<details open><summary>' + both('تفاصيل القطعة', 'Details') + '</summary><ul class="specs">' +
              (p.tagline ? '<li>' + both(esc(p.tagline.ar), esc(p.tagline.en)) + '</li>' : '') +
              (p.specs || []).map(function (x) { return '<li>' + both(esc(x.ar), esc(x.en)) + '</li>'; }).join('') + '</ul></details>' +
            (sz ? '<details><summary>' + both('المقاسات', 'Sizes') + '</summary><p>' + both('متوفرة بمقاسات <bdi>' + sz.join(' ') + '</bdi>. إذا محتار، ابعتلنا طولك ووزنك على واتساب ومنساعدك.', 'Available in ' + sz.join(', ') + '. Not sure? Send us your height and weight on WhatsApp.') + '</p></details>' : '') +
            '<details><summary>' + both('التوصيل والطلب', 'Delivery and ordering') + '</summary><p>' + both('التوصيل لكل محافظات المملكة بـ<bdi>' + num(S.delivery) + '</bdi> د.أ للطلب كله. الطلب بيوصلنا على واتساب ومنأكد معك.', 'Delivery anywhere in Jordan for JOD ' + num(S.delivery) + ' per order. Your order reaches us on WhatsApp and we confirm it with you.') + '</p></details>' +
          '</div>' +
          relatedHtml(p, c) +
        '</div></div>' +
        '<div class="pd__foot">' +
          '<button class="btn btn--solid btn--arrow pd__add" type="button" data-add><span>' + both('أضف للسلة', 'ADD TO BAG') + '</span><svg class="arr" aria-hidden="true"><use href="#arrow"/></svg></button>' +
          '<button class="btn btn--line pd__buy" type="button" data-buy>' + both('اطلبها الآن', 'ORDER NOW') + '</button>' +
        '</div>' +
      '</div>';
    state.warn = false;
  }
  function renderDone() {
    var p = state.p, c = colourOf(p, state.c), o = offerInfo(bag);
    pdEl.innerHTML = '<div class="done">' +
      '<p class="done__head"><i><svg aria-hidden="true"><use href="#check"/></svg></i>' + both('انضافت للسلة', 'Added to your bag') + '</p>' +
      '<div class="done__item"><img src="' + c.img + '" alt=""><p>' + nameHtml(p) + '<small>' + both(esc(c.ar) + (state.s ? '، المقاس <bdi>' + state.s + '</bdi>' : ''), esc(c.en) + (state.s ? ', size ' + state.s : '')) + '</small></p></div>' +
      nudgeHtml(o) +
      '<div class="done__btns">' +
        '<button class="btn btn--solid btn--block btn--arrow" type="button" data-go-checkout><span>' + both('اطلب الآن', 'ORDER NOW') + '</span><svg class="arr" aria-hidden="true"><use href="#arrow"/></svg></button>' +
        '<button class="btn btn--line btn--block" type="button" data-close>' + both('كمّل تسوّق', 'KEEP SHOPPING') + '</button>' +
      '</div></div>';
    var go = $('[data-go-checkout]', pdEl); if (go) go.focus({ preventScroll: true });
  }
  if (pdEl) pdEl.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-colour]'))) {
      state.c = t.dataset.colour; renderProduct();
      history.replaceState(null, '', '#p-' + state.p.id + '-' + state.c); return;
    }
    if ((t = e.target.closest('[data-size]'))) { state.s = t.dataset.size; renderProduct(); return; }
    if ((t = e.target.closest('[data-zoom]'))) { openZoom($('img', t)); return; }
    if ((t = e.target.closest('[data-rel]'))) { var it = ITEMS.filter(function (x) { return x.key === t.dataset.rel; })[0]; openProduct(it.p.id, it.c.id); var sc = $('.pd', $('#product')); if (sc) sc.scrollTop = 0; var side = $('.pd__side', $('#product')); if (side) side.scrollTop = 0; return; }
    if (e.target.closest('[data-crumb-all]')) { e.preventDefault(); clearAll(); setTimeout(toShop, 50); return; }
    if (e.target.closest('[data-wish]')) return;
    if (e.target.closest('[data-add]') || e.target.closest('[data-buy]')) {
      var buy = !!e.target.closest('[data-buy]');
      if (sizesOf(state.p) && !state.s) {
        state.warn = true; renderProduct();
        var sizes = $('.sizes', pdEl); if (sizes) sizes.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
        return;
      }
      addToBag(state.p.id, state.c, state.s);
      if (buy) { hideSheet($('#product'), true); openCheckout(); return; }
      state.done = true; renderDone(); return;
    }
    if (e.target.closest('[data-go-checkout]')) { hideSheet($('#product'), true); openCheckout(); }
  });

  /* ---------- checkout: items, totals, three fields, one button ---------- */
  var GOVS = [['عمّان', 'Amman'], ['إربد', 'Irbid'], ['الزرقاء', 'Zarqa'], ['البلقاء', 'Balqa'], ['مادبا', 'Madaba'], ['المفرق', 'Mafraq'], ['جرش', 'Jerash'], ['عجلون', 'Ajloun'], ['الكرك', 'Karak'], ['الطفيلة', 'Tafilah'], ['معان', "Ma'an"], ['العقبة', 'Aqaba']];
  var form = { name: '', gov: '', addr: '' };
  try { var f0 = JSON.parse(localStorage.getItem('brkx-form-v1') || '{}'); form.name = f0.name || ''; form.addr = f0.addr || ''; form.gov = f0.gov || ''; } catch (e) {}
  function govIndex(v) { for (var i = 0; i < GOVS.length; i++) if (GOVS[i][0] === v || GOVS[i][1] === v) return i; return -1; }
  var coEl = $('#co');
  function openCheckout() { renderCheckout(); showSheet($('#checkout')); }
  function renderCheckout(bad) {
    bad = bad || {};
    if (!bag.length) {
      coEl.innerHTML = '<div class="empty"><svg aria-hidden="true"><use href="#spark"/></svg><p>' + both('السلة فاضية.', 'Your bag is empty.') + '</p>' +
        '<button class="btn btn--solid" type="button" data-shop>' + both('تسوّق الآن', 'Start shopping') + '</button></div>';
      return;
    }
    var t = totals(bag), gi = govIndex(form.gov);
    coEl.innerHTML = '<div class="co__scroll">' +
      '<ul class="items">' + bag.map(function (it, i) {
        var p = byId[it.p], c = colourOf(p, it.c);
        return '<li class="item" data-i="' + i + '"><img src="' + c.img + '" alt="">' +
          '<div><p class="item__name">' + nameHtml(p) + '</p><p class="item__meta">' + both(esc(c.ar) + (it.s ? '، المقاس <bdi>' + it.s + '</bdi>' : ''), esc(c.en) + (it.s ? ', size ' + it.s : '')) + '</p></div>' +
          '<div class="item__end"><p class="item__price">' + price(p.price * it.q) + '</p>' +
            '<div class="qty"><button type="button" data-q="-1" aria-label="' + (it.q === 1 ? 'remove' : 'minus') + '">' + (it.q === 1 ? '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>' : '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>') + '</button><span>' + it.q + '</span><button type="button" data-q="1" aria-label="plus"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 12h12M12 6v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>' +
          '</div></li>';
      }).join('') + '</ul>' +
      nudgeHtml(t.offer) +
      '<div class="sum">' +
        '<p><span>' + both('المجموع', 'Subtotal') + '</span><span>' + price(t.sub) + '</span></p>' +
        (t.disc ? '<p class="is-disc"><span>' + both('خصم العرض', 'Offer discount') + '</span><span>' + both('<bdi dir="ltr">-' + num(t.disc) + '</bdi> د.أ', '-JOD ' + num(t.disc)) + '</span></p>' : '') +
        '<p><span>' + both('التوصيل', 'Delivery') + '</span><span>' + price(S.delivery) + '</span></p>' +
        '<p class="is-total"><span>' + both('الإجمالي', 'Total') + '</span><span>' + price(t.total) + '</span></p>' +
      '</div>' +
      '<div class="form">' +
        '<p class="form__title">' + both('لوين نوصّلها؟', 'Where should we deliver?') + '</p>' +
        '<label class="fld' + (bad.name ? ' is-bad' : '') + '"><span>' + both('الاسم', 'Name') + '</span><input name="name" type="text" autocomplete="name" value="' + esc(form.name) + '"><em class="fld__err">' + both('اكتب اسمك', 'Enter your name') + '</em></label>' +
        '<label class="fld' + (bad.gov ? ' is-bad' : '') + '"><span>' + both('المحافظة', 'Governorate') + '</span><select name="gov"><option value="">' + (isAr() ? 'اختار المحافظة' : 'Choose') + '</option>' +
          GOVS.map(function (g, i) { return '<option value="' + esc(g[0]) + '"' + (i === gi ? ' selected' : '') + '>' + esc(isAr() ? g[0] : g[1]) + '</option>'; }).join('') +
        '</select><em class="fld__err">' + both('اختار المحافظة', 'Choose your governorate') + '</em></label>' +
        '<label class="fld' + (bad.addr ? ' is-bad' : '') + '"><span>' + both('المنطقة والعنوان', 'Area and address') + '</span><input name="addr" type="text" autocomplete="street-address" value="' + esc(form.addr) + '"><em class="fld__err">' + both('اكتب منطقتك', 'Enter your area') + '</em></label>' +
      '</div>' +
    '</div>' +
    '<div class="co__foot"><button class="btn btn--solid co__send" type="button" data-send><svg aria-hidden="true"><use href="#wa"/></svg>' + both('أرسل الطلب على واتساب', 'SEND ORDER ON WHATSAPP') + '</button>' +
      '<p class="co__note">' + both('بينفتح واتساب برسالة جاهزة فيها طلبك، وقصي بأكد معك.', 'WhatsApp opens with your order written out, and Qusai confirms it with you.') + '</p></div>';
  }
  function orderMessage() {
    var t = totals(bag), ar = isAr(), gi = govIndex(form.gov);
    var lines = bag.map(function (it, i) {
      var p = byId[it.p], c = colourOf(p, it.c);
      return ar
        ? (i + 1) + ') ' + p.name.ar + ' - ' + c.ar + (it.s ? ' - ' + it.s : '') + ' - العدد ' + it.q + ' - ' + num(p.price * it.q) + ' د.أ'
        : (i + 1) + ') ' + p.name.en + ' - ' + c.en + (it.s ? ' - ' + it.s : '') + ' - qty ' + it.q + ' - JOD ' + num(p.price * it.q);
    }).join('\n');
    if (ar) {
      return 'مرحبا، بدي أطلب من BRKX STORE:\n\n' + lines + '\n\nالمجموع: ' + num(t.sub) + ' د.أ' +
        (t.disc ? '\nخصم العرض: -' + num(t.disc) + ' د.أ' : '') + '\nالتوصيل: ' + num(S.delivery) + ' د.أ\nالإجمالي: ' + num(t.total) + ' د.أ' +
        '\n\nالاسم: ' + form.name + '\nالمحافظة: ' + (gi > -1 ? GOVS[gi][0] : form.gov) + '\nالعنوان: ' + form.addr;
    }
    return "Hi, I'd like to order from BRKX STORE:\n\n" + lines + '\n\nSubtotal: JOD ' + num(t.sub) +
      (t.disc ? '\nOffer discount: -JOD ' + num(t.disc) : '') + '\nDelivery: JOD ' + num(S.delivery) + '\nTotal: JOD ' + num(t.total) +
      '\n\nName: ' + form.name + '\nGovernorate: ' + (gi > -1 ? GOVS[gi][1] : form.gov) + '\nAddress: ' + form.addr;
  }
  if (coEl) {
    coEl.addEventListener('click', function (e) {
      var li = e.target.closest('.item'), t;
      if ((t = e.target.closest('[data-q]')) && li) {
        var i = +li.dataset.i, d = +t.dataset.q;
        bag[i].q += d; if (bag[i].q < 1) bag.splice(i, 1);
        saveBag(); renderBar(); renderCheckout(); return;
      }
      if (e.target.closest('[data-shop]')) { hideSheet($('#checkout')); var s = $('#shop'); if (s) s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); return; }
      if (e.target.closest('[data-send]')) {
        var bad = { name: !form.name, gov: !form.gov, addr: !form.addr };
        if (bad.name || bad.gov || bad.addr) {
          renderCheckout(bad);
          var first = $('.fld.is-bad input, .fld.is-bad select', coEl);
          if (first) { first.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); setTimeout(function () { first.focus({ preventScroll: true }); }, 250); }
          return;
        }
        window.open(waUrl(orderMessage()), '_blank', 'noopener');
      }
    });
    function keep(e) {
      if (!e.target.name) return;
      form[e.target.name] = e.target.value.trim();
      var f = e.target.closest('.fld'); if (f && form[e.target.name]) f.classList.remove('is-bad');
      try { localStorage.setItem('brkx-form-v1', JSON.stringify(form)); } catch (er) {}
    }
    coEl.addEventListener('input', keep); coEl.addEventListener('change', keep);
  }
  $$('[data-checkout]').forEach(function (b) { b.addEventListener('click', openCheckout); });

  /* general WhatsApp links */
  $$('.js-wa').forEach(function (a) { a.href = waUrl(isAr() ? 'مرحبا، عندي سؤال عن BRKX STORE' : 'Hi, I have a question about BRKX STORE'); });

  /* =========================================================
     MEDIA PROTECTION: no context menu, no drag, no long-press save
     (stops casual saving; nothing on the web can fully block a determined copy)
     ========================================================= */
  function isMedia(t) { return t && t.closest && t.closest('img, video, svg, picture, .card__img, .film, .hero__media, .pd__media, .zoom, .promo__pics, .top__logo, .foot__logo'); }
  document.addEventListener('contextmenu', function (e) { if (isMedia(e.target)) e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { if (isMedia(e.target)) e.preventDefault(); });
  function lockMedia(scope) {
    $$('img', scope).forEach(function (i) { i.setAttribute('draggable', 'false'); });
    $$('video', scope).forEach(function (v) { v.setAttribute('controlslist', 'nodownload noplaybackrate noremoteplayback'); v.setAttribute('disablepictureinpicture', ''); v.disablePictureInPicture = true; });
  }
  lockMedia(document);
  new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) lockMedia(n.parentNode || n); }); }); })
    .observe(document.body, { childList: true, subtree: true });

  /* =========================================================
     ZOOM VIEWER: framed image that flies in from the product photo,
     pinch / double-tap / wheel / buttons to zoom, drag to move
     ========================================================= */
  var Z = null;
  function openZoom(src) {
    if (!src || Z) return;
    var el = document.createElement('div');
    el.className = 'zoom'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'zoom');
    el.innerHTML = '<div class="zoom__bg" data-zx></div>' +
      '<div class="zoom__frame"><div class="zoom__stage"><img src="' + src.currentSrc + '" alt="" draggable="false"></div></div>' +
      '<div class="zoom__bar">' +
        '<button type="button" data-zo aria-label="zoom out"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
        '<button type="button" data-zr class="zoom__pct">100%</button>' +
        '<button type="button" data-zi aria-label="zoom in"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12M12 6v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
      '</div>' +
      '<button class="zoom__x" type="button" data-zx aria-label="close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>' +
      '<p class="zoom__hint">' + both('اقرص أو اضغط مرتين للتكبير', 'Pinch or double-tap to zoom') + '</p>';
    document.body.appendChild(el);
    var frame = $('.zoom__frame', el), stage = $('.zoom__stage', el), img = $('img', el), pct = $('.zoom__pct', el);
    Z = { el: el, s: 1, x: 0, y: 0, src: src };

    // size the frame to the photo, fitted to the screen
    var nw = src.naturalWidth || 3, nh = src.naturalHeight || 4;
    var maxW = Math.min(window.innerWidth - 32, 760), maxH = window.innerHeight - 170;
    var k = Math.min(maxW / nw, maxH / nh), fw = Math.round(nw * k), fh = Math.round(nh * k);
    frame.style.width = fw + 'px'; frame.style.height = fh + 'px';

    // fly in from the product photo
    var r = src.getBoundingClientRect(), f = frame.getBoundingClientRect();
    var sx = r.width / f.width, sy = r.height / f.height;
    frame.style.transition = 'none';
    frame.style.transform = 'translate(' + (r.left + r.width / 2 - (f.left + f.width / 2)) + 'px,' + (r.top + r.height / 2 - (f.top + f.height / 2)) + 'px) scale(' + sx + ',' + sy + ')';
    frame.style.borderRadius = '0px';
    void frame.offsetWidth;
    frame.style.transition = ''; frame.style.transform = ''; frame.style.borderRadius = '';
    el.classList.add('is-on');
    $('[data-zi]', el).focus({ preventScroll: true });

    function clamp() {
      var mx = (fw * Z.s - fw) / 2, my = (fh * Z.s - fh) / 2;
      Z.x = Math.max(-mx, Math.min(mx, Z.x)); Z.y = Math.max(-my, Math.min(my, Z.y));
    }
    function apply(anim) {
      Z.s = Math.max(1, Math.min(4, Z.s)); clamp();
      img.style.transition = anim ? 'transform .35s cubic-bezier(.2,.8,.2,1)' : 'none';
      img.style.transform = 'translate(' + Z.x + 'px,' + Z.y + 'px) scale(' + Z.s + ')';
      pct.textContent = Math.round(Z.s * 100) + '%';
      el.classList.toggle('is-zoomed', Z.s > 1.01);
    }
    function zoomAt(ns, cx, cy, anim) {
      var b = stage.getBoundingClientRect(), px = cx - (b.left + b.width / 2), py = cy - (b.top + b.height / 2);
      ns = Math.max(1, Math.min(4, ns));
      Z.x = px - (px - Z.x) * (ns / Z.s); Z.y = py - (py - Z.y) * (ns / Z.s); Z.s = ns;
      apply(anim);
    }
    function centre() { var b = stage.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }

    // pointers: pinch, pan, double tap
    var pts = {}, start = null, lastTap = 0;
    stage.addEventListener('pointerdown', function (e) {
      stage.setPointerCapture(e.pointerId); pts[e.pointerId] = [e.clientX, e.clientY];
      var ids = Object.keys(pts);
      if (ids.length === 2) {
        var a = pts[ids[0]], b = pts[ids[1]];
        start = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: Z.s, cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2 };
      } else start = { px: e.clientX, py: e.clientY, x: Z.x, y: Z.y, moved: false };
    });
    stage.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return;
      pts[e.pointerId] = [e.clientX, e.clientY];
      var ids = Object.keys(pts);
      if (ids.length === 2 && start && start.d) {
        var a = pts[ids[0]], b = pts[ids[1]];
        zoomAt(start.s * Math.hypot(a[0] - b[0], a[1] - b[1]) / start.d, start.cx, start.cy, false);
      } else if (ids.length === 1 && start && start.px != null) {
        var dx = e.clientX - start.px, dy = e.clientY - start.py;
        if (Math.abs(dx) + Math.abs(dy) > 6) start.moved = true;
        if (Z.s > 1) { Z.x = start.x + dx; Z.y = start.y + dy; apply(false); }
      }
    });
    function up(e) {
      var wasTap = start && start.px != null && !start.moved && Object.keys(pts).length === 1;
      delete pts[e.pointerId];
      if (Object.keys(pts).length === 1) { var id = Object.keys(pts)[0]; start = { px: pts[id][0], py: pts[id][1], x: Z.x, y: Z.y, moved: true }; }
      else if (!Object.keys(pts).length) start = null;
      if (wasTap) {
        var now = Date.now();
        if (now - lastTap < 320) { zoomAt(Z.s > 1.01 ? 1 : 2.5, e.clientX, e.clientY, true); lastTap = 0; }
        else lastTap = now;
      }
    }
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    stage.addEventListener('wheel', function (e) { e.preventDefault(); zoomAt(Z.s * Math.exp(-e.deltaY * 0.0022), e.clientX, e.clientY, false); }, { passive: false });

    el.addEventListener('click', function (e) {
      var c = centre();
      if (e.target.closest('[data-zi]')) zoomAt(Z.s + .75, c[0], c[1], true);
      else if (e.target.closest('[data-zo]')) zoomAt(Z.s - .75, c[0], c[1], true);
      else if (e.target.closest('[data-zr]')) { Z.s = 1; Z.x = 0; Z.y = 0; apply(true); }
      else if (e.target.closest('[data-zx]')) closeZoom();
    });
    Z.key = function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); closeZoom(); }
      else if (e.key === '+' || e.key === '=') { var c = centre(); zoomAt(Z.s + .75, c[0], c[1], true); }
      else if (e.key === '-') { var d = centre(); zoomAt(Z.s - .75, d[0], d[1], true); }
    };
    document.addEventListener('keydown', Z.key, true);
  }
  function closeZoom() {
    if (!Z) return;
    var z = Z; Z = null;
    document.removeEventListener('keydown', z.key, true);
    var frame = $('.zoom__frame', z.el), r = z.src.getBoundingClientRect(), f = frame.getBoundingClientRect();
    $('img', z.el).style.transform = '';
    frame.style.transform = 'translate(' + (r.left + r.width / 2 - (f.left + f.width / 2)) + 'px,' + (r.top + r.height / 2 - (f.top + f.height / 2)) + 'px) scale(' + (r.width / f.width) + ',' + (r.height / f.height) + ')';
    frame.style.borderRadius = '0px';
    z.el.classList.remove('is-on');
    setTimeout(function () { z.el.remove(); }, 420);
    var b = $('[data-zoom]'); if (b) b.focus({ preventScroll: true });
  }

  /* ---------- deep link: #p-<product>-<colour> ---------- */
  (function () {
    var m = /^#p-([a-z0-9]+)(?:-([a-z0-9]+))?$/i.exec(location.hash);
    if (m && byId[m[1]]) setTimeout(function () { openProduct(m[1], m[2]); }, 200);
  })();

  /* ---------- offer popup: once per visit ---------- */
  (function promo() {
    var O = S.offer; if (!O) return;
    try { if (sessionStorage.getItem('brkx-promo-v1') || /^#p-/.test(location.hash)) return; } catch (e) {}
    var list = P.filter(function (p) { return p.category === O.category; });
    var full = list.slice(0, O.qty).reduce(function (s, p) { return s + p.price; }, 0);
    var el = document.createElement('div');
    el.className = 'promo'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'promoT');
    el.innerHTML = '<div class="promo__scrim" data-x></div><div class="promo__card">' +
      '<button class="sheet__x" type="button" data-x aria-label="close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>' +
      '<div class="promo__pics">' + list.slice(0, 3).map(function (p) { return '<img src="' + p.colours[0].img + '" alt="">'; }).join('') + '</div>' +
      '<div class="promo__body"><h2 class="promo__title" id="promoT">' + both('عرض الـ<bdi>' + O.qty + '</bdi> بلايـز', 'Any ' + O.qty + ' for JOD ' + num(O.price)) + '</h2>' +
        '<p class="promo__price">' + both('أي <bdi>' + O.qty + '</bdi> بلايز بـ<bdi>' + num(O.price) + '</bdi> د.أ' + (full > O.price ? '<s><bdi>' + num(full) + '</bdi></s>' : ''), 'Mix any ' + O.qty + ' for JOD ' + num(O.price) + (full > O.price ? ' <s>' + num(full) + '</s>' : '')) + '</p>' +
        '<p class="promo__text">' + both('اختار اللي بدك من الموديلات والألوان، والخصم بينحسب بالسلة لحاله.', 'Pick any styles and colours. The discount is applied in your bag.') + '</p>' +
        '<button class="btn btn--solid btn--block" type="button" data-go>' + both('تسوّق العرض', 'Shop the offer') + '</button></div></div>';
    function close(go) {
      el.classList.remove('is-on');
      try { sessionStorage.setItem('brkx-promo-v1', '1'); } catch (e) {}
      document.removeEventListener('keydown', onKey);
      setTimeout(function () { el.remove(); }, 400);
      if (go) { var s = $('#shop'); if (s) s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    el.addEventListener('click', function (e) { if (e.target.closest('[data-go]')) close(true); else if (e.target.closest('[data-x]')) close(); });
    setTimeout(function () {
      if (openSheet) return;
      document.body.appendChild(el); void el.offsetWidth; el.classList.add('is-on');
      document.addEventListener('keydown', onKey);
    }, 1500);
  })();

  renderBar();
})();
