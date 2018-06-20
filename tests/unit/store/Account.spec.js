import chai from 'chai'
import sinon from 'sinon'
import AccountInjector from 'inject-loader!../../../src/store/Account.js'
import helper from '../helper'

const {
  randomHex,
  randomAccountId,
  randomAssetId,
  randomNodeIp,
  randomPrivateKey,
  randomObject,
  randomAmount
} = helper
const expect = chai.expect

chai.use(require('chai-things'))

describe('Account store', () => {
  /*
   * Mock irohaUtil so that unit tests can work without irohad
   */
  const MOCK_ASSETS = require('../fixtures/assets.json')
  const MOCK_ASSET_TRANSACTIONS = require('../fixtures/transactions.json')
  const MOCK_TRANSACTIONS = MOCK_ASSET_TRANSACTIONS['bitcoin#test']
  const MOCK_NODE_IP = 'MOCK_NODE_IP'
  const MOCK_ACCOUNT_RESPONSE = { accountId: randomAccountId() }
  const irohaUtil = require('../../../src/util/iroha-util')
  const irohaUtilMock = Object.assign(irohaUtil, {
    getStoredNodeIp: () => MOCK_NODE_IP,
    login: (username, privateKey, nodeIp) => Promise.resolve(MOCK_ACCOUNT_RESPONSE),
    logout: () => Promise.resolve(),
    getAccountAssetTransactions: () => Promise.resolve(MOCK_TRANSACTIONS),

    // TODO: fix it after irohaUtil.getAccountAssets is updated
    getAccountAssets: (accountId, assetId) => {
      return Promise.resolve(MOCK_ASSETS.find(a => a.accountAsset.assetId === assetId))
    },

    transferAsset: () => Promise.resolve()
  })

  let types, mutations, actions, getters

  beforeEach(() => {
    ({ types, mutations, actions, getters } = AccountInjector({
      'util/iroha-util': irohaUtilMock,
      'util/iroha-amount': require('../../../src/util/iroha-amount')
    }).default)
  })

  describe('Mutations', () => {
    function testErrorHandling (type) {
      const codes = ['UNAVAILABLE', 'CANCELLED']

      codes.forEach(codeName => {
        it(`${type} should treat grpc ${codeName} as a connection error`, () => {
          const grpc = require('grpc')
          const state = {}
          const error = { code: grpc.status[codeName] }

          expect(state.connectionError).to.not.exist

          mutations[types[type]](state, error)

          expect(state.connectionError).to.equal(error)
        })
      })

      it(`${type} should not treat other errors as a connection error`, () => {
        const state = {}
        const error = new Error()

        expect(state.connectionError).to.not.exist

        mutations[types[type]](state, error)

        expect(state.connectionError).to.not.exist
      })
    }

    it('RESET should reset the state', () => {
      const state = {
        accountId: randomAccountId(),
        nodeIp: randomNodeIp(),
        accountInfo: randomObject(),
        rawAssetTransactions: randomObject(),
        assets: randomObject(),
        connectionError: new Error()
      }
      const expectedState = {
        accountId: '',
        nodeIp: MOCK_NODE_IP,
        accountInfo: {},
        rawAssetTransactions: {},
        assets: [],
        connectionError: null
      }

      mutations[types.RESET](state)

      expect(state).to.be.deep.equal(expectedState)
    })

    it('LOGIN_SUCCESS should set an accountId to state', () => {
      const state = {}
      const account = { accountId: randomAccountId() }

      mutations[types.LOGIN_SUCCESS](state, account)

      expect(state.accountId).to.equal(account.accountId)
    })

    testErrorHandling('LOGIN_FAILURE')
    testErrorHandling('LOGOUT_FAILURE')

    it('GET_ACCOUNT_ASSET_TRANSACTIONS_SUCCESS should set transactions to state', () => {
      const state = { rawAssetTransactions: {} }
      const assetId = randomAssetId()
      const transactions = MOCK_TRANSACTIONS

      mutations[types.GET_ACCOUNT_ASSET_TRANSACTIONS_SUCCESS](state, { assetId, transactions })

      expect(state.rawAssetTransactions)
        .to.have.property(assetId)
        .that.is.deep.equal(transactions)
    })

    testErrorHandling('GET_ACCOUNT_ASSET_TRANSACTIONS_FAILURE')

    it('GET_ACCOUNT_ASSETS_SUCCESS should set assets to state', () => {
      const state = {}
      const assets = MOCK_ASSETS

      mutations[types.GET_ACCOUNT_ASSETS_SUCCESS](state, assets)

      expect(state.assets).to.deep.equal(assets)
    })

    testErrorHandling('GET_ACCOUNT_ASSETS_FAILURE')
    testErrorHandling('TRANSFER_ASSET_FAILURE')
  })

  describe('Actions', () => {
    describe('login', () => {
      it('should call mutations in correct order', done => {
        const commit = sinon.spy()
        const params = {
          username: randomAccountId(),
          privateKey: randomPrivateKey(),
          nodeIp: randomNodeIp()
        }

        actions.login({ commit }, params)
          .then(() => {
            expect(commit.args).to.deep.equal([
              [types.LOGIN_REQUEST],
              [types.LOGIN_SUCCESS, MOCK_ACCOUNT_RESPONSE]
            ])
            done()
          })
          .catch(done)
      })
    })

    describe('logout', () => {
      it('should call mutations in correct order', done => {
        const commit = sinon.spy()

        actions.logout({ commit })
          .then(() => {
            expect(commit.args).to.deep.equal([
              [types.LOGOUT_REQUEST],
              [types.RESET],
              [types.LOGOUT_SUCCESS]
            ])
            done()
          })
          .catch(done)
      })
    })

    describe('getAccountAssetTransactions', () => {
      it('should call mutations in correct order', done => {
        const commit = sinon.spy()
        const state = { accountId: randomAccountId() }
        const params = { assetId: randomAssetId() }
        const expectedResponse = {
          assetId: params.assetId,
          transactions: MOCK_TRANSACTIONS
        }

        actions.getAccountAssetTransactions({ commit, state }, params)
          .then(() => {
            expect(commit.args).to.deep.equal([
              [types.GET_ACCOUNT_ASSET_TRANSACTIONS_REQUEST],
              [types.GET_ACCOUNT_ASSET_TRANSACTIONS_SUCCESS, expectedResponse]
            ])
            done()
          })
          .catch(done)
      })
    })

    // TODO: fix it after irohaUtil.getAccountAssets is updated
    describe('getAccountAssets', () => {
      it('should call mutations in correct order', done => {
        const commit = sinon.spy()
        const state = { accountId: randomAccountId() }
        const expectedResponse = MOCK_ASSETS

        actions.getAccountAssets({ commit, state })
          .then(() => {
            expect(commit.args).to.deep.equal([
              [types.GET_ACCOUNT_ASSETS_REQUEST],
              [types.GET_ACCOUNT_ASSETS_SUCCESS, expectedResponse]
            ])
            done()
          })
          .catch(done)
      })
    })

    describe('transferAsset', () => {
      it('should call mutations in correct order', done => {
        const commit = sinon.spy()
        const state = { accountId: randomAccountId() }
        const params = {
          assetId: randomAssetId(),
          to: randomAccountId(),
          description: randomHex(10),
          amount: randomAmount()
        }

        actions.transferAsset({ commit, state }, params)
          .then(() => {
            expect(commit.args).to.deep.equal([
              [types.TRANSFER_ASSET_REQUEST],
              [types.TRANSFER_ASSET_SUCCESS]
            ])
            done()
          })
          .catch(done)
      })
    })
  })

  describe('Getters', () => {
    describe('wallets', () => {
      it('should return wallets transformed from raw assets', () => {
        const state = { assets: MOCK_ASSETS }
        const result = getters.wallets(state)
        const expectedKeys = ['id', 'assetId', 'name', 'asset', 'color', 'address', 'amount', 'precision']

        expect(result)
          .to.be.an('array')
          .which.contains.something.that.has.all.keys(expectedKeys)
      })
    })

    describe('getTransactionsByAssetId', () => {
      it('should return transformed transactions', () => {
        const state = { rawAssetTransactions: MOCK_ASSET_TRANSACTIONS }
        const result = getters.getTransactionsByAssetId(state)('bitcoin#test')
        const expectedKeys = ['amount', 'date', 'from', 'to', 'message', 'status']

        expect(result)
          .to.be.an('array')
          .which.contains.something.that.has.all.keys(expectedKeys)
      })

      it('should return an empty array if there is no transactions', () => {
        const state = { rawAssetTransactions: {} }
        const result = getters.getTransactionsByAssetId(state)('bitcoin#test')

        expect(result).to.be.an('array').which.is.empty
      })
    })
  })
})