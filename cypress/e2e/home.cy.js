describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('shows Create Room and Join Room buttons', () => {
    cy.get('[aria-label="Create Room"]').should('be.visible')
    cy.get('[aria-label="Join Room"]').should('be.visible')
  })

  it('shows Profile button', () => {
    cy.get('[aria-label="Profile"]').should('be.visible')
  })

  it('shows language toggle button', () => {
    cy.get('[aria-label="Toggle language"]').should('be.visible')
  })

  it('switches to Hindi when language toggle is clicked', () => {
    cy.get('[aria-label="Toggle language"]').click()
    cy.contains('कमरा बनाएं').should('be.visible')
    cy.contains('कमरे में जाएं').should('be.visible')
  })

  it('navigates to game picker on Create Room click', () => {
    cy.get('[aria-label="Create Room"]').click()
    cy.contains('Lucky Number').should('be.visible')
  })

  it('shows code input on Join Room click', () => {
    cy.get('[aria-label="Join Room"]').click()
    cy.get('input[placeholder="ABCD"]').should('be.visible')
  })
})
