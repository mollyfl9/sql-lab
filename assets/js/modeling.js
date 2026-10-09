// 建模知识：硬核版（8 大分组 / 37 节）
// 每节统一按 原理 → 如何操作 → 注意事项 → 业务实际运用举例 四维度展开
// 块类型：p 段落 / dim 维度(why|how|warn|case) / code / callout / list / h / quote
const MODELING = {
  meta: {
    route: 'modeling',
    title: '建模知识',
    sub: '从业务度量到机器学习建模的完整知识地图',
    intro: '建模不是「选个算法」，而是把业务问题翻译成可度量、可验证的结构。这里按「基础思维 → 业务分析 → 统计推断 → 计量模型 → 监督学习 → 无监督学习 → 深度学习 → 工程化」八条线展开，每节都从原理、操作、注意点、真实业务例子四个角度讲透。',
    framing: '一条主线贯穿全文：一切业务问题，最终都能落成「指标 × 维度 × 时间」的结构，再映射到模型 f(X)→y。先把结构想清楚，再谈模型。',
    groups: [
      { id: 'basic',       ico: '基', title: '基础 · 数据建模思维',   desc: '指标/维度、OSM 体系、用户行为三表、维度建模，是一切分析的地基。' },
      { id: 'business',    ico: '业', title: '业务分析方法',           desc: '漏斗、留存、RFM、AARRR、同期群、同环比，用 SQL 就能落地的常用框架。' },
      { id: 'stat',        ico: '统', title: '统计推断',               desc: '分布、假设检验、置信区间、A/B 实验、贝叶斯，回答「这个结论可靠吗」。' },
      { id: 'econometric', ico: '计', title: '经典统计与计量模型',     desc: '线性回归、逻辑回归、正则化、时间序列，解释性强、可审计的建模主力。' },
      { id: 'supervised',  ico: '监', title: '机器学习 · 监督学习',   desc: '决策树、随机森林、XGBoost、SVM、KNN，以及评估与特征工程。' },
      { id: 'unsupervised',ico: '无', title: '机器学习 · 无监督学习', desc: 'K-Means、层次/DBSCAN、PCA、Apriori，用于聚类、降维、关联。' },
      { id: 'dl',          ico: '深', title: '深度学习与前沿',         desc: '神经网络、Embedding、推荐系统、图神经网络，处理高维与序列信号。' },
      { id: 'eng',         ico: '工', title: '建模工程化',             desc: '特征仓库、模型监控与漂移，让模型从 Notebook 走向生产。' }
    ]
  },
  sections: [
    /* ============ 基础 ============ */
    { id: 'metric-dim', no: 1, group: 'basic', title: '指标与维度', lead: '指标度量「多少」，维度回答「从哪个角度看」，二者拼成一张分析表。',
      blocks: [
        { t: 'p', x: '任何分析报表本质都是「若干指标，按若干维度交叉聚合」的结果。把这两个概念拆清，后面所有模型才不会跑偏。' },
        { t: 'dim', c: 'why', k: '原理', x: '指标（Measure）是可在数值上求和/平均/计数的量，如 GMV、订单数；维度（Dimension）是分类切分键，如城市、渠道、日期。多维数据集（Cube）就是指标在不同维度组合下的取值。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '落地时先做「指标分层」：原子指标（不可再拆，如支付金额）→ 派生指标（四则运算，如客单价=支付金额/支付人数）→ 复合指标（带业务语义，如复购率）。维度则区分「退化维度」（直接放事实表，如订单号）与「一致性维度」（独立维表，供多事实表复用）。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '最常见的坑是「指标口径没对齐」：A 部门算的「活跃」是登录即算，B 部门要求有点击。务必把口径写进指标字典（口径、单位、去重方式、时间粒度），否则数字永远对不上。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '电商大促看板：指标=GMV、订单数、转化率；维度=日期(天)、城市、品类、流量来源。运营一眼就能看出「8 月 12 日美妆品类在抖音渠道的 GMV 骤降」，定位是投放还是库存问题。' },
        { t: 'code', lang: 'sql', x: "-- 指标×维度的标准聚合写法\nSELECT date(created_at) AS dt, city, category,\n       SUM(amount)        AS gmv,\n       COUNT(DISTINCT user_id) AS pay_users,\n       ROUND(SUM(amount)*1.0/COUNT(DISTINCT user_id),2) AS arpu\nFROM orders\nGROUP BY 1,2,3;" }
      ] },
    { id: 'osm', no: 2, group: 'basic', title: 'OSM 指标体系', lead: 'Objective–Strategy–Measurement：从北极星目标倒推策略与指标，避免堆砌无用数字。',
      blocks: [
        { t: 'p', x: '很多团队「什么指标都看，等于什么都没看」。OSM 用一条因果链把指标收敛到业务目标上。' },
        { t: 'dim', c: 'why', k: '原理', x: 'O（目标）是业务最终要达成的北极星；S（策略）是为达成目标采取的动作集合；M（度量）是衡量每条策略是否有效的指标。三者逐层拆解，保证每个指标都能回溯到目标。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '以「提升用户留存」为目标：策略拆成「提升新用户首周体验」「增强召回触达」；对应度量分别是「次日/7 日留存率」「Push 到达率与点击率」。用 MECE 原则保证策略间不重不漏。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '警惕「虚荣指标」：PV、注册数这类只涨不跌的数字容易好看但无决策价值。OSM 要求每个 M 都能驱动一个动作（能干预、能复盘），否则砍掉。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '抖音本地生活团队目标=「提升团购核销率」。策略=优化核销链路+商家补贴。度量=核销率、核销时长中位数、补贴 ROI。每次迭代只看这两个 M，避免了被「页面访问量」这种虚荣指标带偏。' }
      ] },
    { id: 'three-tables', no: 3, group: 'basic', title: '用户行为三表', lead: 'events / users / sessions 三张表，几乎能覆盖 90% 的行为分析。',
      blocks: [
        { t: 'p', x: '做用户行为分析前，先把数据规整成三张范式表，后续漏斗、留存、路径分析都能复用。' },
        { t: 'dim', c: 'why', k: '原理', x: 'events 是「每次动作一条」（点击、曝光、下单），粒度最细；users 是「每个用户一条」的静态/慢变属性（年龄、城市、注册渠道）；sessions 是「每次访问一条」的会话聚合（起止时间、页面数）。三表通过 user_id、session_id 关联。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '埋点上报统一进 events（含 event_type、user_id、ts、props JSON）。T+1 跑批生成 users（最新快照）与 sessions（按 30 分钟无操作切分会话）。建索引 user_id+ts。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '事件表极易膨胀，必须按时间分区（如按天）并设 TTL；props 用 JSON 而非无限加列，否则 schema 失控。会话切分阈值别硬套 30 分钟，要看业务实际间隔分布。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '某内容 App 想看「看完视频 A 的用户会不会点关注」。直接 events 自连接：筛选 event_type 序列，关联 users 看这些用户的 7 日留存是否更高，验证内容推荐策略。' },
        { t: 'code', lang: 'sql', x: "-- 统计每个会话的平均事件数\nsELECT session_id,\n       COUNT(*)                    AS events,\n       MIN(ts)                    AS start_ts,\n       MAX(ts)                    AS end_ts\nFROM events\nGROUP BY session_id;" }
      ] },
    { id: 'kimball', no: 4, group: 'basic', title: '维度建模（Kimball）', lead: '星型模型：一张事实表 + 多张维度表，是数据仓库的事实标准。',
      blocks: [
        { t: 'p', x: 'Kimball 的维度建模用「星型 schema」平衡了查询性能与业务可读性，是绝大多数数仓的底座。' },
        { t: 'dim', c: 'why', k: '原理', x: '事实表存「发生了什么」的可加数值（销售额、件数）和外键；维度表存「在什么上下文发生」的描述属性（时间、商品、门店）。星形是事实表直接连维度表；雪花是把维度再规范化拆子表。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '先定「业务过程」（如下单），选「粒度」（一行=一订单行），列「维度」（谁/何时/何地/何物），再定「事实」（金额、数量）。遵循「一致性维度」原则让不同事实表共用同一维表。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '不要盲目雪花化——多一次 join 就多一分性能损耗，维度表的冗余换查询速度是划算的。事实表务必带「退化维度」（订单号）和审计字段（ETL 时间）。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '零售数仓：fact_sales（销售事实）+ dim_store / dim_product / dim_date / dim_promotion。分析师拖拽「门店层级 × 月份 × 促销」即可得到任意切片，无需写复杂 join。' },
        { t: 'code', lang: 'sql', x: "-- 星型查询：事实表 join 维度表\nSELECT d.month, p.category, SUM(f.amount) AS gmv\nFROM fact_sales f\nJOIN dim_date d    ON f.date_id = d.date_id\nJOIN dim_product p ON f.product_id = p.product_id\nWHERE d.year = 2024\nGROUP BY 1,2;" }
      ] },

    /* ============ 业务分析 ============ */
    { id: 'funnel', no: 5, group: 'business', title: '漏斗分析', lead: '把多步流程按先后顺序拆成环节，看每一步的转化与流失。',
      blocks: [
        { t: 'p', x: '漏斗是诊断「用户在哪里流失」最直观的工具，前提是步骤有序且互斥定义清晰。' },
        { t: 'dim', c: 'why', k: '原理', x: '漏斗 = 有序事件序列（曝光→点击→加购→支付）。每一层用户数是「完成到该步的累计人数」，相邻层比值即单步转化率，整体=末层/首层。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '用 events 按 user_id 取每步最早时间戳，再判定「是否到达第 N 步」。多步可用窗口函数或自连接。注意去重：同一用户多次进入流程只算一次。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '漏斗必须限定时间窗口，否则历史老用户会污染当前漏斗；且「步骤顺序」依赖业务，别用「并集」代替「有序序列」，否则转化会被高估。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '电商下单漏斗：商详页浏览→加购→提交订单→支付成功。发现「提交订单→支付」掉到 60%，排查是支付方式不全，补齐后整体转化提升 8 个点。' },
        { t: 'code', lang: 'sql', x: "-- 各步骤去重人数\nWITH steps AS (\n  SELECT user_id,\n    MAX(CASE WHEN event_type='view'   THEN 1 ELSE 0 END) AS s1,\n    MAX(CASE WHEN event_type='addcart'THEN 1 ELSE 0 END) AS s2,\n    MAX(CASE WHEN event_type='pay'    THEN 1 ELSE 0 END) AS s3\n  FROM events GROUP BY user_id)\nSELECT SUM(s1) step1, SUM(s2) step2, SUM(s3) step3,\n       ROUND(SUM(s3)*1.0/SUM(s1),3) AS cvr\nFROM steps;" }
      ] },
    { id: 'retention', no: 6, group: 'business', title: '留存与队列', lead: '留存衡量「用户是否还会回来」，是增长健康的体温计。',
      blocks: [
        { t: 'p', x: '拉新烧钱、留存赚钱。留存曲线不衰减的业务才值得规模化投放。' },
        { t: 'dim', c: 'why', k: '原理', x: '某日（或某周）新增的用户集合叫一个 cohort（队列），追踪他们在之后第 N 天/周是否仍活跃，得到留存率曲线。曲线趋于平缓的平台值即「自然留存」。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '以「注册日」为 cohort 标记，用 events 里后续活跃日期算留存。典型写法：注册表 LEFT JOIN 活跃表，按 datediff 分桶。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '区分「次日留存」（看首体验）与「长期留存」（看价值）。别用「累计留存」美化曲线，要看「第 N 日仍活跃」的单一窗口口径，否则会虚高。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '网课 App 发现「第 7 日留存」只有 12%，但完成首节课的用户第 7 日留存达 45%。于是把「引导完成首节课」作为新用户核心策略，整体留存翻倍。' },
        { t: 'code', lang: 'sql', x: "-- 次日/7日留存\nSELECT r.reg_date,\n  COUNT(DISTINCT r.user_id)                         AS new_users,\n  COUNT(DISTINCT a1.user_id)                        AS d1,\n  COUNT(DISTINCT a7.user_id)                        AS d7\nFROM registrations r\nLEFT JOIN activity a1 ON r.user_id=a1.user_id AND a1.dt = date(r.reg_date,'+1 day')\nLEFT JOIN activity a7 ON r.user_id=a7.user_id AND a7.dt = date(r.reg_date,'+7 day')\nGROUP BY 1;" }
      ] },
    { id: 'rfm', no: 7, group: 'business', title: 'RFMF 用户分层', lead: '用最近消费、频次、金额三个维度给用户打分分层，指导差异化运营。',
      blocks: [
        { t: 'p', x: 'RFM 是成本极低、解释性极强的用户分层方法，比盲目群发精准得多。' },
        { t: 'dim', c: 'why', k: '原理', x: 'R(Recency)最近一次消费距今天数、F(Frequency)消费频次、M(Monetary)消费金额。三者分别反映「用户还活不活」「黏不黏」「值不值」。各自分位打分(1-5)后组合成人群。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '先聚合每个用户的 R/F/M 原始值，用 NTILE(5) 或分位数切箱打分，再按阈值拼成标签（如重要价值用户=R高F高M高）。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: 'R/F/M 量纲不同，不能直接相加。分箱边界要随业务调整（高频低客单 vs 低频高客单含义不同）。分层后必须落到「运营动作」上，否则分层毫无意义。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '美妆电商：把「R 高 F 高 M 高」的 2% 用户进私域 VIP 群做专属上新；「R 低 M 高」的流失高价值用户用召回券唤醒，ROI 远高于全量发券。' },
        { t: 'code', lang: 'sql', x: "-- RFM 打分\nWITH base AS (\n  SELECT user_id,\n    julianday('2024-08-12') - julianday(MAX(date(ts))) AS recency,\n    COUNT(*)                                          AS frequency,\n    SUM(amount)                                       AS monetary\n  FROM orders GROUP BY user_id)\nSELECT user_id,\n  NTILE(5) OVER (ORDER BY recency)   AS R,\n  NTILE(5) OVER (ORDER BY frequency) AS F,\n  NTILE(5) OVER (ORDER BY monetary)  AS M\nFROM base;" }
      ] },
    { id: 'aarrr', no: 8, group: 'business', title: 'AARRR 海盗模型', lead: '获取-激活-留存-收益-自传播，五段式拆解增长漏斗。',
      blocks: [
        { t: 'p', x: 'AARRR 把增长拆成五个可独立优化的环节，方便定位瓶颈在哪一段。' },
        { t: 'dim', c: 'why', k: '原理', x: 'Acquisition 获取、Activation 激活（首体验达标）、Retention 留存、Revenue 变现、Referral 自传播。每一段都有核心指标，漏桶里先补最漏的那块。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '为每环节定义唯一北极星子指标（如激活=完成关键行为）。用三表+漏斗+留存的组合分别度量。关注「病毒系数 K=邀请数×转化率」是否>1。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: 'AARRR 适合早期拉新驱动的产品；成熟产品更应关注「留存×变现」而非一味买量。别五段平均用力，用数据找最短板。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: 'SaaS 工具发现获取成本飙升但激活率仅 30%。把预算从投放挪到「新手引导优化」，激活率提到 55% 后，同等获客下的付费转化明显提升。' }
      ] },
    { id: 'cohort', no: 9, group: 'business', title: '同期群分析', lead: '不只看整体均值，而是按「同一批人」分组追踪，避免被新用户稀释。',
      blocks: [
        { t: 'p', x: '整体指标上涨可能只是新用户涌入的假象，同期群分析能看清真老用户的真实趋势。' },
        { t: 'dim', c: 'why', k: '原理', x: '按「进入时间点」把用户分群（如按注册周），观察每个群随自身生命周期的指标变化。对比「群间」而非只看「时间轴」整体，能看到 cohort 曲线的真实形状。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '给用户打 cohort_id（如注册周 ISO 周），再按 (cohort_id, 相对周期) 聚合。结果通常画成三角热力图。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '周期单位要统一（日/周/月），跨群对比时保证观察窗口一致。新 cohort 样本小、波动大，别对最新一两群过度解读。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '视频会员：2024-W01  cohorts 第 3 月续费率 70%，W20 cohorts 降到 52%。同期群下滑说明近期产品体验或内容供给有问题，而非整体续费口径变化。' },
        { t: 'code', lang: 'sql', x: "-- 按注册周分群，看各群第 1/2/3 月付费率\nSELECT strftime('%Y-%W', reg_date) AS cohort,\n       CAST((julianday(pay_date)-julianday(reg_date))/30 AS INT) AS month_offset,\n       COUNT(DISTINCT u.user_id) AS paying\nFROM users u JOIN orders o ON u.user_id=o.user_id\nGROUP BY 1,2 ORDER BY 1,2;" }
      ] },
    { id: 'yoy', no: 10, group: 'business', title: '同比 / 环比 / 复合增长', lead: '用对「比什么」，增长率才有可比性。',
      blocks: [
        { t: 'p', x: '同比看长期趋势、环比看短期波动、复合增长看稳态速度，三者互补。' },
        { t: 'dim', c: 'why', k: '原理', x: '同比(YoY)=与去年同期比，消除季节；环比(MoM)=与上一周期比，敏感但受噪声干扰；CAGR=复合年均增长率，=(末期/初期)^(1/年数)-1，抹平波动看长期斜率。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '同比用 LAG(值, 12) 在按月序列上取去年；环比用 LAG(值,1)；CAGR 直接算。配合时间维度表做日期对齐。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '同比要小心「基数效应」：去年因事故极低，今年涨 200% 不代表健康。环比遇春节等需做工作日调整。CAGR 掩盖了中途大跌，需结合曲线看。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '连锁餐饮：8 月营收同比+15%（正常，受新店驱动），但环比-3%（暑期旺季回落），CAGR 三年 22%（扩张期健康）。单看环比会误判，三者结合才全面。' },
        { t: 'code', lang: 'sql', x: "-- 按月 GMV 同比\nSELECT month,\n       gmv,\n       LAG(gmv,12) OVER (ORDER BY month)                 AS last_year,\n       ROUND((gmv-LAG(gmv,12) OVER (ORDER BY month))*100.0\n             /LAG(gmv,12) OVER (ORDER BY month),2)        AS yoy_pct\nFROM monthly_gmv;" }
      ] },

    /* ============ 统计推断 ============ */
    { id: 'dist', no: 11, group: 'stat', title: '描述统计与分布', lead: '均值会骗人，先看分布形状再看集中趋势。',
      blocks: [
        { t: 'p', x: '在建模前，先理解数据的分布特征，否则模型假设很可能不成立。' },
        { t: 'dim', c: 'why', k: '原理', x: '集中趋势（均值/中位数/众数）、离散程度（方差/标准差/四分位距）、形状（偏度/峰度）。长尾分布用中位数比均值稳健；方差大说明数据噪声高。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '先画直方图/箱线图看形状；用 describe() 看四分位；检查偏度。对右偏数据考虑取对数。异常值用 IQR 法则（>Q3+1.5IQR）初筛。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '均值对离群点极敏感——收入均值被富豪拉高，此时中位数更可信。不要只报一个数字，要报「均值±标准差」或分布形态。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '某平台「客单价」均值 320 元，但中位数仅 89 元——少数大额 B 端订单拉高了均值。运营若按均值定促销门槛会误伤绝大多数用户，应看中位数与分位数。' },
        { t: 'code', lang: 'python', x: "import pandas as pd\nimport numpy as np\ndf = pd.read_csv('orders.csv')\nprint(df['amount'].describe())          # 均值/分位数\nprint('skew=', df['amount'].skew())      # 右偏程度\nq1, q3 = df['amount'].quantile([.25,.75])\niqr = q3 - q1\nout = df[df['amount'] > q3 + 1.5*iqr]   # IQR 异常值" }
      ] },
    { id: 'hypo', no: 12, group: 'stat', title: '假设检验与 p 值', lead: '用反证法判断「差异是真实存在，还是随机噪声」。',
      blocks: [
        { t: 'p', x: '做 A/B 或任何对比前，必须先会读 p 值，否则容易把噪声当结论。' },
        { t: 'dim', c: 'why', k: '原理', x: '原假设 H0=「无差异」。p 值是在 H0 成立下，观察到当前（或更极端）结果的概率。p<α(常取0.05)则拒绝 H0，认为差异显著。注意 p 小≠效应大，只是「不太可能是巧合」。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '选检验：两独立样本均值用 t 检验，比例用卡方/比例 z 检验，配对用配对 t 检验。先验明单侧/双侧，再算 p。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '别做「p-hacking」：反复切分数据直到显著。样本太小 p 不稳，太大则微小差异也「显著」但无意义。p 值不是效应大小的度量。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '新首页改版后点击率 5.2% vs 旧版 5.0%。t 检验 p=0.03 显著，但提升仅 0.2pt，需结合流量成本判断是否值得全量——显著不等于值得做。' },
        { t: 'code', lang: 'python', x: "from scipy import stats\nimport numpy as np\na = np.random.binomial(1, 0.052, 20000)   # 新版本\nb = np.random.binomial(1, 0.050, 20000)   # 旧版本\nt, p = stats.ttest_ind(a, b)\nprint('p=%.4f' % p, '显著' if p < 0.05 else '不显著')" }
      ] },
    { id: 'ci', no: 13, group: 'stat', title: '置信区间', lead: '点估计不可靠，给估计加上「误差范围」才有决策依据。',
      blocks: [
        { t: 'p', x: '一个转化率 5% 和「5% ± 0.8%（95% CI）」信息量天差地别。' },
        { t: 'dim', c: 'why', k: '原理', x: '95% 置信区间表示：重复抽样下，约有 95% 的样本算出的区间会覆盖真实参数。区间越窄，估计越精确（样本越大越窄）。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '比例类：p ± 1.96·√(p(1-p)/n)；均值类：x̄ ± t·s/√n。报告指标时一律附带 CI，而非只给点估计。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '置信区间重叠≠差异不显著，两者检验逻辑不同。样本极小时间隔会极宽，此时点估计几乎不可用。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '两版按钮转化率分别为 5.1%(CI 4.6–5.6%) 与 5.3%(CI 4.8–5.8%)，区间大量重叠，虽点估计略高但无法确认赢，需继续放量或加样本。' }
      ] },
    { id: 'abtest', no: 14, group: 'stat', title: 'A/B 实验设计', lead: '对照、随机、先验功效，是可信实验的三支柱。',
      blocks: [
        { t: 'p', x: '没设计好的实验得出的「结论」，比没有结论更危险。' },
        { t: 'dim', c: 'why', k: '原理', x: '核心是「单一变量 + 随机分流 + 对照」。随机保证两组可比；样本量由预期效应大小、方差、显著性α、功效(1-β)共同决定（通常要 80% 功效）。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '先定指标与 MDE（最小可检测效应），用功效公式算样本量；随机哈希分流；跑满周期（含完整周）再读数；用 t 检验/比例检验判显著。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '别中途偷看后 early-stop 造成假阳性（需序贯检验修正）；警惕新奇效应（短期好长期回归）；分流必须覆盖完整业务周期，避免周末偏差。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '外卖 App 改派单算法，先验得需每边 5 万单才够功效。跑两周后实验组送达时长 -40 秒且显著，才全量上线；若只看前 3 天会误判，因节假日样本结构不同。' },
        { t: 'code', lang: 'python', x: "from statsmodels.stats.power import NormalIndPower\nfrom statsmodels.stats.proportion import proportion_effectsize as es\n# 基线 0.05，想检出 +10% 相对提升，80% 功效\nd = es(0.055, 0.05)\nn = NormalIndPower().solve_power(effect_size=d, alpha=0.05, power=0.8, ratio=1, alternative='two-sided')\nprint('每组需样本:', int(n))" }
      ] },
    { id: 'bayes', no: 15, group: 'stat', title: '贝叶斯推断', lead: '用先验+数据更新出后验，天然处理小样本与不确定性。',
      blocks: [
        { t: 'p', x: '当样本很少或需要持续更新信念时，贝叶斯比频率派更贴合直觉。' },
        { t: 'dim', c: 'why', k: '原理', x: '后验 ∝ 先验 × 似然。先验编码已有经验，新数据作为似然不断修正，得到随证据更新的后验分布，直接给出「参数落在某区间的概率」。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '转化率可用 Beta(α,β) 共轭先验：每来一次成功/失败就 α/β +1，后验仍是 Beta，直接读分位数。复杂模型用 MCMC（如 PyMC）采样。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '先验不能乱设——强先验在小样本时会主导结果，需做敏感性分析。贝叶斯结果依赖模型设定，后验好不等于模型对。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '新功能刚上线 200 次曝光 8 次点击，频率派点估计 4% 但方差大。用 Beta(1,1) 先验得后验 Beta(9,193)，95% 区间约 2–7%，诚实反映「还不确定」，避免过早下结论。' },
        { t: 'code', lang: 'python', x: "from scipy.stats import beta\n# 先验 Beta(1,1)，观测 8 成功 / 192 失败\na, b = 1+8, 1+192\nlo, hi = beta(a,b).ppf([0.025, 0.975])\nprint('95%% 后验区间: %.3f ~ %.3f' % (lo, hi))" }
      ] },

    /* ============ 经典统计与计量模型 ============ */
    { id: 'lm', no: 16, group: 'econometric', title: '线性回归', lead: 'Y = βX + ε，最可解释、最该先试的基线模型。',
      blocks: [
        { t: 'p', x: '在堆复杂模型前，永远先跑一个线性回归当基线——很多业务问题它就够了。' },
        { t: 'dim', c: 'why', k: '原理', x: '用最小二乘拟合因变量 Y 与自变量 X 的线性关系，β 即边际效应。假定残差独立、同方差、无多重共线性。R² 衡量解释力。' },
        { t: 'dim', c: 'how', k: '如何操作', x: 'statsmodels.OLS 或 sklearn.LinearRegression。先看残差图是否随机（非漏斗形），再做预测。连续型预测（如 GMV 预估）首选。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '线性回归对异常值敏感；非线关系需加多项式/交互项；多重共线性会让系数不稳（看 VIF）。它给的是「关联」不是「因果」。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '连锁店用「面积+周边人口+竞品数」线性回归预测新店月销售额，R²=0.78，开店前即可筛掉回本无望的点位，比拍脑袋准。' },
        { t: 'code', lang: 'python', x: "import statsmodels.api as sm\nX = sm.add_constant(df[['area','population','competitors']])\nmodel = sm.OLS(df['sales'], X).fit()\nprint(model.summary())   # 看 coef / p值 / R-squared" }
      ] },
    { id: 'logit', no: 17, group: 'econometric', title: '逻辑回归', lead: '把线性组合套 sigmoid，输出 0~1 的概率，分类基线。',
      blocks: [
        { t: 'p', x: '预测「会不会买/会不会流失」这类二分类，逻辑回归可解释又够用。' },
        { t: 'dim', c: 'why', k: '原理', x: 'P(y=1)=sigmoid(βX)。输出是概率，系数可解释为「特征变动一单位，对数几率的变化」，经 exp() 得优势比(odds ratio)，业务极好讲。' },
        { t: 'dim', c: 'how', k: '如何操作', x: 'sklearn.LogisticRegression 或 statsmodels.Logit。需注意类别不平衡（用 class_weight / 采样）。输出概率再按业务阈值切 0/1。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '默认 0.5 阈值未必最优，按代价矩阵调阈值（如流失代价高就调低）。它假设线性可分边界，复杂边界需上树模型。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '信用卡风控：用收入、负债比、历史逾期训练逻辑回归预测违约概率，系数直接告诉风控「负债比每升 1 单位，违约 odds 涨 1.3 倍」，监管友好、可审计。' },
        { t: 'code', lang: 'python', x: "import numpy as np\nfrom sklearn.linear_model import LogisticRegression\nX = df[['income','debt_ratio','age']].values\ny = df['default'].values\nm = LogisticRegression(class_weight='balanced').fit(X, y)\nprint('odds ratio:', np.exp(m.coef_[0]))" }
      ] },
    { id: 'regularize', no: 18, group: 'econometric', title: '正则化 Ridge / Lasso', lead: '给系数加惩罚，治过拟合与多重共线，Lasso 还能做特征选择。',
      blocks: [
        { t: 'p', x: '当特征多、相关性高时，普通回归系数会剧烈震荡，正则化把它稳住。' },
        { t: 'dim', c: 'why', k: '原理', x: 'Ridge(L2) 惩罚 β²，缩小但不归零；Lasso(L1) 惩罚 |β|，能把不重要系数压成 0，等价于自动特征选择。两者都通过 λ 控制惩罚强度。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '用 Ridge / Lasso（或 ElasticNet 混合）。务必先标准化特征（惩罚对量纲敏感）。用交叉验证选 λ（LassoCV）。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: 'Lasso 在高度相关特征中只会随机保留一个，解释性要小心。λ 过大欠拟合、过小没效果，必须靠 CV 曲线定。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '房价预测有 80 个地段/户型特征且高度相关。Lasso 自动筛到 12 个关键特征，模型更稳、更易向业务方解释「哪些因子真正影响定价」。' },
        { t: 'code', lang: 'python', x: "from sklearn.linear_model import LassoCV\nfrom sklearn.preprocessing import StandardScaler\nXs = StandardScaler().fit_transform(df.drop('price',1))\nm = LassoCV(cv=5).fit(Xs, df['price'])\nprint('选中的特征数:', (m.coef_!=0).sum())" }
      ] },
    { id: 'ts', no: 19, group: 'econometric', title: '时间序列 ARIMA / Prophet', lead: '带时间依赖的数据，要用专门的时间模型而非普通回归。',
      blocks: [
        { t: 'p', x: '销量、流量、股价这类按时间排序且自相关的数据，普通回归会失效。' },
        { t: 'dim', c: 'why', k: '原理', x: 'ARIMA(p,d,q) 用「过去值(AR)+差分(I 去趋势)+移动平均(MA)」建模；Prophet 把趋势+季节+节假日分解，对缺失/突变更鲁棒，业务友好。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '先看 ACF/PACF 定阶或用 auto_arima；Prophet 只需喂 ds/y 两列，加节假日表即可。务必做滚动预测(rolling)而非一次性拟合评估。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '时间序列对异常点极敏感，先清洗再建模。外生变量（如促销）要作为 regressor 引入，否则预测会系统性偏差。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '生鲜电商用 Prophet 预测次日各仓销量，叠加「周末/大促」节假日项，将报损率从 8% 降到 4%，直接省下千万级损耗。' },
        { t: 'code', lang: 'python', x: "from prophet import Prophet\ndf = pd.DataFrame({'ds': dates, 'y': sales})\nm = Prophet(weekly_seasonality=True, yearly_seasonality=False)\nm.add_country_holidays('CN')\nm.fit(df)\nfuture = m.make_future_dataframe(periods=30)\nfc = m.predict(future)" }
      ] },

    /* ============ 监督学习 ============ */
    { id: 'tree', no: 20, group: 'supervised', title: '决策树', lead: '用一连串 if-else 切分特征空间，最易解释的非线性模型。',
      blocks: [
        { t: 'p', x: '决策树是随机森林/XGBoost 的基石，理解了它才懂集成。' },
        { t: 'dim', c: 'why', k: '原理', x: '每节点选「信息增益/基尼不纯度下降最大」的特征切分，递归直到纯净或达到深度。本质是把特征空间切成矩形区域，各区域给同一个预测值。' },
        { t: 'dim', c: 'how', k: '如何操作', x: 'sklearn.DecisionTreeClassifier/Regressor。控制 max_depth、min_samples_leaf 防过拟合。画出的树能直接给业务方讲「为什么预测流失」。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '单棵树的致命缺点是方差大、对数据微小变动敏感、易过拟合。这也是为什么要用森林/提升来集成。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '银行用浅层决策树做信贷初筛规则：「若负债比>0.5 且 收入<阈值 → 拒」。规则透明、监管可审，是很多强监管场景的刚需。' },
        { t: 'code', lang: 'python', x: "from sklearn.tree import DecisionTreeClassifier, plot_tree\nm = DecisionTreeClassifier(max_depth=4, min_samples_leaf=50)\nm.fit(X, y)\n# plot_tree(m) 即可可视化规则路径" }
      ] },
    { id: 'rf', no: 21, group: 'supervised', title: '随机森林', lead: 'Bagging 多棵树投票，你点名要的硬核主力模型。',
      blocks: [
        { t: 'p', x: '随机森林通过「样本抽样 + 特征抽样」训练大量决策树再集成，兼顾精度与稳健，是工业界最常用的基线模型之一。' },
        { t: 'dim', c: 'why', k: '原理', x: 'Bagging（Bootstrap Aggregating）：对训练集做有放回抽样得到多份子样本，每棵决策树看全部特征；预测时分类取众数、回归取均值。两处随机（行抽样 + 节点分裂时随机候选特征子集）降低了树间相关性，使集成方差远小于单棵树，从而显著提升泛化。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '用 sklearn.ensemble.RandomForestClassifier/Regressor。关键参数：n_estimators（树数，80~300 足够）、max_features（分类常用 √p，回归 p/3）、max_depth/min_samples_leaf（控过拟合）。训练后可用 feature_importances_ 看特征重要性，用 oob_score_（袋外误差）在无需单独验证集的情况下估计泛化。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '（1）森林再深也还是「矩形切分」，学不了 XOR 这类线性不可分边界；（2）类别极不平衡时要设 class_weight 或上采样，否则多数类主导；（3）特征重要性会被高基数特征（如用户ID）虚高误导，需结合业务；（4）相比单棵树，森林黑盒化、可解释性下降，可用 SHAP 补偿。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '某电商用随机森林预测「用户未来 30 天是否会复购」。特征含最近消费间隔、历史频次、客单价、品类广度、促销敏感度。模型 AUC 0.86，oob 误差 11%；用 SHAP 发现「最近一次消费距今天数」重要性最高，于是把唤醒券优先投放给 R 分高但暂未复购的人群，召回 ROI 提升 2.3 倍。相比逻辑回归，森林自动吃下了特征间的非线性交互，无需人工构造交叉项。' },
        { t: 'code', lang: 'python', x: "from sklearn.ensemble import RandomForestClassifier\nm = RandomForestClassifier(\n    n_estimators=200, max_features='sqrt',\n    min_samples_leaf=40, class_weight='balanced',\n    oob_score=True, random_state=42, n_jobs=-1)\nm.fit(X, y)\nprint('OOB 误差:', round(1-m.oob_score_, 3))\nprint('特征重要性:', dict(zip(features, m.feature_importances_.round(3))))" }
      ] },
    { id: 'gbm', no: 22, group: 'supervised', title: 'XGBoost / LightGBM', lead: 'Boosting 串行纠错，表格数据竞赛的常胜将军。',
      blocks: [
        { t: 'p', x: '当数据是结构化表格（非图像/文本），GBDT 系模型往往吊打深度学习。' },
        { t: 'dim', c: 'why', k: '原理', x: 'Boosting 串行训练：每棵新树专门拟合前一棵的残差，逐步把偏差压低。XGBoost 用二阶泰勒展开+正则项；LightGBM 用直方图算法和 leaf-wise 生长，速度更快、内存更省。' },
        { t: 'dim', c: 'how', k: '如何操作', x: 'LightGBM/XGBoost 的 Dataset 接口。调参顺序：先定 learning_rate 与 num_boost_round（用 early_stopping），再调 max_depth、min_child_weight、subsample、colsample_bytree、lambda。类别特征 LightGBM 可直接 categorical 处理。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: 'Boosting 对异常值/噪声更敏感（残差会被放大），务必做离群处理。leaf-wise 容易过拟合深层叶子，要限制 max_depth 与 min_data_in_leaf。它仍是表格数据的 SOTA，但可解释弱于树/线性。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '支付风控反欺诈：用 LightGBM 在千万级交易上训练，特征含设备指纹、行为序列统计、历史欺诈关联。AUC 0.97，相比随机森林提升 3 个点，且直方图算法把训练时间从 2 小时压到 12 分钟，支撑准实时风控。' },
        { t: 'code', lang: 'python', x: "import lightgbm as lgb\ndtrain = lgb.Dataset(X, y, categorical_feature=cat_cols)\nparams = {'objective':'binary','metric':'auc','learning_rate':0.05,\n          'num_leaves':63,'min_child_samples':50,'subsample':0.8}\nm = lgb.train(params, dtrain, num_boost_round=500,\n              valid_sets=[dtrain], callbacks=[lgb.early_stopping(30)])" }
      ] },
    { id: 'svm', no: 23, group: 'supervised', title: '支持向量机 SVM', lead: '找最大间隔超平面，核技巧处理非线性。',
      blocks: [
        { t: 'p', x: 'SVM 在小样本、高维（如文本分类）场景仍有价值，核心是「间隔最大化」。' },
        { t: 'dim', c: 'why', k: '原理', x: '在两类间找一条使最近样本（支持向量）间隔最大的分割超平面。低维不可分时用核函数（RBF/多项式）把数据映射到高维使其线性可分，无需显式计算映射。' },
        { t: 'dim', c: 'how', k: '如何操作', x: 'sklearn.SVC(kernel=‘rbf’, C=…, gamma=…)。C 控制容错（大=C 硬间隔易过拟合），gamma 控制单样本影响半径。需严格特征标准化。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: 'SVM 对尺度极敏感，必须标准化；大数据集训练慢(O(n²~n³))，不适合超大规模；多分类是 one-vs-rest 拼的。如今表格数据多在 GBDT、文本多在深度模型，SVM 用得少了但概念仍重要。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '早期垃圾邮件分类：把邮件转 TF-IDF 向量后上线性 SVM，在小标注集上就能达到 98% 准确率，且模型小、推理快，适合边缘部署。' },
        { t: 'code', lang: 'python', x: "from sklearn.svm import SVC\nfrom sklearn.preprocessing import StandardScaler\nXs = StandardScaler().fit_transform(X)\nm = SVC(kernel='rbf', C=1.0, gamma='scale', probability=True)\nm.fit(Xs, y)" }
      ] },
    { id: 'knn-bayes', no: 24, group: 'supervised', title: 'KNN 与朴素贝叶斯', lead: '两个「懒惰/生成」式基线模型，便宜好用、适合兜底。',
      blocks: [
        { t: 'p', x: '当想快速验证问题可行性，或做 baseline 对照时，这两个模型出奇地好用。' },
        { t: 'dim', c: 'why', k: '原理', x: 'KNN 是「懒惰学习」：预测时找最近的 K 个邻居投票，无需训练（但推理慢）。朴素贝叶斯基于贝叶斯定理并假设特征条件独立，用先验×似然直接算后验，训练极快。' },
        { t: 'dim', c: 'how', k: '如何操作', x: 'KNN 用 sklearn.KNeighborsClassifier，务必标准化并选好 K（奇数防平局）；朴素贝叶斯按特征类型选 GaussianNB / MultinomialNB（文本用后者）。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: 'KNN 对尺度与维度灾难敏感、推理随样本线性变慢，高维慎用。朴素贝叶斯的「特征独立」假设常不成立，但实践中仍 robust，不要因为它「不真实」就轻视。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '新闻分类冷启动：用 MultinomialNB + TF-IDF 在几万篇标注文章上训练，分钟级出模型，作为新渠道上线的基线，再逐步替换成大模型方案。' }
      ] },
    { id: 'eval', no: 25, group: 'supervised', title: '模型评估', lead: '混淆矩阵、ROC/AUC、PR 曲线——选错指标模型就白做。',
      blocks: [
        { t: 'p', x: '「准确率 99%」在欺诈检测里可能是废话（因为 99% 都是正常样本）。评估指标必须匹配业务目标。' },
        { t: 'dim', c: 'why', k: '原理', x: '混淆矩阵拆出 TP/FP/FN/TN；精确率=TP/(TP+FP)（预测准不准）、召回率=TP/(TP+FN)（抓得全不全）。ROC 看不同阈值下 TPR vs FPR，AUC 是整体判别力；PR 曲线在不平衡数据下比 ROC 更诚实。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '用 sklearn.metrics 算 precision/recall/f1/roc_auc_score，画 roc_curve / precision_recall_curve。结合交叉验证取均值±方差，别只看一次切分。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '不平衡数据下准确率失真，看 PR-AUC 而非 ROC-AUC；阈值要按「漏判代价 vs 误判代价」定（欺诈漏判远贵于误判）；离线指标好不等于线上业务好，要做线上 AB。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '贷款违约预测：宁愿多拦一些好人（误判）也不放过一个坏账（漏判），故把阈值调高使召回优先，并接受较低精确率；用 PR 曲线在 0.3 阈值处达到 0.9 召回，满足风控底线。' },
        { t: 'code', lang: 'python', x: "from sklearn.metrics import classification_report, roc_auc_score\nprint(classification_report(y_true, y_pred))\nprint('AUC:', round(roc_auc_score(y_true, y_prob),3))" }
      ] },
    { id: 'fe', no: 26, group: 'supervised', title: '特征工程', lead: '模型上限由特征决定，调参只是逼近上限。',
      blocks: [
        { t: 'p', x: '在结构化数据上，花在特征上的时间通常比换模型更值钱。' },
        { t: 'dim', c: 'why', k: '原理', x: '特征工程把原始数据转化成模型易学的形式：数值归一/标准化、类别编码（one-hot / target / 频次）、时间特征（星期、节假日、间隔）、交叉与聚合特征。好的特征让简单模型也变强。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '连续值做分箱/标准化；高基数类别用 target encoding（注意防泄露，用交叉平均）；构造「用户近 7 日行为」等时序聚合；用特征重要性/互信息筛选。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '最大的坑是「数据泄露」：用到了未来信息（如用全量 target 编码）。任何基于标签的统计必须在训练折叠内计算。还要防训练/推理特征不一致（线上用到的字段线下也要有）。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '外卖送达时长预测：原始只有下单时间、距离，工程后加「该骑手近 30 单平均时长」「商圈同时段单量」「天气等级」等特征，MAE 从 6.2 分钟降到 4.1 分钟——换模型都没这收益。' },
        { t: 'code', lang: 'python', x: "# 防止泄露的 target encoding（按折交叉平均）\nfrom sklearn.model_selection import KFold\ndf['cat_enc'] = 0\nglobal_mean = df['y'].mean()\nfor tr, va in KFold(5).split(df):\n    m = df.iloc[tr].groupby('cat')['y'].mean()\n    df.loc[va, 'cat_enc'] = df.iloc[va]['cat'].map(m).fillna(global_mean)" }
      ] },

    /* ============ 无监督学习 ============ */
    { id: 'kmeans', no: 27, group: 'unsupervised', title: 'K-Means 聚类', lead: '把样本按距离分成 K 个簇，做用户分群最常用。',
      blocks: [
        { t: 'p', x: '没有标签时，聚类能帮你发现数据里自然存在的群体结构。' },
        { t: 'dim', c: 'why', k: '原理', x: '迭代两步：把每个点分给最近的质心，再重算质心位置，直至收敛。目标是最小化簇内平方和(WCSS)。假设簇是凸的、大小相近。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '先标准化（距离对尺度敏感）。K 用肘部法则(elbow)或轮廓系数(silhouette)选。k-means++ 初始化避免坏局部最优。多跑几次取最佳。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: 'K-Means 对异常值、簇形状非凸、密度不均都很敏感；K 需人工定。结果只给簇编号，还要人去解释「这个簇是谁」。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '运动 App 用消费、活跃、社交三类行为 K-Means 分 5 群，发现「高活跃零消费」群，针对性推会员体验卡，该群付费转化提升 18%。' },
        { t: 'code', lang: 'python', x: "from sklearn.cluster import KMeans\nfrom sklearn.preprocessing import StandardScaler\nXs = StandardScaler().fit_transform(features)\nfor k in range(3,8):\n    s = KMeans(k, n_init=10).fit(Xs).inertia_   # WCSS 肘部\n    print(k, round(s,1))" }
      ] },
    { id: 'hier-dbscan', no: 28, group: 'unsupervised', title: '层次聚类 / DBSCAN', lead: '当簇形状不规则或数量未知时的替代方案。',
      blocks: [
        { t: 'p', x: 'K-Means 的 convexity 假设太强时，这两个方法更适配真实数据。' },
        { t: 'dim', c: 'why', k: '原理', x: '层次聚类自底向上合并最近簇，得到树状图可切任意层；DBSCAN 基于密度：核心点邻域内样本够多则成簇，孤立点判为噪声，能发现任意形状簇且自动识别异常。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '层次聚类用 AgglomerativeClustering（选 linkage）。DBSCAN 调 eps（邻域半径）与 min_samples，eps 可用 k-距离图拐点定。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '层次聚类 O(n²~n³) 不适合大样本；DBSCAN 对 eps 极敏感、密度不均的数据表现差（此时用 HDBSCAN）。二者都需先标准化。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '地理围栏运营：用 DBSCAN 对门店经纬度聚类，自动圈出「高密度商圈」（簇）与「孤岛门店」（噪声），据此决定建仓与撤店，无需预先定 K。' }
      ] },
    { id: 'pca', no: 29, group: 'unsupervised', title: 'PCA 降维', lead: '用正交变换把高维压缩到低维，去冗余、可视化、提速度。',
      blocks: [
        { t: 'p', x: '特征几十上百时，PCA 既能降噪又能加速，是标准预处理。' },
        { t: 'dim', c: 'why', k: '原理', x: 'PCA 找数据方差最大的正交方向（主成分），按特征值排序保留前 k 个，使低维投影尽量保留原信息。累计解释方差比告诉你保留多少维够用。' },
        { t: 'dim', c: 'how', k: '如何操作', x: 'sklearn.decomposition.PCA，先标准化。看 explained_variance_ratio_.cumsum() 选 k（如累加到 0.95）。降维后可用于可视化(2D)或喂给下游模型。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: 'PCA 对尺度敏感必须标准化；主成分是原始特征的线性组合，可解释性变差（看 loading 解释）。它假设线性结构，流形类非线性数据要用 t-SNE/UMAP。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '用户画像有 60 个行为指标高度相关，PCA 压到 8 维后累计解释 92% 方差，下游随机森林训练提速 4 倍且 AUC 几乎不降，还顺带去掉了噪声维度。' },
        { t: 'code', lang: 'python', x: "from sklearn.decomposition import PCA\npca = PCA().fit(StandardScaler().fit_transform(X))\ncum = pca.explained_variance_ratio_.cumsum()\nk = (cum < 0.95).sum() + 1\nprint('保留维度:', k, '解释方差:', round(cum[k-1],3))" }
      ] },
    { id: 'apriori', no: 30, group: 'unsupervised', title: 'Apriori 关联规则', lead: '「买尿布的人也买啤酒」，从交易里挖频繁项集与规则。',
      blocks: [
        { t: 'p', x: '想做捆绑销售、货架陈列、推荐理由，关联规则是经典起点。' },
        { t: 'dim', c: 'why', k: '原理', x: '用「支持度(共现频率)」筛频繁项集，再用「置信度(条件概率)」和「提升度(lift，是否真相关)」生成规则 A→B。Apriori 靠「频繁项集的子集必频繁」剪枝。' },
        { t: 'dim', c: 'how', k: '如何操作', x: 'mlxtend 的 apriori + association_rules，设 min_support、min_threshold。重点看 lift>1 的规则才有正向关联。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: 'lift 高未必有因果，可能只是两商品都热销。支持度阈值太低会爆炸式产出规则，需结合业务筛选。大数据用 FP-Growth 更高效。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '便利店发现「关东煮 + 啤酒」lift=2.3，于是在晚间把两者就近陈列并做组合价，关联品类周销量提升 14%；同时识别「婴儿奶粉 + 啤酒」只是巧合（lift≈1），不盲目捆绑。' },
        { t: 'code', lang: 'python', x: "from mlxtend.frequent_patterns import apriori, association_rules\nfrequent = apriori(basket, min_support=0.02, use_colnames=True)\nrules = association_rules(frequent, metric='lift', min_threshold=1.2)\nprint(rules.sort_values('lift', ascending=False).head())" }
      ] },

    /* ============ 深度学习与前沿 ============ */
    { id: 'nn', no: 31, group: 'dl', title: '神经网络基础', lead: '多层感知机：线性变换 + 非线性激活的堆叠。',
      blocks: [
        { t: 'p', x: '理解前向传播、损失、反向传播，就握住了深度学习的钥匙。' },
        { t: 'dim', c: 'why', k: '原理', x: '每层 y=σ(Wx+b)，σ 为 ReLU 等非线性激活，多层叠加可逼近任意连续函数（万能近似定理）。训练用反向传播沿梯度更新 W，最小化损失。' },
        { t: 'dim', c: 'how', k: '如何操作', x: 'PyTorch/Keras 搭 Sequential，隐藏层 64~256、激活 ReLU、输出层按任务定（回归线性/分类 softmax）。优化器 Adam，配合 BatchNorm/Dropout 防过拟合。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '表格数据上 NN 常打不过 GBDT，别盲目上深度。要监控梯度消失/爆炸（用 BN、残差连接）。需要大量数据与算力，小数据易过拟合。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '广告 CTR 预估的底层特征交叉：把用户/广告/上下文 embedding 拼进全连接网络，相比纯 GBDT 多捕捉了高阶非线性交叉，CTR 预估 AUC 提升 1.5pt，带来可观收入。' },
        { t: 'code', lang: 'python', x: "import torch.nn as nn\nclass MLP(nn.Module):\n    def __init__(s, d):\n        super().__init__()\n        s.net = nn.Sequential(\n            nn.Linear(d,128), nn.ReLU(), nn.Dropout(0.3),\n            nn.Linear(128,64), nn.ReLU(),\n            nn.Linear(64,1), nn.Sigmoid())\n    def forward(s,x): return s.net(x)" }
      ] },
    { id: 'embedding', no: 32, group: 'dl', title: 'Embedding 与表示学习', lead: '把离散 ID/文本/图映射成稠密向量，让模型理解「语义距离」。',
      blocks: [
        { t: 'p', x: '几乎所有现代推荐/搜索/NLP 的底层，都是把对象变成向量后再算相似度。' },
        { t: 'dim', c: 'why', k: '原理', x: 'Embedding 是一个可学习的查找表，把高维 one-hot 稀疏 ID 压成低维稠密向量。语义相近的对象在向量空间里距离更近，相似度（内积/余弦）即可当打分。' },
        { t: 'dim', c: 'how', k: '如何操作', x: 'nn.Embedding 或 Keras Embedding 层接入；训练目标可以是协同过滤（矩阵分解）、对比学习或语言模型。训练完用向量做 KNN 召回/相似推荐。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '冷启动 ID 无向量（需 fallback 策略）；Embedding 维度要匹配数据量，过大过拟合。向量空间需周期性重训以保持新鲜。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '短视频推荐：把用户与视频各自 embedding 后做内积召回Top-N，再精排。新视频靠内容 embedding 冷启动，相似内容召回让长尾曝光提升 25%，破解马太效应。' }
      ] },
    { id: 'recsys', no: 33, group: 'dl', title: '推荐系统', lead: '召回→排序→重排，工业推荐的经典三段式架构。',
      blocks: [
        { t: 'p', x: '推荐不是单个模型，而是一条漏斗流水线，每阶段目标不同。' },
        { t: 'dim', c: 'why', k: '原理', x: '召回(Recall)从百万物料快速筛千级候选（协同过滤/向量检索）；排序(Ranking)用复杂模型对候选精打分类/打分；重排(Re-rank)叠加业务规则（多样性、去重、流量调控）。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '召回用 Item2Vec/双塔模型+ANN 检索(FAISS)；排序用 DeepFM/GBDT+NN 混合；重排用规则或 MMR。离线指标(AUC/GAUC)+ 在线 AB(时长/CTR)双看。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '警惕「信息茧房」与马太效应，重排要注入多样性/探索。线上分布偏移(drift)会让离线指标失真，需持续监控。隐私合规（如 IDFA 退场）倒逼转向上下文特征。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '电商首页「猜你喜欢」：双塔召回 2000 → DeepFM 排序 200 → 重排去重并穿插新品，整体 CTR 提升 12%、新品曝光占比翻倍，兼顾效率与生态健康。' },
        { t: 'code', lang: 'python', x: "import faiss\n# 双塔召回：用向量索引做 ANN 检索\nindex = faiss.IndexFlatIP(64)   # 内积\nindex.add(item_emb)             # 物料向量\nD, I = index.search(user_emb, 200)  # Top-200 候选" }
      ] },
    { id: 'gnn', no: 34, group: 'dl', title: '图神经网络 GNN', lead: '当数据天然是「关系网」时，图卷积比表格更合适。',
      blocks: [
        { t: 'p', x: '社交、交易、供应链都是图，GNN 能直接吃节点与边的关系信号。' },
        { t: 'dim', c: 'why', k: '原理', x: 'GNN 通过「消息传递」让每个节点聚合邻居表示来更新自身，多层后节点 embedding 融合了多跳邻域信息。GCN/GraphSAGE/GAT 是主流变体。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '用 PyG(DGL) 构建图（节点/边特征 + 邻接）。定义层数、聚合方式，做节点分类/链接预测/图分类。大图用 GraphSAGE 的采样邻居避免全图计算。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '图规模大时算力吃紧，需邻居采样；异构图/动态图更复杂。边的质量决定上限，噪声边会污染消息传递。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '反欺诈：把账户-设备-交易构造成图，GNN 捕捉「共享设备簇」异常模式，识别出传统规则漏掉的团伙欺诈，召回率比规则引擎高 40%。' }
      ] },

    /* ============ 工程化 ============ */
    { id: 'featurestore', no: 35, group: 'eng', title: '特征仓库 Feature Store', lead: '让离线训练与线上推理用同一套特征，根绝不一致。',
      blocks: [
        { t: 'p', x: '「线下效果好、线上翻车」十有八九是训练/推理特征不一致，Feature Store 就是为此而生。' },
        { t: 'dim', c: 'why', k: '原理', x: 'Feature Store 统一管理特征的定义、计算、存储，提供「离线」（用于训练，批计算）与「在线」（低延迟 KV，用于推理）两套一致视图，保证同一特征线上线下同源。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '用 Feast 等框架注册特征视图，离线存数仓/Parquet，在线同步到 Redis。训练时 point-in-time 正确拼接防泄露，推理时实时读取。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '引入 Feature Store 有运维成本，小团队未必需要；但一旦多模型共享特征，它省下的对账时间远超成本。注意特征版本管理，回滚要可追。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '某金融风控团队接入 Feast 后，模型和特征解耦，新模型上线周期从 3 周缩到 4 天，且再没出现过「线上线下特征对不上」导致的资损事故。' }
      ] },
    { id: 'monitor', no: 36, group: 'eng', title: '模型监控与漂移', lead: '模型上线不是终点，数据漂移会让它悄悄失效。',
      blocks: [
        { t: 'p', x: '世界在变，上个月的好模型这个月可能已退化，必须持续监控。' },
        { t: 'dim', c: 'why', k: '原理', x: '数据漂移(Data Drift)=输入分布变了；概念漂移(Concept Drift)=X→y 关系变了。二者都会让模型精度下滑。监控输入统计、预测分布与真实标签（有延迟）的差异。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '用 PSI(总体稳定性指数) 监控特征分布、KS 检验显著性；对延迟标签做滚动准确率；设告警阈值触发重训。保留模型版本以便回滚。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '标签常滞后数天到数周，不能等标签才监控，要结合输入漂移先行预警。告警过多会疲劳，阈值要按业务容忍度定。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '疫情前后用户消费行为剧变，某零售需求预测模型 PSI 周飙升超 0.25 触发告警，团队及时用新周期数据重训，避免了大促备货严重失准。' },
        { t: 'code', lang: 'python', x: "def psi(expected, actual, bins=10):\n    qs = np.linspace(0,100,bins+1)\n    cuts = np.percentile(expected, qs)\n    e = np.histogram(expected, cuts)[0] + 1e-6\n    a = np.histogram(actual,   cuts)[0] + 1e-6\n    return sum(((a-e)/e) * np.log(a/e))\nprint('PSI=', round(psi(train_x[:,0], prod_x[:,0]),3))" }
      ] },
    { id: 'fmap', no: 37, group: 'eng', title: '一切皆可学习的映射 f:X→y', lead: '回到开头：建模的本质，是把业务问题落成可学习的映射。',
      blocks: [
        { t: 'p', x: '走完八条线，回头看——所有模型都是同一个抽象：给定输入 X，学到映射 f，输出预测 y。' },
        { t: 'dim', c: 'why', k: '原理', x: '线性回归是线性 f，树模型是分段常数 f，神经网络是通用逼近 f。选择哪种，取决于数据量、可解释性要求、延迟与合规约束，而非「哪个最新」。' },
        { t: 'dim', c: 'how', k: '如何操作', x: '落地套路固定：定义业务目标与指标 → 选基线模型(线性/树) → 做特征工程 → 评估(匹配业务的指标) → 工程化(Feature Store/监控) → 线上 AB 验证。复杂模型只在基线不够时才上。' },
        { t: 'dim', c: 'warn', k: '注意事项', x: '不要为了用深度学习而用深度学习；不要在没想清「度量什么、怎么验证」前就调参。模型只是业务决策的放大器，错的度量会把决策放得更大。' },
        { t: 'dim', c: 'case', k: '业务实际运用举例', x: '回到本文开篇：一个「提升复购」的需求，先 OSM 拆成指标与策略，用 RFM + 随机森林定位高潜人群，用 A/B 验证唤醒券效果，用监控守住长期有效性——八条线串成一条完整价值链。' }
      ] }
  ]
};
