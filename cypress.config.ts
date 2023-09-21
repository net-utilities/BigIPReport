// eslint-disable-next-line import/no-extraneous-dependencies,import/no-import-module-exports
import { defineConfig } from 'cypress'

module.exports = defineConfig({
  chromeWebSecurity: false,
  e2e: {
    setupNodeEvents(on, config) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires,global-require
      return require('./cypress/plugins').default(on, config)
    },
  },
})
