import { useEffect, useRef, type RefObject } from 'react'
import { LEFT_PANE_WIDTH } from '../layout'
import { autoScrollSpeed } from '../lib/autoScroll'

type Options = {
  /** true の間だけ自動スクロールの見張りをする(ドラッグ中) */
  active: boolean
  /** スクロールさせるコンテナ */
  scrollRef: RefObject<HTMLDivElement | null>
  /** 最後に分かっているポインタの x 座標。分からなければ null */
  getPointerX: () => number | null
  /** 自動スクロールでスクロール位置が変わったときに呼ぶ */
  onScrolled: () => void
  /** 右向きに自動スクロールしようとしたが、もう右端でそれ以上進めないときに呼ぶ */
  onReachRightEnd: () => void
}

/**
 * ドラッグ中、ポインタがカレンダーの左右の端に近づいたら自動でスクロールする。
 *
 * pointermove はポインタが動いたときしか届かないので、端でポインタを止めたままだと
 * スクロールも日付の更新も止まってしまう。そこで requestAnimationFrame(画面の書き換えごとに
 * 1回呼ばれる仕組み)でループを回し、毎フレーム「最後のポインタ位置」からスクロールと日付の再計算を行う
 */
export function useAutoScroll(options: Options) {
  // ループは active が true になったときに1回だけ始める。その間に渡される関数は描画のたびに
  // 作り直されるので、ループの中からは常に最新のものを使えるよう ref に入れ直しておく
  const latest = useRef(options)
  useEffect(() => {
    latest.current = options
  })

  const { active } = options
  useEffect(() => {
    if (!active) return

    let frameId = 0
    // 表示日数の延長を頼んだときのコンテナの幅。延長が画面に反映される前に、
    // 次のフレームで同じお願いを重ねて送らないようにするため
    let extendRequestedAtWidth = -1

    function tick() {
      const { scrollRef, getPointerX, onScrolled, onReachRightEnd } = latest.current
      const el = scrollRef.current
      const pointerX = getPointerX()
      if (el && pointerX !== null) {
        const rect = el.getBoundingClientRect()
        // カレンダーが見えている領域: 固定の左ペインの右端 〜 コンテナの右端(縦スクロールバーは除く)
        const speed = autoScrollSpeed(pointerX, rect.left + LEFT_PANE_WIDTH, rect.left + el.clientWidth)
        if (speed !== 0) {
          const atRightEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1
          if (speed > 0 && atRightEnd && extendRequestedAtWidth !== el.scrollWidth) {
            extendRequestedAtWidth = el.scrollWidth
            onReachRightEnd()
          }
          const before = el.scrollLeft
          el.scrollLeft += speed
          if (el.scrollLeft !== before) onScrolled()
        }
      }
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    // ドラッグが終わったら(active が false になったら)ループを止める
    return () => cancelAnimationFrame(frameId)
  }, [active])
}
