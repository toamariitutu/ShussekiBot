import * as lowdbAdapter from "./lowdbAdapter.js";

/** 
* 出席データ存在チェック
*/
export async function hasJoinedData(channelId) {
  try {
    const shussekiTable = await lowdbAdapter.getLowdbTable("shusseki");
    return shussekiTable != null && typeof value === "object" && Object.keys(shussekiTable).length > 0;
  } catch (error) {
    console.log("HAS_JOINED_DATA_ERROR===", error);
    throw error;
  }
}

/** 
* 出席データ取得
*/
export async function getJoinedData(channelId) {
  try {
    return await lowdbAdapter.getLowdbData("shusseki", channelId);
  } catch (error) {
    console.log("GET_JOINED_DATA_ERROR===", error);
    throw error;
  }
}

/** 
* 出席データ削除
*/
export async function deleteJoinedData(channelId) {
  try {
    await lowdbAdapter.deleteLowdbData("shusseki", channelId);
  } catch (error) {
    console.log("DELETE_JOINED_DATA_ERROR===", error);
    throw error;
  }
}

/** 
* 出席データ設定
*/
export async function setJoinedData(channelId, guildMembers) {
  try {
    const nowTimestamp = Date.now();
    const members = guildMembers.map(guildMember => ({
      id: guildMember.id,
      name: guildMember.displayName || guildMember.user.globalName,
      joinedAt: nowTimestamp,
    }), {});
    await lowdbAdapter.setLowdbData("shusseki", channelId, { startAt: nowTimestamp, members });
  } catch (error) {
    console.log("SET_JOINED_DATA_ERROR===", error);
    throw error;
  }
}

/** 
* 参加
*/
export async function join(channelId, member) {
  try {
    const data = await lowdbAdapter.getLowdbData("shusseki", channelId);
    if (!data) return;

    const members = data.members;
    const index = members.findIndex(data => data.id === member.id);
    if (index >= 0) {
      const memberData = members[index];
      const oldJoinedAt = memberData.joinedAt;
      const leftAt = memberData.leftAt || Date.now();
      members.splice(index, 1, {
        ...memberData,
        joinedAt: member.joinedAt,
        sum: (memberData.sum || 0) + (leftAt - oldJoinedAt),
      });
    } else {
      members.push(member);
    }
    await lowdbAdapter.setLowdbData("shusseki", channelId, {
      ...data,
      members,
    });
  } catch (error) {
    console.log("JOIN_ERROR===", error);
    throw error;
  }
}

/** 
* 退室
*/
export async function leave(channelId, member) {
  try {
    const data = await lowdbAdapter.getLowdbData("shusseki", channelId);
    if (!data) return;

    const members = data.members;
    const index = members.findIndex(data => data.id === member.id);
    if (index >= 0) {
      const memberData = members[index];
      members.splice(index, 1, {
        ...memberData,
        leftAt: member.leftAt,
      });
    }
    await lowdbAdapter.setLowdbData("shusseki", channelId, {
      ...data,
      members,
    });
  } catch (error) {
    console.log("LEAVE_ERROR===", error);
    throw error;
  }
}


/** 
* ReportChannelId取得
*/
export async function getReportChannelId(guildId) {
  try {
    return await lowdbAdapter.getLowdbData("reportChannel", guildId);
  } catch (error) {
    console.log("GET_REPORT_CH_ERROR===", error);
    throw error;
  }
}

/** 
* ReportChannel設定
*/
export async function setReportChannelId(guildId, channelId) {
  try {
    return await lowdbAdapter.setLowdbData("reportChannel", guildId, channelId);
  } catch (error) {
    console.log("SET_REPORT_CH_ERROR===", error);
    throw error;
  }
}

/** 
* ReportChannel削除
*/
export async function deleteReportChannelId(guildId) {
  try {
    return await lowdbAdapter.deleteLowdbData("reportChannel", guildId);
  } catch (error) {
    console.log("DELETE_REPORT_CH_ERROR===", error);
    throw error;
  }
}