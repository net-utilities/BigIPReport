// Did not detect hoisting, disabled
// eslint-disable-next-line no-unused-vars
export default function selectMonitorInputText(e) {
    $(e.target).find('p input').focus();
    $(e.target).find('p input').select();
}
