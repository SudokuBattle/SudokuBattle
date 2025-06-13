
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameStatus, Player, WinReason, GameSession, PlayerId, GameMode, SudokuBoard, GameClientType } from './types';
import MainMenu from './components/MainMenu';
import GameBoard from './components/GameBoard';
import GameOverScreen from './components/GameOverScreen';
import { INITIAL_HP, PP_PER_CORRECT_REVEAL, ATTACK_COST_PP, ATTACK_DAMAGE } from './constants';
import gameService from './services/gameService'; 
import { createInitialBoard, isBoardComplete } from './services/sudokuService';

const player1Template: Omit<Player, 'id' | 'isLocalPlayer' | 'sessionId' | 'progress' | 'totalSolvableCells'> = { name: 'Player 1', hp: INITIAL_HP, pp: 0, color: 'bg-blue-600', textColor: 'text-blue-300' };
const player2Template: Omit<Player, 'id' | 'isLocalPlayer' | 'sessionId' | 'progress' | 'totalSolvableCells'> = { name: 'Player 2', hp: INITIAL_HP, pp: 0, color: 'bg-red-600', textColor: 'text-red-300' };

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>('menu');
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<PlayerId>(null); // For online: identifies this client
  const [winnerDetails, setWinnerDetails] = useState<{ name: string; reason: WinReason } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentGameType, setCurrentGameType] = useState<GameClientType>(null);
  
  const activelyCreatingGameIdRef = useRef<string | null>(null);

  const getGameIdFromHash = useCallback(() => {
    if (window.location.hash && window.location.hash.startsWith('#gameId=')) {
      return window.location.hash.substring('#gameId='.length);
    }
    return null;
  }, []);

  useEffect(() => {
    let unsubscribeGameState: (() => void) | null = null;
    let unsubscribeError: (() => void) | null = null;
    let unsubscribePlayerAssignment: (() => void) | null = null;

    const handleOnlineGameUpdate = (newSessionState: GameSession) => {
      console.log('App: Received game state update (online):', newSessionState);
      setGameSession(newSessionState);
      if (newSessionState.status === 'finished' && newSessionState.winner && newSessionState.players[newSessionState.winner]) {
        const winningPlayer = newSessionState.players[newSessionState.winner];
        setWinnerDetails({ name: winningPlayer.name, reason: newSessionState.winReason || 'opponentLeft' });
        setGameStatus('gameOver');
        activelyCreatingGameIdRef.current = null; 
      } else if (newSessionState.status === 'active') {
        setGameStatus('playing');
        if (activelyCreatingGameIdRef.current === newSessionState.gameId) {
            activelyCreatingGameIdRef.current = null;
        }
      } else if (newSessionState.status === 'waiting') {
        setGameStatus('lobby');
      }
    };

    const handleOnlineError = (message: string) => {
      setErrorMessage(message);
      console.error('App: Game Service Error (online):', message);
      activelyCreatingGameIdRef.current = null; 
    };
    
    const handleOnlinePlayerAssignment = (assignment: { assignedPlayerId: 'player1' | 'player2', gameId: string }) => {
      console.log('App: Player assigned (online):', assignment);
      setLocalPlayerId(assignment.assignedPlayerId);
    };
    
    const handleOnlineHashChange = () => {
        const newGameIdFromHash = getGameIdFromHash();
        
        if (activelyCreatingGameIdRef.current && newGameIdFromHash === activelyCreatingGameIdRef.current) {
            console.log(`App: Hash changed to ${newGameIdFromHash}, which is currently being created by this client. Hash listener defers.`);
            return;
        }

        if (newGameIdFromHash) {
            if (!gameSession || newGameIdFromHash !== gameSession.gameId || gameStatus === 'menu') {
                console.log(`App: Hash changed to ${newGameIdFromHash}. Attempting to join as a new session or different game (online).`);
                setGameStatus('lobby');
                setGameSession(null);
                setLocalPlayerId(null);
                setWinnerDetails(null);
                setErrorMessage(null);
                activelyCreatingGameIdRef.current = null; 
                gameService.disconnect(); 
                gameService.connect().then(() => {
                    gameService.initiateSession(newGameIdFromHash, false, undefined);
                });
            }
        } else { 
             if (gameStatus !== 'menu' && gameSession?.status !== 'waiting' && currentGameType === 'online') { 
                console.log("App: Hash cleared (online). Resetting to menu state.");
                handlePlayAgain(true); 
             }
        }
    };

    if (currentGameType === 'online') {
      unsubscribeGameState = gameService.onGameStateUpdate(handleOnlineGameUpdate);
      unsubscribeError = gameService.onError(handleOnlineError);
      unsubscribePlayerAssignment = gameService.onPlayerAssigned(handleOnlinePlayerAssignment);

      const initializeOnline = async () => {
        await gameService.connect();
        console.log("App: Initialized and connected for online game. Game status remains:", gameStatus);
      };
      initializeOnline();
      window.addEventListener('hashchange', handleOnlineHashChange, false);
      
      const initialGameIdFromHash = getGameIdFromHash();
      if (initialGameIdFromHash && gameStatus === 'menu') {
        // This part needs careful handling if auto-joining from hash on load for online games is desired.
        // For now, it relies on MainMenu interaction or subsequent hash change.
      }

    } else if (currentGameType === 'local') {
      // For local games, clear hash if any and ensure no online service interaction
      if (window.location.hash !== '') {
        window.location.hash = '';
      }
      gameService.disconnect(); // Ensure any previous online connection is terminated
    }


    return () => {
      if (currentGameType === 'online') {
        if (unsubscribeGameState) unsubscribeGameState();
        if (unsubscribeError) unsubscribeError();
        if (unsubscribePlayerAssignment) unsubscribePlayerAssignment();
        window.removeEventListener('hashchange', handleOnlineHashChange, false);
        gameService.disconnect();
        activelyCreatingGameIdRef.current = null;
      }
    };
  }, [currentGameType, gameStatus, gameSession, getGameIdFromHash]);

  const handleStartOnlineGame = useCallback(async (mode: GameMode) => {
    setCurrentGameType('online');
    setErrorMessage(null);
    setGameStatus('lobby');
    setLocalPlayerId(null); // Reset local player ID for new online game
    console.log(`App: Attempting to start a new ${mode} online game as creator...`);
    try {
      await gameService.connect(); 
      const newGameId = gameService.createStubGameId();
      
      activelyCreatingGameIdRef.current = newGameId; 
      window.location.hash = `gameId=${newGameId}`; 
      
      console.log(`App: New online game created with ID ${newGameId}. Initializing session as creator for ${mode} mode.`);
      gameService.initiateSession(newGameId, true, mode); 
    } catch (error) {
      console.error("Failed to start online game:", error);
      setErrorMessage(String(error) || "Failed to connect/create game.");
      setGameStatus('menu');
      setCurrentGameType(null);
      activelyCreatingGameIdRef.current = null;
    }
  }, []);

  const handleStartLocalGame = useCallback((mode: GameMode) => {
    if (mode !== 'classic') {
        setErrorMessage("Local Speed mode is not yet implemented. Please select Classic for Local Play.");
        // setGameStatus('menu'); // Already in menu or will be reset by PlayAgain
        setCurrentGameType(null);
        return;
    }
    setCurrentGameType('local');
    setErrorMessage(null);
    setLocalPlayerId(null); // Not used to identify client in local game
    if (window.location.hash !== '') window.location.hash = '';

    const p1: Player = { ...player1Template, id: 'player1', name: 'Player 1', isLocalPlayer: true, hp: INITIAL_HP, pp: 0, sessionId: 'local_p1' };
    const p2: Player = { ...player2Template, id: 'player2', name: 'Player 2', isLocalPlayer: true, hp: INITIAL_HP, pp: 0, sessionId: 'local_p2' };
    
    const initialBoard = createInitialBoard(); // No seed for random local games

    const newGameSession: GameSession = {
        gameId: `local_${Date.now()}`,
        mode: 'classic', // Only classic supported locally for now
        players: { player1: p1, player2: p2 },
        sharedBoard: initialBoard,
        currentPlayerId: 'player1',
        status: 'active',
    };
    setGameSession(newGameSession);
    setGameStatus('playing');
    console.log("App: Started local classic game.", newGameSession);
  }, []);
  
  const handlePlayAgain = useCallback((isInternalCall = false) => {
    if (!isInternalCall && window.location.hash !== '' && currentGameType === 'online') { 
        window.location.hash = ''; // This will trigger hashchange for online, resetting state
    } else { // For local games or internal calls, or if hash is already clear
        setGameStatus('menu');
        setGameSession(null);
        setLocalPlayerId(null);
        setWinnerDetails(null);
        setErrorMessage(null);
        setCurrentGameType(null);
        activelyCreatingGameIdRef.current = null;
        if (currentGameType === 'online' || isInternalCall) { // Disconnect if it was an online game or forced reset
             gameService.disconnect();
        }
    }
  }, [currentGameType]);

  // --- Local Game Action Handlers ---
  const handleLocalMakeMove = useCallback((playerId: PlayerId, row: number, col: number, num: number) => {
    if (!gameSession || currentGameType !== 'local' || !gameSession.sharedBoard || !playerId || gameSession.status !== 'active') return;
    
    const board = gameSession.sharedBoard;
    const cell = board[row][col];

    if (cell.isInitial || cell.revealedBy) return; // Cannot change initial or already revealed cells

    const newBoard = board.map(r => r.map(c => ({...c, isError: false }))); // Clear previous errors
    const newCell = newBoard[row][col];
    const player = gameSession.players[playerId];

    if (num === newCell.solutionValue) {
        newCell.value = num;
        newCell.revealedBy = playerId;
        player.pp += PP_PER_CORRECT_REVEAL;
        if (isBoardComplete(newBoard)) {
            setGameSession(prev => prev ? ({ ...prev, sharedBoard: newBoard, status: 'finished', winner: playerId, winReason: 'board' }) : null);
            setWinnerDetails({ name: player.name, reason: 'board'});
            setGameStatus('gameOver');
        } else {
            setGameSession(prev => prev ? ({ ...prev, sharedBoard: newBoard, players: {...prev.players, [playerId]: player }, currentPlayerId: playerId === 'player1' ? 'player2' : 'player1' }) : null);
        }
    } else {
        newCell.isError = true;
        setGameSession(prev => prev ? ({ ...prev, sharedBoard: newBoard, currentPlayerId: playerId === 'player1' ? 'player2' : 'player1' }) : null);
    }
  }, [gameSession, currentGameType]);

  const handleLocalClearInput = useCallback((playerId: PlayerId, row: number, col: number) => {
    if (!gameSession || currentGameType !== 'local' || !gameSession.sharedBoard || !playerId || gameSession.status !== 'active') return;

    const board = gameSession.sharedBoard;
    const cell = board[row][col];
    if (cell.isInitial || cell.revealedBy) return;

    const newBoard = JSON.parse(JSON.stringify(board)); // Deep copy
    newBoard[row][col].value = null;
    newBoard[row][col].isError = false;
    
    setGameSession(prev => prev ? ({ ...prev, sharedBoard: newBoard }) : null);
  }, [gameSession, currentGameType]);

  const handleLocalAttack = useCallback((attackerId: PlayerId) => {
    if (!gameSession || currentGameType !== 'local' || !attackerId || gameSession.status !== 'active') return;

    const attacker = gameSession.players[attackerId];
    if (attacker.pp < ATTACK_COST_PP) return;

    attacker.pp -= ATTACK_COST_PP;
    const defenderId = attackerId === 'player1' ? 'player2' : 'player1';
    const defender = gameSession.players[defenderId!]; // defenderId will be valid
    defender.hp = Math.max(0, defender.hp - ATTACK_DAMAGE);

    if (defender.hp === 0) {
        setGameSession(prev => prev ? ({ ...prev, players: {...prev.players, [attackerId]: attacker, [defenderId!]: defender}, status: 'finished', winner: attackerId, winReason: 'hp' }) : null);
        setWinnerDetails({ name: attacker.name, reason: 'hp'});
        setGameStatus('gameOver');
    } else {
        setGameSession(prev => prev ? ({ ...prev, players: {...prev.players, [attackerId]: attacker, [defenderId!]: defender}, currentPlayerId: defenderId }) : null);
    }
  }, [gameSession, currentGameType]);


  const renderContent = () => {
    if (errorMessage) {
      return (
        <div className="text-center p-4">
          <p className="text-red-500 text-xl mb-4">{errorMessage}</p>
          <button
            onClick={() => { setErrorMessage(null); handlePlayAgain(); }} 
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Menu
          </button>
        </div>
      );
    }

    switch (gameStatus) {
      case 'menu':
        return <MainMenu onStartOnlineGame={handleStartOnlineGame} onStartLocalGame={handleStartLocalGame} />;
      case 'lobby': // Online only
        const lobbyPlayerName = localPlayerId && gameSession?.players[localPlayerId]?.name 
                                ? gameSession.players[localPlayerId].name
                                : localPlayerId;
        return (
          <div className="text-center p-8">
            <h2 className="text-3xl text-yellow-400 mb-4">
              {gameSession?.status === 'waiting' ? "Waiting for Opponent..." : "Joining Game..."}
            </h2>
            <p className="text-gray-300">
              {localPlayerId ? `You are ${lobbyPlayerName}. ` : ''}
              Game ID: ${gameSession?.gameId || "Assigning..."} ({gameSession?.mode || "Loading"} mode)
            </p>
            <div role="status" className="mt-4 flex justify-center items-center">
              <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        );
      case 'playing':
        if (gameSession && (localPlayerId || currentGameType === 'local')) { // localPlayerId for online, type for local
          let currentBoardForPlayer: SudokuBoard | undefined;
          if (gameSession.mode === 'classic' && gameSession.sharedBoard) {
            currentBoardForPlayer = gameSession.sharedBoard; // Used by both online and local classic
          } else if (gameSession.mode === 'speed' && currentGameType === 'online' && localPlayerId) { // Speed only online for now
            currentBoardForPlayer = localPlayerId === 'player1' ? gameSession.boardPlayer1 : gameSession.boardPlayer2;
          }

          if (currentBoardForPlayer) {
            return (
              <GameBoard
                gameSession={gameSession}
                clientControlledPlayerId={localPlayerId} // For online: who this client is
                player1Template={player1Template} 
                player2Template={player2Template}
                isLocalGame={currentGameType === 'local'}
                onLocalMakeMove={currentGameType === 'local' ? handleLocalMakeMove : undefined}
                onLocalClearInput={currentGameType === 'local' ? handleLocalClearInput : undefined}
                onLocalAttack={currentGameType === 'local' ? handleLocalAttack : undefined}
              />
            );
          }
        }
        return <div className="text-center p-4">Loading game data or waiting for session... (Game Status: {gameStatus}, Type: {currentGameType || 'N/A'})</div>;
      case 'gameOver':
        if (winnerDetails) {
          return (
            <GameOverScreen
              winnerName={winnerDetails.name}
              reason={winnerDetails.reason}
              onPlayAgain={() => handlePlayAgain()}
            />
          );
        }
        setGameStatus('menu'); 
        setCurrentGameType(null);
        return null;
      default:
        setGameStatus('menu'); 
        setCurrentGameType(null);
        return <MainMenu onStartOnlineGame={handleStartOnlineGame} onStartLocalGame={handleStartLocalGame} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 selection:bg-yellow-500 selection:text-yellow-900">
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          Sudoku Battle
        </h1>
      </header>
      <main className="w-full max-w-4xl bg-gray-800 shadow-2xl rounded-lg p-6 min-h-[600px] flex flex-col justify-center">
        {renderContent()}
      </main>
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>An Online & Local Sudoku Showdown.</p>
        <p>May the best strategist win!</p>
      </footer>
    </div>
  );
};

export default App;