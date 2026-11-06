# 作品集视频费用保护

当前实现只接入独立测试站，正式站仍使用原来的 B 站播放器。

线上保护入口：`https://yaelum-video-guard.yaelum-video-guard.workers.dev`。2026-11-06 已启用，九个视频已上传并核对；源配置保留默认停用，避免未经复核的后续发布自动开启。

## 播放路径

测试站 → Workers Free → 私有 R2 Standard 桶。

- 桶：`yaelum-portfolio-video-private`，关闭 r2.dev 和所有直接指向 R2 的自定义公开域名。
- Worker：`yaelum-video-guard`，只允许九个现有 MP4 文件名，只读；没有上传、列目录、转发任意网址或客户端密钥。
- 一次外部请求最多一次 R2 读取；HEAD 使用 head，GET 使用 get，错误不重试。健康检查、预检、无效范围及写请求不读取 R2。
- 支持字节范围读取，视频播放/拖动不必先下载完整文件；不缓冲整个视频到 Worker 内存。
- 前端只在点击时加载 MP4；关闭弹窗清空地址。R2 错误或连续 12 秒没有播放进展，切换到 GitHub Pages 上字节一致的 MP4。暂停和浏览器阻止自动播放不触发超时回退。
- 现版 B 站视频地址本轮打开后跳转错误页，未取得有效同作品对照，因此保留 B 站基准入口供核对，自动备用采用已测过的 GitHub 高清文件。若备用也失败，停止读取并显示重试提示，不循环请求。
- 回退事件单独记录，绝不计作 R2 成功播放样本。自动对比仅抽样，未完成的全片播放不能据此推断为稳定。

## 限额依据和边界

Workers Free 当前为账户总计每天 100,000 次外部请求，UTC 午夜重置，超限返回 1027。代码每请求至多一次 R2 Class B 读取，31 天上界约 310 万次，低于 R2 Standard 每月 1,000 万次免费读取；九个固定文件约 319.37 MiB，低于 10 GB-month 存储免费额度。

这是基于“该账户保持 Workers Free、没有公开 R2 绕过入口、没有其他持续 R2 用量”的保护方案，**不是 Cloudflare 整个账户的自定义金额硬上限**。其他桶/脚本/上传操作仍会产生各自用量；升级 Workers Paid 后，免费套餐的每日硬停机制不再适用。不要开启付费 Workers、付费日志/分析/其他存储服务来替代这套保护。

CORS 只约束浏览器跨站读取，不是身份验证或可靠的防盗链。别人仍能请求 Worker，最坏可能耗尽当天免费请求，使高清播放切到 GitHub 备用；不会因此绕过私有桶直接读取。预算邮件只提醒，不负责停服。

## 开关与复核

`VIDEO_ENABLED="0"` 为停用状态，所有视频请求返回 503，且不访问 R2；`"1"` 为启用。部署源配置默认停用，验证实际账户 Free、桶私有、九个对象大小后再启用。

上线复核：Free 计划、桶公开状态、健康接口、GET/HEAD/Range、禁止写操作、无效请求、前端错误回退和关闭清理。不要通过刷满 100,000 次来验证限额，以免影响同账户其他 Worker。

本地验证：`node --test worker.test.mjs fallback.test.mjs`。打包检查：官方 Wrangler `deploy --dry-run`。两者不等于已经部署。

本次已完成实际部署与 27 项线上接口检查，详见 `验收记录.md`、`live-probe.json`。本次临时复制工具已删除，线上只保留只读的保护 Worker。

官方依据：[Workers 限额](https://developers.cloudflare.com/workers/platform/limits/)、[R2 计费](https://developers.cloudflare.com/r2/pricing/)、[R2 公开访问](https://developers.cloudflare.com/r2/buckets/public-buckets/)。
