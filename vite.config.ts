import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import type { IncomingMessage } from 'node:http'

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

function steamGameManagerPlugin() {
  const overridesPath = resolve(
    __dirname,
    'src/os/components/gametracker/game-overrides.json',
  )
  const libraryPath = resolve(
    __dirname,
    'src/os/components/gametracker/steam-games.generated.json',
  )
  const syncScriptPath = resolve(__dirname, 'scripts/sync-steam-library.mjs')
  let syncInProgress = false

  const hasTrustedOrigin = (request: IncomingMessage) => {
    const origin = request.headers.origin
    const host = request.headers.host
    if (!origin || !host) return false

    try {
      return new URL(origin).host === host
    } catch {
      return false
    }
  }

  const readRequestBody = (request: IncomingMessage) =>
    new Promise<string>((resolveBody, rejectBody) => {
      let body = ''

      request.on('data', (chunk) => {
        body += chunk
        if (body.length > 1_000_000) {
          rejectBody(new Error('Request body is too large.'))
          request.destroy()
        }
      })
      request.on('end', () => resolveBody(body))
      request.on('error', rejectBody)
    })

  return {
    name: 'steam-game-manager',
    configureServer(server: any) {
      server.middlewares.use(
        '/__steam-game-manager/overrides',
        async (request: IncomingMessage, response: any) => {
          const remoteAddress = request.socket.remoteAddress?.replace(
            '::ffff:',
            '',
          )
          const isLoopback =
            remoteAddress === '127.0.0.1' || remoteAddress === '::1'

          response.setHeader('Content-Type', 'application/json; charset=utf-8')

          if (!isLoopback || !hasTrustedOrigin(request)) {
            response.statusCode = 403
            response.end(
              JSON.stringify({
                error: 'The game manager is only available on this computer.',
              }),
            )
            return
          }

          if (request.method !== 'PUT') {
            response.statusCode = 405
            response.setHeader('Allow', 'PUT')
            response.end(JSON.stringify({ error: 'Method not allowed.' }))
            return
          }

          try {
            const payload = JSON.parse(await readRequestBody(request))
            if (
              !payload?.overrides ||
              typeof payload.overrides !== 'object' ||
              Array.isArray(payload.overrides)
            ) {
              throw new Error('Invalid overrides payload.')
            }

            const normalized: Record<
              string,
              { hidden?: boolean; notes?: string }
            > = {}

            Object.entries(payload.overrides).forEach(([appId, value]) => {
              if (!/^\d+$/.test(appId) || !value || typeof value !== 'object') {
                throw new Error('Every override needs a numeric Steam App ID.')
              }

              const override = value as {
                hidden?: unknown
                notes?: unknown
              }
              if (
                override.hidden !== undefined &&
                typeof override.hidden !== 'boolean'
              ) {
                throw new Error('The hidden field must be true or false.')
              }
              if (
                override.notes !== undefined &&
                (typeof override.notes !== 'string' ||
                  override.notes.length > 2_000)
              ) {
                throw new Error('Notes must be shorter than 2,000 characters.')
              }

              const notes =
                typeof override.notes === 'string'
                  ? override.notes.trim()
                  : ''
              const entry: { hidden?: boolean; notes?: string } = {}
              if (override.hidden) entry.hidden = true
              if (notes) entry.notes = notes
              if (entry.hidden || entry.notes) normalized[appId] = entry
            })

            writeFileSync(
              overridesPath,
              `${JSON.stringify(normalized, null, 2)}\n`,
              'utf8',
            )
            response.statusCode = 200
            response.end(JSON.stringify({ overrides: normalized }))
          } catch (error) {
            response.statusCode = 400
            response.end(
              JSON.stringify({
                error:
                  error instanceof Error
                    ? error.message
                    : 'Unable to save game overrides.',
              }),
            )
          }
        },
      )

      server.middlewares.use(
        '/__steam-game-manager/sync',
        async (request: IncomingMessage, response: any) => {
          const remoteAddress = request.socket.remoteAddress?.replace(
            '::ffff:',
            '',
          )
          const isLoopback =
            remoteAddress === '127.0.0.1' || remoteAddress === '::1'

          response.setHeader('Content-Type', 'application/json; charset=utf-8')

          if (!isLoopback || !hasTrustedOrigin(request)) {
            response.statusCode = 403
            response.end(
              JSON.stringify({
                error: 'Steam sync is only available on this computer.',
              }),
            )
            return
          }

          if (request.method !== 'POST') {
            response.statusCode = 405
            response.setHeader('Allow', 'POST')
            response.end(JSON.stringify({ error: 'Method not allowed.' }))
            return
          }

          if (syncInProgress) {
            response.statusCode = 409
            response.end(
              JSON.stringify({ error: 'A Steam sync is already running.' }),
            )
            return
          }

          syncInProgress = true

          try {
            await new Promise<void>((resolveSync, rejectSync) => {
              const child = spawn(process.execPath, [syncScriptPath], {
                cwd: __dirname,
                env: process.env,
                stdio: ['ignore', 'ignore', 'pipe'],
              })

              child.stderr.on('data', () => {
                // Drain output without returning environment details to the UI.
              })
              child.on('error', rejectSync)
              child.on('close', (code) => {
                if (code === 0) {
                  resolveSync()
                  return
                }
                rejectSync(new Error('Steam sync failed.'))
              })
            })

            const library = JSON.parse(readFileSync(libraryPath, 'utf8'))
            response.statusCode = 200
            response.end(
              JSON.stringify({
                gameCount: library.games?.length ?? 0,
                syncedAt: library.syncedAt,
              }),
            )
          } catch {
            response.statusCode = 500
            response.end(
              JSON.stringify({
                error:
                  'Steam sync failed. Check the API key and Steam privacy settings.',
              }),
            )
          } finally {
            syncInProgress = false
          }
        },
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), glslRawPlugin(), steamGameManagerPlugin()],
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
