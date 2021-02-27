const { Writable, PassThrough } = require('stream')
const uuid = require('uuid-random')
const memdb = require('./memdb')
const PickSeeds = require('./pickseeds')
const PickNext = require('./picknext')
const Insert = require('./insert')
const Search = require('./search')


/**
 *
 */
const taskQ = db => new Writable({
  objectMode: true,
  async write ({ task, resolve, reject }, _, next) {
    try {
      resolve(await task())
    } catch(err) {
      reject(err)
    }
    next()
  }
})


/**
 *
 */
const rtree = async (db, options = { M: 50, batch: 5000 }) => {
  const q = taskQ(db)
  q.enqueue = task => {
    return new Promise((resolve, reject) => q.write({ task, resolve, reject }))
  }

  options.M = (options && options.M) || 50,
  options.m = (options && options.m) || Math.floor(options.M / 2),
  options.pickSeeds = PickSeeds[options.split] || PickSeeds['L']
  options.pickNext = PickNext[options.split] || PickNext['L']

  const key = uuid

  const root = async (db) => {
    try {
      return await db.get('root')
    } catch(ignore) {
      const key_ = key()
      await db.put(key_, { entries: [], leaf: true })
      await db.put('root', key_)
      return root(db)
    }
  }

  const insert = db => (box, id) => async () => {
    const batch = db.batch()
    const store = { ...options, get: db.get.bind(db), put: db.put.bind(db), key }
    const nodes = await Insert(store)(await root(db), { box, id })

    if (nodes.length > 1) {

      // Create grow a new root with both nodes as entries.
      const node = {
        entries: nodes.map(({ key, box }) => ({ key, box })),
        leaf: false
      }

      const key_ = key()
      await db.put(key_, node)
      await db.put('root', key_)
    }

    await batch.write()
  }

  const bulk = async () => {
    const flush = async cache => {
      if (!cache) return
      const ops = Object.entries(cache.kv).map(([key, value]) => ({ type: 'put', key, value }))
      db.batch(ops)
    }

    const writable = new Writable({
      objectMode: true,
      async write ({ box, id }, _, next) {
        this.cache = this.cache || memdb(db)
        this.count = this.count || 0
        await insert(this.cache)(box, id)()
        this.count += 1

        if (this.count === (options.batch || 5000)) {
          await flush(this.cache)
          this.cache = null
          this.count = 0
          next()
        } else next()
      },
      async final (next) {
        await flush(this.cache)
        next()
      }
    })

    return writable
  }

  const search = async box => {
    const get = key => db.get(key)
    const store = { get }
    const writable = new PassThrough({ objectMode: true })
    const root_ = await root(db)
    Search(store)(root_, box, writable).then(() => writable.end())
    return writable
  }

  // TODO: should event emitter and at least emit 'drain' event
  return {
    search,
    insert: (box, id) => q.enqueue(insert(db)(box, id)),
    bulk
  }
}

module.exports = rtree
