import { NextResponse } from 'next/server';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import bs58 from 'bs58';




const treasury = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));
const treasuryPubkey = new PublicKey(process.env.TREASURY_PUBLIC_KEY!);


export async function POST(req: Request) {
    try {
        const body = await req.json();
        // console.log(body);
        const { userAddress, amount, side } = body;

        if (!userAddress || !amount || !side) {
          return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const userPubkey = new PublicKey(userAddress);
        const betLamports = Math.floor(parseFloat(amount) * 1e9);

       
        const flipResult = Math.random() < 0.5 ? 'heads' : 'tails';
        const userWon = flipResult === side;

        if (!userWon) {
          return NextResponse.json({
            result: flipResult,
            status: 'lost',
            message: 'You lost. The SOL stays with the platform.',
          });
        }

        const reward = Math.floor(betLamports * 2 * 0.95);
        // const tx = new Transaction().add(
        //   SystemProgram.transfer({
        //     fromPubkey: treasuryPubkey,
        //     toPubkey: userPubkey,
        //     lamports: reward,
        //   })
        // );

        // const signature = await sendAndConfirmTransaction(connection, tx, [treasury]);

        return NextResponse.json({
          result: flipResult,
          status: 'won',
          // signature,
        });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
    }
}