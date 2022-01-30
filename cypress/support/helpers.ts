export const waitForLoad = (url: string) => {
  cy.visit(url);
  cy.get('div.pace.pace-active').should('be.visible');
  cy.get('div.pace.pace-inactive').should('not.be.visible');
}