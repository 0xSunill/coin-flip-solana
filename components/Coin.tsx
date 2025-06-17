'use client';

import React, { useEffect, useRef } from 'react';
import '../app/coin.css';

export default function Coin({
    result,
    flipping,
    onAnimationEnd,
}: {
    result: 'heads' | 'tails' | null;
    flipping: boolean;
    onAnimationEnd?: () => void;
}) {
    const coinRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (flipping && result && coinRef.current) {
            coinRef.current.classList.remove('heads', 'tails');
            void coinRef.current.offsetWidth; // Trigger reflow
            coinRef.current.classList.add(result);
        }
    }, [flipping, result]);

    return (
        <div className="coin-container">
            <div
                ref={coinRef}
                className="coin"
                onAnimationEnd={onAnimationEnd}
            >
                <div className="side heads">🧠</div>
                <div className="side tails">🌀</div>
            </div>
        </div>
    );
}
