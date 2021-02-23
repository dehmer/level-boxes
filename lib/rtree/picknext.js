const R = require('ramda')
const Rectangle = require('./rectangle')

const PickNext = {}


/**
 * Algorithm PickNext (Quadratic).
 *
 * Select one remaining entry for classification in a group.
 */
PickNext['Q'] = (groups, entries) => {

  // PN1 [Determine cost of putting each entry in each group]
  //     For each entry E not yet in a group, calculate
  //     d1 = the area increase required in the covering rectangle
  //     of Group 1 to include E I. Calculate d2 similarly for Group 2.

  // PN2 [Find entry with greatest preference for one group]
  //     Choose any entry with the maximum difference between d1 and d2.

  const areas = groups.map(group => Rectangle.area(group.box))

  const differences = entries.map(entry => {
    const [d1, d2] = groups.map((group, i) => {
      const J = Rectangle.merge([entry.box, group.box])
      const d = Rectangle.area(J) - areas[i]
      return d
    })

    // We also return enlargements per group
    // to immediately select target group.
    return [Math.abs(d1 - d2), d1, d2]
  })

  var dmax = -Infinity
  var index = -1
  for (let i = 0; i < differences.length; i++) {
    if(differences[i][0] <= dmax) continue
    dmax = differences[i][0]
    index = i
  }

  const next = entries[index]
  const group = differences[index][1] < differences[index][2] ? 0 : 1
  return [group, next]
}



/**
 * Algorithm PickNext (Linear).
 *
 * This algorithm is linear in M and in the number of dimensions.
 * Linear Split is identical to Quadratic Split but uses a different
 * version of `PickSeeds`. `PickNext` simply chooses any of the
 * remaining entries.
 */
PickNext['L'] = (groups, entries) => {

  const next = entries[0]

  // QS3 [Select entry to assign]
  //     Invoke Algorithm `PickNext` to choose the next entry to assign.
  //     Add it to the group whose covering rectangle will have to be
  //     enlarged least to accommodate it. Resolve ties by adding the
  //     entry to the group with smaller area, then to the one with
  //     fewer entries, then to either. Repeat from QS2.

  // FIXME: not the most efficient way to do business

  const bestFit = (a, b) =>
    a.enlargement - b.enlargement ||
    a.area - b.area ||
    a.length - b.length

  // Next pick will be assigned to first candidate.
  const candidates = groups
    .map((group, i) => ({
      index: i,
      enlargement: Rectangle.enlargedArea(group.box)(next.box),
      area: Rectangle.area(group.box),
      length: group.entries.length
    }))

  return [candidates.sort(bestFit)[0].index, next]
}


module.exports = PickNext
