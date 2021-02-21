const R = require('ramda')
const Rectangle = require('./rectangle')

// Order by enlargement first and by area to resolve ties.
const INDEX = 0
const AREA = 1
const ENLARGEMENT = 2
const order = (a, b) =>
  a[ENLARGEMENT] - b[ENLARGEMENT] ||
  a[AREA] - b[AREA]

/**
 *
 */
const choosePath = (entries, box) => {

  // CL3 [Choose subtree]
  //     If N is not a leaf, let F be the entry in N whose
  //     rectangle F I needs least enlargement to include E I.
  //     Resolve ties by choosing the entry with rectangle of
  //     smallest area.

  const enlargedArea = Rectangle.enlargedArea(box)
  const [best] = entries.map(({ box }, i) => {
    const area = Rectangle.area(box)
    const enlargement = enlargedArea(box) - area
    return [i, Rectangle.area(box), enlargement, area]
  }).sort(order)

  return best[INDEX]
}


module.exports = choosePath