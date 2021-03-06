const testKeyPath = 'test@d3.priv'

describe('Test login page', () => {
  it('Log in', () => {
    cy.visit('/')
    cy.login(testKeyPath)
  })

  it('Log out', () => {
    cy.get('.el-side-menu .el-menu-item:contains("Logout")').click({ force: true })
    cy.contains('Welcome to D3').should('be.visible')
  })
})

describe('Test register page', () => {
  it('Click sign up button', () => {
    cy.get('[data-cy=signup]').click()
    cy.get('[data-cy=signup]').should('be.visible')
  })

  // Signing up should fail because the registration service doesn't work on CI now
  it('Register new user - failure', () => {
    cy.get('.el-input__inner[name="username"]').type('jasonstatham')
      .should('have.value', 'jasonstatham')
    cy.get('.el-input__inner[name="newAddress"]').type('0x070f9d09370fd7ae3a583fc22a4e9f50ae1bdc78')
      .should('have.value', '0x070f9d09370fd7ae3a583fc22a4e9f50ae1bdc78')
    cy.get('[data-cy=add-whitelist]').click()
    cy.get('.el-form-item__content > .el-button.fullwidth').click()
    cy.get('.el-form-item__error:contains("There is no free relays now")').should('be.visible')
  })

  it.skip('Confirm should redirect to Log in', () => {
    cy.contains('Confirm').click()
    cy.url().should('be.eq', `${Cypress.config('baseUrl')}/#/login`)
  })
})
