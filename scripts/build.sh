#!/usr/bin/env bash
# dsh-dafeiyu-chan — host build.
# Strategy (from the dsh-plugins build research): the machine has no full dsh
# source checkout (only harness CLI + a bare packages/core), so instead of the
# scaffold's checkout-linked build.sh we junction this plugin's
# node_modules/@deepseek-ai onto the harness CLI's installed @deepseek-ai tree,
# where every type package (cordis, dsh-host-webserver, dsh-llm, ...) ships as
# compiled .d.ts. Then we run the harness TypeScript compiler over src/ -> lib/.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ── 1. Locate the harness CLI install tree (source of @deepseek-ai types) ──
HARNESS_HOST="${HARNESS_HOST:-}"
if [ -z "$HARNESS_HOST" ]; then
  for candidate in \
    "$LOCALAPPDATA/npm/node_modules/@deepseek-ai/dsh" \
    "$APPDATA/npm/node_modules/@deepseek-ai/dsh" \
    "$HOME/AppData/Roaming/npm/node_modules/@deepseek-ai/dsh"; do
    if [ -n "$candidate" ] && [ -d "$candidate/node_modules/@deepseek-ai" ]; then HARNESS_HOST="$candidate"; break; fi
  done
fi
if [ -z "$HARNESS_HOST" ] || [ ! -d "$HARNESS_HOST/node_modules/@deepseek-ai" ]; then
  echo "build: cannot locate harness CLI @deepseek-ai tree (set HARNESS_HOST)" >&2
  exit 1
fi
SRC_AI="$HARNESS_HOST/node_modules/@deepseek-ai"

# ── 2. Junction plugin node_modules/@deepseek-ai -> harness tree ──
mkdir -p node_modules
node -e "
  const fs = require('fs'); const path = require('path');
  const link = path.resolve('node_modules/@deepseek-ai');
  const target = path.resolve(process.argv[1]);
  fs.rmSync(link, { recursive: true, force: true });
  fs.symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir');
  console.log('linked node_modules/@deepseek-ai ->', target);
" "$SRC_AI"

# Also junction @types/node + bare types the tsc needs if absent.
node -e "
  const fs = require('fs'); const path = require('path');
  function link(name, target) {
    const l = path.resolve('node_modules/' + name);
    if (fs.existsSync(l)) return;
    fs.symlinkSync(target, l, 'junction');
  }
  link('@types', '$HARNESS_HOST/node_modules/@types');
" 2>/dev/null || true

# ── 3. Compile host (src -> lib) with the harness TypeScript compiler ──
TSC="$(cd "$ROOT" && node -e "const p=require('path');console.log(p.resolve('$HARNESS_HOST/node_modules/typescript'))" 2>/dev/null)/bin/tsc"
if [ ! -f "$(echo "$TSC" | sed 's#\\\\#/#g')" ] && [ ! -f "$TSC.cmd" ]; then
  # Fall back to a harness checkout tsc next to the plugin repo, if present.
  for checkout in "$ROOT/../dsh-harness/node_modules/.bin/tsc" "$HOME/dsh-harness/node_modules/.bin/tsc"; do
    if [ -f "$checkout" ] || [ -f "$checkout.cmd" ]; then TSC="$checkout"; break; fi
  done
fi
if [ ! -f "$TSC" ] && [ ! -f "$TSC.cmd" ]; then
  echo "build: TypeScript compiler not found" >&2
  exit 1
fi
echo "=== Compiling src -> lib (tsc: $TSC) ==="
# tsconfig.host.json excludes src/client (client bundle is built by tsdown separately).
"$TSC" -p tsconfig.host.json
echo "=== Host build complete ==="
