import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const injectAds = () => ({
  name: 'inject-ads',
  transformIndexHtml(html: string) {
    const ads = readFileSync(resolve(process.cwd(), 'src/ads.html'), 'utf8').trim()
    if (!ads) return html

    return html.replace('</body>', `  ${ads}\n  </body>`)
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), injectAds()],
})
