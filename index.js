import {
  Events,
  Client,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import express from 'express';
import config from "./config.js";
import * as load_commands from "./startup/load_commands.js";
import * as deploy_commands from "./startup/deploy_commands.js";
import * as interaction_create_handler from "./startup/interaction_create_handler.js";
import { sendReportEmbed, sendErrorLog } from "./functions.js";
import {
  getJoinedData,
  deleteJoinedData,
  join,
  leave,
  getReportChannelId,
} from "./adapters/adapter.js";
import { getLodb, getLowdbTable } from "./adapters/lowdbAdapter.js";
import {
  ACTIVITY_NAME,
  CLIENT_READY,
  MESSAGE_GENERAL,
  MESSAGE_HELP,
  MESSAGE_THANKS,
  MESSAGE_GREET,
  MESSAGE_HELLO,
  MESSAGE_GOOD_NIGHET,
} from "./strings/string.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.User,
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message,
    Partials.Reaction,
  ],
});

const regex1 = /(✋\s?✊\s?✊)/g;
const regex2 = /(🫲\s?✊\s?✊)/g;

/** 
 * スラッシュコマンド登録処理
 */
deploy_commands.start();

/** 
 * インタラクション（コマンド）受信時の処理
 */
interaction_create_handler.call(client);

// bot起動時の処理
client.on(Events.ClientReady, async () => {
  try {
    // botアクティブ化
    client.user.setPresence({
      activities: [
        { name: ACTIVITY_NAME },
      ],
      status: "online"
    });
    console.log("=== Bot起動 ===")
    client.channels.cache.get(config.channels.log).send(CLIENT_READY);
    // スラッシュコマンドの読込
    load_commands.start(client);
  } catch (error) {
    sendErrorLog(client, error, "READY===")
  }
});

// VCの入退室検知のイベントハンドラ
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  try {
    //connect
    if (oldState.channelId == null && newState.channelId != null) {
      console.log(newState.member.user.displayName)
      await join(newState.channelId, {
        id: newState.member.user.id,
        name: newState.member.displayName || newState.member.user.globalName,
        joinedAt: Date.now(),
      })
    }

    //disconnect
    if (oldState.channelId != null && newState.channelId == null) {
      await leave(oldState.channelId, {
        id: newState.member.user.id,
        name: newState.member.displayName || newState.member.user.globalName,
        leftAt: Date.now(),
      })

      // 出席データ取得
      const joinedData = await getJoinedData(oldState.channelId);
      if (!oldState.channel.members.size && joinedData) {
        // 最後の退出者かつ出席データが存在した場合
        // 報告チャンネル取得
        const reportChannelId = await getReportChannelId(oldState.guild.id);
        const reportChannel = await client.channels.fetch(reportChannelId);
        // レポート送信
        sendReportEmbed(joinedData, oldState.channel, reportChannel);
        // 出席データ削除
        await deleteJoinedData(oldState.channelId);
      }
    }
  } catch (error) {
    sendErrorLog(client, error, "VOICE_STATE===");
  }
});

// メンション検知のイベントハンドラ
client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return; // Botには反応しないようにする

  if (message.content.match(regex1)) {
    return message.channel.send(":raised_hand: :fist: :fist:");
  }
  if (message.content.match(regex2)) {
    return message.channel.send(":leftwards_hand: :fist: :fist:");
  }

  const mentions = message.mentions;
  if (mentions.users.has(client.user.id) ||
    mentions.roles.some(r => [client.user.username].includes(r.name))) {
    if (message.content.toLowerCase().includes("help")) {
      return message.channel.send(MESSAGE_HELP);
    }
    if (message.content.includes("自己紹介")) {
      return message.channel.send(`はじめまして！私は ${client.user.username} です！\n${MESSAGE_HELP}`);
    }
    if (message.content.includes("ありがと") || message.content.includes("感謝")) {
      return message.channel.send(MESSAGE_THANKS);
    }
    if (message.content.includes("おはよ")) {
      return message.channel.send(MESSAGE_GREET);
    }
    if (message.content.includes("こんにち")) {
      return message.channel.send(MESSAGE_HELLO);
    }
    if (message.content.includes("おやす")) {
      return message.channel.send(MESSAGE_GOOD_NIGHET);
    }
    // DBデータ確認用
    if (message.content.includes("db.getTable(")) {
      const logChannel = await client.channels.fetch(config.channels.log);
      const match = message.content.match(/db.getTable\(["|'](.+)["|']\)/);
      if (match) {
        const tableName = match[1]
        const tableData = await getLowdbTable(tableName);
        if (tableData == null) {
          return logChannel.send(`テーブル${tableName}は存在しません。`);
        }
        return logChannel.send(`現在の${tableName}のデータです。\n\`\`\`\n${JSON.stringify(tableData, null, 2)}\n\`\`\``);
      }
    }
    if (message.content.includes("db.getAllData()")) {
      const logChannel = await client.channels.fetch(config.channels.log);
      const data = await getLodb();
      return logChannel.send(`現在の全データです。\n\`\`\`\n${JSON.stringify(data, null, 2)}\n\`\`\``);
    }
    message.channel.send(MESSAGE_GENERAL);
  }
});

// エラー処理 (これ入れないとエラーで落ちる。本当は良くないかもしれない)
process.on("uncaughtException", error => {
  sendErrorLog(client, error, "ERROR - uncaughtException");
  process.exit(-1);
});

process.on("unhandledRejection", (reason, promise) => {
  sendErrorLog(client, reason, "ERROR - unhandledRejection");
});

const app = express();
// ルーティングの設定
app.get("/", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("content-type", "text/plain");
  res.send("Discord Bot is active now.\n");
});

app.listen(3000, () => {
  console.log(`Opened API Server`);
});

// bot起動処理
(async () => {
  try {
    console.log("Bot is starting...");
    // Discordログイン
    client.login(config.token);
  } catch (error) {
    sendErrorLog(client, error, "LOGIN===")
  }
})();
