/**
 * Symbol key for the GSAP position parameter.
 *
 * In a factory, access via `$.pos`. With a direct import, use as a computed key:
 * ```ts
 * import { pos } from 'gsvap'
 * tl.from('header', { opacity: 0, [pos]: '<+0.1' })
 * ```
 */
export const pos = Symbol("gsvap.pos");

/**
 * Symbol key for the children sub-builder.
 *
 * In a factory, access via `$.chld`. With a direct import, use as a computed key:
 * ```ts
 * import { chld } from 'gsvap'
 * tl.from('card', { opacity: 0, [chld]: tl => tl.from('title', { opacity: 0 }) })
 * ```
 */
export const chld = Symbol("gsvap.chld");
