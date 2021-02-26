const cache = db => {
  const kv = {}
  return {
    kv,
    put: (key, value) => kv[key] = value,
    get: async key => {
      const value = kv[key]
      if (!value) kv[key] = await db.get(key)
      return kv[key]
    }
  }
}

const memdb = db => {
  const L1C = cache(db)
  return {
    ...L1C,
    batch: () => {
      const L2C = cache()
      return {
        ...L2C,
        write: () => Object.entries(L2C.kv).forEach(([key, value]) => L1C.put(key, value))
      }
    }
  }
}

module.exports = memdb
