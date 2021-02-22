#!/usr/bin/env node
const fs = require('fs')
const { Writable } = require('stream')
const R = require('ramda')
const proj4 = require('proj4')
const levelup = require('levelup')
const memdown = require('memdown')
const encode = require('encoding-down')
const uuid = require('uuid-random')
const { decode } = require('../lib/shapefile/shapefile')
const Insert = require('../lib/rtree/insert')
const Rectangle = require('../lib/rtree/rectangle')

const feature = proj => ({ recordNumber, shapeType, box, points }) => {
  // Project minimal bounding rectangle according projection:
  return {
    id: recordNumber,
    box: [[box.xmin, box.ymin], [box.xmax, box.ymax]].map(proj)
  }
}

const load = store => new Writable({
  objectMode: true,
  async write (entry, _, next) {

    try {
      await store.put(`box:${entry.id}`, entry.box)
      const nodes = await Insert(store)(store.root(), entry)
      if (nodes.length === 2) {

        // Create grow a new root with both nodes as entries.
        const key = store.key()
        const root = {
          box: Rectangle.merge(nodes.map(R.prop('box'))),
          entries: nodes.map(({ key, box }) => ({ key, box })),
          leaf: false
        }

        store.put(key, root)
        store.put('root', key)
      }

      next()
    } catch(err) {
      next(err)
    }
  }
})

const createStore = opts => {
  const nodes = {}
  nodes.root = uuid()
  nodes[nodes.root] = {
    entries: [],
    leaf: true
  }

  return {
    M: opts.M || 9,
    m: Math.floor((opts.M || 9) / 2),
    root: () => nodes.root,
    nodes: () => nodes,

    key: uuid,
    put: (key, node) => nodes[key] = node,
    get: key => nodes[key]
  }
}


it.skip('shapefile/import', async function() {
  this.timeout(0)
  const store = createStore({ M: 50, nodes: {} })

  const read = () => new Promise((resolve, reject) => {
    // const basename = './data/ADR_PT' // records: 196,911
    const basename = './data/ne_110m_admin_0_countries' // records: 177
    const shapefile = `${basename}.shp`
    const projection = `${basename}.prj`

    const proj = proj4(fs.readFileSync(projection, 'utf8')).inverse

    fs.createReadStream(shapefile)
      .pipe(decode(feature(proj)))
      .pipe(load(store))
      .on('finish', resolve)
      .on('error', reject)
  })

  await read()
})
