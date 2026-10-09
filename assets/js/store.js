/* 本地状态：localStorage 持久化 */
const Store = (() => {
  const KEY = 'sqllab.v1';
  const blank = { solved: {}, starred: [], mistakes: [], drafts: [], custom: [], daily: { date: '', ids: [] }, log: {} };

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(blank));
      return Object.assign(JSON.parse(JSON.stringify(blank)), JSON.parse(raw));
    } catch (e) {
      return JSON.parse(JSON.stringify(blank));
    }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  return {
    get state() { return state; },
    save,
    today,

    record(id, ok, sql) {
      const s = state.solved[id] || { attempts: 0, passed: false };
      s.attempts += 1;
      s.sql = sql;
      s.ts = Date.now();
      if (ok) s.passed = true;
      state.solved[id] = s;
      // 错题本：失败过且未通过 -> 进错题；通过 -> 移出错题
      const idx = state.mistakes.indexOf(id);
      if (ok) { if (idx >= 0) state.mistakes.splice(idx, 1); }
      else if (idx < 0) state.mistakes.push(id);
      // 每日热力图
      const t = today();
      state.log[t] = (state.log[t] || 0) + 1;
      save();
    },
    isPassed(id) { return !!(state.solved[id] && state.solved[id].passed); },
    attempts(id) { return state.solved[id] ? state.solved[id].attempts : 0; },
    savedSql(id) { return state.solved[id] ? state.solved[id].sql : null; },

    toggleStar(id) {
      const i = state.starred.indexOf(id);
      if (i >= 0) state.starred.splice(i, 1); else state.starred.push(id);
      save();
      return i < 0;
    },
    isStarred(id) { return state.starred.includes(id); },

    customProblems() { return state.custom || []; },
    addCustom(p) { state.custom.push(p); save(); },
    removeCustom(id) {
      state.custom = (state.custom || []).filter(x => x.id !== id);
      delete state.solved[id];
      state.mistakes = state.mistakes.filter(x => x !== id);
      state.starred = state.starred.filter(x => x !== id);
      save();
    },

    addDraft(d) { state.drafts.unshift(d); save(); },
    removeDraft(id) { state.drafts = state.drafts.filter(x => x.id !== id); save(); },
    updateDraft(id, patch) {
      const d = state.drafts.find(x => x.id === id);
      if (d) { Object.assign(d, patch); save(); }
    },

    /** 每日一练：每天固定抽 3 题（同日内结果稳定） */
    dailyIds(allIds) {
      const t = today();
      if (state.daily.date === t && state.daily.ids.length) return state.daily.ids;
      const pool = allIds.slice();
      let seed = 0;
      for (const ch of t) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
      const pick = [];
      for (let i = 0; i < 3 && pool.length; i++) {
        seed = (seed * 1103515245 + 12345) >>> 0;
        pick.push(pool.splice(seed % pool.length, 1)[0]);
      }
      state.daily = { date: t, ids: pick };
      save();
      return pick;
    },

    reset() { state = JSON.parse(JSON.stringify(blank)); save(); },
    exportJson() { return JSON.stringify(state, null, 2); },
    importJson(txt) {
      const obj = JSON.parse(txt);
      state = Object.assign(JSON.parse(JSON.stringify(blank)), obj);
      save();
    }
  };
})();
