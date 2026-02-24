#include <emscripten/bind.h>
#include "chess-simulator.h"
#include <string>

std::string safe_move(const std::string& fen, int timeLimitMs) {
#ifdef CHESS_HAS_TIME_LIMIT
    return ChessSimulator::Move(fen, timeLimitMs);
#else
    (void)timeLimitMs;
    return ChessSimulator::Move(fen);
#endif
}

EMSCRIPTEN_BINDINGS(chess_module) {
    emscripten::function("move", &safe_move);
}
