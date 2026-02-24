#pragma once
#include <string>

namespace ChessSimulator {
/**
 * @brief Move a piece on the board
 *
 * @param fen The board as FEN
 * @param timeLimitMs The time limit for the move in milliseconds
 * @return std::string The move as UCI
 */
std::string Move(std::string fen, int timeLimitMs = 10000);
} // namespace ChessSimulator