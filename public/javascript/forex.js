const axios = require('axios');
const apiKey = process.env.EXCHANGE_RATE_KEY;

async function getExchangeRate() {

    const fromCurrency = document.getElementById(currency-from)
    const toCurrency = document.getElementById(currency-to)

    try {
        const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/pair/${fromCurrency}/${toCurrency}`)
        const responseData = response.data;
        const conversionRate = responseData.conversion_rate;
        const lastUpdate = responseData.time_last_update_utc;
        
      } catch (error) {
        console.error(error)
      }
}