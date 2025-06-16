'use client';

import { useState } from 'react';
import Coin from '@/components/Coin';


const betOptions = [0.1, 0.25, 0.5, 0.75, 1];

export default function FlipPage() {
    const [selectedBet, setSelectedBet] = useState<number | null>(null);
    const [choice, setChoice] = useState<'heads' | 'tails' | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFlip = () => {
        if (!selectedBet || !choice) {
            setError('Please select bet amount and side.');
            return;
        }

        const flip = Math.random() < 0.5 ? 'heads' : 'tails';
        const won = flip === choice;

        setResult(won ? `🎉 You won! Coin landed on ${flip.toUpperCase()}` : `😢 You lost! Coin landed on ${flip.toUpperCase()}`);
        setError(null);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1f1f1f] text-white flex flex-col items-center justify-center p-6">


            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold">🪙 Solana Coin Flip</h1>
                <p className="text-gray-400 mt-2">Choose your luck. Win double the SOL!</p>
            </div>





            <div className="w-full max-w-md bg-[#2b2b2b] p-6 rounded-2xl shadow-lg space-y-6">
                <div className='text-center mb-8'>

                    <Coin result={result ? (result.includes('won') ? choice : choice === 'heads' ? 'tails' : 'heads') : null} />
                </div>


                {/* Bet Selection */}
                <div>
                    <p className="mb-2 text-sm text-gray-300">Select Bet Amount (SOL)</p>
                    <div className="flex justify-between gap-2">
                        {betOptions.map((amount) => (
                            <button
                                key={amount}
                                onClick={() => setSelectedBet(amount)}
                                className={`flex-1 py-2 rounded-lg font-medium transition ${selectedBet === amount ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                            >
                                {amount}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Coin Side Selection */}
                <div>
                    <p className="mb-2 text-sm text-gray-300">Choose Heads or Tails</p>
                    <div className="flex justify-between gap-4">
                        <button
                            onClick={() => setChoice('heads')}
                            className={`w-1/2 py-3 rounded-lg text-lg flex items-center justify-center gap-2 transition ${choice === 'heads' ? 'bg-green-500 text-black' : 'bg-gray-700 hover:bg-gray-600'
                                }`}
                        >
                            🧠 Heads
                        </button>
                        <button
                            onClick={() => setChoice('tails')}
                            className={`w-1/2 py-3 rounded-lg text-lg flex items-center justify-center gap-2 transition ${choice === 'tails' ? 'bg-blue-500 text-black' : 'bg-gray-700 hover:bg-gray-600'
                                }`}
                        >
                            🌀 Tails
                        </button>
                    </div>
                </div>

                {/* Flip Button */}
                <div>
                    <button
                        onClick={handleFlip}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold text-lg transition"
                    >
                        Flip Coin
                    </button>
                </div>

                {/* Result/Error */}
                {error && <p className="text-red-400 text-center text-sm">{error}</p>}
                {result && <p className="text-center text-lg font-medium">{result}</p>}
            </div>
        </main>
    );
}
