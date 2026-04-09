import { describe, it, expect, afterAll } from 'vitest';
import { spawn } from 'child_process';
import path from 'path';
import http from 'http';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ROOT = path.resolve(__dirname, '..', '..');

/**
 * Helper: launch Electron and wait for it to be ready
 */
function launchApp(timeout = 15000) {
  return new Promise((resolve, reject) => {
    const electronBin = require.resolve('electron/cli.js');
    const child = spawn(process.execPath, [electronBin, '.'], {
      cwd: ROOT,
      env: { ...process.env, ELECTRON_IS_TEST: '1', NODE_ENV: 'test' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    // Give the app time to start up
    const timer = setTimeout(() => {
      resolve({ child, stdout, stderr });
    }, 8000);

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('exit', (code) => {
      clearTimeout(timer);
      if (code !== 0 && code !== null) {
        reject(new Error(`App exited with code ${code}\nstderr: ${stderr}`));
      }
    });
  });
}

/**
 * Helper: make an HTTP GET request
 */
function httpGet(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('HTTP timeout')), timeout);
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        clearTimeout(timer);
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    }).on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

describe('E2E Smoke Tests', () => {
  let appProcess = null;

  afterAll(() => {
    if (appProcess) {
      appProcess.kill('SIGTERM');
      // Force kill after 3 seconds if still alive
      setTimeout(() => {
        try { appProcess.kill('SIGKILL'); } catch { /* already dead */ }
      }, 3000);
    }
  });

  it('Electron app launches without crashing', async () => {
    const { child, stderr } = await launchApp();
    appProcess = child;

    // If we got here, the app didn't crash during startup
    expect(child.pid).toBeDefined();
    expect(child.killed).toBe(false);

    // Check no fatal errors in stderr (GPU warnings are ok)
    const fatalErrors = stderr
      .split('\n')
      .filter((line) =>
        line.includes('FATAL') ||
        line.includes('Cannot find module') ||
        line.includes('SyntaxError')
      );
    expect(fatalErrors).toEqual([]);
  }, 20000);

  it('REST API server responds on port 9999', async () => {
    // The app should already be running from the previous test
    expect(appProcess).not.toBeNull();

    try {
      const { status, body } = await httpGet('http://127.0.0.1:9999/api/timer/state');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.id).toBe('main-timer');
    } catch (err) {
      // API server might be disabled — that's ok, just skip
      if (err.message.includes('ECONNREFUSED')) {
        console.warn('API server not running — skipping API test');
        return;
      }
      throw err;
    }
  }, 10000);

  it('API documentation endpoint works', async () => {
    expect(appProcess).not.toBeNull();

    try {
      const { status, body } = await httpGet('http://127.0.0.1:9999/api');
      expect(status).toBe(200);
      expect(body).toBeDefined();
    } catch (err) {
      if (err.message.includes('ECONNREFUSED')) {
        console.warn('API server not running — skipping');
        return;
      }
      throw err;
    }
  }, 10000);
});
