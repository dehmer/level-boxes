const assert = require('assert')
const PickSeeds = require('../lib/rtree/pickseeds')


describe('PickSeeds/Quadratic', function () {

  it('picks most wasteful pair', function () {
    const pickSeeds = PickSeeds.Q
    const entries = [
      {"box":[[8,8],[9,9]] },
      {"box":[[4,4],[5,5]] },
      {"box":[[3,4],[5,12]] },
      {"box":[[-3,2],[3,8]] },
      {"box":[[-1,-12],[4,-5]] }
    ]

    const seeds = pickSeeds({ entries })
    assert.deepEqual(seeds, [ 0, 4 ])
  })
})