import IVirtualServer from '../../js-src/Interfaces/IVirtualServer';
import {VIP_WITH_IRULE} from '../constants/constants';

let virtualServers: IVirtualServer[]

describe('Virtual server details should render properly', () => {
  it('Should show the pace loader while loading the XHRs', () => {
    cy.intercept('/json/virtualservers.json').as('virtualServers');
    cy.intercept('/json/pools.json').as('pools');
    cy.intercept('/json/monitors.json').as('monitors');

    cy.visit('https://localhost:8443')
    cy.get('div.pace.pace-active').should('be.visible');

    cy.wait('@virtualServers').then(response => {
      virtualServers = response.response.body;
    });

  });

  it('Should show the virtual server details table when clicking on a pool details link', () => {

    const index = virtualServers.findIndex(vip => vip.name === VIP_WITH_IRULE);

    cy.get('table#allbigips > tbody > tr').eq(index).find('td.virtualServerCell').click();
    cy.get('div#firstlayerdiv').should('be.visible');
  });

  it('Should display the correct title', () => {

    // eslint-disable-next-line @typescript-eslint/no-shadow
    const vip = virtualServers.find(vip => vip.name === VIP_WITH_IRULE);

    const { name } = vip;

    cy.get('div#firstlayerdiv div.virtualserverdetailsheader')
      .should('contain.text', `Virtual Server: ${name}`);

  })

  it('Should display the all associated iRules', () => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const vip = virtualServers.find(vip => vip.name === VIP_WITH_IRULE);

    const { irules } = vip;

    cy.get('table tbody tr th').contains('iRule name').should('exist');
    irules.forEach(r => {
      cy.get(`a[data-originalvirtualservername="${r}"]`).should('exist');
    })
  })

  it('Clicking on an iRule should display the iRule modal', () => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const vip = virtualServers.find(vip => vip.name === VIP_WITH_IRULE);

    const { irules } = vip;
    const name = irules[0];

    cy.get('table tbody tr th').contains('iRule name').should('exist');
    cy.get(`a[data-originalvirtualservername="${name}"]`).click();
    cy.get('div#secondlayerdiv').should('be.visible');
    cy.get('div.iruledetailsheader span').should('contain.text', `iRule: ${name}`);
  })

})
