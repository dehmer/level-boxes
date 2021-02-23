const { Writable, PassThrough } = require('stream')
const uuid = require('uuid-random')
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
    this.batch = this.batch || db.batch()

    try {
      const result = await task()
      await this.batch.write()
      resolve(result)
    } catch(err) {
      reject(err)
    }

    this.batch = db.batch()
    next()
  }
})


/**
 *
 */
const rtree = async (db, options = { M: 50 }) => {
  const q = taskQ(db)
  q.enqueue = task => {
    return new Promise((resolve, reject) => q.write({ task, resolve, reject }))
  }

  const store = {}
  store.M = (options && options.M) || 50,
  store.m = (options && options.m) || Math.floor(store.M / 2),
  store.pickSeeds = PickSeeds[options.split] || PickSeeds['L']
  store.pickNext = PickNext[options.split] || PickNext['L']
  store.key = uuid
  store.get = key => db.get(key)
  store.put = (key, value) => q.batch.put(key, value)

  store.root = async () => {
    try {
      return await db.get('root')
    } catch(ignore) {
      const key = store.key()
      await db.put(key, { entries: [], leaf: true })
      await db.put('root', key)
      return store.root()
    }
  }

  const insert = (box, id) => async () => {

    // Store box under the entries id for deleting without box.
    store.put(`box:${id}`, box)

    const root = await store.root()
    const nodes = await Insert(store)(root, { box, id })
    if (nodes.length === 1) return

    // Create grow a new root with both nodes as entries.
    const key = store.key()
    const node = {
      entries: nodes.map(({ key, box }) => ({ key, box })),
      leaf: false
    }

    store.put(key, node)
    store.put('root', key)
  }

  const search = async box => {
    const writable = new PassThrough({ objectMode: true })
    const root = await store.root()
    Search(store)(root, box, writable).then(() => writable.end())
    return writable
  }

  // TODO: should event emitter and at least emit 'drain' event
  return {
    search,
    insert: (box, id) => q.enqueue(insert(box, id))
  }
}

module.exports = rtree
