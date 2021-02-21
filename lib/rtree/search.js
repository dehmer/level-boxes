/**
 * Algorithm Search.
 *
 * Given an R-tree whose root node is T, find all index records whose
 * rectangles overlap a search rectangle S.
 */
const Search = opts => (T, S) => {

  // S1 [Seach subtrees]
  //    If T is not a leaf, check each entry E to determine whether E I
  //    overlaps S. For all overlapping entries, invoke `Search` on the
  //    tree whose root node is pointed to by E p.

  // S2 [Search leaf node]
  //    If T is a leaf, check all entries E to determine whether E I
  //    overlaps S. If so, E is a qualifying record.
}

module.exports = Search
