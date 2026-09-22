/* Painel de edição do site HIDRO
 * Edita as páginas HTML diretamente no repositório do GitHub (via API), sem servidor próprio.
 * Quem pode salvar é decidido pelo GitHub: é preciso uma chave (token) com permissão de escrita no repositório. */
(function () {
  'use strict';

  var PAGES = [['index.html', 'Início'], ['jogo.html', 'O jogo'], ['plano-de-aula.html', 'Plano de aula'], ['atividades.html', 'Atividades'],
    ['inclusao.html', 'Inclusão'], ['avaliacao.html', 'Avaliação'], ['materiais.html', 'Materiais'], ['oficina.html', 'Oficinas'],
    ['sobre.html', 'Sobre'], ['404.html', 'Página não encontrada']];
  // Elementos de texto que podem ser editados (somente dentro de <main>)
  var SEL = 'main h1, main h2, main h3, main h4, main p, main li, main td, main th, main dt, main dd, main summary .ttl, main .kicker, main .eyebrow, main .tag, main .pill, main .dl-btn, main .px-btn, main figcaption, main caption, main strong.t, main .lead';
  // Blocos que podem ser duplicados ou excluídos
  var BLOCKS = 'li, tr, details.acc, article, .card, .callout, .dl-btn, .px-btn, .pill, dt, dd, p, .two-col > div, .grid > *';
  var KEY = 'hidro_painel_v1';

  var $ = function (id) { return document.getElementById(id); };
  var cfg = null, cur = null, dirty = false, pending = [], curEl = null, blockEl = null, imgEl = null;

  // ------------------------------------------------------------------ utilidades
  function setStatus(msg, cls) { var s = $('status'); s.textContent = msg || ''; s.className = 'status' + (cls ? ' ' + cls : ''); }
  function b64FromBytes(bytes) { var bin = '', ch = 0x8000; for (var i = 0; i < bytes.length; i += ch) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + ch)); return btoa(bin); }
  function b64FromString(s) { return b64FromBytes(new TextEncoder().encode(s)); }
  function stringFromB64(b) { var bin = atob(String(b).replace(/\s/g, '')); var bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return new TextDecoder().decode(bytes); }
  function slug(s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'imagem'; }
  function safeName(s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9._-]+/g, '_'); }
  function frame() { return $('quadro'); }
  function fdoc() { return frame().contentDocument; }
  function markDirty() { dirty = true; updateSave(); }
  function updateSave() { $('btn-salvar').disabled = !(dirty && cur); }

  function gh(path, opts) {
    opts = opts || {};
    var url = 'https://api.github.com/repos/' + cfg.repo + path;
    var headers = { Authorization: 'Bearer ' + cfg.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (opts.body) headers['Content-Type'] = 'application/json';
    return fetch(url, { method: opts.method || 'GET', headers: headers, body: opts.body }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (data) {
        if (!r.ok) { var e = new Error((data && data.message) || ('Erro ' + r.status)); e.status = r.status; throw e; }
        return data;
      });
    });
  }

  // ------------------------------------------------------------------ login
  function loadSaved() { try { return JSON.parse(localStorage.getItem(KEY) || sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function store(c, remember) { try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(c)); } catch (e) { /* ignora */ } }
  function clearStore() { try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } catch (e) { /* ignora */ } }

  function enter(remember) {
    return gh('').then(function (r) {
      if (r && r.permissions && r.permissions.push === false) throw new Error('A chave não tem permissão de escrita neste repositório. Confira "Contents: Read and write".');
      store(cfg, remember); showEditor();
    });
  }
  $('form-login').addEventListener('submit', function (e) {
    e.preventDefault();
    var repo = $('in-repo').value.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/\/$/, '');
    cfg = { repo: repo, branch: $('in-branch').value.trim() || 'main', token: $('in-token').value.trim() };
    var err = $('erro-login'); err.hidden = true;
    if (!/^[\w.-]+\/[\w.-]+$/.test(cfg.repo)) { err.textContent = 'Escreva o repositório no formato usuario/nome.'; err.hidden = false; return; }
    enter($('in-lembrar').checked).catch(function (ex) {
      err.textContent = ex.status === 401 ? 'A chave de acesso foi recusada. Confira se copiou o token inteiro e se ele não expirou.' : (ex.status === 404 ? 'Repositório não encontrado ou sem acesso. Confira o nome e as permissões da chave.' : ex.message);
      err.hidden = false;
    });
  });
  $('btn-sair').addEventListener('click', function () {
    if (dirty && !confirm('Há alterações não salvas. Sair mesmo assim?')) return;
    clearStore(); cfg = null; cur = null; dirty = false; location.reload();
  });
  $('btn-ajuda').addEventListener('click', function () { $('dlg-ajuda').showModal(); });

  function showEditor() {
    $('tela-login').hidden = true; $('tela-editor').hidden = false; $('btn-sair').hidden = false;
    var ul = $('lista-paginas'); ul.innerHTML = '';
    PAGES.forEach(function (p) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.className = 'pg'; b.textContent = p[1]; b.setAttribute('data-path', p[0]);
      b.addEventListener('click', function () { openPage(p[0]); });
      li.appendChild(b); ul.appendChild(li);
    });
    setStatus('Conectado a ' + cfg.repo + ' (' + cfg.branch + ')', 'ok');
    $('painel-pagina').hidden = false; $('painel-arquivos').hidden = true;
  }
  function markNav(path) {
    document.querySelectorAll('.pg').forEach(function (b) { b.setAttribute('aria-current', String(b.getAttribute('data-path') === path)); });
  }

  // ------------------------------------------------------------------ abrir página
  function openPage(path) {
    if (dirty && !confirm('Há alterações não salvas nesta página. Descartar?')) return Promise.resolve();
    $('painel-pagina').hidden = false; $('painel-arquivos').hidden = true; markNav(path);
    setStatus('Carregando ' + path + '...');
    return gh('/contents/' + path + '?ref=' + encodeURIComponent(cfg.branch)).then(function (f) {
      cur = { path: path, sha: f.sha }; pending = []; dirty = false; curEl = blockEl = imgEl = null; updateSave(); updateSel();
      mount(stringFromB64(f.content));
      setStatus('Editando ' + path, 'ok');
    }).catch(function (ex) { setStatus('Erro ao abrir: ' + ex.message, 'err'); });
  }

  function mount(html) {
    var base = new URL('../', location.href).href;
    var h = html.replace(/<script\b/gi, '<script type="text/x-hd-inert"');
    h = h.replace(/<head>/i, '<head><base href="' + base + '" data-hd-base>');
    var css = '[data-hd-edit]{cursor:text}[data-hd-edit]:hover{outline:2px dashed #2A9FD6;outline-offset:2px}[data-hd-edit]:focus{outline:2px solid #F5C451;outline-offset:2px}' +
      'main img[data-hd-img]{outline:2px dashed #2FA36B;outline-offset:2px;cursor:pointer}.hd-img-sel{outline:4px solid #E5533D !important;outline-offset:2px}' +
      '.hd-block-sel{outline:3px solid #E5533D !important;outline-offset:4px}a{cursor:default}.site-header{position:static !important}';
    h = h.replace(/<\/head>/i, '<style id="hd-editor-style">' + css + '</style></head>');
    var f = frame();
    f.onload = function () { setup(f.contentDocument); };
    f.srcdoc = h;
  }

  function setup(doc) {
    var cands = Array.prototype.slice.call(doc.querySelectorAll(SEL));
    cands.forEach(function (el) {
      if (!el.querySelector(SEL)) { el.setAttribute('contenteditable', 'true'); el.setAttribute('data-hd-edit', '1'); el.spellcheck = true; }
    });
    doc.querySelectorAll('main img').forEach(function (i) { i.setAttribute('data-hd-img', '1'); });
    doc.querySelectorAll('details').forEach(function (d) { d.setAttribute('data-hd-open', d.open ? '1' : '0'); d.open = true; });
    doc.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('a') || t.closest('summary')) e.preventDefault();
      if (t.tagName === 'IMG' && t.hasAttribute('data-hd-img')) selectImg(t); else selectImg(null);
      pick(t);
    }, true);
    doc.addEventListener('focusin', function (e) { pick(e.target); });
    doc.addEventListener('keydown', function (e) {
      if (e.target && e.target.isContentEditable && e.key === 'Enter') { e.preventDefault(); doc.execCommand('insertLineBreak'); }
    });
    doc.addEventListener('paste', function (e) {
      if (e.target && e.target.isContentEditable) { e.preventDefault(); var txt = (e.clipboardData || window.clipboardData).getData('text/plain'); doc.execCommand('insertText', false, txt); }
    });
    doc.addEventListener('input', markDirty);
    ['dragstart', 'dragover', 'drop'].forEach(function (ev) { doc.addEventListener(ev, function (e) { e.preventDefault(); }); });
  }

  // ------------------------------------------------------------------ seleção
  var LABELS = { li: 'item de lista', tr: 'linha de tabela', p: 'parágrafo', article: 'cartão', dt: 'termo', dd: 'definição', details: 'atividade' };
  function blockOf(el) { if (!el || !el.closest) return null; var b = el.closest(BLOCKS); return (b && b.closest('main')) ? b : null; }
  function pick(t) { curEl = t; setBlock(blockOf(t)); }
  function setBlock(b) {
    var d = fdoc(); if (!d) return;
    d.querySelectorAll('.hd-block-sel').forEach(function (n) { n.classList.remove('hd-block-sel'); });
    blockEl = b; if (b) b.classList.add('hd-block-sel'); updateSel();
  }
  function selectImg(i) {
    var d = fdoc(); if (!d) return;
    d.querySelectorAll('.hd-img-sel').forEach(function (n) { n.classList.remove('hd-img-sel'); });
    imgEl = i; if (i) i.classList.add('hd-img-sel'); updateSel();
  }
  function updateSel() {
    var s = $('sel-info');
    if (imgEl) s.textContent = 'Imagem selecionada';
    else if (blockEl) { var k = blockEl.tagName.toLowerCase(); s.textContent = 'Bloco: ' + (blockEl.classList.contains('card') ? 'cartão' : (k === 'details' ? 'atividade' : (LABELS[k] || k))); }
    else s.textContent = '';
  }

  // ------------------------------------------------------------------ ferramentas
  document.querySelectorAll('.tb[data-cmd]').forEach(function (b) {
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    b.addEventListener('click', function () {
      var d = fdoc(); if (!d) return; frame().contentWindow.focus(); d.execCommand(b.getAttribute('data-cmd')); markDirty();
    });
  });

  $('tb-link').addEventListener('click', function () {
    var d = fdoc(); if (!d) return; frame().contentWindow.focus();
    var a = curEl && curEl.closest ? curEl.closest('a') : null;
    var sel = d.getSelection();
    if (!a && sel && sel.anchorNode) { var n = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement; a = n ? n.closest('a') : null; }
    if (a) {
      var v = prompt('Endereço do link (URL, página ou arquivo, por exemplo materiais/arquivo.pdf). Deixe vazio para remover o link:', a.getAttribute('href') || '');
      if (v === null) return;
      if (v.trim() === '') { while (a.firstChild) a.parentNode.insertBefore(a.firstChild, a); a.remove(); } else a.setAttribute('href', v.trim());
      markDirty(); return;
    }
    if (sel && !sel.isCollapsed) { var u = prompt('Endereço do link:', 'https://'); if (u) { d.execCommand('createLink', false, u.trim()); markDirty(); } }
    else alert('Selecione o texto que vira link ou clique em um botão ou link existente.');
  });

  var fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.accept = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml'; fileInput.hidden = true; document.body.appendChild(fileInput);
  $('tb-img').addEventListener('click', function () {
    if (!imgEl) { alert('Clique primeiro na imagem que você quer trocar (ela ganha um contorno vermelho).'); return; }
    fileInput.value = ''; fileInput.click();
  });
  fileInput.addEventListener('change', function () {
    var file = fileInput.files && fileInput.files[0]; if (!file || !imgEl) return;
    prepImage(file).then(function (r) {
      var path = 'assets/img/uploads/' + slug(file.name.replace(/\.[^.]+$/, '')) + '-' + Date.now().toString(36) + '.' + r.ext;
      pending.push({ path: path, b64: b64FromBytes(r.bytes), done: false });
      imgEl.setAttribute('data-hd-pending', path); imgEl.removeAttribute('srcset'); imgEl.src = r.dataUrl;
      var alt = prompt('Descreva a imagem em uma frase (texto alternativo, para quem usa leitor de tela). Deixe vazio se for só decoração:', imgEl.getAttribute('alt') || '');
      if (alt !== null) imgEl.setAttribute('alt', alt.trim());
      markDirty(); setStatus('Imagem pronta. Clique em "Salvar e publicar" para enviar.', 'ok');
    }).catch(function (ex) { alert(ex.message); });
  });
  function prepImage(file) {
    var ok = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' };
    if (!ok[file.type]) return Promise.reject(new Error('Formato não aceito. Use PNG, JPG, WEBP, GIF ou SVG.'));
    if (file.size > 8 * 1024 * 1024) return Promise.reject(new Error('A imagem tem mais de 8 MB. Reduza o tamanho e tente de novo.'));
    var blobP = Promise.resolve(file);
    if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/webp') {
      blobP = createImageBitmap(file).then(function (bmp) {
        var max = 1600; if (bmp.width <= max) return file;
        var cv = document.createElement('canvas'); cv.width = max; cv.height = Math.round(bmp.height * max / bmp.width);
        var ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = file.type !== 'image/png'; ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
        return new Promise(function (res) { cv.toBlob(res, file.type, 0.9); });
      });
    }
    return blobP.then(function (blob) {
      return blob.arrayBuffer().then(function (buf) {
        return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res({ bytes: new Uint8Array(buf), ext: ok[file.type], dataUrl: fr.result }); }; fr.readAsDataURL(blob); });
      });
    });
  }

  function pairOf(b) {
    var nodes = [b];
    if (b.tagName === 'DD' && b.previousElementSibling && b.previousElementSibling.tagName === 'DT') nodes = [b.previousElementSibling, b];
    else if (b.tagName === 'DT' && b.nextElementSibling && b.nextElementSibling.tagName === 'DD') nodes = [b, b.nextElementSibling];
    return nodes;
  }
  $('tb-dup').addEventListener('click', function () {
    if (!blockEl) { alert('Clique em um item (parágrafo, cartão, linha de tabela...) para escolher o bloco a duplicar.'); return; }
    var nodes = pairOf(blockEl), ref = nodes[nodes.length - 1], first = null;
    nodes.forEach(function (n) {
      var c = n.cloneNode(true); c.classList.remove('hd-block-sel', 'hd-img-sel');
      c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(function (x) { x.removeAttribute('id'); });
      c.querySelectorAll('.hd-block-sel,.hd-img-sel').forEach(function (x) { x.classList.remove('hd-block-sel', 'hd-img-sel'); });
      ref.after(c); ref = c; if (!first) first = c;
    });
    setBlock(first); markDirty(); setStatus('Bloco duplicado. Edite a cópia.', 'ok');
  });
  $('tb-del').addEventListener('click', function () {
    if (!blockEl) { alert('Clique em um item para escolher o bloco a excluir.'); return; }
    if (!confirm('Excluir o bloco selecionado?')) return;
    pairOf(blockEl).forEach(function (n) { n.remove(); });
    blockEl = null; updateSel(); markDirty();
  });
  $('tb-up').addEventListener('click', function () {
    if (!blockEl || !blockEl.parentElement) return;
    var p = blockEl.parentElement.closest(BLOCKS);
    if (p && p.closest('main')) setBlock(p);
  });

  // ------------------------------------------------------------------ salvar
  function swapTag(el, tag) {
    var n = el.ownerDocument.createElement(tag);
    while (el.firstChild) n.appendChild(el.firstChild);
    el.replaceWith(n);
  }
  function serialize() {
    var root = fdoc().documentElement.cloneNode(true);
    root.querySelectorAll('[data-hd-base], #hd-editor-style').forEach(function (n) { n.remove(); });
    root.querySelectorAll('script[type="text/x-hd-inert"]').forEach(function (s) { s.removeAttribute('type'); });
    root.querySelectorAll('[contenteditable]').forEach(function (n) { n.removeAttribute('contenteditable'); });
    root.querySelectorAll('[spellcheck]').forEach(function (n) { n.removeAttribute('spellcheck'); });
    root.querySelectorAll('details[data-hd-open]').forEach(function (d) { if (d.getAttribute('data-hd-open') === '0') d.removeAttribute('open'); else d.setAttribute('open', ''); });
    root.querySelectorAll('[data-hd-open]').forEach(function (n) { n.removeAttribute('data-hd-open'); });
    root.querySelectorAll('[data-hd-edit]').forEach(function (n) { n.removeAttribute('data-hd-edit'); });
    root.querySelectorAll('[data-hd-img]').forEach(function (n) { n.removeAttribute('data-hd-img'); });
    root.querySelectorAll('img[data-hd-pending]').forEach(function (i) { i.setAttribute('src', i.getAttribute('data-hd-pending')); i.removeAttribute('data-hd-pending'); });
    root.querySelectorAll('.hd-block-sel, .hd-img-sel').forEach(function (n) { n.classList.remove('hd-block-sel', 'hd-img-sel'); });
    root.querySelectorAll('[class=""]').forEach(function (n) { n.removeAttribute('class'); });
    root.querySelectorAll('b').forEach(function (b) { swapTag(b, 'strong'); });
    root.querySelectorAll('i').forEach(function (i) { swapTag(i, 'em'); });
    return '<!doctype html>\n' + root.outerHTML + '\n';
  }
  $('btn-salvar').addEventListener('click', function () {
    if (!cur || !fdoc()) return;
    $('btn-salvar').disabled = true; setStatus('Salvando...');
    var html = serialize();
    var chain = Promise.resolve();
    pending.filter(function (u) { return !u.done; }).forEach(function (u) {
      chain = chain.then(function () {
        return gh('/contents/' + u.path, { method: 'PUT', body: JSON.stringify({ message: 'Painel: envio de imagem ' + u.path, content: u.b64, branch: cfg.branch }) }).then(function () { u.done = true; });
      });
    });
    chain.then(function () {
      return gh('/contents/' + cur.path, { method: 'PUT', body: JSON.stringify({ message: 'Painel: edição de ' + cur.path, content: b64FromString(html), sha: cur.sha, branch: cfg.branch }) });
    }).then(function (r) {
      cur.sha = r.content.sha; dirty = false; updateSave();
      setStatus('Publicado! O site atualiza em 1 a 2 minutos.', 'ok');
    }).catch(function (ex) {
      var msg = (ex.status === 409 || ex.status === 422) ? 'A página foi alterada em outro lugar. Reabra a página no painel para ver a versão atual.' : ex.message;
      setStatus('Erro ao salvar: ' + msg, 'err'); updateSave();
    });
  });
  window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  // ------------------------------------------------------------------ arquivos (pasta materiais)
  $('btn-arquivos').addEventListener('click', function () { openFiles(); });
  function fmtSize(b) { return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function openFiles(msg) {
    if (typeof msg !== 'string') msg = '';
    if (dirty && !confirm('Há alterações não salvas nesta página. Descartar?')) return;
    dirty = false; updateSave(); markNav(null);
    $('painel-pagina').hidden = true; $('painel-arquivos').hidden = false; setStatus('Carregando arquivos...');
    gh('/contents/materiais?ref=' + encodeURIComponent(cfg.branch)).then(function (list) {
      var tb = $('tbody-arq'); tb.innerHTML = '';
      list.filter(function (f) { return f.type === 'file'; }).forEach(function (f) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td></td><td></td><td></td>';
        tr.children[0].textContent = f.name; tr.children[1].textContent = fmtSize(f.size);
        var lab = document.createElement('label'); lab.className = 'btn'; lab.textContent = 'Substituir';
        var inp = document.createElement('input'); inp.type = 'file'; inp.hidden = true;
        inp.addEventListener('change', function () { if (inp.files[0]) sendFile(inp.files[0], 'materiais/' + f.name, f.sha); });
        lab.appendChild(inp); tr.children[2].appendChild(lab); tb.appendChild(tr);
      });
      window.__arquivos = list;
      setStatus(msg || 'Arquivos carregados.', 'ok');
    }).catch(function (ex) { setStatus('Erro: ' + ex.message, 'err'); });
  }
  $('in-novo-arq').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    var name = safeName(f.name), ex = (window.__arquivos || []).filter(function (x) { return x.name === name; })[0];
    if (ex && !confirm('Já existe um arquivo chamado ' + name + '. Substituir?')) return;
    sendFile(f, 'materiais/' + name, ex ? ex.sha : null);
  });
  function sendFile(file, path, sha) {
    if (file.size > 25 * 1024 * 1024) { alert('O arquivo tem mais de 25 MB.'); return; }
    setStatus('Enviando ' + file.name + '...');
    file.arrayBuffer().then(function (buf) {
      var body = { message: 'Painel: envio de ' + path, content: b64FromBytes(new Uint8Array(buf)), branch: cfg.branch }; if (sha) body.sha = sha;
      return gh('/contents/' + path, { method: 'PUT', body: JSON.stringify(body) });
    }).then(function () { openFiles('Arquivo enviado: ' + path); })
      .catch(function (ex) { setStatus('Erro ao enviar: ' + ex.message, 'err'); });
  }

  // ------------------------------------------------------------------ início
  var saved = loadSaved();
  if (saved && saved.repo) {
    $('in-repo').value = saved.repo; $('in-branch').value = saved.branch || 'main';
    if (saved.token) { cfg = saved; enter(!!localStorage.getItem(KEY)).catch(function () { cfg = null; $('tela-login').hidden = false; $('tela-editor').hidden = true; }); }
  }
})();
