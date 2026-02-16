#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
EMSDK_DIR="${PROJECT_DIR}/emsdk"
BUILD_DIR="${PROJECT_DIR}/build-wasm"

# ---------- 1. Download the latest emsdk ----------
if [ ! -d "$EMSDK_DIR" ]; then
    echo ">>> Cloning emsdk..."
    git clone https://github.com/emscripten-core/emsdk.git "$EMSDK_DIR"
else
    echo ">>> Updating emsdk..."
    git -C "$EMSDK_DIR" pull
fi

# ---------- 2. Install & activate the latest Emscripten ----------
echo ">>> Installing latest Emscripten..."
"$EMSDK_DIR/emsdk" install latest
"$EMSDK_DIR/emsdk" activate latest
source "$EMSDK_DIR/emsdk_env.sh"

# Remove Emscripten's fake SDL headers that conflict with our real SDL2
find "$EMSDK_DIR" -path "*/fakesdl*" -type d -exec rm -rf {} + || true

emcc --version

# ---------- 3. Configure & build all targets ----------
echo ">>> Configuring CMake with Emscripten..."
emcmake cmake -S "$PROJECT_DIR" -B "$BUILD_DIR" -DCMAKE_BUILD_TYPE=Release

echo ">>> Building..."
cmake --build "$BUILD_DIR" --parallel

# ---------- 4. Collect output ----------
echo ""
echo "=== Build complete ==="
echo "GUI  : ${BUILD_DIR}/chessgui.html  (+ .js, .wasm)"
echo "CLI  : ${BUILD_DIR}/chesscli.html  (+ .js, .wasm)"
echo "Lib  : ${BUILD_DIR}/chesswasm.js   (+ .wasm)"
echo ""
echo "To serve locally:"
echo "  cd ${BUILD_DIR} && python3 -m http.server 8080"
