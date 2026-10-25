import { describe, expect, it } from 'vitest'
import {
  applyCellPatch,
  createInitialState,
  extendViewToInclude,
  normalizeDates,
  scheduleReducer,
} from './reducer'
import type { ScheduleState } from './types'

function stateWithOneTask(): ScheduleState {
  return {
    tasks: [{ id: 'a', name: '', start: null, end: null }],
    view: { start: '2026-04-01', days: 120 },
  }
}

describe('createInitialState', () => {
  it('空行30行、当月1日から120日', () => {
    const state = createInitialState('2026-10-18')
    expect(state.tasks).toHaveLength(30)
    expect(state.tasks.every((t) => t.name === '' && t.start === null && t.end === null)).toBe(true)
    expect(new Set(state.tasks.map((t) => t.id)).size).toBe(30)
    expect(state.view).toEqual({ start: '2026-10-01', days: 120 })
  })
})

describe('normalizeDates', () => {
  it('片方だけなら同じ日付で補完する', () => {
    expect(normalizeDates('2026-04-01', null)).toEqual({ start: '2026-04-01', end: '2026-04-01' })
    expect(normalizeDates(null, '2026-04-10')).toEqual({ start: '2026-04-10', end: '2026-04-10' })
  })

  it('開始 > 終了 なら入れ替える', () => {
    expect(normalizeDates('2026-04-10', '2026-04-01')).toEqual({
      start: '2026-04-01',
      end: '2026-04-10',
    })
  })

  it('両方 null はそのまま', () => {
    expect(normalizeDates(null, null)).toEqual({ start: null, end: null })
  })
})

describe('extendViewToInclude', () => {
  const view = { start: '2026-04-01', days: 30 } // 4/1〜4/30

  it('範囲内なら同じオブジェクトを返す', () => {
    expect(extendViewToInclude(view, '2026-04-01', '2026-04-23')).toBe(view)
  })

  it('範囲内でも右端の余白に入ったら広げる', () => {
    expect(extendViewToInclude(view, '2026-04-01', '2026-04-28')).toEqual({
      start: '2026-04-01',
      days: 35, // 4/1〜5/5
    })
  })

  it('右にはみ出したら、終了日+余白まで日数を延ばす', () => {
    expect(extendViewToInclude(view, '2026-04-20', '2026-05-10')).toEqual({
      start: '2026-04-01',
      days: 47, // 4/1〜5/17
    })
  })

  it('左にはみ出したら、その月の1日から表示する', () => {
    expect(extendViewToInclude(view, '2026-03-15', '2026-04-02')).toEqual({
      start: '2026-03-01',
      days: 61, // 3/1〜4/30(終了日 4/2 は右端から十分離れているので右は広げない)
    })
  })
})

describe('scheduleReducer', () => {
  it('UPDATE_NAME は対象の行の項目名だけを変える', () => {
    const state = scheduleReducer(stateWithOneTask(), { type: 'UPDATE_NAME', id: 'a', name: '要件定義' })
    expect(state.tasks[0]).toEqual({ id: 'a', name: '要件定義', start: null, end: null })
  })

  it('SET_DATES は不変条件を守って保存する', () => {
    const state = scheduleReducer(stateWithOneTask(), {
      type: 'SET_DATES',
      id: 'a',
      start: '2026-04-10',
      end: '2026-04-01',
    })
    expect(state.tasks[0]).toMatchObject({ start: '2026-04-01', end: '2026-04-10' })
  })

  it('SET_DATES で表示範囲外の日付が入ると範囲が広がる', () => {
    const state = scheduleReducer(stateWithOneTask(), {
      type: 'SET_DATES',
      id: 'a',
      start: '2026-09-01',
      end: '2026-09-10',
    })
    expect(state.view.start).toBe('2026-04-01')
    expect(state.view.days).toBeGreaterThan(120)
  })

  it('CLEAR_DATES で両方の日付が消える', () => {
    let state = scheduleReducer(stateWithOneTask(), {
      type: 'SET_DATES',
      id: 'a',
      start: '2026-04-01',
      end: '2026-04-10',
    })
    state = scheduleReducer(state, { type: 'CLEAR_DATES', id: 'a' })
    expect(state.tasks[0]).toMatchObject({ start: null, end: null })
  })

  it('EXTEND_VIEW_DAYS は表示日数だけを延ばす', () => {
    const state = scheduleReducer(stateWithOneTask(), { type: 'EXTEND_VIEW_DAYS', days: 30 })
    expect(state.view).toEqual({ start: '2026-04-01', days: 150 })
  })

  it('EXTEND_VIEW_DAYS で 0 以下を渡しても縮まない', () => {
    const before = stateWithOneTask()
    expect(scheduleReducer(before, { type: 'EXTEND_VIEW_DAYS', days: -10 })).toBe(before)
  })

  it('SET_VIEW_START は表示開始日だけを変える', () => {
    const state = scheduleReducer(stateWithOneTask(), { type: 'SET_VIEW_START', start: '2026-06-01' })
    expect(state.view).toEqual({ start: '2026-06-01', days: 120 })
  })
})

describe('applyCellPatch(不変条件)', () => {
  const dated = { id: 'a', name: '要件定義', start: '2026-04-01', end: '2026-04-10' }
  const empty = { id: 'b', name: '', start: null, end: null }

  it('触らない列(undefined)は元のまま', () => {
    expect(applyCellPatch(dated, { name: '設計' })).toEqual({ ...dated, name: '設計' })
  })

  it('日付のある行で片方だけ空にしたら、両方空になる', () => {
    expect(applyCellPatch(dated, { start: null })).toMatchObject({ start: null, end: null })
    expect(applyCellPatch(dated, { end: null })).toMatchObject({ start: null, end: null })
  })

  it('空の行に片方だけ入れたら、もう片方を補完する', () => {
    expect(applyCellPatch(empty, { start: '2026-04-13' })).toMatchObject({
      start: '2026-04-13',
      end: '2026-04-13',
    })
  })

  it('新しい日付と空欄を一緒に貼ったら、新しい日付で補完する', () => {
    expect(applyCellPatch(dated, { start: '2026-04-13', end: null })).toMatchObject({
      start: '2026-04-13',
      end: '2026-04-13',
    })
  })

  it('開始 > 終了 なら入れ替える', () => {
    expect(applyCellPatch(empty, { start: '2026-04-20', end: '2026-04-13' })).toMatchObject({
      start: '2026-04-13',
      end: '2026-04-20',
    })
  })
})

describe('PASTE_CELLS / CLEAR_CELLS', () => {
  function threeRows(): ScheduleState {
    return {
      tasks: [
        { id: 'a', name: 'A', start: '2026-04-01', end: '2026-04-03' },
        { id: 'b', name: 'B', start: null, end: null },
        { id: 'c', name: 'C', start: null, end: null },
      ],
      view: { start: '2026-04-01', days: 120 },
    }
  }

  it('top 行目から順に書き込む', () => {
    const state = scheduleReducer(threeRows(), {
      type: 'PASTE_CELLS',
      top: 1,
      patches: [{ start: '2026-04-13', end: '2026-04-16' }, { name: 'CC' }],
    })
    expect(state.tasks[0]).toMatchObject({ name: 'A', start: '2026-04-01' })
    expect(state.tasks[1]).toMatchObject({ start: '2026-04-13', end: '2026-04-16' })
    expect(state.tasks[2]).toMatchObject({ name: 'CC', start: null })
  })

  it('行が足りなければ空行を追加する', () => {
    const state = scheduleReducer(threeRows(), {
      type: 'PASTE_CELLS',
      top: 2,
      patches: [{ name: 'X' }, { name: 'Y' }, { name: 'Z' }],
    })
    expect(state.tasks).toHaveLength(5)
    expect(state.tasks.map((t) => t.name)).toEqual(['A', 'B', 'X', 'Y', 'Z'])
    expect(new Set(state.tasks.map((t) => t.id)).size).toBe(5)
  })

  it('貼った日付が見えるように表示範囲を広げる', () => {
    const state = scheduleReducer(threeRows(), {
      type: 'PASTE_CELLS',
      top: 1,
      patches: [{ start: '2026-12-01', end: '2026-12-10' }],
    })
    expect(state.view.days).toBeGreaterThan(120)
  })

  it('CLEAR_CELLS で範囲の値を空にする(日付は不変条件どおり両方)', () => {
    const state = scheduleReducer(threeRows(), {
      type: 'CLEAR_CELLS',
      top: 0,
      patches: [{ name: '', start: null }],
    })
    expect(state.tasks[0]).toMatchObject({ name: '', start: null, end: null })
  })
})
