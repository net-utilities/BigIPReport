import IVirtualServer from '../../js-src/Interfaces/IVirtualServer';
import IPool from '../../js-src/Interfaces/IPool';
import IMonitor from '../../js-src/Interfaces/IMonitor';
import {LOADBALANCING_SE_POOL, VIP_WITH_IRULE} from '../constants/constants';

let virtualServers: IVirtualServer[]
let pools: IPool[]
let monitors: IMonitor[]

describe('Pool details should render properly', () => {
  it('Should show the pace loader while loading the XHRs', () => {
    cy.intercept('/json/virtualservers.json').as('virtualServers');
    cy.intercept('/json/pools.json').as('pools');
    cy.intercept('/json/monitors.json').as('monitors');

    cy.visit('https://localhost:8443')
    cy.get('div.pace.pace-active').should('be.visible');

    cy.wait('@virtualServers').then(response => {
      virtualServers = response.response.body;
    });

    cy.wait('@pools').then(poolResponse => {
      pools = poolResponse.response.body;

      cy.wait('@monitors').then(monitorResponse => {
        monitors = monitorResponse.response.body;
      });
      
      cy.get('div.pace.pace-inactive').should('not.be.visible');
    })
  });

  it('Should show the pool details table when clicking on a pool details link', () => {

    const index = virtualServers.findIndex(vip => vip.name === VIP_WITH_IRULE);

    cy.get('table#allbigips > tbody > tr').eq(index).find('td.PoolCell').click().within(cell => {
      cy.wrap(cell).find('table.pooltable').should('be.visible')
      cy.get('td.poolname a.tooltip').first().click();
    })

    cy.get('div#firstlayerdiv').should('be.visible');
  });

  it('Should display the correct title', () => {
    const pool = pools.find(p => p.name === LOADBALANCING_SE_POOL);
    cy.get('div#firstlayerdiv div.pooldetailsheader')
      .should('contain.text', `Pool: ${pool.name}`);
  })

  it('Should render associated pool properties correctly', () => {

    const pool = pools.find(p => p.name === LOADBALANCING_SE_POOL);

    cy.get('div#firstlayerdiv table.pooldetailstable').first().within(table => {
      cy.wrap(table).find('tbody tr td').eq(0).should('contain.text', pool.description);
      cy.wrap(table).find('tbody tr td')
        .eq(1).should('contain.text', pool.loadbalancingmethod);
      cy.wrap(table).find('tbody tr td')
        .eq(2).should('contain.text', pool.actiononservicedown);
      cy.wrap(table).find('tbody tr td')
        .eq(3).should('contain.text', pool.allownat);
      cy.wrap(table).find('tbody tr td')
        .eq(4).should('contain.text', pool.allowsnat);
    })
  })

  it('Should load associated pool members correctly', () => {
    const pool = pools.find(p => p.name === LOADBALANCING_SE_POOL);

    cy.get('div#firstlayerdiv table.pooldetailstable').eq(1).find('tbody tr').each((row, i) => {
      cy.wrap(row).find('td').eq(0).should('contain.text', pool.members[i].name);
      cy.wrap(row).find('td').eq(1).should('contain.text', pool.members[i].ip);
      cy.wrap(row).find('td').eq(2).should('contain.text', pool.members[i].port);
      cy.wrap(row).find('td').eq(3).should('contain.text', pool.members[i].priority);
      cy.wrap(row).find('td').eq(4).should('contain.text', pool.members[i].currentconnections);
      cy.wrap(row).find('td').eq(5).should('contain.text', pool.members[i].maximumconnections);
      // TODO Need to refactor js-src/PoolDetails/translateStatus.ts before we can reliable check these
      // cy.wrap(row).find('td').eq(6).should('contain.text', pool.members[i].availability);
      // cy.wrap(row).find('td').eq(7).should('contain.text', pool.members[i].enabled);
      cy.wrap(row).find('td').eq(8).should('contain.text', pool.members[i].status);
      cy.wrap(row).find('td').eq(9).should('contain.text', pool.members[i].realtimestatus || 'N/A');
    })
  })

  it('Should load associated pool monitors correctly', () => {
    const pool = pools.find(p => p.name === LOADBALANCING_SE_POOL);

    // Get the matching monitor objects as an array
    const matchingMonitors = pool.monitors.map(monitorName => monitors.find(monitor => monitor.name === monitorName))

    cy.get('div#firstlayerdiv table.monitordetailstable').each((table, i) => {
      cy.wrap(table).find('tr').eq(0).should('contain.text', matchingMonitors[i].name);
      cy.wrap(table).find('tr').eq(1).find('td').eq(1).should('contain.text', matchingMonitors[i].type);
      cy.wrap(table).find('tr').eq(2).find('td').eq(1).should('contain.text', matchingMonitors[i].sendstring);
      cy.wrap(table).find('tr').eq(3).find('td').eq(1).should('contain.text', matchingMonitors[i].receivestring);
      cy.wrap(table).find('tr').eq(4).find('td').eq(1).should('contain.text', matchingMonitors[i].disablestring);
      cy.wrap(table).find('tr').eq(5).find('td').eq(1).should('contain.text', matchingMonitors[i].interval);
      cy.wrap(table).find('tr').eq(6).find('td').eq(1).should('contain.text', matchingMonitors[i].timeout);

      it('Should render the member monitor table correctly', () => {
        cy.get('div#firstlayerdiv table.membermonitortable').eq(i).within(memberTable => {
          cy.wrap(memberTable).find('tbody tr').each((row, memberIndex) => {
            cy.wrap(row).find('td').eq(0).should('contain.text', pool.members[memberIndex].name);
            cy.wrap(row).find('td').eq(1).should('contain.text', pool.members[memberIndex].ip);
            cy.wrap(row).find('td').eq(2).should('contain.text', pool.members[memberIndex].port);
            // TODO Validate the monitor tests needs refactoring of the function that generates the tests
          })
        })
      })
    })
  })

  it('Clicking on the Close pool details button should close the pool details', () => {
    cy.get('a#closefirstlayerbutton').click();
    cy.get('div#firstlayerdiv').should('not.be.visible');
  })
})
