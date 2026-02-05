#!/bin/bash
set -e

echo "=============================================="
echo "Agentic Task Agent - Startup"
echo "=============================================="
echo "[Setup] Running as user: $(whoami) (UID: $(id -u))"

# Unset any sudo-related environment variables
unset SUDO_USER SUDO_UID SUDO_GID SUDO_COMMAND

# Configure git
echo "[Setup] Configuring git..."
git config --global user.email "${GIT_USER_EMAIL:-agent@agentic.local}"
git config --global user.name "${GIT_USER_NAME:-Agentic Agent}"
git config --global init.defaultBranch main
git config --global --add safe.directory /workspace/repo

# Verify GitHub CLI authentication
if [ -n "$GH_TOKEN" ]; then
    echo "[Setup] GH_TOKEN is set, verifying GitHub CLI access..."
    gh auth status || echo "[Warning] GitHub auth status check failed, but GH_TOKEN is set so it should work"
else
    echo "[Warning] GH_TOKEN not set - PR creation will fail"
fi

# Clone or update target repository
if [ -n "$TARGET_REPO_URL" ]; then
    echo "[Setup] Setting up target repository..."

    if [ -d "/workspace/repo/.git" ]; then
        echo "[Setup] Repository exists, checking ownership..."
        # Try to access the repo, if it fails due to ownership, remove and re-clone
        if cd /workspace/repo && git status > /dev/null 2>&1; then
            echo "[Setup] Repository accessible, pulling latest..."
            git fetch --all
            git checkout "${TARGET_REPO_BRANCH:-master}"
            git pull origin "${TARGET_REPO_BRANCH:-master}" || true
        else
            echo "[Setup] Repository has ownership issues, removing and re-cloning..."
            rm -rf /workspace/repo
        fi
    fi

    if [ ! -d "/workspace/repo/.git" ]; then
        echo "[Setup] Cloning repository..."
        # Use GH_TOKEN for authentication if available
        if [ -n "$GH_TOKEN" ]; then
            # Extract repo path from URL and use gh to clone
            REPO_PATH=$(echo "$TARGET_REPO_URL" | sed -E 's|https://github.com/||' | sed -E 's|\.git$||')
            gh repo clone "$REPO_PATH" /workspace/repo
        else
            git clone "$TARGET_REPO_URL" /workspace/repo
        fi
        cd /workspace/repo
        git checkout "${TARGET_REPO_BRANCH:-master}"
    fi

    echo "[Setup] Repository ready at /workspace/repo"
    ls -la /workspace/repo
else
    echo "[Error] TARGET_REPO_URL not set!"
    echo "Please set TARGET_REPO_URL to the repository the agent should work on."
    exit 1
fi

# Start the agent
echo ""
echo "[Setup] Starting agent..."
cd /app
exec npm run agent
