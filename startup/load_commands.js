import * as fs from "fs";
import * as Discord from "discord.js";
import commands from "../commands/commands.js"

const commandFolders = fs.readdirSync("./commands");

/**
 * スラッシュコマンド読み込み処理
 */
export const start = async function(client) {
  client.commands = new Discord.Collection();
  console.log("スラッシュコマンドの読み込み処理を開始します。")

  // コマンド読み込み
  for (const command of commands) {
    try {
      // コマンド登録処理
      await client.commands.set(command.data.name, command);
      console.log(`${command.data.name}が読み込まれました。`)
    } catch (error) {
      console.log(error);
    }
  }

  // 処理完了
  console.log("スラッシュコマンドの読み込み処理が完了しました。")
}
