// ドラッグ中の「端での自動スクロール」の速さを決める計算(React に依存しない純粋関数)

/** 端からこの距離(px)以内にポインタが入ったら自動スクロールする */
export const AUTO_SCROLL_EDGE_PX = 40
/** 1フレームあたりの最大スクロール量(px)。端に近いほど、この値に近づく */
export const AUTO_SCROLL_MAX_SPEED = 20

/**
 * ポインタの x 座標から、1フレームあたりのスクロール量を求める。
 * 左向きはマイナス、右向きはプラス、端から離れていれば 0。
 *
 * areaLeft / areaRight は「カレンダーが見えている領域」の左端・右端の画面座標。
 * 領域の外(ウィンドウの外も含む)にポインタがあるときは最大の速さにする。
 * 端に近いほど速くするのは、少しだけ動かしたいときと一気に進みたいときを、
 * ポインタの位置だけで使い分けられるようにするため
 */
export function autoScrollSpeed(
  pointerX: number,
  areaLeft: number,
  areaRight: number,
  edge = AUTO_SCROLL_EDGE_PX,
  maxSpeed = AUTO_SCROLL_MAX_SPEED,
): number {
  /** 端からの距離 → 速さ。端ちょうど(またはその外)で最大、edge の位置で 0 に近づく */
  function speedFor(distanceFromEdge: number): number {
    const ratio = Math.min(1, (edge - distanceFromEdge) / edge)
    // 小数だとスクロール位置が少しずつしか進まず止まって見えることがあるので、最低 1px は動かす
    return Math.max(1, Math.round(maxSpeed * ratio))
  }

  const fromLeft = pointerX - areaLeft
  const fromRight = areaRight - pointerX
  if (fromLeft < edge) return -speedFor(fromLeft)
  if (fromRight < edge) return speedFor(fromRight)
  return 0
}
