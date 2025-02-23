import { type NextRequest, NextResponse } from 'next/server';
import { getGame, setGame, checkWinner } from '@/app/api/games';

export async function GET(
  _request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const { roomId } = params;
  const encoder = new TextEncoder();
  let isClosed = false;

  try {
    const gameState = await getGame(roomId);
    if (!gameState) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = async () => {
          if (isClosed) return;
          try {
            const currentGameState = await getGame(roomId);
            if (currentGameState) {
              const data = JSON.stringify(currentGameState);
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          } catch (error) {
            console.error('Error sending game state:', error);
            // Only call controller.error if the stream hasn't been closed.
            if (!isClosed) {
              controller.error(error);
            }
          }
        };

        // Send initial state immediately
        await sendEvent();

        const interval = setInterval(sendEvent, 1000);

        return () => {
          isClosed = true;
          clearInterval(interval);
        };
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const roomId = params.roomId;

  try {
    const { index } = await request.json();
    const gameState = await getGame(roomId);

    if (!gameState) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (gameState.board[index] || gameState.winner) {
      return NextResponse.json({ error: 'Invalid move' }, { status: 400 });
    }

    gameState.board[index] = gameState.currentPlayer;
    gameState.winner = checkWinner(gameState.board);
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';

    await setGame(roomId, gameState);

    return NextResponse.json(gameState);
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
