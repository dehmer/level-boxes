const Rectangle = require('./rectangle')


/**
 *
 */
const choosePath = (entries, box) => {

  // CL3 [Choose subtree]
  //     If N is not a leaf, let F be the entry in N whose
  //     rectangle F I needs least enlargement to include E I.
  //     Resolve ties by choosing the entry with rectangle of
  //     smallest area.

  const length = entries.length
  var index = -1
  var minEnlargement = Infinity
  var minArea = Infinity

  for(let i = 0; i < length; i++) {
    const entry = entries[i]
    const area = Rectangle.area(entry.box)
    const enlargement = Rectangle.area(Rectangle.merge([entry.box, box])) - area
    if (enlargement > minEnlargement) continue

    if (enlargement < minEnlargement) {
      index = i
      minArea = area
      minEnlargement = enlargement
      continue
    }

    if (area < minArea) {
      index = i
      minArea = area
    }
  }

  return index
}


module.exports = choosePath