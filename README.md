<div align="center">

# 长征机风格 · Long March Style

**以《The Fire Rises》长征姬视觉为主题的 DeepSeek Harness 插件。**

[![简体中文](https://img.shields.io/badge/lang-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-red.svg)](README.md) [![English](https://img.shields.io/badge/lang-English-blue.svg)](README.en.md)

[![license](https://img.shields.io/badge/license-MIT%20%2B%20PolyForm%20Shield-2EA44F?style=flat)](LICENSE)

</div>

## 预览

界面以长征姬指挥终端为视觉线索：深紫黑画布、首页的强调色极光与淡网格、渐变问候语、聚焦时发光的输入卡片。在插件设置中切换绯红与青霓两套配色；浅色和深色跟随系统。

### 右下角看板娘

窗口右下角站着一位看板娘，头顶气泡实时说明 Agent 在做什么；按住可以拖到任意位置，位置会被记住。吉祥物可以跟随主题（绯红→长征姬，青霓→大肥鱼），也可以单独选择。

**大肥鱼**是蓝发鲸尾女仆，随任务状态切换动作：

<table>
  <tr>
    <td align="center" width="25%"><img src="./docs/gifs/idle.gif" width="150" alt="待机" /><br />待机</td>
    <td align="center" width="25%"><img src="./docs/gifs/thinking.gif" width="150" alt="思考" /><br />思考</td>
    <td align="center" width="25%"><img src="./docs/gifs/typing.gif" width="150" alt="写回答、调用工具" /><br />写回答、调用工具</td>
    <td align="center" width="25%"><img src="./docs/gifs/conducting.gif" width="150" alt="多任务 / 指挥子代理" /><br />多任务 / 指挥子代理</td>
  </tr>
  <tr>
    <td align="center" width="25%"><img src="./docs/gifs/notification.gif" width="150" alt="等你操作" /><br />等你操作</td>
    <td align="center" width="25%"><img src="./docs/gifs/compacting.gif" width="150" alt="整理上下文" /><br />整理上下文</td>
    <td align="center" width="25%"><img src="./docs/gifs/error.gif" width="150" alt="失败" /><br />失败</td>
    <td align="center" width="25%"><img src="./docs/gifs/happy.gif" width="150" alt="完成" /><br />完成</td>
  </tr>
  <tr>
    <td align="center" width="25%"><img src="./docs/gifs/sleeping.gif" width="150" alt="犯困" /><br />犯困</td>
    <td align="center" width="25%"><img src="./docs/gifs/poke.gif" width="150" alt="被戳" /><br />被戳</td>
    <td align="center" width="25%"><img src="./docs/gifs/tickle.gif" width="150" alt="被挠痒" /><br />被挠痒</td>
    <td align="center" width="25%"><img src="./docs/gifs/drag.gif" width="150" alt="被拖动" /><br />被拖动</td>
  </tr>
</table>

**长征姬**显示你自己上传的立绘：在 设置 › 外观 › 看板娘 里点「上传立绘」（PNG、WebP、GIF、SVG 或 JPG，不超过 8 MB，透明背景最佳；动图会自己播放），或者直接把图片放到 `$DSH_HOME/dsh-claude-style/brand/mascot.png`。插件会给她加上呼吸、摇摆、蹦跳、摇头等状态动效。插件本身不附带长征姬的图片，请使用你有权使用的图；没有上传时由大肥鱼代班。

## 安装

在项目目录安装开发依赖并构建，然后把项目目录加入 DSH 配置：

```bash
npm install
npm run build
dsh plugin --profile desktop add "<项目目录>"  # 桌面应用
dsh plugin --profile web add "<项目目录>"      # 网页应用
```

桌面和网页配置按需要选择。安装后重启 DeepSeek Harness，在插件页打开「长征机风格」。本地链接依赖项目目录保持原位。

## 字体

插件随包提供 Inter 和 JetBrains Mono；标题优先使用系统中的窄体技术字体。需要替换随包字体时，可将同名字体文件放入 `$DSH_HOME/dsh-claude-style/fonts/`。

## 文档

| 文档 | 说明 |
| --- | --- |
| [设计令牌](docs/STYLE.md) | 配色、字体、形状、动效与层级 |
| [架构决策](docs/adr/README.md) | 每条方向一页：背景、决定、后果与重审条件 |
| [更新日志](docs/CHANGELOG.md) | 版本历史 |
| [贡献指南](CONTRIBUTING.md) | 构建、提交规范与回归工具 |

## 许可

除特别说明，本仓库以 MIT 授权。

钠（Sodium）渲染引擎以 [PolyForm Shield 1.0.0](packages/client/src/features/sodium/LICENSE) 授权。

## 鸣谢

- 「钠 / Sodium」取名自 Minecraft 的 [Sodium](https://github.com/CaffeineMC/sodium) 渲染优化模组，本插件与它没有关联。
- 消息导航参考 SherUnlocked-4869 的 [dsh-plugin-msg-nav](https://github.com/SherUnlocked-4869/dsh-plugin-msg-nav)（MIT）。
- 大肥鱼的动画来自 PC2005-cloud 的 [dsh-pet](https://github.com/PC2005-cloud/dsh-pet)（MIT），经 QCYTSN 的 [dsh-dafeiyu](https://github.com/QCYTSN/dsh-dafeiyu) 整理为帧序列；本插件为非官方同人作品，与 DeepSeek 无关。
- 聊天区的增强动效改自 [dsh-chat-ux](https://github.com/alm-allen/dsh-chat-ux)（MIT）。

## 友链

> 想把 Claude Code / Codex 等外部代理的会话历史导入 DSH 接着聊？推荐作者的另一个插件 [dsh-chat-import](https://github.com/Nwflower/dsh-chat-import)。
