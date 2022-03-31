import IMonitor from '../Interfaces/IMonitor';
import parseMonitorRequestParameters from './parseMonitorRequestParameters';
import IMonitorTests from '../Interfaces/IMonitorTests';
import { IMember } from '../Interfaces/IPool';

const generateMonitorTests = (monitor: IMonitor, member: IMember): IMonitorTests => {

  const { type, sendstring } = monitor;

  const protocol = type.replace(/:.*$/, '');
  const { verb, uri, version, headers } = parseMonitorRequestParameters(sendstring);

  const monitorTests: IMonitorTests = {};

  let curl: string, http: string, netcat: string;

  if (['http', 'https', 'tcp', 'tcp-half-open'].includes(protocol)) {

    if (['http', 'https'].includes(protocol)) {
      if (
        verb === 'GET' ||
        verb === 'HEAD'
      ) {
        curl = 'curl';

        if (verb === 'HEAD') {
          curl += ' -I';
        }

        if (version === 'HTTP/1.0') {
          curl += ' -0';
        }

        for (const h of headers) {
          curl += ` -H &quot;${h.key}:${h.value}&quot;`;
        }

        curl += ` ${protocol}://${member.ip}:${member.port}${uri}`;
      }
      monitorTests.curl = curl;
    }

    if (
      protocol === 'http' ||
      protocol === 'tcp' ||
      protocol === 'tcp-half-open'
    ) {
      netcat = `echo -ne &quot;${sendstring}&quot; | nc ${member.ip} ${member.port}`;
    }

    if (protocol === 'http' || protocol === 'https') {
      http = `${protocol}://${member.ip}:${member.port}${uri}`;
    }
    console.log('rasdasd')
  }

  return {
    curl,
    http,
    netcat,
  }

}

export default generateMonitorTests;
