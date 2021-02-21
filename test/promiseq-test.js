const assert = require('assert')
const { Writable } = require('stream')
const R = require('ramda')

const q = new Writable({
  objectMode: true,
  write ({ task, resolve, reject }, _, next) {
    task()
      .then(resolve)
      .catch(reject)
      .then(next)
  }
})

// enqueue :: () -> Promise -> Promise
const enqueue = task => {
  const write = (resolve, reject) => q.write({ task, resolve, reject })
  return new Promise(write)
}

const sleep = n => () => new Promise(resolve => {
  setTimeout(() => resolve(n), Math.random() * 5)
})

it.skip('Promise/Q', async function () {
  const range = R.range(0, 16)
  const expected = R.map(R.identity, range)
  const enqueueSleep = R.compose(enqueue, sleep)
  const actual = await Promise.all(R.map(enqueueSleep, range))
  assert.deepEqual(actual, expected)
})
