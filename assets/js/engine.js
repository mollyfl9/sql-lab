/* SQLite(WASM) 判题引擎：按题目建库 -> 跑用户 SQL -> 跑标准答案 -> 比对 */
const Engine = (() => {
  let SQL = null;
  let initPromise = null;

  function init() {
    if (initPromise) return initPromise;
    initPromise = new Promise((resolve, reject) => {
      if (typeof initSqlJs !== 'function') {
        reject(new Error('未找到 sql-wasm.js，请确认 vendor/ 目录完整'));
        return;
      }
      initSqlJs({ locateFile: f => 'vendor/' + f })
        .then(s => { SQL = s; resolve(s); })
        .catch(e => reject(new Error('SQLite 引擎加载失败：' + e.message + '（请用本地 HTTP 服务打开，不要直接双击 file://）')));
    });
    return initPromise;
  }

  function execAll(db, sql) {
    const stmts = sql.split(/;\s*(?:\r?\n|$)/).map(s => s.trim()).filter(Boolean);
    let last = null;
    for (const s of stmts) {
      const res = db.exec(s);
      if (res && res.length) last = res[res.length - 1];
    }
    return last;
  }

  /** 执行一条查询，返回 {columns, rows} */
  function query(setupSql, sql) {
    const db = new SQL.Database();
    try {
      db.run(setupSql);
      let res;
      try {
        res = db.exec(sql);
      } catch (e) {
        throw new Error(e.message);
      }
      if (!res || !res.length) return { columns: [], rows: [] };
      const last = res[res.length - 1];
      return { columns: last.columns || [], rows: last.values || [] };
    } finally {
      db.close();
    }
  }

  function norm(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return Math.round(v * 1e6) / 1e6;
    if (typeof v === 'bigint') return Number(v);
    if (v instanceof Uint8Array) return Array.from(v).join(',');
    return String(v);
  }

  function normCols(cols) { return (cols || []).map(c => String(c).toLowerCase()); }

  function rowKey(row) { return JSON.stringify(row.map(norm)); }

  function compare(actual, expected) {
    const ac = normCols(actual.columns), ec = normCols(expected.columns);
    const colsMatch = ac.length === ec.length && ac.every((c, i) => c === ec[i]);
    const aRows = (actual.rows || []).map(rowKey).sort();
    const eRows = (expected.rows || []).map(rowKey).sort();
    const same = aRows.length === eRows.length && aRows.every((r, i) => r === eRows[i]);
    const orderSame = (actual.rows || []).map(rowKey).join('|') === (expected.rows || []).map(rowKey).join('|');
    return {
      pass: same,
      colsMatch,
      orderSame,
      rowCountActual: (actual.rows || []).length,
      rowCountExpected: (expected.rows || []).length
    };
  }

  /** 判题入口 */
  function judge(problem, userSql) {
    const setup = [problem.schema, problem.data].filter(Boolean).join('\n');
    let actual, expected;
    try {
      actual = query(setup, userSql);
    } catch (e) {
      return { ok: false, error: e.message, stage: 'run' };
    }
    try {
      expected = query(setup, problem.solution);
    } catch (e) {
      return { ok: false, error: '标准答案执行失败：' + e.message, stage: 'solution', actual };
    }
    const cmp = compare(actual, expected);
    return {
      ok: cmp.pass,
      stage: 'compare',
      actual, expected, cmp,
      warn: !cmp.colsMatch ? '列名与标准答案不一致，建议用 AS 指定别名（数据已通过，按宽松判定）' :
            (cmp.pass && !cmp.orderSame ? '数据正确，但输出顺序与标准答案不同，面试中注意 ORDER BY' : '')
    };
  }

  /** 只跑一遍用户的 SQL（用于「运行」按钮） */
  function runOnly(problem, userSql) {
    const setup = [problem.schema, problem.data].filter(Boolean).join('\n');
    try {
      return { ok: true, result: query(setup, userSql) };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  return { init, query, judge, runOnly, compare, isReady: () => !!SQL };
})();
