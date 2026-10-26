# 长征机改造交接 · 当前状态

这份文档记录这一轮改造做了什么、停在哪里、下一步怎么继续。它不进 npm 包（`package.json` 的 `files` 只带 `docs/STYLE.md`、`docs/CHANGELOG.md`、`docs/NOTICE.md`、`docs/THIRD_PARTY_NOTICES.md`）。

## 目标

把这个 DeepSeek Harness 主题插件从「Claude Code Desktop 复刻」整体改成《The Fire Rises》长征姬的视觉：深紫黑底、霓虹绯红与青霓双色卡、红金五角星徽记、赛博像素吉祥物。吉祥物要两个：**长征姬**与**大肥鱼**（原来的像素鲸鱼 Deepy）。

## 已完成

### 1. 配色与字体（`packages/client/src/theme/tokens.json`）

两张色卡，卡 id 与品牌 id 一致：

| 卡 | 强调色 | 浅色画布 | 深色画布 | 暗色描边 |
|---|---|---|---|---|
| `changzheng`（默认，绯红） | `#ff3355` | `#f7f4fb` | `#0f0a1a` | 提亮轮廓（highlight） |
| `ember`（青霓） | `#4cf0e8` | `#f4fbfb` | `#08111a` | 面台阶（surface） |

- 侧栏、读者气泡、链接、行内代码色都按卡给值；`--dsh-claude-field-ring` 改为青霓 `#4cf0e8`；焦点环、投影、数据色（`--dsh-claude-data-ink` `#c2183f`/`#ff5c7a`）、涟漪波前（`#ff3355`/`#4cf0e8`）、峰谷徽章都改了；谷价徽章改用星金 `#ffd54a`，与徽记呼应。
- 字体栈：去掉 Anthropic 的衬线显示体，显示体改为系统窄体技术字（Bahnschrift / DIN Alternate / Archivo / Oswald / Arial Narrow），正文改为 UI 无衬线，代码仍是 JetBrains Mono。
- 绯红卡用 `highlight` 而不是 `surface`：`surface` 的「面台阶」音阶只声明深色一档，浅色下 `--dsw-alias-border-l1` 会没有值，浅色模式的卡片描边会整片消失（右栏 dock 卡片就是这样挂掉的）。青霓卡保留 `surface`。

### 2. 品牌与偏好（`packages/contracts/src/prefs.ts`、`packages/client/src/constants.ts`、`core/prefs.ts`）

- 品牌：`BRAND_CHANGZHENG = 'changzheng'`、`BRAND_EMBER = 'ember'`；旧的 `claude` / `deepseek` / `off` 通过 `legacy` 映射读成新值。
- 配色/字体开关的取值由 `'claude'` 改为 `'skin'`（`PALETTE_SKIN` / `TYPEFACE_SKIN`），旧值同样走 `legacy`。
- 吉祥物四个选项：`brand` / `changzheng` / `deepy` / `off`；旧的 `crab` 映射到 `changzheng`。
- `resolveMascot`：「跟随品牌」时绯红卡出长征姬、青霓卡出大肥鱼。
- `paletteColors` 也补了 legacy（`claude`→`changzheng`、`deepseek`→`ember`），读者钉住的色卡不会掉回「跟随品牌」。

### 3. 品牌美术

- 新增 `packages/assets/src/brand/changzheng-mark.svg`（56×56，星徽 + 轨道弧）、`changzheng-word.svg`（210×100）、`ember-mark.svg`、`ember-word.svg`。
- 删除 `anthropic-mark.svg`、`claude-mark.svg`、`claude-mark-clay.svg`、`claude-word.svg`、`deepseek-mark.svg`、`deepseek-word.svg`；`github-mark.svg` 与 `icons/combine/*`（模型选择器的供应商图标）保留。
- 插件图标改为 `changzheng-mark.svg`（`scripts/build.mjs` 的 `ICON_SOURCE`）。
- 侧栏、hero、账号行、设置页导航图标、品牌锁定全部改成「按卡取 mask、用 `--dsh-claude-logo-ink` 填充」的单色绘制；字标比例按 210/100 写进 `sidebar.css`、`settings-cards.css`、`settings-brand-lockup.ts` 的 `BRAND_ART`。
- 设置页品牌卡改成两件一组（徽记 + 字标），`settings-tab-general.ts` 的 `themePicker` 重写，不再用 DeepSeek 的 lockup 图。

### 4. 吉祥物（`packages/client/src/features/mascot/`）

- `mascot-character.ts`（原 `crab.ts` 改名）：长征姬，`name: 'changzheng'`。
- `whale.ts` 保留：大肥鱼（Deepy 鲸鱼），`name: 'deepy'`。
- `mascot.ts`：两个角色并存，按偏好挂一个、另一个释放。
- `mascot.manifest.ts`：两个样式表（`mascot.css` rank 350、`whale.css` rank 360），四个选项标签。
- 长征姬的每个动画是**三张** sheet：`<key>.png`（角色本色：白发、肤色、红瞳、金色星夹）、`<key>-accent.png`（领巾与裙，用 `--dsw-alias-brand-primary` 填充，两卡共用一张画）、`<key>-ink.png`（笔记本、思考泡、字母等道具，用三级文字色填充）。绘制脚本 `scripts/draw-changzheng.py`，输出在 `packages/assets/src/mascot/changzheng/`。
- `mascot.css` 重写为三层叠图（strip + ::before 强调色 + ::after 墨色）；命中区、锚点、尺寸沿用原来的 52×36 / 2px 约定。
- `mascot.copy.json`：`mascotChangzheng = 长征姬`、`mascotDeepy = 大肥鱼`。

### 5. 资源与构建管线

- `scripts/build.mjs`：`gutterMascotSheets`（长征姬，三张）与 `vectorizeDeepySheets`（大肥鱼，矢量化）两条管线并存；`BRAND_MARKS` 换成四个新文件；`MASCOT_DIR = 'changzheng'`、`MASCOT_SHEET_FILES(name)` 给出三张文件名。
- `packages/assets/assets.mjs`：sheet 文件名规则允许 `-accent` / `-ink` 后缀；`SOURCE_ONLY` 去掉螃蟹输入图；`SHIPPED_FONTS` 去掉 `NotoSerifVariable.woff2`。
- `packages/client/src/generated.d.ts`：`MASCOT_SHEET_URLS` 是 `{ body, accent, ink }`，`DEEPY_SHEET_URLS` 恢复。
- `packages/host/src/routes.ts`：字体白名单只剩 JetBrains Mono 两款 + Inter；`packages/host/src/index.ts` 的注释同步。
- 删除 `NotoSerifVariable.woff2`（新样式不再用衬线体），`theme/typography.css` 里三款 Anthropic 字体与 Noto Serif 的 `@font-face` 一并去掉。`packages/assets/src/fonts/anthropic/` 目录留在仓库里（它按约定本来就不进 npm 包），只是现在没有任何样式表注册它。

### 6. 文案与元数据

- `locale/zh.json`、`locale/en.json`：插件标题与简介改为长征机。
- `skin.json`：`id: changzheng-style`、`name: Long March Style`、`tagline`、`accent: #ff3355`。`package`、`bodyAttr`、`wiring.id` 未动（那是安装与样式命名空间）。
- `settings.copy.json`：主题风格两卡标签「绯红 / Long March」「青霓 / Ember」；设置页标题「长征机风格」；配色与字体的开关文案改成不提 Anthropic。
- `mascot.copy.json`、`chat-send.copy.json`（示例文案里的包名保持不变）。

### 7. 空语句与测试数据

- `packages/testing/data/importance-ledger.json`：三条 `display:none!` 的键跟着选择器重写（`:is([data-dsh-claude-brand=changzheng],[data-dsh-claude-brand=ember])`），判定、状态与对手方原样保留。
- `packages/testing/data/importance-unreachable.json`、`surface.json`：`dsh-claude-crab` → `changzheng` 等改名。
- `smoke` 用例与探针：品牌 id 改成 `changzheng` / `ember`，吉祥物类名改成 `.dsh-claude-changzheng`，色卡 id 与标签更新；`chat-wait` 的探针改为「两卡都隐藏主机的鲸鱼尾、都显示皮肤自己的 loader 与自己的那个词」（`shared/turn-activity.ts` 的 `waitingWord` 已删除，因为它只在一个卡显示主机文案时才需要）。
- `smoke/host-half.mjs`：字体断言跟着白名单与 SHIPPED_FONTS 更新。
- 逻辑规范：`stored-values.spec.ts`（品牌与配色的 legacy、两卡吉祥物解析）、`activity.spec.ts`（删掉 `waitingWord` 的用例）、`brand-text.spec.ts` 的色值。

### 8. 文档

- `docs/STYLE.md`：调色板叙述、「两套配色归属」、排版、等待行、首页数据色、实现说明全部改成长征机口吻；生成的三张表由构建重写。**吉祥物章节目前合成了一节**，而你要两个，这一节需要拆回「长征姬」与「大肥鱼」两节。

## 当前状态与阻塞

- **`npm run build` 最后一次是通过的**，产物已生成（`lib/client.js`、`lib/assets/`、`lib/host/`）。但在那之后我又改了 `tokens.json` 的 `edges` 和测试期望，`lib/` 现在相对源码是**旧的**，需要重新构建。
- 最后一条「构建 + 全量 smoke」命令需要放宽沙箱权限，被拒绝了。受限沙箱会以 `EPERM` 拒绝 `esbuild`、`tsc`、Playwright 创建子进程，所以**构建、smoke、verify 都必须在一个允许子进程的环境里跑**（例如你本机终端，或对这条命令单独授权）。
- 已经单独验证过：`npx tsc --noEmit` 通过；`node packages/testing/smoke.mjs --case chat-wait` 通过（改探针之后）；站内页面上皮肤确实装载（`data-dsh-claude-style=79da9d73dd28`、`brand=changzheng`、`palette=skin`、`mascot=changzheng`）。
- **还没跑**：完整 smoke、behaviour、e2e、`npm run lint`。
- **还没做**：
  1. `docs/STYLE.md` 的吉祥物章节拆成两节。
  2. 两个 mark SVG 目前是双色（绯红星弧 + 星金五角星 + 内芯）。侧栏、hero、设置页导航图标都用 `-webkit-mask` 当单色形状，页面里三条路径的颜色会被同一个墨色覆盖，五角星与星弧会糊在一起。要改成单色形状，或用不同 alpha（星不透明、星弧 0.55）保留层次。
  3. `README.md` / `README.en.md` 的标题、预览说明、字体说明与截图仍是 Claude 时期的内容。
  4. `docs/adr/` 里 D30 描述的是两个老品牌；这次改造是否需要新增一页 ADR、以及 `CONTRIBUTING.md`、`docs/THIRD_PARTY_NOTICES.md`（Anthropic 字体与鲸鱼的来源说明）是否要改，按 `AGENTS.md` 的 D48 判据决定。
  5. 已提交两个 commit（见下节），还没推送。

## 下一步建议顺序

在允许子进程的终端里，于仓库根目录：

```sh
npm run build                 # 让 lib/ 与源码一致
npm run smoke                 # 全量冒烟；剩下的是记录型期望，按失败项逐个改
npm run lint                  # 命名、大小、复制片段等规则
```

然后：

1. 把两张 mark 改成单色或 alpha 分层，重建，看侧栏与 hero 是否还能读出星徽。
2. 把 `docs/STYLE.md` 的吉祥物一节拆成两节，分别写长征姬（三层 sheet，强调色 mask）与大肥鱼（52×52、五倍像素、矢量重建、`image-rendering` 保持默认）。
3. 重新截图：`node packages/testing/e2e.mjs --scenario shots` 把明暗两套写到 trace 目录，替换 `docs/screenshots/`。
4. 更新双语 README 的标题、简介、字体一节与预览。
5. 装机验证（两条路，任选）：
   - `node packages/testing/dsh-web.mjs`：自起一个临时 `$DSH_HOME`、把这个 checkout 链进它的 web profile，打印带 token 的地址。这是最快确认「DSH 能应用这个插件」的方式。
   - 或在自己的 profile 里装：`dsh plugin --profile web add <本目录>`，重启 DeepSeek Harness，在设置 › 通用 › 主题风格里选「绯红」或「青霓」。
6. 装机后检查三项：侧栏徽记与字标、输入框上沿的吉祥物（两卡各一个）、设置页外观页的两张品牌卡。

## 已提交

```
e3d26917 feat(theme): 主题改成《The Fire Rises》长征姬的霓虹赛博视觉
93bdac4b docs: 记录长征机改造的交接状态
```

第一个 commit 带 `docs/changes/changzheng-retheme.json`（改成 `improvements` 组的一条），`docs/STYLE.md` 与测试数据的改写在里面；第二个只加本文档。工作树是干净的，没有推送。

## 已知的取舍

- 内部命名空间没改：包名仍是 `dsh-claude-style`，属性仍是 `data-dsh-claude-*`，令牌前缀仍是 `--dsh-claude-*`。这些是插件自己的标识，改它们要动宿主加载、路由、资源路径与数百处选择器；对外可见的名字已经换成长征机。
- `edges` 只给青霓卡用 `surface`，因为那档的浅色描边会交给宿主令牌；绯红卡作为默认外观保留 `highlight`，浅色模式的描边才完整。
- 随包发布的字体只剩 JetBrains Mono 两款（OFL）与 Inter（OFL）；Anthropic 三款不再被任何样式表注册，Noto Serif 已删除，`docs/THIRD_PARTY_NOTICES.md` 与 README 的字体说明要跟着改。
