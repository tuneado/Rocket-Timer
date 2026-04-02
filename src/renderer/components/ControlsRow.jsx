/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { Card, Button } from './ui';

export function ControlsRow() {
  return (
    <Card className="mb-[clamp(0.5rem,1.2vh,0.75rem)]">
      <Card.Content className="p-[clamp(0.5rem,1.2vh,0.75rem)]">
        {/* Responsive row: wraps naturally at smaller widths */}
        <div className="flex flex-wrap justify-center items-center gap-[clamp(0.5rem,1.2vh,0.75rem)]">
          <div>
            <Button 
              id="startStop" 
              variant="success" 
              size="xl"
              icon="bi-play-fill"
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
              icon="bi-arrow-clockwise"
              aria-label="Reset timer" 
              aria-keyshortcut="r"
            >
              Reset
            </Button>
          </div>
          <div>
            <div className="flex flex-col gap-[clamp(0.125rem,0.4vh,0.25rem)] h-[clamp(3rem,6vh,4rem)]">
              <Button 
                id="addMinute" 
                variant="secondary"
                className="flex-1 px-[clamp(0.75rem,1.2vw,1rem)]"
                aria-label="Add one minute"
              >
                <i className="bi bi-caret-up-fill text-[clamp(0.75rem,1.5vh,0.875rem)]" />
                <span className="text-[clamp(0.75rem,1.5vh,0.875rem)] font-semibold">+1</span>
              </Button>
              <Button 
                id="subtractMinute" 
                variant="secondary"
                className="flex-1 px-[clamp(0.75rem,1.2vw,1rem)]"
                aria-label="Subtract one minute"
              >
                <i className="bi bi-caret-down-fill text-[clamp(0.75rem,1.5vh,0.875rem)]" />
                <span className="text-[clamp(0.75rem,1.5vh,0.875rem)] font-semibold">-1</span>
              </Button>
            </div>
          </div>
          <div>
            <div className="flex flex-col gap-[clamp(0.125rem,0.4vh,0.25rem)] h-[clamp(3rem,6vh,4rem)]">
              <Button 
                id="addFive" 
                variant="secondary"
                className="flex-1 px-[clamp(0.75rem,1.2vw,1rem)]"
                aria-label="Add five minutes"
              >
                <i className="bi bi-caret-up-fill text-[clamp(0.75rem,1.5vh,0.875rem)]" />
                <span className="text-[clamp(0.75rem,1.5vh,0.875rem)] font-semibold">+5</span>
              </Button>
              <Button 
                id="subtractFive" 
                variant="secondary"
                className="flex-1 px-[clamp(0.75rem,1.2vw,1rem)]"
                aria-label="Subtract five minutes"
              >
                <i className="bi bi-caret-down-fill text-[clamp(0.75rem,1.5vh,0.875rem)]" />
                <span className="text-[clamp(0.75rem,1.5vh,0.875rem)] font-semibold">-5</span>
              </Button>
            </div>
          </div>
          <div>
            <div className="flex flex-col gap-[clamp(0.125rem,0.4vh,0.25rem)] h-[clamp(3rem,6vh,4rem)]">
              <Button 
                id="addTen" 
                variant="secondary"
                className="flex-1 px-[clamp(0.75rem,1.2vw,1rem)]"
                aria-label="Add ten minutes"
              >
                <i className="bi bi-caret-up-fill text-[clamp(0.75rem,1.5vh,0.875rem)]" />
                <span className="text-[clamp(0.75rem,1.5vh,0.875rem)] font-semibold">+10</span>
              </Button>
              <Button 
                id="subtractTen" 
                variant="secondary"
                className="flex-1 px-[clamp(0.75rem,1.2vw,1rem)]"
                aria-label="Subtract ten minutes"
              >
                <i className="bi bi-caret-down-fill text-[clamp(0.75rem,1.5vh,0.875rem)]" />
                <span className="text-[clamp(0.75rem,1.5vh,0.875rem)] font-semibold">-10</span>
              </Button>
            </div>
          </div>
          <div className="flex items-stretch">
            <div className="w-0.5 h-[clamp(3rem,6vh,4rem)] bg-border-strong mx-[clamp(0.375rem,0.8vw,0.5rem)]" />
          </div>
          <div>
            <Button 
              id="flashButton" 
              variant="secondary"
              size="icon"
              className="h-[clamp(3rem,6vh,4rem)] w-[clamp(3rem,6vh,4rem)]"
              title="Flash screen"
            >
              <i className="bi bi-lightning-fill text-[clamp(1rem,2.5vh,1.25rem)]" />
            </Button>
          </div>
          <div>
            <Button 
              id="muteSounds" 
              variant="danger"
              size="icon"
              className="h-[clamp(3rem,6vh,4rem)] w-[clamp(3rem,6vh,4rem)]"
              title="Unmute"
            >
              <i className="bi bi-volume-mute-fill text-[clamp(1rem,2.5vh,1.25rem)]" />
            </Button>
          </div>
          <div>
            <Button 
              id="coverImage" 
              variant="secondary"
              size="icon"
              className="h-[clamp(3rem,6vh,4rem)] w-[clamp(3rem,6vh,4rem)]"
              title="Cover Image"
            >
              <i className="bi bi-image-fill text-[clamp(1rem,2.5vh,1.25rem)]" />
            </Button>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
