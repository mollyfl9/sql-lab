/* 考点知识库 + 出题引擎
   面经里的一句话（如「求8月12号发稿量top100的商家ID和发稿量」）= 一个考点描述。
   这里做两件事：
     1) 识别这句话在考什么（可命中多个考点，打分取主）
     2) 给出考点解读（面试官视角 / 常见坑 / 解题思路），并**针对该考点生成一道完整可判题的题**
   题目自带 schema + data + solution，可直接跑 SQL 判题，不依赖联网。
   后续换成 LLM 出题时，保持 make(ctx) 的返回结构一致即可。
*/
const Topics = (() => {

  /* ---------------- 领域数据（确定性生成，保证生成题一定能判） ---------------- */
  const pad = n => String(n).padStart(2, '0');
  const CAT = { 1: '服饰', 2: '服饰', 3: '美妆', 4: '美妆', 5: '数码', 6: '数码' };

  // 8/06~8/12 每个商家每天的发稿条数（索引 0 = 8/06）
  const PUB_PLAN = {
    1: [1, 2, 1, 2, 1, 2, 3],
    2: [1, 1, 0, 1, 1, 1, 2],
    3: [2, 3, 2, 3, 2, 3, 4],
    4: [1, 1, 2, 1, 1, 2, 2],
    5: [3, 2, 3, 2, 3, 2, 1],
    6: [0, 1, 1, 0, 1, 1, 1]
  };
  function genPublish() {
    const rows = [];
    let id = 1;
    for (const sid of ['1', '2', '3', '4', '5', '6']) {
      PUB_PLAN[sid].forEach((n, di) => {
        const day = '2024-08-' + pad(6 + di);
        for (let k = 0; k < n; k++) rows.push(`(${id++}, ${sid}, '${CAT[sid]}', '${day}')`);
      });
    }
    // 区间外（8/01~8/05）留几条，让「最近 7 天」的过滤真正起作用
    ['01', '02', '03', '04', '05'].forEach(dd => rows.push(`(${id++}, 1, '服饰', '2024-08-${dd}')`));
    return 'INSERT INTO publish_log (log_id, seller_id, category, publish_date) VALUES\n' + rows.join(',\n') + ';';
  }

  const ORDER_ROWS = [
    // seller, category, date, gmv  （8/12 当天，每个商家多笔）
    [1, '服饰', '2024-08-12', 100], [1, '服饰', '2024-08-12', 200], [2, '服饰', '2024-08-12', 150],
    [3, '美妆', '2024-08-12', 400], [3, '美妆', '2024-08-12', 100], [3, '美妆', '2024-08-12', 100], [4, '美妆', '2024-08-12', 80],
    [5, '数码', '2024-08-12', 500], [5, '数码', '2024-08-12', 500], [6, '数码', '2024-08-12', 60],
    // 8/11 一些，供区间/环比类题目使用
    [1, '服饰', '2024-08-11', 120], [3, '美妆', '2024-08-11', 300], [5, '数码', '2024-08-11', 450], [2, '服饰', '2024-08-11', 90]
  ];
  function genOrders() {
    let id = 1;
    return 'INSERT INTO orders (order_id, seller_id, category, order_date, gmv) VALUES\n' +
      ORDER_ROWS.map(r => `(${id++}, ${r[0]}, '${r[1]}', '${r[2]}', ${r[3]})`).join(',\n') + ';';
  }

  const LOGIN_ROWS = [
    [101, '2024-08-01'], [101, '2024-08-02'], [101, '2024-08-03'], [101, '2024-08-04'], [101, '2024-08-05'],
    [102, '2024-08-01'], [102, '2024-08-03'], [102, '2024-08-04'], [102, '2024-08-05'], [102, '2024-08-06'], [102, '2024-08-07'],
    [103, '2024-08-02'], [103, '2024-08-03'],
    [104, '2024-08-03'], [104, '2024-08-05'],
    [105, '2024-08-04'],
    [106, '2024-08-05'], [106, '2024-08-06'], [106, '2024-08-07'], [106, '2024-08-08']
  ];
  function genLogin() {
    let id = 1;
    return 'INSERT INTO login (login_id, user_id, login_date) VALUES\n' +
      LOGIN_ROWS.map(r => `(${id++}, ${r[0]}, '${r[1]}')`).join(',\n') + ';';
  }

  const PARTS = {
    seller: {
      schema: 'CREATE TABLE seller (\n  seller_id   INTEGER,\n  seller_name TEXT,\n  category    TEXT\n);',
      data: "INSERT INTO seller (seller_id, seller_name, category) VALUES\n(1,'小A旗舰店','服饰'),(2,'小B优选','服饰'),(3,'小C美妆','美妆'),(4,'小D彩妆','美妆'),(5,'小E数码','数码'),(6,'小F配件','数码');"
    },
    publish: {
      schema: 'CREATE TABLE publish_log (\n  log_id       INTEGER,\n  seller_id    INTEGER,\n  category     TEXT,\n  publish_date TEXT\n);',
      data: genPublish()
    },
    orders: {
      schema: 'CREATE TABLE orders (\n  order_id   INTEGER,\n  seller_id  INTEGER,\n  category   TEXT,\n  order_date TEXT,\n  gmv        REAL\n);',
      data: genOrders()
    },
    user: {
      schema: 'CREATE TABLE user (\n  user_id  INTEGER,\n  reg_date TEXT\n);',
      data: "INSERT INTO user (user_id, reg_date) VALUES\n(101,'2024-08-01'),(102,'2024-08-01'),(103,'2024-08-02'),(104,'2024-08-03'),(105,'2024-08-04'),(106,'2024-08-05');"
    },
    login: {
      schema: 'CREATE TABLE login (\n  login_id   INTEGER,\n  user_id    INTEGER,\n  login_date TEXT\n);',
      data: genLogin()
    }
  };
  const schemaOf = keys => keys.map(k => PARTS[k].schema).join('\n');
  const dataOf = keys => keys.map(k => PARTS[k].data).join('\n');

  /* ---------------- 从面经文本里抽取业务实体与参数 ---------------- */
  const LEX = [
    { key: 'publish', re: /(发稿|发文|投稿|发布|笔记|内容)/ },
    { key: 'gmv', re: /(gmv|成交|销售额|交易额|营收|订单额)/i },
    { key: 'order', re: /(订单|下单|购买)/ },
    { key: 'seller', re: /(商家|卖家|商户|店铺|作者|kol|达人)/i },
    { key: 'category', re: /(类目|品类|分类|类别|行业)/ },
    { key: 'user', re: /(用户|会员|粉丝)/ },
    { key: 'login', re: /(登录|活跃|签到|留存)/ }
  ];
  function detectEntities(text) {
    const set = new Set();
    for (const l of LEX) if (l.re.test(text)) set.add(l.key);
    return set;
  }
  const CN_NUM = { 一: 1, 两: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  function toNum(s) { return CN_NUM[s] != null ? CN_NUM[s] : parseInt(s, 10); }

  function parseBaseDate(text) {
    // 8月12号 / 8月12日 / 8-12 / 8/12
    let m = text.match(/(\d{1,2})\s*[月\-\/]\s*(\d{1,2})\s*(?:号|日)?/);
    if (m) {
      const mo = +m[1], d = +m[2];
      if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return `2024-${pad(mo)}-${pad(d)}`;
    }
    return '2024-08-12';
  }
  function parseDays(text) {
    let m = text.match(/(?:最近|近|过去)\s*([0-9一二两三四五六七八九十]+)\s*天/) ||
            text.match(/([0-9一二两三四五六七八九十]+)\s*日/);
    if (m) { const n = toNum(m[1]); if (n >= 2 && n <= 90) return n; }
    return 7;
  }
  function parseTopN(text) {
    let m = text.match(/top\s*(\d+)/i) || text.match(/前\s*([0-9一二两三四五六七八九十]+)/) ||
            text.match(/([0-9一二两三四五六七八九十]+)\s*(?:名|个|位)/);
    if (m) { const n = toNum(m[1]); if (n >= 1 && n <= 1000) return n; }
    return 10;
  }
  function buildCtx(text) {
    const ent = detectEntities(text);
    return {
      raw: text,
      base: parseBaseDate(text),
      days: parseDays(text),
      topN: parseTopN(text),
      ent,
      hasPublish: ent.has('publish'),
      hasGmv: ent.has('gmv') || ent.has('order'),
      hasUser: ent.has('user') || ent.has('login')
    };
  }
  // 指标口径：面经提到 GMV / 成交 -> 用成交表；否则默认用发稿表
  function metric(ctx) {
    if (ctx.hasGmv && !ctx.hasPublish) {
      return { part: 'orders', table: 'orders', dateCol: 'order_date', expr: 'SUM(gmv)', alias: 'gmv', unit: '成交额(GMV)', row: 'order_date, gmv' };
    }
    return { part: 'publish', table: 'publish_log', dateCol: 'publish_date', expr: 'COUNT(*)', alias: 'publish_cnt', unit: '发稿量', row: '' };
  }
  function dayOffset(base, days) {
    const d = new Date(base + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }

  /* ---------------- 考点库 ---------------- */
  // 每个考点：name 名称 / stage 路线图阶段 / level 难度 / kw 识别关键词(带权重)
  //          explain 考点解读 / pitfalls 常见坑 / outline 解题思路 / make(ctx) 出题
  const K = (re, w) => ({ re, w: w || 1 });

  const TOPICS = [
    {
      id: 'topn-global', name: '全局 TopN 排行', stage: 's1', level: '简单',
      kw: [K(/top\s*\d+/i, 4), K(/前\s*[0-9一二两三四五六七八九十]+/, 3), K(/(排行|排名|最高|最多|最大的?几)/, 2), K(/top\s*100/i, 1)],
      explain: '考「排序 + 截断」的基本功：先用 WHERE 把范围收窄（某天/某区间），再 GROUP BY 聚合出每个主体的量，最后 ORDER BY 降序 + LIMIT 取前 N。面试官重点看你是否先过滤再聚合（而不是全表聚合再筛），以及能不能说出 LIMIT 对并列名次的处理。',
      pitfalls: ['顺序必须是 WHERE → GROUP BY → ORDER BY → LIMIT，聚合后再过滤要用 HAVING', 'COUNT(*) 与 COUNT(字段) 对 NULL 的处理不同', '并列名次时 LIMIT 会硬切，可能把同分的一起砍掉，需要并列保留就用窗口函数 DENSE_RANK'],
      outline: '① WHERE 限定日期 ② GROUP BY 主体、COUNT/SUM 出量 ③ ORDER BY 量 DESC ④ LIMIT N',
      make(ctx) {
        const m = metric(ctx);
        return {
          title: `${ctx.base} ${m.unit} Top${ctx.topN} 的商家`,
          desc: `给定${m.part === 'orders' ? '成交明细表 orders（order_id, seller_id, category, order_date, gmv）' : '发稿日志表 publish_log（log_id, seller_id, category, publish_date）'}，求 ${ctx.base} 当天${m.unit} Top ${ctx.topN} 的商家 ID 和${m.unit}。`,
          level: '简单', stage: 's1', tags: ['TopN', '排序分页'],
          schema: schemaOf([m.part]), data: dataOf([m.part]),
          starter: `SELECT seller_id, ...\nFROM ${m.table}\nWHERE ...\nGROUP BY seller_id\nORDER BY ... DESC\nLIMIT ${ctx.topN};`,
          solution: `SELECT seller_id, ${m.expr} AS ${m.alias}\nFROM ${m.table}\nWHERE ${m.dateCol} = '${ctx.base}'\nGROUP BY seller_id\nORDER BY ${m.alias} DESC\nLIMIT ${ctx.topN};`,
          explain: `先用 WHERE 把数据圈在某一天，再按 seller_id 聚合出${m.unit}，最后排序取前 ${ctx.topN}。注意这里 LIMIT 是「按量大到小硬截断」，若存在并列第 ${ctx.topN} 名会被随机砍掉——面试官常追问怎么保留并列（答：ROW_NUMBER/DENSE_RANK 后过滤 rn <= N）。`
        };
      }
    },
    {
      id: 'topn-per-group', name: '分组内 TopN（窗口函数）', stage: 's5', level: '中等',
      kw: [K(/(每个|各|按|各个)[^\n，。；]{0,12}(类目|品类|分类|类别|部门|地区|店铺|商家)[^\n，。；]{0,12}(top|前|最高|最多)/i, 6), K(/partition\s+by/i, 5), K(/组内|分组内/, 4), K(/每个[^\n]{0,8}下[^\n]{0,8}top/i, 4)],
      explain: '这是「组内排名」的经典考点：要的不是全表 TopN，而是每个分组各自的前 N。GROUP BY + LIMIT 做不到（LIMIT 是全局的），必须用窗口函数。面试官想让你说出 PARTITION BY 分区 + ORDER BY 排序 + ROW_NUMBER/RANK 编号 + 外层过滤 rn <= N 这套组合拳，以及 ROW_NUMBER 与 RANK/DENSE_RANK 在并列时的差异。',
      pitfalls: ['GROUP BY + LIMIT 只能取全局前 N，取不到「每组前 N」', '窗口函数不能直接写在 WHERE 里，必须套一层子查询/CTE 后再过滤 rn', '并列名次：ROW_NUMBER 会强行编号，RANK 会跳号，DENSE_RANK 不跳号，按业务选'],
      outline: '① 先按「分组 + 主体」聚合出指标 ② ROW_NUMBER() OVER (PARTITION BY 分组 ORDER BY 指标 DESC) ③ 外层 WHERE rn <= N',
      make(ctx) {
        const m = metric(ctx);
        return {
          title: `${ctx.base} 每个类目下 ${m.unit} Top${ctx.topN} 的商家`,
          desc: `给定${m.part === 'orders' ? '成交明细表 orders（order_id, seller_id, category, order_date, gmv）' : '发稿日志表 publish_log（log_id, seller_id, category, publish_date）'}，求 ${ctx.base} 当天、**每个类目**下${m.unit} Top ${ctx.topN} 的商家 ID（输出类目 + 商家 + 指标）。`,
          level: '中等', stage: 's5', tags: ['窗口函数', 'TopN', '分组内排名'],
          schema: schemaOf([m.part]), data: dataOf([m.part]),
          starter: `WITH base AS (\n  SELECT category, seller_id, ${m.expr} AS metric\n  FROM ${m.table}\n  WHERE ${m.dateCol} = '${ctx.base}'\n  GROUP BY category, seller_id\n)\nSELECT ...`,
          solution: `WITH base AS (\n  SELECT category, seller_id, ${m.expr} AS metric\n  FROM ${m.table}\n  WHERE ${m.dateCol} = '${ctx.base}'\n  GROUP BY category, seller_id\n), ranked AS (\n  SELECT category, seller_id, metric,\n         ROW_NUMBER() OVER (PARTITION BY category ORDER BY metric DESC) AS rn\n  FROM base\n)\nSELECT category, seller_id, metric AS ${m.alias}\nFROM ranked\nWHERE rn <= ${ctx.topN}\nORDER BY category, rn;`,
          explain: `先在 CTE 里按「类目 + 商家」聚合，再用 ROW_NUMBER() OVER (PARTITION BY category ORDER BY metric DESC) 在类目内排名，最后外层 rn <= ${ctx.topN} 取每组前 N。关键点：窗口函数不能写在 WHERE 里；如果并列第 ${ctx.topN} 名需要都保留，把 ROW_NUMBER 换成 RANK() 或 DENSE_RANK()。`
        };
      }
    },
    {
      id: 'daily-avg-by-group', name: '分组日均（时间窗 + 均值口径）', stage: 's6', level: '中等',
      kw: [K(/日均|平均每天|每日平均|平均每日|每天.*平均/, 6), K(/日均[^\n]{0,10}(发稿|成交|gmv|订单|活跃)/i, 3), K(/平均/, 1)],
      explain: '考两件事叠在一起：① 时间窗口的正确圈法（「最近 N 天」要含当天，用 BETWEEN 起止日或 date 函数递减）② 「日均」的口径澄清——分母是「天数」还是「活跃主体数」，直接决定答案对不对，面试官最爱在这里卡人。能主动反问口径，比闷头写对 SQL 更加分。',
      pitfalls: ['「最近 7 天」要含基准日：起 = 基准日 - 6 天，不能减 7', '日均 = 总量 / 天数（这里 7）还是 总量 / 活跃商家数，要确认', '整数除法：先 * 1.0 转浮点再除，否则 COUNT/7 会被截断', '分母为 0 的除零风险'],
      outline: '① WHERE 圈出 N 天窗口 ② GROUP BY 类目 ③ SUM/COUNT 出总量 ④ 除以天数得日均（ROUND 保留两位）',
      make(ctx) {
        const m = metric(ctx);
        const start = dayOffset(ctx.base, -(ctx.days - 1));
        return {
          title: `各类目最近 ${ctx.days} 天（截至 ${ctx.base}）的日均${m.unit}`,
          desc: `以 ${ctx.base} 为基准，给定发稿日志表 publish_log（log_id, seller_id, category, publish_date），求不同类目最近 ${ctx.days} 天（${start} ~ ${ctx.base}）的**日均${m.unit}**，输出类目、日均${m.unit}两个字段。（口径：总量 ÷ 天数 ${ctx.days}）`,
          level: '中等', stage: 's6', tags: ['时间区间', '分组聚合', '日均'],
          schema: schemaOf(['publish']), data: dataOf(['publish']),
          starter: `SELECT category,\n       ROUND(... * 1.0 / ${ctx.days}, 2) AS avg_daily\nFROM publish_log\nWHERE publish_date BETWEEN ... AND '${ctx.base}'\nGROUP BY category;`,
          solution: `SELECT category,\n       ROUND(COUNT(*) * 1.0 / ${ctx.days}, 2) AS avg_daily_publish\nFROM publish_log\nWHERE publish_date BETWEEN '${start}' AND '${ctx.base}'\nGROUP BY category\nORDER BY avg_daily_publish DESC;`,
          explain: `时间窗 ${start} ~ ${ctx.base} 正好 ${ctx.days} 天（含基准日）。COUNT(*) * 1.0 / ${ctx.days} 得到「每天平均发稿量」。这里的坑：如果口径是「平均每个活跃商家每天发稿量」，分母要换成 COUNT(DISTINCT seller_id) * ${ctx.days}；* 1.0 是为了避免整数除法截断。区间外的数据（如 8 月初那几条）不应被算进来。`
        };
      }
    },
    {
      id: 'group-agg', name: '分组聚合与 HAVING', stage: 's2', level: '简单',
      kw: [K(/group\s+by/i, 4), K(/having/i, 4), K(/(每个|各|按)[^\n]{0,10}(类目|商家|部门|统计)/, 2), K(/(统计|分组|汇总)/, 1)],
      explain: '考聚合与分组的基本功：COUNT/SUM/AVG/MAX/MIN 的语义，以及 WHERE（分组前过滤行）与 HAVING（分组后过滤组）的区别。COUNT(DISTINCT x) 去重计数是高频追问点。',
      pitfalls: ['SELECT 里的非聚合列必须出现在 GROUP BY 中', 'WHERE 不能写聚合函数，筛组用 HAVING', 'COUNT(*) 数行、COUNT(col) 跳 NULL、COUNT(DISTINCT col) 去重'],
      outline: '① GROUP BY 维度 ② 选聚合函数出指标 ③ HAVING 过滤不满足条件的分组',
      make(ctx) {
        return {
          title: '每个类目的发稿量与覆盖商家数',
          desc: '给定发稿日志表 publish_log（log_id, seller_id, category, publish_date），按类目统计发稿总量与有发稿的商家数，只保留发稿总量 ≥ 10 的类目，按发稿量降序。',
          level: '简单', stage: 's2', tags: ['GROUP BY', 'HAVING', 'COUNT DISTINCT'],
          schema: schemaOf(['publish']), data: dataOf(['publish']),
          starter: 'SELECT category, COUNT(*) AS ..., COUNT(DISTINCT seller_id) AS ...\nFROM publish_log\nGROUP BY category\nHAVING ...;',
          solution: `SELECT category,\n       COUNT(*) AS publish_cnt,\n       COUNT(DISTINCT seller_id) AS seller_cnt\nFROM publish_log\nGROUP BY category\nHAVING COUNT(*) >= 10\nORDER BY publish_cnt DESC;`,
          explain: 'COUNT(*) 数的是发稿记录条数，COUNT(DISTINCT seller_id) 数的是去重后的商家数——两者不能混用。HAVING 作用于聚合后的分组（这里筛掉发稿不足 10 条的类目），而 WHERE 只能过滤明细行。'
        };
      }
    },
    {
      id: 'time-range', name: '时间区间过滤与日期函数', stage: 's2', level: '简单',
      kw: [K(/(最近|近|过去)\s*[0-9一二两三四五六七八九十]+\s*天/, 5), K(/(区间|范围|某天|当天|指定日期)/, 2), K(/(date|strftime|julianday)\s*\(/i, 2)],
      explain: '考日期处理：怎么用日期函数把「最近 N 天」「某月」「某日」翻译成可比较的区间。SQLite 里日期以文本存储，靠 date(‘2024-08-12’, ‘-6 day’) 做偏移；核心是边界要含头含尾、以及跨月/跨年时不能手写。',
      pitfalls: ['「最近 7 天含今天」起止是 [基准-6, 基准]，容易少算或算成 8 天', '文本日期直接比较依赖 YYYY-MM-DD 格式，补零不能省', '跨月跨年别手算，交给 date() 函数'],
      outline: '① 用 date(基准日, \'-N day\') 求起始日 ② BETWEEN 起止日 ③ 按日 GROUP BY 出逐日趋势',
      make(ctx) {
        const start = dayOffset(ctx.base, -(ctx.days - 1));
        return {
          title: `最近 ${ctx.days} 天逐日发稿量趋势`,
          desc: `给定发稿日志表 publish_log（log_id, seller_id, category, publish_date），求最近 ${ctx.days} 天（${start} ~ ${ctx.base}）全平台每天的**发稿量**，按日期升序输出日期与发稿量。`,
          level: '简单', stage: 's2', tags: ['日期函数', '时间区间', 'GROUP BY'],
          schema: schemaOf(['publish']), data: dataOf(['publish']),
          starter: `SELECT publish_date, ...\nFROM publish_log\nWHERE ...\nGROUP BY publish_date\nORDER BY publish_date;`,
          solution: `SELECT publish_date, COUNT(*) AS publish_cnt\nFROM publish_log\nWHERE publish_date BETWEEN date('${ctx.base}', '-${ctx.days - 1} day') AND '${ctx.base}'\nGROUP BY publish_date\nORDER BY publish_date;`,
          explain: `date('${ctx.base}', '-${ctx.days - 1} day') = '${start}'，配合 BETWEEN 得到含头含尾的 ${ctx.days} 天窗口，再按 publish_date 分组计数。用 date() 做偏移可以自动处理跨月跨年，比手写日期安全。`
        };
      }
    },
    {
      id: 'join-basic', name: '多表关联与 LEFT JOIN', stage: 's3', level: '简单',
      kw: [K(/\b(left|right|inner|cross)?\s*join\b/i, 4), K(/(关联|join|连接|对应上)/, 2), K(/(维表|主表|明细表|字典表)/, 2)],
      explain: '考多表连接：JOIN 键的选择、ON 与 WHERE 的区别，以及什么时候必须用 LEFT JOIN。高频追问：「没有发稿的商家要不要保留？」——那就要 LEFT JOIN + 把过滤条件写在 ON 而不是 WHERE，否则 LEFT 会被退化成 INNER。',
      pitfalls: ['过滤右表的条件写在 WHERE 会让 LEFT JOIN 退化成 INNER JOIN', '多表连接可能产生笛卡尔积，注意连接键的粒度', 'COUNT(*) 在 LEFT JOIN 后会把「无匹配」的那行也数成 1，应改用 COUNT(右表.id)'],
      outline: '① 主表选保留全量的一方 ② LEFT JOIN 维表 ③ 过滤条件放 ON ④ COUNT 右表主键统计匹配数',
      make(ctx) {
        return {
          title: '每个商家在指定日的发稿量（含零发稿）',
          desc: `给定商家维表 seller（seller_id, seller_name, category）与发稿日志表 publish_log（log_id, seller_id, category, publish_date），求每个商家在 ${ctx.base} 当天各自的发稿量，**没有发稿的商家显示 0**，按发稿量降序、商家 ID 升序。`,
          level: '简单', stage: 's3', tags: ['JOIN', 'LEFT JOIN', 'NULL 处理'],
          schema: schemaOf(['seller', 'publish']), data: dataOf(['seller', 'publish']),
          starter: `SELECT s.seller_id, s.seller_name, ...\nFROM seller s\nLEFT JOIN publish_log p\n  ON ...\nGROUP BY ...;`,
          solution: `SELECT s.seller_id,\n       s.seller_name,\n       COUNT(p.log_id) AS publish_cnt\nFROM seller s\nLEFT JOIN publish_log p\n       ON p.seller_id = s.seller_id\n      AND p.publish_date = '${ctx.base}'\nGROUP BY s.seller_id, s.seller_name\nORDER BY publish_cnt DESC, s.seller_id;`,
          explain: `以 seller 为主表 LEFT JOIN 发稿表，把日期条件写在 ON 上，这样某天没发稿的商家会保留、匹配不到的行 p.log_id 为 NULL。用 COUNT(p.log_id)（而不是 COUNT(*)）统计，才能让零发稿商家得到 0 而不是 1。若把日期条件写到 WHERE，LEFT JOIN 会退化成 INNER JOIN，零发稿商家就丢了。`
        };
      }
    },
    {
      id: 'conditional-agg', name: '条件聚合（CASE WHEN）', stage: 's2', level: '中等',
      kw: [K(/case\s+when/i, 5), K(/(条件|分别统计|分类统计|满足.*的)/, 2), K(/(if\s*\(|sum\s*\(\s*case)/i, 3)],
      explain: '考「一次扫描算多个指标」：用 CASE WHEN + SUM/COUNT 把行级条件变成组级指标（如活跃天数、达标次数、分类计数）。这是数据分析面试的日常写法，比多次 JOIN 更高效，也常用来做行转列。',
      pitfalls: ['SUM(CASE WHEN 条件 THEN 1 ELSE 0 END) 是「计数」的惯用写法，ELSE 0 不能漏否则结果为 NULL', '需要同时统计多类时别写多个子查询，一个 GROUP BY 里用多个 CASE 即可', 'CASE 里判空要用 IS NULL'],
      outline: '① 先按「双层维度」聚合 ② 外层 SUM(CASE WHEN 指标 >= 阈值 THEN 1 ELSE 0 END) 数达标次数',
      make(ctx) {
        const start = dayOffset(ctx.base, -(ctx.days - 1));
        return {
          title: `每个商家最近 ${ctx.days} 天的活跃天数（当天发稿 ≥ 2 记为活跃）`,
          desc: `给定发稿日志表 publish_log（log_id, seller_id, category, publish_date），统计每个商家在最近 ${ctx.days} 天（${start} ~ ${ctx.base}）里，**当天发稿量 ≥ 2 的天数**（活跃天数），按活跃天数降序、商家 ID 升序输出。`,
          level: '中等', stage: 's2', tags: ['条件聚合', 'CASE WHEN', '双层聚合'],
          schema: schemaOf(['publish']), data: dataOf(['publish']),
          starter: `SELECT seller_id, SUM(CASE WHEN ... THEN 1 ELSE 0 END) AS active_days\nFROM (\n  SELECT seller_id, publish_date, COUNT(*) AS cnt\n  FROM publish_log\n  WHERE ...\n  GROUP BY seller_id, publish_date\n) t\nGROUP BY seller_id;`,
          solution: `SELECT seller_id,\n       SUM(CASE WHEN cnt >= 2 THEN 1 ELSE 0 END) AS active_days\nFROM (\n  SELECT seller_id, publish_date, COUNT(*) AS cnt\n  FROM publish_log\n  WHERE publish_date BETWEEN '${start}' AND '${ctx.base}'\n  GROUP BY seller_id, publish_date\n) t\nGROUP BY seller_id\nORDER BY active_days DESC, seller_id;`,
          explain: `这是「双层聚合」：内层先算每个商家每天的发稿条数，外层用 SUM(CASE WHEN cnt >= 2 THEN 1 ELSE 0 END) 把「达标的天」数出来。若漏掉 ELSE 0，不达标的行会得到 NULL，SUM 结果也会是 NULL。同一个 CASE 套路也能做行转列、分类计数。`
        };
      }
    },
    {
      id: 'dedup-count', name: '去重计数 COUNT DISTINCT', stage: 's1', level: '简单',
      kw: [K(/distinct/i, 4), K(/去重/, 4), K(/不重复|多少(个|家|种)/, 2)],
      explain: '考去重统计：COUNT(*) 与 COUNT(DISTINCT col) 的区别，以及多列去重、去重后再过滤的写法。追问点：DISTINCT 作用范围、NULL 是否被计入、数据量大时的性能。',
      pitfalls: ['COUNT(DISTINCT a) 只对单列去重；多列去重要用 COUNT(DISTINCT a || \'-\' || b) 或子查询', 'DISTINCT 会忽略 NULL', 'COUNT(DISTINCT) 在大表上开销高，能用近似/预聚合则更优'],
      outline: '① WHERE 圈定范围 ② GROUP BY 维度 ③ COUNT(DISTINCT 主体)',
      make(ctx) {
        const start = dayOffset(ctx.base, -(ctx.days - 1));
        return {
          title: `各类目最近 ${ctx.days} 天的活跃商家数（去重）`,
          desc: `给定发稿日志表 publish_log（log_id, seller_id, category, publish_date），求最近 ${ctx.days} 天（${start} ~ ${ctx.base}）每个类目下**有发稿的去重商家数**，按商家数降序输出。`,
          level: '简单', stage: 's1', tags: ['去重', 'COUNT DISTINCT'],
          schema: schemaOf(['publish']), data: dataOf(['publish']),
          starter: 'SELECT category, COUNT(DISTINCT seller_id) AS ...\nFROM publish_log\nWHERE ...\nGROUP BY category;',
          solution: `SELECT category,\n       COUNT(DISTINCT seller_id) AS active_sellers\nFROM publish_log\nWHERE publish_date BETWEEN '${start}' AND '${ctx.base}'\nGROUP BY category\nORDER BY active_sellers DESC;`,
          explain: `COUNT(DISTINCT seller_id) 把同一商家在窗口内多条发稿记录只算一次，得到「有多少商家发过稿」。若写成 COUNT(*)，得到的是发稿条数，语义完全不同——这是面试里最常见的混淆点。`
        };
      }
    },
    {
      id: 'rank-diff', name: 'ROW_NUMBER / RANK / DENSE_RANK 差异', stage: 's5', level: '中等',
      kw: [K(/rank\s*\(\)|dense_rank|row_number/i, 6), K(/(排名|名次)/, 2), K(/并列/, 3)],
      explain: '考三个排序函数的区别：ROW_NUMBER 强制唯一序号；RANK 并列同名次且后续跳号（1,1,3）；DENSE_RANK 并列同名次但不跳号（1,1,2）。面试官常给一组有并列的数据让你说出三者输出的差异。',
      pitfalls: ['RANK 跳号、DENSE_RANK 不跳号、ROW_NUMBER 不并列，三者别记反', '排序需明确 DESC/ASC，否则默认升序与直觉相反', '并列名次在取 TopN 时是否要一起保留，取决于用哪个函数'],
      outline: '① GROUP BY 聚合出指标 ② 同一 ORDER BY 上并排写三种排名函数，直观对比',
      make(ctx) {
        return {
          title: '同一批数据上三种排名函数的差异',
          desc: `给定发稿日志表 publish_log（log_id, seller_id, category, publish_date），求 ${ctx.base} 当天各商家的发稿量，并同时输出 ROW_NUMBER、RANK、DENSE_RANK 三种排名（均按发稿量降序），按发稿量降序、seller_id 升序排列。`,
          level: '中等', stage: 's5', tags: ['窗口函数', 'RANK', 'ROW_NUMBER'],
          schema: schemaOf(['publish']), data: dataOf(['publish']),
          starter: `SELECT seller_id, cnt,\n       ROW_NUMBER() OVER (ORDER BY ...) AS rn,\n       RANK()       OVER (ORDER BY ...) AS rk,\n       DENSE_RANK() OVER (ORDER BY ...) AS drk\nFROM (...);`,
          solution: `SELECT seller_id, cnt,\n       ROW_NUMBER() OVER (ORDER BY cnt DESC) AS rn,\n       RANK()       OVER (ORDER BY cnt DESC) AS rk,\n       DENSE_RANK() OVER (ORDER BY cnt DESC) AS drk\nFROM (\n  SELECT seller_id, COUNT(*) AS cnt\n  FROM publish_log\n  WHERE publish_date = '${ctx.base}'\n  GROUP BY seller_id\n) t\nORDER BY cnt DESC, seller_id;`,
          explain: `把三种函数放在同一 ORDER BY 上，差异一眼可见：遇到并列（如两个商家同为 2 条），ROW_NUMBER 给出 2、3；RANK 给出 2、2、4（跳号）；DENSE_RANK 给出 2、2、3（不跳号）。取「前 N 名」时若想保留并列，用 RANK/DENSE_RANK 后过滤更稳妥。`
        };
      }
    },
    {
      id: 'cumulative-sum', name: '累计求和（滚动窗口）', stage: 's5', level: '中等',
      kw: [K(/累计|累积|累计到|rolling|运行总和|截止到/, 6), K(/(sum\s*\([^)]*\)\s*over)/i, 4), K(/环比|同比|lag|lead/i, 1)],
      explain: '考窗口函数的「帧」概念：默认窗口是 RANGE，做累计求和要显式写 ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW，含义是「从第一行累加到当前行」。面试官想看你能不能区分「累计和」与「普通分组和」。',
      pitfalls: ['SUM(x) OVER (ORDER BY d) 默认是累计语义，要么明确写 ROWS 帧，要么确认符合预期', '默认 RANGE 帧遇到同日期会一起累加，逐行累计需用 ROWS', '先聚合到日粒度再做累计，避免明细行重复累加'],
      outline: '① 子查询先聚合到日粒度 ② SUM(指标) OVER (ORDER BY 日期 ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)',
      make(ctx) {
        const start = dayOffset(ctx.base, -(ctx.days - 1));
        return {
          title: `最近 ${ctx.days} 天逐日发稿量与累计发稿量`,
          desc: `给定发稿日志表 publish_log（log_id, seller_id, category, publish_date），求最近 ${ctx.days} 天（${start} ~ ${ctx.base}）全平台每天的发稿量，以及**截至当天**的累计发稿量，按日期升序输出。`,
          level: '中等', stage: 's5', tags: ['窗口函数', '累计求和'],
          schema: schemaOf(['publish']), data: dataOf(['publish']),
          starter: `SELECT publish_date, cnt,\n       SUM(cnt) OVER (ORDER BY ...) AS cum_cnt\nFROM (\n  SELECT publish_date, COUNT(*) AS cnt\n  FROM publish_log\n  WHERE ...\n  GROUP BY publish_date\n) t;`,
          solution: `SELECT publish_date,\n       cnt,\n       SUM(cnt) OVER (ORDER BY publish_date\n                      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum_cnt\nFROM (\n  SELECT publish_date, COUNT(*) AS cnt\n  FROM publish_log\n  WHERE publish_date BETWEEN '${start}' AND '${ctx.base}'\n  GROUP BY publish_date\n) t\nORDER BY publish_date;`,
          explain: `先把明细聚合到「每天一行」，否则窗口会按明细行累加得到错误结果。SUM(cnt) OVER (ORDER BY publish_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) 表示从第一行累加到当前行，得到「截至当天」的累计值。用 ROWS（而非默认 RANGE）能保证逐行累加、不受同日期影响。`
        };
      }
    },
    {
      id: 'yoy-mom', name: '同比环比（LAG / LEAD）', stage: 's6', level: '中等',
      kw: [K(/同比|环比|mom|yoy|跟上[一]?(期|月|日)比|与上[一]?(期|月|日)/i, 6), K(/lag\s*\(|lead\s*\(/i, 5), K(/增长率|增幅|涨幅/, 3)],
      explain: '考时间序列对比：用 LAG/LEAD 取上一期/下一期的值，再算差值或增长率。环比是「比上一天/上一期」，同比是「比去年同期（-1 年）」。追问点：缺失期怎么处理、分母为 0、以及用 LAG(..., 偏移, 默认值) 补默认值。',
      pitfalls: ['LAG 按 ORDER BY 取上一行，必须保证日期连续（缺期会让「上一行」不是「上一天」）', '增长率分母为 0 会除零，需 NULLIF 或 CASE 保护', '同比是 -1 年而不是 -1 期，别和环比混'],
      outline: '① 先聚合到日粒度 ② LAG(指标) OVER (ORDER BY 日期) 取前一天 ③ (当期-上期)/上期 得环比增长率',
      make(ctx) {
        return {
          title: '每日发稿量的环比增长率',
          desc: '给定发稿日志表 publish_log（log_id, seller_id, category, publish_date），求每天的发稿量及其**环比增长率**（与前一天相比，百分比保留两位），按日期升序输出日期、当天发稿量、前一天发稿量、环比增长率。',
          level: '中等', stage: 's6', tags: ['同比环比', 'LAG', '窗口函数'],
          schema: schemaOf(['publish']), data: dataOf(['publish']),
          starter: `WITH daily AS (\n  SELECT publish_date, COUNT(*) AS cnt\n  FROM publish_log\n  GROUP BY publish_date\n)\nSELECT publish_date, cnt, LAG(...) OVER (...) AS prev_cnt, ...\nFROM daily;`,
          solution: `WITH daily AS (\n  SELECT publish_date, COUNT(*) AS cnt\n  FROM publish_log\n  GROUP BY publish_date\n)\nSELECT publish_date,\n       cnt,\n       LAG(cnt) OVER (ORDER BY publish_date) AS prev_cnt,\n       ROUND((cnt - LAG(cnt) OVER (ORDER BY publish_date)) * 100.0\n             / LAG(cnt) OVER (ORDER BY publish_date), 2) AS mom_pct\nFROM daily\nORDER BY publish_date;`,
          explain: `LAG(cnt) OVER (ORDER BY publish_date) 取「按日期排序的上一行」，即前一天的发稿量。环比增长率 = (当期 - 上期) / 上期 * 100。第一天没有上期，LAG 返回 NULL，增长率也为 NULL——这是正常现象；若分母可能为 0，用 NULLIF(LAG(cnt),0) 兜底。同比只需把偏移改成按年（或 LAG 12 期）。`
        };
      }
    },
    {
      id: 'retention', name: '留存率计算', stage: 's6', level: '困难',
      kw: [K(/(留存|次日留|7日留|30日留|n日留)/i, 6), K(/(新用户|新增用户|首日)/, 3), K(/留存率/, 4)],
      explain: '留存率 = 某日新增用户中，之后某天仍活跃的比例。要先把用户首次活跃日（注册/首登）单独算出来，再回连登录表判断「第 N 天是否还来」。分母是当日新增用户数，别用当日活跃数。面经里常被问「次日留存怎么算、阈值怎么定」。',
      pitfalls: ['分母是「当日新增用户」而非「当日活跃用户」，两者差别很大', '要 LEFT JOIN 回原表，找不到第 N 天记录的用户也算进分母（留存为 0）', '一天内多次登录要先去重到「用户×日」粒度', '跨天要按日期对齐，用 date(首次日, \'+1 day\') 而不是手工加 1'],
      outline: '① 子查询算每个用户的首次登录日 d0 ② LEFT JOIN 登录表，条件 login_date = date(d0, \'+1 day\') ③ 按 d0 分组，留存率 = 留存人数 / 新增人数',
      make(ctx) {
        return {
          title: '每日新增用户的次日留存率',
          desc: '给定用户表 user（user_id, reg_date）与登录表 login（login_id, user_id, login_date），求每天新增用户的**次日留存率**（首次登录的第二天仍登录的用户占比，保留三位小数），按首次登录日升序输出日期、新增用户数、次日留存用户数、留存率。',
          level: '困难', stage: 's6', tags: ['留存', 'LEFT JOIN', '日期函数'],
          schema: schemaOf(['user', 'login']), data: dataOf(['user', 'login']),
          starter: `WITH first_day AS (\n  SELECT user_id, MIN(login_date) AS d0\n  FROM login\n  GROUP BY user_id\n)\nSELECT f.d0, COUNT(DISTINCT ...) AS new_users, COUNT(DISTINCT ...) AS retained, ...\nFROM first_day f\nLEFT JOIN login l ON ...\nGROUP BY f.d0;`,
          solution: `WITH first_day AS (\n  SELECT user_id, MIN(login_date) AS d0\n  FROM login\n  GROUP BY user_id\n)\nSELECT f.d0 AS first_login_date,\n       COUNT(DISTINCT f.user_id) AS new_users,\n       COUNT(DISTINCT l.user_id) AS retained_users,\n       ROUND(COUNT(DISTINCT l.user_id) * 1.0 / COUNT(DISTINCT f.user_id), 3) AS next_day_retention\nFROM first_day f\nLEFT JOIN login l\n       ON l.user_id = f.user_id\n      AND l.login_date = date(f.d0, '+1 day')\nGROUP BY f.d0\nORDER BY f.d0;`,
          explain: `先算出每个用户的首次登录日 d0（即「新增」的时点），再 LEFT JOIN 登录表，连接条件是「同一用户且登录日 = d0 + 1 天」。用 LEFT JOIN 保证第二天没登录的用户仍留在分母里（分子为 NULL，不计数）。留存率 = 次日仍登录的去重用户数 / 当日新增用户数。分母若用当日活跃数，就变成活跃用户的续存率，语义错了。`
        };
      }
    },
    {
      id: 'consecutive', name: '连续 N 天（登录/签到）', stage: 's6', level: '困难',
      kw: [K(/连续\s*[0-9一二两三四五六七八九十]+\s*天/, 6), K(/连续登录|连续签到|连续下单|连续活跃|连续.*天/, 5), K(/row_number.*日期|日期.*row_number/, 3)],
      explain: '经典难题：判断「连续 N 天活跃」。核心技巧是「日期 - 序号」构造分组键——连续日期的日期减排名会得到同一个常量，据此把连续的片段归到一组，再 HAVING COUNT(*) >= N。面试官想看你能不能讲清这个 trick 的原理。',
      pitfalls: ['先对「用户×日」去重，否则同一天多次登录会破坏连续性', '日期减序号前要把日期转成可减的数值（SQLite 用 date(..., \'-n day\') 做等价减法）', '分组键要同时包含用户与「日期-序号」常量，否则不同用户会串组', '连续区间可能多段，要按组分别判断'],
      outline: '① 去重到用户×日 ② ROW_NUMBER() OVER (PARTITION BY user ORDER BY date) ③ 日期 - 序号 = 分组键 grp ④ GROUP BY user, grp HAVING COUNT(*) >= N',
      make(ctx) {
        return {
          title: '连续登录 ≥ 3 天的用户',
          desc: '给定登录表 login（login_id, user_id, login_date），找出所有**连续登录 ≥ 3 天**的用户，输出用户 ID、该连续区间的起始日、结束日与连续天数，按用户 ID、起始日升序。（同一用户可能有多段连续区间）',
          level: '困难', stage: 's6', tags: ['连续区间', '窗口函数', 'ROW_NUMBER'],
          schema: schemaOf(['login']), data: dataOf(['login']),
          starter: `WITH d AS (\n  SELECT user_id, login_date,\n         date(login_date, '-' || ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) || ' day') AS grp\n  FROM (SELECT DISTINCT user_id, login_date FROM login)\n)\nSELECT ... FROM d GROUP BY ... HAVING COUNT(*) >= 3;`,
          solution: `WITH d AS (\n  SELECT user_id,\n         login_date,\n         date(login_date, '-' || ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) || ' day') AS grp\n  FROM (SELECT DISTINCT user_id, login_date FROM login)\n)\nSELECT user_id,\n       MIN(login_date) AS start_day,\n       MAX(login_date) AS end_day,\n       COUNT(*) AS days\nFROM d\nGROUP BY user_id, grp\nHAVING COUNT(*) >= 3\nORDER BY user_id, start_day;`,
          explain: `关键在 grp：连续日期减去递增序号会得到同一个常量（如 08-01-1、08-02-2、08-03-3 都等于同一个基准日），于是同一段连续日期被归为一组。先 DISTINCT 去重到「用户×日」，再按 user_id + grp 分组，HAVING COUNT(*) >= 3 即可筛出连续 3 天以上的区间。若把日期换成年月，同样的技巧可用于「连续 N 个月」。`
        };
      }
    },
    {
      id: 'percent', name: '占比 / 百分比', stage: 's2', level: '中等',
      kw: [K(/占比|百分比|比例|贡献度|份额/, 6), K(/(占|percent|pct)/i, 1)],
      explain: '考「分组值 ÷ 全局值」的写法：分母是全局总量，最稳的是用窗口函数 SUM(指标) OVER () 一次性拿到全局和，避免多次扫表；也可用标量子查询。追问点：整数除法截断、分母为 0、以及占比之和是否为 100%。',
      pitfalls: ['整数除法要先 * 1.0，否则 3/10 得 0', '分母为 0 时除零，需 NULLIF 保护', '占比通常要 ROUND 到固定小数位，且注意总和可能因四舍五入不等于 100%'],
      outline: '① GROUP BY 维度出各维度指标 ② SUM(指标) OVER () 求全局和 ③ 相除 * 100 保留小数',
      make(ctx) {
        return {
          title: '各类目发稿量占全平台的百分比',
          desc: '给定发稿日志表 publish_log（log_id, seller_id, category, publish_date），求**每个类目的发稿量**以及**占全平台总发稿量的百分比**（保留两位小数），按占比降序输出。',
          level: '中等', stage: 's2', tags: ['窗口函数', '占比', '百分比'],
          schema: schemaOf(['publish']), data: dataOf(['publish']),
          starter: `SELECT category, COUNT(*) AS cnt,\n       ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM publish_log), 2) AS pct\nFROM publish_log\nGROUP BY category;`,
          solution: `SELECT category,\n       COUNT(*) AS cnt,\n       ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS pct\nFROM publish_log\nGROUP BY category\nORDER BY pct DESC;`,
          explain: `分子是本类目发稿数，分母是全平台总数。用 SUM(COUNT(*)) OVER () 在聚合结果上开窗，一次性得到全局合计，比再写一个子查询更省一次扫描。* 100.0 是为了转成浮点避免整数截断；若分母可能为 0 需加 NULLIF。也可以写成 COUNT(*) * 100.0 / (SELECT COUNT(*) FROM publish_log)。`
        };
      }
    },
    {
      id: 'pivot', name: '行转列（透视）', stage: 's6', level: '中等',
      kw: [K(/行转列|列转行|透视|pivot|行列转换|横表|竖表/i, 6), K(/每天一列|各.*一列/, 3)],
      explain: '考把「行」上的分类变成「列」：用 SUM(CASE WHEN 维度 = 值 THEN 指标 ELSE 0 END) 为每个目标列单独聚合。SQLite 没有原生 PIVOT，CASE WHEN 是通用解法；列多时可用动态 SQL 生成。追问点：列是写死的，新增分类要改 SQL。',
      pitfalls: ['列要在写 SQL 时就确定，无法自动扩展新分类', 'CASE 的 ELSE 0 不能漏，否则空值会污染 SUM', '同时要行合计/列合计时，可再加 SUM 或 GROUPING SETS'],
      outline: '① GROUP BY 主体 ② 对每个目标日期/分类写一个 SUM(CASE WHEN ... THEN 1 ELSE 0 END) 作为一列',
      make(ctx) {
        const d0 = dayOffset(ctx.base, -2), d1 = dayOffset(ctx.base, -1);
        return {
          title: '每个商家最近三天的发稿量（行转列）',
          desc: `给定发稿日志表 publish_log（log_id, seller_id, category, publish_date），把最近三天（${d0}、${d1}、${ctx.base}）每个商家的发稿量**从行转成列**：一行一个商家，三列分别是这三天的发稿量，按商家 ID 升序。`,
          level: '中等', stage: 's6', tags: ['行转列', 'CASE WHEN', '透视'],
          schema: schemaOf(['publish']), data: dataOf(['publish']),
          starter: `SELECT seller_id,\n       SUM(CASE WHEN publish_date = '${d0}' THEN 1 ELSE 0 END) AS day_1,\n       ...\nFROM publish_log\nGROUP BY seller_id;`,
          solution: `SELECT seller_id,\n       SUM(CASE WHEN publish_date = '${d0}' THEN 1 ELSE 0 END) AS day_1,\n       SUM(CASE WHEN publish_date = '${d1}' THEN 1 ELSE 0 END) AS day_2,\n       SUM(CASE WHEN publish_date = '${ctx.base}' THEN 1 ELSE 0 END) AS day_3\nFROM publish_log\nWHERE publish_date BETWEEN '${d0}' AND '${ctx.base}'\nGROUP BY seller_id\nORDER BY seller_id;`,
          explain: `每需要一列，就写一个 SUM(CASE WHEN 日期 = 目标值 THEN 1 ELSE 0 END)——命中该日期记 1，否则记 0，SUM 起来就是该商家在这天的发稿量。多列并列即完成行转列。注意列是硬编码的，新增日期要改 SQL；SQLite 无 PIVOT 关键字，CASE WHEN 是标准做法。`
        };
      }
    }
  ];

  /* ---------------- 识别（打分） ---------------- */
  function match(text) {
    const hits = [];
    for (const t of TOPICS) {
      let score = 0;
      const matched = [];
      for (const k of t.kw) if (k.re.test(text)) { score += k.w; matched.push(k.re.source); }
      if (score > 0) hits.push({ topic: t, score, matched });
    }
    hits.sort((a, b) => b.score - a.score);
    return hits;
  }

  function catalog() {
    return TOPICS.map(t => ({ id: t.id, name: t.name, stage: t.stage, level: t.level, explain: t.explain }));
  }

  return { TOPICS, PARTS, match, buildCtx, metric, catalog, detectEntities, parseBaseDate, parseDays, parseTopN };
})();
