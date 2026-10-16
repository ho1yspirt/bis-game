#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Automated Deployment Script for Sherlock Holmes: The Sepolia Dossier
# Usage:
#   ./deploy.sh                                     # Validate, commit & push
#   ./deploy.sh 0xYourSepoliaContractAddress        # Inject contract address + push
#   ./deploy.sh 0xContractAddress 0xSampleTxHash    # Inject contract & tx hash + push
# ==============================================================================

CONTRACT_ADDR="${1:-}"
SAMPLE_TX="${2:-}"

if [[ -n "$CONTRACT_ADDR" ]]; then
  if [[ ! "$CONTRACT_ADDR" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo "❌ Error: '$CONTRACT_ADDR' is not a valid 40-hex-character Ethereum address (0x...)."
    exit 1
  fi

  echo "🔏 Injecting Sepolia Contract Address ($CONTRACT_ADDR) into app.js and README.md..."
  node -e '
    const fs = require("fs");
    const addr = process.argv[1];
    const tx = process.argv[2] || "";

    // 1. Update DEFAULT_CONTRACT_ADDRESS in app.js
    let appJs = fs.readFileSync("app.js", "utf8");
    appJs = appJs.replace(
      /const DEFAULT_CONTRACT_ADDRESS = "0x[a-fA-F0-9]{40}";/,
      `const DEFAULT_CONTRACT_ADDRESS = "${addr}";`
    );
    fs.writeFileSync("app.js", appJs);

    // 2. Update Sepolia contract address in README.md
    let readme = fs.readFileSync("README.md", "utf8");
    readme = readme.replace(
      /Sepolia līgums:\s*.*/,
      `Sepolia līgums: ${addr}`
    );
    if (tx) {
      readme = readme.replace(
        /Etherscan darījums:\s*.*/,
        `Etherscan darījums: https://sepolia.etherscan.io/tx/${tx}`
      );
    }
    fs.writeFileSync("README.md", readme);
  ' "$CONTRACT_ADDR" "$SAMPLE_TX"
fi

echo "🔍 Validating JavaScript & ABI JSON syntax..."
node --check app.js
node -e 'JSON.parse(require("fs").readFileSync("abi.json", "utf8"));'
echo "✅ Syntax check passed!"

echo "📦 Staging files for GitHub deployment..."
git add .

if git diff --cached --quiet; then
  echo "ℹ️  No file changes to commit. Pushing current branch to origin/main..."
else
  COMMIT_MSG="chore: deploy Sherlock Holmes Sepolia Dossier"
  if [[ -n "$CONTRACT_ADDR" ]]; then
    COMMIT_MSG="feat: bind Sepolia contract ${CONTRACT_ADDR}"
  fi
  git commit -m "$COMMIT_MSG"
fi

echo "🚀 Pushing to GitHub (origin/main)..."
git push origin main

echo ""
echo "=================================================================="
echo "✅ Deployment pushed to GitHub!"
echo "🌐 Repository:   https://github.com/ho1yspirt/bis-game"
echo "🕵️‍♂️ Live Game:    https://ho1yspirt.github.io/bis-game/"
echo "⚙️  Actions CI:   https://github.com/ho1yspirt/bis-game/actions"
echo "=================================================================="
