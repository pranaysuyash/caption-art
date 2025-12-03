import request from 'supertest'

async function main() {
  const serverModule = await import('../src/server')
  const createServer =
    (serverModule as any).createServer || serverModule.default?.createServer
  const app = createServer({ enableRateLimiter: false, loadRoutes: true })
  const resp = await request(app).get('/api/_routes')
  console.log(JSON.stringify(resp.body, null, 2))
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
