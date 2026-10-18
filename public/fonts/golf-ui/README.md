# Golf UI Sans（游戏正文子集）

基于 Noto Sans CJK SC 2.004 Regular／Bold，来自当前环境的 Debian 官方 `fonts-noto-cjk` 软件包，字体集合索引2。上游：https://github.com/notofonts/noto-cjk 。原始字体名称与版本已用 FontTools name 表核对。

SIL Open Font License 1.1，允许游戏嵌入与再分发。原字体版权及完整许可证见 OFL.txt，系统包来源与许可全文见 SOURCE-COPYRIGHT.txt（其中 debian/* 打包脚本的 GPL 不适用于字体）。

使用 FontTools 提取简体字形，保留 ASCII、标点及项目现有全部界面汉字（界面子集，新增文案后可重建）；未改变字形比例。作为修改版将 family／PostScript 名称改为 Golf UI Sans。保留版权和授权元数据，不单独出售字体。重建脚本：scripts/build-ui-fonts.py。
