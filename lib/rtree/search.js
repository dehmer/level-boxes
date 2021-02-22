const { intersects } = require('./rectangle')

/**
 * Algorithm Search.
 *
 * Given an R-tree whose root node is T, find all index records whose
 * rectangles overlap a search rectangle S.
 */
const Search = store => async (key, box, writable) => {
  const search = Search(store)
  const node = await store.get(key)
  const length = node.entries.length

  // S1 [Seach subtrees]
  //    If T is not a leaf, check each entry E to determine whether E I
  //    overlaps S. For all overlapping entries, invoke `Search` on the
  //    tree whose root node is pointed to by E p.

  // S2 [Search leaf node]
  //    If T is a leaf, check all entries E to determine whether E I
  //    overlaps S. If so, E is a qualifying record.

  const visit = node.leaf
    ? entry => writable.write(entry.id)
    : async entry => await search(entry.key, box, writable)

  for(let i = 0; i < length; i++) {
    const entry = node.entries[i]
    if (!intersects(box, entry.box)) continue
    await visit(entry)
  }
}

module.exports = Search
