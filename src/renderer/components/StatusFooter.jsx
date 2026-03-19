import { h } from 'preact';
import { Card } from './ui';

export function StatusFooter() {
  return (
    <Card className="p-3 text-sm">
      <div className="flex items-center justify-between">
        <span id="statusMessage" className="text-text-secondary"></span>
        <div className="flex items-center gap-3">
          <i id="performanceStatus" className="bi bi-speedometer2" style="color: #4ade80;" title="Performance: Good"></i>
          <i id="cameraStatus" className="bi bi-camera-video text-text-muted" title="Camera Inactive"></i>
          <i id="serverStatus" className="bi bi-broadcast text-text-muted" title="API Server Inactive"></i>
        </div>
      </div>
    </Card>
  );
}
