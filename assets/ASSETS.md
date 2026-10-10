# 素材与制作方法（v0.3）

所有运行素材已保存本地，游玩不访问素材网站。逐项作者、原始网页、下载地址、授权与修改说明见 source/attribution.json，也可在标题页“素材来源”查看。

## 电视人物

- 左侧：[Yu Ko / 越南富国岛街头人像](https://unsplash.com/photos/elderly-asian-man-smiling-in-a-shop-GGFKOK_qgAc)，Unsplash License。
- 右侧：[Matthew Stephenson / 越南河内人像](https://unsplash.com/photos/a-smiling-elderly-man-stands-in-front-of-a-cabinet-l8rnL-SHLuo)，Unsplash License。

两张均为彩色摄影，正面朝镜头；外观选取约 60～70 岁范围，来源没有记载实际年龄。照片中的人不是故事人物，也不是为本游戏拍摄的演员。原照片保存于 source/tv/elder-left.jpg、elder-right.jpg，派生版本使用人工轮廓遮罩、裁切、色温匹配与电视节目合成，没有生成或重画五官。历史名人、欧美老人已退出运行素材。

六种电视阶段共用这组照片和构图：彩色录像、低清、静止、描线、绘画、卡通。后三阶段是剧情要求的逐步图像化处理，住宅和血腥现场仍使用摄影。机壳来自 Morn 的 Loewe Planus CRT 正面照片（CC BY-SA 4.0）。

## 环境、血迹与衣物

住宅环境主要采用 Wikimedia Commons 中日本房屋的实景照片；作者包括 Daderot、Odyssey、Cristina Bejarano、Franklin Heijnen 等，分别适用 CC0、CC BY 或 CC BY-SA，完整记录在来源表。

make-real-composites.py 对原照片进行裁切、调色、物体抠图、接触阴影和纹理混合。客厅血迹使用不规则栅格遮罩与地板颜色相乘，衣物来自真实衬衣、牛仔裤、围巾照片。它们是制作的虚构现场，原图不包含惨案。SVG 只是内嵌 JPEG 的显示容器，最终场景不是矢量手绘。

墙上合照来自公有领域的 Nakamura 家庭照片；重复场景遮去一个大人，并加入铅笔痕迹。不是把两位电视人物重复贴成五人合照。历史家庭与剧情人物无关。

衣物结局为七张照片合成 CG，逐步遮住视野。舅公及麦子的独立立绘仍是原型示意，不属于这轮真人电视人像。

## 声音

- BGM：[Teknopazzo 演奏的萨蒂 Gymnopedie No. 1](https://commons.wikimedia.org/wiki/File:Gymnopedie_No._1..ogg)，CC0；白天低音量播放，在后续段落淡出。
- 环境、布料、心跳和三种短促冲击音均由本地脚本合成，17 个 WAV；无正式配音。
- jumpscare 分别出现在电视变化、宠物事件、衣物落下。设置可关闭，减少动态也会禁用画面和冲击音。

## 授权与再生成

保留本表、source/attribution.json 与原作者署名。含 CC BY-SA 素材的客厅、楼梯、衣物和机壳派生美术按 CC BY-SA 4.0 提供；原始文件继续遵循各自授权。电视人物及其派生电视画面遵循 Unsplash License，不将这些照片改标为公有领域。代码与第三方素材的授权分开。

完整素材再生成顺序：make-art.py → make-media.py → make-photo-art.py → **make-real-composites.py**。最后一步覆盖早期占位图，必须执行。之后运行 build-story.py 将来源表及章节更新同步至运行快照。

本轮没有使用 Photoshop 或 AI 图片生成服务；最终图为本地照片合成。已知限制是抠图边缘、墙面修补及人物静态摄影感，不能当作真实拍摄的家庭录像。
