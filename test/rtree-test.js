const assert = require('assert')
const fs = require('fs')
const rtree = require('../lib/rtree')
const levelup = require('levelup')
const memdown = require('memdown')
const encode = require('encoding-down')

const loadEntries = filename => JSON.parse(fs.readFileSync(`./data/${filename}`, 'utf8'))

const search = (index, box) => new Promise(async (resolve, reject) => {
  const acc = []
  const readStream = await index.search(box)
  readStream
    .on('data', data => acc.push(data))
    .on('end', () => resolve(acc))
    .on('error', reject)
})


describe('rtree', function () {

  it('uses linear split for wrong option', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const index = await rtree(db, { split: 'X' })
    // TODO: assert me!
  })

  it('uses M = 25 when no options are supplied', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const index = await rtree(db)
    // TODO: assert me!
  })

  it('#insert - add single entry', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const index = await rtree(db, { M: 9, split: 'L' })
    const entries = loadEntries('ne_110m_admin_0_countries.json')
    await Promise.all(entries.map(entry => index.insert(entry.box, entry.id)))

    // "id": 39
    const cyprus = [
      [32.73178022637745, 35.000344550103506],
      [34.576473829900465, 35.67159556735879]
    ]

    const hits = await search(index, cyprus)
    assert.deepEqual(hits, [39, 40])
  })
})