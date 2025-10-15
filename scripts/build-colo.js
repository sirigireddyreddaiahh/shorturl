import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

async function main() {
  // Skip remote fetch during CI builds to avoid network delays or rate limits.
  if (process.env.CI || process.env.CF_PAGES) {
    console.log('Skipping build-colo fetch in CI/Cloudflare Pages')
    return
  }

  const locations = await fetch('https://raw.githubusercontent.com/Netrvin/cloudflare-colo-list/refs/heads/main/locations.json')
  if (!locations.ok) {
    throw new Error('Failed to fetch locations')
  }
  const colos = await locations.json()
  writeFileSync(join(import.meta.dirname, '../public/colos.json'), JSON.stringify(colos.reduce((acc, c) => {
    acc[c.iata] = {
      lat: c.lat,
      lon: c.lon,
    }
    return acc
  }, {}), 'utf8'))
}

main().catch(console.error)
