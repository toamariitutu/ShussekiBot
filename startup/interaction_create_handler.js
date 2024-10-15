import * as Discord from "discord.js";

/**
 * インタラクション受信時の処理
 */
export const call = async function(client) {
  client.on("interactionCreate", async interaction => {
    // コマンド実行時
    if (interaction.type === Discord.InteractionType.ApplicationCommand) {
      const command = client.commands.get(interaction.commandName);
      // 指定されたコマンドが見つからなければ中断
      if (!command) return;

      // コマンドを実行する
      await command.execute(interaction, client);
    }
  });
}
