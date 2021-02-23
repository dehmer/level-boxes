const assert = require('assert')
const fs = require('fs')
const R = require('ramda')
const uuid = require('uuid-random')
const Insert = require('../lib/rtree/insert')
const PickSeeds = require('../lib/rtree/pickseeds')
const PickNext = require('../lib/rtree/picknext')

const fixture = id => JSON.parse(fs.readFileSync(`./test/fixture/${id}.json`, 'utf8'))

const store = options => {
  var keyidx = 0
  return {
    M: options.M || 3,
    pickSeeds: PickSeeds[options.split] || PickSeeds['L'],
    pickNext: PickNext[options.split] || PickNext['L'],
    put: (key, node) => options.nodes[key] = node,
    key: () => {
      if (keyidx === options.keys.length) throw Error('key pool underflow')
      return options.keys[keyidx++]
    },
    get: key => options.nodes[key]
  }
}

describe('insert', function () {

  it('[I--L01] no leaf split (root)', async function () {
    const root = 'a4020a1f-ffcd-4684-b597-b5aa0372b558'
    const { nodes, expected } = fixture('I--L01')
    const opts = { M: 3, nodes }

    const entry = { id: 1000, box: [[0, 0], [1, 1]] }
    const insert = Insert(store(opts))
    const groups = await insert(root, entry)

    assert.strictEqual(groups.length, 1) // no split: original (root) node
    assert.deepEqual(nodes, expected)
  })

  it('[I--L02] leaf split (root)', async function () {
    const root = 'a4020a1f-ffcd-4684-b597-b5aa0372b558'
    const { nodes, expected } = fixture('I--L02')
    const keys = ['efa87b5c-1334-4537-a342-552a28ca6a2d']
    const opts = { M: 3, nodes, keys }

    const entry = { box: [[8, 8], [9, 9]], id: 1010 }
    const insert = Insert(store(opts))
    const groups = await insert(root, entry)

    assert.strictEqual(groups.length, 2) // split: new sibling leaf
    assert.deepEqual(nodes, expected)
  })

  it('[I--I01] no leaf split (non-root)', async function () {
    const root = "44519293-b6a9-4817-be78-0c002380395c"
    const { nodes, expected } = fixture('I--I01')
    const keys = ['efa87b5c-1334-4537-a342-552a28ca6a2d']
    const opts = { M: 3, nodes, keys }

    const entry = { box: [[-2, -1], [0, 0]], id: 1011 }
    const insert = Insert(store(opts))
    const groups = await insert(root, entry)
    assert.strictEqual(groups.length, 1) // no root split
    assert.deepEqual(nodes, expected)
  })

  it('[I--I02] leaf split (non-root)', async function () {
    const root = '44519293-b6a9-4817-be78-0c002380395c'
    const { nodes, expected } = fixture('I--I02')
    const keys = ['876a03f8-fa01-4db3-95b3-81d8c6d2b0b7']
    const opts = { M: 3, nodes, keys }

    const entry = { box: [[3, 4], [5, 12]], id: 1011 }
    const insert = Insert(store(opts))
    const groups = await insert(root, entry)

    assert.strictEqual(groups.length, 1) // no root split
    assert.deepEqual(nodes, expected)
  })

  it('[I--I03] propagate leaf split', async function () {
    const root = '44519293-b6a9-4817-be78-0c002380395c'
    const { nodes, expected } = fixture('I--I03')
    const keys = [
      'f3d8f7cf-2945-4139-9209-88445e1a8aeb',
      'a762c15c-4916-485f-b8e1-d6507ee1ffa2'
    ]

    const opts = { M: 3, nodes, keys }

    const entry = { box: [[4, 6], [6, 7]], id: 1012 }
    const insert = Insert(store(opts))
    const groups = await insert(root, entry)

    assert.strictEqual(groups.length, 2)
    assert.strictEqual(groups[1].key, keys[1])
    assert.deepEqual(nodes, expected)
  })
})
