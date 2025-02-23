import { NextResponse } from "next/server"
import { setGame } from "../games"

function generateRoomId(length: number): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

export async function POST() {
  const roomId = generateRoomId(6)
  await setGame(roomId, {
    board: Array(9).fill(null),
    currentPlayer: "X",
    winner: null,
    players: {}  // initialize with empty player assignment
  })
  return NextResponse.json({ roomId })
}
