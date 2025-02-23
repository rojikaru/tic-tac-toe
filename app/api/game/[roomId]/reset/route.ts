import { NextResponse } from "next/server"
import { getGame, setGame, type GameState } from "../../../games"

export async function POST(request: Request, { params }: { params: { roomId: string } }) {
  const { roomId } = params

  const existingGame = await getGame(roomId)

  if (!existingGame) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 })
  }

  const newGameState: GameState = {
    board: Array(9).fill(null),
    currentPlayer: "X",
    winner: null,
  }

  await setGame(roomId, newGameState)

  return NextResponse.json(newGameState)
}

