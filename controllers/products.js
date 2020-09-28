const axios = require('axios')
exports.productPage = async (req, res) => {
  console.log('REQ CONTROLLER', req.session)
  if(req.session.username && req.session.username.type == 'SUPER_ADMIN'){
    const getProducts = await axios.get(`${req.protocol}://${req.get('host')}/api/products`); //add null and undefined checking for getProducts and getProducts.data
    res.render('products', {
      term : 'short',
      products: getProducts.data,
      user_data : req.session.username
    });
  }
  else{
    res.redirect('/');
  }
};
