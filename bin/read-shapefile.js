#!/usr/bin/env node
const fs = require('fs')
const { Writable } = require('stream')
const proj4 = require('proj4')
const levelup = require('levelup')
const memdown = require('memdown')
const encode = require('encoding-down')
const { decode } = require('../lib/shapefile/shapefile')
const rtree = require('../lib/rtree')

const feature = proj => ({ recordNumber, shapeType, box, points }) => {
  // Project minimal bounding rectangle according projection:
  return {
    id: recordNumber,
    box: [[box.xmin, box.ymin], [box.xmax, box.ymax]].map(proj)
  }
}

const load = index => new Writable({
  objectMode: true,
  async write ({ id, box }, _, next) {
    await index.insert(box, id)
    next()
  }
})

;(async () => {
  const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
  const index = await rtree(db, { M: 9, split: 'L' })

  const read = index => new Promise((resolve, reject) => {
    const basename = './data/ADR_PT'
    const shapefile = `${basename}.shp`
    const projection = `${basename}.prj`
    const proj = proj4(fs.readFileSync(projection, 'utf8')).inverse

    fs.createReadStream(shapefile)
      .pipe(decode(feature(proj)))
      .pipe(load(index))
      .on('finish', resolve)
      .on('error', reject)
  })

  // read: 857.746ms - no persitence
  // read:   1.124s  - batch/chained/1000/custom (p, mbr)
  // read:   1.179s  - batch/array/1000/json (p, mbr)
  // read:   1.235s  - batch/chained/1000/json (p, mbr)
  // read:   2.386s  - put: memdown/json (p, mbr)

  console.time('read')
  await read(index)
  console.timeEnd('read')
})()

