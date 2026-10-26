/**
 * Host half of dsh-claude-style.
 *
 * The skin's effect is browser-only. This half exists for the things a
 * browser-only plugin cannot do:
 *
 *   1. Serve the model copy document. That table is DATA, not code — it ships
 *      beside the bundle as `model-descriptions.json` and the browser half
 *      fetches it at runtime, so the table grows without a rebuild and the
 *      bundle stays free of copy.
 *   2. Serve the bundled code font and UI sans as webfonts. The skin's stacks
 *      name 'JetBrains Mono' and 'Inter' by their own family names, and a face
 *      renders only when its family resolves — most systems have never
 *      installed either. Both ship in this package (SIL OFL), so the fonts
 *      route hands them to the browser half's @font-face and the stacks work
 *      with zero system installs. A user's own copy dropped into
 *      `$DSH_HOME/dsh-claude-style/fonts/` answers the same name first; a
 *      missing file simply 404s and the stack falls back to a system-installed
 *      copy, then to the next family it names.
 *   3. Resolve the OS user once for the browser half. The username route answers
 *      a single GET and the browser caches it; it runs the host's own request
 *      fence first — see refusalOf() in routes.ts.
 *   4. Serve the routed images. The mascot's sheets, the vendor lockups and the
 *      brand marks ride the bundle when they are small enough and are written
 *      beside it otherwise, so the browser fetches each one the first time it
 *      is wanted.
 *
 * The registrations are defensive. A host without a web server, or with the
 * route prefix already taken, or with the settings service absent, must still
 * activate the plugin: a failed host fiber also drops the client bundle from
 * the module graph and the whole skin with it. The browser half falls back to
 * its defaults when either surface is missing.
 *
 * The routes live in routes.ts, the HDSL account contract in hdsl.ts, and the
 * settings surface in settings.ts; this file only mounts them.
 */
import { PACKAGE_NAME } from '@dsh-claude-style/contracts/package'
import { registerRoutes } from './routes.js'
import type { DshContext, DshScope } from '@dsh-claude-style/engine/node/dsh'
import { registerSettings } from './settings.js'
import { registerWidgetUsage } from './widget-usage.js'

export const name = PACKAGE_NAME
export { Config } from './settings.js'

/**
 * Register the plugin's host surfaces.
 * @param ctx - host plugin context.
 */
export function apply(ctx: DshContext) {
  // Always register through inject, never on the bare ctx. `ctx.get()` reads a
  // service leniently (no inject declaration needed), but the PROPERTY access
  // inside registerRoutes (`scope.webServer`) is gated by the fiber's inject
  // declaration, and a host half re-applies while the web server is already
  // running (a generation relink after a client-bundle rebuild). inject()
  // waits for the service and hands registerRoutes a scope that HAS the
  // declaration, so both a boot-time apply and a hot relink register. A host
  // without a web server simply waits here, and the skin still activates.
  if (typeof ctx.inject === 'function') ctx.inject(['webServer'], (scope: DshScope) => { registerRoutes(ctx, scope) })
  else registerRoutes(ctx, ctx as DshScope)

  registerSettings(ctx)
  registerWidgetUsage(ctx)
}
