import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

const adapter = new JSONFile('/db/db.json')
const lowdb = new Low(adapter, { ReportChannel: {} })

export async function getLowdbTable(tableName) {
  try {
    await lowdb.read();
    const table = lowdb.data[tableName];
    if (!table) {
      console.log(`not exist table '${tableName}'`)
      return null
    }
    return table
  } catch(error) {
    console.log("lowdb ERROR===", error);
  }
};

export async function getLowdbData(tableName, key) {
  try {
    await lowdb.read();
    const table = lowdb.data[tableName];
    if (!table) {
      console.log(`not exist table '${tableName}'`)
      return null
    }
    return table[key]
  } catch(error) {
    console.log("lowdb ERROR===", error);
  }
};

export async function setLowdbData(tableName, key, value) {
  try {
    await lowdb.read();
    const table = lowdb.data[tableName];
    if (!table) {
      console.log(`not exist table '${tableName}'`)
      return null
    }
    table[key] = value
    await lowdb.write()
  } catch(error) {
    console.log("lowdb ERROR===", error);
  }
};

export async function deleteLowdbData(tableName, key) {
  try {
    await lowdb.read();
    const table = lowdb.data[tableName];
    if (!table) {
      console.log(`not exist table '${tableName}'`)
      return null
    }
    table[key] = undefined;
    await lowdb.write()
  } catch(error) {
    console.log("lowdb ERROR===", error);
  }
};