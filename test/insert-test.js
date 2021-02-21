const assert = require('assert')
const fs = require('fs')
const R = require('ramda')
const uuid = require('uuid-random')
const Insert = require('../lib/rtree/insert')

const expected = id => JSON.parse(fs.readFileSync(`./test/expected/${id}.json`, 'utf8'))
const initial = id => JSON.parse(fs.readFileSync(`./test/initial/${id}.json`, 'utf8'))

const fixture = id => JSON.parse(fs.readFileSync(`./test/fixture/${id}.json`, 'utf8'))

const store = opts => {
  var keyidx = 0
  return {
    M: opts.M || 3,
    put: node => opts.nodes[node.key] = node,
    key: () => opts.keys[keyidx++],
    get: key => opts.nodes[key]
  }
}

describe('insert', function () {

  it('[I--L01] appends to leaf with enough capacity (direct)', async function () {
    const root = 'a4020a1f-ffcd-4684-b597-b5aa0372b558'
    const { nodes, expected } = fixture('I--L01')
    const opts = { M: 3, nodes }

    const entry = { id: 1000, box: [[0, 0], [1, 1]] }
    const insert = Insert(store(opts))
    const groups = await insert(nodes[root], entry)

    assert.strictEqual(groups.length, 1) // no split: original (root) node
    assert.deepEqual(nodes, expected)
  })

  it('[I--L02] splits leaf on overflow', async function () {
    const root = 'a4020a1f-ffcd-4684-b597-b5aa0372b558'
    const { nodes, expected } = fixture('I--L02')
    const keys = ['efa87b5c-1334-4537-a342-552a28ca6a2d']
    const opts = { M: 3, nodes, keys }

    const entry = { box: [[8, 8], [9, 9]], id: 1010 }
    const insert = Insert(store(opts))
    const groups = await insert(nodes[root], entry)

    assert.strictEqual(groups.length, 2) // split: new sibling leaf
    assert.deepEqual(nodes, expected)
  })

  it('[I--I01] appends to leaf with enough capacity (indirect)', async function () {
    const root = "44519293-b6a9-4817-be78-0c002380395c"
    const { nodes, expected } = fixture('I--I01')
    const keys = ['efa87b5c-1334-4537-a342-552a28ca6a2d']
    const opts = { M: 3, nodes, keys }

    const entry = { box: [[-2, -1], [0, 0]], id: 1011 }
    const insert = Insert(store(opts))
    const groups = await insert(nodes[root], entry)
    assert.strictEqual(groups.length, 1) // no root split
    assert.deepEqual(nodes, expected)
  })
})