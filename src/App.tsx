/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';

export default function App() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'clear'>('menu');
  const [finalScore, setFinalScore] = useState(0);
  const [finalTime, setFinalTime] = useState(0);

  return (
    <div className="w-full h-screen bg-gray-900 flex items-center justify-center overflow-hidden touch-none font-mono select-none">
      {gameState === 'menu' && (
        <div className="absolute z-10 flex flex-col items-center text-white bg-black/80 p-8 rounded-xl border-4 border-gray-700 shadow-2xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-8 text-center text-yellow-400 tracking-tighter">
            STEAMPUNK<br/>DRILL DEFENSE
          </h1>
          <button 
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold rounded border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
            onClick={() => setGameState('playing')}
          >
            START GAME
          </button>
          <div className="mt-8 text-sm text-gray-400 text-center space-y-2">
            <p>Drag to move the drill.</p>
            <p>Destroy falling meteorites.</p>
            <p>Protect the village!</p>
          </div>
        </div>
      )}
      {gameState === 'gameover' && (
        <div className="absolute z-10 flex flex-col items-center text-white bg-black/90 p-8 rounded-xl border-4 border-red-600 shadow-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-red-500 tracking-tighter">GAME OVER</h1>
          <div className="text-2xl mb-2 text-yellow-400">Score: {finalScore}</div>
          <div className="text-xl mb-8 text-gray-300">Survived: {finalTime}s</div>
          <button 
            className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white text-xl font-bold rounded border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all"
            onClick={() => setGameState('playing')}
          >
            RETRY
          </button>
        </div>
      )}
      {gameState === 'clear' && (
        <div className="absolute z-10 flex flex-col items-center text-white bg-black/90 p-8 rounded-xl border-4 border-green-600 shadow-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-green-500 tracking-tighter">VILLAGE SAVED!</h1>
          <div className="text-2xl mb-2 text-yellow-400">Score: {finalScore}</div>
          <div className="text-xl mb-8 text-gray-300">Survived: {finalTime}s</div>
          <button 
            className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white text-xl font-bold rounded border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all"
            onClick={() => setGameState('playing')}
          >
            PLAY AGAIN
          </button>
        </div>
      )}
      
      {(gameState === 'playing' || gameState === 'gameover' || gameState === 'clear') && (
        <GameCanvas 
          gameState={gameState}
          setGameState={setGameState}
          setFinalScore={setFinalScore}
          setFinalTime={setFinalTime}
        />
      )}
    </div>
  );
}
