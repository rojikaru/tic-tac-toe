'use client';

import { useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { GameState } from '@/types';
import { useGameStore } from '@/lib/stores';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import styles from './game-board.module.css';

type GameStateProps = {
  roomId: string;
};

export function GameBoard({ roomId }: GameStateProps) {
  const {
    board,
    currentPlayer,
    winner,
    error,
    isConnecting,
    assignedPlayer,
    updateGameState,
    resetGame,
  } = useGameStore();

  const joinGame = useMutation<GameState>({
    mutationFn: async () => {
      const response = await fetch(`/api/game/${roomId}/join`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join game');
      }
      return response.json();
    },
    onSuccess: (data) =>
      updateGameState({ assignedPlayer: data.assignedPlayer }),
    onError: (error) => updateGameState({ error: error.message }),
  });

  const makeMove = useMutation({
    mutationFn: async (index: number) => {
      const response = await fetch(`/api/game/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update game state');
      }
    },
    onError: (error) => updateGameState({ error: error.message }),
  });

  const resetGameMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/game/${roomId}/reset`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to reset game');
      resetGame();
    },
    onError: (error) => updateGameState({ error: error.message }),
  });

  const setupEventSource = useCallback(() => {
    updateGameState({ isConnecting: true });
    const eventSource = new EventSource(`/api/game/${roomId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        updateGameState({
          board: data.board,
          currentPlayer: data.currentPlayer,
          winner: data.winner,
          error: null,
          isConnecting: false,
        });
      } catch (error) {
        updateGameState({ error: 'Error updating game state' });
      }
    };

    eventSource.onerror = () => {
      updateGameState({
        error: 'Connection error. Retrying...',
        isConnecting: true,
      });
      eventSource.close();
      setTimeout(setupEventSource, 5000);
    };

    return eventSource;
  }, [roomId, updateGameState]);

  useEffect(() => {
    joinGame.mutate();
    const eventSource = setupEventSource();
    return () => eventSource.close();
  }, [setupEventSource]);

  const handleCellClick = (index: number) => {
    if (
      board[index] ||
      winner ||
      isConnecting ||
      assignedPlayer !== currentPlayer
    )
      return;
    makeMove.mutate(index);
  };

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>Room: {roomId}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={'text-center'}>
          {assignedPlayer === undefined
            ? 'Joining game...'
            : assignedPlayer
              ? `You are player ${assignedPlayer}`
              : 'You are a spectator'}
        </div>
        <div className={styles.grid}>
          {board.map((cell, index) => (
            <Button
              key={index}
              variant='outline'
              className={styles.button}
              onClick={() => handleCellClick(index)}
              disabled={
                isConnecting ||
                winner !== null ||
                board[index] !== null ||
                assignedPlayer !== currentPlayer
              }
            >
              {cell}
            </Button>
          ))}
        </div>
        {winner && (
          <div className={styles.resetButton}>
            <div className={'text-center'}>
              {winner === 'Draw' ? "It's a draw!" : `Player ${winner} wins!`}
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
        {!winner && (
          <div className={'text-center'}>Current player: {currentPlayer}</div>
        )}
        {error && <div className={styles.redText}>{error}</div>}
        {isConnecting && (
          <div className={styles.yellowText}>Connecting to server...</div>
        )}
      </CardContent>
    </Card>
  );
}
