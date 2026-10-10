## Goal
发布《下午的节目》可玩成果到本仓库及 GitHub Pages，并完成手机、平板、桌面适配。

## Requirements
- 保留原有399节点、分支、存档、Ctrl已读快进、Auto及演出。
- 手机竖屏：完整16:9画面与可读对白分区，触控按钮至少44px；横屏与平板可用。
- 对白、调查选项、存读档、设置、标题及结局都不能超出屏幕；适配安全区域及动态视口。
- 使用相对资源路径，项目子路径下可加载，首次访问无需安装。
- 仓库包含源代码、章节、公开素材署名及再生成脚本；发布包不包含候选图、测试日志或私有本机配置。
- GitHub Actions自动发布；部署成功后验证HTTPS页面与素材及移动端操作。

## Acceptance criteria
多端浏览器检查及桌面回归通过；Pages部署成功且线上实际访问通过。美术与恐怖感仍待玩家验收，技术交付进入Qualified。

## Current state
源需求快照。实时状态、部署结果与验收记录以 [Issue #1](https://github.com/komariChikaA/afternoon-program/issues/1) 为准；适配与构建验证见 [pages-verification.md](pages-verification.md)。
