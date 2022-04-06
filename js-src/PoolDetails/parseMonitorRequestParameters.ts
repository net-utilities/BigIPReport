/** ********************************************************************************************************************
 Takes a monitor send string as parameter and returns a request object
 **********************************************************************************************************************/
import { IMonitorRequestParameters } from '../Interfaces/IMonitorRequestParameters';

export default function parseMonitorRequestParameters(sendString: string): IMonitorRequestParameters {

  const lines = sendString.split(/\\r\\n|\\\\r\\\\n/);
  const requestDataArr = lines[0].split(' ');

  // Invalid HTTP request
  if(requestDataArr.length !== 3) return {};

  const [verb, uri, version] = requestDataArr;

  const monitorComponents: IMonitorRequestParameters = {
    verb,
    uri,
    version,
    headers: []
  }

  // Add only valid headers
  for(const h of lines.filter(l => /^[^:]+: *[^:]*$/.test(l))) {
    const [key, value] = h.split(/:\s*/);
    monitorComponents.headers.push({key, value});
  }

  return monitorComponents;
}
