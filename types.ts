export type PlayerId = 'player1' | 'player2' | null;
export type GameMode = 'classic' | 'speed';
export type GameClientType = 'online' | 'local' | null;

export interface Player {
  id: PlayerId;
  name:string;
  hp: number;
  pp: number;
  color: string;
  textColor: string;
  sessionId?: string; 
  isLocalPlayer?: boolean; 
  progress?: number; // For speed mode: completion percentage (0-100)
  totalSolvableCells?: number; // For speed mode: total cells this player needs to solve
}

export interface SudokuCell {
  value: number | null;
  solutionValue: number;
  isInitial: boolean;
  revealedBy: 'player1' | 'player2' | null; 
  isError: boolean;
}

export type SudokuBoard = SudokuCell[][];

export type GameStatus = 'menu' | 'lobby' | 'playing' | 'gameOver'; 

export interface SelectedCell {
  row: number;
  col: number;
}

export type WinReason = 'hp' | 'board' | 'opponentLeft';

export type Difficulty = 'easy' | 'medium' | 'hard'; 

// Types for online multiplayer
export interface GameSession {
  gameId: string;
  mode: GameMode;
  players: { 
    player1: Player;
    player2: Player; 
  };
  
  // Board states - conditional based on mode
  sharedBoard?: SudokuBoard; // For classic mode
  boardPlayer1?: SudokuBoard; // For speed mode P1's board
  boardPlayer2?: SudokuBoard; // For speed mode P2's board
  
  // Completion status for speed mode boards
  completionPlayer1?: boolean; // True if P1 completed their board
  completionPlayer2?: boolean; // True if P2 completed their board

  currentPlayerId: PlayerId; // Used for turns in 'classic'. In 'speed', less critical for moves, can indicate last attacker.
  status: 'waiting' | 'active' | 'finished';
  winner?: PlayerId; // 'player1' or 'player2'
  winReason?: WinReason;
}

export interface PlayerClientInfo {
  playerId: 'player1' | 'player2'; 
  gameId: string;
}

// Example: Messages from Server to Client
export type ServerMessage =
  | { type: 'gameStateUpdate'; payload: GameSession }
  | { type: 'gameJoined'; payload: PlayerClientInfo & { initialState: GameSession } }
  | { type: 'error'; message: string }
  | { type: 'playerAssignment'; payload: { assignedPlayerId: 'player1' | 'player2', gameId: string }};

// Example: Actions from Client to Server
export type ClientAction =
  | { type: 'createGame'; payload: { mode: GameMode } } 
  | { type: 'joinGame'; payload: { gameId: string } } 
  | { type: 'makeMove'; payload: { gameId: string; playerId: 'player1' | 'player2'; row: number; col: number; num: number } }
  | { type: 'attack'; payload: { gameId: string; playerId: 'player1' | 'player2'; } }
  | { type: 'clearInput'; payload: { gameId: string; playerId: 'player1' | 'player2'; row: number; col: number; } };

export type AIAction = 
  | { type: 'attack' }
  | { type: 'placeNumber'; row: number; col: number; num: number }
  | { type: 'pass' };