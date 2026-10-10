# v0.4 多端与静态发布验证

验证日期：2026-10-11。发布任务：[Issue #1](https://github.com/komariChikaA/afternoon-program/issues/1)。

## 实现

- 新增 `game/responsive.css`，不修改共享引擎。手机/平板竖屏将完整摄影画面、对白和工具栏分区；横屏适配文字、按钮和选择区域。
- 手机按钮至少44px高，竖屏选择至少48px高；对白至少16px。菜单和长内容支持滚动，加入安全区和动态视口支持。
- `tools/build-site.mjs` 生成白名单静态包，入口 `index.html`；源图、候选素材、测试输出和本机配置不进入网站。
- 引擎原始SHA256随仓库存储；`engine/*.js -text` 防止Git换行转换改变原始字节。
- 锁定测试依赖。GitHub Actions 在发布前执行三项浏览器测试，失败则停止发布；截图作为独立artifact保留。

## 本机检查

- 399节点、6992对白字符、11章节编译成功；VNUI项目验证器通过。
- 原有完整浏览器回归：452断言、406次操作、395个不同节点，包含全部主线、分支、存读档、Auto、Ctrl已读快进、三处惊吓、编辑器和全部剧情素材解码；无浏览器脚本或HTTP错误。
- 发布包多端检查：353断言，覆盖320×568、390×844、430×932、667×375、844×390、768×1024、1024×768、1920×1080。
- 各尺寸实际触控测试标题/开始、Auto、未读停止、调查选项逐项滚动点击、存档/读档、回看、设置、来源菜单、电视特写、结局及旋转后剧情状态。每个剧情节点检查字号、舞台/对白/选择边界和横向溢出。
- 检视手机竖屏对白与电视、手机横屏调查、平板标题等截图。320px标题内容可纵向滚动，避免压缩按钮。
- 安装依赖审计：0个已知漏洞。游戏运行不需要npm或第三方远程服务。

这是Chromium视口与触控模拟，不等于iOS Safari、Android实体设备或玩家对美术与恐怖感的验收。实际线上HTTPS、项目子路径资源与部署运行结果在Issue #1记录；任务通过技术检查后保持Qualified，等待人工试玩。

## 重跑

`npm ci` 后设置可用浏览器路径 `VNUI_BROWSER_PATH`。运行 `npm run build:story`、`npm run build:site`，以 `VNUI_SITE_ROOT=项目绝对路径/dist`、`PORT=4180` 启动 `npm start`。再以 `VNUI_TEST_URL=http://127.0.0.1:4180/` 执行 `npm run test:preload`、`npm test` 与 `npm run test:responsive`。

本机输出为 `output/playwright` 和 `output/responsive`，均被Git忽略。GitHub Actions提供对应浏览器验证artifact。

## v0.6 资源准备回归

新增45张图片和3种惊吓音效的解码预加载，加载锁、自动/手动重试与惊吓播放接入。预加载专项输出为 `output/preload`，CI 同样保存为独立 artifact。完整剧情仍为452断言、406次操作、395个不同节点；当前多端回归361断言。专项机制与故障注入范围见 [asset-preload.md](asset-preload.md)，最终发布证据记录在 Issue #3。
