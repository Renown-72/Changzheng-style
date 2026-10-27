#!/usr/bin/env node
/**
 * build.mjs — bundle `lib/client.js` from the TypeScript modules and stylesheets in `packages/client/src/` (D36).
 *
 * The DSH module loader takes one file per plugin client, registered with
 * `__ModuleLoader__.load` and handed a `require` for the packages the host
 * provides; it has no relative requires and no asset URLs. So esbuild bundles
 * packages/client/src/entry.ts into one minified CommonJS body with React and the host packages
 * external, and that body is wrapped in the loader's factory:
 *
 *   packages/client/src/entry.ts                 apply(): the FEATURES table, the deferred features installed from their chunks (D72)
 *   packages/client/src/constants.ts             constants; also evaluated here for the stylesheet gates
 *   scripts/chunks.mjs                           the deferred features' chunks (D72), routed like the assets
 *   scripts/build-cache.mjs                      the brotli payloads kept between runs in .debug/build-cache/
 *   packages/client/src/core/ packages/client/src/shared/ packages/client/src/features/<name>/   the modules, TypeScript, strict
 *   packages/client/src/features/<dir>/<main>.manifest.ts   each feature's manifest (D72), read by scripts/shared/read-manifests.mjs
 *   packages/client/src/theme/*.css and the feature stylesheets   concatenated by rank (THEME_SHEETS and the manifests),
 *                                checked and gated on the syntax tree (scripts/css.mjs)
 *   packages/client/src/theme/tokens.json        the design tokens: the token stylesheet and docs/STYLE.md's table
 *   packages/assets/src/                  every image (packages/assets/assets.mjs): small ones inline, the rest
 *                                written to lib/assets/<hash>.<ext> and served by the host half
 *   packages/assets/src/fonts/            the four faces the package ships with the one licence file that
 *                                covers them, copied to lib/fonts/ (buildFonts)
 *
 * What the build produces for the browser half reaches the source as one
 * generated module, `virtual:dsh-claude-style/generated` (typed in
 * packages/client/src/generated.d.ts): the stylesheet, the asset addresses, the lockups, the
 * build id.
 *
 * Before anything is written, `tsc` type-checks packages/client/src/ and the bundle's import
 * graph must hold no cycle: a missing import, a cycle or a constant read before
 * it is initialized fails the build. Those refusals and the contract tables'
 * are in scripts/build-checks.mjs, the stylesheets' in scripts/css.mjs; the three
 * generated modules are scripts/virtual-modules.mjs.
 *
 * The order of the writes is part of the contract: every asset and the host
 * half land before `lib/client.js`, because the client half of the hot reload
 * watches that one file — a page that swaps to it must find this build's chunks
 * already on disk and already in the manifest (D72).
 *
 * `packages/client/data/model-descriptions.json` is not bundled: it is validated
 * (scripts/model-copy.mjs) and copied to `lib/`, where the host half serves it to
 * the browser half at runtime. Model copy is data, so it must not enter the bundle (D5).
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { brotliCompressSync } from 'node:zlib'
import esbuild from 'esbuild'
import { buildHostHalf } from './build-host.mjs'
import { buildFonts, checkClaimed, checkSheets, checkWebpSheet, planAssets, routeText, writeAssets } from '../packages/assets/assets.mjs'
import { openBuildCache } from './build-cache.mjs'
import { checkContracts, checkCycles, checkDependencies, checkListed, checkManifests, checkMotionSources, checkScrollOwner, checkTypes } from './build-checks.mjs'
import { chunkFiles, chunkModules, ownModuleIds, splitChunks } from './chunks.mjs'
import { TOKEN_SHEET, loadTokens, writeTokenTable } from './theme-tokens.mjs'
import { buildStylesheet, writeLayerTable, writeMotionTable } from './css.mjs'
import { FEATURE_SHEET_CONSTANTS } from './feature-sheets.mjs'
import { motionValues } from './shared/motion-tokens.mjs'
import { readSourceTree } from './source-tree.mjs'
import { MODEL_COPY, validateModelCopy } from './model-copy.mjs'
import { PEAKRATE_CATALOG, validatePeakCatalog } from './peakrate-catalog.mjs'
import { PRICES_FILE, validatePrices } from './prices.mjs'
import { readManifests } from './shared/read-manifests.mjs'
import { loadModule } from './shared/ts-module.mjs'
import { chunkModulesModule, featuresModule, generatedModule, settingsControlsModule } from './virtual-modules.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'packages', 'client', 'src')
/** The model copy: data beside the browser half's code, never bundled. */
const DATA = path.join(ROOT, 'packages', 'client', 'data')
/** The peak rate catalog the host half serves: data beside the host half's code, never bundled */
const HOST_DATA = path.join(ROOT, 'packages', 'host', 'data')
/** Brand marks, mascot sheets and vendor lockups; packages/assets/assets.mjs plans their delivery */
const ASSETS = path.join(ROOT, 'packages', 'assets', 'src')
/** The plugin icon the manifest names, copied into lib/ as it is. */
const BRAND_ASSETS = path.join(ASSETS, 'brand')
/** The style guide; its token table is generated from packages/client/src/theme/tokens.json. */
const STYLE_GUIDE = path.join(ROOT, 'docs', 'STYLE.md')
const LIB = path.join(ROOT, 'lib')
const OUT = path.join(LIB, 'client.js')
/** The slow steps' results between runs (scripts/build-cache.mjs). */
const CACHE_DIR = path.join(ROOT, '.debug', 'build-cache')

/**
 * The plugin icon the 0.1.7 plugin manifest reads.
 *
 * `package.json` declares it as `icon`, a path relative to the manifest
 * (SVG/PNG/JPEG/WebP, at most 256 KiB, inside the package directory); the host
 * reads the bytes and hands the client a base64 data URI for an `<img>`. It is
 * copied like the copy document so the source of truth stays in `packages/client/src/` and
 * `lib/` remains generated output.
 *
 * The emblem draws its own colours rather than a `currentColor` shape: an
 * `<img>` cannot inherit `currentColor` the way the inlined brand art does, so
 * the file it names has to read on both canvases on its own.
 */
const ICON_SOURCE = 'changzheng-mark.svg'
const ICON_FILE = 'changzheng-mark.svg'

/**
 * The stylesheets that belong to no feature, with their place in the
 * concatenated sheet. A feature's own sheets come from its manifest (D72),
 * each with a rank on this same scale; the build sorts the two together.
 * The order is the cascade: where two rules meet at the same specificity,
 * the later one wins.
 */
const THEME_SHEETS = [
  // Generated from packages/client/src/theme/tokens.json (scripts/css.mjs).
  { file: TOKEN_SHEET, rank: 5 },
  { file: 'theme/tokens.css', rank: 10 },
  { file: 'theme/typography.css', rank: 20 },
  // Shared parts before every feature: a feature's own rule comes later and
  // wins where the two meet at the same specificity.
  { file: 'shared/motion.css', rank: 25 },
  { file: 'shared/popover.css', rank: 30 },
  { file: 'shared/swapping-text.css', rank: 35 },
  { file: 'shared/segment-control.css', rank: 38 },
  { file: 'shared/sliding-pill.css', rank: 40 },
  { file: 'shared/masked.css', rank: 45 },
  { file: 'theme/chrome.css', rank: 50 },
  { file: 'theme/hero.css', rank: 70 },
  { file: 'theme/sidebar.css', rank: 110 },
  { file: 'theme/third-party.css', rank: 300 },
  // The neon finish over every feature's own paint: the accent glows, the
  // home page's aurora and grid (after the composer card it refines).
  { file: 'theme/neon.css', rank: 390 },
  // Last: the page on a wallpaper restates what the features paint on the shell
  { file: 'theme/wallpaper.css', rank: 400 },
]

/**
 * Every stylesheet in cascade order: the theme's and each manifest's, sorted
 * by rank. A rank two sheets share would leave their order to chance, so it
 * fails the build.
 *
 * @param manifests - the feature manifests (scripts/shared/read-manifests.mjs).
 * @returns `{ file, rank, gate? }` with `file` relative to packages/client/src.
 */
function styleFiles(manifests) {
  const sheets = [
    ...THEME_SHEETS,
    // A generated sheet has no file of its own; it is written from constants.ts (scripts/feature-sheets.mjs).
    ...manifests.flatMap((manifest) => manifest.stylesheets.map((sheet) => (sheet.generated === undefined ? { ...sheet, file: `features/${manifest.dir}/${sheet.file}` } : sheet))),
  ].sort((a, b) => a.rank - b.rank)
  for (let i = 1; i < sheets.length; i++) {
    if (sheets[i].rank === sheets[i - 1].rank) throw new Error(`build: ${sheets[i - 1].file ?? sheets[i - 1].generated} and ${sheets[i].file ?? sheets[i].generated} share the stylesheet rank ${sheets[i].rank}`)
  }
  return sheets
}

/** The package's own manifest; the loader id, the stylesheet's tag and the profile entry carry its name (D9). */
const PACKAGE = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const PACKAGE_ID = PACKAGE.name

/** The packages the host's loader hands the factory's `require`; never bundled. */
const HOST_PACKAGES = ['react', 'react-dom/client', '@deepseek-ai/dsh-client-ui-primitives']

/**
 * Whether this build keeps the assets the build before it shipped (D72).
 *
 * A linked checkout is what the flag is for: its live page boots the bundle
 * that was on disk when the host composed the graph, and after a rebuild that
 * page asks for the chunk names of the previous build. Explicit rather than
 * automatic — a published package must carry exactly its own assets — and inert
 * in CI for the same reason.
 */
const RETAIN_ASSETS = process.env.DSH_CLAUDE_STYLE_DEBUG === '1' && process.env.CI === undefined

/**
 * The DSH profiles that run this checkout as the plugin, by profile name.
 *
 * A profile's `node_modules/<package>` resolving to this directory is what the
 * loader runs — a `link:` install points there, a registry install does not.
 * The build log names the profiles, so why a kept or replaced asset set matters
 * is never a guess.
 *
 * @returns the profile directory names, empty when this checkout is linked nowhere.
 */
function linkedProfiles() {
  const profiles = path.join(process.env.DSH_HOME ?? path.join(homedir(), '.dsh'), 'profiles')
  if (!fs.existsSync(profiles)) return []
  const self = fs.realpathSync(ROOT)
  const linked = []
  for (const entry of fs.readdirSync(profiles, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const installed = path.join(profiles, entry.name, 'node_modules', PACKAGE_ID)
    if (fs.existsSync(installed) && fs.realpathSync(installed) === self) linked.push(entry.name)
  }
  return linked
}

/** Stands where the build id goes until the bundle's own hash is known. */
const BUILD_ID_SLOT = '%%BUILD_ID%%'

/**
 * The loader's factory around esbuild's CommonJS body: `require` resolves the
 * external packages, and what the body puts on `module.exports` (`apply`) is
 * what the factory returns to the host.
 */
const FACTORY_OPEN = `/**
 * Claude Style — Claude Code Desktop theme for the DeepSeek Harness web GUI.
 * GENERATED FILE — do not edit. Source lives in packages/client/src/; \`npm run build\` bundles it.
 * Contains the Sodium rendering engine, licensed under the PolyForm Shield License 1.0.0
 * rather than MIT; see docs/NOTICE.md and packages/client/src/features/sodium/LICENSE.
 */
window.__ModuleLoader__.load({
  id: ${JSON.stringify(PACKAGE_ID)},
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports`
const FACTORY_CLOSE = `    return module.exports
  },
})`

/**
 * Evaluate packages/client/src/constants.ts and the mascot sheet tables once (pure, DOM-free):
 * the gate attributes the stylesheets are checked against, the two sheet
 * tables, the asset scales and the preference defaults the browser half carries.
 */
const CONSTANTS = (() => {
  const constantsFile = 'packages/client/src/constants.ts'
  const sheetsFile = 'packages/client/src/features/mascot/sheets.ts'
  const constants = loadModule(constantsFile)
  const sheets = loadModule(sheetsFile)
  const pick = (module, file, names) => Object.fromEntries(names.map((name) => {
    if (module[name] === undefined) throw new Error(`build: ${file} exports no ${name}`)
    return [name, module[name]]
  }))
  const { BRAND_ATTR, BRAND_EMBER, BRANDS, COMPOSER_ATTR, PALETTE_ATTR, PALETTE_CARD_ATTR, PALETTE_SKIN, PALETTE_HOST, TYPEFACE_ATTR, TYPEFACE_SKIN, TYPEFACE_HOST } = pick(constants, constantsFile, ['BRAND_ATTR', 'BRAND_EMBER', 'BRANDS', 'COMPOSER_ATTR', 'PALETTE_ATTR', 'PALETTE_CARD_ATTR', 'PALETTE_SKIN', 'PALETTE_HOST', 'TYPEFACE_ATTR', 'TYPEFACE_SKIN', 'TYPEFACE_HOST'])
  return {
    // The gate attributes scripts/css.mjs checks, stamps and writes the token
    // blocks under: who paints the colours and who sets the type (D30), the
    // composer preference (D9), the colour card (D30) and the brand's own
    // blocks (D30).
    gates: {
      composer: COMPOSER_ATTR,
      palette: { attribute: PALETTE_ATTR, claude: PALETTE_SKIN, host: PALETTE_HOST },
      paletteCard: { attribute: PALETTE_CARD_ATTR },
      typeface: { attribute: TYPEFACE_ATTR, claude: TYPEFACE_SKIN, host: TYPEFACE_HOST },
      brand: { attribute: BRAND_ATTR, deepseek: BRAND_EMBER },
    },
    brands: BRANDS,
    ...pick(sheets, sheetsFile, ['DEEPY_CLIPS', 'DEEPY_SHEETS', 'DEEPY_SCALE', 'DEEPY_GUTTER', 'DEEPY_GRID']),
    featureSheets: pick(constants, constantsFile, FEATURE_SHEET_CONSTANTS),
  }
})()

/**
 * The brand marks the stylesheets paint, each as the custom property
 * `--dsh-claude-image-<name>` the token sheet declares (the skin has no asset
 * URLs: the DSH loader exposes none, so a mark is a data URI or a route
 * address, whichever the asset manifest decided).
 */
const BRAND_MARKS = [
  // The two cards' emblems: a red-gold star inside its orbit for the crimson
  // card, the same star lit cold for the cyan one, each with its word.
  'changzheng-mark.svg',
  'changzheng-word.svg',
  'ember-mark.svg',
  'ember-word.svg',
  // GitHub's own mark, for the settings page's link to the repository.
  'github-mark.svg',
]

/**
 * The vendored vendor lockups, keyed by brand id.
 *
 * One file per vendor, already composed from Lobe's mark and wordmark by
 * scripts/fetch-lobe-combines.py, with the vendor's own word in a
 * `data-combine-word` attribute (the word is not derivable from the brand id:
 * `moonshot` draws "MoonshotAI", `zai` draws "zai"). Markup rather than a CSS
 * data URI, because the picker stamps it into the row with `innerHTML` so the
 * mono layer inherits the row's `color`.
 *
 * @param plan - the asset plan (planAssets); the lockups are its text entries.
 * @param claimed - the paths the build read (checkClaimed).
 * @returns brand id → { svg, word }.
 */
function loadCombines(plan, claimed) {
  const out = {}
  for (const [file, entry] of plan.entries) {
    if (!file.startsWith('icons/combine/') || !file.endsWith('.svg')) continue
    claimed.add(file)
    const id = path.basename(file, '.svg')
    const svg = entry.text.replace(/\r\n/g, '\n').trim()
    if (!svg.startsWith('<svg') || !svg.includes('viewBox=')) {
      throw new Error(`build: packages/assets/src/${file} is not a scalable SVG (needs <svg viewBox=…>)`)
    }
    if (svg.includes('</') && /<\/script/i.test(svg)) throw new Error(`build: packages/assets/src/${file} carries a script end tag`)
    if (svg.includes('\n')) throw new Error(`build: packages/assets/src/${file} is multi-line; run scripts/fetch-lobe-combines.py`)
    const word = /data-combine-word="([^"]+)"/.exec(svg)
    if (word === null) throw new Error(`build: packages/assets/src/${file} has no data-combine-word`)
    out[id] = { svg, word: word[1] }
  }
  if (Object.keys(out).length === 0) throw new Error('build: packages/assets/src/icons/combine/ holds no lockups; run scripts/fetch-lobe-combines.py')
  return out
}

/**
 * 大肥鱼's sheets, held to their clip table before they ship: every clip an
 * animation plays has its WebP sheet under packages/assets/src/mascot/deepy/,
 * every sheet is a clip's, and each sheet's size matches its clip's crop box,
 * gutter and frame count (checkWebpSheet). The sheets ship as they are.
 */
function checkDeepySheets() {
  const dir = path.join(ASSETS, 'mascot', 'deepy')
  const clips = Object.fromEntries(Object.entries(CONSTANTS.DEEPY_CLIPS).map(([name, clip]) => [name, { ...clip, still: 0 }]))
  checkSheets('DEEPY_CLIPS', clips, CONSTANTS.DEEPY_GRID, dir, (name) => [`${name}.webp`])
  for (const [key, sheet] of Object.entries(CONSTANTS.DEEPY_SHEETS)) {
    if (clips[sheet.clip] === undefined) throw new Error(`build: DEEPY_SHEETS["${key}"] plays "${sheet.clip}", which DEEPY_CLIPS does not carry`)
    if (!Number.isInteger(sheet.still) || sheet.still < 0 || sheet.still >= sheet.frames) throw new Error(`build: DEEPY_SHEETS["${key}"] needs a still frame inside its clip`)
  }
  for (const [name, clip] of Object.entries(CONSTANTS.DEEPY_CLIPS)) {
    checkWebpSheet('DEEPY_CLIPS', name, fs.readFileSync(path.join(dir, `${name}.webp`)), clip, CONSTANTS.DEEPY_SCALE, CONSTANTS.DEEPY_GUTTER)
  }
}

async function main() {
  checkTypes()
  const manifests = readManifests()
  checkManifests(manifests)
  checkContracts(manifests)
  checkDependencies()
  // The browser half on its syntax tree, once the type check has passed: the
  // attributes it writes, its easing curves and stacking levels, the motion
  // tokens it asks for (scripts/source-tree.mjs).
  const sources = readSourceTree(ROOT, [SRC, path.join(ROOT, 'packages', 'engine', 'src')])
  checkMotionSources(sources)
  const sheets = styleFiles(manifests)

  // Every image, its content hash and its address Nothing is written
  // yet: the plan is read by everything below, and a refusal anywhere in this
  // build must leave lib/ as it was.
  const cache = openBuildCache(CACHE_DIR)
  checkDeepySheets()
  const plan = planAssets({ assetsDir: ASSETS })
  const claimed = new Set()
  const images = {}
  for (const file of BRAND_MARKS) {
    const entry = plan.entries.get(`brand/${file}`)
    if (entry === undefined) throw new Error(`build: each asset is claimed or fails the build; brand/${file} is missing`)
    claimed.add(`brand/${file}`)
    images[path.basename(file, '.svg')] = entry.url
  }
  const combines = loadCombines(plan, claimed)

  // 大肥鱼's sheets are routed, one per clip, and only the played ones are
  // ever fetched.
  const deepyUrls = {}
  for (const name of Object.keys(CONSTANTS.DEEPY_CLIPS)) {
    const entry = plan.entries.get(`mascot/deepy/${name}.webp`)
    // checkDeepySheets found every one of them, so absence is a bug here.
    if (entry === undefined) throw new Error(`build: DEEPY_CLIPS["${name}"] has no sheet; the sheets and the table disagree`)
    claimed.add(entry.file)
    deepyUrls[name] = entry.url
  }
  const portrait = plan.entries.get('mascot/changzheng/portrait.png')
  if (portrait === undefined) throw new Error('build: the Long March mascot portrait is missing')
  claimed.add(portrait.file)
  checkClaimed(plan, claimed)

  const tokenDoc = loadTokens(SRC)
  // The colour-card preference stores a card id and the brand vocabulary
  // declares the values it accepts, so a card without its brand would be
  // unpickable and a brand without its card would have nothing to paint.
  const cards = new Set(tokenDoc.palette.cards.map((card) => card.id))
  if (cards.size !== CONSTANTS.brands.length || !CONSTANTS.brands.every((id) => cards.has(id))) {
    throw new Error(`build: the palette cards (${[...cards].join(', ')}) and the brand vocabulary (${CONSTANTS.brands.join(', ')}) disagree`)
  }
  const css = buildStylesheet({ sheets, srcDir: SRC, sources, tokenDoc, gates: CONSTANTS.gates, images, featureConstants: CONSTANTS.featureSheets })
  if (writeTokenTable(STYLE_GUIDE, tokenDoc)) console.log('built docs/STYLE.md token table from packages/client/src/theme/tokens.json')
  if (writeMotionTable(STYLE_GUIDE, tokenDoc)) console.log('built docs/STYLE.md motion table from packages/client/src/theme/tokens.json')
  if (writeLayerTable(STYLE_GUIDE, tokenDoc)) console.log('built docs/STYLE.md layer table from packages/client/src/theme/tokens.json')

  // The build-time values, for the bundle and for the chunks alike: each
  // carries the ones its own modules read.
  const generated = generatedModule({
    STYLESHEET: css.main,
    // The surface sheets apart: they stay mounted while ds-bot's surface has the page (D74).
    SURFACE_STYLESHEET: css.surface,
    // Vendor lockups: one markup table plus the word each lockup stands in for.
    COMBINE_SVGS: Object.fromEntries(Object.entries(combines).map(([id, item]) => [id, item.svg])),
    COMBINE_WORDS: Object.fromEntries(Object.entries(combines).map(([id, item]) => [id, item.word])),
    // The build id: a hash of the bundle itself, written into it below. The
    // skin puts it on <body data-dsh-claude-style>, so a live page can be
    // matched to the lib/client.js it runs — a hot reload swaps the bundle
    // without reloading the page, so the page's load time says nothing about
    // its code.
    BUILD_ID: BUILD_ID_SLOT,
    // The version this client bundle reports wherever the host asks a client
    // for its build: the account Remote carries it on every call.
    CLIENT_VERSION: PACKAGE.version,
    DEEPY_SHEET_URLS: deepyUrls,
    CHANGZHENG_PORTRAIT_URL: portrait.url,
    // The motion tokens, by name: the browser half reads the same table the
    // generated token stylesheet carries, so a duration cannot be 200 ms in the
    // CSS and 250 ms in a Web Animations call (D9).
    MOTION: motionValues(tokenDoc),
    // The colour cards, as the settings page shows them: the same data the token
    // sheet resolves, so the swatches and the page cannot disagree.
    PALETTE_CARDS: tokenDoc.palette.cards,
  })

  /**
   * The bundle's esbuild options around a feature registry and a chunk-module
   * table. The graph passes below take them as they are: the modules a pass
   * reaches do not depend on minifying or on the chunks' addresses.
   */
  const clientOptions = (chunkUrls, shared) => ({
    entryPoints: [path.join(SRC, 'entry.ts')],
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    target: 'esnext',
    charset: 'utf8',
    minify: true,
    sourcemap: 'linked',
    outfile: OUT,
    write: false,
    metafile: true,
    logLevel: 'silent',
    external: HOST_PACKAGES,
    // The factory around the body is part of the output, so the source map
    // counts its lines.
    banner: { js: FACTORY_OPEN },
    footer: { js: FACTORY_CLOSE },
    plugins: [featuresModule(manifests, chunkUrls), chunkModulesModule(shared), settingsControlsModule(manifests), generated],
  })

  // The deferred features leave the bundle for chunks of their own (D72). A
  // graph pass stands every chunk's address in with its feature id.
  const deferred = manifests.filter((manifest) => manifest.load === 'deferred')
  const standIns = Object.fromEntries(deferred.map((manifest) => [manifest.id, manifest.id]))
  const split = await splitChunks({
    deferred,
    mainModules: async (promoted) => {
      const graph = await esbuild.build({ ...clientOptions(standIns, promoted), minify: false, sourcemap: false })
      return new Set(ownModuleIds(graph.metafile))
    },
    options: { external: HOST_PACKAGES, plugins: [settingsControlsModule(manifests), generated] },
    slot: BUILD_ID_SLOT,
  })
  const chunkUrls = {}
  const chunkInputs = []
  for (const [id, { result: chunk }] of split.chunks) {
    checkCycles(chunk.metafile)
    checkScrollOwner(chunk.metafile)
    chunkInputs.push(...chunkModules(chunk))
    const files = chunkFiles(chunk)
    chunkUrls[id] = routeText(plan, { file: `chunks/${id}.js`, name: files.name, type: 'text/javascript; charset=utf-8', text: files.code }).url
    routeText(plan, { file: `chunks/${id}.js.map`, name: files.mapName, type: 'application/json; charset=utf-8', text: files.map })
  }

  const result = await esbuild.build(clientOptions(chunkUrls, split.shared))
  checkCycles(result.metafile)
  checkScrollOwner(result.metafile)
  // The metafile keys paths the way esbuild saw them: repository-relative. Both
  // sides of the comparison are the repository's own modules, generated ones
  // included: a second copy of a generated module ships its values twice (D72).
  const prefix = `${path.relative(ROOT, SRC).split(path.sep).join('/')}/`
  const mainIds = ownModuleIds(result.metafile)
  const twice = mainIds.filter((id) => chunkInputs.includes(id))
  if (twice.length > 0) throw new Error(`build: the bundle and a feature chunk both carry ${twice.join(', ')}`)
  const bundled = new Set([...mainIds, ...chunkInputs].filter((id) => id.startsWith(prefix)).map((id) => id.slice(prefix.length)))
  checkListed(bundled, sheets)

  const output = (suffix) => result.outputFiles.find((file) => file.path.endsWith(suffix)).text
  const draft = output('client.js')
  const sourceMap = output('client.js.map')
  // The slot and the id have the same length, so the source map's columns hold.
  const buildId = createHash('sha256').update(draft).digest('hex').slice(0, BUILD_ID_SLOT.length)
  if (draft.split(BUILD_ID_SLOT).length !== 2) throw new Error('build: the bundle does not carry the build id slot exactly once')
  const bundle = draft.replace(BUILD_ID_SLOT, buildId)

  // Syntax gate: the bundle must parse before it is written. The failing
  // bundle is kept in .debug/ so the line the parser names can be read.
  try {
    new vm.Script(bundle, { filename: 'lib/client.js' })
  } catch (error) {
    fs.mkdirSync(path.join(ROOT, '.debug'), { recursive: true })
    fs.writeFileSync(path.join(ROOT, '.debug', 'failed-bundle.js'), bundle)
    throw new Error(`build: generated bundle failed to parse (written to .debug/failed-bundle.js): ${error.message}`)
  }

  // Everything is validated before anything is written: a refusal anywhere in
  // this build must not leave lib/ holding one half of a new build beside the
  // other half of the previous one. lib/ is not in version control (D47), so a
  // fresh clone has no directory to write into yet.
  const copy = JSON.parse(fs.readFileSync(path.join(DATA, MODEL_COPY), 'utf8'))
  const familyRules = validateModelCopy(copy, combines)
  const copyText = JSON.stringify(copy, null, 2) + '\n'
  // The peak rate catalog is the data source's own document, shipped as the
  // copy a machine with no reach judges by; the host half's parser is the same
  // one the build checks it with
  const catalogPath = path.join(HOST_DATA, PEAKRATE_CATALOG)
  const catalogText = fs.readFileSync(catalogPath, 'utf8')
  const catalogProfiles = validatePeakCatalog(JSON.parse(catalogText), catalogPath)
  // The price snapshot is the repository's validated scrape, shipped as the
  // copy a machine with no reach prices by.
  const pricesPath = path.join(HOST_DATA, PRICES_FILE)
  const pricesText = fs.readFileSync(pricesPath, 'utf8')
  const pricedModels = validatePrices(JSON.parse(pricesText), pricesPath)
  const iconSource = path.join(BRAND_ASSETS, ICON_SOURCE)
  const iconTarget = path.join(LIB, ICON_FILE)
  if (!fs.existsSync(iconSource)) throw new Error(`build: packages/assets/src/brand/${ICON_SOURCE} is missing`)

  fs.mkdirSync(LIB, { recursive: true })

  fs.writeFileSync(path.join(LIB, MODEL_COPY), copyText)
  console.log(`built lib/${MODEL_COPY} (${familyRules} family rules, ${copy.tiers.length} tier rules)`)

  fs.writeFileSync(path.join(LIB, PEAKRATE_CATALOG), catalogText)
  console.log(`built lib/${PEAKRATE_CATALOG} (${catalogProfiles} profiles) from packages/host/data/${PEAKRATE_CATALOG}`)

  fs.writeFileSync(path.join(LIB, PRICES_FILE), pricesText)
  console.log(`built lib/${PRICES_FILE} (${pricedModels} models) from packages/host/data/${PRICES_FILE}`)

  fs.copyFileSync(iconSource, iconTarget)
  console.log(`built lib/${ICON_FILE} (${fs.statSync(iconTarget).size} bytes) from packages/assets/src/brand/${ICON_SOURCE}`)

  // Brotli's output is fixed by its input and the library's version, so both key it.
  const compress = (bytes) => cache.get('brotli', [process.versions.brotli, bytes], () => brotliCompressSync(bytes))
  const assets = writeAssets(LIB, plan, { retain: RETAIN_ASSETS, compress })
  console.log(`built lib/assets/ (${assets.files} routed of ${plan.entries.size} assets, ${assets.bytes} bytes) from packages/assets/src/`)
  if (assets.kept > 0) {
    console.log(`kept ${assets.kept} asset(s) an earlier build shipped (DSH_CLAUDE_STYLE_DEBUG=1): a page running that build still asks for them`)
  }

  const fonts = buildFonts({ assetsDir: ASSETS, libDir: LIB })
  console.log(`built lib/fonts/ (${fonts.files} files, ${fonts.bytes} bytes) from packages/assets/src/fonts/`)

  const host = await buildHostHalf({ outDir: LIB })
  console.log(`built lib/host/ (${host.files} modules) from packages/host/src/`)

  // Last, always: this is the file a running page's client hot reload watches,
  // and the generation it swaps to reads its chunks from this build. Writing it
  // after every asset means those chunks are already on disk and already in the
  // manifest when the page asks for them (D72).
  fs.writeFileSync(OUT, bundle)
  fs.writeFileSync(`${OUT}.map`, sourceMap)
  console.log(`built lib/client.js (${Buffer.byteLength(bundle)} bytes, build ${buildId}) from packages/client/src/ (${bundled.size} modules + ${sheets.length} stylesheets + ${Object.keys(combines).length} lockups)`)
  for (const [id, url] of Object.entries(chunkUrls)) {
    console.log(`built the deferred feature "${id}" as ${url} (${Buffer.byteLength(plan.entries.get(`chunks/${id}.js`).text)} bytes)`)
  }
  const pruned = cache.prune()
  const { hits, misses } = cache.counts()
  console.log(`build cache .debug/build-cache/: ${hits} reused, ${misses} computed${pruned > 0 ? `, ${pruned} unused for a day removed` : ''}`)
  if (!RETAIN_ASSETS) {
    const linked = linkedProfiles()
    if (linked.length > 0) {
      console.log(`linked into ${linked.join(', ')}: a rebuild replaces lib/assets, and a page still running the previous bundle asks for chunks this build replaced — build with DSH_CLAUDE_STYLE_DEBUG=1 to keep them`)
    }
  }
}

// A build never waits on the test lock (D77): a run that a build swaps the page
// under says so itself (scripts/verify.mjs, "honest") and files no verdict.
await main()
