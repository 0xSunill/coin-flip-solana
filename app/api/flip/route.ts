import { NextResponse } from 'next/server';
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';

const connection = new Connection(
  `https://devnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY_DEVNET}`,
  "confirmed"
);

const treasury = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));
const treasuryPubkey = new PublicKey(process.env.TREASURY_PUBLIC_KEY!);


const MIN_BET = 0.01;
const MAX_BET = 10;
const HOUSE_EDGE = 0.05; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Received request body:', body);
    
    const { userAddress, amount, side, transactionSignature } = body;

   
    if (!userAddress || !amount || !side) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (!['heads', 'tails'].includes(side)) {
      return NextResponse.json({ error: 'Invalid side. Must be "heads" or "tails"' }, { status: 400 });
    }

  
    const betAmount = parseFloat(amount);
    if (isNaN(betAmount) || betAmount < MIN_BET || betAmount > MAX_BET) {
      return NextResponse.json({ 
        error: `Invalid bet amount. Must be between ${MIN_BET} and ${MAX_BET} SOL` 
      }, { status: 400 });
    }

    const userPubkey = new PublicKey(userAddress);
    const betLamports = Math.floor(betAmount * 1e9);

  
    if (transactionSignature) {
      try {
        console.log('Verifying transaction:', transactionSignature);
        
     
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const txInfo = await connection.getTransaction(transactionSignature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        });
        
        if (!txInfo) {
          console.log('Transaction not found, waiting longer...');
        
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const txInfoRetry = await connection.getTransaction(transactionSignature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
          });
          
          if (!txInfoRetry) {
            return NextResponse.json({ error: 'Transaction not found on blockchain' }, { status: 400 });
          }
          
          if (txInfoRetry.meta?.err) {
            return NextResponse.json({ error: 'Transaction failed on blockchain' }, { status: 400 });
          }
        } else if (txInfo.meta?.err) {
          return NextResponse.json({ error: 'Transaction failed on blockchain' }, { status: 400 });
        }

        console.log('Transaction verified successfully');
      } catch (verifyError) {
        console.error('Transaction verification failed:', verifyError);
     
        console.log('Continuing without transaction verification due to error:', verifyError);
      }
    }

    const treasuryBalance = await connection.getBalance(treasuryPubkey);
    const potentialPayout = Math.floor(betLamports * 2 * (1 - HOUSE_EDGE));
    
    console.log(`Treasury balance: ${treasuryBalance / 1e9} SOL, Potential payout: ${potentialPayout / 1e9} SOL`);
    
    if (treasuryBalance < potentialPayout) {
      return NextResponse.json({ 
        error: 'Insufficient treasury funds for potential payout' 
      }, { status: 503 });
    }


    const flipResult = Math.random() < 0.5 ? 'heads' : 'tails';
    const userWon = flipResult === side;


    console.log(`Game: ${userAddress} bet ${betAmount} SOL on ${side}, result: ${flipResult}, won: ${userWon}`);

    if (!userWon) {
      return NextResponse.json({
        result: flipResult,
        status: 'lost',
        message: 'You lost. Better luck next time!',
        betAmount,
        userSide: side
      });
    }

    const reward = potentialPayout;

  
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasuryPubkey,
        toPubkey: userPubkey,
        lamports: reward,
      })
    );

    tx.feePayer = treasuryPubkey;
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;

    try {
      console.log(`Sending reward of ${reward / 1e9} SOL to ${userAddress}`);
      const signature = await sendAndConfirmTransaction(
        connection, 
        tx, 
        [treasury],
        {
          commitment: 'confirmed',
          maxRetries: 3
        }
      );

      console.log(`Reward sent successfully: ${signature}`);

      return NextResponse.json({
        result: flipResult,
        status: 'won',
        signature,
        reward: reward / 1e9,
        betAmount,
        userSide: side,
        message: `Congratulations! You won ${(reward / 1e9).toFixed(4)} SOL!`
      });

    } catch (txError) {
      console.error('Failed to send reward transaction:', txError);
      
      return NextResponse.json({
        result: flipResult,
        status: 'won_pending',
        error: 'Won but reward transaction failed. Contact support.',
        betAmount,
        userSide: side
      }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error('Flip coin error:', error);

    if (error instanceof Error) {
    
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      const isProduction = process.env.NODE_ENV === 'production';
      return NextResponse.json(
        { 
          error: 'Server error', 
          details: isProduction ? 'Internal server error' : error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Server error', details: 'Unknown error occurred' },
      { status: 500 }
    );
  }
}


export async function GET() {
  try {
    const balance = await connection.getBalance(treasuryPubkey);
    
    return NextResponse.json({
      treasuryBalance: balance / 1e9,
      minBet: MIN_BET,
      maxBet: MAX_BET,
      houseEdge: HOUSE_EDGE * 100 + '%',
      treasuryAddress: treasuryPubkey.toString()
    });
  } catch (error) {
    console.error('Error fetching treasury info:', error);
    return NextResponse.json({ error: 'Failed to fetch treasury info' }, { status: 500 });
  }
}