/* Dark Docs Starter — theme toggle, client-side search, copy buttons, TOC.
   No dependencies. Search reads assets/search-index.json. */
(function () {
  'use strict';

  /* ---------- theme ---------- */
  var KEY = 'docs-theme';
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved) document.documentElement.setAttribute('data-theme', saved);

  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    var next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
    var b = document.getElementById('theme-btn');
    if (b) b.textContent = next === 'light' ? '☾' : '☀';
  }

  /* ---------- copy buttons ---------- */
  function addCopyButtons() {
    var pres = document.querySelectorAll('main pre');
    for (var i = 0; i < pres.length; i++) {
      (function (pre) {
        var btn = document.createElement('button');
        btn.className = 'copy';
        btn.type = 'button';
        btn.textContent = 'copy';
        btn.addEventListener('click', function () {
          var code = pre.querySelector('code');
          var text = code ? code.innerText : pre.innerText;
          navigator.clipboard.writeText(text).then(function () {
            btn.textContent = 'copied';
            btn.classList.add('done');
            setTimeout(function () { btn.textContent = 'copy'; btn.classList.remove('done'); }, 1600);
          });
        });
        pre.appendChild(btn);
      })(pres[i]);
    }
  }

  /* ---------- table of contents ---------- */
  function buildTOC() {
    var box = document.getElementById('toc');
    if (!box) return;
    var hs = document.querySelectorAll('main h2, main h3');
    if (!hs.length) { box.style.display = 'none'; return; }
    var html = '<h4>On this page</h4>';
    for (var i = 0; i < hs.length; i++) {
      var h = hs[i];
      if (!h.id) h.id = h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      var pad = h.tagName === 'H3' ? ';padding-left:12px' : '';
      html += '<a href="#' + h.id + '" style="' + pad + '">' + h.textContent + '</a>';
    }
    box.innerHTML = html;
  }

  /* ---------- search ---------- */
  var docs = [], sel = -1;

  function loadIndex() {
    var input = document.getElementById('q');
    if (!input) return;
    var base = document.body.getAttribute('data-base') || '';
    fetch(base + 'assets/search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (d) { docs = d; })
      .catch(function () { docs = []; });
  }

  function score(doc, terms) {
    var hay = (doc.title + ' ' + doc.section + ' ' + doc.body).toLowerCase();
    var t = doc.title.toLowerCase();
    var s = 0;
    for (var i = 0; i < terms.length; i++) {
      if (hay.indexOf(terms[i]) === -1) return 0;   // every term must appear
      s += 1;
      if (t.indexOf(terms[i]) !== -1) s += 3;       // title matches rank higher
    }
    return s;
  }

  function run(q) {
    var box = document.getElementById('results');
    if (!box) return;
    q = q.trim().toLowerCase();
    if (q.length < 2) { box.classList.remove('open'); box.innerHTML = ''; return; }
    var terms = q.split(/\s+/);
    var base = document.body.getAttribute('data-base') || '';
    var hits = [];
    for (var i = 0; i < docs.length; i++) {
      var s = score(docs[i], terms);
      if (s > 0) hits.push({ d: docs[i], s: s });
    }
    hits.sort(function (a, b) { return b.s - a.s; });
    hits = hits.slice(0, 8);
    if (!hits.length) {
      box.innerHTML = '<div class="none">No matches for “' + q.replace(/</g, '&lt;') + '”</div>';
    } else {
      var html = '';
      for (var j = 0; j < hits.length; j++) {
        var d = hits[j].d;
        html += '<a href="' + base + d.url + '"><div class="t">' + d.title +
                '</div><div class="c">' + d.section + '</div></a>';
      }
      box.innerHTML = html;
    }
    sel = -1;
    box.classList.add('open');
  }

  function keys(e) {
    var box = document.getElementById('results');
    if (!box || !box.classList.contains('open')) return;
    var items = box.querySelectorAll('a');
    if (!items.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel += (e.key === 'ArrowDown' ? 1 : -1);
      if (sel < 0) sel = items.length - 1;
      if (sel >= items.length) sel = 0;
      for (var i = 0; i < items.length; i++) items[i].classList.toggle('sel', i === sel);
      items[sel].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && sel >= 0) {
      window.location.href = items[sel].getAttribute('href');
    } else if (e.key === 'Escape') {
      box.classList.remove('open');
    }
  }

  /* ---------- wire up ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    addCopyButtons();
    buildTOC();
    loadIndex();

    var tb = document.getElementById('theme-btn');
    if (tb) {
      tb.textContent = document.documentElement.getAttribute('data-theme') === 'light' ? '☾' : '☀';
      tb.addEventListener('click', toggleTheme);
    }

    var input = document.getElementById('q');
    if (input) {
      input.addEventListener('input', function () { run(input.value); });
      input.addEventListener('keydown', keys);
    }
    document.addEventListener('click', function (e) {
      var box = document.getElementById('results');
      if (box && !e.target.closest('.search')) box.classList.remove('open');
    });
    // "/" focuses search, the way most docs sites behave
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); if (input) input.focus(); }
    });
  });
})();
