/* 学习路线图：阶段 -> 知识点 -> 题目 */
const ROADMAP = [
  {
    id: 's1', no: '01', title: '基础查询与过滤',
    desc: '先把「取数据」这件事练到不用想。这一阶段的题都不难，但面试时写错 WHERE 条件是最常见的翻车点。',
    goal: '看到需求能立刻拆成 SELECT / FROM / WHERE / ORDER BY 四块',
    kps: ['SELECT / WHERE', '比较与逻辑运算符', 'DISTINCT 去重', 'ORDER BY 排序', 'LIMIT / OFFSET 分页', 'LIKE / IN / BETWEEN', 'NULL 与 COALESCE']
  },
  {
    id: 's2', no: '02', title: '聚合与分组统计',
    desc: '从「取数据」进入「算指标」。GROUP BY 是数据分析岗的分水岭，条件聚合是这一阶段的核心武器。',
    goal: '能用一个 GROUP BY 算出多维指标，理解 WHERE 与 HAVING 的边界',
    kps: ['COUNT / SUM / AVG / MAX / MIN', 'GROUP BY 执行顺序', 'HAVING 过滤分组', 'COUNT(DISTINCT)', '条件聚合 CASE WHEN', 'NULL 对聚合的影响']
  },
  {
    id: 's3', no: '03', title: '多表连接',
    desc: '真实数据永远散在多张表里。这一阶段要建立起「连接粒度」的意识——绝大多数金额算错都是粒度问题。',
    goal: '判断该用 INNER 还是 LEFT，预判连接会不会放大行数',
    kps: ['INNER / LEFT / FULL JOIN', '多表连接', '自连接', '一对多连接放大陷阱', '先聚合后连接', 'USING 与 ON 的区别']
  },
  {
    id: 's4', no: '04', title: '子查询与 CTE',
    desc: '复杂需求要拆步骤。子查询是「纵向嵌套」，CTE 是「横向流水线」，后者可读性碾压前者。',
    goal: '复杂计算能用 WITH 拆成 2~3 个可读的中间结果',
    kps: ['标量子查询', 'IN / NOT IN', 'EXISTS / NOT EXISTS', '相关子查询', 'WITH 公共表表达式', '派生表 FROM (SELECT...)']
  },
  {
    id: 's5', no: '05', title: '窗口函数',
    desc: '中高级 SQL 的分水岭。排序、累计、行间对比这三类问题，用窗口函数能把十行自连接压缩成两行。',
    goal: '能用窗口函数替代绝大多数自连接写法',
    kps: ['ROW_NUMBER / RANK / DENSE_RANK', 'LAG / LEAD 行间取值', 'SUM / AVG OVER 累计', 'PARTITION BY 分组', 'ROWS BETWEEN 移动窗口', '分组 TopN 与取最新一条']
  },
  {
    id: 's6', no: '06', title: '业务建模实战',
    desc: '面试真正考的部分：留存、漏斗、连续行为、同比环比。这些题有固定的解题模板，练熟就能举一反三。',
    goal: '拿到业务口径能翻译成 SQL，而不是背题',
    kps: ['留存率计算', '漏斗转化率', '连续登录/连续区间', '同比与环比', '日期函数', '行转列与列转行', '中位数与分位数']
  },
  {
    id: 's7', no: '07', title: 'DML 与写法陷阱',
    desc: '会写不翻车才算过关。这一阶段收录那些「结果静默出错」的经典陷阱，以及 UPDATE / DELETE 的安全习惯。',
    goal: '知道哪些写法会静默产出错结果，并能给出安全替代方案',
    kps: ['UPDATE / DELETE 安全习惯', 'NOT IN 的 NULL 陷阱', '整数除法', '隐式类型转换', 'ORDER BY 与索引', '深分页优化']
  }
];
