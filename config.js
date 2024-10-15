const config = {
  clientId: process.env.DISCORD_CLIENT_ID,
  token: process.env.DISCORD_TOKEN,
  colors: {
    success: "21ff60",
    error: "ff4040",
    warning: "fff236",
    info: "0099ff",
  },
  channels: {
    log: process.env.LOG_CHANNEL,
  },
  dev: {
    testGuild: process.env.TEST_GUILD,
  }
}
export default config
