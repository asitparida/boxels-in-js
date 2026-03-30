import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  if (mode === 'lib') {
    return {
      build: {
        lib: {
          entry: resolve(__dirname, 'src/lib/index.ts'),
          formats: ['es', 'cjs'],
          fileName: (format) => `boxels.${format === 'es' ? 'mjs' : 'cjs'}`,
        },
        outDir: 'dist/lib',
        emptyOutDir: true,
        rollupOptions: {
          external: ['react', 'react-dom'],
        },
      },
    }
  }

  return {
    root: 'docs',
    base: '/boxels-in-js/',
    plugins: [react()],
    resolve: {
      alias: {
        'boxels': resolve(__dirname, 'src/lib/index.ts'),
      },
    },
    build: {
      outDir: resolve(__dirname, 'dist/app'),
    },
  }
})
