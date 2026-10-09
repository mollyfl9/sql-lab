/* 主应用：路由 / 题目详情 / 编辑器 / 判题 / 采集 / 统计 */
(() => {
  const view = document.getElementById('view');
  const $ = sel => document.querySelector(sel);

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function allProblems() {
    return PROBLEMS.concat(Store.customProblems());
  }
  const byId = id => allProblems().find(p => p.id === id);
  const stageOf = sid => ROADMAP.find(s => s.id === sid);

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  /* ---------------- SQL 高亮 ---------------- */
  const KW = ['SELECT','FROM','WHERE','GROUP','BY','HAVING','ORDER','LIMIT','OFFSET','JOIN','LEFT','RIGHT','INNER','FULL','OUTER','ON','AS','AND','OR','NOT','IN','EXISTS','DISTINCT','CASE','WHEN','THEN','ELSE','END','WITH','UNION','ALL','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','INTEGER','TEXT','REAL','NULL','IS','BETWEEN','LIKE','DESC','ASC','OVER','PARTITION','ROWS','RANGE','PRECEDING','FOLLOWING','CURRENT','ROW','CAST'];
  const FN = ['COUNT','SUM','AVG','MIN','MAX','ROUND','COALESCE','ROW_NUMBER','RANK','DENSE_RANK','NTILE','LAG','LEAD','DATE','DATETIME','STRFTIME','JULIANDAY','ABS','IFNULL','SUBSTR','LENGTH','CAST'];
  const RE = new RegExp(
    "(--[^\\n]*|#[^\\n]*)" +
    "|('(?:[^']|'')*')" +
    "|(\\b\\d+(?:\\.\\d+)?\\b)" +
    "|\\b(" + KW.join('|') + ")\\b" +
    "|\\b(" + FN.join('|') + ")(?=\\s*\\()",
    'gi'
  );
  function highlight(sql) {
    let out = '', last = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(sql))) {
      out += esc(sql.slice(last, m.index));
      const cls = m[1] ? 'cmt' : m[2] ? 'str' : m[3] ? 'num' : m[4] ? 'kw' : 'fn';
      out += `<span class="${cls}">${esc(m[0])}</span>`;
      last = m.index + m[0].length;
    }
    return out + esc(sql.slice(last));
  }

  /* ---------------- 结果表格 ---------------- */
  function tableHtml(res, expected, limit = 200) {
    if (!res) return '<div class="empty">暂无输出</div>';
    if (!res.columns.length) return '<div class="empty">语句执行成功，但没有返回结果集</div>';
    const cols = res.columns;
    const rows = res.rows.slice(0, limit);
    let h = '<div class="res-tbl"><table><thead><tr>';
    cols.forEach(c => h += `<th>${esc(c)}</th>`);
    h += '</tr></thead><tbody>';
    rows.forEach((r, ri) => {
      const er = expected ? expected.rows[ri] : null;
      h += '<tr>';
      cols.forEach((c, ci) => {
        const v = r[ci];
        const diff = er && JSON.stringify(er[ci]) !== JSON.stringify(v) ? ' class="diff"' : '';
        h += `<td${diff}>${v === null ? '<span class="muted">NULL</span>' : esc(v)}</td>`;
      });
      h += '</tr>';
    });
    h += '</tbody></table></div>';
    if (res.rows.length > limit) h += `<div class="small muted" style="margin-top:6px">仅显示前 ${limit} 行</div>`;
    return h;
  }

  /* ================= 视图：学习路线 ================= */
  function renderRoadmap() {
    const list = allProblems();
    const done = list.filter(p => Store.isPassed(p.id)).length;
    const daily = Store.dailyIds(list.map(p => p.id));

    let h = `<div class="card" style="padding:18px 20px;margin-bottom:16px">
      <div class="row" style="align-items:flex-start">
        <div style="flex:1">
          <div style="font-size:15px;font-weight:700">SQL 面试通关路线</div>
          <div class="small muted" style="margin-top:4px">7 个阶段 · ${list.length} 道题 · 由易到难，全部可在浏览器内真实执行判题</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:22px;font-weight:700;color:var(--accent)">${done}<span class="muted" style="font-size:14px"> / ${list.length}</span></div>
          <div class="small muted">已通过</div>
        </div>
      </div>
      <div class="row wrap" style="margin-top:14px">
        <span class="small muted">今日一练</span>
        ${daily.map(id => { const p = byId(id); return `<button class="btn sm" data-goproblem="${id}">${esc(p ? p.title : id)}</button>`; }).join('')}
      </div>
    </div>`;

    ROADMAP.forEach(st => {
      const ps = list.filter(p => p.stage === st.id);
      const ok = ps.filter(p => Store.isPassed(p.id)).length;
      const pct = ps.length ? Math.round(ok / ps.length * 100) : 0;
      h += `<div class="card stage">
        <div class="stage-head">
          <div class="stage-no">${st.no}</div>
          <div style="flex:1">
            <div class="stage-title">${esc(st.title)}</div>
            <div class="stage-desc">${esc(st.desc)}</div>
          </div>
          <div class="stage-meta">
            <div style="font-size:16px;font-weight:700;color:${pct === 100 ? 'var(--green)' : 'var(--text)'}">${ok}/${ps.length}</div>
            <div>${pct}%</div>
          </div>
        </div>
        <div class="small muted" style="margin-top:10px">目标：${esc(st.goal)}</div>
        <div class="kps">${st.kps.map(k => `<span class="chip">${esc(k)}</span>`).join('')}</div>
        <div class="plist">${ps.map(p => `
          <div class="pitem" data-goproblem="${p.id}">
            <span class="pid">${p.id}</span>
            <span class="dot ${Store.isPassed(p.id) ? 'pass' : ''}" style="${Store.isPassed(p.id) ? '' : 'background:#e3e5e8'}"></span>
            <span class="ptitle">${esc(p.title)}</span>
            <span class="spacer"></span>
            <span class="lv ${p.level}">${p.level}</span>
          </div>`).join('') || '<div class="empty">本阶段暂无题目</div>'}</div>
      </div>`;
    });
    view.innerHTML = h;
  }

  /* ================= 视图：题库 ================= */
  let filter = { level: '全部', stage: '全部', status: '全部', q: '' };

  function renderProblems() {
    const list = allProblems();
    const idxMap = {};
    list.forEach((p, i) => { idxMap[p.id] = i + 1; });

    const rows = list.filter(p => {
      if (filter.level !== '全部' && p.level !== filter.level) return false;
      if (filter.stage !== '全部' && p.stage !== filter.stage) return false;
      if (filter.status === '已通过' && !Store.isPassed(p.id)) return false;
      if (filter.status === '未通过' && Store.isPassed(p.id)) return false;
      if (filter.q) {
        const hay = (p.title + p.tags.join('') + p.id).toLowerCase();
        if (!hay.includes(filter.q.toLowerCase())) return false;
      }
      return true;
    });

    const passedAll = list.filter(p => Store.isPassed(p.id)).length;
    const pctAll = list.length ? Math.round(passedAll / list.length * 100) : 0;
    const lvStat = lv => {
      const ps = list.filter(p => p.level === lv);
      return { total: ps.length, ok: ps.filter(p => Store.isPassed(p.id)).length };
    };
    const S = lvStat('简单'), M = lvStat('中等'), H = lvStat('困难');

    const seg = (key, opts) => `<div class="seg">${opts.map(o =>
      `<button data-filter="${key}" data-val="${o}" class="${filter[key] === o ? 'on' : ''}">${o}</button>`).join('')}</div>`;

    const rowHtml = p => `<div class="ps-row" data-goproblem="${p.id}">
        <span class="ps-status ${Store.isPassed(p.id) ? 'ok' : ''}">${Store.isPassed(p.id) ? '✓' : '○'}</span>
        <span class="ps-num">${idxMap[p.id]}</span>
        <span class="ps-title">${esc(p.title)}${p.id.startsWith('custom') ? ' <span class="chip accent">面经</span>' : ''}</span>
        <span class="ps-tags">${p.tags.slice(0, 3).map(t => `<span class="chip">${esc(t)}</span>`).join('')}</span>
        <span class="ps-diff ${p.level}">${p.level}</span>
      </div>`;

    const groups = ROADMAP.map(st => {
      const ps = rows.filter(p => p.stage === st.id);
      if (!ps.length) return '';
      const ok = ps.filter(p => Store.isPassed(p.id)).length;
      return `<div class="ps-group">
          <div class="ps-group-head">
            <span class="ps-group-no">${st.no}</span>
            <span>${esc(st.title)}</span>
            <span class="ps-group-meta">${ok} / ${ps.length}</span>
          </div>
          ${ps.map(rowHtml).join('')}
        </div>`;
    }).join('');

    view.innerHTML = `
      <div class="card ps-hero">
        <div class="ps-hero-main">
          <div class="ps-hero-title">SQL 面试题单</div>
          <div class="ps-hero-sub">${ROADMAP.length} 个阶段 · ${list.length} 道题 · 浏览器内真实执行判题</div>
          <div class="ps-diff">
            <span class="ps-diff-item easy">简单 <b>${S.ok}</b>/${S.total}</span>
            <span class="ps-diff-item mid">中等 <b>${M.ok}</b>/${M.total}</span>
            <span class="ps-diff-item hard">困难 <b>${H.ok}</b>/${H.total}</span>
          </div>
        </div>
        <div class="ps-hero-prog">
          <div class="ps-big">${passedAll}<span> / ${list.length}</span></div>
          <div class="small muted">已通过 · ${pctAll}%</div>
          <div class="ps-bar"><i style="width:${pctAll}%"></i></div>
        </div>
      </div>

      <div class="filters">
        ${seg('level', ['全部', '简单', '中等', '困难'])}
        ${seg('status', ['全部', '未通过', '已通过'])}
        <select id="f-stage" class="btn" style="padding:6px 10px">
          <option value="全部">全部阶段</option>
          ${ROADMAP.map(s => `<option value="${s.id}" ${filter.stage === s.id ? 'selected' : ''}>${s.no} ${esc(s.title)}</option>`).join('')}
        </select>
        <span class="spacer"></span>
        <span class="small muted">共 ${rows.length} 题${filter.q ? `（搜索「${esc(filter.q)}」）` : ''}</span>
      </div>

      <div class="card ps-list">
        ${groups || '<div class="empty">没有符合条件的题目</div>'}
      </div>`;

    view.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => {
      filter[b.dataset.filter] = b.dataset.val;
      renderProblems();
    });
    $('#f-stage').onchange = e => { filter.stage = e.target.value; renderProblems(); };
  }

  /* ================= 视图：题目详情 ================= */
  let current = null;
  let showSolution = false;

  function renderProblem(id) {
    const p = byId(id);
    if (!p) { location.hash = '#/problems'; return; }
    current = p;
    const st = stageOf(p.stage);
    const saved = Store.savedSql(p.id);
    const idx = allProblems().findIndex(x => x.id === p.id);
    const prev = allProblems()[idx - 1], next = allProblems()[idx + 1];

    view.innerHTML = `
      <div class="p-topbar">
        <button class="btn sm" data-go="problems">← 题库</button>
        <span class="p-crumb">${st ? st.no + ' · ' + esc(st.title) : ''}</span>
        <span class="spacer"></span>
        ${Store.isPassed(p.id) ? '<span class="p-done">✓ 已通过</span>' : ''}
        <button class="btn sm" data-act="star">${Store.isStarred(p.id) ? '★ 已收藏' : '☆ 收藏'}</button>
        <button class="btn sm" data-goproblem="${prev ? prev.id : ''}" ${prev ? '' : 'disabled'}>上一题</button>
        <button class="btn sm" data-goproblem="${next ? next.id : ''}" ${next ? '' : 'disabled'}>下一题</button>
      </div>
      <div class="detail">
        <div class="card pane p-desc">
          <div class="p-head">
            <span class="p-hnum">${idx + 1}</span>
            <div style="min-width:0">
              <div class="p-title">${esc(p.title)}</div>
              <div class="p-headmeta">
                <span class="p-diff ${p.level}">${p.level}</span>
                ${p.tags.map(t => `<span class="chip">${esc(t)}</span>`).join('')}
                <span class="small muted">${esc(p.id)}</span>
              </div>
            </div>
          </div>

          <div class="p-section">
            <h3>题目描述</h3>
            <div class="p-body">${p.desc}</div>
          </div>

          <div class="p-section">
            <h3>表结构</h3>
            <pre class="code">${esc(p.schema)}</pre>
          </div>

          <div class="p-section">
            <h3>样例数据</h3>
            <pre class="code">${esc(p.data || '-- 无')}</pre>
          </div>

          <div class="p-section">
            <h3>提示</h3>
            <div class="p-body">${esc(p.hint || '暂无提示')}</div>
          </div>

          <div class="p-section">
            <h3>解析</h3>
            ${showSolution
              ? `<pre class="code">${esc(p.solution)}</pre><div class="p-body" style="margin-top:10px">${esc(p.explain || '')}</div>`
              : `<button class="btn sm" data-act="reveal">显示参考答案</button>
                 <div class="small muted" style="margin-top:6px">想不出来再看，看了也要自己敲一遍</div>`}
          </div>
        </div>

        <div class="p-right">
          <div class="card pane">
            <div class="editor-wrap">
              <div class="editor-bar">
                <span class="lang-chip">SQLite</span>
                <span class="small muted">窗口函数 / CTE</span>
                <span class="spacer"></span>
                <span class="small muted keyhint">⌘/Ctrl + Enter 提交</span>
                <button class="btn sm" data-act="reset">重置</button>
                <button class="btn sm" data-act="run">运行</button>
                <button class="btn sm primary" data-act="submit">提交</button>
              </div>
              <div class="editor-scroll">
                <pre id="mirror"></pre>
                <textarea id="code" spellcheck="false" autocapitalize="off" autocorrect="off"></textarea>
              </div>
            </div>
            <div id="result" class="result"></div>
          </div>
        </div>
      </div>`;

    const ta = $('#code'), mirror = $('#mirror');
    ta.value = saved || p.starter || 'SELECT ';
    const sync = () => { mirror.innerHTML = highlight(ta.value) + '\n'; };
    sync();
    ta.addEventListener('input', sync);
    ta.addEventListener('scroll', () => { mirror.scrollTop = ta.scrollTop; mirror.scrollLeft = ta.scrollLeft; });
    ta.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = ta.selectionStart, en = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(en);
        ta.selectionStart = ta.selectionEnd = s + 2;
        sync();
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); doSubmit(); }
    });

    view.querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
      const a = b.dataset.act;
      if (a === 'run') doRun();
      if (a === 'submit') doSubmit();
      if (a === 'reset') { ta.value = p.starter || ''; sync(); $('#result').innerHTML = ''; }
      if (a === 'star') { const on = Store.toggleStar(p.id); toast(on ? '已收藏' : '已取消收藏'); renderProblem(p.id); }
      if (a === 'reveal') { showSolution = true; renderProblem(p.id); }
    });
  }

  function ensureEngine() {
    if (Engine.isReady()) return true;
    $('#result').innerHTML = '<div class="verdict bad">SQLite 引擎还没加载完，请稍等两秒再试（或确认是通过 http:// 打开而不是 file://）</div>';
    return false;
  }

  function doRun() {
    const p = current, sql = $('#code').value;
    if (!sql.trim()) { toast('请先写点 SQL'); return; }
    if (!ensureEngine()) return;
    const r = Engine.runOnly(p, sql);
    const box = $('#result');
    if (!r.ok) {
      box.innerHTML = `<div class="verdict bad"><b>执行出错</b><span>${esc(r.error)}</span></div>`;
    } else {
      box.innerHTML = `<div class="verdict info">运行成功 · ${r.result.rows.length} 行</div>${tableHtml(r.result)}`;
    }
  }

  function doSubmit() {
    const p = current, sql = $('#code').value;
    if (!sql.trim()) { toast('请先写点 SQL'); return; }
    if (!ensureEngine()) return;
    const r = Engine.judge(p, sql);
    const box = $('#result');
    if (r.stage === 'run') {
      box.innerHTML = `<div class="verdict bad"><b>SQL 执行出错</b><span>${esc(r.error)}</span></div>`;
      Store.record(p.id, false, sql);
      refreshBadges();
      return;
    }
    Store.record(p.id, r.ok, sql);
    refreshBadges();
    if (r.ok) {
      box.innerHTML = `<div class="verdict ok"><b>通过 ✓</b><span>共 ${r.actual.rows.length} 行${r.warn ? ' · ' + esc(r.warn) : ''}</span></div>
        ${tableHtml(r.actual)}`;
      toast('通过！');
    } else {
      box.innerHTML = `<div class="verdict bad"><b>未通过</b><span>你的输出 ${r.cmp.rowCountActual} 行，期望 ${r.cmp.rowCountExpected} 行</span></div>
        <div class="grid2">
          <div><div class="small muted" style="margin:8px 0 4px">你的输出</div>${tableHtml(r.actual, r.expected)}</div>
          <div><div class="small muted" style="margin:8px 0 4px">期望输出</div>${tableHtml(r.expected)}</div>
        </div>`;
    }
  }

  /* ================= 视图：面经采集 ================= */
  const SOURCES = [
    { name: '牛客网', meta: '讨论区 / 面经专区，SQL 题密度最高', st: '推荐首发' },
    { name: '脉脉', meta: '职言、面经帖，偏互联网大厂', st: '需登录态' },
    { name: '知乎', meta: '「数据分析面试」话题下的经验帖', st: '可抓公开页' },
    { name: '小红书', meta: '面经笔记，口语化描述多', st: '需签名' },
    { name: 'CSDN / 掘金', meta: 'SQL 面试题整理类博客', st: '可抓公开页' },
    { name: '本地文件', meta: '把保存下来的网页/笔记直接粘进来', st: '立即可用' }
  ];

  function renderCrawler() {
    const drafts = Store.state.drafts;
    const topics = (typeof Topics !== 'undefined') ? Topics.catalog() : [];
    view.innerHTML = `
      <div class="card" style="padding:18px 20px;margin-bottom:16px">
        <div style="font-size:15px;font-weight:700">面经 → 考点解读 → 自动出题</div>
        <div class="small muted" style="margin-top:4px">真实面经常常只有一句话（如「求8月12号发稿量top100的商家ID和发稿量」）。粘贴进来后会自动<b>识别考点</b>、给出<b>考点解读</b>（面试官在考什么 / 常见坑 / 解题思路），并<b>针对该考点生成一道完整可判题的题</b>，可直接入库去刷。</div>
      </div>

      <div class="grid2">
        <div class="card pane">
          <h3 style="margin:0 0 4px;font-size:14px">采集源</h3>
          <div class="small muted" style="margin-bottom:12px">浏览器有同源策略，直接抓第三方站点会被拦。正式抓取请用 Node 侧脚本 <code>scripts/crawl-mianjing.mjs</code>，或把网页文本粘到右侧。</div>
          <div class="src-grid">
            ${SOURCES.map(s => `<div class="src">
              <div class="src-name">${esc(s.name)}<span class="chip">${esc(s.st)}</span></div>
              <div class="src-meta">${esc(s.meta)}</div>
            </div>`).join('')}
          </div>
          <h3 style="margin:18px 0 4px;font-size:14px">处理流水线</h3>
          <div class="pipeline">
            ${[
              ['抓取', '按关键词（SQL 面试 / 数据分析面经）拉取帖子正文，落盘到 <code>data/raw/</code>'],
              ['切句', '把面经切成一句一题，编号列表、换行、句号都能切'],
              ['识别考点', '关键词打分命中考点（TopN / 分组日均 / 分组内 TopN / 留存 / 连续 N 天 …），取最高分为主考点'],
              ['解读 + 出题', '输出考点解读（面试官视角 / 常见坑 / 思路），并按考点模板生成 schema + 样例数据 + 标准答案'],
              ['入库', '一键跑参考答案校验，通过后进入题库，从此可自动判题']
            ].map((s, i) => `<div class="pipe-step">
              <div style="display:flex;flex-direction:column;align-items:center">
                <div class="pipe-dot">${i + 1}</div>${i < 4 ? '<div class="pipe-line"></div>' : ''}
              </div>
              <div class="pipe-body"><div class="pipe-t">${s[0]}</div><div class="pipe-d">${s[1]}</div></div>
            </div>`).join('')}
          </div>
        </div>

        <div class="card pane">
          <h3 style="margin:0 0 8px;font-size:14px">粘贴面经文本</h3>
          <textarea id="paste" class="paste" placeholder="一句话也行，例如：&#10;1. 求8月12号发稿量top100的商家ID和发稿量&#10;2. 求不同类目的商家最近七日的日均发稿量，输出类目、日均发稿量&#10;3. 8月12号每个类目下成交GMV top10的商家ID"></textarea>
          <div class="row" style="margin-top:10px">
            <button class="btn primary" id="btn-extract">识别考点并出题</button>
            <button class="btn" id="btn-demo">填入示例</button>
            <span class="spacer"></span>
            <span class="small muted" id="extract-tip"></span>
          </div>
          <div class="small muted" style="margin-top:10px">已支持考点（共 ${topics.length} 个）：</div>
          <div class="row wrap" style="margin-top:6px">
            ${topics.map(t => `<span class="chip" title="${esc(t.explain)}">${esc(t.name)}</span>`).join('')}
          </div>
        </div>
      </div>

      <div class="card pane" style="margin-top:16px">
        <div class="row">
          <h3 style="margin:0;font-size:14px">草稿箱</h3>
          <span class="chip">${drafts.length}</span>
          <span class="spacer"></span>
          <span class="small muted">生成的题可直接「入库并刷题」；未命中考点的需人工补全</span>
        </div>
        <div style="margin-top:12px">
          ${drafts.length ? drafts.map(d => draftHtml(d)).join('') : '<div class="empty">还没有草稿，先在上方粘贴一句面经试试</div>'}
        </div>
      </div>`;

    $('#btn-extract').onclick = () => {
      const txt = $('#paste').value;
      const got = Extract.fromText(txt, '手工粘贴');
      if (!got.length) { $('#extract-tip').textContent = '没识别到考点或 SQL，换个说法或补上关键词（如 top100 / 日均 / 留存）'; return; }
      const withTopic = got.filter(d => d.topic).length;
      got.forEach(d => Store.addDraft(d));
      $('#extract-tip').textContent = `识别 ${got.length} 题，其中 ${withTopic} 题命中考点并已自动出题`;
      toast(`识别到 ${got.length} 题`);
      renderCrawler();
    };
    $('#btn-demo').onclick = () => {
      $('#paste').value = DEMO_TEXT;
      toast('已填入示例文本（来自真实面经）');
    };

    view.querySelectorAll('[data-draft-act]').forEach(b => {
      b.onclick = () => {
        const id = b.dataset.id, act = b.dataset.draftAct;
        if (act === 'del') { Store.removeDraft(id); renderCrawler(); }
        if (act === 'toggle') { Store.updateDraft(id, { _open: !Store.state.drafts.find(d => d.id === id)._open }); renderCrawler(); }
        if (act === 'publish') publishDraft(id);
      };
    });
    view.querySelectorAll('[data-draft-field]').forEach(el => {
      el.addEventListener('input', () => {
        Store.updateDraft(el.dataset.id, { [el.dataset.draftField]: el.value });
      });
    });
  }

  function draftHtml(d) {
    const open = d._open;
    const tp = d.topic;
    const others = tp && tp.others && tp.others.length
      ? `<span class="small muted">还命中：${tp.others.map(o => esc(o.name)).join('、')}</span>` : '';
    return `<div class="draft">
      <div class="row" style="align-items:flex-start">
        <div style="flex:1">
          <input class="btn" style="width:100%;text-align:left;font-weight:600;border:none;background:transparent;padding:0"
                 value="${esc(d.title)}" data-draft-field="title" data-id="${d.id}" />
          <div class="row wrap" style="margin-top:6px">
            <span class="lv ${d.level}">${d.level}</span>
            ${tp ? `<span class="chip accent">考点 · ${esc(tp.name)}</span>` : ''}
            ${d.tags.map(t => `<span class="chip">${esc(t)}</span>`).join('')}
            <span class="small muted">${esc(d.source || '')}</span>
          </div>
        </div>
        <button class="btn sm" data-draft-act="toggle" data-id="${d.id}">${open ? '收起' : '编辑'}</button>
        <button class="btn sm primary" data-draft-act="publish" data-id="${d.id}">入库并刷题</button>
        <button class="btn sm" data-draft-act="del" data-id="${d.id}">删除</button>
      </div>
      ${d.rawText ? `<div class="raw-line">面经原句：${esc(d.rawText)}</div>` : ''}
      ${tp ? `<div class="topic-box">
        <div class="topic-h">考点解读 · ${esc(tp.name)}</div>
        <div class="topic-explain">${esc(tp.explain)}</div>
        ${tp.pitfalls && tp.pitfalls.length ? `<div class="topic-sub">常见坑</div><ul class="topic-list">${tp.pitfalls.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
        ${tp.outline ? `<div class="topic-sub">解题思路</div><div class="topic-explain">${esc(tp.outline)}</div>` : ''}
        <div class="row wrap" style="margin-top:8px">${others}</div>
      </div>` : ''}
      <div class="small muted" style="margin-top:12px">生成题目</div>
      <pre class="code" style="margin-top:6px;max-height:140px;overflow:auto">${esc(d.desc)}</pre>
      ${open ? `
        <div class="grid2" style="margin-top:12px">
          <div>
            <div class="small muted" style="margin-bottom:4px">表结构 CREATE</div>
            <textarea class="paste" style="min-height:130px" data-draft-field="schema" data-id="${d.id}">${esc(d.schema)}</textarea>
          </div>
          <div>
            <div class="small muted" style="margin-bottom:4px">样例数据 INSERT</div>
            <textarea class="paste" style="min-height:130px" data-draft-field="data" data-id="${d.id}">${esc(d.data)}</textarea>
          </div>
        </div>
        <div style="margin-top:10px">
          <div class="small muted" style="margin-bottom:4px">参考答案（用于判题比对）</div>
          <textarea class="paste" style="min-height:130px" data-draft-field="solution" data-id="${d.id}">${esc(d.solution)}</textarea>
        </div>
        ${d.explain ? `<div class="topic-sub">题目解析</div><div class="explain-box">${esc(d.explain)}</div>` : ''}
        <div class="small muted" style="margin-top:8px">阶段：${esc((stageOf(d.stage) || {}).title || d.stage)}</div>
      ` : ''}
    </div>`;
  }

  function publishDraft(id) {
    const d = Store.state.drafts.find(x => x.id === id);
    if (!d) return;
    if (!d.solution.trim()) { toast('请先填写参考答案'); Store.updateDraft(id, { _open: true }); renderCrawler(); return; }
    if (!Engine.isReady()) { toast('引擎还没就绪，稍后再试'); return; }
    if (/TODO/.test(d.schema)) { toast('表结构里还有 TODO，请先补齐字段'); Store.updateDraft(id, { _open: true }); renderCrawler(); return; }
    if (!/insert\s+into/i.test(d.data || '')) { toast('样例数据里还没有 INSERT 语句'); Store.updateDraft(id, { _open: true }); renderCrawler(); return; }
    let check;
    try {
      check = Engine.query([d.schema, d.data].join('\n'), d.solution);
    } catch (e) {
      toast('参考答案执行失败：' + e.message); return;
    }
    if (!check.columns.length) { toast('参考答案没有返回结果集，无法判题'); return; }
    const pid = 'custom-' + id.replace(/^draft-/, '');
    Store.addCustom({
      id: pid, stage: d.stage || 's1', level: d.level || '中等',
      tags: (d.tags || []).concat(['面经']).slice(0, 6),
      title: d.title.replace(/^【面经】/, ''),
      desc: d.desc, schema: d.schema, data: d.data,
      starter: d.starter || 'SELECT\nFROM',
      solution: d.solution,
      hint: (d.topic && d.topic.outline) || '',
      explain: (d.explain || '') +
        (d.topic ? `\n\n【考点】${d.topic.name}` : '') +
        `\n\n来源：${d.source || '面经采集'}`
    });
    Store.removeDraft(id);
    refreshBadges();
    toast('已入库，去题库里做这道题吧');
    renderCrawler();
  }

  const DEMO_TEXT = `1. 求8月12号发稿量top100的商家ID和发稿量

2. 求不同类目的商家最近七日的日均发稿量，输出类目、日均发稿量字段（以8-12为基准最近7天）

3. 8月12号每个类目下成交GMV top10的商家ID`;

  /* ================= 视图：错题本 ================= */
  let mistakeTab = 'mistakes';
  function renderMistakes() {
    const list = allProblems();
    const ids = mistakeTab === 'mistakes' ? Store.state.mistakes : Store.state.starred;
    const rows = ids.map(byId).filter(Boolean);
    view.innerHTML = `
      <div class="tabs">
        <button data-tab="mistakes" class="${mistakeTab === 'mistakes' ? 'on' : ''}">错题 ${Store.state.mistakes.length}</button>
        <button data-tab="starred" class="${mistakeTab === 'starred' ? 'on' : ''}">收藏 ${Store.state.starred.length}</button>
      </div>
      <div class="card" style="overflow:hidden">
        <table class="tbl">
          <thead><tr><th class="num">编号</th><th>题目</th><th>难度</th><th>尝试次数</th><th style="width:80px">状态</th></tr></thead>
          <tbody>
          ${rows.map(p => `<tr data-goproblem="${p.id}">
            <td class="num">${p.id}</td>
            <td>${esc(p.title)}</td>
            <td><span class="lv ${p.level}">${p.level}</span></td>
            <td class="small muted">${Store.attempts(p.id)}</td>
            <td>${Store.isPassed(p.id) ? '<span class="dot pass"></span> 已通过' : '<span class="dot fail"></span> 未通过'}</td>
          </tr>`).join('') || '<tr><td colspan="5"><div class="empty">' + (mistakeTab === 'mistakes' ? '还没有错题，去做几道题吧' : '还没有收藏的题目') + '</div></td></tr>'}
          </tbody>
        </table>
      </div>`;
    view.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { mistakeTab = b.dataset.tab; renderMistakes(); });
  }

  /* ================= 视图：统计 ================= */
  function renderStats() {
    const list = allProblems();
    const done = list.filter(p => Store.isPassed(p.id)).length;
    const attempts = list.reduce((a, p) => a + Store.attempts(p.id), 0);
    const acc = attempts ? Math.round(done / attempts * 100) : 0;

    const byLevel = ['简单', '中等', '困难'].map(lv => {
      const ps = list.filter(p => p.level === lv);
      return { name: lv, done: ps.filter(p => Store.isPassed(p.id)).length, total: ps.length };
    });
    const byStage = ROADMAP.map(st => {
      const ps = list.filter(p => p.stage === st.id);
      return { name: st.no + ' ' + st.title, done: ps.filter(p => Store.isPassed(p.id)).length, total: ps.length };
    });

    // 热力图：最近 13 周
    const log = Store.state.log || {};
    const cells = [];
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const start = new Date(now); start.setDate(start.getDate() - (now.getDay() + 6) % 7 - 84);
    for (let w = 0; w < 13; w++) {
      for (let d = 0; d < 7; d++) {
        const dt = new Date(start); dt.setDate(start.getDate() + w * 7 + d);
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        const n = log[key] || 0;
        cells.push(`<i class="${n === 0 ? '' : n < 3 ? 'l1' : n < 6 ? 'l2' : 'l3'}" title="${key}: ${n} 次提交"></i>`);
      }
    }

    view.innerHTML = `
      <div class="stat-grid">
        <div class="card stat"><div class="stat-v">${done}</div><div class="stat-l">已通过</div></div>
        <div class="card stat"><div class="stat-v">${list.length - done}</div><div class="stat-l">待攻克</div></div>
        <div class="card stat"><div class="stat-v">${attempts}</div><div class="stat-l">累计提交</div></div>
        <div class="card stat"><div class="stat-v">${acc}%</div><div class="stat-l">一次通过率</div></div>
        <div class="card stat"><div class="stat-v">${Store.state.drafts.length}</div><div class="stat-l">面经草稿</div></div>
      </div>

      <div class="card pane" style="margin-bottom:16px">
        <h3 style="margin:0 0 12px;font-size:14px">各阶段进度</h3>
        <div class="bars">
          ${byStage.map(b => `<div class="bar-row">
            <span class="bar-name">${esc(b.name)}</span>
            <span class="bar-track"><i class="bar-fill" style="width:${b.total ? b.done / b.total * 100 : 0}%"></i></span>
            <span class="bar-val">${b.done}/${b.total}</span>
          </div>`).join('')}
        </div>
      </div>

      <div class="card pane" style="margin-bottom:16px">
        <h3 style="margin:0 0 12px;font-size:14px">难度分布</h3>
        <div class="bars">
          ${byLevel.map(b => `<div class="bar-row">
            <span class="bar-name">${b.name}</span>
            <span class="bar-track"><i class="bar-fill" style="width:${b.total ? b.done / b.total * 100 : 0}%"></i></span>
            <span class="bar-val">${b.done}/${b.total}</span>
          </div>`).join('')}
        </div>
      </div>

      <div class="card pane">
        <h3 style="margin:0 0 12px;font-size:14px">提交热力图（最近 13 周）</h3>
        <div class="heat" style="grid-template-columns:repeat(13,14px);grid-auto-flow:column">${cells.join('')}</div>
      </div>`;
  }

  /* ================= 视图：设置 ================= */
  function renderSettings() {
    view.innerHTML = `
      <div class="grid2">
        <div class="card pane">
          <h3 style="margin:0 0 8px;font-size:14px">数据管理</h3>
          <div class="small muted" style="margin-bottom:12px">所有进度都保存在浏览器 localStorage，不会上传。换设备前先导出。</div>
          <div class="row wrap">
            <button class="btn" id="btn-export">导出进度 JSON</button>
            <button class="btn" id="btn-import">导入进度</button>
            <button class="btn" id="btn-reset" style="color:var(--red)">清空所有进度</button>
          </div>
          <textarea id="io" class="paste" style="min-height:140px;margin-top:12px" placeholder="导出的内容会出现在这里；也可以把内容粘贴进来后点「导入进度」"></textarea>
        </div>
        <div class="card pane">
          <h3 style="margin:0 0 8px;font-size:14px">关于</h3>
          <div class="p-body small">
            · 判题引擎：SQLite 3.x 编译成 WebAssembly，在浏览器里真实执行你的 SQL，不是字符串匹配。<br>
            · 判定方式：同时跑你的 SQL 和标准答案，比对结果集（行多重集），列名不一致会提示但按宽松判定通过。<br>
            · 题库：内置 ${PROBLEMS.length} 道，覆盖基础查询到留存/漏斗/连续区间。<br>
            · 面经采集：规则抽取已可用，正式抓取用 <code>scripts/crawl-mianjing.mjs</code>。<br>
            · 本地运行：<code>python3 -m http.server 8000</code> 后访问 http://localhost:8000 ，直接双击 index.html 会因浏览器限制加载不了 wasm。
          </div>
        </div>
      </div>`;
    $('#btn-export').onclick = () => { $('#io').value = Store.exportJson(); toast('已导出'); };
    $('#btn-import').onclick = () => {
      try { Store.importJson($('#io').value); refreshBadges(); toast('导入成功'); }
      catch (e) { toast('导入失败：' + e.message); }
    };
    $('#btn-reset').onclick = () => {
      if (confirm('确定清空所有刷题进度、收藏和草稿？此操作不可恢复。')) { Store.reset(); refreshBadges(); toast('已清空'); }
    };
  }

  /* ================= 视图：通用阅读页（AI 原理 / 建模知识） ================= */
  function renderReader(D, opts) {
    opts = opts || {};
    const meta = D.meta;
    const secs = opts.sections || D.sections;
    const title = opts.title || meta.title;
    const sub = opts.sub || meta.sub;
    const intro = opts.intro || meta.intro;
    const framing = opts.framing || meta.framing;
    const tocTitle = opts.tocTitle || '本节目录';
    const kicker = opts.kicker || '';
    const blockHtml = b => {
      if (b.t === 'p') return `<p class="prose">${esc(b.x)}</p>`;
      if (b.t === 'h') return `<div class="prose-h">${esc(b.x)}</div>`;
      if (b.t === 'quote') return `<blockquote class="bq">${esc(b.x)}</blockquote>`;
      if (b.t === 'list') return `<ul class="prose-list">${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
      if (b.t === 'dim') return `<div class="dim"><span class="dim-k dim--${b.c || 'why'}">${esc(b.k)}</span><div class="dim-b">${esc(b.x)}</div></div>`;
      if (b.t === 'code') return `<div class="codewrap"><div class="codebar"><span class="code-lang">${esc(b.lang || '')}</span><button class="copybtn" data-copy>复制</button></div><pre class="code"><code>${esc(b.x)}</code></pre></div>`;
      if (b.t === 'callout') {
        const title = b.title ? `<div class="co-title">${esc(b.title)}</div>` : '';
        const body = b.x ? `<div class="co-body">${esc(b.x)}</div>` : '';
        return `<div class="callout ${b.tone || 'info'}">${title}${body}</div>`;
      }
      return '';
    };
    let toc;
    if (opts.tocItems) {
      toc = opts.tocItems.map(s =>
        `<li><a href="#/${meta.route}" data-anchor="${s.id}"><span class="toc-no">${s.no}</span>${esc(s.title)}</a></li>`).join('');
    } else {
      toc = secs.map(s =>
        `<li><a href="#/${meta.route}" data-anchor="${s.id}"><span class="toc-no">${s.no}</span>${esc(s.title)}</a></li>`).join('');
    }
    const tocAside = opts.noToc ? '' :
      `<aside class="toc">
          <div class="toc-title">${esc(tocTitle)}</div>
          <ul>${toc}</ul>
        </aside>`;
    const heroHtml = opts.noHero ? '' :
      `<div class="card reader-hero">
        <div class="rh-title">${esc(title)}</div>
        <div class="rh-sub">${esc(sub)}</div>
        <p class="prose">${esc(intro)}</p>
        <div class="callout info"><div class="co-body">${esc(framing)}</div></div>
      </div>`;
    const h =
      `${opts.back || ''}
      ${opts.crumb || ''}
      ${heroHtml}
      ${kicker}
      <div class="reader-layout${opts.noToc ? ' solo' : ''}">
        ${tocAside}
        <div class="reader">
          ${secs.map(s => `
            <section class="sec" id="sec-${s.id}">
              <div class="sec-head">
                <span class="sec-no">${s.no}</span>
                <div>
                  <div class="sec-title">${esc(s.title)}</div>
                  <div class="sec-lead">${esc(s.lead)}</div>
                </div>
              </div>
              <div class="sec-body">${s.blocks.map(blockHtml).join('')}</div>
            </section>`).join('')}
          <div class="reader-end">— 本页完 —</div>
        </div>
      </div>`;
    view.innerHTML = h;

    view.querySelectorAll('[data-anchor]').forEach(a => a.onclick = e => {
      e.preventDefault();
      const el = document.getElementById('sec-' + a.dataset.anchor);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    view.querySelectorAll('[data-copy]').forEach(btn => btn.onclick = () => {
      const code = btn.closest('.codewrap').querySelector('code');
      navigator.clipboard.writeText(code.textContent).then(() => {
        const t = btn.textContent; btn.textContent = '已复制'; setTimeout(() => btn.textContent = t, 1200);
      });
    });
  }
  function buildAiNav(activeSec) {
    const A = AIBASICS;
    const el = $('#nav-ai');
    if (!el) return;
    el.innerHTML = A.sections.map(s =>
      `<a class="nav-item sub ${s.id === activeSec ? 'active' : ''}" href="#/aibasics/${s.id}">
         <span class="nav-no">${s.no}</span><span>${esc(s.title)}</span>
       </a>`).join('');
  }
  function renderAiSection(sid) {
    const A = AIBASICS;
    const secs = A.sections;
    const sec = secs.find(s => s.id === sid) || secs[0];
    const idx = secs.indexOf(sec);
    const prev = secs[idx - 1], next = secs[idx + 1];
    buildAiNav(sec.id);
    $('#page-title').textContent = A.meta.title;
    $('#page-sub').textContent = `第 ${sec.no} 节 / 共 ${secs.length} 节`;
    const navBtn = (s, dir) => s
      ? `<a class="secnav-btn" href="#/aibasics/${s.id}"><span class="secnav-dir">${dir === 'prev' ? '← 上一节' : '下一节 →'}</span><span class="secnav-t">${esc(s.title)}</span></a>`
      : `<span class="secnav-btn disabled">${dir === 'prev' ? '← 已是第一节' : '已是最后一节 →'}</span>`;
    const crumb = `<div class="crumb"><a href="#/aibasics">${esc(A.meta.title)}</a><span class="crumb-sep">/</span><span>${sec.no}. ${esc(sec.title)}</span></div>`;
    const secnav = `<div class="secnav">${navBtn(prev, 'prev')}${navBtn(next, 'next')}</div>`;
    renderReader(A, { sections: [sec], noToc: true, noHero: true, crumb, framing: A.meta.framing });
    const lib = view.querySelector('.reader');
    if (lib) {
      lib.insertAdjacentHTML('afterbegin',
        `<div class="sec-intro"><span class="sec-intro-tag">${esc(A.meta.title)}</span>${esc(A.meta.sub)}</div>`);
      const end = lib.querySelector('.reader-end');
      if (end) end.insertAdjacentHTML('beforebegin', secnav);
      else lib.insertAdjacentHTML('beforeend', secnav);
    }
  }
  function renderAIBasics() { renderAiSection(AIBASICS.sections[0].id); }
  /* 建模知识：左侧菜单栏（8 分组 + 全部小节，一二级全展开），点某一节 → 只显示该节 */
  function buildModelNav(activeGroup, activeSec) {
    const M = MODELING;
    const el = $('#nav-model');
    if (!el) return;
    el.innerHTML = M.meta.groups.map(g => {
      const onG = g.id === activeGroup;
      const secs = M.sections.filter(s => s.group === g.id);
      const sub = secs.map(s =>
        `<a class="nav-item sub ${s.id === activeSec ? 'active' : ''}" href="#/modeling/${g.id}/${s.id}">
           <span class="nav-no">${s.no}</span><span>${esc(s.title)}</span>
         </a>`).join('');
      return `<div class="nav-grp ${onG ? 'open' : ''}">
          <a class="nav-item grp ${onG ? 'active' : ''}" href="#/modeling/${g.id}">
            <span class="nav-ico">${esc(g.ico)}</span><span>${esc(g.title)}</span>
          </a>${sub}
        </div>`;
    }).join('');
  }
  function renderModeling() {
    const g0 = MODELING.meta.groups[0];
    const s0 = MODELING.sections.find(s => s.group === g0.id);
    renderModelSection(g0.id, s0.id);
  }
  function renderModelSection(gid, sid) {
    const M = MODELING;
    const g = M.meta.groups.find(x => x.id === gid) || M.meta.groups[0];
    const groupSecs = M.sections.filter(s => s.group === g.id);
    const sec = groupSecs.find(s => s.id === sid) || groupSecs[0];
    const idx = groupSecs.indexOf(sec);
    const prev = groupSecs[idx - 1], next = groupSecs[idx + 1];
    buildModelNav(g.id, sec.id);
    $('#page-title').textContent = g.title;
    $('#page-sub').textContent = `第 ${sec.no} 节 / 共 ${M.sections.length} 节`;
    const navBtn = (s, dir) => s
      ? `<a class="secnav-btn" href="#/modeling/${g.id}/${s.id}"><span class="secnav-dir">${dir === 'prev' ? '← 上一节' : '下一节 →'}</span><span class="secnav-t">${esc(s.title)}</span></a>`
      : `<span class="secnav-btn disabled">${dir === 'prev' ? '← 已是本节第一篇' : '已是本节最后一篇 →'}</span>`;
    const crumb =
      `<div class="crumb"><a href="#/modeling/${g.id}">${esc(g.title)}</a><span class="crumb-sep">/</span><span>${sec.no}. ${esc(sec.title)}</span></div>`;
    const secnav = `<div class="secnav">${navBtn(prev, 'prev')}${navBtn(next, 'next')}</div>`;
    renderReader(M, {
      sections: [sec], noToc: true, noHero: true, crumb,
      framing: M.meta.framing
    });
    // 追加组简介 + 上下节导航
    const lib = view.querySelector('.reader');
    if (lib) {
      lib.insertAdjacentHTML('afterbegin',
        `<div class="sec-intro"><span class="sec-intro-tag">${esc(g.title)}</span>${esc(g.desc)}</div>`);
      const end = lib.querySelector('.reader-end');
      if (end) end.insertAdjacentHTML('beforebegin', secnav);
      else lib.insertAdjacentHTML('beforeend', secnav);
    }
  }
  function renderBiz() {
    $('#page-title').textContent = '业务问题';
    $('#page-sub').textContent = '后续补充';
    view.innerHTML =
      `<div class="card">
        <div class="biz-ph">
          <div class="biz-ph-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="3.5" width="14" height="17" rx="2.2"/>
              <path d="M8.5 3.5h7v2h-7z"/>
              <path d="M8.5 10h7M8.5 13.5h7M8.5 17h4.5"/>
            </svg>
          </div>
          <h2>业务问题</h2>
          <p>这里后续会沉淀「真实业务问题的建模拆解」——把某个具体业务难题，按 OSM → 指标 → 模型 → 验证的完整链路讲透。目前是占位页，敬请期待。</p>
          <div class="biz-todo">
            <div style="font-weight:700;margin-bottom:8px">计划补充的方向（欢迎提需求）：</div>
            <ul>
              <li>某电商「大促 GMV 预测」从目标拆解到 Prophet 建模落地</li>
              <li>内容社区「用户流失预警」RFM + 随机森林实战</li>
              <li>支付风控「反欺诈」特征工程与 LightGBM 调参复盘</li>
              <li>推荐系统「召回→排序→重排」全链路案例</li>
              <li>用前面八组知识，串起一个端到端项目</li>
            </ul>
          </div>
        </div>
      </div>`;
  }

  /* ================= 路由 ================= */
  function refreshBadges() {
    const list = allProblems();
    const done = list.filter(p => Store.isPassed(p.id)).length;
    setBadge('badge-problems', list.length);
    setBadge('badge-drafts', Store.state.drafts.length);
    setBadge('badge-mistakes', Store.state.mistakes.length);
    $('#side-progress').style.width = (list.length ? done / list.length * 100 : 0) + '%';
    $('#side-progress-txt').textContent = `${done} / ${list.length} 已通过`;
  }
  function setBadge(id, n) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = n;
    el.classList.toggle('show', n > 0);
  }

  const TITLES = {
    roadmap: ['学习路线', '7 个阶段，由易到难'],
    problems: ['题库', ''],
    crawler: ['面经采集', '一句话面经 → 考点解读 + 自动出题'],
    aibasics: ['AI 原理', 'LLM 与 Agent 核心原理'],
    modeling: ['建模知识', '数据分析与业务建模核心方法'],
    biz: ['业务问题', '真实业务问题拆解（后续补充）'],
    mistakes: ['错题本', ''],
    stats: ['统计', ''],
    settings: ['设置', '']
  };

  function router() {
    const hash = location.hash.replace(/^#\/?/, '');
    const [route, arg, arg2] = hash.split('/');
    document.querySelectorAll('.nav-item[data-route]').forEach(a => a.classList.toggle('active', a.dataset.route === route));

    // 顶层分区：sql / ai / model / biz（用于顶部导航高亮 + 左栏显隐）
    const section = route === 'aibasics' ? 'ai' : route === 'modeling' ? 'model' : route === 'biz' ? 'biz' : 'sql';
    document.querySelectorAll('.tn-item').forEach(a => a.classList.toggle('active', a.dataset.section === section));
    const app = document.querySelector('.app');
    // 左侧边栏：SQL 与建模知识都有左栏（内容不同）；AI / 业务问题用整页阅读布局
    app.classList.toggle('no-sidebar', section === 'biz');
    app.classList.toggle('model-mode', section === 'model');
    app.classList.toggle('ai-mode', section === 'ai');
    const sb = document.querySelector('.search');
    if (sb) sb.style.display = section === 'sql' ? '' : 'none';

    if (route === 'p' && arg) {
      $('#page-title').textContent = '做题';
      $('#page-sub').textContent = arg;
      showSolution = false;
      renderProblem(arg);
      return;
    }
    // 建模知识：左栏一二级菜单点哪一节，右侧只渲染那一节（无总览页）
    if (route === 'modeling') { renderModelSection(arg || MODELING.meta.groups[0].id, arg2); refreshBadges(); return; }
    if (route === 'aibasics') { renderAiSection(arg || AIBASICS.sections[0].id); refreshBadges(); return; }
    if (route === 'biz') { renderBiz(); refreshBadges(); return; }
    const t = TITLES[route] || TITLES.roadmap;
    $('#page-title').textContent = t[0];
    $('#page-sub').textContent = t[1] || '';
    ({ roadmap: renderRoadmap, problems: renderProblems, crawler: renderCrawler, modeling: renderModeling, mistakes: renderMistakes, stats: renderStats, settings: renderSettings }[route] || renderRoadmap)();
    refreshBadges();
  }

  /* ================= 事件 ================= */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-goproblem]');
    if (el && el.dataset.goproblem) {
      const pid = el.dataset.goproblem;
      if (!byId(pid)) return;
      location.hash = '#/p/' + pid;
    }
    const go = e.target.closest('[data-go]');
    if (go) location.hash = '#/' + go.dataset.go;
  });

  $('#global-search').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      filter.q = e.target.value.trim();
      location.hash = '#/problems';
      if (location.hash === '#/problems') renderProblems();
    }
  });

  window.addEventListener('hashchange', router);

  /* ================= 启动 ================= */
  Engine.init().then(() => {
    $('#engine-state').textContent = 'SQLite 引擎已就绪';
  }).catch(err => {
    $('#engine-state').innerHTML = '<span style="color:var(--red)">' + esc(err.message) + '</span>';
  });

  if (!location.hash) location.hash = '#/roadmap';
  router();
  refreshBadges();
})();
