declare module "astro:actions" {
	type Actions = typeof import("/Users/jafu/Documents/Code/jafupy.com/src/actions/index.ts")["server"];

	export const actions: Actions;
}