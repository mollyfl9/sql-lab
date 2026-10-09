/* 题库：每题自包含（schema + data + solution），可直接被 SQLite 执行判题 */
const PROBLEMS = [
/* ========== 阶段一：基础查询 ========== */
{
  id: 'sql-001', stage: 's1', level: '简单', tags: ['SELECT', 'WHERE', 'ORDER BY'],
  title: '技术部的高薪员工',
  desc: '查询<b>技术部</b>中工资大于 15000 的员工姓名与工资，按工资降序排列。',
  schema: `CREATE TABLE employee (
  id INTEGER, name TEXT, dept TEXT, salary INTEGER, hire_date TEXT
);`,
  data: `INSERT INTO employee VALUES
 (1,'张伟','技术部',22000,'2021-03-01'),
 (2,'李娜','技术部',18000,'2022-07-15'),
 (3,'王芳','产品部',16000,'2023-02-20'),
 (4,'刘强','技术部',15000,'2023-05-06'),
 (5,'陈静','市场部',12000,'2020-11-11'),
 (6,'杨帆','产品部',19000,'2022-01-09'),
 (7,'赵敏','市场部',13500,'2023-09-01'),
 (8,'孙浩','技术部',26000,'2019-06-18');`,
  starter: 'SELECT name, salary\nFROM employee\nWHERE\nORDER BY',
  solution: `SELECT name, salary
FROM employee
WHERE dept = '技术部' AND salary > 15000
ORDER BY salary DESC;`,
  hint: 'WHERE 里用 AND 连接两个条件；排序用 ORDER BY salary DESC。',
  explain: '最基础的过滤 + 排序。注意 SQL 执行顺序是 FROM → WHERE → SELECT → ORDER BY，所以 WHERE 里不能用 SELECT 的别名。'
},
{
  id: 'sql-002', stage: 's1', level: '简单', tags: ['DISTINCT', '去重'],
  title: '产生过订单的城市',
  desc: '一张订单表里同一个城市会出现很多次，请查询<b>所有产生过订单的城市（去重）</b>，按城市名升序排列。',
  schema: `CREATE TABLE orders (
  order_id INTEGER, user_id INTEGER, city TEXT, amount REAL
);`,
  data: `INSERT INTO orders VALUES
 (1001,1,'北京',299.0),
 (1002,2,'上海',158.5),
 (1003,1,'北京',88.0),
 (1004,3,'广州',520.0),
 (1005,4,'杭州',66.6),
 (1006,2,'上海',1200.0),
 (1007,5,'北京',45.0);`,
  starter: 'SELECT\nFROM orders',
  solution: `SELECT DISTINCT city
FROM orders
ORDER BY city;`,
  hint: 'DISTINCT 放在 SELECT 后面，作用于整行。',
  explain: 'DISTINCT 对「整行」去重，而不是对某一列。面试高频追问：COUNT(DISTINCT city) 与 DISTINCT + COUNT(*) 的区别。'
},
{
  id: 'sql-003', stage: 's1', level: '简单', tags: ['LIMIT', 'OFFSET', '分页'],
  title: '工资排行榜第 3 到第 5 名',
  desc: '按工资从高到低排序，取出<b>第 3 名到第 5 名</b>的员工姓名与工资。',
  schema: `CREATE TABLE employee (
  id INTEGER, name TEXT, dept TEXT, salary INTEGER, hire_date TEXT
);`,
  data: `INSERT INTO employee VALUES
 (1,'张伟','技术部',22000,'2021-03-01'),
 (2,'李娜','技术部',18000,'2022-07-15'),
 (3,'王芳','产品部',16000,'2023-02-20'),
 (4,'刘强','技术部',15000,'2023-05-06'),
 (5,'陈静','市场部',12000,'2020-11-11'),
 (6,'杨帆','产品部',19000,'2022-01-09'),
 (7,'赵敏','市场部',13500,'2023-09-01'),
 (8,'孙浩','技术部',26000,'2019-06-18');`,
  starter: 'SELECT name, salary\nFROM employee\nORDER BY salary DESC',
  solution: `SELECT name, salary
FROM employee
ORDER BY salary DESC
LIMIT 3 OFFSET 2;`,
  hint: 'OFFSET 是「跳过几条」，第 3 名意味着跳过前 2 条。',
  explain: 'LIMIT n OFFSET m 是标准分页写法。进阶考点：深分页（OFFSET 很大）性能差，应改用 keyset 分页（WHERE id > last_id）。'
},
{
  id: 'sql-004', stage: 's1', level: '简单', tags: ['LIKE', 'IN', 'OR'],
  title: '姓名与部门的组合筛选',
  desc: '查询<b>姓名以「张」开头</b>，<b>或者</b>部门属于 (\'技术部\',\'产品部\') 的员工姓名与部门，按部门升序、姓名升序排列。',
  schema: `CREATE TABLE employee (
  id INTEGER, name TEXT, dept TEXT, salary INTEGER, hire_date TEXT
);`,
  data: `INSERT INTO employee VALUES
 (1,'张伟','技术部',22000,'2021-03-01'),
 (2,'李娜','技术部',18000,'2022-07-15'),
 (3,'王芳','产品部',16000,'2023-02-20'),
 (4,'刘强','技术部',15000,'2023-05-06'),
 (5,'陈静','市场部',12000,'2020-11-11'),
 (6,'杨帆','产品部',19000,'2022-01-09'),
 (7,'赵敏','市场部',13500,'2023-09-01'),
 (8,'孙浩','技术部',26000,'2019-06-18');`,
  starter: 'SELECT name, dept\nFROM employee\nWHERE',
  solution: `SELECT name, dept
FROM employee
WHERE name LIKE '张%' OR dept IN ('技术部','产品部')
ORDER BY dept, name;`,
  hint: 'LIKE \'张%\' 匹配以张开头的字符串；% 表示任意长度，_ 表示单个字符。',
  explain: '注意 OR 与 AND 的优先级：AND 高于 OR，混合使用时务必加括号。另外 LIKE \'%张%\' 无法走索引，大数据量下要考虑全文索引。'
},
{
  id: 'sql-005', stage: 's1', level: '简单', tags: ['NULL', 'COALESCE'],
  title: '缺失城市的兜底展示',
  desc: '用户表中 city 字段可能为 NULL。请输出 user_id、name、city，其中<b>缺失的城市用「未知」代替</b>，按 user_id 升序。',
  schema: `CREATE TABLE user_profile (
  user_id INTEGER, name TEXT, city TEXT
);`,
  data: `INSERT INTO user_profile VALUES
 (1,'小明','北京'),
 (2,'小红',NULL),
 (3,'小刚','上海'),
 (4,'小丽',NULL),
 (5,'小强','广州');`,
  starter: 'SELECT user_id, name,\nFROM user_profile\nORDER BY user_id;',
  solution: `SELECT user_id, name, COALESCE(city, '未知') AS city
FROM user_profile
ORDER BY user_id;`,
  hint: 'NULL 不能用 = 判断，要用 IS NULL / IS NOT NULL；替换空值用 COALESCE。',
  explain: 'NULL 参与的算术和比较结果仍是 NULL，这是面试最爱问的坑。COUNT(col) 会忽略 NULL，COUNT(*) 不会。'
},

/* ========== 阶段二：聚合与分组 ========== */
{
  id: 'sql-006', stage: 's2', level: '简单', tags: ['GROUP BY', '聚合函数'],
  title: '各部门的人数与工资分布',
  desc: '统计每个部门的<b>人数、平均工资（保留 2 位小数）、最高工资</b>，按人数降序、部门名升序排列。',
  schema: `CREATE TABLE employee (
  id INTEGER, name TEXT, dept TEXT, salary INTEGER, hire_date TEXT
);`,
  data: `INSERT INTO employee VALUES
 (1,'张伟','技术部',22000,'2021-03-01'),
 (2,'李娜','技术部',18000,'2022-07-15'),
 (3,'王芳','产品部',16000,'2023-02-20'),
 (4,'刘强','技术部',15000,'2023-05-06'),
 (5,'陈静','市场部',12000,'2020-11-11'),
 (6,'杨帆','产品部',19000,'2022-01-09'),
 (7,'赵敏','市场部',13500,'2023-09-01'),
 (8,'孙浩','技术部',26000,'2019-06-18');`,
  starter: 'SELECT dept,\nFROM employee\nGROUP BY',
  solution: `SELECT dept,
       COUNT(*) AS cnt,
       ROUND(AVG(salary), 2) AS avg_salary,
       MAX(salary) AS max_salary
FROM employee
GROUP BY dept
ORDER BY cnt DESC, dept;`,
  hint: 'GROUP BY 之后，SELECT 里只能出现分组列或聚合函数。',
  explain: '执行顺序：FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY。WHERE 在分组前过滤行，HAVING 在分组后过滤组。'
},
{
  id: 'sql-007', stage: 's2', level: '简单', tags: ['HAVING', 'COUNT'],
  title: '下单超过 3 次的老客户',
  desc: '查询<b>下单次数 ≥ 3 次</b>的用户，输出 user_id、下单次数、总金额（保留 2 位），按次数降序、user_id 升序。',
  schema: `CREATE TABLE user_order (
  order_id INTEGER, user_id INTEGER, amount REAL
);`,
  data: `INSERT INTO user_order VALUES
 (1,1,100), (2,1,200), (3,1,150), (4,1,90),
 (5,2,300), (6,2,120), (7,2,80),
 (8,3,60),  (9,3,70),
 (10,4,500),
 (11,5,45), (12,5,55), (13,5,65);`,
  starter: 'SELECT user_id, COUNT(*) AS order_cnt\nFROM user_order\nGROUP BY user_id',
  solution: `SELECT user_id,
       COUNT(*) AS order_cnt,
       ROUND(SUM(amount), 2) AS total_amount
FROM user_order
GROUP BY user_id
HAVING COUNT(*) >= 3
ORDER BY order_cnt DESC, user_id;`,
  hint: '对聚合结果做过滤要用 HAVING，不能用 WHERE。',
  explain: 'HAVING 里可以写聚合函数，也可以写 SELECT 的别名（MySQL 允许，SQLite 也支持）。性能上，能放 WHERE 的条件不要放 HAVING。'
},
{
  id: 'sql-008', stage: 's2', level: '中等', tags: ['条件聚合', 'CASE WHEN'],
  title: '按城市统计男女用户数',
  desc: '用<b>一条 SQL</b> 按城市统计男性用户数、女性用户数与总人数，按总人数降序、城市升序排列。',
  schema: `CREATE TABLE users (
  user_id INTEGER, name TEXT, gender TEXT, city TEXT
);`,
  data: `INSERT INTO users VALUES
 (1,'张三','男','北京'),(2,'李四','女','北京'),
 (3,'王五','男','上海'),(4,'赵六','女','上海'),
 (5,'钱七','女','上海'),(6,'孙八','男','广州'),
 (7,'周九','男','北京'),(8,'吴十','女','广州');`,
  starter: 'SELECT city,\nFROM users\nGROUP BY city',
  solution: `SELECT city,
       SUM(CASE WHEN gender = '男' THEN 1 ELSE 0 END) AS male_cnt,
       SUM(CASE WHEN gender = '女' THEN 1 ELSE 0 END) AS female_cnt,
       COUNT(*) AS total
FROM users
GROUP BY city
ORDER BY total DESC, city;`,
  hint: 'SUM(CASE WHEN 条件 THEN 1 ELSE 0 END) 是行转列/分组计数最常用的技巧。',
  explain: '条件聚合是 SQL 的「瑞士军刀」：多维统计、行转列、漏斗计算都靠它。注意 ELSE 0 不能省，否则会引入 NULL。'
},
{
  id: 'sql-009', stage: 's2', level: '简单', tags: ['COUNT DISTINCT', 'NULL'],
  title: 'COUNT 三兄弟的区别',
  desc: '注册表中 channel（来源渠道）允许为空。请一次性输出：<b>总注册数 total</b>、<b>填写了渠道的数量 channel_cnt</b>、<b>去重后的渠道种类数 channel_kinds</b>。',
  schema: `CREATE TABLE signup (
  user_id INTEGER, channel TEXT
);`,
  data: `INSERT INTO signup VALUES
 (1,'抖音'),(2,'朋友推荐'),(3,NULL),(4,'抖音'),(5,NULL),(6,'小红书');`,
  starter: 'SELECT\nFROM signup;',
  solution: `SELECT COUNT(*) AS total,
       COUNT(channel) AS channel_cnt,
       COUNT(DISTINCT channel) AS channel_kinds
FROM signup;`,
  hint: 'COUNT(列名) 会自动跳过该列的 NULL 值。',
  explain: 'COUNT(*) 数行，COUNT(col) 数非 NULL 值，COUNT(DISTINCT col) 数去重后的非 NULL 值。这题是数据分析面试的必考送分题，答错直接扣分。'
},
{
  id: 'sql-010', stage: 's2', level: '中等', tags: ['子查询', 'MAX', '分组Top1'],
  title: '每个部门工资最高的员工',
  desc: '查询<b>每个部门工资最高的员工</b>的部门、姓名、工资（并列第一名都要保留），按部门升序排列。',
  schema: `CREATE TABLE employee (
  id INTEGER, name TEXT, dept TEXT, salary INTEGER, hire_date TEXT
);`,
  data: `INSERT INTO employee VALUES
 (1,'张伟','技术部',22000,'2021-03-01'),
 (2,'李娜','技术部',18000,'2022-07-15'),
 (3,'王芳','产品部',16000,'2023-02-20'),
 (4,'刘强','技术部',15000,'2023-05-06'),
 (5,'陈静','市场部',12000,'2020-11-11'),
 (6,'杨帆','产品部',19000,'2022-01-09'),
 (7,'赵敏','市场部',13500,'2023-09-01'),
 (8,'孙浩','技术部',26000,'2019-06-18');`,
  starter: 'SELECT dept, name, salary\nFROM employee e\nWHERE salary = (SELECT',
  solution: `SELECT dept, name, salary
FROM employee e
WHERE salary = (SELECT MAX(salary) FROM employee WHERE dept = e.dept)
ORDER BY dept;`,
  hint: '子查询里引用外层的 e.dept，这就是「相关子查询」。',
  explain: '这是窗口函数出现前的经典写法。另一种写法是 JOIN 一个 (dept, MAX(salary)) 的临时表。学了 ROW_NUMBER 之后，这题还能更简洁地扩展到 TopN。'
},

/* ========== 阶段三：多表连接 ========== */
{
  id: 'sql-011', stage: 's3', level: '简单', tags: ['INNER JOIN'],
  title: '订单关联用户名',
  desc: '把订单表和用户表关联起来，输出<b>订单号、用户名、金额（保留 2 位）</b>，按订单号升序。',
  schema: `CREATE TABLE users (user_id INTEGER, name TEXT, city TEXT);
CREATE TABLE orders (order_id INTEGER, user_id INTEGER, amount REAL);`,
  data: `INSERT INTO users VALUES
 (1,'张三','北京'),(2,'李四','上海'),(3,'王五','广州'),(4,'赵六','北京'),(5,'钱七','杭州');
INSERT INTO orders VALUES
 (101,1,299.0),(102,2,158.5),(103,1,88.0),(104,3,520.0),(105,2,66.6);`,
  starter: 'SELECT o.order_id, u.name,\nFROM orders o\nJOIN users u ON',
  solution: `SELECT o.order_id, u.name, ROUND(o.amount, 2) AS amount
FROM orders o
JOIN users u ON o.user_id = u.user_id
ORDER BY o.order_id;`,
  hint: 'JOIN 就是 INNER JOIN 的简写，只保留两边都能匹配上的行。',
  explain: '养成写表别名 + 显式列名的习惯。生产环境中任何 SELECT * 都是隐患。'
},
{
  id: 'sql-012', stage: 's3', level: '简单', tags: ['LEFT JOIN', 'IS NULL'],
  title: '从未下单的用户',
  desc: '找出<b>从未下过单</b>的用户，输出 user_id 和姓名，按 user_id 升序。',
  schema: `CREATE TABLE users (user_id INTEGER, name TEXT, city TEXT);
CREATE TABLE orders (order_id INTEGER, user_id INTEGER, amount REAL);`,
  data: `INSERT INTO users VALUES
 (1,'张三','北京'),(2,'李四','上海'),(3,'王五','广州'),(4,'赵六','北京'),(5,'钱七','杭州');
INSERT INTO orders VALUES
 (101,1,299.0),(102,2,158.5),(103,1,88.0),(104,3,520.0),(105,2,66.6);`,
  starter: 'SELECT u.user_id, u.name\nFROM users u\nLEFT JOIN orders o ON',
  solution: `SELECT u.user_id, u.name
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
WHERE o.order_id IS NULL
ORDER BY u.user_id;`,
  hint: 'LEFT JOIN 后右表没匹配上的行全是 NULL，用 IS NULL 就能筛出来。',
  explain: '这是「求差集」的标准姿势，也叫 anti-join。另一种写法是 NOT EXISTS，两者在多数数据库中优化器会生成相同计划。'
},
{
  id: 'sql-013', stage: 's3', level: '中等', tags: ['多表JOIN', 'GROUP BY'],
  title: '各品类的销量与销售额',
  desc: '关联商品表与订单明细表，统计<b>每个品类的总销量 qty 与销售额 gmv（保留 2 位）</b>，按 gmv 降序排列。',
  schema: `CREATE TABLE product (product_id INTEGER, name TEXT, category TEXT, price REAL);
CREATE TABLE order_item (order_id INTEGER, product_id INTEGER, qty INTEGER);`,
  data: `INSERT INTO product VALUES
 (1,'iPhone 15','手机',5999),(2,'小米14','手机',3999),(3,'MacBook','电脑',9999),
 (4,'iPad','平板',2999),(5,'AirPods','配件',1299);
INSERT INTO order_item VALUES
 (201,1,2),(201,3,1),(202,2,1),(202,5,3),(203,4,2),(203,5,1),(204,1,1),(204,2,1),(205,3,1);`,
  starter: 'SELECT p.category,\nFROM order_item oi\nJOIN product p ON',
  solution: `SELECT p.category,
       SUM(oi.qty) AS qty,
       ROUND(SUM(oi.qty * p.price), 2) AS gmv
FROM order_item oi
JOIN product p ON oi.product_id = p.product_id
GROUP BY p.category
ORDER BY gmv DESC;`,
  hint: '先 JOIN 再 GROUP BY，聚合函数直接写在表达式上。',
  explain: '这里 JOIN 不会放大金额，因为商品表对明细表是「一对多」中的「一」。反过来（明细 JOIN 订单头）就会重复计算，见下一阶段的陷阱题。'
},
{
  id: 'sql-014', stage: 's3', level: '中等', tags: ['自连接', 'LEFT JOIN'],
  title: '员工与其直属上级',
  desc: '员工表的 manager_id 指向本表的 id。请输出<b>员工姓名与其直属上级姓名</b>（没有上级显示「—」），按员工 id 升序。',
  schema: `CREATE TABLE emp (id INTEGER, name TEXT, manager_id INTEGER);`,
  data: `INSERT INTO emp VALUES
 (1,'孙浩',NULL),(2,'张伟',1),(3,'李娜',1),(4,'王芳',2),(5,'刘强',2),(6,'陈静',3);`,
  starter: 'SELECT e.name AS emp_name,\nFROM emp e\nLEFT JOIN emp',
  solution: `SELECT e.name AS emp_name,
       COALESCE(m.name, '—') AS manager_name
FROM emp e
LEFT JOIN emp m ON e.manager_id = m.id
ORDER BY e.id;`,
  hint: '同一张表用不同别名出现两次，就是自连接。',
  explain: '自连接常用于：上下级关系、树形结构展开一层、同一用户的行为先后对比。要展开任意层级需递归 CTE。'
},
{
  id: 'sql-015', stage: 's3', level: '中等', tags: ['连接陷阱', 'CTE'],
  title: '一对多连接导致的金额放大',
  desc: '订单头 ord 存订单金额，明细 ord_item 存多条商品。如果直接 <code>SUM(price*qty)</code> 再去和订单头 JOIN，金额会被放大。\n请<b>先在明细层聚合</b>，再与订单头连接，输出 order_id、order_amount、item_amount，按 order_id 升序。',
  schema: `CREATE TABLE ord (order_id INTEGER, user_id INTEGER, amount REAL);
CREATE TABLE ord_item (order_id INTEGER, item_id INTEGER, price REAL, qty INTEGER);`,
  data: `INSERT INTO ord VALUES (301,1,100.0),(302,2,250.0),(303,1,80.0);
INSERT INTO ord_item VALUES
 (301,1,60,1),(301,2,40,1),
 (302,1,100,2),(302,2,50,1),
 (303,1,80,1);`,
  starter: 'WITH agg AS (\n  SELECT order_id, SUM(price*qty) AS item_amount\n  FROM ord_item\n  GROUP BY order_id\n)\nSELECT',
  solution: `WITH agg AS (
  SELECT order_id, SUM(price * qty) AS item_amount
  FROM ord_item
  GROUP BY order_id
)
SELECT o.order_id,
       ROUND(o.amount, 2) AS order_amount,
       ROUND(agg.item_amount, 2) AS item_amount
FROM ord o
LEFT JOIN agg ON o.order_id = agg.order_id
ORDER BY o.order_id;`,
  hint: '核心思路：让 JOIN 的粒度保持一致，「先聚合到唯一键，再连接」。',
  explain: '这是最经典的数据事故：明细 JOIN 订单头后直接 SUM 订单金额，GMV 直接翻倍。口诀是「先聚合、后连接」。'
},

/* ========== 阶段四：子查询与 CTE ========== */
{
  id: 'sql-016', stage: 's4', level: '中等', tags: ['IN子查询', 'DISTINCT'],
  title: '买过手机品类的用户',
  desc: '查询<b>购买过「手机」品类商品</b>的用户 id 与姓名（去重），按 user_id 升序。',
  schema: `CREATE TABLE users (user_id INTEGER, name TEXT);
CREATE TABLE orders (order_id INTEGER, user_id INTEGER);
CREATE TABLE order_item (order_id INTEGER, product_id INTEGER, qty INTEGER);
CREATE TABLE product (product_id INTEGER, name TEXT, category TEXT);`,
  data: `INSERT INTO users VALUES (1,'张三'),(2,'李四'),(3,'王五'),(4,'赵六');
INSERT INTO orders VALUES (401,1),(402,2),(403,1),(404,3);
INSERT INTO order_item VALUES (401,1,1),(402,2,2),(403,3,1),(404,1,1);
INSERT INTO product VALUES (1,'iPhone','手机'),(2,'酸奶','食品'),(3,'MacBook','电脑');`,
  starter: 'SELECT DISTINCT u.user_id, u.name\nFROM users u\nJOIN orders o ON u.user_id = o.user_id\nWHERE o.order_id IN (SELECT',
  solution: `SELECT DISTINCT u.user_id, u.name
FROM users u
JOIN orders o ON u.user_id = o.user_id
WHERE o.order_id IN (
  SELECT oi.order_id
  FROM order_item oi
  JOIN product p ON oi.product_id = p.product_id
  WHERE p.category = '手机'
)
ORDER BY u.user_id;`,
  hint: 'IN 子查询先算出「手机品类涉及的订单号」集合，再判断订单号是否在其中。',
  explain: 'IN 适合「集合小、结果集确定」的场景；当子查询结果集很大或含 NULL 时要改用 EXISTS / JOIN。'
},
{
  id: 'sql-017', stage: 's4', level: '中等', tags: ['相关子查询', 'AVG'],
  title: '高于部门平均工资的员工',
  desc: '查询<b>工资高于其所在部门平均工资</b>的员工姓名、部门、工资，按部门升序、工资降序。',
  schema: `CREATE TABLE employee (
  id INTEGER, name TEXT, dept TEXT, salary INTEGER, hire_date TEXT
);`,
  data: `INSERT INTO employee VALUES
 (1,'张伟','技术部',22000,'2021-03-01'),
 (2,'李娜','技术部',18000,'2022-07-15'),
 (3,'王芳','产品部',16000,'2023-02-20'),
 (4,'刘强','技术部',15000,'2023-05-06'),
 (5,'陈静','市场部',12000,'2020-11-11'),
 (6,'杨帆','产品部',19000,'2022-01-09'),
 (7,'赵敏','市场部',13500,'2023-09-01'),
 (8,'孙浩','技术部',26000,'2019-06-18');`,
  starter: 'SELECT name, dept, salary\nFROM employee e\nWHERE salary > (SELECT',
  solution: `SELECT name, dept, salary
FROM employee e
WHERE salary > (
  SELECT AVG(salary) FROM employee WHERE dept = e.dept
)
ORDER BY dept, salary DESC;`,
  hint: '子查询中引用外层表的 e.dept，每换一个部门就重新算一次均值。',
  explain: '相关子查询会「逐行执行」，数据量大时性能差。更优写法是 JOIN 一个部门均值的派生表，或用 AVG() OVER (PARTITION BY dept)。'
},
{
  id: 'sql-018', stage: 's4', level: '中等', tags: ['CTE', '复购率'],
  title: '复购率计算',
  desc: '定义「复购用户」= 下单次数 ≥ 2 的用户。请用 CTE 输出：<b>复购用户数 repeat_users、总下单用户数 total_users、复购率 repeat_rate（百分比，保留 2 位）</b>。',
  schema: `CREATE TABLE user_order (
  order_id INTEGER, user_id INTEGER, amount REAL
);`,
  data: `INSERT INTO user_order VALUES
 (1,1,100), (2,1,200), (3,1,150), (4,1,90),
 (5,2,300), (6,2,120), (7,2,80),
 (8,3,60),  (9,3,70),
 (10,4,500),
 (11,5,45), (12,5,55), (13,5,65);`,
  starter: 'WITH t AS (\n  SELECT user_id, COUNT(*) AS cnt\n  FROM user_order\n  GROUP BY user_id\n)\nSELECT',
  solution: `WITH t AS (
  SELECT user_id, COUNT(*) AS cnt
  FROM user_order
  GROUP BY user_id
)
SELECT SUM(CASE WHEN cnt >= 2 THEN 1 ELSE 0 END) AS repeat_users,
       COUNT(*) AS total_users,
       ROUND(SUM(CASE WHEN cnt >= 2 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS repeat_rate
FROM t;`,
  hint: '先按用户聚合出次数，再在聚合结果上做二次统计。',
  explain: 'CTE（WITH）让「先聚合再统计」这类两步计算读起来像流水线。注意 100.0 是为了避免整数除法。'
},
{
  id: 'sql-019', stage: 's4', level: '简单', tags: ['NOT EXISTS'],
  title: '用 NOT EXISTS 求差集',
  desc: '查询<b>从未下单</b>的用户 id 与姓名，要求使用 <b>NOT EXISTS</b> 完成，按 user_id 升序。',
  schema: `CREATE TABLE users (user_id INTEGER, name TEXT);
CREATE TABLE orders (order_id INTEGER, user_id INTEGER);`,
  data: `INSERT INTO users VALUES (1,'张三'),(2,'李四'),(3,'王五'),(4,'赵六');
INSERT INTO orders VALUES (401,1),(402,2),(403,1),(404,3);`,
  starter: 'SELECT u.user_id, u.name\nFROM users u\nWHERE NOT EXISTS (SELECT 1 FROM orders o WHERE',
  solution: `SELECT u.user_id, u.name
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.user_id
)
ORDER BY u.user_id;`,
  hint: 'EXISTS 只关心「有没有行」，所以子查询里写 SELECT 1 就够了。',
  explain: 'NOT EXISTS 相比 NOT IN 的最大优势：不受 NULL 影响。参见「NOT IN 陷阱」一题。'
},

/* ========== 阶段五：窗口函数 ========== */
{
  id: 'sql-020', stage: 's5', level: '中等', tags: ['ROW_NUMBER', '分组TopN'],
  title: '每个部门工资前 2 名',
  desc: '查询<b>每个部门工资最高的 2 名员工</b>，输出 dept、name、salary、排名 rn，按 dept 升序、rn 升序。',
  schema: `CREATE TABLE employee (
  id INTEGER, name TEXT, dept TEXT, salary INTEGER, hire_date TEXT
);`,
  data: `INSERT INTO employee VALUES
 (1,'张伟','技术部',22000,'2021-03-01'),
 (2,'李娜','技术部',18000,'2022-07-15'),
 (3,'王芳','产品部',16000,'2023-02-20'),
 (4,'刘强','技术部',15000,'2023-05-06'),
 (5,'陈静','市场部',12000,'2020-11-11'),
 (6,'杨帆','产品部',19000,'2022-01-09'),
 (7,'赵敏','市场部',13500,'2023-09-01'),
 (8,'孙浩','技术部',26000,'2019-06-18');`,
  starter: 'SELECT dept, name, salary, rn\nFROM (\n  SELECT dept, name, salary,\n         ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) AS rn\n  FROM employee\n) t\nWHERE',
  solution: `SELECT dept, name, salary, rn
FROM (
  SELECT dept, name, salary,
         ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) AS rn
  FROM employee
) t
WHERE rn <= 2
ORDER BY dept, rn;`,
  hint: 'PARTITION BY 相当于分组，ORDER BY 决定组内排序；窗口函数不能直接写在 WHERE 里，要套一层子查询。',
  explain: 'ROW_NUMBER 不给并列名次，RANK 会跳号，DENSE_RANK 不跳号。想要「并列且都保留」就换成 RANK。'
},
{
  id: 'sql-021', stage: 's5', level: '中等', tags: ['RANK', 'DENSE_RANK'],
  title: 'RANK 与 DENSE_RANK 的差异',
  desc: '对学生成绩排名，输出 student、score、<b>RANK 名次 rk</b>、<b>DENSE_RANK 名次 drank</b>，按 score 降序、student 升序。',
  schema: `CREATE TABLE score (id INTEGER, student TEXT, score INTEGER);`,
  data: `INSERT INTO score VALUES
 (1,'张三',95),(2,'李四',90),(3,'王五',90),(4,'赵六',85),(5,'钱七',95),(6,'孙八',70);`,
  starter: 'SELECT student, score,\n       RANK() OVER (ORDER BY score DESC) AS rk,\nFROM score',
  solution: `SELECT student, score,
       RANK() OVER (ORDER BY score DESC) AS rk,
       DENSE_RANK() OVER (ORDER BY score DESC) AS drank
FROM score
ORDER BY score DESC, student;`,
  hint: '两个函数都写在同一层 SELECT 里即可，OVER 里不写 PARTITION BY 表示全局排序。',
  explain: '95 分两人并列第 1，RANK 下一个人是第 3 名（跳号），DENSE_RANK 下一个人是第 2 名（连续）。做「TopN 占比」时用 RANK 更符合直觉。'
},
{
  id: 'sql-022', stage: 's5', level: '中等', tags: ['LAG', '环比'],
  title: '月度销售额环比',
  desc: '用 LAG 输出每月的<b>上月销售额 prev_amount</b> 与<b>环比增长率 mom_rate（%，保留 2 位）</b>，按月份升序。',
  schema: `CREATE TABLE month_sales (ym TEXT, amount REAL);`,
  data: `INSERT INTO month_sales VALUES
 ('2024-01',120000),('2024-02',150000),('2024-03',135000),
 ('2024-04',180000),('2024-05',160000),('2024-06',210000);`,
  starter: 'SELECT ym, amount,\n       LAG(amount) OVER (ORDER BY ym) AS prev_amount,\nFROM month_sales',
  solution: `SELECT ym, amount,
       LAG(amount) OVER (ORDER BY ym) AS prev_amount,
       ROUND((amount - LAG(amount) OVER (ORDER BY ym)) * 100.0 / LAG(amount) OVER (ORDER BY ym), 2) AS mom_rate
FROM month_sales
ORDER BY ym;`,
  hint: 'LAG(col) 取当前行「往前第 1 行」的值，第一行为 NULL。',
  explain: 'LAG/LEAD 是「行间计算」的核心，环比、同比、相邻间隔都靠它。等价写法是自连接 t1.ym = t2.ym - 1 个月，但窗口函数更清晰也更快。'
},
{
  id: 'sql-023', stage: 's5', level: '中等', tags: ['SUM OVER', '累计求和'],
  title: '每日累计销售额',
  desc: '订单表按天有多条记录。请<b>先按日期汇总当日销售额</b>，再计算<b>截至当天的累计销售额 cum_amount</b>，按日期升序输出。',
  schema: `CREATE TABLE daily_order (order_date TEXT, amount REAL);`,
  data: `INSERT INTO daily_order VALUES
 ('2024-06-01',1000),('2024-06-01',500),('2024-06-02',1200),
 ('2024-06-03',800),('2024-06-03',300),('2024-06-05',2000);`,
  starter: 'WITH d AS (\n  SELECT order_date, SUM(amount) AS day_amount\n  FROM daily_order\n  GROUP BY order_date\n)\nSELECT order_date, day_amount,\nFROM d',
  solution: `WITH d AS (
  SELECT order_date, SUM(amount) AS day_amount
  FROM daily_order
  GROUP BY order_date
)
SELECT order_date,
       ROUND(day_amount, 2) AS day_amount,
       SUM(day_amount) OVER (ORDER BY order_date) AS cum_amount
FROM d
ORDER BY order_date;`,
  hint: 'SUM(...) OVER (ORDER BY 日期) 默认窗口是「第一行到当前行」，天然就是累计。',
  explain: '如果要「近 7 天移动平均」，把窗口写成 ROWS BETWEEN 6 PRECEDING AND CURRENT ROW 即可。'
},
{
  id: 'sql-024', stage: 's5', level: '中等', tags: ['ROW_NUMBER', '取最新一条'],
  title: '每个用户最近一次登录设备',
  desc: '登录日志里每个用户有多条记录，请取出<b>每个用户最近一次登录的时间与设备</b>，按 user_id 升序。',
  schema: `CREATE TABLE login_log (id INTEGER, user_id INTEGER, login_time TEXT, device TEXT);`,
  data: `INSERT INTO login_log VALUES
 (1,1,'2024-06-01 09:00:00','iOS'),
 (2,1,'2024-06-03 21:10:00','Android'),
 (3,2,'2024-06-02 08:00:00','Web'),
 (4,1,'2024-06-02 12:00:00','iOS'),
 (5,2,'2024-06-05 23:00:00','iOS'),
 (6,3,'2024-06-04 10:00:00','Web');`,
  starter: 'SELECT user_id, login_time, device\nFROM (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_time DESC) AS rn\n  FROM login_log\n) t\nWHERE',
  solution: `SELECT user_id, login_time, device
FROM (
  SELECT user_id, login_time, device,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_time DESC) AS rn
  FROM login_log
) t
WHERE rn = 1
ORDER BY user_id;`,
  hint: '按 login_time 降序编号，取 rn = 1。',
  explain: '「取每组最新/最大的一条」是面试出场率最高的窗口函数题。旧写法 MAX(time) 子查询再 JOIN，遇到并列时间会多出行，窗口函数不会。'
},
{
  id: 'sql-025', stage: 's5', level: '困难', tags: ['连续区间', 'DATE函数', 'ROW_NUMBER'],
  title: '连续登录 3 天及以上的用户',
  desc: '登录日表 login_daily（已按天记录，但可能有重复）。请找出<b>连续登录 ≥ 3 天</b>的用户及其连续区间，输出 user_id、start_date、end_date、days，按 user_id 升序、start_date 升序。',
  schema: `CREATE TABLE login_daily (id INTEGER, user_id INTEGER, login_date TEXT);`,
  data: `INSERT INTO login_daily VALUES
 (1,1,'2024-06-01'),(2,1,'2024-06-02'),(3,1,'2024-06-03'),(4,1,'2024-06-04'),(5,1,'2024-06-05'),
 (6,2,'2024-06-01'),(7,2,'2024-06-02'),(8,2,'2024-06-04'),(9,2,'2024-06-05'),
 (10,3,'2024-06-01'),(11,3,'2024-06-03'),(12,3,'2024-06-05'),(13,3,'2024-06-06'),(14,3,'2024-06-07'),
 (15,4,'2024-06-10');`,
  starter: `WITH t AS (SELECT DISTINCT user_id, login_date FROM login_daily),
t2 AS (
  SELECT user_id, login_date,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) AS rn
  FROM t
),
t3 AS (
  SELECT user_id, login_date,
         DATE(login_date, '-' || rn || ' days') AS grp
  FROM t2
)
SELECT`,
  solution: `WITH t AS (
  SELECT DISTINCT user_id, login_date FROM login_daily
),
t2 AS (
  SELECT user_id, login_date,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) AS rn
  FROM t
),
t3 AS (
  SELECT user_id, login_date,
         DATE(login_date, '-' || rn || ' days') AS grp
  FROM t2
)
SELECT user_id,
       MIN(login_date) AS start_date,
       MAX(login_date) AS end_date,
       COUNT(*) AS days
FROM t3
GROUP BY user_id, grp
HAVING COUNT(*) >= 3
ORDER BY user_id, start_date;`,
  hint: '连续日期减去递增序号后得到同一个「分组键」，这是连续区间问题的通用解法。',
  explain: '核心技巧：连续序列 x, x+1, x+2 减去 1,2,3 后得到同一个常数。同款思路还能解「连续上涨的股票」「连续签到」「连续未登录天数」。'
},

/* ========== 阶段六：业务建模实战 ========== */
{
  id: 'sql-026', stage: 's6', level: '困难', tags: ['留存率', '自连接', '日期函数'],
  title: '次日留存率',
  desc: '登录表 user_login（同一用户同一天可能有多条）。请计算<b>每天的活跃用户数 uv、次日仍活跃的用户数 retain_uv、次日留存率 retain_rate（%，保留 2 位）</b>，按日期升序。',
  schema: `CREATE TABLE user_login (id INTEGER, user_id INTEGER, login_date TEXT);`,
  data: `INSERT INTO user_login VALUES
 (1,1,'2024-06-01'),(2,1,'2024-06-02'),(3,2,'2024-06-01'),(4,2,'2024-06-03'),
 (5,3,'2024-06-01'),(6,3,'2024-06-02'),(7,1,'2024-06-02'),
 (8,4,'2024-06-02'),(9,4,'2024-06-03'),(10,5,'2024-06-02');`,
  starter: `WITH d AS (SELECT DISTINCT user_id, login_date FROM user_login)
SELECT d1.login_date AS dt,\n       COUNT(DISTINCT d1.user_id) AS uv,\nFROM d d1\nLEFT JOIN d d2 ON d1.user_id = d2.user_id AND d2.login_date = DATE(d1.login_date, '+1 day')`,
  solution: `WITH d AS (
  SELECT DISTINCT user_id, login_date FROM user_login
)
SELECT d1.login_date AS dt,
       COUNT(DISTINCT d1.user_id) AS uv,
       COUNT(DISTINCT CASE WHEN d2.user_id IS NOT NULL THEN d1.user_id END) AS retain_uv,
       ROUND(COUNT(DISTINCT CASE WHEN d2.user_id IS NOT NULL THEN d1.user_id END) * 100.0
             / COUNT(DISTINCT d1.user_id), 2) AS retain_rate
FROM d d1
LEFT JOIN d d2
  ON d1.user_id = d2.user_id
 AND d2.login_date = DATE(d1.login_date, '+1 day')
GROUP BY d1.login_date
ORDER BY dt;`,
  hint: '先 DISTINCT 去重，再自连接「同一个人 + 后一天」，用 LEFT JOIN 保留未留存的用户。',
  explain: '留存是增长分析的地基。把 \'+1 day\' 换成 \'+7 day\' 就是 7 日留存；把 d1 限定成「注册日」就是新客留存。注意分母必须是「当天活跃且存在次日」的口径，不能直接用全表用户数。'
},
{
  id: 'sql-027', stage: 's6', level: '困难', tags: ['漏斗分析', 'UNION ALL', 'LAG'],
  title: '电商漏斗转化率',
  desc: '埋点表 events 记录了 view / cart / order / pay 四类行为。请统计<b>各环节的独立用户数 uv</b> 与<b>相对上一环节的转化率 conv_rate（%，保留 2 位）</b>，按 view → cart → order → pay 顺序输出。',
  schema: `CREATE TABLE events (id INTEGER, user_id INTEGER, event_type TEXT, event_time TEXT);`,
  data: `INSERT INTO events VALUES
 (1,1,'view','2024-06-01 10:00'),(2,1,'cart','2024-06-01 10:05'),
 (3,1,'order','2024-06-01 10:10'),(4,1,'pay','2024-06-01 10:12'),
 (5,2,'view','2024-06-01 11:00'),(6,2,'cart','2024-06-01 11:05'),(7,2,'order','2024-06-01 11:09'),
 (8,3,'view','2024-06-01 12:00'),
 (9,4,'view','2024-06-01 13:00'),(10,4,'cart','2024-06-01 13:20'),
 (11,5,'view','2024-06-01 14:00');`,
  starter: `WITH f AS (
  SELECT 'view' AS step, 1 AS ord, COUNT(DISTINCT user_id) AS uv FROM events WHERE event_type = 'view'
  UNION ALL
  SELECT 'cart', 2, COUNT(DISTINCT user_id) FROM events WHERE event_type = 'cart'
)
SELECT step, uv, ROUND(uv * 100.0 / LAG(uv) OVER (ORDER BY ord), 2) AS conv_rate
FROM f
ORDER BY ord;`,
  solution: `WITH f AS (
  SELECT 'view'  AS step, 1 AS ord, COUNT(DISTINCT user_id) AS uv FROM events WHERE event_type = 'view'
  UNION ALL
  SELECT 'cart',  2, COUNT(DISTINCT user_id) FROM events WHERE event_type = 'cart'
  UNION ALL
  SELECT 'order', 3, COUNT(DISTINCT user_id) FROM events WHERE event_type = 'order'
  UNION ALL
  SELECT 'pay',   4, COUNT(DISTINCT user_id) FROM events WHERE event_type = 'pay'
)
SELECT step, uv,
       ROUND(uv * 100.0 / LAG(uv) OVER (ORDER BY ord), 2) AS conv_rate
FROM f
ORDER BY ord;`,
  hint: '用 UNION ALL 把四个环节拼成四行，再用 LAG 取上一环节的 uv 做分母。',
  explain: '真实漏斗还要限制「行为在时间上先后发生」（加 event_time 的大小条件）。本题简化为按环节口径统计，重点是 UNION ALL + LAG 的组合套路。'
},
{
  id: 'sql-028', stage: 's6', level: '困难', tags: ['同比环比', '日期函数', '自连接'],
  title: '月度销售额同比与环比',
  desc: '月销售表 monthly_sales。请输出每个月：<b>销售额 amount、上月销售额 mom_amount、环比 mom_rate（%）、去年同期 yoy_amount、同比 yoy_rate（%）</b>，保留 2 位小数，按月份升序。',
  schema: `CREATE TABLE monthly_sales (ym TEXT, amount REAL);`,
  data: `INSERT INTO monthly_sales VALUES
 ('2023-01',82000),('2023-02',76000),('2023-03',91000),('2023-04',88000),('2023-05',102000),('2023-06',97000),
 ('2023-07',110000),('2023-08',105000),('2023-09',118000),('2023-10',126000),('2023-11',150000),('2023-12',142000),
 ('2024-01',98000),('2024-02',88000),('2024-03',115000),('2024-04',121000),('2024-05',132000),('2024-06',160000);`,
  starter: `WITH m AS (SELECT ym, SUM(amount) AS amount FROM monthly_sales GROUP BY ym)
SELECT m.ym, ROUND(m.amount,2) AS amount,
       LAG(m.amount) OVER (ORDER BY m.ym) AS mom_amount,
FROM m
LEFT JOIN m AS y ON y.ym = strftime('%Y-%m', date(m.ym || '-01', '-1 year'))
ORDER BY m.ym;`,
  solution: `WITH m AS (
  SELECT ym, SUM(amount) AS amount FROM monthly_sales GROUP BY ym
)
SELECT m.ym,
       ROUND(m.amount, 2) AS amount,
       LAG(m.amount) OVER (ORDER BY m.ym) AS mom_amount,
       ROUND((m.amount - LAG(m.amount) OVER (ORDER BY m.ym)) * 100.0
             / LAG(m.amount) OVER (ORDER BY m.ym), 2) AS mom_rate,
       y.amount AS yoy_amount,
       ROUND((m.amount - y.amount) * 100.0 / y.amount, 2) AS yoy_rate
FROM m
LEFT JOIN m AS y ON y.ym = strftime('%Y-%m', date(m.ym || '-01', '-1 year'))
ORDER BY m.ym;`,
  hint: '环比用 LAG；同比要把月份往前推 12 个月再自连接，推月份用 date(ym || \'-01\', \'-1 year\')。',
  explain: '日期处理是业务 SQL 的分水岭。常用函数：date()、strftime()、julianday() 做差、DATE(x, \'+1 day\')。注意 ym 是字符串，必须先补成合法日期再运算。'
},
{
  id: 'sql-029', stage: 's6', level: '中等', tags: ['行转列', 'CASE WHEN'],
  title: '成绩表行转列',
  desc: '成绩是长表（一人一科一行）。请转成宽表：<b>student、chinese、math、english、total</b>，按 total 降序排列。',
  schema: `CREATE TABLE score_long (id INTEGER, student TEXT, subject TEXT, score INTEGER);`,
  data: `INSERT INTO score_long VALUES
 (1,'张三','语文',88),(2,'张三','数学',92),(3,'张三','英语',79),
 (4,'李四','语文',75),(5,'李四','数学',85),(6,'李四','英语',90),
 (7,'王五','语文',93),(8,'王五','数学',68),(9,'王五','英语',84);`,
  starter: 'SELECT student,\n       SUM(CASE WHEN subject = \'语文\' THEN score ELSE 0 END) AS chinese,\nFROM score_long\nGROUP BY student',
  solution: `SELECT student,
       SUM(CASE WHEN subject = '语文' THEN score ELSE 0 END) AS chinese,
       SUM(CASE WHEN subject = '数学' THEN score ELSE 0 END) AS math,
       SUM(CASE WHEN subject = '英语' THEN score ELSE 0 END) AS english,
       SUM(score) AS total
FROM score_long
GROUP BY student
ORDER BY total DESC;`,
  hint: '按学生分组，用条件聚合把每个科目「摊」成一列。',
  explain: '行转列（PIVOT）的标准解法就是 GROUP BY + 条件聚合。反过来列转行用 UNION ALL。'
},
{
  id: 'sql-030', stage: 's6', level: '困难', tags: ['中位数', '窗口函数'],
  title: '工资中位数',
  desc: '求全体员工工资的<b>中位数</b>（人数为偶数时取中间两个数的平均值，保留 2 位小数），输出列名 median。',
  schema: `CREATE TABLE employee (
  id INTEGER, name TEXT, dept TEXT, salary INTEGER, hire_date TEXT
);`,
  data: `INSERT INTO employee VALUES
 (1,'张伟','技术部',22000,'2021-03-01'),
 (2,'李娜','技术部',18000,'2022-07-15'),
 (3,'王芳','产品部',16000,'2023-02-20'),
 (4,'刘强','技术部',15000,'2023-05-06'),
 (5,'陈静','市场部',12000,'2020-11-11'),
 (6,'杨帆','产品部',19000,'2022-01-09'),
 (7,'赵敏','市场部',13500,'2023-09-01'),
 (8,'孙浩','技术部',26000,'2019-06-18');`,
  starter: `WITH t AS (
  SELECT salary,
         ROW_NUMBER() OVER (ORDER BY salary) AS rn,
         COUNT(*) OVER () AS cnt
  FROM employee
)
SELECT ROUND(AVG(salary), 2) AS median
FROM t
WHERE rn IN ((cnt + 1) / 2, (cnt + 2) / 2);`,
  solution: `WITH t AS (
  SELECT salary,
         ROW_NUMBER() OVER (ORDER BY salary) AS rn,
         COUNT(*) OVER () AS cnt
  FROM employee
)
SELECT ROUND(AVG(salary), 2) AS median
FROM t
WHERE rn IN ((cnt + 1) / 2, (cnt + 2) / 2);`,
  hint: '奇数个取正中一行，偶数个取中间两行求平均；用 (cnt+1)/2 与 (cnt+2)/2 可以统一处理。',
  explain: 'COUNT(*) OVER () 是「不分组的总行数」，配合 ROW_NUMBER 就能定位中间行。这招也能求任意分位数（P90、P95）。'
},

/* ========== 阶段七：DML 与写法陷阱 ========== */
{
  id: 'sql-031', stage: 's7', level: '中等', tags: ['UPDATE', 'DELETE', 'DML'],
  title: '批量调薪与清理测试账号',
  desc: '请按顺序完成：\n1) 把 <b>2023 年之前入职且非测试账号</b>的员工工资上调 10%（向下取整）；\n2) <b>删除</b>所有测试账号（is_test = 1）；\n3) 输出剩余员工的 id、name、salary，按 id 升序。',
  schema: `CREATE TABLE employee_dml (
  id INTEGER, name TEXT, salary INTEGER, hire_date TEXT, is_test INTEGER
);`,
  data: `INSERT INTO employee_dml VALUES
 (1,'张伟',20000,'2021-03-01',0),
 (2,'李娜',15000,'2022-07-15',0),
 (3,'test_a',8000,'2020-01-01',1),
 (4,'王芳',12000,'2019-05-06',0),
 (5,'test_b',9000,'2021-02-02',1);`,
  starter: 'UPDATE employee_dml SET salary = \nWHERE hire_date < \'2023-01-01\' AND is_test = 0;\n\nDELETE FROM employee_dml WHERE is_test = 1;\n\nSELECT id, name, salary FROM employee_dml ORDER BY id;',
  solution: `UPDATE employee_dml
SET salary = CAST(salary * 1.1 AS INTEGER)
WHERE hire_date < '2023-01-01' AND is_test = 0;

DELETE FROM employee_dml WHERE is_test = 1;

SELECT id, name, salary FROM employee_dml ORDER BY id;`,
  hint: '多条语句用分号分隔；UPDATE 一定要带 WHERE，否则全表更新。',
  explain: 'DML 四字箴言：先 SELECT 验证条件，再写 UPDATE/DELETE。生产环境务必放在事务里并先备份。'
},
{
  id: 'sql-032', stage: 's7', level: '中等', tags: ['NOT IN陷阱', 'LEFT JOIN'],
  title: 'NOT IN 的 NULL 陷阱',
  desc: 'a_table 是主表，b_table 是参照表（<b>b_table.id 中存在 NULL</b>）。\n请查询<b>在 a_table 中、但不在 b_table 中</b>的 id 与 name，按 id 升序。\n注意：直接用 NOT IN 会因为 NULL 返回空结果，请用安全的写法。',
  schema: `CREATE TABLE a_table (id INTEGER, name TEXT);
CREATE TABLE b_table (id INTEGER, tag TEXT);`,
  data: `INSERT INTO a_table VALUES (1,'x'),(2,'y'),(3,'z'),(4,'w');
INSERT INTO b_table VALUES (2,'p'),(NULL,'q'),(3,'r');`,
  starter: 'SELECT a.id, a.name\nFROM a_table a\nLEFT JOIN b_table b ON a.id = b.id\nWHERE',
  solution: `SELECT a.id, a.name
FROM a_table a
LEFT JOIN b_table b ON a.id = b.id
WHERE b.id IS NULL
ORDER BY a.id;`,
  hint: 'NOT IN (2, NULL, 3) 中的 NULL 会让整个判断结果变成 UNKNOWN，一行都返回不了。',
  explain: '这是 SQL 面试的「阴间题」之王。只要子查询结果的列可能含 NULL，NOT IN 就会静默返回空集。改用 NOT EXISTS 或 LEFT JOIN ... IS NULL 才是安全写法。'
}
];

const ProblemIndex = PROBLEMS.reduce((m, p) => { m[p.id] = p; return m; }, {});
