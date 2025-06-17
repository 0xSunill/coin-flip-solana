'use client';

import { useEffect, useState } from 'react';
import Coin from '@/components/Coin';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

const betOptions = [0.1, 0.25, 0.5, 0.75, 1];

export default function FlipPage() {
    const [selectedBet, setSelectedBet] = useState<number | null>(null);
    const [choice, setChoice] = useState<'heads' | 'tails' | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [flipping, setFlipping] = useState(false);
    const [coinFace, setCoinFace] = useState<'heads' | 'tails' | null>(null);
    const [pendingResult, setPendingResult] = useState<any>(null);
    const { publicKey, connected } = useWallet();
    const { connection } = useConnection();
    const [walletAddress, setWalletAddress] = useState('');

    useEffect(() => {
        if (connected && publicKey) {
            setWalletAddress(publicKey.toBase58());
        }
    }, [connected, publicKey]);


    const handleFlip = async () => {
        if (!selectedBet || !choice) {
            setError('Please select bet amount and side.');
            return;
        }

        if (!connected) {
            setError('Please connect your wallet.');
            return;
        }

        setFlipping(true);
        setResult(null);
        setError(null);
        setCoinFace(null);

        const res = await fetch('/api/flip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userAddress: walletAddress,
                amount: selectedBet,
                side: choice,
            }),
        });

        const data = await res.json();

        setCoinFace(data.result); // Start coin animation

        // Show result after animation ends (see below)
        setPendingResult(data);
    };

    const isDisabled = !selectedBet || !choice || !connected || flipping;

    return (
        <div className="flex flex-col items-center justify-center px-4 sm:px-0">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold">🪙 Solana Coin Flip</h1>
                <p className="text-gray-400 mt-2">Choose your luck. Win double the SOL!</p>
            </div>

            <div className="w-full max-w-md bg-[#2b2b2b] p-6 rounded-2xl shadow-lg space-y-6">
                <div className="text-center mb-8">
                    <Coin
                        result={coinFace}
                        flipping={flipping}
                        onAnimationEnd={() => {
                            if (pendingResult) {
                                const data = pendingResult;
                                if (data.status === 'won') {
                                    setResult(`🎉 You won! Coin landed on ${data.result}`);
                                } else {
                                    setResult(`😢 You lost! Coin landed on ${data.result}`);
                                }
                                setFlipping(false);
                                setPendingResult(null);
                            }
                        }}
                    />

                </div>

                <div>
                    <p className="mb-2 text-sm text-gray-300">Select Bet Amount (SOL)</p>
                    <div className="flex justify-between gap-2">
                        {betOptions.map((amount) => (
                            <button
                                key={amount}
                                onClick={() => setSelectedBet(amount)}
                                disabled={flipping}
                                className={`flex-1 py-2 rounded-lg font-medium transition ${selectedBet === amount
                                    ? 'bg-yellow-500 text-black'
                                    : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                            >
                                {amount}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="mb-2 text-sm text-gray-300">Choose Heads or Tails</p>
                    <div className="flex justify-between gap-4">
                        <button
                            onClick={() => setChoice('heads')}
                            disabled={flipping}
                            className={`w-1/2 py-3 rounded-lg text-lg flex items-center justify-center gap-2 transition ${choice === 'heads'
                                ? 'bg-green-500 text-black'
                                : 'bg-gray-700 hover:bg-gray-600'
                                }`}
                        >
                            🧠 Heads
                        </button>
                        <button
                            onClick={() => setChoice('tails')}
                            disabled={flipping}
                            className={`w-1/2 py-3 rounded-lg text-lg flex items-center justify-center gap-2 transition ${choice === 'tails'
                                ? 'bg-blue-500 text-black'
                                : 'bg-gray-700 hover:bg-gray-600'
                                }`}
                        >
                            🌀 Tails
                        </button>
                    </div>
                </div>

                <div>
                    <button
                        onClick={handleFlip}
                        disabled={isDisabled}
                        className={`w-full py-3 rounded-xl font-semibold text-lg transition ${isDisabled
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-500'
                            }`}
                    >
                        {flipping ? 'Flipping...' : 'Flip Coin'}
                    </button>
                </div>

                {error && <p className="text-red-400 text-center text-sm">{error}</p>}
                {result && !flipping && (
                    <p className="text-center text-lg font-medium">{result}</p>
                )}
            </div>
        </div>
    );
}
