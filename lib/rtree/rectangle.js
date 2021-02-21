const R = require('ramda')


/**
 *
 */
const area = a => R.range(0, 2)
  .map(i => a[1][i] - a[0][i])
  .reduce((acc, d) => acc * d, 1)


/**
 *
 */
const enlargedArea = a => b => R.range(0, 2)
  .map(i => Math.max(a[1][i], b[1][i]) - Math.min(a[0][i], b[0][i]))
  .reduce((acc, d) => acc * d, 1)


/**
 *
 */
const merge = xs => xs.reduce((a, b) => {
  if (!a) return b
  else return [
    [Math.min(a[0][0], b[0][0]), Math.min(a[0][1], b[0][1])],
    [Math.max(a[1][0], b[1][0]), Math.max(a[1][1], b[1][1])]
  ]
})


/**
 *
 */
const intersects = (a, b) => {
  // a.max < b.min || b.max < a.min
  if (a[1][0] < b[0][0] || b[1][0] < a[0][0]) return false
  if (a[1][1] < b[0][1] || b[1][1] < a[0][1]) return false
  return true
}


/**
 *
 */
const extent = box =>
  R.range(0, 2).map(d => Math.abs(box[1][d] - box[0][d]))


module.exports = {
  area,
  enlargedArea,
  merge,
  extent,
  intersects
}