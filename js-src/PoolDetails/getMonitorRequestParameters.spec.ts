import parseHTTPMonitorSendString from './parseHTTPMonitorSendString';
import { expect } from 'chai';
import 'mocha';

describe('HTTP Monitor parsing',
  () => {
      it('Valid HTTP send string should return a monitorRequestParameterObject', () => {
        const sendString = 'GET /monitor/ping.jsp HTTP/1.1\\r\\n' +
          'Host: domain.com\\r\\nUser-Agent: Mozilla\\r\\nConnection: Close\\r\\n\\r\\n';
        const result = parseHTTPMonitorSendString(sendString);

        expect(result).to.eql(
          {
            verb: 'GET',
            uri: '/monitor/ping.jsp',
            headers: [ 'Host: domain.com', 'User-Agent: Mozilla', 'Connection: Close' ],
            version: 'HTTP/1.1'
          });
      });

      it('Should ignore invalid headers', () => {
        const sendString = 'GET /monitor/ping.jsp HTTP/1.1\\r\\n' +
          'Host: domain.com\\r\\nUser-Agent: Mozilla\\r\\npatrik:test:monitor\\r\\nConnection: Close\\r\\n\\r\\n';
        const result = parseHTTPMonitorSendString(sendString);

        expect(result).to.eql(
          {
            verb: 'GET',
            uri: '/monitor/ping.jsp',
            headers: [ 'Host: domain.com', 'User-Agent: Mozilla', 'Connection: Close' ],
            version: 'HTTP/1.1'
          });
      });

      it('Invalid HTTP request data should return null', () => {
        const sendString = 'GET /monitor/ping.jsp\\r\\n' +
          'Host: domain.com\\r\\nUser-Agent: Mozilla\\r\\nConnection: Close\\r\\n\\r\\n';
        const result = parseHTTPMonitorSendString(sendString);

        expect(result).to.equal(null);
      });
  });
