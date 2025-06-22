'use client';

import { useState } from 'react';
import Coin from '@/components/Coin';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

const betOptions = [0.1, 0.25, 0.5, 0.75, 1];

export default function FlipPage() {
    const [selectedBet, setSelectedBet] = useState<number | null>(null);
    const [choice, setChoice] = useState<'heads' | 'tails' | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [flipping, setFlipping] = useState(false);
    const [coinFace, setCoinFace] = useState<'heads' | 'tails' | null>(null);

    const { publicKey, connected, sendTransaction } = useWallet();
    const { connection } = useConnection();

    const treasuryKey = process.env.NEXT_PUBLIC_TREASURY_PUBLIC_KEY;
    if (!treasuryKey) {
        throw new Error('TREASURY_PUBLIC_KEY is not defined in environment variables');
    }
    const treasuryPubkey = new PublicKey(treasuryKey);

    const handleFlip = async () => {
        if (!selectedBet || !choice) {
            setError('Please select bet amount and side.');
            return;
        }
        if (!publicKey) {
            setError("Wallet not connected");
            return;
        }
        if (!connected) {
            setError('Please connect your wallet.');
            return;
        }

        setFlipping(true);
        setResult(null);
        setError(null);

        try {
            console.log('Creating payment transaction...');
            const tx = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: treasuryPubkey,
                    lamports: Math.floor(selectedBet * 1e9),
                })
            );

            console.log('Sending transaction...');
            const signature = await sendTransaction(tx, connection);
            console.log('Transaction sent:', signature);

            console.log('Confirming transaction...');
            const confirmation = await connection.confirmTransaction({
                signature,
                blockhash: (await connection.getLatestBlockhash()).blockhash,
                lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
            }, 'confirmed');
            
            if (confirmation.value.err) {
                throw new Error('Transaction failed to confirm');
            }
            console.log('Transaction confirmed');

            console.log('Calling flip API...');
            const res = await fetch('/api/flip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAddress: publicKey.toString(),
                    amount: selectedBet,
                    side: choice,
                    transactionSignature: signature, 
                }),
            });

            const data = await res.json();
            console.log('API response:', data);

            if (!res.ok) {
                throw new Error(data?.error || data?.details || 'Something went wrong');
            }

         
            setCoinFace(null); // reset coin
            setCoinFace(data.result);

           
            setTimeout(() => {
                if (data.status === "won") {
                    setResult(`🎉 You won ${data.reward || (selectedBet * 2 * 0.95).toFixed(4)} SOL! Coin landed on ${data.result.toUpperCase()}`);
                } else if (data.status === "lost") {
                    setResult(`😢 You lost! Coin landed on ${data.result.toUpperCase()}`);
                } else if (data.status === "won_pending") {
                    setResult(`🎉 You won! Reward pending - please contact support.`);
                }
                setFlipping(false);
            }, 3000);

        } catch (err: any) {
            console.error('Flip error:', err);
            setError(err.message || 'An unexpected error occurred');
            setFlipping(false);
            setCoinFace(null);
        }
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
                    <Coin result={coinFace} />
                </div>

                <div>
                    <p className="mb-2 text-sm text-gray-300">Select Bet Amount (SOL)</p>
                    <div className="flex justify-between gap-2">
                        {betOptions.map((amount) => (
                            <button
                                key={amount}
                                onClick={() => setSelectedBet(amount)}
                                disabled={flipping}
                                className={`flex-1 py-2 rounded-lg font-medium transition ${
                                    selectedBet === amount
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
                            className={`w-1/2 py-3 rounded-lg text-lg flex items-center justify-center gap-2 transition ${
                                choice === 'heads'
                                    ? 'bg-green-500 text-black'
                                    : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                        >
                            🧠 Heads
                        </button>
                        <button
                            onClick={() => setChoice('tails')}
                            disabled={flipping}
                            className={`w-1/2 py-3 rounded-lg text-lg flex items-center justify-center gap-2 transition ${
                                choice === 'tails'
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
                        className={`w-full py-3 rounded-xl font-semibold text-lg transition ${
                            isDisabled
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-500'
                        }`}
                    >
                        {flipping ? 'Flipping...' : 'Flip Coin'}
                    </button>
                </div>

                {error && (
                    <div className="text-red-400 text-center text-sm bg-red-900/20 p-3 rounded-lg">
                        <p className="font-semibold">Error:</p>
                        <p>{error}</p>
                    </div>
                )}
                
                {result && !flipping && (
                    <div className="text-center text-lg font-medium bg-gray-800 p-4 rounded-lg">
                        {result}
                    </div>
                )}

                {selectedBet && choice && (
                    <div className="text-center text-sm text-gray-400 bg-gray-800 p-3 rounded-lg">
                        <p>Betting {selectedBet} SOL on {choice}</p>
                        <p>Potential win: ~{(selectedBet * 2 * 0.95).toFixed(4)} SOL</p>
                    </div>
                )}
            </div>
        </div>
    );
}