import { NextResponse } from 'next/server';
import { GameState } from '@/types';
import { getGame, setGame } from '@/app/api/games';

export async function POST(_request: Request, { params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const existingGame = await getGame(roomId);

  if (!existingGame) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Alternate starting player
  const newStartingPlayer = existingGame.startingPlayer === "X" ? "O" : "X";

  const newGameState: GameState = {
    board: Array(9).fill(null),
    currentPlayer: newStartingPlayer,
    winner: null,
    players: existingGame.players,
    startingPlayer: newStartingPlayer,
    history: [Array(9).fill(null)],
    moves: [],
  };

  await setGame(roomId, newGameState);
  return NextResponse.json(newGameState);
}
