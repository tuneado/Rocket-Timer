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
