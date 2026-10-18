# 本地游戏字体（完整字库，无 CDN）

- **得意黑 Smiley Sans v2.0.1**：作者官方仓库 Atelier Anchor。
  原始 WOFF2，未修改：https://github.com/atelier-anchor/smiley-sans/releases/tag/v2.0.1
  文件：`SmileySans-Oblique.ttf.woff2` → `SmileySans.woff2`。
  许可证：同一 tag 官方 LICENSE，保存为 SmileySans-OFL.txt。
- **站酷庆科黄油体 ZCOOL QingKe HuangYou**：Google Fonts 官方发行仓库
  https://github.com/google/fonts/tree/main/ofl/zcoolqingkehuangyou
  原文件 ZCOOLQingKeHuangYou-Regular.ttf，通过 FontTools 仅转换容器为完整 WOFF2，未改字形、名称或裁剪字符。
  许可证：同目录 OFL.txt，保存为 HuangYou-OFL.txt；版权归原作者，见许可证。

两款均采用 SIL Open Font License 1.1，允许游戏嵌入和随项目分发；保留版权及许可证，禁止将字体单独出售。字体的 OFL 不要求游戏源码采用 OFL。下载日期：2026-10-17。

## 本轮字体角色与来源

标题采用 **猫啃什锦黑 Maoken Assorted Sans，Version 1.70，Regular / 400**。

- 作者官方仓库：https://github.com/maoken-fonts/MaokenAssortedSans
- 源提交：`f01a94115444beaa60d7aefa9544fd123fb48d71`，原文件 `font/MaokenAssortedSans.ttf`。
- 作者 ZERO子，基于 Umihotaru 的 Nishiki-teki，补字贡献者署名见官方 README：https://github.com/maoken-fonts/MaokenAssortedSans/blob/f01a94115444beaa60d7aefa9544fd123fb48d71/README.md 。
- 授权：SIL OFL 1.1，保留原始 `maoken/OFL.txt` 与 `maoken/OFL-FAQ.txt`。允许游戏嵌入与随软件分发，字体不得单独出售。保留名称为“Assorted”“什锦”。
- WOFF2 使用 FontTools 4.61.1 无字形变换压缩，未裁剪字符、改字形、改名或删元数据。核对所有 SFNT 表原始字节一致，只有 `head` 中容器校验和及 WOFF2 标准无损转换标志变化；完整 cmap、轮廓、排版及 name 元数据保留。按作者附带 OFL FAQ 2.2、2.7、2.8 的无损／功能等价要求处理。
- 字库保留完整 31,220 个 Unicode 映射。实际版本、散列与校验结果详见 `font-manifest.json`。

### 正文字体：正式采用合法黄油体

按本轮确认，正文、设置选项、操作说明、路线辅助及计时成绩统一采用本地 **站酷庆科黄油体 ZCOOL QingKe HuangYou，Regular / 400**，来源及 SIL OFL 1.1 许可证见上文。它不是可变字体，强调仍使用真实 400，不合成 600 字重。先前方圆体的待接收项已取消，本阶段不再依赖外部字体包。

所有 @font-face 统一在 `src/fonts.css` 注册；`--font-title` 与 `--font-body` 分离。标题预加载，使用 `font-display: swap`，并以黄油体的本地度量适配回退（中文全宽比例及升降部匹配）降低字库加载导致的位移。原得意黑、黄油体资源及许可证保留，无在线 CDN。

## 正常比例辅助黑体（当前）

所有说明、设置、提示、成绩标签与数字采用本地 **Golf UI Sans 400／700**，基于已核验版本与许可的 Noto Sans CJK SC 2.004，OFL 1.1。提取项目全部界面字符并重命名，两个 WOFF2 共约230KB；未压缩字形比例。详情、原始版权、完整许可和重建脚本见 `golf-ui/README.md`。特色大标题继续使用猫啃什锦黑，旧黄油体／得意黑文件保留许可证作兼容资源，不再作为辅助文字的正式字体。
