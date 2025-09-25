'use client';

import { useState, useEffect } from 'react';

interface BotStatus {
  status: string;
  timestamp: string;
  environment: string;
  discord: {
    token: string;
    clientId: string;
  };
  notion: {
    token: string;
    databaseId: string;
  };
}

export default function Dashboard() {
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/status');
        const data = await response.json();
        setBotStatus(data);
      } catch (error) {
        console.error('Failed to fetch status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">Discord Bot Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Bot Status */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Bot Status</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Status:</span>
                <span
                  className={`font-medium ${
                    botStatus?.status === 'online'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {botStatus?.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Environment:</span>
                <span>{botStatus?.environment}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Update:</span>
                <span>
                  {new Date(botStatus?.timestamp || '').toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Discord Configuration */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">
              Discord Configuration
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Token:</span>
                <span
                  className={
                    botStatus?.discord.token === 'configured'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {botStatus?.discord.token}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Client ID:</span>
                <span
                  className={
                    botStatus?.discord.clientId === 'configured'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {botStatus?.discord.clientId}
                </span>
              </div>
            </div>
          </div>

          {/* Notion Configuration */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Notion Configuration</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Token:</span>
                <span
                  className={
                    botStatus?.notion.token === 'configured'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {botStatus?.notion.token}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Database ID:</span>
                <span
                  className={
                    botStatus?.notion.databaseId === 'configured'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {botStatus?.notion.databaseId}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Restart Bot
              </button>
              <button className="w-full rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                Test Connection
              </button>
              <button className="w-full rounded bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700">
                View Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
