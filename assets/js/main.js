/* HIDRO: Redução de Riscos | scripts do site (vanilla, sem dependências) */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Menu no celular
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Chuva no herói (desligada para quem prefere menos movimento; pausa quando a aba fica oculta)
  var canvas = document.getElementById('rain');
  if (canvas && !reduce) {
    var ctx = canvas.getContext('2d');
    var drops = [], w = 0, h = 0, raf = null;
    var resize = function () {
      var r = canvas.getBoundingClientRect();
      w = canvas.width = Math.max(1, Math.floor(r.width));
      h = canvas.height = Math.max(1, Math.floor(r.height));
      var n = Math.min(140, Math.floor(w / 9));
      drops = [];
      for (var i = 0; i < n; i++) drops.push({ x: Math.random() * w, y: Math.random() * h, s: 5 + Math.random() * 6, l: 12 + Math.random() * 14 });
    };
    var frame = function () {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(191,227,246,0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i];
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 4, d.y + d.l);
        d.y += d.s; d.x -= 1.2;
        if (d.y > h) { d.y = -20; d.x = Math.random() * (w + 40); }
      }
      ctx.stroke();
      raf = requestAnimationFrame(frame);
    };
    resize(); frame();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); } else { frame(); }
    });
  }

  // Filtros das atividades
  var chips = document.querySelectorAll('.chip[data-filter]');
  var items = document.querySelectorAll('[data-tags]');
  if (chips.length && items.length) {
    var count = document.getElementById('filter-count');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        var f = chip.getAttribute('data-filter'), shown = 0;
        items.forEach(function (it) {
          var tags = (it.getAttribute('data-tags') || '').split(' ');
          var ok = f === 'todas' || tags.indexOf(f) !== -1;
          it.hidden = !ok;
          if (ok) shown++;
        });
        if (count) count.textContent = shown + (shown === 1 ? ' atividade' : ' atividades');
      });
    });
  }

  // Abrir/fechar todas as atividades
  var openAll = document.getElementById('open-all');
  if (openAll) {
    var expanded = false;
    openAll.addEventListener('click', function () {
      expanded = !expanded;
      document.querySelectorAll('details.acc').forEach(function (d) { if (!d.hidden) d.open = expanded; });
      openAll.textContent = expanded ? 'Recolher todas' : 'Abrir todas';
    });
  }

  // Abrir a atividade indicada na URL (#id), ao carregar e ao mudar o hash
  var openHash = function () {
    if (!location.hash || location.hash.length < 2) return;
    var target = null;
    try { target = document.querySelector(location.hash); } catch (e) { return; }
    if (target && target.tagName === 'DETAILS') { target.hidden = false; target.open = true; target.scrollIntoView(); }
  };
  openHash();
  window.addEventListener('hashchange', openHash);

  // Copiar citação
  var copyBtn = document.getElementById('copy-cite');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = document.getElementById('cite-text').innerText.trim();
      var done = function () { copyBtn.textContent = 'Citação copiada!'; setTimeout(function () { copyBtn.textContent = 'Copiar citação'; }, 2500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done);
      else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); }
    });
  }

  // Botão imprimir
  document.querySelectorAll('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });

  // Ano no rodapé
  var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();
