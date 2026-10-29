/* LojaST — Gerador de etiquetas
   JavaScript puro, sem build. Persistência só em localStorage (chaves com prefixo "lojast:").
   Seções: dados · utilitários · estado do formulário · interface · Code128 · etiqueta · logo
           · impressão · histórico · eventos · início */
(() => {
  'use strict';

  /* ====================================================================== */
  /*  Dados                                                                  */
  /* ====================================================================== */

  /** Sugestões de modelo por marca e tipo (datalist). O campo continua livre. */
  const CATALOG = {
    Apple: {
      Celular: ['iPhone X', 'iPhone XR', 'iPhone XS', 'iPhone XS Max', 'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max',
        'iPhone SE (2020)', 'iPhone SE (2022)', 'iPhone 12 mini', 'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
        'iPhone 13 mini', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro',
        'iPhone 14 Pro Max', 'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 16e', 'iPhone 16',
        'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max', 'iPhone 17', 'iPhone Air', 'iPhone 17 Pro', 'iPhone 17 Pro Max'],
      Notebook: ['MacBook Air M1', 'MacBook Air M2', 'MacBook Air M3', 'MacBook Air M4', 'MacBook Pro 13 M1', 'MacBook Pro 14', 'MacBook Pro 16'],
      Tablet: ['iPad 9ª geração', 'iPad 10ª geração', 'iPad Air', 'iPad Pro 11', 'iPad Pro 13', 'iPad mini'],
    },
    Samsung: {
      Celular: ['Galaxy A05', 'Galaxy A06', 'Galaxy A15', 'Galaxy A16', 'Galaxy A25', 'Galaxy A26', 'Galaxy A35', 'Galaxy A36',
        'Galaxy A55', 'Galaxy A56', 'Galaxy S21', 'Galaxy S22', 'Galaxy S23', 'Galaxy S23 FE', 'Galaxy S23 Ultra', 'Galaxy S24',
        'Galaxy S24 FE', 'Galaxy S24 Ultra', 'Galaxy S25', 'Galaxy S25 Ultra', 'Galaxy Z Flip 5', 'Galaxy Z Flip 6',
        'Galaxy Z Fold 5', 'Galaxy Z Fold 6'],
      Tablet: ['Galaxy Tab A9', 'Galaxy Tab A9+', 'Galaxy Tab S9 FE', 'Galaxy Tab S10 FE'],
      Notebook: ['Galaxy Book3', 'Galaxy Book4'],
    },
    Xiaomi: {
      Celular: ['Redmi 13C', 'Redmi 14C', 'Redmi A3', 'Redmi Note 12', 'Redmi Note 13', 'Redmi Note 13 Pro', 'Redmi Note 14',
        'Redmi Note 14 Pro', 'Poco X6 Pro', 'Poco X7 Pro', 'Poco M6', 'Poco C75', 'Xiaomi 13T', 'Xiaomi 14T', 'Xiaomi 15T'],
      Tablet: ['Redmi Pad', 'Xiaomi Pad 6'],
    },
    Motorola: {
      Celular: ['Moto E14', 'Moto G04', 'Moto G05', 'Moto G15', 'Moto G24', 'Moto G34', 'Moto G35', 'Moto G54', 'Moto G55',
        'Moto G84', 'Moto G85', 'Edge 40 Neo', 'Edge 50 Fusion', 'Edge 50 Pro', 'Edge 60 Fusion', 'Razr 40', 'Razr 50'],
    },
    Realme: { Celular: ['Realme C53', 'Realme C55', 'Realme C61', 'Realme C67', 'Realme 11', 'Realme 12', 'Realme 13', 'Realme Note 50'] },
    Infinix: { Celular: ['Hot 40i', 'Hot 50', 'Note 40'] },
    Dell: { Notebook: ['Inspiron 14', 'Inspiron 15', 'Latitude 5420', 'Latitude 5430', 'Vostro 3510', 'Vostro 3520', 'G15'] },
    Lenovo: {
      Notebook: ['IdeaPad 1', 'IdeaPad 3', 'IdeaPad 5', 'IdeaPad Gaming 3', 'ThinkPad E14', 'ThinkPad T14', 'LOQ 15'],
      Tablet: ['Tab M10', 'Tab P11'],
    },
    HP: { Notebook: ['HP 14', 'HP 15', 'HP 250 G8', 'HP 250 G9', 'Pavilion 15', 'ProBook 450', 'Victus 15'] },
    Acer: { Notebook: ['Aspire 3', 'Aspire 5', 'Nitro 5', 'Nitro V', 'Swift Go'] },
    Asus: {
      Notebook: ['Vivobook 15', 'Vivobook Go 15', 'TUF Gaming F15', 'Zenbook 14', 'ROG Strix G15'],
      Celular: ['ROG Phone 8', 'Zenfone 11'],
    },
  };

  const DEFAULTS = Object.freeze({
    type: 'Celular', brand: '', model: '', devname: '',
    storage: '', storage_other: '', ram: '', ram_other: '', color: '', cond: 'Seminovo',
    imei: '', serial: '', anumber: '', sysver: '',
    simlock: 'Desbloqueado', account: 'Livre',
    owner: 'nosso', cname: '', cphone: '', cos: '',
    bh: '', cycles: '',
    rep_has: 'nao', rep: [], rep_other: '', parts: '',
    works: 'ok', defect: '',
    tester: '', date: '', obs: '',
  });

  /** Um bloco está "preenchido" quando já tem a informação essencial (ou uma resposta válida padrão). */
  const BLOCKS = [
    ['aparelho', (s) => !!(s.model || s.devname)],
    ['identificacao', (s) => !!(s.imei || s.serial)],
    ['desbloqueio', (s) => !!(s.simlock && s.account)],
    ['propriedade', (s) => s.owner === 'nosso' || !!s.cname],
    ['bateria', (s) => !!(s.bh || s.cycles)],
    ['reparos', (s) => s.rep_has === 'nao' || !!(s.rep.length || s.rep_other)],
    ['funcionamento', (s) => s.works === 'ok' || !!s.defect],
    ['finalizacao', (s) => !!(s.tester && s.date)],
  ];

  /* ====================================================================== */
  /*  Utilitários                                                            */
  /* ====================================================================== */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const pad2 = (n) => String(n).padStart(2, '0');

  const store = {
    get(key, fallback = null) {
      try {
        const v = localStorage.getItem(`lojast:${key}`);
        return v == null ? fallback : JSON.parse(v);
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(`lojast:${key}`, JSON.stringify(value)); return true; } catch { return false; }
    },
    del(key) {
      try { localStorage.removeItem(`lojast:${key}`); } catch { /* modo privado */ }
    },
  };

  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
  function fmtDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
  function whenLabel(ts) {
    const d = new Date(ts);
    const now = new Date();
    const ontem = new Date(now);
    ontem.setDate(now.getDate() - 1);
    const hm = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return `Hoje, ${hm}`;
    if (d.toDateString() === ontem.toDateString()) return `Ontem, ${hm}`;
    return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}, ${hm}`;
  }
  /** Dígito verificador do IMEI (algoritmo de Luhn). */
  function luhn(digits) {
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      let n = +digits[digits.length - 1 - i];
      if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
    }
    return sum % 10 === 0;
  }

  /* ====================================================================== */
  /*  Estado do formulário                                                   */
  /* ====================================================================== */

  const form = $('#f');
  const field = (name) => form.elements.namedItem(name);
  const DEFAULT_PAPER = { id: '150x100', w: 150, h: 100, fit: 'fit', rotate: false };
  const PAPERS = [
    ['150x100', 'Térmica 150 × 100 mm'], ['100x150', 'Térmica 100 × 150 mm'], ['100x100', 'Térmica 100 × 100 mm'],
    ['100x75', 'Térmica 100 × 75 mm'], ['100x50', 'Térmica 100 × 50 mm'], ['80x50', 'Térmica 80 × 50 mm'],
    ['60x40', 'Térmica 60 × 40 mm'], ['50x30', 'Térmica 50 × 30 mm'], ['105x148', 'A6 (105 × 148 mm)'],
    ['148x210', 'A5 (148 × 210 mm)'], ['210x297', 'A4 (210 × 297 mm)'], ['216x279', 'Carta (216 × 279 mm)'],
  ];
  const savedPrefs = store.get('prefs') || {};
  const prefs = { copies: 1, hide: [], ...savedPrefs, paper: { ...DEFAULT_PAPER, ...(savedPrefs.paper || {}) } };
  const touched = { imei: false };
  let raf = 0;
  let saveTimer = 0;

  function getState() {
    const s = { ...DEFAULTS, rep: [] };
    for (const el of form.elements) {
      if (!el.name || el.type === 'button' || el.type === 'file') continue;
      if (el.type === 'radio') { if (el.checked) s[el.name] = el.value; }
      else if (el.type === 'checkbox') { if (el.checked) s[el.name].push(el.value); }
      else s[el.name] = el.value.trim();
    }
    s.hide = [...prefs.hide]; // campos que o usuário escondeu da etiqueta (vai junto no histórico)
    return s;
  }

  function setState(src) {
    const s = { ...DEFAULTS, ...src, rep: Array.isArray(src && src.rep) ? src.rep : [] };
    for (const el of form.elements) {
      if (!el.name || el.type === 'button' || el.type === 'file') continue;
      if (el.type === 'radio') el.checked = s[el.name] === el.value;
      else if (el.type === 'checkbox') el.checked = s.rep.includes(el.value);
      else el.value = s[el.name] ?? '';
    }
    touched.imei = !!s.imei;
    updateDatalists();
  }

  function saveForm() {
    store.set('form', { ...getState(), _day: todayISO() });
  }
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveForm, 250);
  }
  function restoreForm() {
    const saved = store.get('form');
    if (saved && typeof saved === 'object') {
      // a data é "do dia": se o rascunho é de outro dia, volta para hoje
      const date = saved._day === todayISO() && saved.date ? saved.date : todayISO();
      setState({ ...saved, date });
    } else {
      setState({ ...DEFAULTS, date: todayISO() });
    }
  }

  /* ---- sugestões (datalist) ---- */
  const brandKey = (b) => Object.keys(CATALOG).find((k) => k.toLowerCase() === String(b).trim().toLowerCase());
  function updateDatalists() {
    const type = field('type').value;
    const brands = Object.keys(CATALOG).filter((b) => type === 'Outro' || (CATALOG[b][type] || []).length);
    $('#brandList').innerHTML = brands.map((b) => `<option value="${esc(b)}">`).join('');
    const key = brandKey(field('brand').value);
    let models = [];
    if (key) models = type === 'Outro' ? Object.values(CATALOG[key]).flat() : CATALOG[key][type] || [];
    $('#modelList').innerHTML = models.map((m) => `<option value="${esc(m)}">`).join('');
  }

  /* ====================================================================== */
  /*  Interface: toasts, tema, progresso, validação, condicionais            */
  /* ====================================================================== */

  function toast(message, { tone = 'ok', action = null, ms = action ? 6500 : 3200 } = {}) {
    const host = $('#toasts');
    const icon = tone === 'warn' ? 'triangle-alert' : tone === 'info' ? 'info' : 'check';
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="toast__ic" data-tone="${tone}"><svg class="ic" aria-hidden="true"><use href="#i-${icon}"/></svg></span><span>${esc(message)}</span>`;
    let timer;
    const close = () => {
      clearTimeout(timer);
      if (el.classList.contains('is-out')) return;
      el.classList.add('is-out');
      el.addEventListener('animationend', () => el.remove(), { once: true });
      setTimeout(() => el.remove(), 500);
    };
    if (action) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'toast__act';
      b.textContent = action.label;
      b.addEventListener('click', () => { action.run(); close(); });
      el.append(b);
    }
    host.append(el);
    while (host.children.length > 3) host.firstElementChild.remove();
    timer = setTimeout(close, ms);
  }

  /* ---- tema ---- */
  const root = document.documentElement;
  function setTheme(theme, persist) {
    root.dataset.theme = theme;
    if (persist) { try { localStorage.setItem('lojast:theme', theme); } catch { /* sem armazenamento */ } }
  }
  function savedTheme() {
    try { const t = localStorage.getItem('lojast:theme'); return t === 'light' || t === 'dark' ? t : null; } catch { return null; }
  }

  /* ---- campos condicionais (expandir/recolher) ---- */
  const conditionals = $$('[data-show-if]').map((el) => {
    const [key, values] = el.dataset.showIf.split('=');
    return { el, key, values: values.split('|'), open: null, timer: 0 };
  });
  function applyConditionals(s) {
    for (const c of conditionals) {
      const open = c.values.includes(String(s[c.key]));
      if (open === c.open) continue;
      c.open = open;
      c.el.classList.toggle('is-open', open);
      c.el.inert = !open; // fora do foco e da leitura de tela enquanto recolhido
      clearTimeout(c.timer);
      if (!open) c.el.classList.remove('is-settled');
      else if (document.body.classList.contains('no-anim')) c.el.classList.add('is-settled');
      else c.timer = setTimeout(() => c.el.classList.add('is-settled'), 320);
    }
  }

  /* ---- progresso por blocos ---- */
  function updateProgress(s) {
    let done = 0;
    BLOCKS.forEach(([id, test], i) => {
      const ok = !!test(s);
      if (ok) done++;
      const card = $(`#blk-${id}`);
      card.toggleAttribute('data-done', ok);
      const item = $$('.stepper__item')[i];
      item.toggleAttribute('data-done', ok);
      $('.stepper__dot', item).setAttribute('aria-label', `Etapa ${i + 1}: ${card.dataset.title}, ${ok ? 'preenchido' : 'pendente'}`);
      $('.stepper__dot', item).title = `${card.dataset.title}${ok ? ' ✓' : ''}`;
    });
    const total = BLOCKS.length;
    const count = $('#progressText');
    count.textContent = done === total ? 'Tudo pronto para imprimir' : `${done} de ${total} blocos`;
    count.toggleAttribute('data-complete', done === total);
    $('#progressFill').style.width = `${(done / total) * 100}%`;
  }

  /* ---- validação discreta (nunca bloqueia a impressão) ---- */
  function setFieldState(id, state, text, count = '') {
    const f = $(`#${id}`);
    if (state) f.dataset.state = state; else delete f.dataset.state;
    $('.msg', f).textContent = text;
    const c = $('.s-count', f);
    if (c) c.textContent = count;
  }
  function validate(s) {
    const d = s.imei;
    if (!d) setFieldState('fld-imei', '', '');
    else if (d.length < 15) {
      const falta = 15 - d.length;
      setFieldState('fld-imei', touched.imei ? 'warn' : '', touched.imei ? `O IMEI tem 15 dígitos — faltam ${falta}.` : '', `${d.length}/15`);
    } else if (!luhn(d)) setFieldState('fld-imei', 'warn', 'Os 15 dígitos não fecham o dígito verificador. Confira o número.');
    else setFieldState('fld-imei', 'ok', 'IMEI válido.');

    const bh = s.bh === '' ? NaN : Number(s.bh);
    const gauge = $('#bhGauge');
    if (Number.isNaN(bh)) { setFieldState('fld-bh', '', ''); gauge.removeAttribute('data-on'); }
    else if (bh < 0 || bh > 100) { setFieldState('fld-bh', 'warn', 'A saúde da bateria vai de 0 a 100%.'); gauge.removeAttribute('data-on'); }
    else {
      setFieldState('fld-bh', '', '');
      gauge.dataset.on = '';
      gauge.dataset.tone = bh >= 80 ? 'ok' : bh >= 70 ? 'warn' : 'bad';
      $('i', gauge).style.width = `${bh}%`;
    }
  }

  /* ====================================================================== */
  /*  Code128 (subconjuntos B e C) — sem dependências                        */
  /* ====================================================================== */

  /** Larguras barra/espaço de cada símbolo (0–106). O Stop (106) tem 7 elementos. */
  const C128 = [
    '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
    '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
    '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
    '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
    '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
    '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
    '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
    '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
    '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
    '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
    '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
  ];

  /** Menor sequência de símbolos (B/C) para o texto: valores 0–106 com início, checksum e stop. */
  function code128Values(text) {
    const t = [...String(text)].map((c) => (c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126 ? c : '?')).join('');
    const n = t.length;
    if (!n) return [];
    const dig = (i) => i < n && t.charCodeAt(i) >= 48 && t.charCodeAt(i) <= 57;
    const INF = 1e9;
    // best[i][m]: menor nº de símbolos para codificar t[i..] já dentro do modo m (0 = B, 1 = C)
    const best = Array.from({ length: n + 2 }, () => [INF, INF]);
    const pick = Array.from({ length: n + 1 }, () => [null, null]);
    best[n] = [0, 0];
    for (let i = n - 1; i >= 0; i--) {
      for (const m of [0, 1]) {
        for (const sw of [false, true]) {
          const mode = sw ? 1 - m : m;
          const len = mode === 0 ? 1 : dig(i) && dig(i + 1) ? 2 : 0;
          if (!len) continue;
          const cost = (sw ? 2 : 1) + best[i + len][mode];
          if (cost < best[i][m]) { best[i][m] = cost; pick[i][m] = { sw, mode, len }; }
        }
      }
    }
    const start = best[0][1] <= best[0][0] ? 1 : 0;
    const out = [start ? 105 : 104];
    let i = 0;
    let m = start;
    while (i < n) {
      const p = pick[i][m];
      if (p.sw) out.push(p.mode ? 99 : 100);
      out.push(p.mode ? +t.slice(i, i + 2) : t.charCodeAt(i) - 32);
      m = p.mode;
      i += p.len;
    }
    let sum = out[0];
    for (let k = 1; k < out.length; k++) sum += k * out[k];
    out.push(sum % 103, 106);
    return out;
  }

  /** Path SVG das barras (altura 1) e largura total em módulos. */
  function code128Path(text) {
    const values = code128Values(text);
    if (!values.length) return null;
    let x = 0;
    let d = '';
    for (const v of values) {
      const widths = C128[v];
      for (let k = 0; k < widths.length; k++) {
        const w = +widths[k];
        if (k % 2 === 0) d += `M${x} 0h${w}v1h-${w}z`;
        x += w;
      }
    }
    return { modules: x, d };
  }

  /** SVG do código de barras com zona de silêncio de 10 módulos. Módulo de 0,375 mm (3 pontos a 203 dpi). */
  function barcodeSVG(text) {
    const bc = code128Path(text);
    if (!bc) return '';
    const quiet = 10;
    const total = bc.modules + quiet * 2;
    const MAX_MM = 74;
    let mod = 0.5;
    if (total * mod > MAX_MM) mod = 0.375;
    if (total * mod > MAX_MM) mod = MAX_MM / total;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-quiet} 0 ${total} 1" width="${(total * mod).toFixed(2)}mm" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true"><path d="${bc.d}" fill="#000"/></svg>`;
  }

  /* ====================================================================== */
  /*  Logo (preto e branco para a térmica)                                   */
  /* ====================================================================== */

  /** user: enviada pelo usuário (localStorage) · base: logo.png da pasta (ou null → texto "LojaST") */
  const logos = { user: store.get('logo') ? { src: store.get('logo'), filtered: false } : null, base: null };
  const labelLogo = () => logos.user || logos.base;

  /**
   * Converte para escala de cinza com contraste forte sobre fundo branco e recorta as margens vazias.
   * Lança SecurityError se o canvas estiver "sujo" (página aberta direto do disco, file://).
   */
  function toThermal(img, maxW = 900) {
    const k = Math.min(1, maxW / img.naturalWidth);
    const w = Math.max(1, Math.round(img.naturalWidth * k));
    const h = Math.max(1, Math.round(img.naturalHeight * k));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#fff';
    g.fillRect(0, 0, w, h);
    g.drawImage(img, 0, 0, w, h);
    const data = g.getImageData(0, 0, w, h);
    const p = data.data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        let v = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
        v = clamp((v - 150) * 2.4 + 150, 0, 255);
        p[i] = p[i + 1] = p[i + 2] = v;
        p[i + 3] = 255;
        if (v < 200) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
    }
    if (x1 < 0) throw new Error('blank');
    g.putImageData(data, 0, 0);
    const m = Math.round(Math.min(w, h) * 0.01) + 1;
    const sx = Math.max(0, x0 - m), sy = Math.max(0, y0 - m);
    const sw = Math.min(w, x1 + m + 1) - sx, sh = Math.min(h, y1 + m + 1) - sy;
    const out = document.createElement('canvas');
    out.width = sw; out.height = sh;
    out.getContext('2d').drawImage(c, sx, sy, sw, sh, 0, 0, sw, sh);
    return out.toDataURL('image/png');
  }

  function loadBaseLogo() {
    const img = new Image();
    img.onload = () => {
      try { logos.base = { src: toThermal(img), filtered: false }; }
      catch { logos.base = { src: 'logo.png', filtered: true }; } // file://: usa o filtro CSS em vez do canvas
      renderAll();
      updateLogoThumb();
    };
    img.onerror = () => { logos.base = null; renderAll(); updateLogoThumb(); };
    img.src = 'logo.png';
  }

  function updateLogoThumb() {
    const l = labelLogo();
    $('#logoThumb').innerHTML = l ? `<img src="${esc(l.src)}" alt=""${l.filtered ? ' class="is-filtered"' : ''}>` : '<span>LojaST</span>';
    $('#btnLogoRemove').hidden = !logos.user;
  }

  function onLogoFile(file) {
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const url = toThermal(img);
          if (!store.set('logo', url)) { toast('Não foi possível salvar a logo neste navegador.', { tone: 'warn' }); return; }
          logos.user = { src: url, filtered: false };
          renderAll(); updateLogoThumb();
          toast('Logo salva neste navegador');
        } catch (err) {
          toast(err.message === 'blank'
            ? 'A imagem ficou toda branca. Envie uma logo escura ou colorida.'
            : 'Não consegui processar essa imagem. Tente um PNG ou JPG.', { tone: 'warn', ms: 5000 });
        }
      };
      img.onerror = () => toast('Arquivo de imagem inválido.', { tone: 'warn' });
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  /* ====================================================================== */
  /*  Etiqueta 150 × 100 mm (preto e branco)                                 */
  /* ====================================================================== */

  /** Cópia do estado sem os campos que o usuário escondeu (valor vazio = a etiqueta não mostra). */
  function applyHide(s) {
    const h = s.hide || [];
    if (!h.length) return s;
    const o = { ...s };
    const map = { storage: ['storage', 'storage_other'], ram: ['ram', 'ram_other'], color: ['color'], cond: ['cond'], imei: ['imei'],
      serial: ['serial'], anumber: ['anumber'], sysver: ['sysver'], bh: ['bh'], cycles: ['cycles'], cname: ['cname'], cphone: ['cphone'],
      cos: ['cos'], tester: ['tester'], date: ['date'], obs: ['obs'], defect: ['defect'] };
    for (const k of h) (map[k] || []).forEach((f) => { o[f] = ''; });
    if (h.includes('account')) o.account = 'N/A';
    o.noSim = h.includes('simlock');
    o.noWorks = h.includes('works');
    o.noRep = h.includes('rep');
    o.noLogo = h.includes('logo');
    return o;
  }

  function buildTitle(s0) {
    const s = applyHide(s0);
    if (s.devname) return s.devname;
    const storage = s.storage_other || s.storage;
    let base = s.model;
    if (s.brand && !/^apple$/i.test(s.brand) && !base.toLowerCase().startsWith(s.brand.toLowerCase())) base = `${s.brand} ${base}`.trim();
    if (!base) base = s.brand || 'Aparelho';
    return `${base}${storage ? ` ${storage}` : ''}`.trim();
  }

  const isApple = (s) => /apple|iphone|ipad|macbook|\bmac\b/i.test(`${s.brand} ${s.model} ${s.devname}`) || /^(ios|ipados|macos)/i.test(s.sysver);

  function buildLabelHTML(s0) {
    const s = applyHide(s0);
    const title = buildTitle(s0);
    const storage = s.storage_other || s.storage;
    const ram = s.ram_other || s.ram;
    const apple = isApple(s);
    const mobile = s.type === 'Celular' || s.type === 'Tablet';
    const logo = labelLogo();
    const logoHTML = logo
      ? `<img src="${esc(logo.src)}" alt="LojaST"${logo.filtered ? ' class="is-filtered"' : ''}>`
      : '<span class="txt">LojaST</span>';

    const sub = [s.type !== 'Outro' ? s.type : '', s.brand, s.model && !title.toLowerCase().includes(s.model.toLowerCase()) ? s.model : '', s.color]
      .filter(Boolean).join(' · ');

    const cell = (label, value, extra = '', inv = false) => (value
      ? `<div class="cell${inv ? ' inv' : ''}"><i>${esc(label)}</i><b>${esc(value)}</b>${extra ? `<em>${esc(extra)}</em>` : ''}</div>`
      : '');
    let cells = '';
    if (storage) cells += cell('Armazenamento', storage, s.type === 'Notebook' && ram ? `RAM ${ram}` : '');
    else if (s.type === 'Notebook' && ram) cells += cell('Memória RAM', ram);
    cells += cell('Condição', s.cond);
    if (s.bh) cells += cell('Bateria', `${s.bh}%`, s.cycles ? `${s.cycles} ciclos` : '');
    else if (s.cycles) cells += cell('Bateria', `${s.cycles} ciclos`);
    if (!s.noSim && (mobile || s.simlock === 'Bloqueado')) {
      cells += cell('Operadora', s.simlock === 'Bloqueado' ? 'BLOQUEADO' : 'Desbloqueado', '', s.simlock === 'Bloqueado');
    }
    if (s.account !== 'N/A' && (apple || mobile || s.account === 'Bloqueada')) {
      const name = apple ? 'Conta iCloud' : mobile ? 'Conta Google' : 'Conta iCloud/Google';
      cells += s.account === 'Bloqueada'
        ? cell(name, 'BLOQUEADA', '', true)
        : cell(name, 'Livre', apple ? 'FMIP off' : '');
    }
    if (!s.noWorks) cells += cell('Funcionamento', s.works === 'ok' ? '100% OK' : 'COM DEFEITO', '', s.works !== 'ok');
    cells += cell('Sistema', s.sysver);
    cells += cell('Nº modelo', (s.anumber || '').toUpperCase());

    let rep;
    if (s.rep_has === 'nao') {
      rep = '<strong>REPAROS:</strong><span>NENHUM — aparelho sem reparos · peças originais</span>';
    } else {
      const items = [...s.rep, s.rep_other].filter(Boolean);
      rep = `<strong>REPAROS:</strong><span>${esc(items.length ? items.join(', ') : 'Sim')}${s.parts ? ` · Peças ${esc(s.parts.toLowerCase())}` : ''}</span>`;
    }
    const defect = s.works !== 'ok' && s.defect
      ? `<div class="box inv"><strong>DEFEITO:</strong><span>${esc(s.defect)}</span></div>` : '';

    const serial = (s.serial || '').toUpperCase();
    const code = s.imei || serial;
    let bc = '';
    if (code) {
      let svg = '';
      try { svg = barcodeSVG(code); } catch { /* sem código de barras: a etiqueta segue normal */ }
      const lines = s.imei
        ? `<div class="num">IMEI ${esc(s.imei)}</div>${serial ? `<div class="num2">SÉRIE ${esc(serial)}</div>` : ''}`
        : `<div class="num">SÉRIE ${esc(serial)}</div>`;
      bc = `<div class="bc">${svg}${lines}</div>`;
    }

    const kv = (label, value, wide = false) => `<div class="kv${wide ? ' wide' : ''}"><i>${esc(label)}</i><b>${esc(value)}</b></div>`;
    const meta = [];
    if (s.owner === 'cliente') {
      const who = [s.cname, s.cphone].filter(Boolean).join(' · ');
      if (who) meta.push(kv('Cliente', who, true));
      if (s.cos) meta.push(kv('OS', s.cos));
    }
    if (s.date) meta.push(kv('Data', fmtDate(s.date)));
    if (s.tester) meta.push(kv('Testador', s.tester));
    if (s.obs) meta.push(`<div class="obs"><b>Obs.:</b> ${esc(s.obs)}</div>`);

    return `<div class="lbl">
      <div class="hd"><div class="logo">${s.noLogo ? '' : logoHTML}</div><div class="own ${s.owner === 'cliente' ? 'cliente' : 'nosso'}">${s.owner === 'cliente' ? 'CLIENTE' : 'NOSSO'}</div></div>
      <div class="tt"><div class="title">${esc(title)}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</div>
      <div class="grid">${cells}</div>
      ${s.noRep ? '' : `<div class="box">${rep}</div>`}
      ${defect}
      <div class="ft">${bc}<div class="meta">${meta.join('')}</div></div>
    </div>`;
  }

  /**
   * Reduz a fonte (a partir da definida no CSS) até o texto ocupar no máximo `fill` da largura da caixa.
   * Mede a largura fracionária do texto (scrollWidth arredonda e deixa passar 0,2 px que a reticência corta)
   * e deixa uma folga para a diferença entre o layout da tela e o da impressão. No limite, fica a reticência.
   */
  function fitText(el, minPt, fill = 0.95) {
    el.style.fontSize = '';
    const k = el.offsetWidth ? el.getBoundingClientRect().width / el.offsetWidth : 1; // escala do preview (transform)
    const range = document.createRange();
    range.selectNodeContents(el);
    const natural = range.getBoundingClientRect().width / k;
    const room = el.clientWidth * fill;
    if (natural <= room) return;
    const base = parseFloat(getComputedStyle(el).fontSize) * 0.75;
    el.style.fontSize = `${Math.max(minPt, Math.floor(((base * room) / natural) * 10) / 10)}pt`;
  }

  /**
   * Ajusta título, células e rodapé para caberem na largura e, se o conteúdo passar de 100 mm,
   * compacta em dois níveis (t1, t2) antes de cortar qualquer coisa.
   */
  function fitLabel(lbl) {
    lbl.classList.remove('t1', 't2');
    delete lbl.dataset.overflow;
    const fitAll = () => {
      const title = $('.title', lbl);
      if (title) fitText(title, 11, 0.985);
      $$('.cell b', lbl).forEach((b) => fitText(b, 8));
      $$('.kv b', lbl).forEach((b) => fitText(b, 7));
    };
    const over = () => lbl.scrollHeight > lbl.clientHeight + 1;
    fitAll();
    if (over()) { lbl.classList.add('t1'); fitAll(); }
    if (over()) { lbl.classList.add('t2'); fitAll(); }
    if (over()) lbl.dataset.overflow = '1';
  }

  /** Monta a etiqueta dentro de um container que esteja no layout (para medir) e ajusta. */
  function renderLabelInto(container, s) {
    container.innerHTML = buildLabelHTML(s);
    const lbl = container.firstElementChild;
    fitLabel(lbl);
    return lbl;
  }

  function fitPreview() {
    const k = $('#paper').clientWidth / (prefs.paper.w * 96 / 25.4);
    $('#labelWrap').style.transform = `scale(${k})`;
  }

  /** Onde a etiqueta de 150 × 100 mm fica no papel escolhido (escala, giro e posição). */
  function placement(p) {
    const bw0 = p.rotate ? 100 : 150;
    const bh0 = p.rotate ? 150 : 100;
    const k = p.fit === 'fit' ? Math.min(p.w / bw0, p.h / bh0) : 1;
    const bw = bw0 * k;
    const bh = bh0 * k;
    const x = (p.w - bw) / 2;
    // em folha grande (A4…) a etiqueta vai para o topo; em papel de etiqueta, centralizada
    const y = p.fit === 'fit' ? (bh / p.h > 0.6 ? (p.h - bh) / 2 : 6) : (p.h > bh * 1.5 ? 6 : 0);
    const f = (n) => +n.toFixed(3);
    return p.rotate
      ? `translate(${f(x + bw)}mm,${f(y)}mm) rotate(90deg) scale(${f(k)})`
      : `translate(${f(x)}mm,${f(y)}mm) scale(${f(k)})`;
  }

  const pageStyle = document.head.appendChild(document.createElement('style'));
  function applyPaper() {
    const p = prefs.paper;
    const sz = `${p.w} × ${p.h} mm`;
    root.style.setProperty('--pw', `${p.w}mm`);
    root.style.setProperty('--ph', `${p.h}mm`);
    root.style.setProperty('--ar', String(p.w / p.h));
    pageStyle.textContent = `@page{size:${p.w}mm ${p.h}mm;margin:0}`;
    $('#labelFit').style.transform = placement(p);
    $('#sizeTag').textContent = sz;
    $('#hdrSize').textContent = `Etiqueta ${sz}`;
    $('#tipPaper').textContent = sz;
    $('#dimW').textContent = `${p.w} mm`;
    $('#dimH').textContent = `${p.h} mm`;
    $('#paperSel').value = p.id;
    $('#paperW').value = p.w;
    $('#paperH').value = p.h;
    $('#paperFit').value = p.fit;
    $('#paperRot').checked = !!p.rotate;
    fitPreview();
  }
  function setPaper(patch) {
    prefs.paper = { ...prefs.paper, ...patch };
    store.set('prefs', prefs);
    applyPaper();
  }

  /** Caixinha "mostrar na etiqueta" ao lado de cada campo (tudo marcado por padrão). */
  function initOptToggles() {
    $$('[data-opt]').forEach((box) => {
      const name = $('.lab', box).textContent.replace(/\(opcional\)/, '').trim();
      const t = document.createElement('label');
      t.className = 'opt';
      t.title = 'Mostrar na etiqueta';
      t.innerHTML = `<input type="checkbox" data-opt-for="${box.dataset.opt}" aria-label="Mostrar na etiqueta: ${esc(name)}">`;
      box.append(t);
    });
    syncOpts();
  }
  function syncOpts() {
    $$('[data-opt]').forEach((box) => {
      const on = !prefs.hide.includes(box.dataset.opt);
      $('input[data-opt-for]', box).checked = on;
      box.classList.toggle('is-off', !on);
    });
  }

  function renderAll() {
    cancelAnimationFrame(raf);
    const s = getState();
    applyConditionals(s);
    validate(s);
    updateProgress(s);
    const lbl = renderLabelInto($('#labelFit'), s);
    $('#overflowWarn').hidden = !lbl.dataset.overflow;
    fitPreview();
  }
  const scheduleRender = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(renderAll); };

  /* ====================================================================== */
  /*  Impressão                                                              */
  /* ====================================================================== */

  const printRoot = $('#printRoot');
  let lastPrintAt = 0;
  let savedTitle = '';

  const fillPrintRoot = (labelHTML) => {
    const t = placement(prefs.paper);
    printRoot.innerHTML = Array.from({ length: prefs.copies }, () => `<div class="sheet"><div class="lblfit" style="transform:${t}">${labelHTML}</div></div>`).join('');
  };
  const waitImages = (el) => Promise.all($$('img', el).map((i) => (i.complete ? null : i.decode().catch(() => null))));
  const printTitle = (s) => `Etiqueta ${buildTitle(s)}${s.imei ? ` ${s.imei.slice(-6)}` : s.serial ? ` ${s.serial.toUpperCase()}` : ''}`;

  /**
   * Imprime a etiqueta do formulário (ou de um item do histórico). Cada cópia vai numa página de 150 × 100 mm.
   * O preview e a impressão usam o mesmo HTML já ajustado, então o que você vê é o que sai.
   */
  async function printLabel(snapshot = null) {
    if (Date.now() - lastPrintAt < 700) return;
    lastPrintAt = Date.now();
    let s;
    if (snapshot) {
      s = snapshot;
      fillPrintRoot(renderLabelInto($('#scratch'), s).outerHTML);
    } else {
      renderAll();
      s = getState();
      fillPrintRoot($('#labelWrap .lbl').outerHTML);
    }
    histPush(s);
    await waitImages(printRoot);
    savedTitle = document.title;
    document.title = printTitle(s);
    window.print();
  }

  window.addEventListener('beforeprint', () => {
    // impressão pelo menu do navegador: monta a partir do preview
    if (!printRoot.firstChild) {
      const lbl = $('#labelWrap .lbl');
      if (lbl) fillPrintRoot(lbl.outerHTML);
      histPush(getState());
    }
  });
  window.addEventListener('afterprint', () => {
    if (savedTitle) { document.title = savedTitle; savedTitle = ''; }
    printRoot.innerHTML = '';
    toast('Enviado para impressão');
  });

  function setCopies(n) {
    prefs.copies = clamp(parseInt(n, 10) || 1, 1, 99);
    $('#copies').value = prefs.copies;
    store.set('prefs', prefs);
  }

  /* ====================================================================== */
  /*  Nova etiqueta, histórico                                               */
  /* ====================================================================== */

  function newLabel() {
    const prev = getState();
    const fresh = { ...DEFAULTS, tester: prev.tester, date: todayISO() };
    const untouched = JSON.stringify({ ...prev, date: '' }) === JSON.stringify({ ...fresh, date: '' });
    setState(fresh);
    touched.imei = false;
    renderAll();
    saveForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast('Formulário limpo', untouched ? {} : {
      action: { label: 'Desfazer', run: () => { setState(prev); renderAll(); saveForm(); } },
    });
  }

  const HIST_MAX = 30;
  const histLoad = () => { const h = store.get('hist', []); return Array.isArray(h) ? h : []; };
  function histPush(s) {
    const key = JSON.stringify(s);
    const list = histLoad().filter((e) => JSON.stringify(e.s) !== key);
    list.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ts: Date.now(), s });
    store.set('hist', list.slice(0, HIST_MAX));
    updateHistBadge();
  }
  function updateHistBadge() {
    const n = histLoad().length;
    const b = $('#histCount');
    b.hidden = !n;
    b.textContent = n;
    $('#btnHistory').setAttribute('aria-label', n ? `Histórico de etiquetas (${n})` : 'Histórico de etiquetas');
  }

  const dlg = $('#histDialog');
  function renderHistory() {
    const list = histLoad();
    $('#histClear').hidden = !list.length;
    $('#histList').innerHTML = list.length
      ? list.map((e) => {
        const s = e.s;
        const ident = s.imei ? `IMEI …${esc(s.imei.slice(-6))}` : s.serial ? `Série ${esc(s.serial.toUpperCase())}` : 'Sem IMEI/série';
        const meta = [s.type !== 'Outro' ? s.type : '', s.color, s.cond].filter(Boolean).join(' · ');
        return `<article class="hist" data-id="${esc(e.id)}">
          <div class="hist__top">
            <div class="hist__info"><h3 class="hist__title">${esc(buildTitle(s))}</h3>
              <p class="hist__meta">${esc(meta)}<br>${ident} · ${esc(whenLabel(e.ts))}</p></div>
            <div class="hist__side">
              <span class="tag tag--${s.owner === 'cliente' ? 'cliente' : 'nosso'}">${s.owner === 'cliente' ? 'Cliente' : 'Nosso'}</span>
              <button class="btn btn--ghost btn--sm btn--icon btn--danger" type="button" data-act="del" aria-label="Excluir do histórico"><svg class="ic" aria-hidden="true"><use href="#i-trash-2"/></svg></button>
            </div>
          </div>
          <div class="hist__actions">
            <button class="btn btn--primary btn--sm" type="button" data-act="reprint"><svg class="ic" aria-hidden="true"><use href="#i-printer"/></svg>Reimprimir</button>
            <button class="btn btn--secondary btn--sm" type="button" data-act="dup"><svg class="ic" aria-hidden="true"><use href="#i-copy"/></svg>Duplicar para editar</button>
          </div>
        </article>`;
      }).join('')
      : `<div class="empty"><svg class="ic" aria-hidden="true"><use href="#i-history"/></svg>
          <p><strong>Nenhuma etiqueta ainda</strong></p>
          <p class="hint">As etiquetas que você imprimir aparecem aqui para reimprimir ou duplicar.</p></div>`;
  }
  const openHistory = () => { renderHistory(); dlg.showModal(); };
  const closeHistory = () => dlg.close();

  function duplicate(entry) {
    closeHistory();
    setState({ ...entry.s, date: todayISO() });
    touched.imei = false;
    renderAll();
    saveForm();
    toast('Etiqueta duplicada. Informe o IMEI e o nº de série do novo aparelho.', { tone: 'info', ms: 5500 });
    setTimeout(() => {
      const imei = field('imei');
      imei.scrollIntoView({ behavior: 'smooth', block: 'center' });
      imei.focus({ preventScroll: true });
      imei.select();
    }, 60);
  }

  /* ====================================================================== */
  /*  Eventos                                                                */
  /* ====================================================================== */

  function onFormInput(e) {
    const el = e.target;
    if (!el.name) return;
    const uncheck = (name) => $$(`input[name="${name}"]`, form).forEach((r) => { r.checked = false; });
    if (el.name === 'imei') {
      const clean = el.value.replace(/\D/g, '').slice(0, 15);
      if (clean !== el.value) el.value = clean;
    } else if (el.name === 'serial') {
      const clean = el.value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, '');
      if (clean !== el.value) el.value = clean;
    } else if (el.name === 'storage_other' && el.value.trim()) uncheck('storage');
    else if (el.name === 'storage' && el.checked) field('storage_other').value = '';
    else if (el.name === 'ram_other' && el.value.trim()) uncheck('ram');
    else if (el.name === 'ram' && el.checked) field('ram_other').value = '';
    else if (el.name === 'brand' || el.name === 'type') updateDatalists();
    scheduleRender();
    scheduleSave();
  }
  form.addEventListener('input', onFormInput);
  form.addEventListener('change', onFormInput);
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('focusout', (e) => { if (e.target.name === 'imei') { touched.imei = true; scheduleRender(); } });
  form.addEventListener('focusin', (e) => { if (e.target.name === 'imei') { touched.imei = false; scheduleRender(); } });

  // chips opcionais (armazenamento e RAM): clicar de novo no selecionado desmarca
  form.addEventListener('pointerdown', (e) => {
    const input = e.target.closest('label.chip')?.querySelector('input[data-deselect]');
    if (input) input.dataset.was = input.checked ? '1' : '';
  });
  form.addEventListener('click', (e) => {
    const input = e.target.closest('input[data-deselect]');
    if (input && input.dataset.was === '1' && input.checked) {
      input.checked = false;
      input.dataset.was = '';
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  // atalhos do indicador de progresso
  $('#stepper').addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#blk-"]');
    if (!a) return;
    e.preventDefault();
    const card = $(a.getAttribute('href'));
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('input:not([type=radio]):not([type=checkbox]), input:checked, textarea', card)?.focus({ preventScroll: true });
  });

  form.addEventListener('change', (e) => {
    const key = e.target.dataset.optFor;
    if (!key) return;
    prefs.hide = e.target.checked ? prefs.hide.filter((k) => k !== key) : [...new Set([...prefs.hide, key])];
    store.set('prefs', prefs);
    syncOpts();
    scheduleRender();
  });
  $('#optAll').addEventListener('click', () => {
    prefs.hide = [];
    store.set('prefs', prefs);
    syncOpts();
    scheduleRender();
    toast('Todos os campos voltaram a aparecer na etiqueta', { tone: 'info' });
  });

  // papel: o último escolhido vira o padrão
  $('#paperSel').innerHTML = [...PAPERS, ['custom', 'Personalizado…']].map(([v, n]) => `<option value="${v}">${n}</option>`).join('');
  $('#paperSel').addEventListener('change', (e) => {
    const v = e.target.value;
    if (v === 'custom') { setPaper({ id: 'custom' }); $('.paperset__more').open = true; return; }
    const [w, h] = v.split('x').map(Number);
    setPaper({ id: v, w, h });
  });
  const customSize = () => setPaper({ id: 'custom', w: clamp(+$('#paperW').value || 150, 20, 400), h: clamp(+$('#paperH').value || 100, 20, 400) });
  $('#paperW').addEventListener('change', customSize);
  $('#paperH').addEventListener('change', customSize);
  $('#paperFit').addEventListener('change', (e) => setPaper({ fit: e.target.value }));
  $('#paperRot').addEventListener('change', (e) => setPaper({ rotate: e.target.checked }));

  $('#btnPrint').addEventListener('click', () => printLabel());
  $('#btnNew').addEventListener('click', newLabel);
  $('#btnTheme').addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
  $('#copiesMinus').addEventListener('click', () => setCopies(prefs.copies - 1));
  $('#copiesPlus').addEventListener('click', () => setCopies(prefs.copies + 1));
  $('#copies').addEventListener('change', (e) => setCopies(e.target.value));
  $('#copies').addEventListener('focus', (e) => e.target.select());

  $('#btnLogo').addEventListener('click', () => $('#logoFile').click());
  $('#logoFile').addEventListener('change', (e) => { onLogoFile(e.target.files[0]); e.target.value = ''; });
  $('#btnLogoRemove').addEventListener('click', () => {
    store.del('logo');
    logos.user = null;
    renderAll(); updateLogoThumb();
    toast('Logo removida. A etiqueta volta a usar a logo padrão.', { tone: 'info' });
  });

  $('#btnHistory').addEventListener('click', openHistory);
  $('#histClose').addEventListener('click', closeHistory);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeHistory(); });
  $('#histClear').addEventListener('click', () => {
    if (!confirm('Apagar todo o histórico de etiquetas deste navegador?')) return;
    store.del('hist');
    updateHistBadge();
    renderHistory();
    toast('Histórico limpo', { tone: 'info' });
  });
  $('#histList').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.closest('.hist').dataset.id;
    const entry = histLoad().find((x) => x.id === id);
    if (!entry) return;
    if (btn.dataset.act === 'reprint') { closeHistory(); setTimeout(() => printLabel(entry.s), 120); }
    else if (btn.dataset.act === 'dup') duplicate(entry);
    else if (btn.dataset.act === 'del') {
      store.set('hist', histLoad().filter((x) => x.id !== id));
      updateHistBadge();
      renderHistory();
    }
  });

  // atalhos: Ctrl/Cmd+P imprime · Ctrl/Cmd+N (ou Alt+N) nova etiqueta
  document.addEventListener('keydown', (e) => {
    if (dlg.open) return;
    const mod = (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey;
    const key = e.key.toLowerCase();
    if (mod && key === 'p') { e.preventDefault(); printLabel(); }
    else if ((mod && key === 'n') || (e.altKey && !e.ctrlKey && !e.metaKey && key === 'n')) { e.preventDefault(); newLabel(); }
  });

  // botão flutuante (celular): "Ver etiqueta" rola até o preview; com o preview à vista vira "Imprimir"
  const fab = $('#fab');
  let previewVisible = false;
  function updateFab() {
    fab.dataset.mode = previewVisible ? 'print' : 'view';
    $('#fabLabel').textContent = previewVisible ? 'Imprimir' : 'Ver etiqueta';
  }
  fab.addEventListener('click', () => {
    if (previewVisible) printLabel();
    else $('#previewCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  new IntersectionObserver(([entry]) => { previewVisible = entry.intersectionRatio > 0.45; updateFab(); }, { threshold: [0, 0.45, 1] })
    .observe($('#previewCard'));

  // cabeçalho ganha blur e borda depois de rolar
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(([entry]) => $('#appHeader').toggleAttribute('data-scrolled', !entry.isIntersecting)).observe(sentinel);

  new ResizeObserver(fitPreview).observe($('#paper'));
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => { if (!savedTheme()) setTheme(e.matches ? 'dark' : 'light', false); });

  /* ====================================================================== */
  /*  Início                                                                 */
  /* ====================================================================== */

  restoreForm();
  initOptToggles();
  applyPaper();
  setCopies(prefs.copies);
  updateHistBadge();
  updateLogoThumb();
  renderAll();
  loadBaseLogo();
  updateFab();

  // logo do cabeçalho: se logo.png não existir, mostra o texto "LojaST" com a fonte da marca
  const brandLogo = $('#brandLogo');
  const showBrandText = () => { brandLogo.hidden = true; $('#brandText').hidden = false; };
  if (brandLogo.complete && !brandLogo.naturalWidth) showBrandText();
  brandLogo.addEventListener('error', showBrandText);

  // só liga as animações depois da primeira pintura (o estado restaurado não "anima")
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('no-anim')));

  // ganchos para testes automatizados
  window.__etiqueta = { getState, setState, renderAll, buildLabelHTML, code128Values, printLabel, histLoad, DEFAULTS };
})();
