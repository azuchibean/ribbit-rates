var express = require('express');
var router = express.Router();
const axios = require('axios');


/* GET home page. */
router.get('/', async (req, res, next) => {
  try {
    // Make an HTTP request to the backend API endpoint
    const response = await axios.get(`http://localhost:3000/api/table`);
    console.log("after await")

    // Check if the response was successful
    if (response.status !== 200) {
      throw new Error('Failed to fetch datas');
    }

    const tasks = response.data;

    // Render the index page with the retrieved data
    res.render('index', { title: 'Express'});
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).send('Error fetching data');
  }
});

/* get main page*/
router.get('/main', function (req, res, next) {
  res.render('main')
});

module.exports = router;
