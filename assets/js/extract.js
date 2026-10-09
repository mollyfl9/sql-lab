/* 面经 -> 考点解读 + 出题
   真实面经往往只有一句话（如「求8月12号发稿量top100的商家ID和发稿量」），
   它描述的是「考点」而不是完整题面。所以这里的流程是：
     切句 -> 匹配考点（可多命中，取主）-> 调用该考点的出题模板生成一道完整可判题的题目
   同时给出考点解读（面试官视角 / 常见坑 / 解题思路）。
   未命中考点时，回退为「占位草稿」（仍需人工补全表结构）。
   接口：Extract.fromText(text, source) -> draft[]
*/
const Extract = (() => {

  // 识别门槛：要么命中考点，要么文本本身像一道 SQL 题
  const SQL_HINT = /(select|from|where|join|group\s+by|order\s+by|having|查询|统计|求|输出|计算|找出|排名|窗口|sql|top\s*\d|gmv|留存|漏斗|占比|日均)/i;

  function normalize(text) {
    return text
      .replace(/\r\n?/g, '\n')
      .replace(/\u00a0/g, ' ')
      .replace(/[【】]/g, m => (m === '【' ? '[' : ']'))
      .replace(/\n{3,}/g, '\n\n');
  }

  /** 把一大段面经切成候选块：空行、编号列表 */
  function splitBlocks(text) {
    const raw = normalize(text);
    const numbered = raw.split(/(?=^\s*\d{1,2}\s*[.、)．]\s*)/m).filter(s => s.trim());
    let blocks = [];
    for (const part of numbered) {
      const sub = part.split(/\n\s*\n/).filter(s => s.trim());
      blocks = blocks.concat(sub.length > 1 ? sub : [part]);
    }
    // 逐行兜底：一行一句的面经（无编号）也能切开
    const out = [];
    for (const b of blocks) {
      const lines = b.split('\n').map(s => s.trim()).filter(Boolean);
      if (lines.length === 1) { out.push(lines[0]); continue; }
      const head = lines[0];
      if (/^\s*\d{1,2}\s*[.、)．]/.test(head) || /[？?。；;]$/.test(head)) out.push(b);
      else out.push(b);
    }
    return out.map(s => s.trim()).filter(s => s.replace(/\s/g, '').length > 6);
  }

  function makeTitle(block, idx) {
    let line = block.split('\n')[0] || block;
    line = line.replace(/^\s*\d{1,2}\s*[.、)．]\s*/, '').trim();
    line = line.replace(/^[-•*]\s*/, '').trim();
    const cut = line.split(/[。！？!?；;]/)[0];
    const t = (cut || line).trim();
    return (t.length > 42 ? t.slice(0, 42) + '…' : t) || `面经题 ${idx + 1}`;
  }

  /* --------- 回退：未命中考点时的占位草稿（沿用旧的启发式） --------- */
  const STOP = /^(select|from|where|values|set|table|dual|and|or|not|in|on|as|by|over|count|sum|avg|max|min|case|when|then|else|end|with|if|date|cast|group|order|having|join|limit)$/i;
  function findTables(block) {
    const out = [];
    const push = (name, fields) => {
      if (!name || STOP.test(name)) return;
      const hit = out.find(o => o.name.toLowerCase() === name.toLowerCase());
      if (hit) { if (!hit.fields.length && fields.length) hit.fields = fields; return; }
      out.push({ name, fields: fields || [] });
    };
    let m;
    const re1 = /([a-zA-Z_][a-zA-Z0-9_]*)\s*[（(]\s*([^）)]{1,160})[）)]/g;
    while ((m = re1.exec(block))) {
      const fields = m[2].split(/[,，、]/).map(s => s.trim()).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s));
      if (fields.length) push(m[1], fields);
    }
    const re2 = /\b(?:from|join|update|into)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
    while ((m = re2.exec(block))) push(m[1], []);
    return out.slice(0, 4);
  }
  function guessType(f) {
    const n = f.toLowerCase();
    if (/(^|_)(id)$/.test(n)) return 'INTEGER';
    if (/(date|time|dt|ym|month|day|at)$/.test(n)) return 'TEXT';
    if (/(amount|price|salary|money|gmv|score|rate|qty|num|count|cnt|total|sum|avg)/.test(n)) return 'REAL';
    return 'TEXT';
  }
  function placeholder(title, block, source, idx) {
    const tables = findTables(block);
    const schema = tables.length
      ? tables.map(t => t.fields.length
        ? `CREATE TABLE ${t.name} (\n${t.fields.map(f => `  ${f} ${guessType(f)}`).join(',\n')}\n);  -- 字段类型按命名猜测，请核对`
        : `CREATE TABLE ${t.name} (\n  -- TODO: 字段待补\n  id INTEGER\n);`).join('\n')
      : `-- 未识别出表名，请手工补全\nCREATE TABLE t (\n  -- TODO: 字段\n  id INTEGER\n);`;
    return {
      title: '【面经·待归类】' + title,
      level: '中等', stage: 's1', tags: ['待归类'],
      desc: block,
      schema,
      data: tables.map(t => `-- TODO: 补 3~5 条样例数据\n-- INSERT INTO ${t.name} VALUES (...);`).join('\n') || '-- TODO: 补样例数据',
      solution: '',
      starter: 'SELECT\nFROM\nWHERE',
      explain: '没识别出明确考点，请手工补全表结构、样例数据与参考答案后再入库。也可以参考「已支持考点」补写成更明确的一句话。',
      topic: null
    };
  }

  function fromText(text, source = '手工粘贴') {
    if (!text || !text.trim()) return [];
    const blocks = splitBlocks(text);
    const seen = new Set();
    const out = [];
    blocks.forEach((block, i) => {
      const hits = Topics.match(block);
      if (!hits.length && !SQL_HINT.test(block)) return;
      const key = block.replace(/\s+/g, '').slice(0, 80);
      if (seen.has(key)) return;
      seen.add(key);

      const ctx = Topics.buildCtx(block);
      let prob, topic = null;
      if (hits.length) {
        const t = hits[0].topic;
        prob = t.make(ctx);
        topic = {
          id: t.id, name: t.name, stage: t.stage, level: t.level,
          explain: t.explain, pitfalls: t.pitfalls, outline: t.outline,
          score: hits[0].score,
          others: hits.slice(1, 4).map(h => ({ name: h.topic.name, score: h.score }))
        };
      } else {
        prob = placeholder(makeTitle(block, i), block, source, i);
      }

      out.push({
        id: 'draft-' + Date.now().toString(36) + '-' + i,
        title: '【面经】' + (prob.title || makeTitle(block, i)),
        level: prob.level || '中等',
        stage: prob.stage || 's1',
        tags: (prob.tags || []).concat(topic ? ['面经'] : []).slice(0, 6),
        source,
        status: 'draft',
        createdAt: Date.now(),
        rawText: block,
        topic,
        desc: prob.desc,
        schema: prob.schema,
        data: prob.data,
        solution: prob.solution,
        starter: prob.starter || 'SELECT\nFROM',
        explain: prob.explain || ''
      });
    });
    return out;
  }

  return { fromText, splitBlocks, findTables, match: t => Topics.match(t) };
})();
