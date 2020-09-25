const express = require('express');
// const AWS = require('aws-sdk');
// const uuidv4 = require('uuid/v4');
const axios = require('axios');
global.fetch = require('node-fetch');
const bodyParser = require('body-parser');
const flash = require('connect-flash')
const router = express.Router();
const dotenv = require('dotenv');

dotenv.config();

router.use(flash())
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept'); // Add other headers used in your requests

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// rend login
router.get('/', async (req, res) => {
  console.log('REQ LOGIN', req.session)
  res.render('login' ,{layout: false});
});
//ROUTES
const welcomePage = require('../controllers/welcome');
router.get('/welcome', welcomePage.welcomePage);
const productPage = require('../controllers/products');
router.get('/products', productPage.productPage);
const messagePage = require('../controllers/messages');
router.get('/messages', messagePage.messagePage);
const messageEditPage = require('../controllers/edit-message');
router.get('/messages&action=edit&id=:id', messageEditPage.messageEditPage);
const cbfVideoPage = require('../controllers/cbf-videos');
router.get('/cbf-videos', cbfVideoPage.cbfVideoPage);
const tradeProgramPage = require('../controllers/trade-programs');
router.get('/trade-programs', tradeProgramPage.tradeProgramPage);
const pagePage = require('../controllers/pages');
router.get('/pages', pagePage.pagePage);
const manageUserPage = require('../controllers/manage-users');
router.get('/manage-users', manageUserPage.manageUserPage);
const changePasswordPage = require('../controllers/change-password');
router.get('/change-password', changePasswordPage.changePasswordPage);
const addProductPage = require('../controllers/add-product');
router.get('/add-product', addProductPage.addProductPage);
const editProductPage = require('../controllers/edit-product');
router.get('/edit-product&id=:id', editProductPage.editProductPage);
const forgotPasswordPage = require('../controllers/forgot-password');
router.get('/forgot-password', forgotPasswordPage.forgotPasswordPage);
const resetPasswordPage = require('../controllers/reset-password');
router.get('/reset-password&id=:id', resetPasswordPage.resetPasswordPage);
const addUserPage = require('../controllers/add-user');
router.get('/add-user', addUserPage.addUserPage);
const editUserPage = require('../controllers/edit-user');
router.get('/edit-user', editUserPage.editUserPage);
const psspPage = require('../controllers/pssp');
router.get('/pssp', psspPage.psspPage);
const priceProgramPage = require('../controllers/price-program');
router.get('/price-program', priceProgramPage.priceProgramPage);
// const powerOfBrandPage = require('../controllers/power-of-brand');
// router.get('/power-of-brand', powerOfBrandPage.powerOfBrandPage);
const unfinishedPage = require('../controllers/unfinished');
router.get('/unfinished', unfinishedPage.unfinishedPage);
const privacyPolicyPage = require('../controllers/privacy-policy');
router.get('/privacy-policy', privacyPolicyPage.privacyPolicyPage);
const termsConditionsPage = require('../controllers/terms-conditions');
router.get('/terms-conditions', termsConditionsPage.termsConditionsPage);

module.exports = router;
