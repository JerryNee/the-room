import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function glslRawPlugin() {
  return {
    name: 'glsl-raw',
    transform(_code: string, id: string) {
      if (!/\.(glsl|vs|fs|vert|frag)$/.test(id)) return null
      return {
        code: `export default ${JSON.stringify(readFileSync(id, 'utf8'))};`,
        map: null,
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), glslRawPlugin()],
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        os: resolve(__dirname, 'os/index.html'),
        portalLab: resolve(__dirname, 'portal-lab/index.html'),
      },
    },
  },
})
