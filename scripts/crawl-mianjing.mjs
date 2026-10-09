#!/usr/bin/env node
/**
 * 面经 SQL 题采集脚本（骨架 + 可用部分）
 *
 *   node scripts/crawl-mianjing.mjs --keyword "数据分析 面经 SQL" --limit 20
 *   node scripts/crawl-mianjing.mjs --file ./saved.html --file ./notes.txt
 *   node scripts/crawl-mianjing.mjs --keyword "SQL 面试" --extractor llm   # 预留
 *
 * 产出：data/raw/*.txt（清洗后的正文）、data/drafts/<timestamp>.json（草稿题）
 * 草稿拿到网页「面经采集」里补全表结构 + 参考答案后即可入库判题。
 *
 * 说明：牛客/脉脉/小红书等站点需要登录态或签名，脚本内置的是「公开可抓」的兜底逻辑，
 * 真要抓这些站点，把 Cookie 填进 SOURCES[].headers 即可，不要写在代码仓库里。
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const RAW_DIR = path.join(ROOT, 'data', 'raw');
const DRAFT_DIR = path.join(ROOT, 'data', 'drafts');

/* ---------------- 采集源配置 ---------------- */
const SOURCES = [
  {
    id: 'nowcoder',
    name: '牛客网',
    // 讨论区搜索页，登录后在浏览器 DevTools 里复制 Cookie 填到 headers
    url: k => `https://www.nowcoder.com/search?query=${encodeURIComponent(k)}&type=post`,
    headers: { 'User-Agent': 'Mozilla/5.0' },
    cookieEnv: 'NOWCODER_COOKIE',
    enabled: true
  },
  {
    id: 'zhihu',
    name: '知乎',
    url: k => `https://www.zhihu.com/search?q=${encodeURIComponent(k)}&type=content`,
    headers: { 'User-Agent': 'Mozilla/5.0' },
    cookieEnv: 'ZHIHU_COOKIE',
    enabled: true
  },
  {
    id: 'juejin',
    name: '掘金',
    url: k => `https://juejin.cn/search?query=${encodeURIComponent(k)}`,
    headers: { 'User-Agent': 'Mozilla/5.0' },
    cookieEnv: '',
    enabled: true
  }
  // 脉脉 / 小红书：需要签名与风控，建议走「浏览器插件导出正文 → --file」这条路
];

/* ---------------- 工具 ---------------- */
function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h\d|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function clean(text) {
  const drop = /(点赞|收藏|评论|关注|展开全文|查看更多|版权归作者|登录后可|广告|相关推荐)/;
  return text.split('\n').filter(l => !drop.test(l) && l.trim().length > 4).join('\n');
}

function loadExtractor() {
  const src = fs.readFileSync(path.join(ROOT, 'assets/js/extract.js'), 'utf8');
  // eslint-disable-next-line no-eval
  return eval(src + ';Extract');
}

function arg(name, dflt = null) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : dflt;
}
function args(name) {
  const out = [];
  const all = process.argv;
  for (let i = 0; i < all.length; i++) if (all[i] === '--' + name) out.push(all[i + 1]);
  return out;
}

async function fetchText(url, headers) {
  const res = await fetch(url, { headers, redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const ct = res.headers.get('content-type') || '';
  const body = await res.text();
  return ct.includes('html') ? htmlToText(body) : body;
}

/* ---------------- 主流程 ---------------- */
const keyword = arg('keyword', '数据分析 面经 SQL');
const limit = Number(arg('limit', '10'));
const files = args('file');
const extractor = arg('extractor', 'rule');

fs.mkdirSync(RAW_DIR, { recursive: true });
fs.mkdirSync(DRAFT_DIR, { recursive: true });

const corpus = [];

if (files.length) {
  for (const f of files) {
    const raw = fs.readFileSync(f, 'utf8');
    const text = clean(f.match(/\.html?$/i) ? htmlToText(raw) : raw);
    corpus.push({ source: path.basename(f), text });
    console.log(`✓ 本地文件 ${f} → ${text.length} 字`);
  }
} else {
  for (const s of SOURCES.filter(x => x.enabled)) {
    const cookie = s.cookieEnv && process.env[s.cookieEnv];
    const headers = { ...s.headers, ...(cookie ? { Cookie: cookie } : {}) };
    try {
      const text = clean(await fetchText(s.url(keyword), headers));
      corpus.push({ source: s.name, text });
      console.log(`✓ ${s.name} → ${text.length} 字${cookie ? '（已带 Cookie）' : '（未登录态，可能只有部分内容）'}`);
    } catch (e) {
      console.log(`✗ ${s.name} 抓取失败：${e.message}`);
    }
  }
}

const ts = Date.now();
const drafts = [];
const Extract = loadExtractor();

for (const c of corpus.slice(0, limit)) {
  fs.writeFileSync(path.join(RAW_DIR, `${ts}-${c.source}.txt`), c.text, 'utf8');
  const got = Extract.fromText(c.text, c.source);
  got.forEach(d => drafts.push(d));
  console.log(`  · ${c.source} 抽取到 ${got.length} 道候选题`);
}

if (extractor === 'llm') {
  // 预留：把 corpus 交给大模型，要求返回 [{title, level, tags, desc, schema, data, solution}]，
  // 与 Extract.fromText 的返回结构保持一致即可无缝替换。
  console.log('（LLM 抽取器未接入，当前仍使用规则抽取）');
}

const outFile = path.join(DRAFT_DIR, `${ts}.json`);
fs.writeFileSync(outFile, JSON.stringify({
  keyword, createdAt: new Date(ts).toISOString(), count: drafts.length, drafts
}, null, 2), 'utf8');

console.log(`\n草稿已写入 ${path.relative(ROOT, outFile)}，共 ${drafts.length} 题`);
console.log('下一步：打开网页「面经采集」→ 粘贴同样的文本或导入草稿 → 补全表结构与参考答案 → 入库判题。');
