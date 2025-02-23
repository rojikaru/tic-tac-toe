import { GameBoard } from "@/components/game-board"

export default function GamePage({ params }: { params: { roomId: string } }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <GameBoard roomId={params.roomId} />
    </main>
  )
}

