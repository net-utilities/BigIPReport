/** ********************************************************************************************************************
 Translates the status and availability of a member to less cryptic text and returns a dictionary
 **********************************************************************************************************************/

import { IMember } from '../Interfaces/IPool';

export default function translateStatus(member: IMember) {
  const translatedStatus = {
    availability: '',
    enabled: '',
    realtime: '',
  };

  switch (member.availability) {
    case 'available':
      translatedStatus['availability'] = '<span class="memberup">UP</span>';
      break;
    case 'unknown':
      translatedStatus['availability'] =
        '<span class="memberunknown">UNKNOWN</span>';
      break;
    default:
      translatedStatus['availability'] = '<span class="memberdown">DOWN</span>';
  }

  switch (member.enabled) {
    case 'enabled':
      translatedStatus['enabled'] =
        '<span class="memberenabled">Enabled</span>';
      break;
    case 'disabled-by-parent':
      translatedStatus['enabled'] =
        '<span class="memberdisabled">Disabled by parent</span>';
      break;
    case 'disabled':
      translatedStatus['enabled'] =
        '<span class="memberdisabled">Disabled</span>';
      break;
    default:
      translatedStatus['enabled'] =
        '<span class="memberunknown">Unknown</span>';
  }

  switch (member.realtimestatus) {
    case 'up':
      translatedStatus['realtime'] = '<span class="memberup">UP</span>';
      break;
    case 'down':
      translatedStatus['realtime'] = '<span class="memberdown">DOWN</span>';
      break;
    case 'session_disabled':
      translatedStatus['realtime'] =
        '<span class="memberdisabled">DISABLED</span>';
      break;
    default:
      translatedStatus['realtime'] = (
        member.realtimestatus || 'N/A'
      ).toUpperCase();
  }

  return translatedStatus;
}
