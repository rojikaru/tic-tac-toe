'use client';

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Player, GameState } from '@/app/api/games'

interface GameBoardProps {
  roomId: string
}

export function GameBoard({ roomId }: GameBoardProps) {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X")
  const [winner, setWinner] = useState<Player | "Draw" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [assignedPlayer, setAssignedPlayer] = useState<"X" | "O" | null>()
  
  // Join the game when component mounts
  useEffect(() => {
    const joinGame = async () => {
      const response = await fetch(`/api/game/${roomId}/join`, { method: "POST" })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to join game")
      }
      const data = await response.json() as { player: "X" | "O" | null }
      setAssignedPlayer(data.player)
    }
    joinGame().catch((error) => {
      console.error("Error joining game:", error)
      setError(error instanceof Error ? error.message : "Failed to join game")
    })
  }, [roomId])

  // Setup SSE connection to receive game state
  const setupEventSource = useCallback(() => {
    setIsConnecting(true)
    const eventSource = new EventSource(`/api/game/${roomId}`)
    eventSource.onopen = () => {
      setIsConnecting(false)
      setError(null)
    }
    eventSource.onmessage = (event) => {
      try {
        const data: GameState = JSON.parse(event.data)
        setBoard(data.board)
        setCurrentPlayer(data.currentPlayer)
        setWinner(data.winner)
      } catch (error) {
        console.error("Error parsing SSE data:", error)
        setError("Error updating game state")
      }
    }
    eventSource.onerror = (error) => {
      console.error("SSE error:", error)
      setError("Error connecting to game server. Retrying...")
      setIsConnecting(true)
      eventSource.close()
      setTimeout(setupEventSource, 5000)
    }
    return eventSource
  }, [roomId])

  useEffect(() => {
    const eventSource = setupEventSource()
    return () => {
      eventSource.close()
    }
  }, [setupEventSource])

  const handleCellClick = async (index: number) => {
    // Only allow moves when assigned as a player, it's your turn and the cell is free.
    if (board[index] || winner || isConnecting || assignedPlayer !== currentPlayer) return

    try {
      const response = await fetch(`/api/game/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update game state")
      }
      const updatedState = (await response.json()) as GameState
      setBoard(updatedState.board)
      setCurrentPlayer(updatedState.currentPlayer)
      setWinner(updatedState.winner)
    } catch (error) {
      console.error("Error updating game state:", error)
      setError(error instanceof Error ? error.message : "Failed to update game state")
    }
  }

  const handleReset = async () => {
    try {
      const response = await fetch(`/api/game/${roomId}/reset`, {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error("Failed to reset game")
      }
      const updatedState = (await response.json()) as GameState
      setBoard(updatedState.board)
      setCurrentPlayer(updatedState.currentPlayer)
      setWinner(updatedState.winner)
      setError(null)
    } catch (error) {
      console.error("Error resetting game:", error)
      setError(error instanceof Error ? error.message : "Failed to reset game")
    }
  }

  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Room: {roomId}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-center">
          {assignedPlayer === undefined ? "Joining game..." : assignedPlayer ? `You are player ${assignedPlayer}` : "You are a spectator"}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {board.map((cell, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-24 text-4xl"
              onClick={() => handleCellClick(index)}
              disabled={isConnecting || winner !== null || board[index] !== null || assignedPlayer !== currentPlayer}
            >
              {cell}
            </Button>
          ))}
        </div>
        {winner && (
          <div className="mt-4 text-center">
            <div>{winner === "Draw" ? `It\'s a draw!` : `Player ${winner} wins!`}</div>
            {assignedPlayer && (
                <Button onClick={handleReset} className="mt-2" disabled={isConnecting}>
                  Reset Game
                </Button>
            )}
          </div>
        )}
        {!winner && <div className="mt-4 text-center">Current player: {currentPlayer}</div>}
        {error && <div className="mt-4 text-center text-red-500">{error}</div>}
        {isConnecting && <div className="mt-4 text-center text-yellow-500">Connecting to server...</div>}
      </CardContent>
    </Card>
  )
}