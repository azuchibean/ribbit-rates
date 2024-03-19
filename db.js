const { db, Table } = require("./db.config.js");

// Read all tasks
const readAllDates = async () => {
  const params = {
    TableName: Table,
  };

  try {
    const { Items = [] } = await db.scan(params).promise();
    console.log("im in")
    return { success: true, data: Items };
  } catch (error) {
    return { success: false, data: null };
  }
};


module.exports = {
  readAllDates
};