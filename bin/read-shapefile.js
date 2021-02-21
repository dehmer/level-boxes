#!/usr/bin/env node
const fs = require('fs')
const { Writable } = require('stream')
const proj4 = require('proj4')
const levelup = require('levelup')
const memdown = require('memdown')
const encode = require('encoding-down')
const { decode } = require('../lib/shapefile/shapefile')

// M
// m = M / 2
// number (entries) = 1 byte
// I = (xmin, ymin, xmax, ymax) - 4 * 8 bytes => (M + 1) * 32 bytes
// uuid = 36 bytes (ascii) => M * 36 bytes
// flags = 1 byte - leaf, underfull => M * 1 bytes

// M:        50    25
// I:      1632   832
// uuid:   1800   900
// flags:     1     1
// total:  3433  1733

const feature = proj => ({ recordNumber, shapeType, box, points }) => {
  // Project minimal bounding rectangle according projection:
  const mbr = [[box.xmin, box.ymin], [box.xmax, box.ymax]].map(proj)
  return { p: recordNumber, mbr }
}

const load = store => new Writable({
  objectMode: true,
  async write ({ p, mbr }, _, next) {
    this.batch = this.batch || store.batch()
    this.batch.put(p, mbr)

    if (this.batch.length === 500) {
      await this.batch.write()
      delete this.batch
      next()
    } else next()
  },
  async final (next) {
    await this.batch.write()
    delete this.batch
    next()
  }
})

;(async () => {
  const valueEncoding = {
    type: 'rtee-node',
    encode: data => {
      const buffer = Buffer.allocUnsafe(32)
      buffer.writeDoubleLE(data[0][0],  0)
      buffer.writeDoubleLE(data[0][1],  8)
      buffer.writeDoubleLE(data[1][0], 16)
      buffer.writeDoubleLE(data[1][1], 24)
      return buffer
    },
    decode: buffer => {
      return [
        [buffer.readDoubleLE( 0), buffer.readDoubleLE( 8)],
        [buffer.readDoubleLE(16), buffer.readDoubleLE(24)]
      ]
    },
    buffer: true
  }

  // const store = levelup(encode(memdown(), { valueEncoding: 'json' }))
  const store = levelup(encode(memdown(), { valueEncoding }))

  const read = () => new Promise((resolve, reject) => {
    const basename = './data/ADR_PT'
    const shapefile = `${basename}.shp`
    const projection = `${basename}.prj`

    const proj = proj4(fs.readFileSync(projection, 'utf8')).inverse

    fs.createReadStream(shapefile)
      .pipe(decode(feature(proj)))
      .pipe(load(store))
      .on('finish', resolve)
      .on('error', reject)
  })

  // read: 857.746ms - no persitence
  // read:   1.124s  - batch/chained/1000/custom (p, mbr)
  // read:   1.179s  - batch/array/1000/json (p, mbr)
  // read:   1.235s  - batch/chained/1000/json (p, mbr)
  // read:   2.386s  - put: memdown/json (p, mbr)

  console.time('read')
  await read()
  console.timeEnd('read')
})()

