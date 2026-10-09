/*
 * aibasics.js — 《LLM 与 Agent 核心原理》阅读内容
 * 结构：AIBASICS.meta + AIBASICS.sections[].blocks[]
 * block 类型：
 *   {t:'p',  x:'段落'}                     普通段落
 *   {t:'h',  x:'小标题'}                   节内小标题
 *   {t:'list', items:[...]}                无序列表
 *   {t:'quote', x:'金句'}                  引用行
 *   {t:'code', lang:'json', x:'代码'}      代码块（纯文本，多行用 \n）
 *   {t:'callout', tone:'tip|info|warn', title:'', x:''}  提示框
 */
const AIBASICS = {
  meta: {
    title: 'LLM 与 Agent 核心原理',
    sub: '从「概率预测」到「一切皆上下文」',
    route: 'aibasics',
    intro:
      '当你用 Cursor、Claude Code 这类工具时，可能会疑惑：它们背后到底是什么？为什么有的好用、有的不好用？' +
      '一句话答案：AI 干活的本事 = LLM 模型本身的能力 + 围绕模型的 Agent 工程实现。' +
      '可以把 LLM 想成汽车引擎，Agent 工程就是引擎之外的整车——底盘、变速箱、电控。引擎决定上限，整车决定你到底能不能舒服地开起来。',
    framing:
      'Qwen、DeepSeek、Claude 这些是 LLM（模型）；Cursor、Codex、Claude Code 这些是 Agent（产品）。' +
      '下面 14 个小节，按「模型原生的限制 → 能力修补 → 标准化 → 系统化 → 工程鲁棒性」的顺序展开，最后一节回扣开头的疑问。',
    tocTitle: '目录'
  },
  sections: [
    /* 1 */
    {
      id: 'prob', no: 1, title: 'LLM 的本质：概率预测',
      lead: '所有故事的起点：先搞清楚 LLM 到底在做什么。',
      blocks: [
        { t: 'p', x: 'LLM（大语言模型）本质上是一个「概率模型」：给它一段已有文本，它预测下一个 token（词/字/子词）最可能是谁，然后把预测出的 token 接在末尾，再预测下一个，如此循环生成整段文字。' },
        { t: 'p', x: '模型在训练时读过的海量文本，让它在「下一个词应该是什么」这件事上形成了统计规律。所以它生成的内容，是「统计上最可能的续写」，而不是从某个标准答案库里检索出来的。' },
        { t: 'callout', tone: 'info', title: '三个要记住的词', x: '' },
        { t: 'list', items: [
          'Token：模型处理的原子单位，中文里常常一个字或半个词就是一个 token。',
          '温度（temperature）：控制随机度。温度高 → 发散、有创意；温度低 → 更确定、更保守。写代码通常把温度设到接近 0，保证稳定。',
          '上下文窗口（context window）：模型一次能「看到」的最大文本长度，超出部分会被截断或压缩，这是后面很多工程问题的根源。'
        ] },
        { t: 'p', x: '因为窗口有限，长对话会被「压缩」（Compaction）：把早期对话摘要成更短的文本，腾出空间。压缩丢细节，所以越长的任务越容易「忘事」。' },
        { t: 'callout', tone: 'tip', title: '类比', x: '把 LLM 想成一位「读过全网文本、能根据前一句话猜出你下一句想说什么」的接龙高手。他很强，但本质是猜词，不是查字典。' }
      ]
    },
    /* 2 */
    {
      id: 'instruct', no: 2, title: '从补全到对话：Instruct 模型',
      lead: 'Base 模型只会接龙，能聊天的是另一种。',
      blocks: [
        { t: 'p', x: '最原始的训练产物叫 Base 模型，它只会「文本补全」：你给它半句话，它接着写。让它写诗它会写，但如果你问「帮我写一个 SQL」，它可能只是接着你的话往下续，而不是真的去执行指令。' },
        { t: 'p', x: '真正能对话的是 Instruct 模型：在 Base 之上做了「指令微调」+ RLHF（基于人类反馈的强化学习），让它学会把输入当成「指令」来理解，而不是当成接龙的上文。' },
        { t: 'callout', tone: 'info', title: '一句话区分', x: '日常用的 GPT、Claude、DeepSeek、Qwen 等几乎都是 Instruct 模型。你「调戏」它、让它干活，靠的都是这层指令微调。' },
        { t: 'quote', x: 'Base 想的是「接下来该说什么」；Instruct 想的是「你想让我做什么」。' }
      ]
    },
    /* 3 */
    {
      id: 'cot', no: 3, title: '思维链：让模型「想清楚再说」',
      lead: '复杂问题，先让模型把推理过程写下来。',
      blocks: [
        { t: 'p', x: '思维链（Chain of Thought, CoT）是一个被反复验证有效的技巧：让模型先输出一步步的推理过程，再给最终答案，准确率会明显提升。直觉上，这和人类「把思路写下来就不容易算错」是一样的。' },
        { t: 'p', x: '「推理模型」（如 o 系列、DeepSeek-R1 等）把这一步内置了：模型在给出答案前，先有一段内部「思考」。你看到的是结论，看不到的是它已经绕了好几圈。' },
        { t: 'callout', tone: 'warn', title: '趋势', x: '2025 年下半年起，行业从「对话模型 + 推理模型」双模型并存，逐渐演进为「单一模型 + 思考强度参数」。简单任务少想、复杂任务多想，由参数控制。' },
        { t: 'p', x: '实践上：问简单问题不必强迫它长考；问多步推理、写代码、做数学，让它「一步步想」通常更稳。' }
      ]
    },
    /* 4 */
    {
      id: 'system', no: 4, title: 'System Prompt：设置「人设」',
      lead: '藏在最前面的隐藏指令，决定模型的底色。',
      blocks: [
        { t: 'p', x: 'System Prompt 是一段通常会放在上下文最前面的指令，用来定义模型的角色、风格和边界，比如「你是一个严谨的 SQL 老师，回答用中文，不写废话」。' },
        { t: 'p', x: '它有两个关键特性：第一，它在最前面，权重高于普通用户消息，相当于「底层设定」；第二，安全类规则（哪些不能做）通常写在这里，因为它是整段对话里最先被遵循的约束。' },
        { t: 'callout', tone: 'tip', title: '写 System Prompt 的三件套', x: '1) 角色与语气；2) 输出格式（结构化/带代码块/带步骤）；3) 明确禁止项（不编造、不泄露规则、不执行危险操作）。' }
      ]
    },
    /* 5 */
    {
      id: 'fc', no: 5, title: 'Function Calling：让 LLM 学会「动手」',
      lead: '模型不再只动嘴，还能输出「我要调用某个工具」。',
      blocks: [
        { t: 'p', x: '纯文本模型只能「说」。Function Calling（后来也常叫 Tool Use）让模型可以输出一段结构化的调用意图——它想调用哪个函数、传什么参数。真正的执行由你的程序完成，再把结果塞回上下文，模型据此继续推理。' },
        { t: 'callout', tone: 'info', title: '注意', x: '模型输出的是「调用意图的 JSON 文本」，它自己并不会真的去联网或查数据库。是否执行、怎么执行，完全由你的代码决定——这也是安全控制的关键点。' },
        { t: 'h', x: '模型想查天气，它会这样说：' },
        { t: 'code', lang: 'json', x:
          '{\n' +
          '  "name": "get_weather",\n' +
          '  "arguments": { "city": "北京" }\n' +
          '}' },
        { t: 'p', x: '你的程序收到后真的去查，把结果作为「工具返回」回填进上下文：' },
        { t: 'code', lang: 'json', x:
          '工具 get_weather 返回：\n' +
          '{ "city": "北京", "temperature": 8, "unit": "celsius", "condition": "多云" }' },
        { t: 'p', x: '模型读到结果，继续生成最终回答。这一步，就是后面 Agent 能「动手干活」的能力基础。' }
      ]
    },
    /* 6 */
    {
      id: 'mcp', no: 6, title: 'MCP：给工具定个标准',
      lead: '每家工具描述格式都不一样，MCP 来统一。',
      blocks: [
        { t: 'p', x: 'Function Calling 底层是通用的，但各家「怎么描述一个工具」的格式并不统一。比如 OpenAI 把参数包在 function / parameters 里，而 Anthropic 用扁平的 input_schema。' },
        { t: 'code', lang: 'json', x:
          '// OpenAI 风格：嵌套在 function 里，参数字段叫 parameters\n' +
          '{\n' +
          '  "type": "function",\n' +
          '  "function": {\n' +
          '    "name": "get_weather",\n' +
          '    "description": "查询指定城市的当前天气",\n' +
          '    "parameters": { "type": "object", "properties": { "city": { "type": "string" } }, "required": ["city"] }\n' +
          '  }\n' +
          '}\n\n' +
          '// Anthropic 风格：扁平结构，参数字段叫 input_schema\n' +
          '{\n' +
          '  "name": "get_weather",\n' +
          '  "description": "查询指定城市的当前天气",\n' +
          '  "input_schema": { "type": "object", "properties": { "city": { "type": "string" } }, "required": ["city"] }\n' +
          '}' },
        { t: 'p', x: 'MCP（Model Context Protocol，2024 年 11 月由 Anthropic 提出）想做工具的「USB-C 标准」：统一工具的描述格式和通信方式。底层还是 Tool Use，但换了统一接口后，一个工具可以被不同客户端复用。' },
        { t: 'callout', tone: 'tip', title: '类比', x: '就像 USB-C 统一了充电线，MCP 统一了「模型怎么认识并使用一个工具」。' },
        { t: 'h', x: '一个最小的 MCP 工具（Python · fastmcp）：' },
        { t: 'code', lang: 'python', x:
          'from mcp.server.fastmcp import FastMCP\n\n' +
          'mcp = FastMCP("weather-server")\n\n' +
          '@mcp.tool()\n' +
          'def get_weather(city: str) -> str:\n' +
          '    """查询指定城市的当前天气"""\n' +
          '    return f"{city}：8°C，多云"\n\n' +
          'mcp.run()' }
      ]
    },
    /* 7 */
    {
      id: 'agent', no: 7, title: 'Agent：给 LLM 套上循环',
      lead: '单次问答 vs 多步自主完成，差的就是一个循环。',
      blocks: [
        { t: 'p', x: '把「LLM + 工具」放进一个 while 循环里：模型根据当前上下文思考下一步；需要工具就调用、把结果追加回上下文；觉得做完了就退出。这就是 Agent 的核心——ReAct（推理-行动）循环。' },
        { t: 'p', x: '上下文会随着循环不断变长（思考、调用、观察、再思考……），所以第 1 节说的「上下文窗口」在这里至关重要：窗口装不下，Agent 就会开始丢前面的信息、出现前后矛盾。' },
        { t: 'code', lang: 'python', x:
          'while 任务未完成:\n' +
          '    思考 = 模型根据当前上下文决定下一步该做什么\n' +
          '    if 思考认为需要某个工具:\n' +
          '        结果 = 执行工具(思考.调用)\n' +
          '        上下文.append(结果)   # 把观察塞回上下文\n' +
          '    elif 思考认为任务完成:\n' +
          '        return 最终答案\n' +
          '    # 否则继续循环' },
        { t: 'callout', tone: 'info', title: '一句话', x: '普通问答是「一次性」；Agent 是「想一步、做一步、看一步」的循环。' }
      ]
    },
    /* 8 */
    {
      id: 'skills', no: 8, title: 'Skills：可复用的工作流程',
      lead: '把「怎么做某件事」沉淀成一份文档。',
      blocks: [
        { t: 'p', x: '有些任务流程很成熟，比如「处理 PDF」「发版流程」。Skills 就是把这类流程写成一份文档，让模型在需要时按图索骥。它类似给实习生写一份标准作业手册。' },
        { t: 'p', x: '关键技巧是「渐进式披露」：启动时只把 Skills 的简介（名字 + 何时该用）加载进上下文，等模型判断「这件事该用这个 Skill」时，再加载详细文档。这样能省下大量 token。' },
        { t: 'callout', tone: 'info', title: 'Skill 的描述要写「触发条件」', x: '比如「用户要做任何和 PDF 相关的事，都使用本 Skill」，模型才能在对的时机把它调出来。' },
        { t: 'h', x: '一个 Skill 的 frontmatter 与目录结构：' },
        { t: 'code', lang: 'yaml', x:
          '---\n' +
          'name: pdf\n' +
          'description: 当用户要处理 PDF 时使用本 Skill，包括读取/提取文字与表格、\n' +
          '  合并多个 PDF 等。\n' +
          '---' },
        { t: 'code', lang: 'text', x:
          'skills/pdf/\n' +
          '├── SKILL.md        # 核心：何时触发 + 操作指南\n' +
          '├── reference.md    # 详细参考文档（按需加载）\n' +
          '├── forms.md        # 表单填写专项指南\n' +
          '└── scripts/        # 预写好的 Python 脚本' }
      ]
    },
    /* 9 */
    {
      id: 'rag', no: 9, title: 'RAG：让 Agent 用上外部知识',
      lead: '模型知识有截止日期，RAG 帮它临时查资料。',
      blocks: [
        { t: 'p', x: 'LLM 的知识来自训练数据，有两处盲区：一是有截止日期（不知道最新消息），二是没有你的私域数据（内部文档、代码库）。RAG（检索增强生成）就是解决办法。' },
        { t: 'p', x: '做法：用 Embedding 模型把文档切成片段、转成向量存起来；用户提问时，把问题也转成向量，去检索最相关的几个片段，把这些片段注入上下文，模型就能「临时查阅」后作答。' },
        { t: 'code', lang: 'python', x:
          'from sentence_transformers import SentenceTransformer\n\n' +
          'model = SentenceTransformer("all-MiniLM-L6-v2")\n' +
          'chunks = ["公司年假政策……", "报销流程……"]      # 离线切好的文档片段\n' +
          'vecs = model.encode(chunks)                     # 转成向量入库\n\n' +
          'q = model.encode(["怎么请年假？"])[0]\n' +
          'top = 检索最相似的 3 个 vecs                        # 语义相似度检索\n' +
          'context = "\\n".join(chunks[top])                 # 拼进提示词\n' +
          '# 再把 context 交给 LLM 生成答案' },
        { t: 'callout', tone: 'tip', title: '本质', x: 'RAG 也是「往上下文里塞文本」——只不过塞的是临时检索来的外部知识。' }
      ]
    },
    /* 10 */
    {
      id: 'memory', no: 10, title: '自动记忆：跨会话的信息延续',
      lead: '让 Agent 记得「你」和「这个项目」。',
      blocks: [
        { t: 'p', x: '默认情况下每次开新对话，模型都是「失忆」的。自动记忆（Auto Memory）让 Agent 把有价值的信息沉淀下来，下次新会话开头就注入上下文。' },
        { t: 'list', items: [
          '用户维度：你的偏好、习惯、常用技术栈（比如「他喜欢用窗口函数解连续登录题」）。',
          '项目维度：这个仓库的规范、约定、已知坑（比如「本表金额单位为分」）。'
        ] },
        { t: 'callout', tone: 'info', title: '好处', x: '个性化 + 少重复。你不用每次都从头交代背景，Agent 一上来就「懂点你」。' }
      ]
    },
    /* 11 */
    {
      id: 'harness', no: 11, title: 'Harness：让 Agent 更可靠',
      lead: '用确定性程序，兜住模型的概率性。',
      blocks: [
        { t: 'p', x: 'Agent = Model + Harness。「Harness」原意是马具——套在马身上控制方向的那套装备。放到这里，就是包裹在模型外面的工程外壳：用确定性的程序，去约束概率性模型的不可靠。' },
        { t: 'list', items: [
          '事前约束：比如规定「改文件之前必须先读」，否则工具调用直接拒绝。',
          '事后校验：改完代码必须跑测试 / 类型检查，不过不让提交。'
        ] },
        { t: 'p', x: '这些检查是写死的逻辑，不靠模型「自觉」，所以不会因为模型一时抽风而失效。' },
        { t: 'code', lang: 'python', x:
          '# 一个 pre-tool hook 的简化思路\n' +
          'def on_edit_tool_call(tool_input):\n' +
          '    target = tool_input["file"]\n' +
          '    if not file_was_read(target):        # 事前约束\n' +
          '        raise Blocked("改之前必须先读：" + target)\n' +
          '    apply_edit(tool_input)\n' +
          '    if not run_tests():                  # 事后校验\n' +
          '        raise Blocked("测试未通过，回滚本次修改")' },
        { t: 'callout', tone: 'warn', title: '经验法则', x: '能写死的规则，就不要交给模型去「理解」。Harness 越多、越确定，Agent 越稳。' }
      ]
    },
    /* 12 */
    {
      id: 'openclaw', no: 12, title: 'OpenClaw：全新的交互形态',
      lead: '把 Agent 接到 IM 里，远程干活。',
      blocks: [
        { t: 'p', x: 'OpenClaw 代表一类新交互：基于 IM（微信/飞书/Slack 等）接入，你在聊天框里发一句话，远端的 Agent 就去执行任务，把结果回传。和「打开一个 IDE 插件」相比，它更轻、更随时。' },
        { t: 'callout', tone: 'info', title: '为什么它能火又很快降温', x: '它的核心卖点是「不被大厂绑定、可接任意 IM」。但当大厂自家产品也开始内置远程控制能力后，这一差异化的热度就下来了——不过「无厂商绑定」依然是它的长期优势。' }
      ]
    },
    /* 13 */
    {
      id: 'context', no: 13, title: '一切都是上下文',
      lead: '前面所有概念，暗线都是同一件事。',
      blocks: [
        { t: 'p', x: '回看前面的章节：System Prompt 是塞进去的文本，思维链是塞进去的文本，工具调用结果是塞进去的文本，Skills 是按需塞进去的文本，RAG 是检索来塞进去的文本，记忆是开头就塞进去的文本。' },
        { t: 'quote', x: '一切皆上下文（Everything is context）。' },
        { t: 'p', x: '所以 Agent 强不强，本质上取决于：你往上下文里「塞了什么、按什么顺序塞、塞多少、什么时候清理」。这个能力现在有个专门的名字——上下文工程（Context Engineering）。' },
        { t: 'callout', tone: 'tip', title: '记住这条主线', x: '学 LLM/Agent，不必死记每个术语。把它们都看成「往上下文窗口里放文本的不同策略」，就通了。' }
      ]
    },
    /* 14 */
    {
      id: 'back', no: 14, title: '回到开头的问题',
      lead: '为什么有的 Agent 好用、有的不好用？',
      blocks: [
        { t: 'p', x: '回到第 1 节的疑问：同样的底层模型，为什么不同产品体验天差地别？答案是——模型只是引擎，差异全在引擎之外的 Agent 工程：' },
        { t: 'list', items: [
          '上下文组织得好不好（System Prompt、记忆、RAG 怎么串）。',
          '工具/循环设计得合不合理（什么时候调用、怎么收回结果）。',
          'Harness 兜得够不够（规则约束、测试校验）。'
        ] },
        { t: 'quote', x: '引擎相同，整车不同。好用的 Agent，赢在工程，不赢在模型。' },
        { t: 'callout', tone: 'info', title: '和你的 SQL 练习有什么关系', x: '你在这个站点练的「把需求翻译成准确查询 + 校验结果」，正是写 Agent 工具/RAG 检索 SQL 时最核心的能力。会写对 SQL，才能让 Agent 真正「查到东西、查对东西」。' }
      ]
    }
  ]
};
