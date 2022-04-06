import {
  DIRECT_LINK_POOL_DETAILS_URL,
  DIRECT_LINK_POOL_DETAILS_NAME,
  DIRECT_LINK_VIP_DETAILS_URL,
  DIRECT_LINK_VIP_DETAILS_NAME,
  DIRECT_LINK_SEARCH_BY_IP_PORT_URL,
  DIRECT_LINK_SEARCH_BY_IP_PORT,
  DIRECT_LINK_SEARCH_BY_VIP_NAME_URL,
  DIRECT_LINK_SEARCH_BY_VIP_NAME,
  DIRECT_LINK_GLOBAL_SEARCH_URL,
  DIRECT_LINK_GLOBAL_SEARCH,
} from '../constants/constants';
import { waitForLoad } from '../support/helpers';

describe('Loading a page with direct links should yield the expected results', () => {

  it('Should show the virtual server details table', () => {
    waitForLoad(DIRECT_LINK_VIP_DETAILS_URL);
    cy.get('div#firstlayerdiv').should('be.visible');
    cy.get('div#firstlayerdiv div.virtualserverdetailsheader')
      .should('contain.text', DIRECT_LINK_VIP_DETAILS_NAME);
  })

  it('Should show the pool details table', () => {
    waitForLoad(DIRECT_LINK_POOL_DETAILS_URL);
    cy.get('div#firstlayerdiv').should('be.visible');
    cy.get('div#firstlayerdiv div.pooldetailsheader')
      .should('contain.text', DIRECT_LINK_POOL_DETAILS_NAME);
  });

  it('Should be able to search using the global search', () => {
    waitForLoad(DIRECT_LINK_GLOBAL_SEARCH_URL);
    cy.get('div#allbigips_filter input').should('have.value', DIRECT_LINK_GLOBAL_SEARCH);
    cy.get('table#allbigips > tbody > tr').each(row => {
      cy.wrap(row).should('contain.text', DIRECT_LINK_GLOBAL_SEARCH);
    })
  })

  it('Loading a page with a column search of vip name should show filtered results', () => {
    waitForLoad(DIRECT_LINK_SEARCH_BY_VIP_NAME_URL);
    cy.get('table#allbigips > thead th input[name=name]')
      .should('have.value', DIRECT_LINK_SEARCH_BY_VIP_NAME)
    cy.get('table#allbigips > tbody > tr').each(row => {
      cy.wrap(row).should('contain.text', DIRECT_LINK_SEARCH_BY_VIP_NAME);
    })
  });

  it('Loading a page with a column search of ip+port should show filtered results', () => {
    waitForLoad(DIRECT_LINK_SEARCH_BY_IP_PORT_URL);
    cy.get('table#allbigips > thead th input[name=ipport]')
      .should('have.value', DIRECT_LINK_SEARCH_BY_IP_PORT)
    cy.get('table#allbigips > tbody > tr').each(row => {
      cy.wrap(row).should('contain.text', DIRECT_LINK_SEARCH_BY_IP_PORT);
    })
  });


})
