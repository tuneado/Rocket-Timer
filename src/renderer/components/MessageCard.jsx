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
          className="w-full px-3 py-2 bg-bg-elevated border-2 border-border-default rounded-lg focus:border-accent-primary focus:outline-none resize-none text-text-primary" 
          placeholder="Enter message to display..." 
          maxLength="100" 
          rows="2"
          aria-label="Display message"
          aria-describedby="charCounter"
        />
        <div className="flex gap-2 mt-3">
          <Button 
            id="displayMessage" 
            variant="secondary"
            className="flex-1"
            icon={<i className="bi bi-display-fill" />}
            aria-label="Display message on timer"
          >
            Display
          </Button>
          <Button 
            id="clearMessage" 
            variant="secondary"
            className="flex-1"
            icon={<i className="bi bi-trash-fill" />}
            aria-label="Clear displayed message"
          >
            Clear
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}
