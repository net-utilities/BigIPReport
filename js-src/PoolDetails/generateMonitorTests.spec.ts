import { expect } from 'chai';
import 'mocha';
import generateMonitorTests from './generateMonitorTests';
import IMonitor from '../Interfaces/IMonitor';
import {IMember} from '../Interfaces/IPool';

describe('HTTP send string tests', () => {

  it('HTTPS Monitor', () => {
    const monitor: IMonitor = {
      'name': '/Common/loadbalancing-se-https',
      'receivestring': 'Balanced',
      'sendstring': 'GET / HTTP/1.1\\r\\nHost: host.domain.com\\r\\nConnection: Close\\r\\n\\r\\n',
      'loadbalancer': 'bigip.xip.se',
      'interval': '5',
      'type': 'https:httpsstate',
      'disablestring': '',
      'timeout': '16'
    }
    const member: IMember = {
                      'maximumconnections': '0',
                      'availability': 'available',
                      'ip': '68.183.223.252',
                      'enabled': 'enabled',
                      'status': 'up',
                      'name': '/Common/loadbalancing-se:443',
                      'priority': 0,
                      'port': '443',
                      'currentconnections': '0'
                    };

    const { curl, netcat, http } = generateMonitorTests(monitor, member);
    expect(curl).to.equal('curl -H &quot;Host:host.domain.com&quot; -H &quot;Connection:Close&quot; ' +
      'https://68.183.223.252:443/');
    expect(netcat).to.be.undefined;
    expect(http).to.equal('https://68.183.223.252:443/');
  });

  it('HTTP Monitor', () => {
    const monitor: IMonitor = {
      'name': '/example_NAT64/App1/grafana_http_monitor',
      'receivestring': 'HTTP/1.',
      'sendstring': 'GET /index.html HTTP/1.1\\r\\nHost: grafana.xip.se\\r\\nConnection: Close\\r\\n\\r\\n',
      'loadbalancer': 'bigip.xip.se',
      'interval': '5',
      'type': 'http:httpstate',
      'disablestring': '',
      'timeout': '16'
    }

    const member: IMember = {
      'maximumconnections': '0',
      'availability': 'offline',
      'ip': '172.22.0.3',
      'enabled': 'enabled',
      'status': 'down',
      'name': '/example_NAT64/172.22.0.3:80',
      'priority': 0,
      'port': '80',
      'currentconnections': '0'
    }

    const { curl, netcat, http } = generateMonitorTests(monitor, member);
    expect(curl).to.equal('curl -H &quot;Host:grafana.xip.se&quot; -H &quot;Connection:Close&quot;' +
      ' http://172.22.0.3:80/index.html');
    expect(netcat).to.equal(
      'echo -ne &quot;GET /index.html HTTP/1.1\\r\\nHost: grafana.xip.se\\r\\nConnection: Close' +
      '\\r\\n\\r\\n&quot; | nc 172.22.0.3 80'
    );
    expect(http).to.equal('http://172.22.0.3:80/index.html');
  });
})
