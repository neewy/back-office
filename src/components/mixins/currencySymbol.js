const ASSETS = require('@util/crypto-list.json')

const symbols = {
  USD: '$',
  RUB: '₽',
  EUR: '€'
}

const currencySymbol = {
  methods: {
    assetName (assetId) {
      const assetName = assetId.split('#')[0].toLowerCase()
      const asset = ASSETS.find(a => {
        return a.name.toLowerCase() === assetName || a.asset.toLowerCase() === assetName
      })
      return asset.asset
    }
  },
  computed: {
    currencySymbol () {
      const view = this.$store.getters.settingsView.fiat
      return symbols[view]
    }
  }
}

export default currencySymbol
