const R = require('ramda')

const PickNext = {}


/**
 * Algorithm PickNext (Quadratic).
 *
 * Select one remaining entry for classification in a group.
 */
PickNext['Q'] = opts => entries => {

  // PN1 [Determine cost of putting each entry in each group]
  //     For each entry E not yet in a group, calculate
  //     d1 = the area increase required in the covering rectangle
  //     of Group 1 to include E I. Calculate d2 similarly for Group 2.

  // PN2 [Find entry with greatest preference for one group]
  //     Choose any entry with the maximum difference between d1 and d2.
}


module.exports = PickNext
