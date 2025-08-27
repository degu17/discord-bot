import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const status = {
      status: 'online',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      discord: {
        token: process.env.DISCORD_TOKEN ? 'configured' : 'not configured',
        clientId: process.env.DISCORD_CLIENT_ID
          ? 'configured'
          : 'not configured',
      },
      notion: {
        token: process.env.NOTION_TOKEN ? 'configured' : 'not configured',
        databaseId: process.env.NOTION_TASK_DB_ID
          ? 'configured'
          : 'not configured',
      },
    };

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
