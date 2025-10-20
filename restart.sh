#!/bin/bash
echo "Stopping Electron processes..."
pkill -f electron 2>/dev/null || echo "No Electron processes to stop"
echo "Waiting 2 seconds..."
sleep 2
echo "Starting application..."
npm start