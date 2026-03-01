describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('shows the PartyBox title', () => {
    cy.contains('PartyBox').should('be.visible')
  })

  it('shows the game grid with playable games', () => {
    cy.contains('Pick a Game').should('be.visible')
    // At least one game card should be present
    cy.get('button').contains('Play').should('exist')
  })

  it('shows language toggle button', () => {
    cy.get('[aria-label="Toggle language"]').should('be.visible')
  })

  it('shows Join Room toggle button', () => {
    cy.get('button[aria-label]').contains(/Join Room|कमरे में जाएं/).should('exist')
  })

  it('shows code input when Join Room is clicked', () => {
    cy.contains('Join Room').click()
    cy.get('input[placeholder="ABCD"]').should('be.visible')
  })

  it('hides code input when Back is clicked after opening Join Room', () => {
    cy.contains('Join Room').click()
    cy.get('input[placeholder="ABCD"]').should('be.visible')
    cy.contains('Back').click()
    cy.get('input[placeholder="ABCD"]').should('not.exist')
  })

  it('switches UI to Hindi when language toggle is clicked', () => {
    cy.get('[aria-label="Toggle language"]').click()
    cy.contains('खेल चुनें').should('be.visible')
  })

  it('shows Online Games section', () => {
    cy.contains('Online Games').should('be.visible')
    cy.contains('Lucky Number').should('be.visible')
  })
})
