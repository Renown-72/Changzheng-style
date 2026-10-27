<div align="center">

# Long March Style

**A DeepSeek Harness theme inspired by The Fire Rises' Long March girl.**

[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.en.md) [![简体中文](https://img.shields.io/badge/lang-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-red.svg)](README.md)

[![license](https://img.shields.io/badge/license-MIT%20%2B%20PolyForm%20Shield-2EA44F?style=flat)](LICENSE)

</div>

## Preview

The interface takes its cues from a Long March command console, with clear navigation, a data panel and a focused composer. Choose the crimson or cyan palette in the plugin settings; light and dark follow the system. The mascot can follow the theme or be selected independently.

### Crimson

<table>
  <tr>
    <td align="center" width="50%"><img src="./docs/screenshots/changzheng-home-light.png" alt="Crimson home, light" /></td>
    <td align="center" width="50%"><img src="./docs/screenshots/changzheng-home-dark.png" alt="Crimson home, dark" /></td>
  </tr>
</table>

The crimson palette shows the Long March girl by default.

### Cyan

<table>
  <tr>
    <td align="center" width="50%"><img src="./docs/screenshots/ember-home-light.png" alt="Cyan home, light" /></td>
    <td align="center" width="50%"><img src="./docs/screenshots/ember-home-dark.png" alt="Cyan home, dark" /></td>
  </tr>
</table>

The cyan palette shows Deepy the pixel whale by default. Its animations follow the task's state:

<table>
  <tr>
    <td align="center" width="25%"><img src="./docs/gifs/idle.gif" width="120" alt="Idle" /><br />Idle</td>
    <td align="center" width="25%"><img src="./docs/gifs/thinking.gif" width="120" alt="Thinking" /><br />Thinking</td>
    <td align="center" width="25%"><img src="./docs/gifs/typing.gif" width="120" alt="Answering and calling tools" /><br />Answering and calling tools</td>
    <td align="center" width="25%"><img src="./docs/gifs/conducting.gif" width="120" alt="Conducting subagents" /><br />Conducting subagents</td>
  </tr>
  <tr>
    <td align="center" width="25%"><img src="./docs/gifs/notification.gif" width="120" alt="Waiting on you" /><br />Waiting on you</td>
    <td align="center" width="25%"><img src="./docs/gifs/error.gif" width="120" alt="Failed" /><br />Failed</td>
    <td align="center" width="25%"><img src="./docs/gifs/happy.gif" width="120" alt="Finished" /><br />Finished</td>
    <td align="center" width="25%"><img src="./docs/gifs/sleeping.gif" width="120" alt="Asleep" /><br />Asleep</td>
  </tr>
</table>

> The workspaces, sessions, usage figures and nickname in the screenshots are sample data.

## Installation

Install the development dependencies, build the project, and add its directory to a DSH profile:

```bash
npm install
npm run build
dsh plugin --profile desktop add "<project-directory>"  # desktop app
dsh plugin --profile web add "<project-directory>"      # web app
```

Choose the profiles you use. Restart DeepSeek Harness and open Long March Style on the plugin page. A local link requires the project directory to remain in place.

## Fonts

Inter and JetBrains Mono ship with the plugin. Headings prefer condensed technical fonts installed on the system. To replace a bundled face, put a file with the same name in `$DSH_HOME/dsh-claude-style/fonts/`.

## Documentation

| Document | Contents |
| --- | --- |
| [Design tokens](docs/STYLE.md) | The palette, typography, shape, motion and layer rules |
| [Architecture decisions](docs/adr/README.md) | One page per direction: background, decision, consequences, revisiting conditions |
| [Changelog](docs/CHANGELOG.md) | Version history |
| [Contributing](CONTRIBUTING.md) | Building from `packages/client/src/`, commit conventions, and the screenshot and regression tooling |

## License

Except where otherwise stated, this repository is licensed under MIT.

The Sodium rendering engine is licensed under the [PolyForm Shield License 1.0.0](packages/client/src/features/sodium/LICENSE).

## Acknowledgements

- "Sodium" (钠) is named after Minecraft's [Sodium](https://github.com/CaffeineMC/sodium) rendering mod; this plugin is not affiliated with it.
- The message navigator follows SherUnlocked-4869's [dsh-plugin-msg-nav](https://github.com/SherUnlocked-4869/dsh-plugin-msg-nav) (MIT).
- The animation frames of Deepy the pixel whale come from the Deepy whale theme pack drawn by calmly-eating-bugs ([@wp3171216237](https://github.com/wp3171216237)), and ship with the plugin by the author's permission; GIFs of all 20 animations are in [docs/gifs/](docs/gifs/).
- The enhanced animations in the chat area are modified from [dsh-chat-ux](https://github.com/alm-allen/dsh-chat-ux) (MIT).

## Related projects

> Running several themes at once? Try [dsh-skin-manager](https://github.com/xiaoyangcheng84-svg/dsh-skin-manager) — it switches between all installed themes from a single settings page.

> Want to import your Claude Code / Codex session history into DSH and keep the conversation going? Try the author's other plugin, [dsh-chat-import](https://github.com/Nwflower/dsh-chat-import).
