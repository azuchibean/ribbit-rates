const { db, Table } = require("./db.config.js");

// Gets latest exchange rate from DynamoDB
const fetchExchangeRate = async (fromCurrency, toCurrency) => {

  const params = {
    TableName: Table,
    KeyConditionExpression: "CurrencyPair = :currencyPair",
    ExpressionAttributeValues: {
      ":currencyPair": `${fromCurrency}:${toCurrency}`,
    },
    ScanIndexForward: false, // Get items in descending order of date
    Limit: 1, // Limit the result to 1 item (the latest date)
  };

  try {
    const result = await db.query(params).promise();

    return result.Items[0].ConversionRate;
  } catch (error) {
    console.log(error);
    return { success: false, data: null };
  }
};

// Gets last weeks data from DynamoDB
const fetchLastSevenDays = async (fromCurrency, toCurrency) => {
  const params = {
    TableName: Table,
    KeyConditionExpression: "CurrencyPair = :currencyPair",
    ExpressionAttributeValues: {
      ":currencyPair": `${fromCurrency}:${toCurrency}`,
    },
    ScanIndexForward: false, // Get items in descending order of date
    Limit: 8, // Limit the result to 7 items (the latest date)
  };

  try {
    const result = await db.query(params).promise();
    return result.Items
  } catch (error) {
    console.log(error);
    return { success: false, data: null };
  }
};

module.exports = {
  fetchExchangeRate,
  fetchLastSevenDays
};
