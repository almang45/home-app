#!/bin/bash

# Setup script for Home-App systemd service
# This script installs and enables the systemd user service for Home-App

set -e

echo "=== Home-App Systemd Service Setup ==="
echo

# Create user systemd directory if it doesn't exist
mkdir -p ~/.config/systemd/user/

# Copy service file
echo "Installing home-app-frontend.service..."
cp home-app-frontend.service ~/.config/systemd/user/

# Reload systemd daemon
echo "Reloading systemd daemon..."
systemctl --user daemon-reload

# Enable the service to start on login
echo "Enabling home-app-frontend.service..."
systemctl --user enable home-app-frontend.service

echo
echo "=== Setup Complete! ==="
echo
echo "Available commands:"
echo "  Start service:       systemctl --user start home-app-frontend.service"
echo "  Stop service:        systemctl --user stop home-app-frontend.service"
echo "  Restart service:     systemctl --user restart home-app-frontend.service"
echo "  Check status:        systemctl --user status home-app-frontend.service"
echo "  View logs:           journalctl --user -u home-app-frontend.service -f"
echo "  Disable auto-start:  systemctl --user disable home-app-frontend.service"
echo
echo "The service will now start automatically when you log in to your desktop."
echo
read -p "Would you like to start the service now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting home-app-frontend.service..."
    systemctl --user start home-app-frontend.service
    echo
    echo "Service started! Check status with:"
    echo "  systemctl --user status home-app-frontend.service"
fi
