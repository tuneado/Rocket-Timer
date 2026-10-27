/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { Card, Button } from './ui';
import { useAppState } from './useAppState.js';
import actions from '../js/mainActions.js';
import { MAX_MESSAGE_LENGTH, pasteFromClipboard } from '../js/modules/messageManager.js';

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');

function counterColor(length) {
  if (length >= MAX_MESSAGE_LENGTH * 0.9) return 'var(--color-danger)';
  if (length >= MAX_MESSAGE_LENGTH * 0.7) return 'var(--color-warning)';
  return undefined;
}

export function MessageCard() {
  const draft = useAppState('message.draft');
  const visible = useAppState('message.visible');

  // Paste through the main process clipboard, keeping the length limit
  const paste = (e) => {
    e.preventDefault();
    pasteFromClipboard(e.currentTarget);
  };

  const onKeyDown = (e) => {
    if (e.key === 'v' && (isMac ? e.metaKey : e.ctrlKey)) paste(e);
  };

  return (
    <Card>
      <Card.Header
        icon={<i className="bi bi-chat-square-text-fill" />}
        title="Message"
        action={
          <span id="charCounter" className="text-sm text-text-secondary" style={{ color: counterColor(draft.length) }}>
            {draft.length}/{MAX_MESSAGE_LENGTH}
          </span>
        }
      />
      <Card.Content>
        <textarea
          id="messageInput"
          className="w-full px-[clamp(0.5rem,1vw,0.75rem)] py-[clamp(0.375rem,0.8vh,0.5rem)] bg-bg-elevated rounded-lg focus:outline-none resize-none text-text-primary min-h-[clamp(2.5rem,6vh,4rem)]"
          style={{ border: '2px solid var(--border-default)' }}
          placeholder="Enter message to display..."
          maxLength={MAX_MESSAGE_LENGTH}
          value={draft}
          onInput={(e) => actions.setMessageDraft(e.currentTarget.value)}
          onPaste={paste}
          onKeyDown={onKeyDown}
          aria-label="Display message"
          aria-describedby="charCounter"
        />
        <div className="flex gap-[clamp(0.375rem,0.8vh,0.5rem)] mt-[clamp(0.5rem,1.2vh,0.75rem)]">
          <Button
            id="displayMessage"
            variant="secondary"
            className="flex-1"
            icon={visible ? 'bi-eye-slash-fill' : 'bi-display-fill'}
            aria-pressed={visible}
            aria-label={visible ? 'Hide message on timer' : 'Display message on timer'}
            onClick={() => actions.toggleMessage()}
          >
            {visible ? 'Hide' : 'Display'}
          </Button>
          <Button
            id="clearMessage"
            variant="secondary"
            className="flex-1"
            icon="bi-trash-fill"
            aria-label="Clear displayed message"
            onClick={() => actions.clearMessage()}
          >
            Clear
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}
