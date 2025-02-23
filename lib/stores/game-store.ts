import { create } from 'zustand';
import type { GameState } from '@/types';

interface StoreState extends GameState {
    isConnecting: boolean;
    error: string | null;
}

interface GameActions {
    updateGameState: (state: Partial<StoreState>) => void;
    resetGame: () => void;
}

const initialState: StoreState = {
    board: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
    assignedPlayer: undefined,
    isConnecting: false,
    error: null,
};

export const useGameStore = create<StoreState & GameActions>((set) => ({
    ...initialState,
    updateGameState: (newState) => set((state) => ({ ...state, ...newState })),
    resetGame: () => set(initialState),
}));
