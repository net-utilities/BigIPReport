/**
 * Navigates to BigIPReport and waits for it to fully load
 * @param url
 */

export const waitForLoad = (url: string): void => {
  cy.visit(url);
  cy.get('div.pace.pace-active').should('be.visible');
  cy.get('div.pace.pace-inactive').should('not.be.visible');
}