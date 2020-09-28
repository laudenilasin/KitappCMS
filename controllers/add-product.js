const axios = require('axios')
exports.addProductPage = async (req, res) => {
  let availableOrder = [];
  let withoutOrder = [];
  const getProducts = await axios.get(`${req.protocol}://${req.get('host')}/api/products`);
  console.log('leng',getProducts.data.length ) //remove console log if not needed.
  for(let i = 0 ; i < getProducts.data.length; i++){ //add null and undefined checker for getProducts and getProducts.data
    availableOrder.push( parseInt(getProducts.data[i].order) )
  }
  let largest= 0;
  for (i = 0; i <= availableOrder.length; i++ ){
      if (availableOrder[i]>largest) {
         largest=availableOrder[i];
      }
  }
  largest += 1
  console.log('Largest', largest) //remove console log if not needed.
  console.log('Orders controller', availableOrder) //remove console log if not needed.
  let available = [];
  if(getProducts.data[0] != undefined){ //add null checker for getProducts.data[0]
    available = getProducts.data[0].withoutOrder
  }
  available.push(largest)
  console.log('ASD', available) //remove console log if not needed.
  available = available.filter((a, b) => available.indexOf(a) === b) //add null and undefined checker for available
  if(req.session.username && req.session.username.type == 'SUPER_ADMIN'){
    res.render('add-product', {
      label : 'Add New Product',
      label_btn : 'Add',
      user_data : req.session.username,
      image_label : 'Add image',
      availableOrder : available
    });
  }
  else{
    res.redirect('/');
  }
};
