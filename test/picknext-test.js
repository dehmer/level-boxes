const assert = require('assert')
const PickNext = require('../lib/rtree/picknext')

describe('PickNext/Quadratic', function () {

  it('find entry with greatest preference for one group', function () {
    const pickNext = PickNext.Q
    var remaining = [
      {box:[[0,0],[4,2]]},
      {box:[[2,-10],[3,-8]]},
      {box:[[20,21],[23,25]]}, // best pick -> group 0
      {box:[[3,4],[5,12]]},
      {box:[[-3,2],[3,8]]}
    ]

    const groups = [
      {box: [[19,21],[24,27]], entries: [{box:[[19,21],[24,27]]}]},
      {box: [[-1,-12],[4,-5]], entries: [{box:[[-1,-12],[4,-5]]}]}
    ]

    const [group, next] = pickNext(groups, remaining)
    assert.strictEqual(group, 0)
    assert.deepEqual(next, {box:[[20,21],[23,25]]})
  })
})
