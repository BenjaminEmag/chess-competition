#include <emscripten/bind.h>
#include "chess-simulator.h"

EMSCRIPTEN_BINDINGS(chess_module) {
    emscripten::function("move", &ChessSimulator::Move);
}
