<div align="center">

# 长征机风格 · Long March Style

**以《The Fire Rises》长征姬视觉为主题的 DeepSeek Harness 插件。**

[![简体中文](https://img.shields.io/badge/lang-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-red.svg)](README.md) [![English](https://img.shields.io/badge/lang-English-blue.svg)](README.en.md)

[![license](https://img.shields.io/badge/license-MIT%20%2B%20PolyForm%20Shield-2EA44F?style=flat)](LICENSE)

</div>

## 预览

界面以长征姬指挥终端为视觉线索，使用清晰的侧栏标记、数据面板和输入区域。在插件设置中切换绯红与青霓两套配色；浅色和深色跟随系统。吉祥物可以跟随主题，也可以单独选择长征姬或大肥鱼。

### 绯红

<table>
  <tr>
    <td align="center" width="50%"><img src="./docs/screenshots/changzheng-home-light.png" alt="绯红主题首页，浅色" /></td>
    <td align="center" width="50%"><img src="./docs/screenshots/changzheng-home-dark.png" alt="绯红主题首页，深色" /></td>
  </tr>
</table>

绯红配色默认显示长征姬。

### 青霓

<table>
  <tr>
    <td align="center" width="50%"><img src="./docs/screenshots/ember-home-light.png" alt="青霓主题首页，浅色" /></td>
    <td align="center" width="50%"><img src="./docs/screenshots/ember-home-dark.png" alt="青霓主题首页，深色" /></td>
  </tr>
</table>

青霓配色默认显示大肥鱼 Deepy。它会随任务状态切换动画：

<table>
  <tr>
    <td align="center" width="25%"><img src="./docs/gifs/idle.gif" width="120" alt="空闲" /><br />空闲</td>
    <td align="center" width="25%"><img src="./docs/gifs/thinking.gif" width="120" alt="思考" /><br />思考</td>
    <td align="center" width="25%"><img src="./docs/gifs/typing.gif" width="120" alt="写回答、调用工具" /><br />写回答、调用工具</td>
    <td align="center" width="25%"><img src="./docs/gifs/conducting.gif" width="120" alt="指挥子代理" /><br />指挥子代理</td>
  </tr>
  <tr>
    <td align="center" width="25%"><img src="./docs/gifs/notification.gif" width="120" alt="等你操作" /><br />等你操作</td>
    <td align="center" width="25%"><img src="./docs/gifs/error.gif" width="120" alt="失败" /><br />失败</td>
    <td align="center" width="25%"><img src="./docs/gifs/happy.gif" width="120" alt="完成" /><br />完成</td>
    <td align="center" width="25%"><img src="./docs/gifs/sleeping.gif" width="120" alt="睡着" /><br />睡着</td>
  </tr>
</table>

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
- Deepy 的动画帧图来自 calmly-eating-bugs（[@wp3171216237](https://github.com/wp3171216237)）绘制的 Deepy 小鲸鱼主题包。
- 聊天区的增强动效改自 [dsh-chat-ux](https://github.com/alm-allen/dsh-chat-ux)（MIT）。

## 友链

> 想把 Claude Code / Codex 等外部代理的会话历史导入 DSH 接着聊？推荐作者的另一个插件 [dsh-chat-import](https://github.com/Nwflower/dsh-chat-import)。
