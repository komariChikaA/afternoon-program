# 下午的节目 / afternoon_program

一个基于当前仓库 VNUI 模板制作的日式恐怖视觉小说可玩原型。标题 → 第一次入住与节目 → 异常下午 → 记忆切断 → 再次入住与细微差异 → 手绘电视 → 宠物事件 → 恐惧成立 → 回家 → 衣物结局 → 标题。

## 立即游玩

在线版：** https://komariChikaA.github.io/afternoon-program/ ** 。源码与任务记录： [GitHub 仓库](https://github.com/komariChikaA/afternoon-program) 、 [发布 Issue #1](https://github.com/komariChikaA/afternoon-program/issues/1)。

双击 `启动游戏.cmd` 或用现代 Chrome / Edge 打开 `app.html`。**不需要 npm install、构建、网络、控制台或开发工具。**

也可以在此目录运行 `npm start`，打开 `http://127.0.0.1:4173/app.html`。本地服务只监听 127.0.0.1；默认端口 4173，可通过 `PORT` 环境变量改变。

- 进入时先预加载并解码全部运行图片及三种惊吓音效，完成前无法开始/继续。失败会显示重新载入按钮；惊吓等画面就绪后才开始计时，快进也会等待演出。
- 点击画面、Space、Enter 推进。正在打字时第一次操作补全文字，第二次推进。
- 选择点击选项，也支持 Tab 聚焦、Enter 选择。调查选项返回原位置，完成后选择继续。
- 底部提供回看、存档、读档、设置、标题；Esc 开关设置。
- 每个剧情节点自动存档，另有三个手动槽位。新游戏只更新自动档，不清除手动档。
- 按住 Ctrl 或点击已读快进，只跳过已读内容；遇到未读句子或选择停止。Auto 自动播放，在选择及菜单处暂停。
- 阅读设置支持文字速度、环境音量、静音、减少动态效果、突发惊吓开关；系统减少动画偏好默认生效。
- 存档属于当前浏览器和地址。`file://` 与 HTTP 的档案分开，换浏览器或清理数据不会同步。禁用存储仍能通关，但无法存档。

含死亡暗示、血迹、动物受伤、窒息情节及三处短促 jumpscare。设置可关闭突发惊吓；减少动态也会关闭惊吓画面与冲击音。无追逐、无正式配音。背景音乐为本地公开录音，环境与冲击音是程序合成。

## 内容与范围

11 个章节、399 个节点、约 7,000 字对白与旁白。当前完成核心体验，不宣称已经达到成品 30～60 分钟时长；玩家阅读速度和调查量影响时间，实际节奏仍需试玩。

保留所有核心情节：第一轮血腥场面没有恐惧 UI 或心跳；第二轮电视由彩色摄影渐变成描线与卡通；麦子为桌上幼小包裹扑向舅公，主角拉住它时才出现恐惧；没有追逐，主角成功回家；最终压身的是亲戚衣物，不解释真相。

## 项目组织与复用

```text
app.html / game/game.css    标题、阅读 UI、选择和菜单
engine/                    原 VNUI renderer / animation / interaction，字节不变
game/game.js               小型剧情控制层：条件文本、选择回流、变量、存档
game/audio.js              本地 BGM、环境音与单次音效播放
game/assets.js             去重预加载、解码进度、错误重试和惊吓素材复用
story/*.json               11 个章节的可编辑源数据
project.js                 编译后的 VNUI 直接文件脚本桥
scenes/scene.json           VNUI 场景镜像
timeline/timeline.json      VNUI 线性时间轴镜像
assets/source/             不修改的公开素材源图
assets/generated/          bg / characters / tv / cg / sfx / music / ui
editor/                    保留 VNUI 的场景可视编辑器
docs/                      设计决定、需求映射和验证说明
output/playwright/         自动测试日志与截图，不属于游戏运行依赖
```

编辑 `story/*.json` 后运行 `python tools/build-story.py`，同步 `project.js` 和 JSON 镜像。`tools/seed-story.py` 是初次写入用的生成脚本，**编辑章节后不要随意重新执行，否则会覆盖章节修改**。素材完整再生成顺序为 `make-art.py` → `make-media.py` → `make-photo-art.py` → `make-real-composites.py`。最后一步必须执行，负责最终电视、客厅、血迹与衣物 CG，需要 Pillow、numpy、OpenCV；前面脚本只提供基础环境、角色和声音，不代表最终画面。常规游玩完全不需要 Python。

可打开 `editor/index.html` 调整背景、角色和对白布局。编辑器只预览 VNUI 基础层，不显示游戏控制层生成的 TV / 选择 / 菜单。导出的 project.js 是运行快照；需要把修改回写章节才能保留下一次编译。可见字符和文字采用 CSS 响应式字号；精调运行时字号请修改 `game/game.css`。

`VNPlayer.play/seek` 和 video renderer 是原模板的线性预览能力，不会执行调查分支或存档流程。**可玩主线使用 game/game.js 的节点跳转，不将线性视频时间轴当游戏播放。** 本次没有渲染视频。

## 验证与重跑

```powershell
python tools/build-story.py
python ../vn-ui-reconstruction-engine/scripts/validate_project.py .
npm start
# 另一个终端：
npm install  # 只为安装测试用 Puppeteer，游玩无需安装
npm test
npm run build:site
npm run test:preload     # 慢网、失败重试与三处惊吓专项验证
npm run test:responsive  # 默认需在4180端口提供dist；可用VNUI_TEST_URL修改地址
```

测试可复用同仓库 `cake/vn-project/node_modules/puppeteer`。若 Puppeteer 的下载浏览器不可用，设置 `VNUI_BROWSER_PATH` 为本机 Chrome / Chromium 可执行文件绝对路径；也可用 `VNUI_PUPPETEER_PATH` 指定已有 Puppeteer 模块。结果见 `output/playwright/test-results.json`。素材归属和替换策略见 [assets/ASSETS.md](assets/ASSETS.md)，需求映射见 [docs/implementation.md](docs/implementation.md)。

## 多端与发布

v0.6 加入资源准备页面和失败重试，三处惊吓先解码再演出，等待时不会被 Ctrl/Auto 跳过；切回标题或打开菜单会取消等待中的画面，继续存档会重播尚未完成的惊吓。机制与验证见 [docs/asset-preload.md](docs/asset-preload.md)。

v0.5 参考《壳之少女》HD版公开截图重做界面：纸白摄影主菜单、暗红细宋体大标题与横排菜单；全宽半透明对白、角落图标工具栏、浅色手帐式设置及带场景缩略图的存档页。参考来源和实现见 [docs/ui-reference.md](docs/ui-reference.md)。标题照片合成和本地OFL字体子集可用 `python tools/make-title-art.py` 重建，需Pillow、numpy、fontTools，首次运行需下载公开字体。

v0.4 在手机与平板竖屏上保留完整 16:9 摄影画面，将对白放在画面下方；触控工具分成两行，长对白、调查选项及菜单分别支持滚动。横屏保留舞台构图并放大阅读文字和触控按钮。支持刘海安全区、动态视口与横竖屏切换；切换方向保留当前剧情。手机直接点画面推进，Auto 与已读快进均可用。

GitHub Pages 使用 `.github/workflows/pages.yml`。推送 `main` 后自动编译章节、构建白名单静态包、执行完整游戏与八种视口回归，通过后发布。测试截图作为 Actions artifact 保存14天，不进入公开游戏页面。Pages 的 source 需设为 GitHub Actions。

本地发布包预览（独立终端）：

```powershell
npm run build:site
$env:VNUI_SITE_ROOT="$PWD/dist"
$env:PORT='4180'
npm start
# 在另一终端设置VNUI_TEST_URL=http://127.0.0.1:4180/，执行两项测试
```

发布包入口为 `index.html`，资源采用相对路径，可部署在仓库子路径。存档保存在浏览器本地：线上版与本地版不共享存档。多端验证记录见 [docs/pages-verification.md](docs/pages-verification.md)，线上部署结果与后续验收记录在 Issue #1 中。
