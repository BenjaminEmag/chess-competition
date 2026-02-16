#include "chess-simulator.h"
// disservin's lib. drop a star on his hard work!
// https://github.com/Disservin/chess-library
#include "chess.hpp"
#include <algorithm>
#include <chrono>


// https://www.chessprogramming.org/Simplified_Evaluation_Function
using namespace ChessSimulator;

// Values in centiPawns
// P = 100
// N = 320
// B = 330
// R = 500
// Q = 900
// K = 20000
static constexpr int PIECE_VAL[6] = { 100, 320, 330, 500, 900, 20000 };

const int PAWN_TABLE[64]{
0,  0,  0,  0,  0,  0,  0,  0,
50, 50, 50, 50, 50, 50, 50, 50,
10, 10, 20, 30, 30, 20, 10, 10,
 5,  5, 10, 25, 25, 10,  5,  5,
 0,  0,  0, 20, 20,  0,  0,  0,
 5, -5,-10,  0,  0,-10, -5,  5,
 5, 10, 10,-20,-20, 10, 10,  5,
 0,  0,  0,  0,  0,  0,  0,  0 };

const int KNIGHT_TABLE[64]{
-50,-40,-30,-30,-30,-30,-40,-50,
-40,-20,  0,  0,  0,  0,-20,-40,
-30,  0, 10, 15, 15, 10,  0,-30,
-30,  5, 15, 20, 20, 15,  5,-30,
-30,  0, 15, 20, 20, 15,  0,-30,
-30,  5, 10, 15, 15, 10,  5,-30,
-40,-20,  0,  5,  5,  0,-20,-40,
-50,-40,-30,-30,-30,-30,-40,-50, };

const int BISHOP_TABLE[64]{
-20,-10,-10,-10,-10,-10,-10,-20,
-10,  0,  0,  0,  0,  0,  0,-10,
-10,  0,  5, 10, 10,  5,  0,-10,
-10,  5,  5, 10, 10,  5,  5,-10,
-10,  0, 10, 10, 10, 10,  0,-10,
-10, 10, 10, 10, 10, 10, 10,-10,
-10,  5,  0,  0,  0,  0,  5,-10,
-20,-10,-10,-10,-10,-10,-10,-20, };

const int ROOK_TABLE[64]{
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0 };

const int QUEEN_TABLE[64]{
-20,-10,-10, -5, -5,-10,-10,-20,
-10,  0,  0,  0,  0,  0,  0,-10,
-10,  0,  5,  5,  5,  5,  0,-10,
 -5,  0,  5,  5,  5,  5,  0, -5,
  0,  0,  5,  5,  5,  5,  0, -5,
-10,  5,  5,  5,  5,  5,  0,-10,
-10,  0,  5,  0,  0,  0,  0,-10,
-20,-10,-10, -5, -5,-10,-10,-20 };

const int KING_MIDDLE_GAME[64]{
-30,-40,-40,-50,-50,-40,-40,-30,
-30,-40,-40,-50,-50,-40,-40,-30,
-30,-40,-40,-50,-50,-40,-40,-30,
-30,-40,-40,-50,-50,-40,-40,-30,
-20,-30,-30,-40,-40,-30,-30,-20,
-10,-20,-20,-20,-20,-20,-20,-10,
 20, 20,  0,  0,  0,  0, 20, 20,
 20, 30, 10,  0,  0, 10, 30, 20, };

const int KING_END_GAME[64]{
-50,-40,-30,-20,-20,-30,-40,-50,
-30,-20,-10,  0,  0,-10,-20,-30,
-30,-10, 20, 30, 30, 20,-10,-30,
-30,-10, 30, 40, 40, 30,-10,-30,
-30,-10, 30, 40, 40, 30,-10,-30,
-30,-10, 20, 30, 30, 20,-10,-30,
-30,-30,  0,  0,  0,  0,-30,-30,
-50,-30,-30,-30,-30,-30,-30,-50 };

static const int* PieceSquareTables[5] = { PAWN_TABLE, KNIGHT_TABLE, BISHOP_TABLE, ROOK_TABLE, QUEEN_TABLE };

static inline int mirror(int sq) { return sq ^ 56; }

static bool isEndGame(const chess::Board& board) {
	// No queens
	bool wq = board.pieces(chess::PieceType::QUEEN, chess::Color::WHITE).count() > 0;
	bool bq = board.pieces(chess::PieceType::QUEEN, chess::Color::BLACK).count() > 0;
	if (!wq && !bq) return true;

	//  minor peice count
	int wMinor = board.pieces(chess::PieceType::KNIGHT, chess::Color::WHITE).count()
		+ board.pieces(chess::PieceType::BISHOP, chess::Color::WHITE).count()
		+ board.pieces(chess::PieceType::ROOK, chess::Color::WHITE).count();
	int bMinor = board.pieces(chess::PieceType::KNIGHT, chess::Color::BLACK).count()
		+ board.pieces(chess::PieceType::BISHOP, chess::Color::BLACK).count()
		+ board.pieces(chess::PieceType::ROOK, chess::Color::BLACK).count();

	if (wq && wMinor <= 1 && bq && bMinor <= 1) return true; // both queens plus 0-1 minor pieces
	if (!wq && wMinor <= 2 && !bq && bMinor <= 2) return true; // no queens and only 0-2 minor pieces

	return false;
}

static int evaluate(const chess::Board& board) {
	int score = 0;

	if (board.isHalfMoveDraw()) return 0;
	if (board.isInsufficientMaterial()) return 0;

	for (int pt = 0; pt < 5; pt++)
	{
		auto type = static_cast<chess::PieceType::underlying>(pt);

		chess::Bitboard wb = board.pieces(type, chess::Color::WHITE);
		while (wb)
		{
			int sq = wb.pop();
			score += PIECE_VAL[pt] + PieceSquareTables[pt][sq];
		}

		chess::Bitboard bb = board.pieces(type, chess::Color::BLACK);
		while (bb)
		{
			int sq = bb.pop();
			score -= PIECE_VAL[pt] + PieceSquareTables[pt][mirror(sq)];
		}
	}

	int wk = board.kingSq(chess::Color::WHITE).index();
	int bk = board.kingSq(chess::Color::BLACK).index();

	if (isEndGame(board))
	{
		score += KING_END_GAME[wk];
		score -= KING_END_GAME[mirror(bk)];
	}
	else
	{
		score += KING_MIDDLE_GAME[wk];
		score -= KING_MIDDLE_GAME[mirror(bk)];
	}

	return score;
}

static constexpr int TIME_LIMIT_MS = 4500;

static std::chrono::steady_clock::time_point searchStart;
static bool timeUp;
static int nodeCount;

static void checkTime()
{
	auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now() - searchStart).count();

	if (elapsed >= TIME_LIMIT_MS)
		timeUp = true;
}

static bool compareMoves(const chess::Move& a, const chess::Move& b)
{
	return a.score() > b.score();
}

static void orderMoves(chess::Movelist& moves, const chess::Board& board) {
	for (int i = 0; i < moves.size(); i++)
	{
		int score = 0;
		if (board.isCapture(moves[i]))
		{
			// Make captures more incentivized
			int victim = PIECE_VAL[static_cast<int>(board.at<chess::PieceType>(moves[i].to()))];
			int attacker = PIECE_VAL[static_cast<int>(board.at<chess::PieceType>(moves[i].from()))];
			score = 10000 + victim - attacker;
		}

		// Make promotion more incentivized
		if (moves[i].typeOf() == chess::Move::PROMOTION)
		{
			score = 20000;
		}
		moves[i].setScore(score);
	}
	std::sort(moves.begin(), moves.end(), compareMoves);
}

static const int INF = 999999;
static const int MATE = 100000;

static int minimax(chess::Board& board, int depth, int alpha, int beta, bool isMaximizing, int ply) {
	checkTime();
	if (timeUp) return evaluate(board);

	chess::Movelist moves;
	chess::movegen::legalmoves(moves, board);

	orderMoves(moves, board);

	if (moves.size() == 0)
	{
		if (board.inCheck())
		{
			if (isMaximizing)
			{
				// checkmate bad for white
				return -(MATE - ply);
			}
			else
			{
				// checkmate good for white
				return (MATE - ply);
			}
		}
		return 0;
	}

	if (depth == 0) return evaluate(board);

	if (isMaximizing)
	{
		int bestValue = -INF;

		for (int i = 0; i < moves.size(); i++)
		{
			board.makeMove(moves[i]);
			int value = minimax(board, depth - 1, alpha, beta, false, ply + 1);
			board.unmakeMove(moves[i]);

			if (timeUp) return 0;

			bestValue = std::max(bestValue, value);
			alpha = std::max(alpha, bestValue);

			if (beta <= alpha) break;
		}

		return bestValue;
	}
	else
	{
		int bestValue = INF;

		for (int i = 0; i < moves.size(); i++) {
			board.makeMove(moves[i]);
			int value = minimax(board, depth - 1, alpha, beta, true, ply + 1);
			board.unmakeMove(moves[i]);

			if (timeUp) return 0;

			bestValue = std::min(bestValue, value);
			beta = std::min(beta, bestValue);

			if (beta <= alpha) break;
		}

		return bestValue;
	}
}

std::string ChessSimulator::Move(std::string fen) {
	chess::Board board(fen);
	chess::Movelist moves;
	chess::movegen::legalmoves(moves, board);

	if (moves.size() == 0) return "";
	if (moves.size() == 1) return chess::uci::moveToUci(moves[0]);

	searchStart = std::chrono::steady_clock::now();
	timeUp = false;
	nodeCount = 0;

	bool weAreWhite = (board.sideToMove() == chess::Color::WHITE);

	chess::Move bestMove = moves[0];

	for (int depth = 1; depth <= 64; depth++) {
		chess::Move depthBestMove = moves[0];
		int depthBestScore = weAreWhite ? -INF : INF;

		for (int i = 0; i < moves.size(); i++) {
			board.makeMove(moves[i]);

			int score;
			if (weAreWhite)
			{
				score = minimax(board, depth - 1, depthBestScore, INF, false, 1);
			}
			else
			{
				score = minimax(board, depth - 1, -INF, depthBestScore, true, 1);
			}

			board.unmakeMove(moves[i]);

			if (timeUp) break;

			if (weAreWhite)
			{
				if (score > depthBestScore)
				{
					depthBestScore = score;
					depthBestMove = moves[i];
				}
			}
			else
			{
				if (score < depthBestScore)
				{
					depthBestScore = score;
					depthBestMove = moves[i];
				}
			}
		}

		if (timeUp) break;

		bestMove = depthBestMove;

		if (depthBestScore > (MATE / 2) || depthBestScore < (-MATE / 2)) break;
	}

	return chess::uci::moveToUci(bestMove);
}