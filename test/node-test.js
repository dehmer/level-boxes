const { strictEqual } = require('assert')
const uuid = require('uuid-random')
const R = require('ramda')
const assert = require('assert')

/*
  node/flags
    0x01 - leaf

  node
    flags       - 1 byte
    num entries - 1 byte
    entries     - num entries x 48 bytes

  entry         - 48 bytes
    box         - 4 x 8 bytes
    id          - 16 bytes
*/

const FLAG_LEAF = 0x01
const OFFSET_FLAGS = 0
const OFFSET_NUM_ENTRIES = 1
const OFFSET_ENTRIES = 2

const LEN_BOX   = 4 * 8
const LEN_ID    = 16
const LEN_ENTRY = LEN_BOX + LEN_ID

const OFFSET_XMIN =  0
const OFFSET_YMIN =  8
const OFFSET_XMAX = 16
const OFFSET_YMAX = 24
const OFFSET_ID   = 32

const lenNode = n => 2 + n * LEN_ENTRY

const allocNode = n => leaf => {
  const buf = Buffer.allocUnsafe(lenNode(n))
  buf.writeUInt8(leaf ? FLAG_LEAF : 0x00, OFFSET_FLAGS)
  buf.writeUInt8(0, OFFSET_NUM_ENTRIES)
  return buf
}

const allocEntry = () => Buffer.allocUnsafe(LEN_ENTRY)

const encodeId = (target, targetStart = 0) => id => {
  Buffer.from(id.replace(/-/g, ''), 'hex').copy(target, targetStart)
}

const encodeBox = (target, start = 0) => box => {
  target.writeDoubleLE(box[0][0], start + OFFSET_XMIN)
  target.writeDoubleLE(box[0][1], start + OFFSET_YMIN)
  target.writeDoubleLE(box[1][0], start + OFFSET_XMAX)
  target.writeDoubleLE(box[1][1], start + OFFSET_YMAX)
}

const encodeEntry = (target, targetStart = 0) => (entry, index = 0) => {
  const offset = targetStart + index * LEN_ENTRY
  encodeBox(target, offset)(entry.box)
  encodeId(target, offset + OFFSET_ID)(entry.id)
  return target
}

const encodeEntries = buf => entries => {
  buf.writeUInt8(entries.length, OFFSET_NUM_ENTRIES)
  const write = encodeEntry(buf, OFFSET_ENTRIES)
  entries.forEach(write)
}

const numEntries = node => node.readUInt8(OFFSET_NUM_ENTRIES)
const offsetEntry = i => 2 + i * 48

const insert = n => (node, entry) => {
  const num = numEntries(node) + 1
  if (num > n) throw new Error('overflow')
  const copied = entry.copy(node, offsetEntry(num))
  return node
}

const isLeaf = node => (node.readUInt8(OFFSET_FLAGS) & FLAG_LEAF) === FLAG_LEAF

describe('Entry', function () {
  it('allocEntry', function () {
    const buf = allocEntry()
    assert.strictEqual(buf.length, LEN_ENTRY)
  })

  it('writeEntry', function () {
    const buf = allocEntry()
    const box = [[10, 15], [20, 25]]
    const id = uuid()
    encodeEntry(buf)(box, id)
    console.log(id)
    assert.strictEqual(buf.length, LEN_ENTRY)
    console.log('buf', buf)
  })
})

describe('Node', function () {
  const n = 50

  it('allocNode/leaf', function () {
    const leaf = true
    const buf = allocNode(n)(leaf)
    assert.strictEqual(buf.length, lenNode(n))
    assert.strictEqual(isLeaf(buf), leaf)
    assert.strictEqual(numEntries(buf), 0)
  })

  it('allocNode/non-leaf', function () {
    const leaf = false
    const buf = allocNode(n)(leaf)
    assert.strictEqual(buf.length, lenNode(n))
    assert.strictEqual(isLeaf(buf), leaf)
    assert.strictEqual(numEntries(buf), 0)
  })

  it.only('writeEntries', function () {
    const leaf = true
    const buf = allocNode(n)(leaf)

    const entries = R.range(0, n).map(index => ({
      box: [[10 + index, 15 + index], [20 + index, 25 + index]],
      id: uuid()
    }))

    encodeEntries(buf)(entries)
    console.log(buf)
  })
})