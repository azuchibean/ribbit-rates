var express = require('express');
var router = express.Router();
const axios = require('axios');

const apiKey = process.env.EXCHANGE_RATE_KEY;

/* GET home page. */
router.get('/', async(req, res, next) => {

  try {
    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/pair/CAD/JPY`)
    const responseData = response.data;
    const conversionRate = responseData.conversion_rate;
    const lastUpdate = responseData.time_last_update_utc;
    res.render('index', { title: 'Express' , lastUpdate: lastUpdate, conversionRate: conversionRate});
  } catch (error) {
    console.error(error)
    res.status(500).send('Error fetching data');
  }

});

module.exports = router;
