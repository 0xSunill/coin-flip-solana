import { NextResponse } from 'next/server';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

// ✅ Create Solana connection
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// ✅ Load treasury keypair and pubkey from env
const treasury = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));
const treasuryPubkey = new PublicKey(process.env.TREASURY_PUBLIC_KEY!);

// ✅ App Router style: named export for POST method
export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log(body);
        
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
    }
}
