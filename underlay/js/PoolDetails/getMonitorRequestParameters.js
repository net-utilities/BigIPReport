/** ********************************************************************************************************************
 Takes a monitor send string as parameter and returns a request object
 **********************************************************************************************************************/
export default function getMonitorRequestParameters(sendstring) {
    const request = {
        verb: '',
        uri: '',
        headers: [],
    };
    const lines = sendstring.split(/\\r\\n|\\\\r\\\\n/);
    const sendstringarr = lines[0].split(' ');
    request['verb'] = sendstringarr[0];
    request['uri'] = sendstringarr[1];
    request['version'] = sendstringarr[2];
    if (lines.length > 1) {
        for (let i = 1; i < lines.length; i++) {
            const header = lines[i];
            if (header.indexOf(':') >= 0) {
                if (header.split(':').length === 2) {
                    request['headers'].push(header);
                }
            }
        }
    }
    return request;
}
