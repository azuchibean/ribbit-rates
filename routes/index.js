require('dotenv').config();
var express = require('express');
var router = express.Router();
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
var { fetchExchangeRate, fetchLastSevenDays } = require('../db');
const QuickChart = require('quickchart-js');
const { body, validationResult } = require('express-validator');
const ses = new AWS.SES({ apiVersion: '2010-12-01' });
const docClient = new AWS.DynamoDB.DocumentClient();

AWS.config.update({
  region: 'us-west-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});


const poolData = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
  ClientId: process.env.COGNITO_APP_CLIENT_ID
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

//authenticates user based on their accesstoken given on cognito login 
function requireAuth(req, res, next) {
  try {
    const accessToken = req.session.user.accessToken;
    //validate accessToken expiry
    const decodedToken = jwt.decode(accessToken);
    const currentTime = Math.floor(Date.now() / 1000);

    if (!decodedToken || !decodedToken.exp || decodedToken.exp < currentTime) {
      console.log("Access token is invalid or expired");
      return res.redirect('/login');
    }

    // Calculate remaining time until token expiration
    const remainingTime = decodedToken.exp - currentTime;
    console.log("Access token expires in:", remainingTime, "seconds");

    // Token is valid, continue with your logic
    next();
  } catch (e) {
    console.log("Access token is missing please login");
    return res.redirect('/login');
  }

}


/* GET home page. */
router.get('/', async (req, res, next) => {
  try {
    // Render the index page with the retrieved data
    res.render('index');
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).send('Error fetching data');
  }
});

/* get main page*/
router.get('/main', requireAuth, function (req, res, next) {
  const filePath = path.join(__dirname, '..', 'public', 'currencies.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  res.render('main', { currencies: data.currencies });
});

//get converter tool page
router.get('/converter', requireAuth, function (req, res) {
  const filePath = path.join(__dirname, '..', 'public', 'currencies.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  res.render('converter', { currencies: data.currencies });
})


//get verify email page 
router.get('/verify', (req, res) => {
  res.render('verify');
})

//verify email with SES 
router.post('/verify-email', body('email').isEmail().normalizeEmail(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('verify', { errorMessage: 'Invalid email format' });
  }
  const email = req.body.email;

  try {
    //check if the email is already an identity in SES
    const result = await ses.getIdentityVerificationAttributes({
      Identities: [email]
    }).promise();

    const isVerified = result.VerificationAttributes[email]?.VerificationStatus === 'Success';
    console.log(isVerified)

    if (!isVerified) {
      console.log(`${email} is not verified`);

      const params = {
        EmailAddress: email
      };

      // User has not verified their email so send them a verification email 
      await ses.verifyEmailIdentity(params).promise();
      console.log(`Verification email sent to ${email}`);
      //redirect them to signup page to continue creating their account
      const message = "Verification email sent. Please verify your email before creating your account."
      res.redirect(`/signup?email=${email}&message=${encodeURIComponent(message)}`);
      return;
    }

    //valid identity in SES 
    console.log(`${email} is already verified`);

    const params = {
      Username: email,
      UserPoolId: process.env.COGNITO_USER_POOL_ID
    };

    //check if they exist in user pool 
    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });
    try {
      await cognitoIdentityServiceProvider.adminGetUser(params).promise();
      // User exists in Cognito user pool, redirect to login
      const message = `${email} is already registered. Please log in.`;
      return res.redirect(`/login?message=${encodeURIComponent(message)}`);
    } catch (error) {
      if (error.code === 'UserNotFoundException') {
        // User does not exist in Cognito user pool, proceed with signup process
        const message = "Account creation incomplete. Please complete the sign-in process."
        req.session.email = email;
        return res.render('signup', { message, email: req.session.email });
      }

      //failed to send verification email, redirect to verify page 
      console.error(`Failed to send verification email to ${email}:`, error);
      return res.render('verify');
    }
  } catch (error) {
    console.error(`Failed to send verification email to ${email}:`, error);
    res.render('verify');
  }
});


/* get sign up page */
router.get('/signup', (req, res) => {
  const email = req.query.email || ''
  const message = req.query.message || ''
  req.session.email = email
  res.render('signup', { email, message });
});

/* Process signup account and verfication */
router.post('/signup', async (req, res) => {
  const { password } = req.body; // Get email and password from the form
  const email = req.session.email
  try {
    const result = await ses.getIdentityVerificationAttributes({
      Identities: [email]
    }).promise();

    const isVerified = result.VerificationAttributes[email]?.VerificationStatus === 'Success';

    if (!isVerified) {
      console.log(`Email ${email} is not verified`);
      const message = 'Email is not verified. Please check your inbox and verify your email.'
      res.status(400).render('signup', { email: req.session.email, message: '', errorMessage: message });
      return;
    }

    const attributeList = [
      new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'email', Value: email })
    ];

    userPool.signUp(email, password, attributeList, null, (err, result) => {
      if (err) {
        console.error('Signup error:', err);
        let errorMessage = err.message;

        // Check if the error is because the user already exists
        if (err.code === 'UsernameExistsException') {
          errorMessage = 'User already exists. Please use a different email or login.';
        }
        res.status(400).render('signup', { email: req.session.email, message: '', errorMessage: err.message });
        return;
      }
      console.log('Signup success:', result);
      req.session.email = email; // Store email in session
      res.redirect('/confirm'); // Redirect to the confirmation page
    });
  } catch (error) {
    console.error(`Failed to check verification status for email ${email}:`, error);
    res.status(500).render('signup', { email: req.session.email, message: '', errorMessage: 'Try again.' });
  }

});


/* get login page */
router.get('/login', (req, res) => {
  const message = req.query.message;
  res.render('login', { message: message });
});

/* login with user and direct to main page */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
    Username: username,
    Password: password
  });

  const userData = {
    Username: username,
    Pool: userPool
  };

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: (result) => {
      console.log('Login successful');
      req.session.user = {
        accessToken: result.getAccessToken().getJwtToken(),
        email: username
      }
      res.redirect('/main'); // Redirect to home page
    },
    onFailure: (err) => {
      if (err.code === 'UserNotConfirmedException') {
        // Redirect to the confirmation page with the username pre-filled
        res.render('confirm', { email: username, errorMessage: 'Account not confirmed. Please enter the verification code sent to your email.' });
      } else if (err.code === 'NotAuthorizedException') {
        // Handle incorrect email or password
        res.render('login', { errorMessage: 'Email or password is incorrect.', message: '' });
      } else {
        // Handle other errors
        console.error(err);
        res.render('login', { errorMessage: 'Login failed. Please try again.', message: '' });
      }
    }
  });
});


/* get email verification page */
router.get('/confirm', (req, res) => {
  const email = req.session.email; // Retrieve email from session
  res.render('confirm', { email: email });
});

/* processs confirmation of account */
router.post('/confirm', (req, res) => {
  const { username, code } = req.body; // Username is now passed as a hidden field

  const userData = {
    Username: username,
    Pool: userPool
  };

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  cognitoUser.confirmRegistration(code, true, (err, result) => {
    if (err) {
      console.error(err);
      res.status(400).render('confirm', { email: username, errorMessage: err.message });
      return;
    }
    console.log('Account confirmed:', result);
    res.redirect('/login?message=Account successfully created. Please log in.'); // Redirect to login page after successful confirmation
  });
});

// Get current exchange rate for select currencies
router.post('/query', async (req, res) => {
  const fromCurrency = req.body.fromCurrency;
  const toCurrency = req.body.toCurrency;

  const exchangeRate = await fetchExchangeRate(fromCurrency, toCurrency);

  res.json({ exchangeRate });
});

// Get currency data for last seven days for select currencies
router.post('/getLastWeekData', async (req, res) => {
  const fromCurrency = req.body.selectedOption1;
  const toCurrency = req.body.selectedOption2;

  const exchangeRates = await fetchLastSevenDays(fromCurrency, toCurrency);

  res.json({ exchangeRates });
});

// Create chart for recent trends and return it
router.post('/getChart', async (req, res) => {
  const dataArray = req.body.dataArray;
  const labelsArray = req.body.labelsArray;
  const currencyPair = req.body.currencyPair;

  const myChart = new QuickChart();
  myChart
    .setConfig({
      type: 'line',
      data: {
        labels: labelsArray,
        datasets: [{
          label: currencyPair, data: dataArray, borderColor: 'rgb(144, 238, 144)', backgroundColor: 'rgba(144, 238, 144, 0.5)'
        },],
      },
      options: {
        scales: {
          y: {
            min: 0,
          }
        },
        legend: {
          display: false
        },
        title: {
          display: true,
          text: "Recent Trends"
        }
      }
    })
    .setWidth(420)
    .setHeight(340)
    .setBackgroundColor('transparent');

  const chartUrl = myChart.getUrl();

  res.send(chartUrl)


})


/*get profile page*/
router.get('/profile', requireAuth, function (req, res, next) {
  //retrieve currently logged in user's email
  const email = req.session.user.email

  //retrieve currencies from json file
  const filePath = path.join(__dirname, '..', 'public', 'currencies.json');
  const currencies = JSON.parse(fs.readFileSync(filePath, 'utf8')).currencies;

  const params = {
    TableName: "Users",
    KeyConditionExpression: '#u = :u',
    ExpressionAttributeNames: {
      '#u': 'user'
    },
    ExpressionAttributeValues: {
      ':u': email // Assuming email is the partition key value
    }
  };

  //need to retrieve user's rate alerts from db
  docClient.query(params, function (err, data) {
    if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
      res.status(500).send("Error retrieving rate alerts");
    } else {
      //render rate alerts in profile page 
      const rateAlerts = data.Items || [];
      console.log(data.Items)
      res.render('profile', { email: email, rateAlerts: rateAlerts, currencies: currencies });
    }
  })
})

//POST new rate alert
router.post('/profile', async (req, res, next) => {
  const { fromCurrency, toCurrency, rateExchange, alertId } = req.body;

  const email = req.session.user.email;

  const putParams = {
    TableName: 'Users',
    Item: {
      user: email,
      alertId: alertId,
      from: fromCurrency,
      to: toCurrency,
      rate: parseFloat(rateExchange)
    }
  };

  try {
    //store it in user's table in dynamodb
    await docClient.put(putParams).promise();
    console.log('Rate alert saved successfully');
    res.redirect('/profile');
  } catch (err) {
    console.error('Error saving rate alert:', err);
    res.status(500).send('Error saving rate alert');
  }
});

//POST that checks for duplicate rate alerts 
router.post('/check-duplicate', async (req, res) => {
  const email = req.session.user.email;

  const { fromCurrency, toCurrency, rateExchange } = req.body;

  const paramsQuery = {
    TableName: 'Users',
    KeyConditionExpression: '#u = :u',
    ExpressionAttributeNames: {
      '#u': 'user'
    },
    ExpressionAttributeValues: {
      ':u': email
    }
  };

  try {
    // Check if the new entry already exists
    const data = await docClient.query(paramsQuery).promise();
    const existingEntries = data.Items;

    const isDuplicate = existingEntries.some(entry =>
      entry.from === fromCurrency &&
      entry.to === toCurrency &&
      entry.rate === parseFloat(rateExchange)
    );

    if (isDuplicate) {
      console.log('Duplicate entry found');
      res.status(400).send('Duplicate entry');
      return;
    }
    // No duplicate found, send success response
    res.sendStatus(200);
  } catch (err) {
    console.error('Error checking for duplicate entry:', err);
    res.status(500).send('Error checking for duplicate entry');
  }
});

//DELETE the rate alert by the unique alertId
router.delete('/profile/:alertId', async (req, res, next) => {
  const { alertId } = req.params;
  const email = req.session.user.email;

  const params = {
    TableName: 'Users',
    Key: {
      user: email,
      alertId: alertId
    }
  };

  try {
    //delete rate alert from table
    await docClient.delete(params).promise();
    console.log(`Alert with id ${alertId} deleted successfully`);
    res.sendStatus(200); // Send a success response
  } catch (err) {
    console.error('Error deleting alert:', err);
    res.status(500).send('Error deleting alert');
  }
});

//retrieve user's session data for testing purposes 
router.get('/session-data', (req, res) => {
  console.log(req.session);
  res.send('Session data logged in the console.');
});

/* Logout user */
router.get('/logout', (req, res) => {
  //destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/'); // Redirect to login page after logout
  });
});


/* Get location from database and display on map */
router.get('/map', requireAuth, async (req, res) => {

  const params = {
    TableName: 'location'
  };
  try {
    const data = await docClient.scan(params).promise();
    const locations = data.Items.map(item => ({
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      address: item.address
    }));

    const locationsJson = JSON.stringify(locations);

    res.render('map', {
      mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,
      locations: locationsJson
    });

  } catch (err) {
    console.error('Error fetching data from DynamoDB:', err);
    res.status(500).send('Error fetching location data');
  }
});



/* Foget password page*/
router.get('/forgot-password', (req, res) => {
  res.render('forgot_password');
});


/* Send verification code to user email */
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  const userData = {
    Username: email,
    Pool: userPool
  };

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  cognitoUser.forgotPassword({
    onSuccess: () => {
      res.render('reset_password', { email: email, message: 'Please check your email for the verification code.' });
    },
    onFailure: (err) => {
      console.error(err);
      res.render('forgot_password', { errorMessage: 'Failed to initiate password reset. Please try again.' });
    }
  });
});

/* Reset password page */

router.get('/reset-password', (req, res) => {
  res.render('reset_password', { email: '', message: '' });
});


/* Replace password in cognito */
router.post('/reset-password', (req, res) => {
  const { email, verificationCode, newPassword } = req.body;

  const userData = {
    Username: email,
    Pool: userPool
  };

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  cognitoUser.confirmPassword(verificationCode, newPassword, {
    onSuccess: () => {
      res.render('login', { message: 'Password reset successfully. You can now log in with your new password.' });
    },
    onFailure: (err) => {
      console.error("Reset password error:", err);
      res.render('reset_password', { email: email, errorMessage: 'Verification code is incorrect or password is invalid.' });
    }
  });
});



module.exports = router;
