import { REST, Routes } from "discord.js";
import config from "../config.js";
import commands from "../commands/commands.js";
import { sendErrorLog } from "../functions.js";

const rest = new REST({ version: '10' }).setToken(config.token);
const globalCommands = [];
const guildCommands = [];

/**
 * スラッシュコマンド登録処理
 */
export const start = async function() {
  for (const command of commands) {
    if (command.guildOnly) {
      guildCommands.push(command.data.toJSON());
      continue;
    }
    if (command.onlyCommand) continue;

    globalCommands.push(command.data.toJSON());
  }

  // コマンド登録処理
  (async () => {
    try {
      if (globalCommands.length) {
        console.log(`${globalCommands.length} 個のグローバルコマンドの登録を開始します。`);
        const data = await rest.put(
          Routes.applicationCommands(config.clientId),
          { body: globalCommands },
        );
        console.log(`${data.length} 個のグローバルコマンドを登録しました。`);
      }

      if (guildCommands.length) {
        console.log(`${guildCommands.length} 個のギルドコマンドの登録を開始します。`);
        const data = await rest.put(
          Routes.applicationGuildCommands(config.clientId, config.dev.testGuild),
          { body: guildCommands },
        );
        console.log(`${data.length} 個のギルドコマンドを登録しました。`);
      }
    } catch (error) {
      sendErrorLog(client, error, "DEPLOY_COMMANDS===");
    }
  })();
}
