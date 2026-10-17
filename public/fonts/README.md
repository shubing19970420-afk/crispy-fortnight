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

### 正文字体：方圆体待接收

本次**尚未取得阿里妈妈方圆体 VF 的官方字体包与实际版本授权**。官方入口 `https://fonts.alibabagroup.com/` 及下载域名访问返回 403；未采用不明镜像，也没有将其他字体改名冒充方圆体。

当前正文、数字暂用已有合法黄油体 400；该字体不是 VF，因此强调仍为真实 400，不伪造 600 字重。要完成指定正文，需要将官方 `Alimama FangYuanTi VF` 的 WOFF2/TTF 可变字体及同包授权文件放入 `public/fonts/fangyuan/`，并核对游戏嵌入、字体分发及实际轴范围后，再切换变量及真实 400/600 字重。

所有 @font-face 统一在 `src/fonts.css` 注册；`--font-title` 与 `--font-body` 分离。标题预加载，使用 `font-display: swap`，并以黄油体的本地度量适配回退（中文全宽比例及升降部匹配）降低字库加载导致的位移。原得意黑、黄油体资源及许可证保留，无在线 CDN。
