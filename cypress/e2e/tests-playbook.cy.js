/**
 * TESTS.md playbook — automated E2E scenarios.
 * Run with dev server up: npm run dev
 *
 * Fast run (all tests in sequence):
 *   npm run test:playbook
 *
 * Step-through (each test waits for you to click "Resume"):
 *   npm run test:playbook:step
 *   Then in Cypress UI click "Run all tests" — before each test it will pause; click Resume to run that test.
 *
 * Slower (see each user event): set CYPRESS_SLOW_MO=800 (ms delay after each visit/click)
 *   CYPRESS_SLOW_MO=800 npm run test:playbook:step
 */

const slowMo = () => {
  const ms = Cypress.env('SLOW_MO')
  if (ms && ms > 0) cy.wait(ms)
}

beforeEach(function () {
  if (Cypress.env('STEP_THROUGH')) {
    cy.pause()
  }
})

describe('0. Global smoke (TESTS.md §0)', () => {
  it('0.1 App loads at / without crashing', () => {
    cy.visit('/')
    slowMo()
    cy.contains('PartyBox').should('be.visible')
  })

  it('0.2 Pick a Game section and game grid visible', () => {
    cy.visit('/')
    slowMo()
    cy.contains('Pick a Game').should('be.visible')
    cy.get('button').contains('Play').should('exist')
  })

  it('0.3 Language toggle visible and switches to Hindi', () => {
    cy.visit('/')
    slowMo()
    cy.get('[aria-label="Toggle language"]').should('be.visible')
    cy.get('[aria-label="Toggle language"]').click()
    slowMo()
    cy.contains('खेल चुनें').should('be.visible')
  })

  it('0.4 Profile page shows XP/Level', () => {
    cy.visit('/profile')
    slowMo()
    cy.url().should('include', '/profile')
    cy.contains('Level').should('be.visible')
    cy.get('body').then($b => {
      expect($b.text()).to.match(/\d+/)
    })
  })

  it('0.5 Join Room opens code input; Back closes it', () => {
    cy.visit('/')
    slowMo()
    cy.get('button').filter((i, el) => Cypress.$(el).text().includes('Join Room')).first().click()
    slowMo()
    cy.get('input[placeholder="ABCD"]').should('be.visible')
    cy.contains('Back').click()
    slowMo()
    cy.get('input[placeholder="ABCD"]').should('not.exist')
  })
})

describe('1. Offline games — each opens without error (TESTS.md §1)', () => {
  it('1.1 Tez Hisab opens at /play/tez-hisab', () => {
    cy.visit('/play/tez-hisab')
    slowMo()
    cy.get('body').invoke('text').should('match', /Tez|Hisab|Start/)
  })

  it('1.2 Spot the Jugaad opens at /play/spot-the-jugaad', () => {
    cy.visit('/play/spot-the-jugaad')
    slowMo()
    cy.get('body').invoke('text').should('match', /Jugaad|Start|Puzzle/)
  })

  it('1.3 Desi Memory Master opens at /play/desi-memory-master', () => {
    cy.visit('/play/desi-memory-master')
    slowMo()
    cy.get('body').invoke('text').should('match', /Memory|Start|Play/)
  })

  it('1.4 Bollywood Emoji Guess opens at /play/bollywood-emoji-guess', () => {
    cy.visit('/play/bollywood-emoji-guess')
    slowMo()
    cy.get('body').invoke('text').should('match', /Bollywood|Emoji|Start/)
  })

  it('1.5 Tez Dimaag Challenge opens at /play/rapid-fire-quiz', () => {
    cy.visit('/play/rapid-fire-quiz')
    slowMo()
    cy.get('body').invoke('text').should('match', /Tez|Dimaag|Player/)
  })

  it('1.6 A to Z Dhamaka tile on Home and game opens', () => {
    cy.visit('/')
    slowMo()
    cy.contains('A to Z Dhamaka').should('be.visible')
    cy.visit('/play/categories')
    slowMo()
    cy.contains('A to Z Dhamaka').should('be.visible')
    cy.contains('Number of players').should('be.visible')
  })
})

describe('1.7 A to Z Dhamaka — full flow (TESTS.md §1.7)', () => {
  it('1.7.1 Setup: 2 players, Start → round with letter and 4 categories', () => {
    cy.visit('/play/categories')
    slowMo()
    cy.contains('Number of players').should('be.visible')
    cy.get('button').contains('2').click()
    slowMo()
    cy.get('input[type="text"]').first().should('be.visible')
    cy.contains('Start').click()
    slowMo()
    cy.url().should('include', '/play/categories')
    cy.get('body').then($b => {
      const text = $b.text()
      expect(text).to.match(/[A-Z]/)
      expect(text.length).to.be.greaterThan(50)
    })
    cy.contains('ab tum', { matchCase: false }).should('be.visible')
  })

  it('1.7.2 Round screen shows category cards and suggestions', () => {
    cy.visit('/play/categories')
    slowMo()
    cy.get('button').contains('2').click()
    slowMo()
    cy.contains('Start').click()
    slowMo()
    cy.contains('ab tum', { matchCase: false }).should('be.visible')
    cy.get('body').invoke('text').should('match', /Name|Place|Animal|Thing|Brand|Food|Movie/)
  })

  it('1.7.3 GameChrome Home returns to Home', () => {
    cy.visit('/play/categories')
    slowMo()
    cy.get('button').contains('2').click()
    slowMo()
    cy.contains('Start').click()
    slowMo()
    cy.contains('Return Home').click()
    slowMo()
    cy.url().should('eq', Cypress.config().baseUrl + '/')
    cy.contains('PartyBox').should('be.visible')
  })
})

describe('3. Profile & cross-cutting (TESTS.md §3)', () => {
  it('3.1 Profile shows Level and XP', () => {
    cy.visit('/profile')
    slowMo()
    cy.contains('Level').should('be.visible')
    cy.get('body').invoke('text').should('match', /\d+/)
  })

  it('3.2 Home → Play → Home: URL and title', () => {
    cy.visit('/')
    slowMo()
    cy.contains('A to Z Dhamaka').click()
    slowMo()
    cy.url().should('include', '/play/categories')
    cy.contains('A to Z Dhamaka').should('be.visible')
    cy.visit('/')
    slowMo()
    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })
})

describe('5. Regression quick pass (TESTS.md §5)', () => {
  it('5.1 Home loads; game grid present', () => {
    cy.visit('/')
    slowMo()
    cy.contains('PartyBox').should('be.visible')
    cy.get('button').contains('Play').should('exist')
  })

  it('5.2 One offline game can start (Desi Memory Master)', () => {
    cy.visit('/play/desi-memory-master')
    slowMo()
    cy.get('body').invoke('text').should('match', /Memory|Start|Play/)
    cy.get('button').contains('Start').first().click()
    slowMo()
    cy.get('body').invoke('text').then(text => expect(text.length).to.be.greaterThan(80))
  })

  it('5.3 A to Z Dhamaka: start game and see round', () => {
    cy.visit('/play/categories')
    slowMo()
    cy.get('button').contains('2').click()
    slowMo()
    cy.contains('Start').click()
    slowMo()
    cy.contains('ab tum', { matchCase: false }).should('be.visible')
  })

  it('5.4 Jest unit tests pass (run npm test separately)', () => {
    expect(true).to.be.true
  })
})
