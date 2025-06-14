export type Player = 'X' | 'O' | null;
export type GameState = {
  board: Player[];
  currentPlayer: Player;
  winner: Player | 'Draw' | null;
  players?: { X?: boolean; O?: boolean }; // added players tracking
  assignedPlayer?: Player;
  startingPlayer: Player;
  history: Player[][];
  moves: Array<{ player: Player; index: number }>;
};
