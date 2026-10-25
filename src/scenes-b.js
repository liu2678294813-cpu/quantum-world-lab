/* Chapters 5–7. Analytic finite-dimensional models; all units have hbar = 1. */
(() => {
  'use strict';
  const PI = Math.PI, TAU = PI * 2;
  const C = { blue: '#76a9ff', purple: '#b29aff', gold: '#efc77b', pink: '#ee91b8', text: '#e8ecfa', muted: '#909bb7', grid: '#222b43' };
  const clip = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const num = (v, d = 3) => Number(v).toFixed(d);
  const pct = v => `${num(v * 100, 1)}%`;
  const rad = v => v * PI / 180;
  const gauss = (x, a = 1) => Math.pow(a / PI, .25) * Math.exp(-a * x * x / 2);
  const phi0 = x => gauss(x);
  const phi1 = x => Math.SQRT2 * x * phi0(x);
  const range = (key, label, min, max, step, value, unit = '') => ({ key, label, min, max, step, value, unit });
  const select = (key, label, options, value) => ({ key, label, options: options.map(([value, label]) => ({ value, label })), value });
  const source = (printed, topic) => ({ printed: String(printed), pdf: String(Number(printed) + 6), topic });
  const metric = (label, value) => ({ label, value });
  const text = (ctx, s, x, y, color = C.muted, size = 13, align = 'left') => {
    ctx.save(); ctx.font = `${size}px "Microsoft YaHei", "PingFang SC", sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); ctx.restore();
  };
  function line(ctx, x1, y1, x2, y2, color = C.grid, width = 1, dash = []) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  }
  function path(ctx, pts, color, width = 2, dash = []) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.setLineDash(dash); ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.stroke(); ctx.restore();
  }
  function dot(ctx, x, y, radius, color, glow = 12) {
    ctx.save(); ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = glow; ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fill(); ctx.restore();
  }
  function arrow(ctx, x1, y1, x2, y2, color, width = 2.5) {
    line(ctx, x1, y1, x2, y2, color, width); const a = Math.atan2(y2 - y1, x2 - x1), n = 10;
    path(ctx, [[x2 - n * Math.cos(a - .45), y2 - n * Math.sin(a - .45)], [x2, y2], [x2 - n * Math.cos(a + .45), y2 - n * Math.sin(a + .45)]], color, width);
  }
  function legend(ctx, items, x, y, spacing = 140) {
    items.forEach(([s, c, dashed], i) => { line(ctx, x + i * spacing, y, x + i * spacing + 22, y, c, 2, dashed ? [5, 5] : []); text(ctx, s, x + i * spacing + 31, y, C.muted, 12); });
  }
  function panelTitle(ctx, s, x, y, width) { text(ctx, s, x, y, C.text, 14); line(ctx, x, y + 18, x + width, y + 18); }
  function graph(ctx, x, y, w, h, xmin, xmax, ymin, ymax, curves, xlabel = '', ylabel = '') {
    const X = z => x + (z - xmin) / (xmax - xmin) * w, Y = z => y + h - (z - ymin) / (ymax - ymin) * h;
    for (let i = 0; i <= 4; i++) {
      const xx = x + i * w / 4, yy = y + i * h / 4;
      line(ctx, xx, y, xx, y + h, C.grid, .75); line(ctx, x, yy, x + w, yy, C.grid, .75);
      text(ctx, num(xmin + i * (xmax - xmin) / 4, 1), xx, y + h + 18, C.muted, 11, 'center');
      text(ctx, num(ymax - i * (ymax - ymin) / 4, 1), x - 10, yy, C.muted, 11, 'right');
    }
    if (ymin < 0 && ymax > 0) line(ctx, x, Y(0), x + w, Y(0), '#59647c');
    if (xmin < 0 && xmax > 0) line(ctx, X(0), y, X(0), y + h, '#59647c');
    text(ctx, xlabel, x + w, y + h + 40, C.muted, 12, 'right');
    text(ctx, ylabel, x, y - 17, C.muted, 12);
    ctx.save(); ctx.beginPath(); ctx.rect(x - 1, y - 1, w + 2, h + 2); ctx.clip();
    curves.forEach(({ fn, color = C.blue, dash = [], fill = false, width = 2 }) => {
      const pts = Array.from({ length: 321 }, (_, i) => { const a = xmin + (xmax - xmin) * i / 320; return [X(a), Y(fn(a))]; });
      if (fill) { ctx.save(); ctx.fillStyle = `${color}21`; ctx.beginPath(); ctx.moveTo(pts[0][0], Y(Math.max(0, ymin))); pts.forEach(p => ctx.lineTo(...p)); ctx.lineTo(pts.at(-1)[0], Y(Math.max(0, ymin))); ctx.closePath(); ctx.fill(); ctx.restore(); }
      path(ctx, pts, color, width, dash);
    }); ctx.restore(); return { X, Y };
  }
  function bars(ctx, rows, x, y, w, barHeight = 12, row = 43) {
    rows.forEach(([label, value, color = C.blue], i) => { const yy = y + i * row; text(ctx, label, x, yy, C.muted, 12); text(ctx, pct(value), x + w, yy, C.text, 13, 'right'); ctx.fillStyle = '#1b243a'; ctx.fillRect(x, yy + 12, w, barHeight); ctx.fillStyle = color; ctx.fillRect(x, yy + 12, w * clip(value), barHeight); });
  }
  function columns(w, h) {
    return w >= 660 ? { ax: 58, ay: 94, aw: w * .53 - 65, ah: h - 170, bx: w * .59, by: 94, bw: w * .36, bh: h - 170, split: true } : { ax: 52, ay: 88, aw: w - 83, ah: (h - 290) * .48, bx: 52, by: (h - 290) * .48 + 206, bw: w - 83, bh: (h - 290) * .52, split: false };
  }
  function sphere(ctx, cx, cy, r, vector, options = {}) {
    const angle = options.angle ?? -.55;
    const proj = ([x, y, z]) => { const xx = x * Math.cos(angle) - y * Math.sin(angle), yy = x * Math.sin(angle) + y * Math.cos(angle); return [cx + xx * r, cy + yy * r * .35 - z * r * .87]; };
    const circle = (fn, color = '#3d4964', width = 1, dash = []) => path(ctx, Array.from({ length: 121 }, (_, i) => proj(fn(i * TAU / 120))), color, width, dash);
    const bg = ctx.createRadialGradient(cx - r * .3, cy - r * .4, 4, cx, cy, r); bg.addColorStop(0, '#28385e30'); bg.addColorStop(1, '#101a3200'); ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    circle(a => [Math.cos(a), Math.sin(a), 0], '#586789');
    circle(a => [Math.cos(a), 0, Math.sin(a)], '#2d3a58'); circle(a => [0, Math.cos(a), Math.sin(a)], '#2d3a58');
    for (const z of [-.5, .5]) circle(a => [Math.sqrt(1 - z * z) * Math.cos(a), Math.sqrt(1 - z * z) * Math.sin(a), z], '#273450');
    [[1, 0, 0, 'x'], [0, 1, 0, 'y'], [0, 0, 1, '+z'], [0, 0, -1, '−z']].forEach(q => { const p = proj(q); const qn = proj(q.map(v => typeof v === 'number' ? v * 1.12 : v)); line(ctx, cx, cy, ...p, '#46516c', 1, [3, 5]); text(ctx, q[3], qn[0], qn[1], C.muted, 12, 'center'); });
    if (options.trail) path(ctx, options.trail.map(proj), C.purple, 1.7);
    if (options.axis) { const a = proj(options.axis); arrow(ctx, cx, cy, ...a, C.gold, 2); }
    const tip = proj(vector); arrow(ctx, cx, cy, ...tip, options.color || C.blue, 3); dot(ctx, ...tip, 4.5, options.color || C.blue, 14);
    return proj;
  }
  function heat(ctx, x, y, w, h, fn, max = 1, size = 90) {
    const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size; const tmp = canvas.getContext('2d'), im = tmp.createImageData(size, size);
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) { const v = clip(fn((i + .5) / size, 1 - (j + .5) / size) / max); const f = Math.pow(v, .58), k = (j * size + i) * 4; im.data[k] = 10 + 229 * f; im.data[k + 1] = 17 + 182 * f; im.data[k + 2] = 35 + 99 * Math.sin(f * PI / 1.5); im.data[k + 3] = 255; } tmp.putImageData(im, 0, 0); ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(canvas, x, y, w, h); ctx.restore();
  }
  function heatAxes(ctx, x, y, side, labelx = 'x₁', labely = 'x₂') {
    for (let i = 0; i <= 4; i++) { const v = i / 4; text(ctx, num(-3 + v * 6, 1), x + v * side, y + side + 18, C.muted, 11, 'center'); text(ctx, num(3 - v * 6, 1), x - 10, y + v * side, C.muted, 11, 'right'); }
    text(ctx, labelx, x + side, y + side + 38, C.muted, 12, 'right'); text(ctx, labely, x, y - 17, C.muted, 12); line(ctx, x, y + side, x + side, y, '#ecf0ff42', 1, [3, 5]);
  }
  const perturbGround = (g, gap = 1) => (gap - Math.hypot(gap, 2 * g)) / 2;
  const perturb2 = (g, gap = 1) => -g * g / gap;
  const variational = a => (a + 1 / a) / 4;
  const transitionExact = (t, v, gap) => { const om = Math.hypot(gap, 2 * v); return om === 0 ? 0 : 4 * v * v / (om * om) * Math.sin(om * t / 2) ** 2; };
  const transitionFirst = (t, v, gap) => Math.abs(gap) < 1e-10 ? v * v * t * t : 4 * v * v / (gap * gap) * Math.sin(gap * t / 2) ** 2;
  const blochVector = (theta, phi, purity = 1) => [purity * Math.sin(theta) * Math.cos(phi), purity * Math.sin(theta) * Math.sin(phi), purity * Math.cos(theta)];
  const rabi = (t, omega, delta = 0) => { const om = Math.hypot(omega, delta); return om === 0 ? 0 : omega * omega / (om * om) * Math.sin(om * t / 2) ** 2; };
  const rabiVector = (t, omega, delta) => { const om = Math.hypot(omega, delta); if (om === 0) return [0, 0, 1]; const nx = omega / om, nz = delta / om, a = om * t; return [nx * nz * (1 - Math.cos(a)), -nx * Math.sin(a), Math.cos(a) + nz * nz * (1 - Math.cos(a))]; };
  const singletJoint = (angle, a, b) => (1 - a * b * Math.cos(angle)) / 4;
  const pairAmplitude = (x1, x2, sign = 1) => (phi0(x1) * phi1(x2) + sign * phi1(x1) * phi0(x2)) / Math.SQRT2;
  const occupancies = (N, fermion = false) => { const list = Array(10).fill(0); if (fermion) for (let i = 0; i < Math.min(N, 10); i++) list[i] = 1; else list[0] = N; return list; };
  const ladderCoeff = (n, creation = true, fermion = false) => fermion ? (creation ? (n === 0 ? 1 : 0) : (n === 1 ? 1 : 0)) : Math.sqrt(creation ? n + 1 : n);
  window.QSPhysicsB = { perturbGround, perturb2, variational, transitionExact, transitionFirst, blochVector, rabi, rabiVector, singletJoint, pairAmplitude, occupancies, ladderCoeff };
  const scenes = [];

  scenes.push({
    id: 'perturbation', chapter: 5, title: '微扰：近似什么时候可靠？', subtitle: '把弱耦合的修正与精确解放在一起',
    description: '两个原本分开的能级一旦耦合，基态会混入激发态。拖动耦合强度，直接比较二级微扰与精确对角化。',
    formula: 'H = [[0, g], [g, Δ]]；E₋ = (Δ − √(Δ²+4g²))/2；E₋⁽²⁾ = −g²/Δ',
    explanation: '图中的两条能量曲线使用同一个二能级模型。二级结果只保留 g 的平方项；小参数是 |g|/Δ，而不是 g 单独的大小。右图将抽象基态系数嵌入谐振子 φ₀、φ₁ 的正交基中，展示态混合的空间形状。',
    observe: '弱耦合时实线与虚线重合；耦合接近能隙时，二级近似偏低，波函数中另一个基态的权重变大。',
    experiment: '先固定 Δ=1，把 g 从 0.1 拉到 1；再把 Δ 调大，观察同一个 g 的相对误差为何减小。',
    caution: '这是有限二能级矩阵的精确解，不声称是完整谐振子哈密顿量的精确解。空间曲线用 φ₀、φ₁ 作为可视化基函数。',
    source: source(171, '非简并微扰式 (5-1)、(5-2)；矩阵习题 5.2、5.3'),
    controls: [range('g', '耦合 g', 0, 1.5, .01, .35), range('gap', '未扰动能隙 Δ', .3, 3, .05, 1)], duration: 18,
    metrics(t, p) { const e = perturbGround(p.g, p.gap), e2 = perturb2(p.g, p.gap); return [metric('精确基态能量', num(e)), metric('二级近似', num(e2)), metric('小参数 |g|/Δ', num(p.g / p.gap)), metric('绝对误差', num(Math.abs(e2 - e), 4))]; },
    render(ctx, w, h, t, p) {
      const b = columns(w, h); panelTitle(ctx, '能量修正', b.ax, 31, b.aw); panelTitle(ctx, '耦合后的概率密度', b.bx, b.split ? 31 : b.by - 49, b.bw);
      const min = Math.min(-.12, perturb2(1.5, p.gap) * 1.05), gg = graph(ctx, b.ax, b.ay, b.aw, b.ah, 0, 1.5, min, .08, [{ fn: g => perturbGround(g, p.gap), color: C.blue }, { fn: g => perturb2(g, p.gap), color: C.gold, dash: [5, 5] }], '耦合 g', 'E（约定单位）');
      line(ctx, gg.X(p.g), b.ay, gg.X(p.g), b.ay + b.ah, '#8a99b455', 1, [3, 4]); dot(ctx, gg.X(p.g), gg.Y(perturbGround(p.g, p.gap)), 4, C.blue); dot(ctx, gg.X(p.g), gg.Y(perturb2(p.g, p.gap)), 3, C.gold);
      const theta = .5 * Math.atan2(2 * p.g, p.gap), a = Math.cos(theta), bb = -Math.sin(theta), density = x => (a * phi0(x) + bb * phi1(x)) ** 2;
      graph(ctx, b.bx, b.by, b.bw, b.bh, -3, 3, 0, .85, [{ fn: x => phi0(x) ** 2, color: C.muted, dash: [4, 5] }, { fn: density, color: C.purple, fill: true }], 'x / ℓ', '|ψ|²');
      legend(ctx, [['精确', C.blue], ['二级微扰', C.gold, true]], b.ax, h - 22, b.aw > 230 ? 125 : 110);
      if (b.split) text(ctx, `激发基态权重 ${pct(bb * bb)}`, b.bx, h - 22, C.purple, 12);
    }
  });

  scenes.push({
    id: 'avoided-crossing', chapter: 5, title: '简并、混合与避免交叉', subtitle: '靠近简并点时，先在子空间里对角化',
    description: '本来交叉的两条能级，被非对角耦合撑开。波函数的主要成分会在交叉附近互换。',
    formula: 'H = εσz + gσx；E± = ±√(ε²+g²)；最小能隙 = 2|g|',
    explanation: '在 ε=0 附近，原先选定的基矢不再接近本征态。对整个二重子空间做对角化，才能得到正确的一阶分裂方向。这里展示瞬时本征能量及本征态组成。',
    observe: 'g=0 时两条未耦合直线真正相交；g>0 时，交叉变为最窄宽度 2g 的缝隙，基态由一种成分平滑换成另一种。',
    experiment: '暂停扫描，设置 ε=0。将 g 从 0 增大，检查上下能量是否恰好为 ±g，再比较两种基矢的权重。',
    caution: '自动扫描只是在浏览瞬时本征态，不是在求解随时间扫描哈密顿量的薛定谔演化；它不等于 Landau–Zener 跃迁实验。',
    source: source(171, '简并微扰、久期方程 (5-5)～(5-11)'),
    controls: [range('bias', '能级偏置 ε', -3, 3, .02, .5), range('g', '耦合 g', 0, 1.2, .02, .4), select('scan', '扫描方式', [['fixed', '固定参数'], ['sweep', '往返浏览']], 'sweep')], duration: 25,
    metrics(t, p) { const e = p.scan === 'sweep' ? 2.8 * Math.sin(t * TAU / 25) : p.bias, d = Math.hypot(e, p.g), prob = d ? (1 - e / d) / 2 : .5; return [metric('当前偏置 ε', num(e)), metric('能隙 E₊−E₋', num(2 * d)), metric('基态中 |1⟩ 权重', d < 1e-12 ? '未唯一确定' : pct(prob)), metric('最小能隙', num(2 * p.g))]; },
    render(ctx, w, h, t, p) {
      const b = columns(w, h), eps = p.scan === 'sweep' ? 2.8 * Math.sin(t * TAU / 25) : p.bias, d = Math.hypot(eps, p.g), pr = d ? (1 - eps / d) / 2 : .5;
      panelTitle(ctx, '瞬时本征能级', b.ax, 31, b.aw); const g = graph(ctx, b.ax, b.ay, b.aw, b.ah, -3, 3, -3.5, 3.5, [{ fn: x => x, color: '#59647c', dash: [4, 5] }, { fn: x => -x, color: '#59647c', dash: [4, 5] }, { fn: x => Math.hypot(x, p.g), color: C.gold }, { fn: x => -Math.hypot(x, p.g), color: C.blue }], '偏置 ε', 'E');
      line(ctx, g.X(eps), b.ay, g.X(eps), b.ay + b.ah, '#acb5cc66', 1, [3, 4]); dot(ctx, g.X(eps), g.Y(d), 4, C.gold); dot(ctx, g.X(eps), g.Y(-d), 4, C.blue);
      panelTitle(ctx, '下支本征态的组成', b.bx, b.split ? 31 : b.by - 49, b.bw);
      if (d < 1e-12) { text(ctx, '严格简并：本征态不唯一', b.bx + b.bw / 2, b.by + b.bh * .35, C.gold, 14, 'center'); text(ctx, '任意正交基都可选取', b.bx + b.bw / 2, b.by + b.bh * .58, C.muted, 13, 'center'); }
      else { bars(ctx, [['|1⟩ 成分', pr, C.blue], ['|2⟩ 成分', 1 - pr, C.purple]], b.bx, b.by + b.bh * .18, b.bw, 16, b.split ? 76 : 43); if (b.split) text(ctx, '|ψ₋⟩ = c₁|1⟩ + c₂|2⟩', b.bx + b.bw / 2, b.by + b.bh * .87, C.text, 16, 'center'); }
      legend(ctx, [['下支 E₋', C.blue], ['上支 E₊', C.gold]], b.ax, h - 22, 130);
    }
  });

  scenes.push({
    id: 'variational', chapter: 5, title: '变分：让试探态找到最低点', subtitle: '波包太窄与太宽，都要付出能量',
    description: '用一个可调宽度的高斯波函数猜谐振子基态，观察动能、势能怎样拉扯出最佳宽度。',
    formula: 'ψα(x) = (α/π)¼e⁻ᵅˣ²⁄²；E(α) = α/4 + 1/(4α) ≥ 1/2',
    explanation: '归一化高斯的平均动能为 α/4，平均势能为 1/(4α)。变窄使位置更确定，却让动量分布更宽；变宽则增加平均势能。在 α=1 时，这个试探族正好包含精确基态。',
    observe: '金色总能量永远不低于基态 1/2；蓝色动能与紫色势能在最佳点相等。',
    experiment: '先把 α 设为 4，再缓慢拉回 1；对比波包的宽度与总能量。最后设 α=0.25，比较同样大小的能量代价来自哪一项。',
    caution: '变分上界针对同一哈密顿量、归一化且属于定义域的试探态。其他试探族未必包含精确解。此处 ħ=m=ω=1。',
    source: source(172, '变分原理 (5-12)；习题 5.39（印刷页229）'),
    controls: [range('alpha', '试探宽度参数 α', .2, 4, .02, 1.8)], duration: 18,
    metrics(t, p) { return [metric('总能量 ⟨H⟩', num(variational(p.alpha))), metric('平均动能', num(p.alpha / 4)), metric('平均势能', num(1 / (4 * p.alpha))), metric('精确基态能量', '0.500')]; },
    render(ctx, w, h, t, p) {
      const b = columns(w, h); panelTitle(ctx, '试探态与精确基态', b.ax, 31, b.aw); panelTitle(ctx, '能量上界的最低点', b.bx, b.split ? 31 : b.by - 49, b.bw);
      graph(ctx, b.ax, b.ay, b.aw, b.ah, -4, 4, 0, 1.2, [{ fn: x => gauss(x) ** 2, color: C.muted, dash: [5, 5] }, { fn: x => gauss(x, p.alpha) ** 2, color: C.blue, fill: true }], 'x / ℓ', '|ψα|²');
      const g = graph(ctx, b.bx, b.by, b.bw, b.bh, .2, 4, 0, 1.6, [{ fn: x => x / 4, color: C.blue }, { fn: x => 1 / (4 * x), color: C.purple }, { fn: variational, color: C.gold, width: 2.5 }, { fn: () => .5, color: '#97a2ba', dash: [4, 4] }], 'α', '能量');
      line(ctx, g.X(p.alpha), b.by, g.X(p.alpha), b.by + b.bh, '#adb6cb55', 1, [3, 4]); dot(ctx, g.X(p.alpha), g.Y(variational(p.alpha)), 4, C.gold); dot(ctx, g.X(1), g.Y(.5), 3, C.text);
      legend(ctx, [['动能', C.blue], ['势能', C.purple], ['总能量', C.gold]], b.ax, h - 22, w < 660 ? 105 : 130);
    }
  });

  scenes.push({
    id: 'transition', chapter: 5, title: '含时微扰：概率怎样积累？', subtitle: '有限二能级的精确演化与一阶近似',
    description: '在 t=0 突然打开一个恒定弱耦合。跃迁振幅先相加，再取模平方；持续更久不保证概率一直增加。',
    formula: 'P₁→₂⁽¹⁾ = 4v²sin²(Δt/2)/Δ²；P精确 = 4v²sin²(√(Δ²+4v²)t/2)/(Δ²+4v²)',
    explanation: '两条曲线对应同一初态 |1⟩ 和突然打开的非对角耦合 v。一阶含时微扰忽略初态耗尽；精确二能级解保持总概率为 1。调大 v 或缩小 Δ，可以直接看到近似越界或相位偏移。',
    observe: '在短时间、弱耦合时两条曲线接近。若金色近似超过 1，那是适用条件失效，不是概率真的超过 100%。',
    experiment: '先取 v=0.1、Δ=1，观察短时重合；再把 Δ 调到 0.2、v 调到 0.4，寻找近似开始明显偏离的位置。',
    caution: '这是突然打开恒定耦合的闭合二能级模型；没有辐射场、自发跃迁或不可逆衰减，不能把来回振荡解释为黄金规则的恒定跃迁速率。',
    source: source(172, '含时微扰跃迁概率 (5-13)、(5-14)；习题5.47起（印刷页235）'),
    controls: [range('v', '耦合矩阵元 v', .02, .5, .01, .15), range('gap', '能量差 Δ', .2, 2, .02, 1)], duration: 24,
    metrics(t, p) { const a = transitionExact(t, p.v, p.gap), b = transitionFirst(t, p.v, p.gap); return [metric('精确跃迁概率', pct(a)), metric('一阶近似概率', pct(b)), metric('初态剩余概率', pct(1 - a)), metric('微扰比 v/Δ', num(p.v / p.gap))]; },
    render(ctx, w, h, t, p) {
      panelTitle(ctx, '同一二能级体系：精确 vs 一阶', 57, 31, w - 92);
      const top = 95, gh = h - 180, ymax = Math.max(1.08, Math.min(5, 4 * p.v * p.v / (p.gap * p.gap) * 1.05)), g = graph(ctx, 57, top, w - 92, gh, 0, 24, 0, ymax, [{ fn: a => transitionExact(a, p.v, p.gap), color: C.blue, fill: true }, { fn: a => transitionFirst(a, p.v, p.gap), color: C.gold, dash: [5, 5] }, { fn: () => 1, color: '#8994ad', dash: [2, 6] }], '时间 t', '跃迁概率');
      line(ctx, g.X(t), top, g.X(t), top + gh, '#d3dcf277', 1, [3, 5]); dot(ctx, g.X(t), g.Y(transitionExact(t, p.v, p.gap)), 4.5, C.blue);
      legend(ctx, [['精确演化', C.blue], ['一阶近似', C.gold, true], ['概率上限 1', C.muted, true]], 57, h - 22, w < 600 ? (w - 70) / 3 : 160);
      if (ymax >= 5) text(ctx, '纵轴显示至 5，近似曲线可能超出画面', w - 35, 59, C.gold, 11, 'right');
    }
  });

  scenes.push({
    id: 'bloch', chapter: 6, title: '自旋态：一支箭头编码一个量子态', subtitle: 'Bloch 球上的方向，决定测量概率',
    description: '调节极角和方位角，让自旋纯态在球面移动；缩短 Bloch 矢量则变成混合态。',
    formula: '|ψ⟩ = cos(θ/2)|↑⟩ + eⁱᵠsin(θ/2)|↓⟩；ρ = (I + r·σ)/2',
    explanation: 'Bloch 矢量 r 的三个分量等于泡利矩阵的期望值，因此沿 n 测得 +ħ/2 的概率为 (1+r·n)/2。纯态矢量长度为 1；球内部是混合态，不能用一个纯态的相位来描述。',
    observe: '只改变 φ 时，z 方向概率不变，但 x、y 方向的概率会变。将矢量长度降为 0，所有方向的正负结果各占一半。',
    experiment: '令 θ=90°：先设置 φ=0°，再设置 φ=90°，比较 x、y 两根概率条。最后把长度从1调到0。',
    caution: '球面箭头表示量子态与期望值，绝不表示电子是一个真实旋转的小陀螺。混合态作为帮助理解的延伸内容，原书主线是纯自旋态与泡利矩阵。',
    source: source(244, '任意方向自旋态；习题6.9（印刷页255）'),
    controls: [range('theta', '极角 θ', 0, 180, 1, 65, '°'), range('phi', '方位角 φ', 0, 360, 1, 35, '°'), range('purity', 'Bloch 矢量长度', 0, 1, .01, 1)], duration: 20,
    metrics(t, p) { const a = blochVector(rad(p.theta), rad(p.phi), p.purity); return [metric('⟨Sx⟩ / ħ', num(a[0] / 2)), metric('⟨Sy⟩ / ħ', num(a[1] / 2)), metric('⟨Sz⟩ / ħ', num(a[2] / 2)), metric('纯度 Tr(ρ²)', num((1 + p.purity ** 2) / 2))]; },
    render(ctx, w, h, t, p) {
      const a = blochVector(rad(p.theta), rad(p.phi), p.purity), wide = w >= 650, cx = wide ? w * .3 : w * .5, cy = wide ? h * .49 : h * .37, r = Math.min(wide ? w * .23 : w * .31, wide ? h * .34 : h * .25);
      panelTitle(ctx, '量子态空间', 36, 31, w - 72); sphere(ctx, cx, cy, r, a); text(ctx, p.purity === 1 ? '纯态：球面' : p.purity === 0 ? '完全混合态：球心' : '混合态：球内部', cx, cy + r + 42, C.purple, 13, 'center');
      const bx = wide ? w * .64 : 54, by = wide ? h * .27 : h * .73, bw = wide ? w * .3 : w - 108;
      bars(ctx, [['沿 x 测得 +ħ/2', (1 + a[0]) / 2, C.blue], ['沿 y 测得 +ħ/2', (1 + a[1]) / 2, C.purple], ['沿 z 测得 +ħ/2', (1 + a[2]) / 2, C.gold]], bx, by, bw, wide ? 12 : 8, wide ? 68 : 40);
      if (wide) { text(ctx, '每根条的余量 = 测得 −ħ/2 的概率', bx, by + 220, C.muted, 12); text(ctx, 'P(+n) = (1 + r·n) / 2', bx, by + 254, C.text, 16); }
    }
  });

  scenes.push({
    id: 'precession', chapter: 6, title: '磁场中的自旋进动', subtitle: '相对相位的积累，变成期望值的旋转',
    description: '均匀 z 向磁场让两个自旋分量获得不同的相位。自旋态围绕磁场轴进动，而 z 方向测量概率保持不变。',
    formula: 'H = ħΩσz/2；r(t) = (sinθ cosΩt, sinθ sinΩt, cosθ)',
    explanation: '这里定义 H=+ħΩσz/2，因此 Bloch 矢量方位角随时间增加 Ωt。Ω 的符号由磁矩与磁场约定决定。能量本征态只获得整体相位；叠加态的相对相位改变，让横向自旋期望值随时间旋转。',
    observe: 'θ=0° 或180°时，箭头不转动；θ=90°时，z方向正负概率始终各半，但x方向的概率周期变化。',
    experiment: '固定 θ=90°，把 Ω 从1调到2，观察进动周期减半。再把 θ 调成0°，检查可观测量是否停止变化。',
    caution: '进动的是量子自旋的期望值。半透明轨迹位于态空间，不是粒子在三维真实空间的轨道。忽略退相干与轨道运动。',
    source: source(251, '习题6.6、6.8：静磁场中的自旋时间演化'),
    controls: [range('theta', '初态极角 θ', 0, 180, 1, 65, '°'), range('omega', '进动角频率 Ω', -.2, 2, .02, 1)], duration: 24,
    metrics(t, p) { const a = blochVector(rad(p.theta), p.omega * t); return [metric('P(+z)', pct((1 + a[2]) / 2)), metric('P(+x)', pct((1 + a[0]) / 2)), metric('相对相位 Ωt', `${num(p.omega * t, 2)} rad`), metric('进动周期', Math.abs(p.omega) < 1e-9 ? '∞' : num(TAU / Math.abs(p.omega), 2))]; },
    render(ctx, w, h, t, p) {
      const b = columns(w, h), theta = rad(p.theta), v = blochVector(theta, p.omega * t), cx = b.ax + b.aw / 2, cy = b.ay + b.ah * .48, r = Math.min(b.aw * .43, b.ah * .43);
      panelTitle(ctx, 'Bloch 球：围绕 z 轴进动', b.ax, 31, b.aw); sphere(ctx, cx, cy, r, v, { trail: Array.from({ length: 181 }, (_, i) => blochVector(theta, i * TAU / 180)), axis: [0, 0, 1.14] }); text(ctx, 'B ∥ z', cx + r * .5, cy - r * .9, C.gold, 13);
      panelTitle(ctx, '三个分量的期望值', b.bx, b.split ? 31 : b.by - 49, b.bw);
      const g = graph(ctx, b.bx, b.by, b.bw, b.bh, 0, 24, -.55, .55, [{ fn: a => blochVector(theta, p.omega * a)[0] / 2, color: C.blue }, { fn: a => blochVector(theta, p.omega * a)[1] / 2, color: C.purple }, { fn: () => Math.cos(theta) / 2, color: C.gold }], 't', '⟨S⟩ / ħ');
      line(ctx, g.X(t), b.by, g.X(t), b.by + b.bh, '#9da8bf66', 1, [3, 5]); legend(ctx, [['Sx', C.blue], ['Sy', C.purple], ['Sz', C.gold]], b.ax, h - 22, 100);
    }
  });

  scenes.push({
    id: 'rabi', chapter: 6, title: 'Rabi 共振：把自旋翻过来', subtitle: '失谐决定能否完全反转',
    description: '旋转磁场驱动一个自旋。共振时，状态可从北极完整翻到南极；偏离共振时，只能转到较低的纬度。',
    formula: 'Hrot = ħ(Ωσx + δσz)/2；P↓ = Ω² sin²(√(Ω²+δ²)t/2)/(Ω²+δ²)',
    explanation: '在随驱动旋转的参考系中，状态绕有效场 (Ω,0,δ) 旋转。δ=0 时旋转轴横向放置，因此从 |↑⟩ 出发能到达 |↓⟩。增大失谐使旋转轴倾斜，并降低最大翻转概率。',
    observe: '两条曲线分别显示当前失谐和完全共振；失谐曲线更快，却达不到 100%。',
    experiment: '设置 δ=0，在 t=π/Ω 处暂停，查看 P↓ 是否为1。然后设置 δ=Ω，检查最大值是否降到1/2。',
    caution: '画面使用旋转参考系。该常量哈密顿量对圆偏振旋转场可精确得到；若实际用线偏振弱驱动，则使用旋转波近似，要求驱动与失谐远小于载频。',
    source: source(264, '习题6.18：电子自旋共振；习题6.27、6.28（印刷页275～279）的周期磁场；完整Rabi解为延伸'),
    controls: [range('omega', '驱动强度 Ω', .2, 2, .02, 1), range('delta', '失谐 δ', -3, 3, .02, .35)], duration: 24,
    metrics(t, p) { const om = Math.hypot(p.omega, p.delta); return [metric('P↓(t)', pct(rabi(t, p.omega, p.delta))), metric('最大翻转概率', pct(p.omega ** 2 / om ** 2)), metric('有效角频率', num(om)), metric('共振 π 脉冲时间', num(PI / p.omega))]; },
    render(ctx, w, h, t, p) {
      const b = columns(w, h), om = Math.hypot(p.omega, p.delta), r = Math.min(b.aw * .43, b.ah * .43);
      panelTitle(ctx, '旋转参考系中的自旋', b.ax, 31, b.aw); sphere(ctx, b.ax + b.aw / 2, b.ay + b.ah * .48, r, rabiVector(t, p.omega, p.delta), { axis: [1.1 * p.omega / om, 0, 1.1 * p.delta / om], trail: Array.from({ length: 181 }, (_, i) => rabiVector(i * TAU / (180 * om), p.omega, p.delta)) });
      panelTitle(ctx, '翻转概率', b.bx, b.split ? 31 : b.by - 49, b.bw); const g = graph(ctx, b.bx, b.by, b.bw, b.bh, 0, 24, 0, 1.08, [{ fn: a => rabi(a, p.omega, 0), color: C.gold, dash: [4, 5] }, { fn: a => rabi(a, p.omega, p.delta), color: C.blue, fill: true }], 't', 'P↓');
      dot(ctx, g.X(t), g.Y(rabi(t, p.omega, p.delta)), 4, C.blue); line(ctx, g.X(t), b.by, g.X(t), b.by + b.bh, '#acb6cd66', 1, [3, 5]); legend(ctx, [['当前失谐', C.blue], ['共振 δ=0', C.gold, true], ['有效场方向', C.gold]], b.ax, h - 22, w < 660 ? (w - 75) / 3 : 150);
    }
  });

  scenes.push({
    id: 'entanglement', chapter: 6, title: '纠缠：一个共同的量子态', subtitle: '单态的关联随两根测量轴的夹角变化',
    description: '两个自旋处于单态。每一侧单独测量都像抛硬币，合起来却有精确的角度关联。',
    formula: '|S⟩ = (|↑↓⟩ − |↓↑⟩)/√2；P(a,b) = [1 − ab cos(α−β)]/4',
    explanation: 'a、b 取 ±1，分别代表测得 ±ħ/2。单态是整体总自旋为0的纯态，而每一个局部子系统都是完全混合态。左右两边的联合概率随夹角改变，但任一侧的边缘概率始终为1/2。',
    observe: '两根轴平行时，结果严格反相关；相差90°时四种联合结果等概率；相反时结果同号。',
    experiment: '依次设夹角0°、90°、180°，读出四种联合概率。检查每一行或每一列相加是否始终为1/2。',
    caution: '这里画的是联合概率和测量轴，连接弧线仅表示共同量子态，不表示粒子之间正在传送信号。没有模拟具体测量装置或超光速过程。',
    source: source(282, '习题6.30：双自旋概率及条件态；自旋单态与耦合态'),
    controls: [range('alpha', '左侧测量轴 α', 0, 360, 1, 0, '°'), range('beta', '右侧测量轴 β', 0, 360, 1, 65, '°')], duration: 20,
    metrics(t, p) { const d = rad(p.alpha - p.beta); return [metric('关联 ⟨ab⟩', num(-Math.cos(d))), metric('左侧 P(+)', '50.0%'), metric('右侧 P(+)', '50.0%'), metric('同号总概率', pct((1 - Math.cos(d)) / 2))]; },
    render(ctx, w, h, t, p) {
      panelTitle(ctx, '独立看是随机，合起来有关联', 36, 31, w - 72);
      const wide = w > 660, cy = wide ? h * .36 : h * .24, r = Math.min(wide ? w * .105 : w * .14, h * .15), lx = w * .25, rx = w * .75;
      for (const [x, a, name] of [[lx, p.alpha, 'A'], [rx, p.beta, 'B']]) { ctx.save(); ctx.strokeStyle = '#2e3d5b'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, cy, r, 0, TAU); ctx.stroke(); ctx.restore(); const aa = rad(a); arrow(ctx, x - Math.sin(aa) * r * .8, cy + Math.cos(aa) * r * .8, x + Math.sin(aa) * r * .8, cy - Math.cos(aa) * r * .8, name === 'A' ? C.blue : C.purple); text(ctx, name, x, cy + r + 25, C.text, 15, 'center'); dot(ctx, x, cy, 5, C.text, 15); }
      const pts = Array.from({ length: 101 }, (_, i) => { const u = i / 100; return [lx + (rx - lx) * u, cy + Math.sin(u * PI) * r * .48]; }); path(ctx, pts, '#b29aff55', 1.5, [4, 6]); text(ctx, '单态 |S⟩', w / 2, cy - 22, C.purple, 16, 'center');
      const d = rad(p.alpha - p.beta), cellW = Math.min(150, (w - 140) / 2), cellH = wide ? 60 : 48, xx = w / 2 - cellW, yy = wide ? h * .65 : h * .56;
      text(ctx, 'B: +', xx + cellW / 2, yy - 25, C.purple, 12, 'center'); text(ctx, 'B: −', xx + cellW * 1.5, yy - 25, C.purple, 12, 'center');
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const prob = singletJoint(d, i === 0 ? 1 : -1, j === 0 ? 1 : -1); ctx.fillStyle = `rgba(118,169,255,${.05 + prob * 1.15})`; ctx.fillRect(xx + j * cellW + 2, yy + i * cellH + 2, cellW - 4, cellH - 4); text(ctx, pct(prob), xx + (j + .5) * cellW, yy + (i + .5) * cellH, C.text, 19, 'center'); }
      text(ctx, 'A: +', xx - 15, yy + cellH * .5, C.blue, 12, 'right'); text(ctx, 'A: −', xx - 15, yy + cellH * 1.5, C.blue, 12, 'right'); text(ctx, '联合测量概率', w / 2, yy + 2 * cellH + 23, C.muted, 12, 'center');
    }
  });

  scenes.push({
    id: 'exchange', chapter: 7, title: '交换：符号改变，概率不变', subtitle: '把两粒子坐标互换，观察联合波函数',
    description: '用两个正交谐振子轨道构造对称或反对称的双粒子态。交换横纵坐标后，玻色态不变，费米态变号。',
    formula: 'Ψ±(x₁,x₂) = [φ₀(x₁)φ₁(x₂) ± φ₁(x₁)φ₀(x₂)]/√2；P₁₂Ψ± = ±Ψ±',
    explanation: '图的横轴、纵轴分别是同一次实验中两个位置的坐标，因此一张二维图表示两个粒子的一维联合态。蓝与粉分别表示实波函数的正、负号；色彩亮度反映振幅大小。',
    observe: '对称态沿 x₁=x₂ 镜像后颜色相同；反对称态镜像后颜色对调，且对角线上振幅严格为0。概率是模平方，所以交换不改变概率。',
    experiment: '切换玻色对称态与费米反对称态，寻找哪条对角线变暗。开启“交换坐标”，检查符号变化与联合概率不变这两件事。',
    caution: '费米反对称性针对含自旋在内的完整坐标。本页的反对称空间态对应自旋极化费米子；自旋单态电子可以具有对称空间态。',
    source: source(313, '全同性原理与交换算符 (7-1)；习题7.2'),
    controls: [select('statistics', '空间交换对称性', [['boson', '对称 +'], ['fermion', '反对称 −']], 'fermion'), select('swapped', '坐标顺序', [['normal', 'Ψ(x₁,x₂)'], ['swap', 'Ψ(x₂,x₁)']], 'normal')], duration: 18,
    metrics(t, p) { const s = p.statistics === 'boson' ? 1 : -1; return [metric('交换本征值', s === 1 ? '+1' : '−1'), metric('联合态归一化', '1'), metric('Ψ(1,1)', num(pairAmplitude(1, 1, s))), metric('概率交换不变', '成立')]; },
    render(ctx, w, h, t, p) {
      const s = p.statistics === 'boson' ? 1 : -1, side = Math.min(h - 155, w - 125), xx = (w - side) / 2, yy = 75, size = 120;
      panelTitle(ctx, '联合波函数的符号与振幅', 36, 30, w - 72);
      const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size; const tmp = canvas.getContext('2d'), im = tmp.createImageData(size, size);
      for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) { let x = (i + .5) / size * 6 - 3, y = 3 - (j + .5) / size * 6; if (p.swapped === 'swap') [x, y] = [y, x]; const a = pairAmplitude(x, y, s), f = clip(Math.abs(a) * 2), col = a >= 0 ? [118, 169, 255] : [238, 145, 184], k = (j * size + i) * 4; im.data[k] = 10 + col[0] * f; im.data[k + 1] = 17 + col[1] * f; im.data[k + 2] = 30 + col[2] * f; im.data[k + 3] = 255; }
      tmp.putImageData(im, 0, 0); ctx.drawImage(canvas, xx, yy, side, side); heatAxes(ctx, xx, yy, side);
      legend(ctx, [['正振幅', C.blue], ['负振幅', C.pink]], Math.max(36, w / 2 - 145), h - 20, 150);
    }
  });

  scenes.push({
    id: 'correlation', chapter: 7, title: '交换关联：同一位置能否同时出现？', subtitle: '对比三种联合概率，不把关联画成斥力',
    description: '两粒子各占据 φ₀ 与 φ₁。对称化和反对称化会加入正、负干涉项，即使没有任何粒子间相互作用。',
    formula: '|Ψ±|² = ½|φ₀(x₁)φ₁(x₂) ± φ₁(x₁)φ₀(x₂)|²',
    explanation: '可区分粒子的混合基准使用两个有序乘积概率的平均值，与“每个轨道各占一个粒子”的对称、反对称态比较。金色切线表示固定第一个探测位置后第二个位置的条件密度。',
    observe: '反对称空间态在对角线 x₁=x₂ 上严格为零；对称态在某些区域增强，也会在别处相消。交换关联不是一种额外的经典力。',
    experiment: '令固定坐标 x₁=1，切换三种统计，比较 x₂=1 附近的条件密度。再改变固定坐标，观察整个条件分布随之变化。',
    caution: '本页费米子指相同自旋（空间反对称）的两粒子；不同自旋的电子不受同样的空间同点零概率约束。玻色增强也不意味着任意态、任意位置都必然聚集。',
    source: source(315, '习题7.2、7.3、7.5：空间对称性与自旋配对'),
    controls: [select('statistics', '联合态', [['distinguishable', '可区分混合基准'], ['boson', '对称空间态'], ['fermion', '反对称空间态']], 'fermion'), range('x1', '固定坐标 x₁', -2, 2, .02, 1)], duration: 20,
    metrics(t, p) { const s = p.statistics === 'boson' ? 1 : -1, joint = (x, y) => p.statistics === 'distinguishable' ? .5 * ((phi0(x) * phi1(y)) ** 2 + (phi1(x) * phi0(y)) ** 2) : pairAmplitude(x, y, s) ** 2, marginal = .5 * (phi0(p.x1) ** 2 + phi1(p.x1) ** 2); return [metric('联合密度 ρ(x₁,x₁)', num(joint(p.x1, p.x1), 4)), metric('条件密度 ρ(x₁|x₁)', num(joint(p.x1, p.x1) / marginal, 4)), metric('相互作用', '无'), metric('单粒子边缘归一化', '1')]; },
    render(ctx, w, h, t, p) {
      const b = columns(w, h), s = p.statistics === 'boson' ? 1 : -1, rho = (x, y) => p.statistics === 'distinguishable' ? .5 * ((phi0(x) * phi1(y)) ** 2 + (phi1(x) * phi0(y)) ** 2) : pairAmplitude(x, y, s) ** 2;
      panelTitle(ctx, '联合概率密度 |Ψ(x₁,x₂)|²', b.ax, 31, b.aw); panelTitle(ctx, '给定 x₁ 后的条件密度', b.bx, b.split ? 31 : b.by - 49, b.bw);
      const side = Math.min(b.aw, b.ah), xx = b.ax + (b.aw - side) / 2; heat(ctx, xx, b.ay, side, side, (x, y) => rho(x * 6 - 3, y * 6 - 3), .25); heatAxes(ctx, xx, b.ay, side); const fixed = xx + (p.x1 + 3) / 6 * side; line(ctx, fixed, b.ay, fixed, b.ay + side, C.gold, 1.5);
      const marginal = .5 * (phi0(p.x1) ** 2 + phi1(p.x1) ** 2); const g = graph(ctx, b.bx, b.by, b.bw, b.bh, -3, 3, 0, 1, [{ fn: y => rho(p.x1, y) / marginal, color: C.gold, fill: true }], 'x₂ / ℓ', 'ρ(x₂ | x₁)');
      line(ctx, g.X(p.x1), b.by, g.X(p.x1), b.by + b.bh, '#d8b77377', 1, [4, 4]); text(ctx, '虚线：x₂ = x₁', b.bx, h - 22, C.gold, 12);
    }
  });

  scenes.push({
    id: 'occupation', chapter: 7, title: '占有数：同样的粒子，怎样填能级？', subtitle: '零温、无相互作用、单个自旋分量',
    description: '让 N 个粒子寻找最低总能量。玻色子可共享同一单粒子态；相同自旋费米子每个态只能放一个。',
    formula: '玻色子：nᵢ = 0,1,2,…；费米子：nᵢ = 0,1；E = Σᵢ nᵢεᵢ',
    explanation: '在一维谐振子中，第 i 个单粒子能量为 i+1/2。零温时玻色子都占据最低能级；自旋极化费米子从低到高逐个填充，因此随着 N 增加，最低可能的总能量增长更快。',
    observe: '玻色子的光点堆在最低一条线上；费米子依次填满更高的线。点仅表示占有数，不表示每个粒子的位置。',
    experiment: '从 N=1 加到 N=8，对比两类粒子的总能量。检查费米子结果是否为 N²/2，玻色子是否为 N/2。',
    caution: '这里每条线代表一个完整单粒子态，且只保留一种自旋分量。若保留电子两种自旋，同一空间轨道可以放两个自旋相反的电子。',
    source: source(313, '占有数表象 (7-2)；习题7.1、7.4、7.25'),
    controls: [range('N', '粒子数 N', 1, 8, 1, 5), select('statistics', '粒子类型', [['boson', '玻色子'], ['fermion', '自旋极化费米子']], 'fermion')], duration: 20,
    metrics(t, p) { const f = p.statistics === 'fermion', n = Math.round(p.N); return [metric('总能量 / ħω', num(f ? n * n / 2 : n / 2, 1)), metric('最高占据能量', num(f ? n - .5 : .5, 1)), metric('占据的单粒子态数', String(f ? n : 1)), metric('温度 / 相互作用', '零温 / 无')]; },
    render(ctx, w, h, t, p) {
      panelTitle(ctx, '最低能量的填充方式', 36, 31, w - 72); const n = Math.round(p.N), fermion = p.statistics === 'fermion', levels = occupancies(n, fermion), x0 = Math.max(75, w * .18), x1 = w * .86, top = 88, bottom = h - 72, gap = (bottom - top) / 8;
      for (let i = 0; i < 8; i++) { const y = bottom - i * gap, count = levels[i], color = count ? C.blue : '#37425d'; line(ctx, x0, y, x1, y, color, count ? 1.8 : 1); text(ctx, `ε${i} = ${i + .5}`, x0 - 16, y, C.muted, 12, 'right'); text(ctx, `n${i} = ${count}`, x1 + 15, y, count ? C.text : '#68738d', 12); for (let j = 0; j < count; j++) dot(ctx, x0 + 30 + (j + 1) / (count + 1) * Math.min(x1 - x0 - 60, 330), y, 6, fermion ? C.purple : C.gold, 13); }
      text(ctx, fermion ? '每个完整单粒子态至多一个' : '同一单粒子态可以容纳多个', w / 2, h - 23, fermion ? C.purple : C.gold, 13, 'center');
    }
  });

  scenes.push({
    id: 'ladder', chapter: 7, title: '产生与湮没：态之间的阶梯', subtitle: '算符改变占有数，也改变振幅系数',
    description: '选一个数态，让产生算符或湮没算符作用。观察目标数态与前面的平方根系数；费米子的重复产生会得到零。',
    formula: 'a†|n⟩ = √(n+1)|n+1⟩；a|n⟩ = √n|n−1⟩；费米子 (a†)² = 0',
    explanation: '产生、湮没是对 Fock 空间量子态的代数操作。√n 使玻色子的对易关系及数态归一化一致。对于单个费米模式，占有数只允许0或1，因此已占据态上的再次产生为零。',
    observe: '玻色子从更高 n 开始作用，系数会增大。费米子 |1⟩ 再产生，以及真空 |0⟩ 的湮没，都没有目标态。',
    experiment: '比较 a†|0⟩、a†|3⟩ 和 a|3⟩ 的系数。随后切换费米子，检查 a†|1⟩ 为什么必须为0。',
    caution: '动画进度仅示意算符映射，不表示任意产生算符都可作为一个连续、概率守恒的物理时间演化。系数平方不是可直接当作概率的数；产生算符并非幺正。',
    source: source(313, '产生、湮没算符 (7-3)～(7-5)；习题7.11、7.13'),
    controls: [select('statistics', '模式类型', [['boson', '玻色模式'], ['fermion', '费米模式']], 'boson'), range('n', '起始占有数 n', 0, 6, 1, 3), select('operation', '作用的算符', [['create', '产生 a†'], ['annihilate', '湮没 a']], 'create')], duration: 12,
    metrics(t, p) { const f = p.statistics === 'fermion', n = f ? Math.min(1, Math.round(p.n)) : Math.round(p.n), c = ladderCoeff(n, p.operation === 'create', f); return [metric('有效起始 n', String(n)), metric('振幅系数', num(c)), metric('作用结果', c === 0 ? '零矢量' : `|${n + (p.operation === 'create' ? 1 : -1)}⟩`), metric('算符是否幺正', '否')]; },
    render(ctx, w, h, t, p) {
      const f = p.statistics === 'fermion', n = f ? Math.min(1, Math.round(p.n)) : Math.round(p.n), create = p.operation === 'create', target = n + (create ? 1 : -1), c = ladderCoeff(n, create, f), count = f ? 2 : 8, top = 95, bot = h - 115, yy = i => bot - i / Math.max(1, count - 1) * (bot - top), xx = w * .32, end = w * .71;
      panelTitle(ctx, '单模 Fock 空间', 36, 31, w - 72); for (let i = 0; i < count; i++) { const y = yy(i); line(ctx, xx, y, end, y, i === n ? C.blue : i === target && c ? C.gold : C.grid, i === n || i === target && c ? 2 : 1); text(ctx, `|${i}⟩`, xx - 24, y, i === n ? C.text : C.muted, 16, 'right'); }
      dot(ctx, xx + 15, yy(n), 7, C.blue, 20);
      if (c) { const u = (t % 4) / 4, ease = .5 - .5 * Math.cos(u * PI); arrow(ctx, xx + (end - xx) * .65, yy(n), xx + (end - xx) * .65, yy(target), C.gold, 2.5); dot(ctx, xx + (end - xx) * .65, yy(n) + (yy(target) - yy(n)) * ease, 5, C.gold, 20); }
      else { text(ctx, '0', end + 35, yy(n), C.pink, 30); line(ctx, xx + (end - xx) * .45, yy(n) - 12, xx + (end - xx) * .45 + 24, yy(n) + 12, C.pink, 2); line(ctx, xx + (end - xx) * .45, yy(n) + 12, xx + (end - xx) * .45 + 24, yy(n) - 12, C.pink, 2); }
      const result = `${create ? 'a†' : 'a'}|${n}⟩ = ${c ? `${num(c)} |${target}⟩` : '0'}`; text(ctx, result, w / 2, h - 62, C.text, w < 500 ? 21 : 25, 'center');
      text(ctx, f && p.n > 1 ? '费米单模只允许 n=0,1；滑块值已按 n=1 展示' : '光点表示数态映射，不表示空间运动', w / 2, h - 24, C.muted, 12, 'center');
    }
  });

  scenes.push({
    id: 'slater', chapter: 7, title: 'Slater 行列式与泡利原理', subtitle: '两个相同的完整轨道，让行列式归零',
    description: '把第二个轨道逐渐旋向第一个。费米反对称化后的振幅越来越小；完全相同的两个轨道不能构成非零的双费米态。',
    formula: 'Ψ̃ = [u(x₁)v(x₂) − v(x₁)u(x₂)]/√2；||Ψ̃||² = 1 − |⟨u|v⟩|²',
    explanation: '取 u=φ₀，v=cosη φ₀+sinη φ₁。未归一化行列式恰好等于 sinη 乘以标准反对称态，所以范数平方为 sin²η。只要 η≠0，归一化后的物理态形状相同；η=0 时是零矢量，不能归一化为一个物理态。',
    observe: '随着 η 接近0，未归一化联合概率图整体变暗，但反对称对角线始终为零。这反映线性相关轨道的行列式消失。',
    experiment: '先取 η=90°，确认轨道正交且范数为1；再取30°，检查范数为1/4；最后取0°，看“零矢量”的含义。',
    caution: '本页刻意显示未归一化行列式；亮度下降不代表归一化物理态的总概率减少。占据相同空间轨道而自旋相反的两个电子，完整自旋轨道仍然不同。',
    source: source(315, '双费米态反对称化；习题7.3、7.5的泡利约束'),
    controls: [range('eta', '第二轨道混合角 η', 0, 90, 1, 65, '°')], duration: 18,
    metrics(t, p) { const a = rad(p.eta), overlap = Math.cos(a); return [metric('轨道重叠 |⟨u|v⟩|', num(overlap)), metric('未归一化态的范数²', num(Math.sin(a) ** 2)), metric('可否归一化', p.eta === 0 ? '不能：零矢量' : '可以'), metric('同点振幅 Ψ(x,x)', '0')]; },
    render(ctx, w, h, t, p) {
      const b = columns(w, h), a = rad(p.eta), s = Math.sin(a), c = Math.cos(a);
      panelTitle(ctx, '两个归一化的单粒子轨道', b.ax, 31, b.aw); graph(ctx, b.ax, b.ay, b.aw, b.ah, -3, 3, -.85, .85, [{ fn: phi0, color: C.blue }, { fn: x => c * phi0(x) + s * phi1(x), color: C.purple }], 'x / ℓ', '轨道振幅');
      panelTitle(ctx, '未归一化 |Ψ̃|²', b.bx, b.split ? 31 : b.by - 49, b.bw); const side = Math.min(b.bw, b.bh); heat(ctx, b.bx + (b.bw - side) / 2, b.by, side, side, (x, y) => s * s * pairAmplitude(x * 6 - 3, y * 6 - 3, -1) ** 2, .25); heatAxes(ctx, b.bx + (b.bw - side) / 2, b.by, side);
      if (p.eta === 0) text(ctx, '零矢量：不是可归一化的双费米态', b.bx + b.bw / 2, b.by + side / 2, C.pink, 13, 'center'); legend(ctx, [['u = φ₀', C.blue], ['v = cosη φ₀ + sinη φ₁', C.purple]], b.ax, h - 22, 130);
    }
  });
  (window.QS_SCENES ||= []).push(...scenes);
})();
