import { defineConfig } from 'cypress'

module.exports = defineConfig({
  chromeWebSecurity: false,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    testIsolation: false,
    setupNodeEvents(on, config) {
      return require('./cypress/plugins').default(on, config)
    },
  },
})
