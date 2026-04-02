/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { Card, Select } from './ui';

export function LayoutSelector() {
  return (
    <Card className="mb-0">
      <Card.Header
        icon={<i className="bi bi-layout-three-columns" />}
        title="Canvas Layout"
      />
      <Card.Content>
        <Select
          id="layoutSelector"
          aria-label="Select canvas layout"
        >
          {/* Options populated dynamically from LayoutRegistry */}
        </Select>
      </Card.Content>
    </Card>
  );
}
