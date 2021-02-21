const assert = require('assert')
const choosePath = require('../lib/rtree/choosepath')

describe('choosepath', function () {

  it('least enlargement first (no enlargement)', function () {
    const entries = [
      { box: [[0, 0], [10, 10]], key: 'A' },
      { box: [[10, 10], [14, 14]], key: 'B' }
    ]

    const box = [[2, 2], [8, 8]]
    const key = entries[choosePath(entries, box)].key
    assert.strictEqual(key, 'A')
  })

  it('least enlargement first (enlargement)', function () {
    const entries = [
      { box: [[0, 0], [10, 10]], key: 'A' },
      { box: [[14, 0], [24, 10]], key: 'B' }
    ]

    const box = [[12, 2], [14, 4]]
    const key = entries[choosePath(entries, box)].key
    assert.strictEqual(key, 'B')
  })

  it('smaller area on enlargement tie (no enlargement)', function () {
    const entries = [
      { box: [[0, 0], [10, 10]], key: 'A' },
      { box: [[0, 0], [5, 5]], key: 'B' }
    ]

    const box = [[1, 1], [2, 2]]
    const key = entries[choosePath(entries, box)].key
    assert.strictEqual(key, 'B')
  })
})