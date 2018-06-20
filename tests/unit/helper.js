const crypto = require('crypto')
const _ = require('lodash')

const randomHex = (n) => crypto.randomBytes(2 * n).toString('hex')

export default {
  randomHex,
  randomAccountId: () => randomHex(5) + '@' + randomHex(5),
  randomAssetId: () => randomHex(5) + '#' + randomHex(5),
  randomNodeIp: () => 'localhost:' + _.random(0, 65535),
  randomPrivateKey: () => randomHex(64),
  randomObject: () => ({ [randomHex(5)]: randomHex(5) }),
  randomAmount: () => String(Math.random()).substr(0, _.random(5, 10))
}