'use client';

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import type { Player, GameState } from '@/types'

import styles from './game-board.module.css';

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
      const body = await response.json()
      if (!response.ok) {
        setError(body.error || "Failed to update game state")
      }
      const updatedState = body as GameState
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
        setError("Failed to reset game");
        return;
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
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Room: {roomId}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={'text-center'}>
            {assignedPlayer === undefined ? "Joining game..." :
                assignedPlayer ? `You are player ${assignedPlayer}` : "You are a spectator"}
          </div>
          <div className={styles.grid}>
            {board.map((cell, index) => (
                <Button
                    key={index}
                    variant="outline"
                    className={styles.button}
                    onClick={() => handleCellClick(index)}
                    disabled={isConnecting || winner !== null || board[index] !== null || assignedPlayer !== currentPlayer}
                >
                  {cell}
                </Button>
            ))}
          </div>
          {winner && (
              <div className={styles.resetButton}>
                <div className={'text-center'}>
                  {winner === "Draw" ? "It's a draw!" : `Player ${winner} wins!`}
                </div>
                {assignedPlayer && (
                    <Button
                        onClick={() => resetGameMutation.mutate()}
                        className={styles.resetButton}
                        disabled={isConnecting}
                    >
                      Reset Game
                    </Button>
                )}
              </div>
          )}
          {!winner && <div className={'text-center'}>Current player: {currentPlayer}</div>}
          {error && <div className={styles.redText}>{error}</div>}
          {isConnecting && <div className={styles.yellowText}>Connecting to server...</div>}
        </CardContent>
      </Card>
  );
}