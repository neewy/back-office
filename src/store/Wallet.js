import _ from 'lodash'
import axios from 'util/cryptoApi-axios-util'

const types = _([
  'GET_CRYPTO_FULL_DATA'
]).chain()
  .flatMap(x => [x + '_REQUEST', x + '_SUCCESS', x + '_FAILURE'])
  .concat([
    'RESET'
  ])
  .map(x => [x, x])
  .fromPairs()
  .value()

function initialState () {
  return {
    cryptoInfo: {
      current: {
        rur: 0,
        rur_change: 0,
        crypto: 0,
        crypto_change: 0
      },
      market: {
        cap: {
          rur: 0,
          crypto: 0
        },
        volume: {
          rur: 0,
          crypto: 0
        },
        supply: 0
      }
    },
    connectionError: null
  }
}

const state = initialState()

const getters = {
  cryptoInfo (state) {
    return state.cryptoInfo
  }
}

/**
 * Store a connection error so the top component can handle it.
 * @param {Object} state
 * @param {Error} err
 */
function handleError (state, err) {
  state.connectionError = err
}

const mutations = {
  [types.RESET] (state) {
    const s = initialState()
    Object.keys(s).forEach(key => {
      state[key] = s[key]
    })
  },

  [types.GET_CRYPTO_FULL_DATA_REQUEST] (state) {},

  [types.GET_CRYPTO_FULL_DATA_SUCCESS] (state, { data, currencies }) {
    const RAW = Object.values(data.RAW)[0]
    const compareToRUB = RAW[currencies.fiat]
    const compareToCrypto = RAW[currencies.crypto]
    state.cryptoInfo = {
      current: {
        rur: compareToRUB.PRICE,
        rur_change: compareToRUB.CHANGEDAY,
        crypto: compareToCrypto.PRICE,
        crypto_change: compareToCrypto.CHANGEPCTDAY
      },
      market: {
        cap: {
          rur: compareToRUB.MKTCAP,
          crypto: compareToRUB.SUPPLY
        },
        volume: {
          rur: compareToRUB.TOTALVOLUME24HTO,
          crypto: compareToRUB.TOTALVOLUME24H
        },
        supply: compareToRUB.SUPPLY
      }
    }
  },

  [types.GET_CRYPTO_FULL_DATA_FAILURE] (state, err) {
    handleError(state, err)
  }
}

const actions = {
  getCryptoFullData ({ commit, getters }, { asset }) {
    commit(types.GET_CRYPTO_FULL_DATA_REQUEST)
    const currencies = getters.settingsView
    axios.loadFullData(asset)
      .then(data => commit(types.GET_CRYPTO_FULL_DATA_SUCCESS, { data, currencies }))
      .catch(err => commit(types.GET_CRYPTO_FULL_DATA_FAILURE, err))
  }
}

export default {
  types,
  state,
  getters,
  mutations,
  actions
}
