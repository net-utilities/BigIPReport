/** ********************************************************************************************************************
 Put the cursor in the input field holding the command and selects the text
 **********************************************************************************************************************/
import MouseOverEvent = JQuery.MouseOverEvent;

// Did not detect hoisting, disabled
// eslint-disable-next-line no-unused-vars
export default function selectMonitorInputText(e: MouseOverEvent) {
  $(e.target).find('p input').focus();
  $(e.target).find('p input').select();
}
