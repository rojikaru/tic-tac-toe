import { type NextRequest, NextResponse } from 'next/server';
import { GameState } from '@/types';
import { getGame, setGame } from '@/app/api/games';

export async function POST(
  _request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const { roomId } = params;

  const gameState: GameState | null = await getGame(roomId);
  if (!gameState) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  // Ensure players object exists
  gameState.players = gameState.players || {};

  let assignedPlayer: 'X' | 'O' | null = null;
  if (!gameState.players.X) {
    gameState.players.X = true;
    assignedPlayer = 'X';
  } else if (!gameState.players.O) {
    gameState.players.O = true;
    assignedPlayer = 'O';
  }

  // Save the updated game state
  try {
    await setGame(roomId, gameState);
  } catch (error) {
    console.error('Error assigning player:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

  return NextResponse.json({ player: assignedPlayer });
}
