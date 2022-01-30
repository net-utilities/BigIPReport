import {
  DIRECT_LINK_POOL_DETAILS_URL,
  DIRECT_LINK_POOL_DETAILS_NAME,
  DIRECT_LINK_VIP_DETAILS_URL,
  DIRECT_LINK_VIP_DETAILS_NAME,
  DIRECT_LINK_SEARCH_BY_IP_PORT_URL,
  DIRECT_LINK_SEARCH_BY_IP_PORT,
  DIRECT_LINK_SEARCH_BY_VIP_NAME_URL,
  DIRECT_LINK_SEARCH_BY_VIP_NAME,
  DIRECT_LINK_SEARCH_BY_POOL_URL,
  DIRECT_LINK_SEARCH_BY_POOL,
} from '../constants/constants';

describe('Loading a page with direct links should yield the expected results', () => {

  it('Should show the virtual server details table', () => {
    cy.visit(DIRECT_LINK_VIP_DETAILS_URL);
    cy.get('div.pace.pace-active').should('be.visible');
    cy.get('div.pace.pace-inactive').should('not.be.visible');
    cy.get('div#firstlayerdiv').should('be.visible');
    cy.get('div#firstlayerdiv div.virtualserverdetailsheader')
      .should('contain.text', DIRECT_LINK_VIP_DETAILS_NAME);
  })

  it('Should show the pool details table', () => {
    cy.visit(DIRECT_LINK_POOL_DETAILS_URL);
    cy.get('div.pace.pace-active').should('be.visible');
    cy.get('div.pace.pace-inactive').should('not.be.visible');
    cy.get('div#firstlayerdiv').should('be.visible');
    cy.get('div#firstlayerdiv div.pooldetailsheader')
      .should('contain.text', DIRECT_LINK_POOL_DETAILS_NAME);
  });

  it('Loading a page with a column search of vip name should show filtered results', () => {
    cy.visit(DIRECT_LINK_SEARCH_BY_VIP_NAME_URL);
    cy.get('div.pace.pace-active').should('be.visible');
    cy.get('div.pace.pace-inactive').should('not.be.visible');
    cy.get('table#allbigips > tbody > tr').each(row => {
      cy.wrap(row).should('contain.text', DIRECT_LINK_SEARCH_BY_VIP_NAME);
    })
  });

  it('Loading a page with a column search of ip+port should show filtered results', () => {
    cy.visit(DIRECT_LINK_SEARCH_BY_IP_PORT_URL);
    cy.get('div.pace.pace-active').should('be.visible');
    cy.get('div.pace.pace-inactive').should('not.be.visible');
    cy.get('table#allbigips > tbody > tr').each(row => {
      cy.wrap(row).should('contain.text', DIRECT_LINK_SEARCH_BY_IP_PORT);
    })
  });

  it('Loading a page with a column search of ip+port should show filtered results', () => {
    cy.visit(DIRECT_LINK_SEARCH_BY_POOL_URL);
    cy.get('div.pace.pace-active').should('be.visible');
    cy.get('div.pace.pace-inactive').should('not.be.visible');
    cy.get('table#allbigips > tbody > tr').each(row => {
      cy.wrap(row).find('> td').last().click();
      cy.wrap(row).should('contain.text', DIRECT_LINK_SEARCH_BY_POOL);
    })
  });
})
