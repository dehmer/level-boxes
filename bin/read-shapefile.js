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

const dump = async db => new Promise((resolve, reject) => {
  const acc = []
  db.createReadStream({ keys: false })
    .on('data', data => {
      if (data.leaf) acc.push(data)
    })
    .on('error', reject)
    .on('end', () => resolve(acc))
})

const feature = proj => ({ recordNumber, shapeType, box, points }) => {
  return {
    id: recordNumber,
    // Project minimal bounding rectangle according projection:
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

const datasets = {
  'ADR_PT': {
    S: [[11.384, 47.262], [11.386, 47.265]],
    records: 196911,
    nodes: 6025, // leaf + non-leaf
    leafs: 5838,
    stats: {
      'insert:single:linear': {
        bytesWritten: 782473898, // 746 MB
        bytesRead: 2614820820, // 2.44 GB
        encoded: 405867,
        decoded: 929092,
        timeRead: '1:07.194 (m:ss.mmm)',
        timeSearch: '5.854ms'
      },
      'insert:bulk:linear': {
        bytesWritten: 36101082, // 34 MB (4.61%)
        bytesRead: 0,
        encoded: 202936,
        decoded: 0
      },
      'insert:bulk:1000:linear': {
        bytesWritten: 171908855, // 163 MB
        bytesRead: 135807773, // 129 MB
        encoded: 240000,
        decoded: 37064,
        timeRead: '9.827s',
        timeSearch: '6.695ms'
      }
    }
  },

  'ne_110m_admin_0_countries': {
    // cyprus
    S: [
      [32.73178022637745, 35.000344550103506],
      [34.576473829900465, 35.67159556735879]
    ],
    records: 177,
    stats: {
      'insert:single:linear': {
        bytesWritten: 585665, // 9.19 MB
        bytesRead: 622407, // 19.6 MB
        encoded: 365,
        decoded: 480
      },
      'insert:bulk:linear': {
        bytesWritten: 31728, // 5.4%
        bytesRead: 0,
        encoded: 184, // 38.3%
        decoded: 0
      }
    }
  },

  'tl_2020_us_county': {
    records: 3234,
    stats: {
      'insert:single:linear': {
        bytesWritten: 9633108, // 9.19 MB
        bytesRead: 20621931, // 19.6 MB
        encoded: 6670,
        decoded: 11170
      },
      'insert:bulk:linear': {
        bytesWritten: 442391, // 4.59%
        bytesRead: 0,
        encoded: 3337,
        decoded: 0
      }
    },
  }
}

;(async () => {
  const valueEncoding = encoding()
  const db = levelup(encode(memdown(), { valueEncoding }))
  // const db = levelup(encode(leveldown('./db/index'), { valueEncoding: 'json' }))

  const index = await rtree(db, { M: 50, split: 'L', batch: 1000 })
  const dataset = 'ADR_PT'

  const read = index => new Promise(async (resolve, reject) => {

    const basename = `./data/${dataset}`
    const shapefile = `${basename}.shp`
    const projection = `${basename}.prj`
    const proj = proj4(fs.readFileSync(projection, 'utf8')).inverse

    fs.createReadStream(shapefile)
      .pipe(decode(feature(proj)))
      .pipe(await index.bulk())
      // .pipe(load(index))
      .on('finish', resolve)
      .on('error', reject)
  })

  console.time('read')
  await read(index)
  console.timeEnd('read')
  console.log('stats', valueEncoding.stats())

  // const values = await dump(db)
  // console.log('values', JSON.stringify(values))

  const S = datasets[dataset].S

  if (S) {
    console.time('search')
    const hits = await search(index, S)
    console.log(hits)
    console.timeEnd('search')
  }

  const tuples = await dump(db)
  console.log(tuples.length)
})()

