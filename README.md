# 作品集视频托管对比

当前作品集的完整测试副本。正式工程未改动；9个MP4从旧站逐字节复制，没有重新编码。

## 使用

底部面板切换 B 站、GitHub Pages、R2。页面外观、作品封面、弹窗及现版 B 站地址保留。可用入口：

- GitHub Pages：`https://13710917366q-glitch.github.io/yaelum-video-hosting-test/?source=r2`
- Cloudflare 静态备用页：`https://yaelum-video-test.yaelum-video-guard.workers.dev/?source=r2`

两者均已实际打开 R2 视频并确认 1920×1080。静态备用页不存储视频或绑定 R2 写权限，切换 GitHub 模式仍读取上述 GitHub Pages 的 MP4。

- B站：现版iframe为基准。跨域播放器的首帧、缓冲、实际分辨率需单独检查；面板不将iframe加载时间当成视频首帧。
- GitHub Pages：读取同目录video中的MP4。
- R2：已自动配置受保护 Worker 地址，视频存在私有桶。无需填写 R2 公开地址；面板拒绝 R2 直连域名。读取失败或持续加载超过12秒，切换至 GitHub Pages 的相同 MP4；关闭弹窗停止读取。
- 本地尚未找到商业PV对应MP4，因此该作品在所有模式均保留B站，排除出MP4对比。

## 样本

Showreel对应intro.mp4/B站P9；动画曲线对应cover1.mp4/P1；三维融合对应cover5.mp4/P4；MAD打光对应cover4.mp4/P3。请先核对画面与时长，旧MP4与B站上传版可能存在修订差异。

## 对比口径

每个来源按相同顺序测试：首次播放、完整播放、跳转60%、关闭后重开。分别记录浏览器/登录状态、网络通路、日期、缓存条件及可见清晰度。三种来源分开串行播放，不并行下载。默认缓存与清空缓存分别记录，不混作同一组。

MP4首帧采用requestVideoFrameCallback；不支持时回退playing事件并标记。播放等待和跳转等待分开记录。关闭弹窗停止读取MP4。测试面板可导出结果。

## 当前状态

独立GitHub Pages测试站已发布： https://13710917366q-glitch.github.io/yaelum-video-hosting-test/ 。

GitHub MP4已完成4条作品、两轮静音短时播放与60%位置跳转采样；数据及限制见同目录的测试结果.md、github-sampling-snapshot.txt和network-probe.json。两轮采样不是严格清缓存实验，也不是全程播放验收。

自动采样入口为auto-test.html?source=github&auto=1，采用静音播放避免自动播放策略阻拦。普通index.html仍按点击播放。

R2 已开通并部署，9 个 MP4 校验上传完成。账户已核验 Workers Free，每日请求硬停限制与私有桶共同约束该播放路径的读取量；不等于整个 Cloudflare 账户的金额上限。实现、开关和验证记录见 `guarded-video/`。

R2 两轮 8 次浏览器抽样已完成并保存完整事件 JSON，27 项线上接口检查通过。GitHub 先前测试仅保存可见结果表和截图，其完整事件 JSON 当时未导出。B站现版地址本轮打开后跳转错误页，没有有效的同作品性能基准，故未完成三方优劣排名。自动备用采用已测过的 GitHub 高清文件，B站入口保留供核对。详见 `测试结果.md`。
