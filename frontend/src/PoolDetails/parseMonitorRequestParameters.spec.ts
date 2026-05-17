import { expect } from 'chai';
import 'mocha';
import parseMonitorRequestParameters from './parseMonitorRequestParameters';
import {IMonitorRequestParameters} from '../Interfaces/IMonitorRequestParameters';

describe('HTTP Monitor parsing',
() => {
      it('Valid HTTP send string should return a monitorRequestParameterObject', () => {
        const sendString = 'GET /monitor/ping.jsp HTTP/1.1\\r\\n' +
          'Host: domain.com\\r\\nUser-Agent: Mozilla\\r\\nConnection: Close\\r\\n\\r\\n';
        const result = parseMonitorRequestParameters(sendString);
        const expected: IMonitorRequestParameters = {
          verb: 'GET',
          uri: '/monitor/ping.jsp',
          version: 'HTTP/1.1',
          headers: [
            { key: 'Host', value: 'domain.com' },
            { key: 'User-Agent', value: 'Mozilla' },
            { key: 'Connection', value: 'Close' }
          ],
        }
        expect(result).to.eql(expected);
      });

      it('Should ignore invalid headers', () => {
        const sendString = 'GET /monitor/ping.jsp HTTP/1.1\\r\\n' +
          'Host: domain.com\\r\\nUser-Agent: Mozilla\\r\\npatrik:test:monitor\\r\\nConnection: Close\\r\\n\\r\\n';
        const result = parseMonitorRequestParameters(sendString);
        const expected: IMonitorRequestParameters = {
          verb: 'GET',
          uri: '/monitor/ping.jsp',
          version: 'HTTP/1.1',
          headers: [
            { key: 'Host', value: 'domain.com' },
            { key: 'User-Agent', value: 'Mozilla' },
            { key: 'Connection', value: 'Close' }
          ],
        }
        expect(result).to.eql(expected);
      });

      it('Should include empty header values', () => {
        const sendString = 'GET /health HTTP/1.1\\r\\nHost:\\r\\nConnection: close\\r\\n\\r\\n';
        const result = parseMonitorRequestParameters(sendString);
        const expected: IMonitorRequestParameters = {
          verb: 'GET',
          uri: '/health',
          version: 'HTTP/1.1',
          headers: [
            { key: 'Host', value: '' },
            { key: 'Connection', value: 'close' }
          ],
        }
        expect(result).to.eql(expected);
      });

      it('Invalid HTTP request data should return null', () => {
        const sendString = 'GET /monitor/ping.jsp\\r\\n' +
          'Host: domain.com\\r\\nUser-Agent: Mozilla\\r\\nConnection: Close\\r\\n\\r\\n';
        const result = parseMonitorRequestParameters(sendString);
        const expected: IMonitorRequestParameters = {}
        expect(result).to.deep.equal(expected);
      });
  });
