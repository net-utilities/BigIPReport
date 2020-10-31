/** ********************************************************************************************************************
 Translates the status and availability of a member to less cryptic text and returns a dictionary
 **********************************************************************************************************************/

export default function translateStatus(member) {
  const translatedstatus = {
    availability: '',
    enabled: '',
    realtime: '',
  };

  switch (member.availability) {
    case 'available':
      translatedstatus['availability'] = '<span class="memberup">UP</span>';
      break;
    case 'unknown':
      translatedstatus['availability'] =
        '<span class="memberunknown">UNKNOWN</span>';
      break;
    default:
      translatedstatus['availability'] = '<span class="memberdown">DOWN</span>';
  }

  switch (member.enabled) {
    case 'enabled':
      translatedstatus['enabled'] =
        '<span class="memberenabled">Enabled</span>';
      break;
    case 'disabled-by-parent':
      translatedstatus['enabled'] =
        '<span class="memberdisabled">Disabled by parent</span>';
      break;
    case 'disabled':
      translatedstatus['enabled'] =
        '<span class="memberdisabled">Disabled</span>';
      break;
    default:
      translatedstatus['enabled'] =
        '<span class="memberunknown">Unknown</span>';
  }

  switch (member.realtimestatus) {
    case 'up':
      translatedstatus['realtime'] = '<span class="memberup">UP</span>';
      break;
    case 'down':
      translatedstatus['realtime'] = '<span class="memberdown">DOWN</span>';
      break;
    case 'session_disabled':
      translatedstatus['realtime'] =
        '<span class="memberdisabled">DISABLED</span>';
      break;
    default:
      translatedstatus['realtime'] = (
        member.realtimestatus || 'N/A'
      ).toUpperCase();
  }

  return translatedstatus;
}
