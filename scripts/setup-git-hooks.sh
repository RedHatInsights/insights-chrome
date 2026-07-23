#!/bin/bash

# Setup script to install git hooks for local development
# Run this after cloning the repository: ./scripts/setup-git-hooks.sh

HOOKS_DIR=".git/hooks"
SCRIPT_DIR="scripts"

echo "🔧 Setting up git hooks..."

# Ensure we're in the repo root
if [ ! -d ".git" ]; then
  echo "❌ Error: Not in a git repository root"
  echo "Please run this script from the repository root directory"
  exit 1
fi

# Create pre-push hook symlink
if [ -f "$HOOKS_DIR/pre-push" ]; then
  echo "⚠️  Pre-push hook already exists. Backing up to pre-push.backup"
  mv "$HOOKS_DIR/pre-push" "$HOOKS_DIR/pre-push.backup"
fi

# Create the hook that calls our script
cat > "$HOOKS_DIR/pre-push" << 'EOF'
#!/bin/bash

# Git pre-push hook that runs validation checks
# To skip: git push --no-verify

# Get the directory where this hook lives
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HOOK_DIR/../.." && pwd)"

# Run the pre-push check script
cd "$REPO_ROOT"
exec ./scripts/pre-push-check.sh
EOF

chmod +x "$HOOKS_DIR/pre-push"

echo "✅ Git hooks installed successfully!"
echo ""
echo "The following hooks are now active:"
echo "  • pre-push - Runs lint, build, and tests before pushing"
echo ""
echo "To skip hooks temporarily, use:"
echo "  git push --no-verify"
echo ""
