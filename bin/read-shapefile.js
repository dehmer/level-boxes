#!/usr/bin/env node
const fs = require('fs')
const { Writable } = require('stream')
const proj4 = require('proj4')
const levelup = require('levelup')
const memdown = require('memdown')
const leveldown = require('leveldown')
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

const search = (index, box) => new Promise(async (resolve, reject) => {
  const acc = []
  const readStream = await index.search(box)
  readStream
    .on('data', data => acc.push(data))
    .on('end', () => resolve(acc))
    .on('error', reject)
})

const encoding = () => {
  var bytesWritten = 0
  var bytesRead = 0
  var encoded = 0
  var decoded = 0

  return {
    type: 'rtree-value',
    buffer: true,
    encode: value => {
      const buffer = Buffer.from(JSON.stringify(value))
      bytesWritten += buffer.length
      encoded += 1
      return buffer
    },
    decode: buffer => {
      bytesRead += buffer.length
      decoded += 1
      return JSON.parse(buffer.toString())
    },
    stats: () => ({ bytesWritten, bytesRead, encoded, decoded })
  }
}

;(async () => {
  const valueEncoding = encoding()
  // const db = levelup(encode(memdown(), { valueEncoding }))
  const db = levelup(encode(leveldown('./db/index'), { valueEncoding }))
  const index = await rtree(db, { M: 50, split: 'L' })

  const read = index => new Promise((resolve, reject) => {
    // const basename = './data/ADR_PT'
    const basename = './data/ne_110m_admin_0_countries'
    const shapefile = `${basename}.shp`
    const projection = `${basename}.prj`
    const proj = proj4(fs.readFileSync(projection, 'utf8')).inverse

    fs.createReadStream(shapefile)
      .pipe(decode(feature(proj)))
      .pipe(load(index))
      .on('finish', resolve)
      .on('error', reject)
  })

  console.time('read')
  await read(index)
  console.timeEnd('read')
  console.log('stats', valueEncoding.stats())

  // stats - ADR_PT/LINEAR
  // bytesWritten:   782473898
  // bytesRead:     2614820820
  // encoded:           405867
  // decoded:           929092

  // stats - ADR_PT/QUADRATIC
  // bytesWritten:   780525072
  // bytesRead:     2629268132
  // encoded:           405567
  // decoded:           920857

  const cyprus = [
    [32.73178022637745, 35.000344550103506],
    [34.576473829900465, 35.67159556735879]
  ]

  const address = [
    [11.384, 47.262],
    [11.386, 47.265]
  ]

  console.time('search')
  const hits = await search(index, address)
  /*
    [
       27508, 182440, 180387,
      180731, 179729, 195505,
      182867, 189694, 189946,
      191827, 193752, 145533
    ]
  */
  console.log(hits)
  console.timeEnd('search')
})()

