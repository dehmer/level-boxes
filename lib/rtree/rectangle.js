

/**
 *
 */
const area = a =>
  (a[1][0] - a[0][0]) * (a[1][1] - a[0][1])


/**
 *
 */
const enlargedArea = a => b =>
  (Math.max(a[1][0], b[1][0]) - Math.min(a[0][0], b[0][0])) *
  (Math.max(a[1][1], b[1][1]) - Math.min(a[0][1], b[0][1]))


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
const extent = box => [
  Math.abs(box[1][0] - box[0][0]),
  Math.abs(box[1][1] - box[0][1])
]

module.exports = {
  area,
  enlargedArea,
  merge,
  extent,
  intersects
}