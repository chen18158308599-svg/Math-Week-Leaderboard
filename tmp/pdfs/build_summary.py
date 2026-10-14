# coding: utf-8
import pymupdf as fitz
from pathlib import Path
from html import escape

OUT=Path('output/pdf/Math_Week_计分项目与QR流程汇总.pdf')
pages=[]
def table(headers,rows):
    return '<table><tr>'+''.join('<th>'+x+'</th>' for x in headers)+'</tr>'+''.join('<tr>'+''.join('<td>'+str(x)+'</td>' for x in r)+'</tr>' for r in rows)+'</table>'
def page(title,body): pages.append('<h1>'+title+'</h1>'+body)
page('Math Week 计分项目与扫码流程汇总', '''<p>活动时间为 2026 年 10 月 19 至 25 日。本文件供计分网站与现场摊位准备使用，列出所有已描述的计分活动、扫码后的操作，以及外部网站和电脑显示需求。</p><p><b>核心结论：</b>卡片题和互动密码项目扫码后 Submit Answer；数字游戏和工作人员判定项目在完成挑战后扫码 Claim Points；Stock Market 扫码进入交易页面，最终结算为排行榜积分。</p>'''+table(['类别及数量','扫码后需要什么','网站及电脑需求'],[
['Code Card 21 项','登录后填写答案，答对即时加分','Math Week 网站内答题；无需现场电脑'],
['Digital 7 项','电脑游戏获胜后显示约 25 秒领奖 QR；手机登录后直接领分','需要电脑或触屏玩游戏；游戏需向计分网站报告胜利'],
['Code Interactive 5 项','完成实物挑战后输入密码；Guess the Beans 输入首次猜数','Math Week 网站内提交；通常无需电脑'],
['Committee 6 项','工作人员确认成功并生成 QR；参与者扫码直接领分','工作人员手机与参与者手机即可；无需电脑'],
['Stock Market 1 项','登录、查看数据、买卖或持有；不是答题或即时领奖','同一 Math Week 网站；手机可交易，主触屏可展示']
])+'''<h2>共同计分规则</h2><p>首次领分或答题前需登录。原计划允许 Student ID 或 email；是否强制学校邮箱及验证方式仍待定。数字游戏可不登录先试玩。每个活动有独立 ID，基础积分每人仅能领取一次，重复完成不再加分。卡片题答错可重试，不扣分。</p><p><b>积分仍是提案：</b>Card 10 分、Digital 15 分、Interactive 20 分、Committee 20 分。指定奖励可再加一次基础分，实际分值与奖励上限需确认。Mini Prize 为现场小奖品，不应自动视为额外积分。</p><p class="note">来源为所提供 event flow 的 PDF 实际页码，第 15、23 至 26、32 至 36、43 至 46、52 至 54 页。以下“建议”代表实施建议；“待确认”代表计划未定或存在差异。本文未核查线上网站当前实现。</p>''')
cards=[('Theme 1',['Age Difference Puzzle','Two-Child Probability Puzzle','Six-Matchstick Triangle Challenge','Fake Coin Balance Puzzle','Monty Hall Problem']),('Theme 2',['Cipher / Code Breaking','Passcode Collision / Birthday Problem','Mean vs Median','Shortest Path / Dijkstra’s Algorithm','Equation to 45 Challenge','Target 24 Challenge']),('Theme 3',['Symmetry & Mirror Writing Challenge','Palindrome Pattern Problem','Medical Test / False Positive Probability','Mondrian Art Problem','Cryptogram Puzzle']),('Theme 4',['Pick’s Theorem Area Puzzle','Falling Tree Geometry Problem','Nested Radical Challenge','Mathematical Pattern / Sum Challenge','Find the Fallacy'])]
rows=[]
for theme,names in cards:
    for name in names: rows.append([theme,name,'Submit Answer'])
page('卡片题 Code Card', '<p><b>统一流程：</b>扫每张卡片的 QR → 登录 → 填写答案 → Submit Answer → 网站判分。所有以下项目均无需连接其他游戏网站，也无需在现场电脑上显示；题目展示在印刷卡片上，手机用于答题。</p>'+table(['主题','计分项目','扫码操作'],rows)+'''<p>建议逐题配置 activity_id、题目、答案格式、标准答案及分值。数值、概率、表达式或图形题的具体输入及判分方式，要由最终题卡确定；不能仅凭项目名称假定答案格式。</p><p class="note">来源 第 23 至 25、26、32 页。第 32 页另提纸质答题记录与 Mystery Chest 解码，是否保留及宝箱是否加分未说明；不要把宝箱默认算作额外计分项目。</p>''')
digital=[['Pattern Sequence','Theme 1','识别数列规律并预测下一项'],['Guess 2/3 of the Average','Theme 1','提交数字，竞争接近平均数的 2/3'],['Deal or No Deal','Theme 1','选择接受报价或继续游戏'],['Think Like KNN! Escape Chase','Theme 2','选出 K 个近邻并判断多数类别'],['Conway Infinite Loop Challenge','Theme 2','构建重复或稳定的生命游戏图案'],['Symmetry Challenge','Theme 3','完成对称与镜像挑战'],['Planarity Challenge','Theme 4','移动顶点，使边不相交']]
page('数字游戏 Digital', '''<p><b>这 7 项的扫码操作均为 Claim Points。</b>先在电脑或触屏完成游戏；获胜后同一屏幕显示约 25 秒的领奖 QR。参与者用自己的手机扫码，必要时登录，然后即时领分，无需在手机重新提交游戏答案。</p>'''+table(['项目','主题','游戏内操作'],digital)+'''<h2>外部网站与电脑显示</h2><p><b>电脑或触屏必需。</b>网站计划每天提供一个可玩的游戏，并要求游戏团队提供真实 embed URL。游戏是否属于独立外部网站、具体网址及可否嵌入尚未确定；不应把已有网上小游戏直接视为可自动计分的版本。</p><p><b>计分连接必需。</b>游戏需把胜利结果传给 Math Week 计分系统，触发领奖 QR。建议连接时传递活动 ID 和胜利凭证，并由服务端校验；手机扫码后领取对应奖励。仅嵌入游戏页面不足以证明已完成计分连接。</p><p>第 26 页写明每题 3 次尝试后锁定。锁定按设备、游戏局或参与者执行，因试玩阶段不要求登录而仍需明确。</p><h2>需要补齐的胜利规则</h2><p>7 项都有玩法描述，但未给出完整机器判定条件。尤其 Guess 2/3 of the Average 需确定收集截止时间、结算人群、并列规则和开奖方式；Deal or No Deal 需确定领分门槛，Conway 需确定稳定或循环检测条件。其余游戏也需明确通关标准。</p><p class="note">来源 第 15、26、33 页。上述服务端连接方案为建议，不能视为原计划已实现。</p>''')
page('实物互动 Code Interactive', '<p>以下 5 项均扫码进入 Math Week 网站提交答案或密码，属于 Submit Answer，不是扫到就领分。实物题通常不需要外部网站或现场电脑。</p>'+table(['项目','扫码后提交内容','电脑及网站需求'],[
['Kanoodle Theme 1','拼满 5 × 11 棋盘后，按阅读顺序输入 5 个星标格上的拼块字母','无需电脑或外部网站；网站校验当前题卡密码'],
['Tower of Hanoi Theme 2','4 片最优解第 5 步的盘号及目标柱，按规定格式输入','无需电脑或外部网站；网站校验密码'],
['Bagua The Missing Order Theme 3','选择抽到的题卡编号，提交最终卦序对应的 8 位数字','无需电脑或外部网站；记忆题需工作人员短时展示'],
['Liar Dialogue Theme 4','提交从对话推导出的隐藏数字或事实','无需电脑或外部网站；题卡内容及答案待编写'],
['Probability Guess the Beans Theme 1','提交第一次独立猜测的数量；落在容差范围内计分','无需外部网站；群体平均值可在纸质海报或屏幕展示']
])+'''<h2>需要在页面上特别处理</h2><p><b>Guess the Beans：</b>只计第一次独立猜测，不应沿用普通密码题无限重试的行为。容器内真实数量、容差区间和材料待定。第 36 页一处提出第二次猜测是否计分，后文又明确只计首次；建议保留首次计分，看到群体平均后的第二次猜测仅用于演示，最终由主办方确认。</p><p><b>Bagua：</b>每张题卡有独立答案，页面必须能识别对应题卡，建议 QR 带题卡编号或让用户选择。8 位序列建议使用文本输入，保留开头的 0。记忆提示是否保留在无人值守摊位仍待定。</p><p><b>答案保密：</b>标准密码应保存在判分端，参与者页面只显示输入要求与答题反馈，不直接展示答案。</p><p class="note">来源 第 34 至 36 页。题卡识别、输入框与答案保密为实施建议。</p>''')
page('工作人员判定 Committee', '<p><b>以下 6 项均为 Claim Points。</b>工作人员先检查结果，再用手机生成领奖 QR；参与者手机扫码登录并领分。即使现场需要口头或纸上答题，扫码后也无需再提交答案。所有项目均无需现场电脑。</p>'+table(['项目','获得积分的条件','特殊处理'],[
['Conway’s Soldiers Theme 1','士兵到达线上的第 4 行，经工作人员确认','第 5 行不可能，不设成功奖励；参考网页仅供工作人员'],
['The Knight’s Tour Theme 2','按所选棋盘规则，合法且不重复地走遍可用格','小棋盘及带洞版本分值、时限待定；参考网页仅供工作人员'],
['Rubik Mini Booth Theme 4','时限内完成一层或完整魔方，经协会成员确认','完整复原分数更高；分档及限时待定；最快纪录可纸质展示'],
['Luban Lock Challenge Theme 3','时限内完整组装指定鲁班锁；绳环版需解开并复原','详细章节新增；型号、时限、提示是否扣分待定'],
['Take a Chance Theme 1','赢 Pig 或 Two for One，基础分只给一次','解释 Kruskal 或 Parrondo 可获一次同额 bonus；两种解释完整可得小奖品'],
['A Blind A Deaf A Mute Theme 3','三人合作，在时限内由 Blind 报出正确答案','是否三人各得分需确认；建议逐人生成领取凭证或逐人登记']
])+'''<h2>Take a Chance 的计分单位</h2><p>Pig 与 Two for One 属于同一摊位的基础奖励，不应分别重复发基础分。Kruskal 与 Parrondo 的解释按原文属于一次 bonus，建议作为单独奖励类型记录。两项都解释完成所获 Mini Prize 不自动再加积分。按暂拟分值，基础 20 分加一次 bonus 20 分，共 40 分。</p><h2>外部网站只作参考</h2><p>Conway’s Soldiers 的 cleverlearning.co.uk 页面、Knight’s Tour 的 maths-resources.com/knights/ 或 enclose.horse、三人合作题的 YouTube 视频，都是工作人员参考资料；不要求与排行榜做技术连接，也不要求在参与者电脑上显示。Parrondo 的长期模拟图可打印展示。</p><p class="note">来源 第 43 至 50、61 页。总表只列 5 个 Committee 项目，详细章节另列 Luban Lock Challenge，因此本汇总按 6 项纳入。Rubik 合作场次为同一活动，不重复计作另一摊位。</p>''')
page('Stock Market 与待确认事项', '''<p><b>扫码操作：</b>注册或登录 → 进入 Stock Market → 阅读 Market Brief → 查看指数数据 → 提交买入、卖出或持有决定。这不是 Submit Answer，也不是扫码立即 Claim Points；最终投资组合价值转换为总排行榜积分。</p><p><b>连接与显示：</b>原计划安排在同一 Math Week 网站内，不要求跳转其他交易网站。需要接通参与者账户、摊位积分、现金、持仓、交易历史和排行榜。学校真实历史数据应预先整理成 CSV 或 sheets 数据包，不需要活动当天实时连接学校系统。手机可交易，主触屏可显示市场与排行榜；不需要独立交易电脑。</p><p>原计划规定每人初始 $5000、无持仓；前 6 天可交易，第 7 天 10 月 25 日冻结并结算。投资组合价值为现金加持仓按最新价格计算的价值。摊位积分如何进入交易现金、结算价值如何折算积分，以及是否允许投资亏损降低已得摊位积分，仍需定案。</p><h2>上线前需统一的规则</h2>'''+table(['问题','需要确认的决定'],[
['工作人员扫码方向冲突','第 15、26 页是工作人员生成 QR，参与者扫码；第 52 页是工作人员扫描个人 QR 并登记结果。建议以前者为主流程；后者若保留，作为明确的另一种登记方式，防止同一结果重复发分。'],
['总排行口径与结算时间','第 15 页写总积分排行，第 53 页写投资组合价值排行；需区分市场排行与最终总排行。闭幕颁奖为 10 月 24 日 15:00，但市场 10 月 25 日才结算，两者时间需统一。'],
['分值与分档','确定四类基础分、bonus、Knight 小棋盘分值、Rubik 分档以及提示扣分规则；奖励去重应独立于基础分去重。'],
['卡片与 Mystery Chest','第 32 页提到纸质答案记录及宝箱解码；需确认是否保留该支线、额外入口和额外积分。现阶段宝箱计分未定义。'],
['活动数与题卡数','目前可逐项列出的 Card 是 21 项；总表写 20+。Interactive 中 Bagua 有多张题卡，是否各题单独计分需明确；不能自动当作额外活动。'],
['Digital 连接与判胜','提供 7 个可用游戏或 embed URL、胜利判定与回传方式、三次尝试的锁定范围及领奖二维码有效期。'],
['身份与多人活动','确认邮箱验证、个人 ID、三人合作如何逐人发分，以及工作人员账户可发哪些奖励。']
])+'''<h2>不纳入默认计分的内容</h2><p>Opinion Wall、普通展览与装置、商品预购、Movie Night、Expository Talk 及其 workshop、Library Data Talk 均未定义积分。鲁班锁及拓扑谜题自由试玩明确无密码、无积分；只有工作人员主持的 Luban Lock Challenge 计分。讲座 workshop 的外部应用和电脑展示需求不等于计分连接需求。</p><p class="note">来源 第 13、15、26、31 至 36、52 至 61 页。以上待确认事项应在活动规则及计分配置中统一后执行。</p>''')

css='''@font-face {font-family: cjk; src: url(simhei.ttf);} body {font-family: cjk; font-size:10.3pt; line-height:1.5; color:#172330;} h1 {font-size:20pt; color:#111; margin:0 0 14pt;} h2 {font-size:13pt; margin:14pt 0 6pt;} p {margin:6pt 0 9pt;} table {border-collapse:collapse; width:100%; font-size:9.2pt;} th {background:#e8eef4; text-align:left; padding:7pt; border:0.5pt solid #bdc9d3;} td {padding:6pt; border:0.5pt solid #bdc9d3; vertical-align:top;} .note {font-size:8.4pt; color:#536473;}'''
doc=fitz.open()
for i,html in enumerate(pages):
    p=doc.new_page(width=595,height=842)
    spare,scale=p.insert_htmlbox(fitz.Rect(38,38,557,795),html,css=css,archive=fitz.Archive('C:/Windows/Fonts'),scale_low=0.85)
    if spare<0: raise RuntimeError('Page overflow '+str(i+1))
    print('PAGE',i+1,'scale',scale)
    p.insert_text((38,820),f'MATH WEEK 2026    |    {i+1} / {len(pages)}',fontsize=8,color=(.35,.4,.45))
doc.save(OUT)
for i,p in enumerate(doc): p.get_pixmap(matrix=fitz.Matrix(1.3,1.3)).save(f'tmp/pdfs/summary-{i+1}.png')
print(OUT.resolve())
