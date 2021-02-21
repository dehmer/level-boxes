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
 */
const SplitNode = {}


/**
 * Algorithm ExhaustiveSplit - O(2^(M-1)).
 */
SplitNode['E'] = opts => node => {
}


/**
 * Algorithm QuadraticSplit - O(M^2).
 *
 * Divide a set of M+1 entries into two groups.
 */
SplitNode['Q'] = opts => node => {
}


/**
 * Algorithm LinearSplit.
 * Complexity O(M)
 *
 * NOTE: LinearSplit is identical to QuadraticSplit but uses a different
 * version of `PickSeeds`. `PickNext` simply chooses any of the remaining
 * entries.
 */
SplitNode['L'] = opts => node => {

  // QS1 [Pick first entry for each group]
  //     Apply Algorithm `PickSeeds` to choose two entries to be the
  //     first elements of the groups. Assign each to a group.

  const seeds = PickSeeds['L'](node)
  const { entries } = node

  const groups = seeds.map((seed, i) => {
    // Keep original key for first group, new keys for other groups.
    const key = i ? opts.key() : node.key
    const entry = entries[seed]
    const leaf = node.leaf || false
    const group = { key, box: entry.box, entries: [entry], leaf }
    return group
  })

  // QS2 [Check if done]
  //     If all entries have been assigned, stop.

  var remaining = entries.filter((_, i) => !seeds.includes(i))
  const underful = group => (opts.m - group.entries.length) === remaining.length

  const assign = (entries, index) => groups[index] = ({
    key: groups[index].key,
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

    // QS3 [Select entry to assign]
    //     Invoke Algorithm `PickNext` to choose the next entry to assign.
    //     Add it to the group whose covering rectangle will have to be
    //     enlarged least to accommodate it. Resolve ties by adding the
    //     entry to the group with smaller area, then to the one with
    //     fewer entries, then to either. Repeat from QS2.

    const next = remaining[0]

    const bestFit = (a, b) =>
      a.enlargement < b.enlargement ||
      a.area - b.area ||
      a.length - b.length

    // Next pick will be assigned to first candidate.
    const candidates = groups
      .map((group, idx) => ({
        idx,
        enlargement: enlargedArea(group.box)(next.box),
        area: area(group.box),
        length: group.entries.length
      }))

    assign([next], candidates.sort(bestFit)[0].idx)
    remaining = R.drop(1, remaining)
  }

  return groups
}


module.exports = SplitNode
