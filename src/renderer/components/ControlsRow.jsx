import { h } from 'preact';
import { Card, Button } from './ui';

export function ControlsRow() {
  return (
    <Card className="mb-3">
      <Card.Content className="p-3">
        <div className="flex flex-wrap justify-center items-center gap-3">
          <div>
            <Button 
              id="startStop" 
              variant="success" 
              size="xl"
              icon={<i className="bi bi-play-fill text-xl" />}
              aria-label="Start timer" 
              aria-keyshortcut="Space"
            >
              Start
            </Button>
          </div>
          <div>
            <Button 
              id="reset" 
              variant="danger" 
              size="xl"
              icon={<i className="bi bi-arrow-clockwise text-xl" />}
              aria-label="Reset timer" 
              aria-keyshortcut="r"
            >
              Reset
            </Button>
          </div>
          <div>
            <div className="flex flex-col gap-0.5 h-16">
              <Button 
                id="addMinute" 
                variant="secondary"
                className="flex-1 px-4"
                aria-label="Add one minute"
              >
                <i className="bi bi-caret-up-fill text-sm" />
                <span className="text-sm font-semibold">+1</span>
              </Button>
              <Button 
                id="subtractMinute" 
                variant="secondary"
                className="flex-1 px-4"
                aria-label="Subtract one minute"
              >
                <i className="bi bi-caret-down-fill text-sm" />
                <span className="text-sm font-semibold">-1</span>
              </Button>
            </div>
          </div>
          <div>
            <div className="flex flex-col gap-0.5 h-16">
              <Button 
                id="addFive" 
                variant="secondary"
                className="flex-1 px-4"
                aria-label="Add five minutes"
              >
                <i className="bi bi-caret-up-fill text-sm" />
                <span className="text-sm font-semibold">+5</span>
              </Button>
              <Button 
                id="subtractFive" 
                variant="secondary"
                className="flex-1 px-4"
                aria-label="Subtract five minutes"
              >
                <i className="bi bi-caret-down-fill text-sm" />
                <span className="text-sm font-semibold">-5</span>
              </Button>
            </div>
          </div>
          <div>
            <div className="flex flex-col gap-0.5 h-16">
              <Button 
                id="addTen" 
                variant="secondary"
                className="flex-1 px-4"
                aria-label="Add ten minutes"
              >
                <i className="bi bi-caret-up-fill text-sm" />
                <span className="text-sm font-semibold">+10</span>
              </Button>
              <Button 
                id="subtractTen" 
                variant="secondary"
                className="flex-1 px-4"
                aria-label="Subtract ten minutes"
              >
                <i className="bi bi-caret-down-fill text-sm" />
                <span className="text-sm font-semibold">-10</span>
              </Button>
            </div>
          </div>
          <div className="flex items-stretch">
            <div className="w-0.5 h-16 bg-border-strong mx-2" />
          </div>
          <div>
            <Button 
              id="flashButton" 
              variant="secondary"
              size="icon"
              className="h-16 w-16"
              title="Flash screen"
            >
              <i className="bi bi-lightning-fill text-xl" />
            </Button>
          </div>
          <div>
            <Button 
              id="muteSounds" 
              variant="danger"
              size="icon"
              className="h-16 w-16"
              title="Unmute"
            >
              <i className="bi bi-volume-mute-fill text-xl" />
            </Button>
          </div>
          <div>
            <Button 
              id="coverImage" 
              variant="secondary"
              size="icon"
              className="h-16 w-16"
              title="Cover Image"
            >
              <i className="bi bi-image-fill text-xl" />
            </Button>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
