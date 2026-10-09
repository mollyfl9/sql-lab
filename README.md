# L' 知识库

一个类牛客 / 力扣的 SQL 练习站：**顶部 4 个主导航（SQL 刷题 / AI 原理 / 建模知识 / 业务问题）**；AI 原理、建模知识是原创撰写的阅读页（同一套渲染器），建模知识按 8 大分组拆成独立页面，SQL 刷题沿用左侧 6 个子菜单。内置 32 道题，**判题在浏览器里用真实 SQLite（WebAssembly）执行**，不是字符串比对。

## 运行

```bash
cd sql-lab
python3 -m http.server 8000
# 打开 http://localhost:8000
```

> 必须走 HTTP。直接双击 `index.html`（file://）浏览器会拦截 wasm 加载，页面右上角会提示引擎加载失败。

## 页面

| 菜单 | 作用 |
| --- | --- |
| 学习路线 | 7 阶段路线图（基础查询 → 聚合分组 → 多表连接 → 子查询/CTE → 窗口函数 → 业务建模 → DML 与陷阱），每阶段挂题、显示进度、每日一练 |
| 题库 | **题单视图**（仿 LeetCode / labuladong 题单）：顶部进度头（已通过 x/y + 进度条 + 简单/中等/困难 分档统计），按 7 个阶段分组，每行含 状态勾选、序号、标题、标签、难度色字；支持难度 / 状态 / 阶段筛选与搜索 |
| 面经采集 | 粘贴**一句话面经** → 识别考点 → 给出考点解读 + 针对考点**自动生成完整可判题的题** → 一键入库刷题 |
| AI 原理 | 顶部导航「AI 原理」进入的阅读页：原创撰写《LLM 与 Agent 核心原理》14 节（概率预测 → … → 一切皆上下文），含目录锚点跳转与代码复制 |
| 建模知识 | **左侧菜单一二级全展开**：进入后左栏同时列出 8 个分组 + 全部 37 个小节，**点哪一节，右侧只显示那一节**（`#/modeling/<group>/<section>`，无总览页、无需滑动翻找），页内有面包屑与「上一节 / 下一节」。共 8 分组 / 37 节，硬核覆盖机器学习（决策树、随机森林、XGBoost、SVM、KMeans、PCA、神经网络、推荐系统、GNN…），**每节都按「原理 / 如何操作 / 注意事项 / 业务实际运用举例」四维度展开**，配可运行 SQL 或 Python 代码 |
| 业务问题 | 顶部导航占位页：后续补充「真实业务问题的建模拆解」（OSM → 指标 → 模型 → 验证） |
| 错题本 | 错题 + 收藏两个 tab |
| 统计 | 通过数、一次通过率、各阶段进度条、提交热力图 |
| 设置 | 进度导出/导入/清空 |

## 判题机制

1. 按题目的 `schema` + `data` 建一个临时 SQLite 库；
2. 执行你写的 SQL，得到结果集；
3. 同时执行 `solution`（标准答案），得到期望结果集；
4. 按**行的多重集**比对（忽略顺序），列名不一致会提示但按宽松判定通过。

支持窗口函数、CTE、DATE/strftime 等函数，也支持 `UPDATE / DELETE` 这类多语句题。

## 目录

```
index.html
assets/css/style.css
assets/js/  store.js(本地持久化) engine.js(判题) problems.js(题库) roadmap.js topics.js(考点库+出题) extract.js app.js
vendor/     sql-wasm.js + sql-wasm.wasm（本地化，离线可用）
scripts/    crawl-mianjing.mjs  面经采集脚本
data/       raw/(抓下来的正文)  drafts/(抽取出的草稿)
```

## 面经 → 考点解读 → 自动出题（重点）

真实面经里的 SQL 部分，往往只是**一句话考点描述**，比如：

```
1. 求8月12号发稿量top100的商家ID和发稿量
2. 求不同类目的商家最近七日的日均发稿量，输出类目、日均发稿量字段
3. 8月12号每个类目下成交GMV top10的商家ID
```

它没有表结构、没有标准答案，直接抽取只能得到占位骨架。所以这里做的不是「抽取」，而是**识别考点 → 解读考点 → 针对考点出题**：

1. **切句**：编号列表 / 换行 / 句号都能把面经切成「一句一题」；
2. **识别考点**：`assets/js/topics.js` 里 15 个高频考点各带关键词（带权重），命中多个时按分值取主考点，其余作为「还命中」展示；
3. **考点解读**：给出面试官视角在考什么、常见坑、解题思路；
4. **自动出题**：调用该考点的 `make(ctx)`，结合从面经里抽出的**业务实体与参数**（发稿量 / GMV、日期、TopN、天数）生成一道自带 `schema + data + solution` 的**完整可判题题目**，一键「入库并刷题」。

### 已支持的 15 个考点

| 考点 | 阶段 | 考点 | 阶段 |
| --- | --- | --- | --- |
| 全局 TopN 排行 | 基础 | ROW_NUMBER / RANK / DENSE_RANK 差异 | 窗口 |
| 分组内 TopN（窗口函数） | 窗口 | 累计求和（滚动窗口） | 窗口 |
| 分组日均（时间窗 + 均值口径） | 业务 | 同比环比（LAG / LEAD） | 业务 |
| 分组聚合与 HAVING | 聚合 | 留存率计算 | 业务 |
| 时间区间过滤与日期函数 | 聚合 | 连续 N 天（登录/签到） | 业务 |
| 多表关联与 LEFT JOIN | 连接 | 占比 / 百分比 | 聚合 |
| 条件聚合（CASE WHEN） | 聚合 | 行转列（透视） | 业务 |
| 去重计数 COUNT DISTINCT | 基础 | | |

> 每个考点自带的示例数据是**确定性生成**的（含 2024-08-06 ~ 08-12 的发稿/成交数据），保证生成题一定能跑出非空结果、判题稳定。

### 加一个考点

在 `assets/js/topics.js` 的 `TOPICS` 里追加一项：

```js
{
  id, name, stage, level,
  kw: [ { re: /正则/, w: 权重 } ],   // 识别用
  explain, pitfalls: [], outline,     // 考点解读
  make(ctx) { return { title, desc, schema, data, solution, starter, explain }; } // 出题
}
```

`ctx` 由 `Topics.buildCtx(text)` 得到，含 `base`(基准日) / `days`(天数) / `topN` / `ent`(识别到的业务实体)。写完后用真实 SQLite 跑一遍 `solution` 确认能出结果即可。

**接 LLM 出题**：把 `Extract.fromText(text, source)` 的实现换成调用大模型（或让模型直接产出 `schema/data/solution`），只要保持返回的草稿字段不变，前端与判题流程都不用改。

**接爬虫**（把公开面经拉到本地再走上面流程）
```bash
node scripts/crawl-mianjing.mjs --keyword "数据分析 面经 SQL"
node scripts/crawl-mianjing.mjs --file ./saved.html      # 本地文件也能直接抽
```
脚本内置牛客 / 知乎 / 掘金的公开搜索入口；需要登录态的站点把 Cookie 放到环境变量（`NOWCODER_COOKIE` 等）里，不要硬编码进仓库。产出落到 `data/raw/`、`data/drafts/`。

## 加题

往 `assets/js/problems.js` 里追加一条即可，字段：

```js
{
  id, stage, level, tags, title, desc,
  schema,   // CREATE TABLE
  data,     // INSERT
  starter,  // 编辑器初始代码
  solution, // 标准答案
  hint, explain
}
```

## 扩展阅读页 / 菜单（AI 原理、建模知识）

两个阅读页（顶部「AI 原理」「建模知识」）共用 `assets/js/app.js` 里的 `renderReader(D)`。内容全部是数据：`*.meta` + `*.sections[]`，加东西不动渲染器。

### 文件与对应入口

| 顶部菜单 | 内容文件 | 数据对象 | 路由 |
| --- | --- | --- | --- |
| AI 原理 | `assets/js/aibasics.js` | `AIBASICS` | `#/aibasics` |
| 建模知识 | `assets/js/modeling.js` | `MODELING` | `#/modeling`（= 第一组第一节）/ `#/modeling/<groupId>`（= 该组第一节）/ `#/modeling/<groupId>/<sectionId>`（单节） |
| 业务问题 | `assets/js/app.js` 内 `renderBiz()`（占位，尚无独立数据文件） | — | `#/biz` |

> 建模知识**没有总览页**：进入 `#/modeling` 直接落到第一组第一节。左侧边栏（`#nav-model`，由 `buildModelNav(activeGroup, activeSec)` 渲染）**一二级全展开**——8 个分组各带自己全部小节。点某一节 → `renderModelSection()` **只渲染那一节**（视图片段很小，页内带面包屑 + 组简介 + 上一节/下一节）。分组由 `meta.groups[]`（对象数组 `{id,ico,title,desc}`）定义，**每加一个分组/小节，左栏自动多出对应菜单项、对应路由自动可用**。

### A. 在某个分组里「加一节」

打开 `modeling.js`，在 `sections` 数组里追加一个对象即可（`no` 全局连续即可）：

```js
{
  id: 'new-id',        // 唯一英文短名，作锚点
  no: 38,             // 全局连续编号
  group: 'supervised', // 必须是 meta.groups 里某个分组的 id（不是 title）
  title: '这一节的标题',
  lead: '一句话导语',
  blocks: [           // 正文块，按出现顺序渲染
    { t: 'p',   x: 'intro 段落' },
    { t: 'dim', c: 'why',  k: '原理',            x: '讲清背后的机制/假设' },
    { t: 'dim', c: 'how',  k: '如何操作',        x: '落地步骤、库函数、参数' },
    { t: 'dim', c: 'warn', k: '注意事项',        x: '坑与边界条件' },
    { t: 'dim', c: 'case', k: '业务实际运用举例', x: '真实业务场景与数字' },
    { t: 'code', lang: 'python', x: 'print("可跑的代码片段")' },
    { t: 'callout', tone: 'tip', title: '可选标题', x: '提示框，tone 取 tip/info/warn' }
  ]
}
```

块类型：`p` 段落 / `h` 小标题 / `list` 列表 / `quote` 金句 / `code` 代码块 / `callout` 提示框 / **`dim` 四维度块**（`c` 取 `why|how|warn|case`，分别渲染成紫/绿/橙/紫红标签；`k` 是标签文字）。刷新即生效，无需构建。建议代码用真实可跑片段（python 用 `py_compile` 校验、sql 用 SQLite 校验）。

### B. 新建一个「分组」（= 左栏自动多一个顶级菜单项 + 自动多一个独立页）

在 `meta.groups` 追加一个**对象**（不再是字符串）：

```js
meta: {
  groups: [
    { id: 'basic', ico: '基', title: '基础 · 数据建模思维', desc: '一句话介绍，显示在总览卡片上' },
    { id: 'yourgroup', ico: '新', title: '你新建的分组', desc: '……' }
  ]
}
// 再把某些 section 的 group 设为 'yourgroup'
```

改完刷新：左侧菜单栏会自动多出该分组的顶级项（含它的全部小节），点分组标题进该组第一节，点小节直接只显示那一节，无需改任何渲染代码。

### C. 新增一个「顶部菜单」

1. 若只是再加一个阅读页：仿 `modeling.js` 新建 `assets/js/yourpage.js`，导出 `const YOURPAGE = { meta:{ title, sub, route:'yourpage', groups:[...] }, sections:[...] }`（或省略 `groups`，退化成平铺目录，如 AI 原理页）；
2. `index.html`：在 `<head>` 末尾、`app.js` 之前加 `<script src="assets/js/yourpage.js"></script>`；并在顶部 `.tn-menu` 里复制一个 `.tn-item`，改 `href="#/yourpage"`、`data-section="yourpage"`、`data-tip="你的菜单名"`，把内联 `<svg>` 换成你的图标；
3. `assets/js/app.js`：新增 `function renderYourPage(){ renderReader(YOURPAGE); }`；在 `router()` 里把 `section` 映射加上 `route==='yourpage'?'yourpage':…`，派发表加上 `yourpage: renderYourPage`，`TITLES` 加一项；
4. 若页面像阅读页那样隐藏左侧子菜单，确保 `section` 计算命中（**非 `sql` 即隐藏**）。

> `业务问题` 就是「新增顶部菜单 + 自定义渲染」的现成例子：路由在 `router()` 里特判 `route==='biz'` 直接调 `renderBiz()`，不需要数据文件。以后要把它做成正式阅读页，照上面 C 步骤替换即可。

### D. 只改顶部导航图标/文字

`index.html` 的 `.tn-menu` 里每条 `<a class="tn-item">` 就是一项：图标是里面的 `<svg>`（改 `viewBox`/路径即可），悬停提示在 `data-tip`，常驻文字已移除（如需恢复就放回 `>图标< 文字<` 之间的文字）。

> 所有改动都是「改数据文件 + 必要时改一两行 index.html / app.js 路由」，没有构建步骤；改完 `python3 -m http.server 8123` 刷新即可。

