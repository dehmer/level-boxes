const R = require ('ramda')
const Rectangle = require('./rectangle')

const LO = 0
const HI = 1

const PickSeeds = {}


/**
 * Algorithm PickSeeds (Quadratic).
 *
 * Select two entries to be the first elements of a group.
 */
PickSeeds['Q'] = ({ box, entries }) => {

  // PS1 [Calculate inefficiency of grouping entries together]
  //     For each pair of entries E1 and E2, compose a rectangle
  //     J including E1 I and E2 I.
  //     Calculate d = area(J) - area(E1 I) - area(E2 I)

  // PS2 [Choose the most wasteful pair]
  //     Choose the pair with largest d.
}


/**
 * Algorithm PickSeeds (Linear).
 *
 * Select two entries to be the first elements of the groups.
 */
PickSeeds['L'] = ({ box, entries }) => {

  // LPS1 [Find extreme rectangles along all dimensions]
  //      Along each dimension, find the entry whose rectangle has the
  //      highest low side, and the one with the lowest high side.
  //      Records the separation.

  const separation = R.range(0, 2).map(d =>
    entries.reduce((acc, entry, idx) => {
      if (entry.box[LO][d] > entries[acc[LO]].box[LO][d]) acc[LO] = idx
      else if (entry.box[HI][d] < entries[acc[HI]].box[HI][d]) acc[HI] = idx
      return acc
    }, [0, entries.length - 1])
  )

  // LPS2 [Adjust for shape of the rectangle cluster]
  //      Normalize the separations by dividing by the width of the entire
  //      set along the corresponding dimension.

  const extent = Rectangle.extent(box)
  const normalizedSeparation = separation
    .map(([a, b]) => [entries[a].box, entries[b].box])
    .map(([abox, bbox], d) => Math.abs(abox[LO][d] - bbox[HI][d]) / extent[d])

  // LPS3 [Select the most extreme pair]
  //      Choose the pair with the greatest normalized separation along
  //      any dimension.

  // Seed indexes to original node entries.
  return R.zip(normalizedSeparation, separation)
    .sort((a, b) => b[0] - a[0])
    .map(R.prop(1))[0]
}


module.exports = PickSeeds
