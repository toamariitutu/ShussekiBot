import * as Discord from "discord.js";
import { successEmbed, errorEmbed, sendErrorLog } from "../../functions.js"
import { setReportChannelId } from "../../db/adapter.js"
import {
  REPO_CH_DESCRIPTION,
  REPO_CH_COMPLETE,
  REPO_CH_COMPLETE_MSG,
  COMMAND_ERR_MSG,
} from "../../strings/string.js";

/** 
* 出席報告用のチャンネル設定コマンド
*/
const reportChannel = {
  // サーバー専用コマンドかどうか
  guildOnly: false,
  // スラッシュコマンド登録
  data: new Discord.SlashCommandBuilder()
    .setName("reportchannel")
    .setDescription(REPO_CH_DESCRIPTION)
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("チャンネル選択")
        .setRequired(true)
        .addChannelTypes(Discord.ChannelType.GuildText)
    )
  ,
  // コマンド処理
  async execute(interaction, client) {
    try {
      // コマンド実行ログ
      const targetChannel = interaction.options.getChannel("channel")
      await setReportChannelId(targetChannel.guildId, targetChannel.id);
      // 返信
      interaction.reply(successEmbed({
        title: REPO_CH_COMPLETE,
        message: REPO_CH_COMPLETE_MSG,
        fields: [
          { name: "チャンネル名", value: targetChannel.name },
        ],
      }));
    } catch (error) {
      sendErrorLog(client, error, "REPORT_CHANNEL_EXECUTE===");
      interaction.reply(
        errorEmbed({ message: COMMAND_ERR_MSG }, error)
      );
    }
  },
}
export default reportChannel;
