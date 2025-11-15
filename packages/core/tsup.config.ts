import { defineConfig } from 'tsup';

export default defineConfig({
	name: "core",
	entry: ['src/index.ts'],
	format: ['esm'],
	dts: true,
	clean: true,
	sourcemap: true,
	treeshake: true,
	splitting: false,
	target: 'es2022',
	platform: 'neutral',
	external: ['@joyboy-parser/types', 'axios', 'linkedom', '@joyboy-parser/source-registry']
});
