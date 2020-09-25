/* eslint-disable radix */
const express = require('express');
const axios = require('axios');
global.fetch = require('node-fetch');
const moment = require('moment');
const AWS = require('aws-sdk');
const generatePassword = require('password-generator');
var validator = require("email-validator");
const router = express.Router();
const uuidv4 = require('uuid/v4');
const ElasticSearch = require('../common/es');
const e = require('express');
const nodemailer = require("nodemailer");
require('moment-timezone');

// const es_domain = 'https://localhost:1111'
const es_domain = 'https://vpc-kitapp-amplab-ph-stg-5gcdf32nwsgyt36huxqq6rwyz4.ap-southeast-1.es.amazonaws.com'
const es = new ElasticSearch(es_domain)
router.post('/authenticate-user', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  let authenticateUser = {};
  try {
    console.log('API IN!')
    console.log('CRED', req.body)
    let query = {
      must : {
        match : { email_address : req.body.username }
      },
      must: {
        match : { password : req.body.password }
      }
    }
    let possible = await es.mustMatchDocuments(process.env.authenticate_ES_HOST, query)
    console.log('POSSIBLE_INFO', Object.keys(possible).length == 0)
    if(Object.keys(possible).length == 0){
      query = {
        must : {
          match : { email_address : req.body.username }
        },
        must: {
          match : { password_generated_reset : req.body.password }
        }
      }
      possible = await es.mustMatchDocuments(process.env.authenticate_ES_HOST, query)
    }
    for(let i = 0; i < possible.length; i++){
      console.log('AS', possible[i].password_generated_reset === req.body.password)
      if(possible[i].email_address === req.body.username && possible[i].password === req.body.password){
        authenticateUser = possible[i];
        break;
      }
      // else if(possible[i].email_address === req.body.username && possible[i].password_generated_reset === req.body.password){
      //   authenticateUser = possible[i];
      //   break;
      // }
    }
    console.log('authenticateUser', authenticateUser)
    req.session.username = {
      username : authenticateUser.username,
      id : authenticateUser.id,
      image : authenticateUser.image,
      email_address : authenticateUser.email_address,
      full_name : authenticateUser.name,
      type : authenticateUser.type,
    };
    console.log('ASD', req.session)
    if(Object.keys(authenticateUser).length && authenticateUser.password){
      response = 'authenticated';
    }
    else{
      response = 'unauthenticated';
    }
    if(authenticateUser.is_activated == 0){
      response = 'deactivated'
    }
    if (response) {
      payload = response;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.get('/signout', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    delete req.session.username
    response = 'success'
    if (response) {
      payload = response;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.get('/products', async (req, res) => {
  let products = {};
  const date = new Date();
  let productsRes = [];
  let withoutOrder = [];
  let orders = [];
  try {
    let query = {
      must_not : {
        match : { is_enabled : 0 }
      },
    }
    let sort = {
      created_at: {
        order: "asc"
      }
    }
    let getAllProducts = await es.getAllDocuments(process.env.products_ES_HOST, query)
    for(let j = 0; j < getAllProducts.length; j++){
      for(let i = 0; i < getAllProducts.length; i++){
        if(getAllProducts[i].order == productsRes.length+1){
          console.log(true)
          productsRes.push(getAllProducts[i])
          break;
        }
      }
    }
    for(let i = 0; i < getAllProducts.length; i++){
      orders.push(getAllProducts[i].order)
    }
    let largest= 0;
    for (i=0; i<=largest;i++){
        if (orders[i]>largest) {
          largest=orders[i];
        }
    }
    for(let i = 0; i < largest; i++){
      if( !(orders.includes(i+1))){
        withoutOrder.push(i+1)
      }
    }
    for(let i = 0; i < orders.length; i++){
      if( !orders.includes( i+1) &&  (i+1) != orders.length ){
        withoutOrder.push(i+1)
      }
    }
    console.log('withoutOrder', withoutOrder)
    console.log('orders', orders)
    products = getAllProducts;
    if(products[0] != undefined){
      products[0].withoutOrder = withoutOrder
    }
  } catch (error) {
    console.log('Get Products error:', error);
    message = 'Internal Server Error';
  }
  res.send(products);
});

router.post('/add-product', async (req, res) => {
  let payload = {};
  let id;
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    console.log('API IN!')
    console.log('parameter', req.body)
    const newProduct = Object.assign({
      id: uuidv4(),
      created_at: moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'),
    }, req.body);
    response = await es.create(process.env.products_ES_HOST, newProduct, newProduct.id);
    console.log('Add product res', response)
    if (response) {
      await axios.patch('/api/force-update');
      payload = response;
      id = newProduct.id;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    id,
    message,
    status,
  });
});

router.patch('/disable-product', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    const disableProduct = {
      doc: Object.assign({
        updated_at: moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'),
      }, req.body),
    };
    const response = await es.update(process.env.products_ES_HOST, disableProduct, req.body.id);
    console.log('Disable prod res', response)
    if (response) {
      await axios.patch('/api/force-update');
      payload = response;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.patch('/update-product', async (req, res) => {
  let payload = {};
  let id;
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    const disableProduct = {
      doc: Object.assign({
        updated_at: moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'),
      }, req.body),
    };
    const response = await es.update(process.env.products_ES_HOST, disableProduct, req.body.id);
    console.log('Update prod res', response)
    if (response) {
      await axios.patch('/api/force-update');
      payload = response;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.post('/product/:id', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    console.log('API IN!')
    console.log('CRED', req.params)
    let query = {
      filter: {
        term : { id : req.params.id }
      },
    }
    let getProduct = await es.mustMatchDocument(process.env.products_ES_HOST, query)
    if (getProduct) {
      payload = getProduct;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.post('/email-validator/:email_address', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    let validated = validator.validate(req.params.email_address);
    if (validated) {
      payload = validated;
      status = 200;
      message = 'Success';
    }
    else{
      payload = validated;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.post('/email-validator-in-es/:email_address', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    let validated = validator.validate(req.params.email_address);
    if (validated) {
      let query = {
          email_address: {
            query: req.params.email_address
          }
      }
      let validateInEs = await es.matchDocuments(process.env.authenticate_ES_HOST, query)
      validated = 'not_valid_es'
      payload = validated;
      status = 200;
      message = 'Success';
      for(let i = 0; i < validateInEs.length ; i++){
        if(validateInEs[i].email_address === req.params.email_address){
          console.log('found')
          payload = true;
          break;
        }
      }
    }
    else{
      payload = validated;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.post('/password-validator-in-es/:password', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
      let query = {
          password: {
            query: req.params.password
          }
      }
      let validateInEs = await es.matchDocuments(process.env.authenticate_ES_HOST, query)
      validated = 'not_valid_es'
      payload = validated;
      status = 200;
      message = 'Success';
      for(let i = 0; i < validateInEs.length ; i++){
        if(validateInEs[i].password === req.params.password){
          console.log('found')
          payload = true;
          break;
        }
      }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.post('/reset-link-email/:email_address', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    async function sendEmail(email_address, id){
      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, 
        auth: {
          user: 'pmftc.kitapp@gmail.com', 
          pass: 'devamplab2020', 
        },
        tls: {
          rejectUnauthorized: false
      }
      });
    
      let info = await transporter.sendMail({
        from: '"KitAppCMS" <techsupport@pmftc.kitapp.com>', 
        to: email_address, 
        subject: "KitAppCMS",
        html: `<!doctype html>
        <html lang="en">
                         <head>
                          <meta charset="utf-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
                           <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">
                           <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>
                        </head>
                      <body class="dashboard" style="width:50%;margin: auto;">
                        <div class="row" style="margin-top: 4vh;">
                                <img class="materialboxed" width="500" style="display:block;margin: auto;" src="https://kitapp.s3-ap-southeast-1.amazonaws.com/fonts/new_logo%402.png">
                          </div>
                          <div class="row" style="text-align: center;margin-top: 4vh;">
                              <span style="font-size:20px;" >Seems like you forgot your password for KitApp. If this is true, click below to reset your password.</span>
                          </div>
                          <div class="row" style="margin-top: 4vh;">
                            <div style="width: 40% !important; margin: auto !important;">
                              <a href="https://pmftc-kitapp.com/reset-password&id=${id}" style="text-decoration:none;display: block;
                              width: 100%;
                              height: 60px;
                              background: #C3272D;
                              padding: 10px;
                              text-align: center;
                              border-radius: 5px;
                              color: white;
                              font-weight: bold;
                              line-height: 25px;"><span style="line-height: 60px;font-size:15px;" class="play">Click here to Reset Password</span></a>
                            </div>
                          </div>
                          <div class="row" style="margin-top: 2vh;">
                            <div style="text-align:center;">
                                  <span style="width:50%;margin:auto;font-size:20px;" >If you did not forget your password, you can safely ignore this email.</span>
                              </div>
                          </div>
                          <div class="row" style="margin-top: 4vh;border:.3px solid #979797;">
                          </div>
                          <div class="row" style="margin-top: 2vh;">
                            <div style="text-align:center;">
                                  <span style="width:50%;margin:auto;font-size:16px;" >If you’re having trouble clicking the “Click here to Reset Password” button,<br>copy and paste the URL below into your web browser: <br>https://pmftc-kitapp.com/reset-password&id=${id}</span>
                             </div>
                          </div>
                          </div>
                      </body>
                      </html>`, // html body
      });
      return info;
    }
    let user_id = await es.matchDocument(process.env.authenticate_ES_HOST, { email_address : req.params.email_address })
    console.log('User details', user_id)
    if(Object.keys(user_id).length){
      let emailResponse = await sendEmail(req.params.email_address, user_id.id)
      if (emailResponse.messageId) {
          emailResponse.id = user_id.id
          payload = emailResponse,
          status = 200,
          message = 'Success'
      }
    }
    else{
      status = 404;
      message = 'User not found';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.patch('/update-user-account', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    const updateUser = {
      doc: Object.assign({
        updated_at: moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'),
      }, req.body),
    };
    const response = await es.update(process.env.authenticate_ES_HOST, updateUser, req.body.id);
    console.log('Update user res', response)
    if (response) {
      payload = response;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.get('/user-accounts', async (req, res) => {
  let users = {};
  const date = new Date();
  try {
    
    let getAllUsers = await es.getAllDocuments(process.env.authenticate_ES_HOST)
    users = getAllUsers
  } catch (error) {
    console.log('Get Users error:', error);
    message = 'Internal Server Error';
  }
  res.send(users);
});

router.post('/add-user', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let emailResponse;
  let message = 'Internal Server Error';
  let email_existed = false;
  try {
    console.log('API IN!')
    console.log('parameter', req.body)
    password = generatePassword();
    const newUser = Object.assign({
      id: uuidv4(),
      created_at: moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'),
      password,
    }, req.body);
    let query = {
      email_address: {
        query: req.body.email_address
      }
    }
    let validateInEs = await es.matchDocuments(process.env.authenticate_ES_HOST, query)
    for(let i = 0; i < validateInEs.length ; i++){
      if(validateInEs[i].email_address === req.body.email_address){
        console.log('found')
        email_existed = true;
        break;
      }
    } 
    if(email_existed){
      response = 'email_existed'
      status = 200;
      message = 'Success';
    }
    else{
      response = await es.create(process.env.authenticate_ES_HOST, newUser, newUser.id);
      console.log('Add product res', response)
      if(response === 'created'){

        async function sendEmail(email_address, id){
          let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, 
            auth: {
              user: 'pmftc.kitapp@gmail.com', 
              pass: 'devamplab2020', 
            },
            tls: {
              rejectUnauthorized: false
          }
          });
        
          let info = await transporter.sendMail({
            from: '"KitAppCMS" <techsupport@pmftc.kitapp.com>', 
            to: email_address, 
            subject: "Welcome to All-in KitApp",
            html: `<html lang="en">
            <head>
             <meta charset="utf-8">
             <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
              <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">
              <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>
           </head>
         <body class="dashboard">
             <div class="row" style="text-align: center;margin-top: 4vh;">
                 <span style=";font-size:25px;"  ><b>Welcome to All-in KitApp</b></span>
             </div>
           <div class="row" style="margin-top: 4vh;">
                   <img class="materialboxed" width="500" style="display:block;margin: auto;" src="https://kitapp.s3-ap-southeast-1.amazonaws.com/fonts/new_logo%402.png">
             </div>
             <div class="row" style="text-align: center;margin-top: 4vh;">
                 <span style=";font-size:20px;" ><b>Your KitApp account was successfully created!</b></span>
             </div>
             <div class="row" style="margin-top: 4vh;">
               <div style="width: 40% !important; margin: auto !important;">
                 <span style="width:100% !important;margin:auto;" ><b>Use your email address and password below to access your account</b></span>
               </div>
             </div>
             <div class="row" style="margin-top: 2vh;">
               <div style="width: 40% !important; margin: auto !important;">
                     <span style="width:50%;margin:auto;" ><b>Note! Please change your password immediately upon login. </b></span>
                 </div>
             </div>
             <div class="row" style="margin-top: 4vh;">
               <div style="width: 40% !important; margin: auto !important;">
                      <span style="width:50%;margin:auto;font-size:18px;" ><b>KitApp Link:</b> https://pmftc-kitapp.com/</span>
                 </div>
             </div>
             <div class="row" style="margin-top: 2vh;">
               <div style="width: 40% !important; margin: auto !important;">
                    <span style="width:50%;margin:auto;font-size:18px;" ><b>Email:</b> ${email_address}</span>
                 </div>
             </div>
             <div class="row" style="margin-top: 2vh;">
                 <div style="width: 40% !important; margin: auto !important;">
                   <span style="width:50%;margin:auto;font-size:18px;" ><b>Password</b>: ${password}</span>
             </div>
             </div>
         </body>
         </html>`, // html body
          });
          return info;
        }
        emailResponse = await sendEmail(newUser.email_address, password)
      }
    }
    if (emailResponse || response == 'email_existed') {
      payload = response;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.post('/user/:id', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    console.log('API IN!')
    console.log('CRED', req.params)
    let query = {
      filter: {
        term : { id : req.params.id }
      },
    }
    let getProduct = await es.mustMatchDocument(process.env.authenticate_ES_HOST, query)
    if (getProduct) {
      payload = getProduct;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.patch('/update-user', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    const disableProduct = {
      doc: Object.assign({
        updated_at: moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'),
      }, req.body),
    };
    const response = await es.update(process.env.authenticate_ES_HOST, disableProduct, req.body.id);
    console.log('Update prod res', response)
    if (response) {
      payload = response;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});
async function resetPassword(email_address, password){
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, 
    auth: {
      user: 'pmftc.kitapp@gmail.com', 
      pass: 'devamplab2020', 
    },
    tls: {
      rejectUnauthorized: false
  }
  });

  let info = await transporter.sendMail({
    from: '"KitAppCMS" <techsupport@pmftc.kitapp.com>', 
    to: email_address, 
    subject: "KitApp CMS Reset Password",
    html: `<!doctype html>
    <html lang="en">
                     <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
                       <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">
                       <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>
                    </head>
                  <body class="dashboard" style="width:50%;margin: auto;">
                    <div class="row" style="margin-top: 4vh;">
                            <img class="materialboxed" width="500" style="display:block;margin: auto;" src="https://kitapp.s3-ap-southeast-1.amazonaws.com/fonts/new_logo%402.png">
                      </div>
                      <div class="row" style="text-align: center;margin-top: 4vh;">
                          <span style="font-size:20px;" >Seems like you forgot your password for KitApp. If this is true, here’s your new password.</span>
                      </div>
                      <div class="row" style="text-align: center;margin-top: 4vh;">
                          <span style="font-size:30px;" ><b>${password}</b></span>
                      </div>
                      <div class="row" style="margin-top: 2vh;">
                        <div style="text-align:center;">
                              <span style="width:50%;margin:auto;font-size:20px;" ></span>
                          </div>
                      </div>
                      </div>
                  </body>
                  </html>`,
  });
  return info;
}


router.patch('/reset-password', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  let password;
  try {
    password = generatePassword();
    response = await resetPassword(req.body.email_address, password)
    console.log('RES', response)
    if(response.messageId){
      const changePassword = {
        doc: Object.assign({
          updated_at: moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'),
          password : password,
        }, req.body),
      };
      response = await es.update(process.env.authenticate_ES_HOST, changePassword, req.body.id);
      console.log('Update pass res', response);
      if(response){
        payload = response,
        status = 200,
        message = 'Success'
      }
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.post('/verify-password', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  let password;
  try {

    let userDetails = await es.matchDocument(process.env.authenticate_ES_HOST, { id : req.session.username.id })
    if(Object.keys(userDetails).length){
      if(req.body.password === userDetails.password){
        response = {
          response : 'verified',
          id : userDetails.id
        }
      }
      else{
        response = {
          response : 'not_verified',
          id : userDetails.id
        }
      }
    }
    if(response){
      payload = response,
      status = 200,
      message = 'Success'
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.patch('/force-update', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    let getLatest = await es.getAllDocuments(process.env.versioning_INDEX);
    let api_change_identifier = parseFloat(getLatest[0].api_change_identifier) + 0.1;
    api_change_identifier = api_change_identifier.toFixed(1)
    const updateUser = {
      doc: Object.assign({
        updated_at: moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'),
        api_change_identifier : String(api_change_identifier),
      }),
    };
    const response = await es.update(process.env.versioning_INDEX, updateUser, process.env.app_version_id);
    console.log('Update user res', response)
    if (response) {
      payload = response;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.post('/messages/:id', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    let user_id = await es.matchDocument(process.env.messages_ES_HOST, { id : req.params.id })
    console.log('Message', user_id)
    if(Object.keys(user_id).length){
        payload = user_id,
        status = 200,
        message = 'Success'
    }
    else{
      status = 404;
      message = 'User not found';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.get('/messages', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  let arrRes = [];
  try {
    let sort = {
      page: {
        order: "desc"
      }
    }
    let user_id = await es.getAllDocuments(process.env.messages_ES_HOST, undefined, sort)
    console.log('Message', user_id)
    if(Object.keys(user_id).length){
        payload = user_id,
        status = 200,
        message = 'Success'
    }
    else{
      status = 404;
      message = 'User not found';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.patch('/update-message', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    const disableProduct = {
      doc: Object.assign({
      }, req.body),
    };
    const response = await es.update(process.env.messages_ES_HOST, disableProduct, req.body.id);
    console.log('Disable prod res', response)
    if (response) {
      await axios.patch('/api/force-update');
      payload = response;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.post('/update-video', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    console.log('API IN!')
    console.log('parameter', req.body)
    const newProduct = Object.assign({
      id: process.env.cbf_video_id,
      created_at: moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'),
    }, req.body);
    response = await es.create(process.env.video_index, newProduct, newProduct.id);
    console.log('Add product res', response)
    if (response) {
      await axios.patch('/api/force-update');
      payload = response;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.get('/video', async (req, res) => {
  let products = {};
  try {
    let getAllProducts = await es.getAllDocuments(process.env.video_index)
    products = getAllProducts
  } catch (error) {
    console.log('Get Products error:', error);
    message = 'Internal Server Error';
  }
  res.send(products[0]);
});

router.get('/pb-video', async (req, res) => {
  let products = {};
  try {
    let getAllProducts = await es.getAllDocuments(process.env.pb_video_index)
    products = getAllProducts
  } catch (error) {
    console.log('Get Products error:', error);
    message = 'Internal Server Error';
  }
  res.send(products[0]);
});

router.post('/update-trade-programs', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    console.log('API IN!')
    console.log('parameter', req.body)
    const updatetp = {
      doc: Object.assign({
        updated_at: moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'),
      }, req.body),
    };
    response = await es.update(process.env.tp_es, updatetp, req.body.id);
    console.log('Add product res', response)
    if (response) {
      await axios.patch('/api/force-update');
      payload = response;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.get('/trade-programs', async (req, res) => {
  let products = {};
  try {
    let getAllProducts = await es.getAllDocuments(process.env.tp_es)
    products = getAllProducts
  } catch (error) {
    console.log('Get Products error:', error);
    message = 'Internal Server Error';
  }
  res.send(products);
});

router.get('/pssp', async (req, res) => {
  let products = {};
  try {
    let getAllProducts = await es.getAllDocuments(process.env.pssp_es)
    products = getAllProducts
  } catch (error) {
    console.log('Get Products error:', error);
    message = 'Internal Server Error';
  }
  res.send(products);
});

router.post('/update-pages', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    const newProduct = Object.assign({
      id: process.env.page_id,
      created_at: moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'),
    }, req.body);
    response = await es.create(process.env.pages_ES, newProduct, process.env.page_id);
    console.log('Add product res', response)
    if (response) {
      await axios.patch('/api/force-update');
      payload = response;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.get('/pages', async (req, res) => {
  let products = {};
  try {
    let getAllProducts = await es.getAllDocuments(process.env.pages_ES)
    products = getAllProducts
  } catch (error) {
    console.log('Get Products error:', error);
    message = 'Internal Server Error';
  }
  res.send(products[0]);
});

router.post('/validate-product', async (req, res) => {
  let payload = {};
  let response;
  let filtered = {};
  let status = 500;
  let message = 'Internal Server Error';
  try {
    let query = {
        must : [
          {
           term: {
             is_enabled: 1
           }
         },
         {
           match: {
            name_capitalized: req.body.product_name.toUpperCase()
           }
         }
       ]
    }
    console.log(query.must[1].term)
    let response = await es.mustMatchDocuments(process.env.products_ES_HOST, query)
    console.log('RES', response)
    for(let i = 0 ; i < response.length ; i++){
      if(response[i].name_capitalized == req.body.product_name.toUpperCase()){
        filtered = response[i];
        break;
      }
    }
    console.log('RES', filtered)
    if (Object.keys(filtered).length) {
      payload = filtered;
      status = 200;
      message = 'Success';
    }
    else{
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.post('/trade-programs', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    let response = await es.matchDocument(process.env.tp_es, { id : req.body.id })
    console.log(response)
    if (Object.keys(response).length) {
      payload = response;
      status = 200;
      message = 'Success';
    }
    else{
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.post('/pssp', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    let response = await es.matchDocument(process.env.pssp_es, { id : req.body.id })
    console.log(response)
    if (Object.keys(response).length) {
      payload = response;
      status = 200;
      message = 'Success';
    }
    else{
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.post('/update-pssp', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    console.log('API IN!')
    console.log('parameter', req.body)
    const updatetp = {
      doc: Object.assign({
        updated_at: moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'),
      }, req.body),
    };
    response = await es.update(process.env.pssp_es, updatetp, req.body.id);
    console.log('Add product res', response)
    if (response) {
      await axios.patch('/api/force-update');
      payload = response;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.post('/update-video-pb', async (req, res) => {
  let payload = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  try {
    console.log('API IN!')
    console.log('parameter', req.body)
    const newProduct = {
      doc: Object.assign({
        id : '_doc1_'
      }, req.body),
    };
    response = await es.update(process.env.pb_video_index, newProduct, '_doc1_');
    console.log('Add product res', response)
    if (response) {
      await axios.patch('/api/force-update');
      payload = response;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

router.get('/price-program', async (req, res) => {
  let products = {};
  try {
    let sort = {
      created_at: {
        order: "asc"
      }
    }
    let getAllProducts = await es.getAllDocuments(process.env.price_program, undefined, sort)
    products = getAllProducts
  } catch (error) {
    console.log('Get Price program error:', error);
    message = 'Internal Server Error';
  }
  res.send(products);
});

router.patch('/update-price-program', async (req, res) => {
  let payload = {};
  let params = {};
  let response;
  let status = 500;
  let message = 'Internal Server Error';
  let idToUpdate;
  try {
    if(req.body.table == 'retail-table'){
      idToUpdate = 'pp_doc1'
    }
    else{
      idToUpdate = 'pp_doc2'
    }
    switch(req.body.row){
      case 'f1r':
        params.first_row = req.body.data
      break;
      case 'f2r':
        params.second_row = req.body.data
      break;
      case 'f3r':
        params.third_row = req.body.data
      break;
      case 'f4r':
        params.fourth_row = req.body.data
      break;
      case 'f5r':
        params.fifth_row = req.body.data
      break;
      case 'f6r':
        params.sixth_row = req.body.data
      break;
      default:
        params.is_shown = req.body.data
      break
    }
    const updatePriceProgram = {
      doc: Object.assign({
        updated_at: moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'),
      }, params),
    };
    const response = await es.update(process.env.price_program, updatePriceProgram, idToUpdate);
    console.log('Update prod res', response)
    if (response) {
      await axios.patch('/api/force-update');
      payload = response;
      status = 200;
      message = 'Success';
    }
  } catch (error) {
    console.log(error);
    payload,
    message = 'Internal Server Error';
  }
  res.status(status).send({
    payload,
    message,
    status,
  });
});

module.exports = router;
