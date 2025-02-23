import { GameState, Player } from "@/types";
import { redis } from "./db";

export async function getGame(roomId: string): Promise<GameState | null> {
  try {
    const gameState = await redis.get(`game:${roomId}`)
    return gameState ? JSON.parse(gameState) : null
  } catch (error) {
    console.error("Error getting game state:", error)
    return null
  }
}

export async function setGame(roomId: string, gameState: GameState): Promise<void> {
  try {
    // Set expiration to 24 hours to prevent stale games from accumulating
    await redis.set(`game:${roomId}`, JSON.stringify(gameState), "EX", 24 * 60 * 60)
  } catch (error) {
    console.error("Error setting game state:", error)
    throw new Error("Failed to save game state")
  }
}

export function checkWinner(board: Player[]): Player | "Draw" | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]
    }
  }

  if (board.every((cell) => cell !== null)) {
    return "Draw"
  }

  return null
}

