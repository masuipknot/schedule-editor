import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
// vitest/config の defineConfig を使うと、同じファイルに Vitest の設定(test)も書ける
export default defineConfig({
  plugins: [react()],
  test: {
    // テスト対象は React に依存しない純粋関数なので、ブラウザ環境の再現は不要
    environment: 'node',
  },
})
