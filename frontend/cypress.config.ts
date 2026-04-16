import plugins from './cypress/plugins/index'

export default {
  chromeWebSecurity: false,
  e2e: {
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents(on, config) {
      return plugins(on, config)
    },
  },
}
