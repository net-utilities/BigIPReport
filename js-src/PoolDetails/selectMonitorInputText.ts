/** ********************************************************************************************************************
 Put the cursor in the input field holding the command and selects the text
 **********************************************************************************************************************/

// Did not detect hoisting, disabled
// eslint-disable-next-line no-unused-vars
export default function selectMonitorInputText(e) {
  $(e).find('p input').focus();
  $(e).find('p input').select();
}
