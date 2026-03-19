import { h } from 'preact';
import { Card, Button } from './ui';

export function MessageCard() {
  return (
    <Card>
      <Card.Header
        icon={<i className="bi bi-chat-square-text-fill" />}
        title="Message"
        action={<span id="charCounter" className="text-sm text-text-secondary">0/100</span>}
      />
      <Card.Content>
        <textarea 
          id="messageInput" 
          className="w-full px-[clamp(0.5rem,1vw,0.75rem)] py-[clamp(0.375rem,0.8vh,0.5rem)] bg-bg-elevated rounded-lg focus:outline-none resize-none text-text-primary min-h-[clamp(2.5rem,6vh,4rem)]" 
          style={{ border: '2px solid var(--border-default)' }}
          placeholder="Enter message to display..." 
          maxLength="100" 
          aria-label="Display message"
          aria-describedby="charCounter"
        />
        <div className="flex gap-[clamp(0.375rem,0.8vh,0.5rem)] mt-[clamp(0.5rem,1.2vh,0.75rem)]">
          <Button 
            id="displayMessage" 
            variant="secondary"
            className="flex-1"
            icon="bi-display-fill"
            aria-label="Display message on timer"
          >
            Display
          </Button>
          <Button 
            id="clearMessage" 
            variant="secondary"
            className="flex-1"
            icon="bi-trash-fill"
            aria-label="Clear displayed message"
          >
            Clear
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}
