# v0.5 界面改版

任务：[Issue #2](https://github.com/komariChikaA/afternoon-program/issues/2)。2026-10-11查找并实际检视《壳之少女》HD版标题及Steam官方游戏截图。

## 参考来源

- [HD版标题截图所在评论](https://note.com/peetaro_room/n/n25735f6cc828)，[标题截图](https://assets.st-note.com/production/uploads/images/171792030/picture_pc_a878f7b90cb8db468b931ef4220e6c2c.png)。白底、中央主视觉、分散的暗红细明朝体、细横线、底部横排中文菜单。
- [Steam官方 The Shell Part I: Inferno 页面](https://store.steampowered.com/app/2258770/The_Shell_Part_I_Inferno/)，通过公开appdetails读取18张宣传截图。实际检视其中0、2、3、9、11至14的对白、顶部日期、底部工具及选择，和15的手帐页。
- [对白示例](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2258770/ss_8c81d1abd644c71de58835741929260e59ae2969.1920x1080.jpg)、[选择示例](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2258770/ss_493643d629dc72978a131ac67d3cb69025a5c663.1920x1080.jpg)。横贯底部的透明暗红黑对白窗、细白宋体、小型工具图标与暗红选择按钮。

参考图只在本机 `output/references` 中保存用于分析；运行页面使用本作照片合成、可编辑HTML/CSS和新画的工具图标。

## 实现

- 主菜单：白纸色摄影封面，以真实CRT和衣物替代原作人物/蛋壳；暗红细宋体五字标题，细线和英文副题，四项横排菜单。聚焦和悬停有红色细线反馈，继续按钮仍受存档状态控制。
- 阅读：全宽贴底的酒红透明对白，原有地点/时间移为轻量页眉，角落图标工具栏；暗红选择按钮。
- 系统页：浅色手帐纸、双线边框、酒红标题和规则线；存档增加当前场景缩略图与编号，不改变存档格式。
- 本地Noto Serif SC可变子集让不同系统获得一致字体；保存SIL OFL完整授权，标题制作脚本可重建照片合成与字形子集。
- 手机保留完整16:9剧情画面、独立对白、两排44px工具按钮和48px选择；标题改为适合竖屏的封面构图。横屏仍保留至少16px正文，菜单和长内容可滚动。

## 验证

保留旧剧情399节点、分支、三处惊吓、Ctrl/已读快进、Auto和存档。共享引擎不修改。执行完整游戏452断言与八视口353断言；最终测试、GitHub运行及上线结果记录在Issue #2。实际检视1920×1080、390×844、320×568、667×375标题/阅读/设置截图，再根据结果调整页眉与字体对比度。参考风格的相似程度及美术效果等待玩家验收，技术检查通过后进入Qualified。
