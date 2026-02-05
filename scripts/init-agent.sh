#!/bin/bash
# Init script that runs as root to fix permissions, then switches to agent user

echo "[Init] Fixing workspace permissions..."
chown -R agent:agent /workspace

echo "[Init] Switching to agent user..."
exec gosu agent /start-agent.sh
