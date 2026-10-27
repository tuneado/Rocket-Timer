/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Message Manager Module
 * The on-screen message: the draft in the message box ('message.draft') and
 * what is shown on the canvas and display window ('message.visible' / 'message.text').
 */
import appState from './appState.js';

export const MAX_MESSAGE_LENGTH = 100;

export function setDraft(text) {
  appState.set('message.draft', String(text).slice(0, MAX_MESSAGE_LENGTH));
}

/**
 * Show a message (the draft by default) on the canvas and display window.
 * Also refreshes the text of a message that is already shown.
 * @returns {boolean} false if there was nothing to show
 */
export function showMessage(text, { canvasRenderer, ipcRenderer, statusBar }) {
  const message = (text ?? appState.get('message.draft')).trim();
  if (!message) {
    statusBar.warning('Please enter a message to display.', 5000);
    return false;
  }

  if (canvasRenderer) {
    canvasRenderer.setState({ message, showMessage: true });
  }
  ipcRenderer.send('display-message', message);
  appState.update({ 'message.visible': true, 'message.text': message });
  return true;
}

export function hideMessage({ canvasRenderer, ipcRenderer }) {
  if (canvasRenderer) {
    canvasRenderer.setState({ message: '', showMessage: false });
  }
  ipcRenderer.send('clear-message');
  appState.update({ 'message.visible': false, 'message.text': '' });
}

/**
 * Empty the message box, hiding the message if it is shown
 */
export function clearMessage(deps) {
  setDraft('');
  if (appState.get('message.visible')) hideMessage(deps);
}

/**
 * Paste the clipboard into the message box at the cursor, within the length limit
 * @param {HTMLTextAreaElement} input
 */
export async function pasteFromClipboard(input) {
  try {
    const clipboardText = await window.electron.clipboard.readText();
    if (!clipboardText) return;

    const before = input.value.substring(0, input.selectionStart);
    const after = input.value.substring(input.selectionEnd);
    const room = Math.max(0, MAX_MESSAGE_LENGTH - before.length - after.length);
    const pasted = clipboardText.substring(0, room);

    setDraft(before + pasted + after);
    // Put the cursor after the pasted text once the box re-renders
    const cursor = before.length + pasted.length;
    requestAnimationFrame(() => input.setSelectionRange(cursor, cursor));
  } catch (error) {
    console.error('Paste failed:', error);
  }
}
