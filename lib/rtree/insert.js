const R = require('ramda')
const SplitNode = require('./splitnode')
const Rectangle = require('./rectangle')

const Update = store => target => {
  if (target.entries.length < store.M) {
    store.put(target)
    return [target]
  } else {
    const splitNode = SplitNode[store.split || 'L'](store)
    const groups = splitNode(target)

    // Update this node with entries from L, store new node LL and
    // pass both to parent for further processing.

    groups.forEach(group => store.put(group))
    return groups
  }
}

const chooseSubtree = (entries, box) => {

  // CL3 [Choose subtree]
  //     If N is not a leaf, let F be the entry in N whose
  //     rectangle F I needs least enlargement to include E I.
  //     Resolve ties by choosing the entry with rectangle of
  //     smallest area.

  // Order by enlargement first and by area to resolve ties.
  const order = (a, b) => a[1] - b[1] || a[0][1] - b[0][1]

  const enlargedArea = Rectangle.enlargedArea(box)
  const areas = entries.map(({ box }, i) => [i, Rectangle.area(box)]) // maintain entry index
  const enlargements = entries.map(({ box }, i) => enlargedArea(box) - areas[i][1])

  // best :: [[entry index, area], enlargement]
  const [best] = R.zip(areas, enlargements).sort(order)
  return entries[best[0][0]].key
}

/**
 * Algorithm Insert.
 *
 * Insert a new index entry.
 */
const Insert = store => async (node, entry) => {
  const update = Update(store)

  if (node.leaf) {

    // I2 [Add record to leaf node]
    //    If L has room for another entry, install E. Otherwise invoke
    //    `SplitNode` to obtain L and LL containing E and all the old
    //    entries of L.

    return update({
      key: node.key,
      box: Rectangle.merge([node.box, entry.box]),
      entries: node.entries.concat(entry),
      leaf: true
    })
  } else {

    // I1 [Find position for new record]
    //    Invoke `ChooseLeaf` to select a leaf node L in which to place E.

    const F = await store.get(chooseSubtree(node.entries, entry.box))

    // CL4 [Descent until a leaf is reached]
    //     Set N to be the child node pointed to by F p and
    //     repeat from CL2.

    const nodes = await Insert(store)(F, entry)
    if (nodes.length === 1) return nodes
    else return update({
      key: node.key,
      box: Rectangle.merge(nodes.map(R.prop('box'))),
      entries: node.entries.concat(nodes[1]),
      leaf: false
    })
  }
}

module.exports = Insert