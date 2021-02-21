const { Writable } = require('stream')
const R = require('ramda')
const uuid = require('uuid-random')
const Rectangle = require('./rectangle')
const Insert = require('./insert')

const createStore = async (db, options) => {
  const q = new Writable({
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

  const enqueue = task => {
    const write = (resolve, reject) => q.write({ task, resolve, reject })
    return new Promise(write)
  }

  const insert = (id, box) => async () => {

    // Store box under the entries id for
    // delete without box.
    store.put(`box:${id}`, box)

    const key = await db.get('root')
    const node = await db.get(key)
    const nodes = await Insert(store)(node, { box, id })
    if (nodes.length === 1) return

    // Create grow a new root with both nodes as entries.
    const root = {
      key: uuid(),
      box: Rectangle.merge(nodes.map(R.prop('box'))),
      entries: nodes.map(({ key, box }) => ({ key, box })),
      leaf: false
    }

    store.put(root.key, root)
    store.put('root', root.key)
  }

  // TODO: store should event emitter and at least emit 'drain' event
  const store = {}
  store.M = (options && options.M) || 25,
  store.m = (options && options.m) || Math.floor(store.M / 2),
  store.get = key => db.get(key)
  store.put = (kv, v) => v
    ? q.batch.put(kv, v) // separate key/value pair
    : q.batch.put(kv.key, kv) // `kv` has key property

  store.insert = (id, box) => enqueue(insert(id, box))

  return store
}

module.exports = createStore
