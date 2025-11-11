import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm'],
	dts: true,
	clean: true,
	sourcemap: true,
	treeshake: true,
	splitting: false,
	target: 'es2022',
	platform: 'neutral',
	external: ['@joyboy-parser/types', 'axios']
});
