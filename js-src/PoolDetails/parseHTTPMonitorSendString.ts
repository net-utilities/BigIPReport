/** ********************************************************************************************************************
 Takes a monitor send string as parameter and returns a request object
 **********************************************************************************************************************/

export default function parseHTTPMonitorSendString(sendString: string): {
  verb: string,
  uri: string,
  version: string,
  headers: string[],
} {

  const lines = sendString.split(/\\r\\n|\\\\r\\\\n/);
  const requestDataArr = lines[0].split(' ');

  // Invalid HTTP request
  if(requestDataArr.length !== 3) return null;

  const [verb, uri, version] = requestDataArr;

  // Add only valid headers
  const headers = lines.filter(l => /^^[^:]+: *[^:]+$/.test(l));

  return {
    verb: verb,
    uri: uri,
    version: version,
    headers: headers,
  };
}
