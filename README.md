# 下午的节目 / afternoon_program

一个基于当前仓库 VNUI 模板制作的日式恐怖视觉小说可玩原型。标题 → 第一次入住与节目 → 异常下午 → 记忆切断 → 再次入住与细微差异 → 手绘电视 → 宠物事件 → 恐惧成立 → 回家 → 衣物结局 → 标题。

## 立即游玩

双击 `启动游戏.cmd` 或用现代 Chrome / Edge 打开 `app.html`。**不需要 npm install、构建、网络、控制台或开发工具。**

也可以在此目录运行 `npm start`，打开 `http://127.0.0.1:4173/app.html`。本地服务只监听 127.0.0.1；默认端口 4173，可通过 `PORT` 环境变量改变。

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
```

测试可复用同仓库 `cake/vn-project/node_modules/puppeteer`。若 Puppeteer 的下载浏览器不可用，设置 `VNUI_BROWSER_PATH` 为本机 Chrome / Chromium 可执行文件绝对路径；也可用 `VNUI_PUPPETEER_PATH` 指定已有 Puppeteer 模块。结果见 `output/playwright/test-results.json`。素材归属和替换策略见 [assets/ASSETS.md](assets/ASSETS.md)，需求映射见 [docs/implementation.md](docs/implementation.md)。
