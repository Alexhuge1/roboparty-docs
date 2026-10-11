/* Technical-report additions are kept together so figures and evidence stay versioned. */
function integrateTechnicalReport(pages) {
  const pdf = 'assets/report/RP1_TechReport_v0.8.12.pdf';
  const figures = new Map(window.RP1_REPORT_FIGURES.map(figure => [figure.number, figure]));
  const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const source = (page, label = `报告第 ${page} 页`) => `<a href="${pdf}#page=${page}" target="_blank" rel="noreferrer">${label}</a>`;
  const paragraph = text => `<p>${text}</p>`;
  const note = text => `<p class="report-note">${text}</p>`;
  const table = (headers, rows) => `<div class="doc-table-wrap"><table class="doc-table report-table"><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const figure = (number, description = '', label = '') => {
    const item = figures.get(number);
    const caption = label || item.caption.replace(/\s*\[\d+\]/g, '').replace(/。$/, '');
    return `<figure class="report-figure" id="report-figure-${number}"><a class="report-image" href="${item.src}" data-report-figure="${number}" aria-label="放大：${esc(caption)}" title="放大图片"><img src="${item.src}" width="${item.width}" height="${item.height}" alt="${esc(caption)}" loading="lazy" decoding="async"></a><figcaption><span class="report-figure-number">图 ${String(number).padStart(2, '0')}</span><div><strong>${caption}</strong>${description ? `<p>${description}</p>` : ''}<span class="report-source">RP1 技术报告 v0.8.12 · ${source(item.page)}</span></div></figcaption></figure>`;
  };
  const section = (id, title, html) => ({id:`report-${id}`, title, html});
  const render = sections => sections.map(s => `<section class="section-anchor report-section" id="${s.id}"><h2>${s.title}</h2>${s.html}</section>`).join('');
  const add = (key, sections) => {
    pages[key].toc = [...sections.map(s => [s.id, s.title]), ...pages[key].toc];
    pages[key].body = render(sections) + pages[key].body;
  };
  const create = (key, label, kicker, lead, sections) => {
    pages[key] = {label, title:label, kicker, lead, toc:[], body:''};
    add(key, sections);
  };
  const link = (route, title, detail) => `<a class="report-chapter" href="#${route}"><strong>${title}</strong><span>${detail}</span></a>`;

  const platformDocument = document.createElement('template');
  platformDocument.innerHTML = pages.platform.body;
  platformDocument.content.querySelector('#metrics').innerHTML = '<h2>运行配置</h2>' + table(['配置目标','参数','定义'], [
    ['主机控制','250 Hz','默认 dt = 4 ms，需运行测量确认'],
    ['策略更新','50 Hz','每五个主机周期更新一次'],
    ['身体配置','24 / 28 主动轴','头部、手部独立登记']]);
  pages.platform.body = platformDocument.innerHTML;
  const introDocument = document.createElement('template');
  introDocument.innerHTML = pages.introduction.body;
  introDocument.content.querySelector('#overview .callout').remove();
  pages.introduction.body = introDocument.innerHTML;
  const hardwareDocument = document.createElement('template');
  hardwareDocument.innerHTML = pages.hardware.body;
  const oldArchitecture = hardwareDocument.content.querySelector('#hardware-visuals figure');
  oldArchitecture.querySelector('img').alt = 'RP1 平台控制软件架构';
  oldArchitecture.querySelector('figcaption').textContent = '平台控制架构：输入、策略、实时控制与执行';
  hardwareDocument.content.querySelectorAll('td').forEach(cell => {
    if (cell.textContent.includes('5 × CAN-FD')) cell.append('（架构标称；四路桥接与 IMU 路径见本页报告核对）');
  });
  pages.hardware.body = hardwareDocument.innerHTML;

  pages.introduction.title = 'RP1 人形机器人平台';
  pages.introduction.lead = '围绕同一机器人身体，连接机械、电气、运动控制、学习与整机验证。';
  add('introduction', [
    section('overview', 'RP1 本体',
      figure(3, '正面、侧面与背面展示躯干、双臂、骨盆、腿部和足部的布局。外观标注来自产品资料，身体轴数与工程参数见平台概览。') +
      `<div class="report-inline-links">${link('report', '技术报告 v0.8.12', '2026.10.12 · 78 页原文')}${link('platform/report-configurations', '24 / 28 轴身体', '头部与双手按独立模块计数')}${link('hand', 'RP Hand 灵巧手', '6 个主动轴 · 11 个机械自由度')}</div>`),
    section('capabilities', '全身动作与地形任务',
      paragraph('平地行进依靠左右支撑交替；下蹲与起身由髋、膝、踝共同调节身体高度。台阶任务进一步要求重心转移、足端净空与落脚位置协调。') +
      figure(42, '平地行进、下蹲、起身的代表状态，取自整机演示。') +
      figure(43, '上台阶时建立较高支撑面，下台阶时控制落脚与负载转移。图中未给出台阶高度、成功率或负载测量。') +
      figure(44, '感知跑步项目的场景可视化序列：接近障碍、上肢支撑、跨越与继续运动。该图属于项目演示，不作为实机越障性能测量。'))
  ]);

  add('platform', [
    section('configurations', '身体配置与自由度',
      paragraph('RP1 的工程模型包含 24 轴和 28 轴身体。两者共用六轴双腿与两轴腰部，差异主要在上肢。头部和手部单独登记，避免将机械自由度与主动控制轴混在一起。') +
      figure(18, '24 轴为身体配置；30 轴产品配置为 28 轴身体加两轴头部。两者均不计独立灵巧手。') +
      table(['配置项','24 轴身体','28 轴身体'],[
        ['每腿 / 腰部','6 / 2','6 / 2'],['每臂','5','7'],['URDF 质量之和','39.1093 kg','40.7264 kg'],['四条执行器网段','7 / 7 / 5 / 5','7 / 7 / 7 / 7']]) +
      note('模型质量来自 URDF 参数求和，不是实机称重。28 轴身体 + 2 轴头部 + 双手各 6 主动轴 = 42 主动轴。训练侧 RP1_3_CFG 为 24 轴，默认部署为 28 轴，需要分别匹配策略。' + source(5))),
    section('body-map', '人体部位与执行器分组',
      figure(4, '30 轴配置按颈、双肩、双肘、双腕、腰、双髋、双膝、双踝归并为 14 个功能组。连线表示部位对应，不代表人体关节与机器人轴逐一等价。') +
      paragraph('腰部仅有 roll 与 yaw。人体俯身需要分配到髋、膝及整体姿态；新增头部、末端或计算模块时，BOM、质量、碰撞模型和控制设备表同步更新。')),
    section('scale', '平台尺寸背景与参数口径',
      figure(2, '蓝框标出 RP1。该对照图标注 135 cm，另有产品资料写 130 cm，需统一头部配置、站姿和测量基准。') +
      table(['产品资料中的描述','技术报告中的核对条件'],[
        ['整机质量 < 30 kg','尚缺同一配置的实机称重；不能用模型质量替代。'],
        ['单臂负载 5 kg','绑定末端、臂展、姿态、重心、保持时间及温度。'],
        ['速度 4 m/s / 续航 ≥ 3 h','需要速度测法、任务谱、电池能量与完整运行记录。'],
        ['主电池热插拔','有主备电架构依据；备电负载范围、保持时间与允许姿态需按样机验证。']]) +
      note('以上是参数核对项，不作为已测整机指标。' + source(72)))
  ]);

  create('mechanical', '机械结构与快拆', 'HARDWARE / MECHANICAL', '从人体对应构型、非共点髋部与并联踝，到腕部、头部和关节的维护接口。', [
    section('morphology', '人体构型与任务空间',
      paragraph('人体参考提供关键点、肢段方向和根位姿。RP1 在自身比例、关节范围、接触和自碰撞约束下生成可执行动作，人体模型的参数维数与机器人主动轴数分别定义。') +
      figure(5, 'SMPL-X 表示身体、手部和面部；RP1 身体控制提取任务需要的部位与运动信息。图源及文献见报告原页。')),
    section('hip', '非共点髋部：Pitch → Roll → Yaw',
      figure(6, '对照人体球窝关节、正交与斜置串联。RP1 的零位轴向正交，同时采用分离的关节原点；示意箭头的交点不能用于判断轴线共点。') +
      paragraph('左侧 Roll 原点相对 Pitch 原点的位移为 (31.9, 61.3, −60.7) mm，右侧横向位移反号。60.7 mm 是竖直下移量，不是两原点间的直线距离。原点偏置会影响大腿轨迹、碰撞包络和连接件载荷。') +
      figure(8, '零位下的正面与侧面投影。当前模型确认 Roll 下移，不能据外壳倾斜推断 Pitch 输出轴倾斜。') +
      figure(7, 'Atlas、T800、OLI、Walker C、H2、A3 的外观参考。照片用于比较骨盆与模组包络，实际轴线和可达范围需模型或测试确认。')),
    section('ankle', '并联踝与闭链约束',
      figure(12, 'RP1.3.4 STEP 中的下肢装配，显示串联髋膝与闭链踝。它是 CAD 几何视图，不是应力仿真。') +
      paragraph('两个电机通过连杆共同驱动踝部 pitch / roll。电机速度、输出力矩及局部刚度随姿态变化；连杆尺寸、安装点、解分支与电机方向一起进入闭链模型。') +
      `<div class="report-equation">q̇<sub>m</sub> = J(q) q̇<sub>j</sub>　 ·　 τ<sub>j</sub> = J(q)<sup>T</sup> τ<sub>m</sub></div>` +
      paragraph('检查全行程干涉、线束余量、零位及加载响应，再将电机限制映射到关节空间。靠近奇异姿态时，不能把两个电机的独立最大力矩直接相加。' + source(36))),
    section('quick-release', '腕部、头部与任务模块',
      figure(13, '三种可更换手部末端。更换后同步更新工具坐标、质量与质心、碰撞几何和电气配置，并检查上游关节负载。') +
      figure(14, '头部感知模块的连接与拆装位置。模块快拆不自动意味着允许带电操作。') +
      figure(15, '感知头、数采头和运控头提供不同设备布置。更换后更新传感器外参、数据通道及模型配置。')),
    section('clamps', '抱箍、材料与装配恢复',
      figure(16, '蓝色独立抱箍与本体承载面共同固定肩部和大臂关节，留出局部拆装路径。') +
      paragraph('维护后核对模组型号、设备 ID、方向与零位，恢复安装基准和电气连接，再完成受限行程复测。承载件主要采用 AL6061-T6，脚板采用 AL7075，部分支撑使用钢件；聚合物与弹性体用于覆盖、固定和缓冲。') +
      figure(17, '本体覆盖件与结构零部件展开。具体部件的材料、加工与数量以相应 BOM 修订为准。'))
  ]);

  create('actuators', 'ROMOMO 关节模组', 'HARDWARE / ACTUATORS', '四种关节模组、驱动与传动结构，以及硬件规格和仿真执行器模型之间的对应。', [
    section('romomo-family', '模组系列与选型',
      figure(9, 'ROMOMO 5757、6562、8462、10062 系列，覆盖不同尺寸、持续负载与动态输出需求。') +
      table(['名义规格','5757','6562','8462','10062'],[
        ['额定扭矩 / N·m','8','9.5','14','44'],['峰值扭矩 / N·m','25','28.5','42','140'],
        ['额定转速 / rpm','130','157.9','60','80'],['空载最大转速 / rpm','156','200','155','130'],
        ['减速比','19.05:1','17.4:1','20.5:1','20.7:1'],['外径 × 高度 / mm','57 × 57','65 × 62','84 × 62','100 × 62'],
        ['中空直径 / mm','4.5','4.5','8','10'],['质量 / kg','0.406','0.491','0.648','1.188']]) +
      note('四种模组均标称 48 V、CAN-FD。表格为产品页名义参数，不是整机实测；峰值持续时间、散热条件与实际装机型号需配套确认。' + source(11)) +
      paragraph('近端关节优先满足支撑力矩，远端关节同时控制尺寸和摆动惯量。选型还需检查轨迹中的重力、惯性、摩擦、速度、占空比及温升。')),
    section('romomo-inside', '驱动、传动与支撑',
      figure(10, '驱动器与编码器构成控制反馈端，定子和转子产生电磁转矩，行星齿轮组减速，交叉滚子轴承与端盖支撑输出端。') +
      figure(11, '实物拆解对应爆炸图中的端盖、轴承、齿轮与外壳，便于建立维修部件和结构图之间的对应。')),
    section('actuator-model', '训练中的力矩与速度包络',
      paragraph('RoboPartyActuator 在延迟 PD 上施加速度相关的峰值力矩限制。速度低于拐点时保持峰值，高速区逐步下降到空载速度处的零输出，限制不现实的高速大力矩。') +
      figure(34, '24 轴 RP1.3 训练资产的解析曲线，属于仿真配置。不能直接替代 ROMOMO 产品规格或整机台架结果。') +
      table(['训练关节组','峰值 / N·m','拐点速度 / rad·s⁻¹','空载速度 / rad·s⁻¹'],[
        ['腰 / 髋 / 膝','145.53','8.37758','13.61357'],['踝','56.0','15.70796','20.94395'],['肩 / 肘 / 腕','28.0','15.70796','20.94395']]) +
      note('训练模型、URDF 限制、协议量程和实际持续输出是不同口径。当前 rated_effort / rated_velocity 尚未形成热积分或硬裁剪；温升、摩擦和回差仍需实测辨识。' + source(35)))
  ]);

  add('hardware', [
    section('electrical', '供电、通信与停止链路',
      paragraph('48 V 主电池分别接入 MAIN 与 BACKHUB；30 V 备用路径经 HOTSWAP 和 BACKHUB 支持关键回路连续供电。信息链路由 RK3588 系列主机经 USB 桥接到执行器网段，停止路径另经 MCU 处理。') +
      figure(19, '红色为供电或停止路径，蓝色为信息连接，绿色为备电或独立 IMU 路径。虚线标出可选配置与待确认的物理映射。') +
      note('报告核对：HPM 桥接固件提供四路 CAN-FD，默认 28 轴每路 7 个电机。架构资料中的五路描述与 can_hipnuc 的物理接入仍需实机连线、枚举结果确认。' + source(21))),
    section('pcb-layout', 'PCB 制造图层与板卡分工',
      figure(20, 'MAIN 与 BACKHUB 各有六个铜层。图像叠合铜层、阻焊、丝印、焊膏、钻孔和板框；底面按观察板底的方向镜像，各板不按同一比例显示。') +
      figure(21, 'HOTSWAP 与 HANDPlusPro 各四层，MCAP 双层；分别对应备用供电切换、末端连接与执行器侧局部储能。') +
      table(['板卡','系统作用','配套核对'],[
        ['MAIN / BACKHUB','主机、供电时序与背部互连','BOM 型号、线束针位、负载电压、温升与接口'],
        ['HOTSWAP / MCAP','备电接管 / 局部储能','切换波形、保持时间、电压瞬态与温度'],
        ['HANDPlusPro / FPC','手部连接 / 主控与背板互连','插接、应力、信号质量'],
        ['FAN / HEAD / IMU','热管理 / 头部外围 / 姿态反馈','风道、失效行为、外参、时间戳和干扰']]) +
      paragraph('Gerber 展示制造几何。电流能力、阻抗与散热裕量还需结合叠层、铜厚、器件和测量，不能只根据绿色版图判断。' + source(19))),
    section('physical-ports', '外部接口与感知配置',
      figure(22, '实物接口包括标注的 19 V / 12 V 外部供电、Type-C、双网口和三个 USB 口。') +
      figure(23, '正视线稿用于定位接口，非比例图。电压、极性、针脚与可接负载应以对应板卡和线束资料确认。') +
      paragraph('部署仓库的 D435i 配置提供 480 × 270、60 Hz、Z16 深度流入口；该配置关闭彩色流与相机内置 IMU。它表示一项可选配置，不能据此认定每台 RP1 均装有该相机。')),
    section('battery-swap', '主电池更换与连续供电',
      figure(24, '背部主电池的拆卸、移出、重新装入与复位。主电池热插拔能力不自动适用于头部、末端或执行器接口。') +
      paragraph('换电分别记录电气切换、人工操作和任务恢复时间，同时观察母线波形、备用电流、主机重启、设备重新枚举和连接器温升。批准的静止或受控姿态、保持负载和时间由样机验证；140 W 为充电板的额定描述。') +
      `<p><a href="#testing/report-reliability">查看 SYS-REL-013 换电耐久方法</a></p>`)
  ]);

  create('hand', 'RP Hand 灵巧手', 'HARDWARE / DEXTEROUS HAND', '可更换的多指操作末端：机构、规格、触觉选配和六主动轴控制接口。', [
    section('hand-product', '掌侧与背侧结构',
      figure(60, 'RP Hand 掌侧与背侧外观。拇指侧摆和屈伸配合其余四指弯曲，形成不同抓取姿态。') +
      paragraph('蜗轮蜗杆传动将 6 个主动控制轴与 5 个被动或联动自由度组织为 11 个机械自由度。紧凑掌部减小腕端附加质量，作为末端接入时仍需更新腕部负载与动力学模型。') +
      table(['手册名义规格','参数'],[
        ['外形尺寸','147.54 × 73.53 × 26.35 mm'],['质量','379 ± 10 g'],['机械自由度 / 主动轴','11 / 6'],
        ['拇指侧摆 / 屈伸','0–87.5° / 0–65°'],['四指弯曲','0–72°'],['静态 / 最大电流','≤ 0.1 A / ≤ 2.5 A'],
        ['最小开合时间','≤ 0.7 s'],['环境 / 防护标称','−10–45 °C，10–90% RH；IP30']]) +
      note('供电范围在手册中写为 12 V（−10%）至 48 V（+10%），实际工作电压按具体硬件型号确定。上述参数为名义规格。' + source(74))),
    section('hand-grasp', '抓取方式与触觉选配',
      figure(13, '腕部快换支持按任务选择末端；连接器集成供电与通信，通信针位按具体设备承载 CAN 或 RS485。') +
      paragraph('勾提依靠弯曲手指承托物体，夹持依靠接触力与摩擦保持物体。两种动作需要分别定义姿态、接触位置、负载方向和保持时间，不能将勾提质量直接换算成抓力。') +
      table(['触觉选配资料','接入时需核对'],[
        ['掌部法向 0–25 N / 分辨率 0.1 N','传感器型号、标定、噪声、漂移及过载条件'],
        ['指部法向 0–20 N / 分辨率 0.01 N','采样率、有效带宽、各通道与关节的时间同步'],
        ['切向 0–360°','该数值为方向角范围，切向力大小量程仍待补充']]) +
      note('当前报告核对的公共 SDK 未包含触觉读取接口。5 kg、10 kg、50 N、重复定位与寿命等产品描述尚需统一试验条件，未作为本页已验证指标。' + source(72))),
    section('hand-sdk', 'CAN-FD 与六轴控制',
      paragraph('Linux SDK 提供 C++ 和 Python 接口，按六个主动轴组织运动命令与反馈。仲裁速率为 1 Mbps，数据速率为 5 Mbps，反馈周期配置为 20 ms；双手由两个独立进程分别管理设备会话和总线。') +
      table(['接入对象','一致性要求'],[
        ['六主动轴 → 十一机械自由度','显式定义主动、被动与联动关节映射'],
        ['命令与模型','逐轴确认零位、方向、单位转换和运动范围'],
        ['位置 / 速度 / 角度 / 电流反馈','读取最近接收的缓存状态，同时检查反馈新鲜度'],
        ['触觉扩展','另行接入采集与标定，再与关节状态同步']]) +
      `<p><a href="https://github.com/Roboparty/rp_dexhand" target="_blank" rel="noreferrer">rp_dexhand 仓库</a> · ${source(75)}</p>`)
  ]);

  add('interfaces', [section('stop-interface', '停止请求与设备状态',
    figure(25, '机身按键、遥控器与软件停止入口。右侧是软件界面示意，图像中的状态不代表实时设备反馈。') +
    paragraph('硬线或 433 MHz 请求经 MCU 处理，遥控端还提供软件确认。请求到达、驱动使能变化和物理停止是不同事件；设备重新上线后需重新检查标定、限幅和允许运动的条件。') +
    `<p><a href="#hand">RP Hand 六轴接口与触觉边界</a> · <a href="#motion/report-runtime">执行器中间层与状态机</a></p>`)]);

  add('motion', [
    section('software-stack', '从物理设备到策略运行',
      figure(26, '硬件与模型 → 设备与系统 → 机器人运行时 → 研究与数据。测试、版本清单和回归覆盖各层。') +
      paragraph('RP1_firmware 由 roboparty_build、EtherCANFD 和 roboparty_repo 组织 BSP / 镜像、USB-CAN-FD 桥接及软件包分发。桥接基于 HPM5E31 RISC-V、USB High-Speed、gs_usb 与 Linux SocketCAN，当前快照提供四路 CAN-FD。')),
    section('runtime', '执行器中间层与运行状态',
      figure(27, '策略输出经过 RobotInterface 的顺序、零位、方向和闭链变换，再由 MotorDriver 适配具体厂商协议。') +
      paragraph('驱动工厂包含 DM、EVO、LRO、RP、XYN 五类后端，负责初始化、使能、模式设置、状态刷新与错误处理。支持的协议和模式仍由各后端定义，例如当前 LRO 实现会拒绝 EtherCAT 请求。') +
      figure(28, '报告提出的共同生命周期：发现设备、核验标定和限制、就绪、运行、故障与重新检查。各驱动实际能力仍需逐项确认。')),
    section('timing', '控制周期与观测时效',
      figure(29, 'dt = 0.004 s、decimation = 5，对应 250 Hz 主机控制和 50 Hz 策略更新目标。刻度是调度目标，不是实测耗时。') +
      table(['策略配置','观测输入','动作输出'],[
        ['默认 28 轴速度指令部署','单帧 93 维；10 帧历史共 930 维','28 轴；动作比例 0.25'],
        ['RP1.3 BeyondMimic','单帧 126 维，含参考位置与速度','24 轴；独立配置和导出模型']]) +
      paragraph('多关节反馈可能来自不同采样时刻。记录采样时间、接收时间、数据年龄和同一观测的时间跨度，结合周期分布及最长停顿检查控制链路。两种策略的身体和输入契约不能直接互换。' + source(71))),
    section('sim2real', '分阶段迁移与真实任务',
      figure(33, '机器人描述、执行器模型、策略部署与物理评价共同闭环；测试结果返回模型和训练。') +
      table(['阶段','交付依据'],[
        ['接口对齐','模型、关节顺序、单位、坐标、观测历史和动作缩放的固定输入对照'],
        ['Sim2Sim','同一策略在独立仿真器运行，保留模型差异与任务回放'],
        ['实机标定','方向、零位、IMU 外参、反馈时效和受控运动记录'],
        ['受限任务 → 目标任务','解释误差、支撑与保护行为，再记录成功、干预、能耗和回归基线']]) +
      figure(36, '行走与跑步的连续视频切片，展示支撑交替及身体姿态。演示未提供实测速度、能耗或统计成功率。'))
  ]);

  add('training', [section('training-flow', '从动作参考到实机部署',
    figure(32, '动作与模型 → 物理训练 → 策略导出 → 独立仿真 → 标定 → 机器人任务，部署反馈返回模型和数据。') +
    paragraph('RP1.3 BeyondMimic 使用 Actor–Critic 与 PPO。物理步长 5 ms，每四步更新动作，对应 50 Hz 策略目标；奖励同时考虑身体跟踪、关节加速度、力矩和动作变化。') +
    paragraph('导出包保存 Actor、观测定义、归一化、历史排列、动作缩放和名义姿态。MuJoCo 路径采用 TorchScript，默认实机路径采用 ONNX Runtime，需分别匹配输入与动作接口。') +
    `<p><a href="#learning/report-beyondmimic">查看 126 → 512 → 256 → 128 → 24 网络结构</a> · <a href="#actuators/report-actuator-model">查看执行器模型与速度包络</a></p>`)]);

  add('data', [
    section('retargeting', '人体动作、物体与场景',
      figure(30, 'human-humanoid-tools 的 H2R 重定向与几何场景处理。物体或地形序列需要同时保留动作与接触环境。') +
      table(['来源','数据含义','处理重点'],[
        ['AMASS','SMPL 系列姿态、体型、根平移与帧率','读取模型类型、时间与单位'],
        ['LAFAN1','BVH 骨架层级与局部旋转','恢复全局姿态及根轨迹'],
        ['GVHMR','单目视频恢复的人体运动','检查遮挡、相机运动与根漂移'],
        ['OMOMO / OmniContact','人体、物体位姿及几何','保持接触和任务时间关系'],
        ['地形动作','人体轨迹与场景网格','落脚位置、障碍净空和可达性']]) +
      paragraph('平地参考可进入 Newton IK 路径，物体和网格交互可使用 MPC-SQP。目标模型、根节点、关键部位、关节范围和自碰撞约束随 RP1 身体版本固定。')),
    section('data-loop', '数据到策略的闭环',
      figure(31, '动作来源经 hhtools 生成 RP1 数据，再连接训练、Sim2Sim、实机校准与日志反馈。') +
      paragraph('重采样按物理时间处理；四元数顺序、角度解缠绕、根坐标与关节排列显式记录。先检查足底滑移、穿透、限位和姿态跳变，再做动态跟踪与执行器饱和评价。训练与测试按原始采集序列划分，近重复动作和重叠窗口不跨集合。'))
  ]);

  add('learning', [
    section('party-roadmap', 'PartyOS：运动执行到任务组织',
      figure(37, '路线图以关节模组、整机和 SDK 为基础，展开数据、控制、感知、部署和上层任务。路线分支的验证阶段并不相同。') +
      `<p><a href="#partyos">继续阅读 P-BFM、I-BFM、INTACT 与任务工具</a></p>`),
    section('beyondmimic', 'BeyondMimic 的 RP1.3 适配',
      figure(38, 'Actor 输入 126 维，隐藏层 [512, 256, 128] 使用 ELU，输出 24 维，共 232,344 个 MLP 权重与偏置。') +
      paragraph('观测由 48 维参考关节位置与速度、6 维角速度和投影重力、72 维本体关节位置、速度及上一动作组成。任务使用 waist_yaw_link 参考锚点，RP1.3 资产、dance1.npz、10 s 回合与动作结束后的保持项成套配置。') +
      note('该网络是 24 轴、单帧的参考跟踪策略。默认 28 轴、930 维历史的速度指令部署不能直接替代它。')),
    section('mimiclite', 'MimicLite：人体动作跟随',
      figure(39, 'RP1 与操作者的下蹲、起身、跳跃对应演示。人体参考需经过重定向，再通过闭环策略执行。') +
      paragraph('MimicLite 将训练、共享仿真、动作转换和部署分成组件，用 observation class 与 YAML 管理策略输入。公开参考使用的未来动作窗口、推理耗时与操作者到机器人端到端时延应分别测量。') +
      figure(40, '报告于 2026-10-11 收录的 G1 仿真榜单，作为评测协议参考，不是 RP1 跟踪成绩。') +
      note('榜单中 26.68 mm Body Pos、0.088 rad Body Ori 等值属于所选 G1 基准。RP1 的定量结论需要对应身体、参考动作、运行配置及日志。')),
    section('ufo', 'UFO：受扰恢复与行为表示',
      figure(41, 'RP1 在人工扰动后调整跨步与支撑，恢复平衡。扰动力、重复次数和恢复成功率未在演示中量化。') +
      paragraph('UFO 通过 RobotState、数据 manifest、目标机器人 XML 与可选 URDF 组织训练。ONNX 导出配套关节、Actor 输入、潜变量和动作维数；参考编码与潜变量更新周期需要单独适配。')),
    section('shared-adapter', '跨算法共同接口',
      figure(45, '方法层定义观测、参考编码、动作及时间约定；共享平台层承担身体模型、关节接口与设备执行。') +
      paragraph('每种方法保留目标模型、数据转换、观测构造、动作解释、时间约定与运行入口。比较时固定样机、标定、执行器与计算模式，再分别报告完成率、误差、延迟、能耗和人工干预。'))
  ]);

  create('partyos', 'PartyOS 感知与任务', 'LEARNING / PARTYOS', '从地形适应、物体交互和视觉意图，到场景构建、评测与可复用技能。', [
    section('pbfm', 'P-BFM：感知条件下的运动',
      figure(46, '行为意图进入共享潜空间，Actor 结合本体状态与深度特征生成运动；ERI 显式根运动指令调整朝向和水平速度。', 'P-BFM 预训练与条件推理框架') +
      paragraph('平地动作先验与仿真地形交互共同训练适应能力，不要求每一种地形都提供配对示范。同一动作意图可以在不同地形上形成不同抬脚高度、步幅与身体姿态。') +
      figure(47, '同一参考动作在台阶、坡面、离散障碍和粗糙地形上的适应示例。原项目公开实机平台为 G1。') +
      note('RP1 接入需要重新匹配深度相机外参、视场、时序、本体观测和地形碰撞模型，并在对应实机任务上验证。' + source(51))),
    section('ibfm', 'I-BFM：奖励条件下的物体交互',
      figure(48, '运动数据、交互探索与前向–后向表示共同预训练；任务奖励在推理时确定行为潜变量。', 'I-BFM 预训练与奖励推理框架') +
      figure(49, '原项目 G1 的搬箱、推箱、踢箱连续画面，用于解释不同接触任务，不作为 RP1 实机结果。') +
      paragraph('RP1 适配需要统一根状态、关节、物体位姿与接触信息，同时建模物体质量、摩擦和末端几何。物体交互改变支撑与负载，操作目标、全身平衡和关节输出应共同检查。')),
    section('intact', 'INTACT：视觉意图到动作',
      figure(50, '当前视觉状态与目标意图连接到动作生成或规划。图中数值属于原研究基准，RP1 适配需要独立评价。') +
      paragraph('RP1 方向关注把模型输出组织成末端目标或下层技能请求，并通过运行时执行。视觉输入、任务目标、动作单位、请求确认和物理完成状态需要形成明确接口。')),
    section('real2sim', 'Real2Sim2Real 与任务场景',
      figure(51, 'RoboHouseGen 多房间场景与任务路径。原自动采集预览标注为 RPW 与 G1，接入 RP1 需匹配身体、传感器和任务配置。') +
      paragraph('真实环境与机器人记录用于构建仿真任务，仿真训练结果再回到相应实机。场景几何、物体接触、传感器与执行器模型共同决定迁移条件。') +
      figure(52, '策略 / VLA、全身控制、机器人本体、物理和实机后端分层连接，支持场景生成、采集、微调及评测。')),
    section('research-tools', 'LabWeft 与技能组织',
      figure(53, '研究树保留算法分支、试验节点及合并关系，可与 RP1 模型、动作数据、训练配置及评测结果关联。') +
      figure(54, 'Agentic Humanoid Harness 的规划架构：记忆、状态与任务连接技能选择及下层运动。属于规划架构，不能据图认定完整 RP1 系统已运行。') +
      paragraph('每项技能定义输入、前置条件、终止条件、失败返回与执行记录，才能将导航、感知运动、生成式动作和 BFM 跟踪组合为可追溯任务。' + source(57)))
  ]);

  const methods = [
    ['001','整机站立老化','23 ± 5 °C；3 个周期，每周期目标 3 h','电量、温度、误差、保护与有效站立；低电提前退出按实际时长记录',67],
    ['002','行走循环老化','目标 50 km；0.35 / 0.7 m/s；每 10 km 检查','距离、滑移、吊挂接触、能耗、温度和试后退化',67],
    ['003','带载站立','批准负载下 3 h × 3；固定负载重心','姿态、温度、夹具位移；卸载后时间不归入原工况',67],
    ['004','高温运行','40 ± 2 °C 均温后带电 2 h；45 °C 另列摸底','温度、电池压差、风扇、降额及常温复测',67],
    ['005','低温启动','−10 ± 2 °C；5 次冷启动，第 5 次运行 60 min','启动电压、自检就绪、润滑阻力及低温充电联锁',68],
    ['006','高低温循环','−10 至 40 °C，5 循环；速率 ≤ 1 °C/min','端点各 2 h、稳定后上电 15 min；连接、凝露、零位',68],
    ['007','湿热','25 至 40 °C、≥ 93% RH；2 循环，共 48 h','绝缘、漏电、凝露与腐蚀；上电受电池舱条件约束',68],
    ['008','高温存储','无电池机身 55 ± 2 °C、16 h','电池另按供应商边界；回温复测与 24 h 后检查',68],
    ['009','低温存储','−20 ± 2 °C、16 h；关闭充电与自动唤醒','受控回温、凝露、功能与延迟退化',68],
    ['010','整机与包装振动','裸机 5–55 Hz 扫频；包装随机振动条件另列','夹具、输入响应、共振迁移；轴向分配待冻结',69],
    ['011','整机冲击','150 m/s²、11 ms 半正弦；3 轴正负方向各 3 次','共 18 次；输入波形、固定状态、功能与重点拆检',69],
    ['012','热保护与降额','受控散热异常、过载与传感器故障注入','独立温度监测；告警、降额、停止、复位与复测',69],
    ['013','双电池与热插拔','批准站立 / 空闲姿态；次数按寿命频度冻结','计划 1 kHz 母线波形、备电电流、插拔力、温升与重启',69],
    ['014','电源循环与恢复','正常关机、欠压、备电接管与急停恢复','循环数分别冻结；配置、零位、日志、存储和非指令动作',69],
    ['016','带载行走','目标 50 km；每 5 km 转向 30 次及附加动作 10 次','负载、重心、吊挂接触与有效行走分别记录',70],
    ['017','倾倒与受控跌倒','100 mm 与倾斜 30° 对应高度取小值','最多 4 方向各 1 次；动态跌倒另行工程评审',70],
    ['020','快速动态动作','热身 5 min + 混合任务 20 min + 恢复 5 min','速度、加速度、停止距离、IMU、温度与保护',70],
    ['021','抓取搬运与操作','60 min 循环，每 10 min 切换工件或位姿','尝试、成功、重试、节拍、人工接管及视频日志',70]
  ];
  add('testing', [
    section('test-rigs', '加载台架与整机验证',
      figure(55, '手臂台架与下肢加载台架。加载条件、力臂、速度、持续时间和温度需与样机配置一起记录。') +
      paragraph('实验固定身体、末端、电池、计算模块、模型、固件与策略，并记录负载、地面、环境和保护装置。台架识别执行器输出和热行为，任务测试评价动作效果，整机运行记录评价能耗、恢复与维护。')),
    section('factory-hmi', 'Factory HMI 与上下肢管理',
      figure(56, '采集前的 Factory HMI 操作界面：用于配置测试、回放轨迹和观察连接状态。界面截图不代表测试已完成。') +
      figure(58, '下肢可靠性管理界面处于无试验数据状态，不能从界面推导累计小时或通过率。') +
      figure(59, '上肢可靠性管理界面，组织样机、用例和运行记录。结果需回到对应原始采集和有效运行区间核验。')),
    section('test-data', '控制与数据服务的分工',
      figure(57, '机器人 / 台架、本地网关与 HMI 承担控制和采集；本地运行包经适配进入异步数据服务。') +
      paragraph('本地原始包、PostgreSQL 事实记录与导出队列、Worker / InfluxDB 时序写入、Grafana 观察承担不同职责。服务暂不可用时保留原始运行包，恢复后再上传；采集与离线分析按任务编号及数据指纹关联。') +
      paragraph('telemetry.csv、metadata.json 和 events.jsonl 记录状态、条件与事件。只有确认的 active 区间计入有效时长；温度保留全程统计，缺失值保持未知，synthetic 样例与 real 实机数据分开标识。' + source(63))),
    section('compute-energy', '机载推理与能耗测量',
      figure(35, '先固定模型、输入、精度、后端及更新率，再测推理时延、任务效果和计算支路 / 整机电池两种能耗边界。') +
      paragraph('记录预热、并发负载、频率与温度；用时延分布、最长停顿、内存峰值和 deadline miss 评价运行。参数量或 NPU TOPS 不能直接替代推理时间，充电板功率也不能用作整机运行功耗。')),
    section('reliability', '18 项整机可靠性方法',
      note('以下整理自报告附录 A，为计划条件与方法草案。报告未执行这些硬件试验，所列时长、距离和环境应力不是已验证性能。编号沿用原工程，因此不连续。') +
      `<div class="report-methods">${methods.map(([id,title,conditions,records,page]) => `<details><summary><code>SYS-REL-${id}</code><span>${title}</span></summary><div><p><strong>计划条件：</strong>${conditions}。</p><p><strong>记录与复核：</strong>${records}。</p><p>${source(page, '完整方法与执行边界')}</p></div></details>`).join('')}</div>` +
      paragraph('每项先冻结配置、器件边界、资源与判据，建立试前基线；结束后按同一方法复测。中止、维修、人工干预和证据不足保留在结论中，重复循环不能当作多台独立样机。'))
  ]);

  add('capture', [section('capture-evidence', '采集记录与可复现实验',
    paragraph('采集包关联样机和身体配置、BOM 修订、模型哈希、镜像、固件、策略与配置哈希、方法编号、负载、环境、起止 UTC、有效区间及分析版本。媒体、状态、动作和事件共享可追溯时间关系。') +
    `<p><a href="#testing/report-test-data">测试控制与数据服务架构</a> · <a href="#data/report-data-loop">动作数据到策略的流程图</a> · ${source(73, '实验包字段原文')}</p>`)]);
  add('teleop', [section('teleop-reference', '从人体参考到机器人动作',
    figure(39, '人体动作跟随实例。数据采集、网络、重定向、参考缓冲、推理和执行共同构成端到端时延。') +
    paragraph('连续控制记录命令时效、序号、限幅和失联处理；离散技能记录请求、开始、结束或失败。收到请求与完成执行是两级确认，操作者界面同时显示连接状态和反馈更新时间。' + source(29)))]);

  create('report', 'RP1 技术报告', 'RESOURCES / TECHNICAL REPORT', '开放人形机器人平台的系统设计与工程实现。v0.8.12 · 2026 年 10 月 12 日 · 技术报告工作稿。', [
    section('report-source', '报告与图文索引',
      `<div class="report-download"><div><strong>RP1 Technical Report</strong><p>78 页 · 60 幅图 · 机械、电气、软件、学习与整机验证</p></div><a href="${pdf}" target="_blank" rel="noreferrer">打开完整 PDF</a></div>` +
      figure(1, '报告封面的 RP1 本体与台阶场景。下方目录按系统职责连接图文和原报告页码。') +
      `<div class="report-inline-links">${link('platform','平台与身体配置','第 5–7、16、71–73 页')}${link('mechanical','机械结构与快拆','第 7–16 页')}${link('actuators','ROMOMO 关节','第 10–12、35–36 页')}${link('hardware','电气与 PCB','第 17–24 页')}${link('hand','RP Hand 灵巧手','第 74–75 页')}${link('motion','运控与部署','第 25–29、34–40 页')}${link('data','数据与重定向','第 30–33 页')}${link('learning','运动跟踪','第 41–49 页')}${link('partyos','感知与任务','第 50–57 页')}${link('testing','测试与可靠性','第 58–63、67–70 页')}</div>`),
    section('evidence-scope', '版本、图源与证据范围',
      paragraph('本次图文依据 v0.8.12 工作稿整理。每幅图保留原图编号及报告页码；图中的原研究、第三方平台和规划架构标注其适用对象。工程资料、训练配置、产品名义值和实机测量分别说明。') +
      table(['材料类型','本版使用范围'],[
        ['模型、BOM 与软件配置','确认身体、结构、接口和名义运行参数；不等同于实机性能'],
        ['RP1 实机演示','说明已展示的动作与场景；未提供统计的指标保持未量化'],
        ['P-BFM / I-BFM / MimicLite 基准','注明 G1 或原研究，作为方法和协议参考'],
        ['18 项可靠性用例','保留计划条件，不宣称已通过试验或寿命认证']]) +
      `<p>${source(65, '参考文献与项目资料')} · ${source(76, '项目职责与实现索引')} · ${source(78, '图像与设计资料说明')}</p>`)
  ]);
  return {figures, pdf};
}

function bindReportFigures() {
  const dialog = document.querySelector('#figure-dialog');
  document.querySelectorAll('[data-report-figure]').forEach(anchor => {
    anchor.onclick = event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const figure = anchor.closest('figure');
      const image = anchor.querySelector('img');
      const preview = dialog.querySelector('img');
      preview.src = image.src;
      preview.alt = image.alt;
      dialog.querySelector('#figure-dialog-caption').innerHTML = figure.querySelector('figcaption').innerHTML;
      const original = dialog.querySelector('[data-original-image]');
      original.href = anchor.href;
      dialog.showModal();
      document.body.classList.add('figure-open');
    };
  });
}

const figureDialog = document.querySelector('#figure-dialog');
figureDialog.querySelector('[data-close-figure]').onclick = () => figureDialog.close();
figureDialog.addEventListener('close', () => document.body.classList.remove('figure-open'));
figureDialog.addEventListener('click', event => { if (event.target === figureDialog) figureDialog.close(); });
