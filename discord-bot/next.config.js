/** @type {import('next').NextConfig} */
const nextConfig = {

  images: {
    domains: ['cdn.discordapp.com'],
  },
  env: {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_PUBLIC_KEY: process.env.DISCORD_PUBLIC_KEY,
    NOTION_TOKEN: process.env.NOTION_TOKEN,
    NOTION_TASK_DB_ID: process.env.NOTION_TASK_DB_ID,
  },
};

module.exports = nextConfig;
