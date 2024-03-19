require('dotenv').config();
var express = require('express');
var router = express.Router();
const axios = require('axios');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const AWS = require('aws-sdk');


AWS.config.update({
  region: 'us-west-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const ses = new AWS.SES({ apiVersion: '2010-12-01' });
const sns = new AWS.SNS();

const poolData = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
  ClientId: process.env.COGNITO_APP_CLIENT_ID
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

const apiKey = process.env.EXCHANGE_RATE_KEY;

/* GET home page. */
router.get('/', async (req, res, next) => {

  try {
    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/pair/CAD/JPY`)
    const responseData = response.data;
    const conversionRate = responseData.conversion_rate;
    const lastUpdate = responseData.time_last_update_utc;
    res.render('index', { title: 'Express', lastUpdate: lastUpdate, conversionRate: conversionRate });
  } catch (error) {
    console.error(error)
    res.status(500).send('Error fetching data');
  }

});

/* get main page*/

router.get('/main', function (req, res, next) {
  res.render('main')

});


router.get('/signup', (req, res) => {
  res.render('signup');
});

router.post('/signup', (req, res) => {
  const { email, password } = req.body; // Get email and password from the form

  const attributeList = [
    new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'email', Value: email })
  ];

  userPool.signUp(email, password, attributeList, null, (err, result) => {
      if (err) {
          console.error('Signup error:', err);
          res.status(400).render('signup', { errorMessage: err.message });
          return;
      }
      console.log('Signup success:', result);
      req.session.email = email; // Store email in session
      res.redirect('/confirm'); // Redirect to the confirmation page
  });
});





router.get('/login', (req, res) => {
  res.render('login');
});

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
      res.redirect('/main'); // Redirect to home page
    },
    onFailure: (err) => {
      if (err.code === 'UserNotConfirmedException') {
        // Redirect to the confirmation page with the username pre-filled
        res.render('confirm', { username: username, errorMessage: 'Account not confirmed. Please enter the verification code sent to your email.' });
      } else {
        // Handle other errors
        console.error(err);
        res.status(401).render('login', { errorMessage: 'Login failed. Please try again.' });
      }
    }
  });
});

router.get('/confirm', (req, res) => {
  const email = req.session.email; // Retrieve email from session
  res.render('confirm', { email: email });
});

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
      res.redirect('/preferences'); // Redirect to preferences page after successful confirmation
  });
});


router.get('/preferences', (req, res) => {
  const currencies = [
      { code: 'USD', name: 'United States Dollar' },
      { code: 'EUR', name: 'Euro' },
      { code: 'JPY', name: 'Japanese Yen' },
      // Add more currencies as needed
  ];

  res.render('preferences', { currencies: currencies });
});



router.post('/preferences', async (req, res) => {
  const email = req.session.email; // Retrieve email from session

  const { fromCurrency, toCurrency, threshold } = req.body;
 

  const docClient = new AWS.DynamoDB.DocumentClient();

   const params = {
        TableName: 'UserCurrency',
        Item: {
            email: email, // Primary key
            fromCurrency: fromCurrency,
            toCurrency: toCurrency,
            threshold: parseFloat(threshold)
        }
    };

  try {
      await docClient.put(params).promise();
      console.log('Preferences saved:', params.Item);
      res.redirect('/login'); // Redirect to the main page
  } catch (err) {
      console.error('Error saving preferences:', err);
      res.status(500).render('preferences', { errorMessage: 'Error saving preferences. Please try again.' });
  }
});



/*get profile page*/
router.get('/profile', function (req, res, next) {
  //need to retrieve data from database 


  //retrieve currently logged in user's email
  const email = "cloud@gmail.com"
  res.render('profile', { email: email });
})

//via SES 
router.post('/sendEmail', async (req, res) => {
  const userCurrencyPair = 'USD/CAD';
  const targetRate = 1.25;
  const recipient = 'angelayu8800@gmail.com';
  const subject = 'Target rate hit!';
  const message = `The target rate of ${targetRate} for ${userCurrencyPair} has been hit!`;

  const params = {
    Destination: {
      ToAddresses: [recipient]
    },
    Message: {
      Body: {
        Text: { Data: message }
      },
      Subject: { Data: subject }
    },
    Source: 'currencyapp265@gmail.com' //THIS IS OUR WEB APP'S EMAIL (ask angela for the password)
  };

  try {
    const data = await ses.sendEmail(params).promise();
    console.log('Email sent:', data);
    res.send({ message: 'Email sent successfully' });
  } catch (err) {
    console.error('Email sending failed:', err);
    res.status(500).send({ message: 'Failed to send email' });
  }
});

//verify email with SES aka adding users to SES (once user signs up we can run this and get them to verify their email this is kinda awks cause it sends via AWS email ...)
router.post('/verify-email', async (req, res) => {
  const { email } = 'yuangelaa@icloud.com';

  const params = {
    EmailAddress: 'yuangelaa@icloud.com'
  };

  try {
    await ses.verifyEmailIdentity(params).promise();
    console.log(`Verification email sent to ${email}`);
    res.status(200).send('Verification email sent successfully');
  } catch (error) {
    console.error(`Failed to send verification email to ${email}:`, error);
    res.status(500).send('Failed to send verification email');
  }
});

//will send email notification via SNS to ALL members (NOT THE SERVICE I WANT TO USE TBH BUT IT WORKS)
router.post('/sendNotif', async (req, res) => {
  const subject = "rate hit";
  const body = "CASDKJASKDJ";

  const params = {
      TopicArn: 'arn:aws:sns:us-west-2:533267160590:currency', // Replace with your SNS topic ARN
      Message: JSON.stringify({
          default: 'Custom email notification',
          email: JSON.stringify({
              subject: subject,
              body: body
          })
      }),
      MessageStructure: 'json'
  };

  try {
      await sns.publish(params).promise();
      res.status(200).send('Email sent successfully');
  } catch (error) {
      console.error('Email sending failed:', error);
      res.status(500).send('Failed to send email');
  }
});

module.exports = router;
