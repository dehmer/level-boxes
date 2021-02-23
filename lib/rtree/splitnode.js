const R = require('ramda')
const PickSeeds = require('./pickseeds')
const PickNext = require('./picknext')
const { enlargedArea, merge, area } = require('./rectangle')


/**
 * Algorithm SplitNode (abstract).
 *
 * In order to add a new entry to a full node containing M entries,
 * it is necessary to devide the collection of M+1 entries between
 * two nodes. The division should be done in a way that makes it as
 * unlikely as possible that both new nodes will need to be examined
 * on subsequent searches. Since, the decision whether to visit a node
 * depends on whether its covering rectangle overlaps the search area,
 * the total area of the two covering rectangles after the split should
 * be minimized.
 *
 * Algorithm QuadraticSplit - O(M^2).
 * Divide a set of M+1 entries into two groups.
 *
 * Algorithm LinearSplit - O(M).
 * NOTE: LinearSplit is identical to QuadraticSplit but uses a different
 * version of `PickSeeds`. `PickNext` simply chooses any of the remaining
 * entries.
 */
const SplitNode = store => node => {

  // QS1 [Pick first entry for each group]
  //     Apply Algorithm `PickSeeds` to choose two entries to be the
  //     first elements of the groups. Assign each to a group.

  const seeds = store.pickSeeds(node)
  const { entries } = node

  const groups = seeds.map((seed, i) => {
    const entry = entries[seed]
    const leaf = node.leaf || false
    return { box: entry.box, entries: [entry], leaf }
  })

  // QS2 [Check if done]
  //     If all entries have been assigned, stop.

  var remaining = entries.filter((_, i) => !seeds.includes(i))
  const underful = group => (store.m - group.entries.length) === remaining.length

  const assign = (entries, index) => groups[index] = ({
    box: merge([groups[index].box, ...entries.map(R.prop('box'))]),
    entries: groups[index].entries.concat(entries),
    leaf: groups[index].leaf
  })

  while(remaining.length) {

    //  If one group has so few entries that all the rest must
    //  be assigned to it in order for it to have a minimum number m,
    //  assign them and stop.

    const index = groups.findIndex(underful)
    if (index !== -1) {
      assign(remaining, index)
      remaining = []
      continue
    }

    const [group, next] = store.pickNext(groups, remaining)
    remaining = remaining.filter(entry => entry !== next)
    assign([next], group)
  }

  return groups
}

module.exports = SplitNode
