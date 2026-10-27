/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { Card, Select } from './ui';
import { useAppState } from './useAppState.js';
import actions from '../js/mainActions.js';

export function LayoutSelector() {
  const layouts = useAppState('ui.layouts');
  const current = useAppState('layout.current');

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
          value={current}
          onChange={(e) => actions.changeLayout(e.currentTarget.value)}
        >
          {layouts.map(({ id, name }) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </Select>
      </Card.Content>
    </Card>
  );
}
