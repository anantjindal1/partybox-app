import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.js',
    video: true,
    videoCompression: 16,
    env: {
      STEP_THROUGH: process.env.CYPRESS_STEP_THROUGH === '1',
      SLOW_MO: process.env.CYPRESS_SLOW_MO ? Number(process.env.CYPRESS_SLOW_MO) : 0,
    },
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium') {
          launchOptions.args = launchOptions.args || []
          launchOptions.args.push('--no-sandbox')
          launchOptions.args.push('--disable-dev-shm-usage')
          launchOptions.args.push('--disable-gpu')
        }
        return launchOptions
      })
      return config
    },
  },
})
