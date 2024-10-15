import * as Discord from "discord.js";
import reportChannelCommand from "./reportChannel.js";
import {
  successEmbed,
  warningEmbed,
  errorEmbed,
  sendReportEmbed,
  sendErrorLog,
} from "../../functions.js";
import {
  hasJoinedData,
  getJoinedData,
  setJoinedData,
  deleteJoinedData,
  join,
  leave,
  getReportChannelId,
} from "../../db/adapter.js";
import {
  SHUSSEKI_DESCRIPTION,
  SHUSSEKI_RECORDING_DESCRIPTION,
  SHUSSEKI_CHANNEL_ERR,
  SHUSSEKI_CHANNEL_ERR_MSG,
  SHUSSEKI_REPORT_CHANNEL_ERR,
  SHUSSEKI_REPORT_CHANNEL_ERR_MSG,
  SHUSSEKI_ALREADY_REC,
  SHUSSEKI_ALREADY_REC_MSG,
  SHUSSEKI_START_REC,
  SHUSSEKI_START_REC_MSG,
  SHUSSEKI_NOT_REC,
  SHUSSEKI_NOT_REC_MSG,
  SHUSSEKI_REPORT,
  SHUSSEKI_REPORT_MSG,
  SHUSSEKI_END_REC,
  SHUSSEKI_END_REC_MSG,
  COMMAND_ERR_MSG,
} from "../../strings/string.js";

/** 
* 出席確認コマンド
*/
const shusseki = {
  // サーバー専用コマンドかどうか
  guildOnly: false,
  // スラッシュコマンド登録
  data: new Discord.SlashCommandBuilder()
    .setName("shusseki")
    .setDescription(SHUSSEKI_DESCRIPTION)
    .addStringOption(option =>
      option
        .setName("recording")
        .setDescription(SHUSSEKI_RECORDING_DESCRIPTION)
        .addChoices(
  				{ name: 'start（開始）', value: 'start' },
  				{ name: 'report（途中経過報告）', value: 'report' },
  				{ name: 'end（終了）', value: 'end' },
  			)
        .setRequired(true)
    )
  ,
  // コマンド処理
  async execute(interaction, client) {
    try {
      // 呼び出し元のチャンネルチェック
      if (interaction.channel.type !== Discord.ChannelType.GuildVoice) {
        // 呼び出し元がボイスチャンネルでない場合、処理終了
        interaction.reply(errorEmbed({
          title: SHUSSEKI_CHANNEL_ERR,
          message: SHUSSEKI_CHANNEL_ERR_MSG,
        }));
        return
      }
      
      // 報告用チャンネル取得
      const reportChannelId = await getReportChannelId(interaction.guildId)
      if (!reportChannelId) {
        // 報告用チャンネル未設定の場合、設定を促して処理終了
        interaction.reply(errorEmbed({
          title: SHUSSEKI_REPORT_CHANNEL_ERR,
          message: SHUSSEKI_REPORT_CHANNEL_ERR_MSG,
          fields: [
            { name: "コマンド", value: `\`/${reportChannelCommand.data.name}\`` },
          ],
        }));
        return
      }

      if (interaction.options.getString('recording') === "start") {
        // 出席記録開始
        await startRecording(interaction);
      }
      if (interaction.options.getString('recording') === "report") {
        // 途中経過報告
        await report(interaction, client, reportChannelId);
      }
      if (interaction.options.getString('recording') === "end") {
        // 出席記録終了
        await endRecording(interaction, client, reportChannelId);
      }
    } catch(error) {
      sendErrorLog(client, error, "SHUSSEKI_EXECUTE===");
      interaction.reply(
        errorEmbed({ message: COMMAND_ERR_MSG }, error)
      );
    }
  },
}

/** 
* 出席記録開始処理
*/
async function startRecording(interaction) {
  try {
    const channel = interaction.channel
  
    // 記録開始済みでないかチェック
    if (await hasJoinedData(channel.id)) {
      // 記録開始済みの場合、警告を出して処理終了
      interaction.reply(warningEmbed({
        title: SHUSSEKI_ALREADY_REC,
        message: SHUSSEKI_ALREADY_REC_MSG,
        fields: [
          { name: "コマンド", value: "`/shusseki`" },
        ],
      }));
      return
    }

    // 出席データset
    await setJoinedData(channel.id, interaction.channel.members)
    // 返信
    interaction.reply(successEmbed({
      title: SHUSSEKI_START_REC,
      message: SHUSSEKI_START_REC_MSG,
      timestamp: true,
    }));
  } catch(error) {
    console.log("STRT_RECORDING===", error);
    throw error;
  }
}

/** 
* 途中経過報告処理
*/
async function report(interaction, client) {
  try {
    const channel = interaction.channel;
    // const test = channel.members.find(member => member.user.username === 'toamariitutu')
    // console.log("TEST===", test)
    // console.log("TEST2===", test.nickname, test.displayName, test.user.globalName, test.user.displayName, test.user.username, test.user)
    // 出席データ取得
    const joinedData = await getJoinedData(channel.id);
    if (!joinedData) {
      // 出席データがない場合、エラーを返して処理終了
      interaction.reply(errorEmbed({
        title: SHUSSEKI_NOT_REC,
        message: SHUSSEKI_NOT_REC_MSG,
        fields: [
          { name: "コマンド", value: "`/shusseki`" },
        ],
      }));
      return
    }

    // 報告用チャンネル取得
    const reportChannelId = await getReportChannelId(interaction.guildId);
    const reportChannel = await client.channels.fetch(reportChannelId);
  
    // レポート送信
    sendReportEmbed(joinedData, channel, reportChannel, true);
    // 返信
    interaction.reply(successEmbed({
      title: SHUSSEKI_REPORT,
      message: SHUSSEKI_REPORT_MSG,
      fields: [
        { name: "チャンネル名", value: reportChannel.name },
      ],
      timestamp: true,
    }));
  } catch(error) {
    console.log("REPORT_RECORDING===", error);
    throw error;
  }
}

/** 
* 出席記録終了処理
*/
async function endRecording(interaction, client) {
  try {
    const channel = interaction.channel;
    // 出席データ取得
    const joinedData = await getJoinedData(channel.id);
    if (!joinedData) {
      // 出席データがない場合、エラーを返して処理終了
      interaction.reply(errorEmbed({
        title: SHUSSEKI_NOT_REC,
        message: SHUSSEKI_NOT_REC_MSG,
        fields: [
          { name: "コマンド", value: "`/shusseki`" },
        ],
      }));
      return
    }

    // 報告用チャンネル取得
    const reportChannelId = await getReportChannelId(interaction.guildId)
    const reportChannel = await client.channels.fetch(reportChannelId)
  
    // レポート送信
    sendReportEmbed(joinedData, channel, reportChannel)
    // 出席データ削除
    await deleteJoinedData(channel.id);
    // 返信
    interaction.reply(successEmbed({
      title: SHUSSEKI_END_REC,
      message: SHUSSEKI_END_REC_MSG,
      fields: [
        { name: "チャンネル名", value: reportChannel.name },
      ],
      timestamp: true,
    }));
  } catch(error) {
    console.log("END_RECORDING===", error);
    throw error;
  }
}
export default shusseki;
