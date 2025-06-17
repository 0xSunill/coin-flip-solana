'use client';

import React, { useEffect, useRef } from 'react';
import '../app/coin.css';

export default function Coin({ result }: { result: 'heads' | 'tails' | null }) {
    const coinRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (result && coinRef.current) {
            coinRef.current.classList.remove('heads', 'tails');
            void coinRef.current.offsetWidth; // Trigger reflow
            coinRef.current.classList.add(result);
        }
    }, [result]);

    return (
        <div className="coin-container">
            <div ref={coinRef} className="coin">
                <div className="side heads">🧠</div>
                <div className="side tails">🌀</div>
            </div>
        </div>
    );
}
