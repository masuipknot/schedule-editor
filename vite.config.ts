import { cloudflare } from '@cloudflare/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
// vitest/config の defineConfig を使うと、同じファイルに Vitest の設定(test)も書ける
export default defineConfig({
  plugins: [
    react(),
    // Cloudflare Workers 向けのビルドと、npm run preview を本番と同じ Workers の環境で動かすためのプラグイン。
    // テスト(Vitest)は純粋関数だけが対象で Workers の環境は要らないので、テスト中は外す
    !process.env.VITEST && cloudflare(),
  ],
  test: {
    // テスト対象は React に依存しない純粋関数なので、ブラウザ環境の再現は不要
    environment: 'node',
  },
})
