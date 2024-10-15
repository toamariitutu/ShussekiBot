import * as Discord from "discord.js";
import config from "./config.js";

/** 
* タイムスタンプの整形
*/
export function formatTimestamp(duration) {
  const hour = Math.floor(duration / 3600000);
  const minute = Math.floor((duration - 3600000 * hour) / 60000);
  const hh = ('00' + hour).slice(-2);
  const mm = ('00' + minute).slice(-2);
  const ms = ('00000' + (duration % 60000)).slice(-5);
  return `${hh}:${mm}:${ms.slice(0, 2)}`;
}

/** 
* 成功用のembed設定
*/
export function successEmbed(data) {
  const title = data.title;
  const message = data.message;
  const fields = data.fields;
  const needsTimestamp = data.timestamp;
  const embed = new Discord.EmbedBuilder();
  embed.setColor(config.colors.success);
  if (title) embed.setTitle(title);
  if (message) embed.setDescription(message);
  if (fields) embed.addFields(fields);
  if (needsTimestamp) embed.setTimestamp();
  return { embeds: [embed] };
}

/** 
* info用のembed設定
*/
export function infoEmbed(data) {
  const title = data.title;
  const message = data.message;
  const fields = data.fields;
  const needsTimestamp = data.timestamp;
  const embed = new Discord.EmbedBuilder();
  embed.setColor(config.colors.info);
  if (title) embed.setTitle(title);
  if (message) embed.setDescription(message);
  if (fields) embed.addFields(fields);
  if (needsTimestamp) embed.setTimestamp();
  return { embeds: [embed] };
}

/** 
* 警告用のembed設定
*/
export function warningEmbed(data) {
  const title = data.title;
  const message = data.message;
  const fields = data.fields;
  const needsTimestamp = data.timestamp;
  const embed = new Discord.EmbedBuilder();
  embed.setColor(config.colors.warning);
  if (title) embed.setTitle(title);
  if (message) embed.setDescription(message);
  if (fields) embed.addFields(fields);
  if (needsTimestamp) embed.setTimestamp();
  return { embeds: [embed] };
}

/** 
* エラー用のembed設定
*/
export function errorEmbed(data, error) {
  const title = data.title;
  const message = data.message;
  const fields = data.fields;
  const needsTimestamp = data.timestamp || error;
  const embed = new Discord.EmbedBuilder();
  embed
    .setColor(config.colors.error)
    .setTitle(title || "エラーが発生しました！")
  if (message) embed.setDescription(message);
  if (fields || error) {
    embed.addFields(fields
      ? fields
      : [
        { name: "エラー", value: error.name },
        { name: "メッセージ", value: error.message }
      ]
    );
  }
  if (needsTimestamp) embed.setTimestamp();
  return { embeds: [embed] };
}

/** 
* レポート用のembed送信
*/
export function sendReportEmbed(joinedData, currentChannel, reportChannel, recordContinue) {
  const nowTimestamp = Date.now();
  const strArray = [];
  const fields = [
    `記録時間：　${formatTimestamp(nowTimestamp - joinedData.startAt)}`,
    "\n",
    "**合計滞在時間　ユーザー名**"
  ];
  joinedData.members.sort(ascMemberName).forEach((member, i) => {
    const endAt = member.leftAt < member.joinedAt
      ? nowTimestamp
      : member.leftAt || nowTimestamp;
    const time = formatTimestamp(endAt - member.joinedAt + (member.sum || 0));
    fields.push(`${time}　　　 ${member.name}`);
    strArray.push(member.name);
  });
  const message = `${fields.join("\n")}\n\n\`\`\`\n${strArray.join('／')}\n\`\`\`\n`
  // 送信
  reportChannel.send(infoEmbed({
    title: `チャンネル ${currentChannel.name} での通話の出席記録${recordContinue ? "の途中経過報告" : ""}です！`,
    message: message,
    timestamp: true,
  }));
}

function ascMemberName(a, b) {
  const nameA = a.name.toUpperCase(); // 大文字と小文字を無視する
  const nameB = b.name.toUpperCase(); // 大文字と小文字を無視する
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }
  return 0;
}


function timeToJSTTimestamp(timestamp) {
  var dt = new Date(); //Date オブジェクトを作成
  var tz = dt.getTimezoneOffset(); //サーバーで設定されているタイムゾーンの世界標準時からの時差（分）
  tz = (tz + 540) * 60 * 1000; //日本時間との時差(9時間=540分)を計算し、ミリ秒単位に変換

  dt = new Date(timestamp + tz); //時差を調整した上でタイムスタンプ値を Date オブジェクトに変換
  return dt;
}

export function timeToJST(timestamp, format = true) {
  const dt = timeToJSTTimestamp(timestamp || Date.now());
  const year = dt.getFullYear();
  const month = dt.getMonth() + 1;
  const date = dt.getDate();
  const hour = dt.getHours();
  const minute = dt.getMinutes();
  const second = dt.getSeconds();

  let return_str;
  if (format == true) {
    return_str = `${year}/${month}/${date} ${hour}:${minute}:${second}`;
  } else {
    return_str = { "year": year, "month": month, "date": date, "hour": hour, "minute": minute, "second": second };
  }
  return return_str;
}

export async function sendErrorLog(client, error, opt = 'ERROR===') {
  try {
    console.log(opt, error);
    const logChannel = await client.channels.fetch(config.channels.log);
    logChannel.send(errorEmbed({
      title: opt,
      message: `\`\`\`\n${error.stack}\n\`\`\``,
      fields: [
        { name: "timestamp", value: timeToJST() },
      ],
      timestamp: true,
    }));
  } catch (error) {
    console.log("TEST===", error);
  }
}