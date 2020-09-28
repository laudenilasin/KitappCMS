const axios = require('axios')
exports.editProductPage = async (req, res) => {
  let availableOrder = [];
  let withoutOrder = [];
  const getProducts = await axios.get(`${req.protocol}://${req.get('host')}/api/products`); 
  console.log('leng',getProducts.data.length ) //remove console log if not needed.
  for(let i = 0 ; i < getProducts.data.length; i++){ //add null and undefined checker getProducts and getProducts.data
    availableOrder.push( parseInt(getProducts.data[i].order) )
  }
  let largest= 0;
  for (i = 0; i <= availableOrder.length; i++ ){ //add null checker for availableOrder
      if (availableOrder[i]>largest) {
         largest=availableOrder[i];
      }
  }
  largest += 1
  console.log('Largest', largest) //remove console log if not needed.
  console.log('Orders controller', availableOrder) //remove console log if not needed.
  let available = [];
  if(getProducts.data[0] != undefined){
    available = getProducts.data[0].withoutOrder
  }
  // available.push(largest)
  console.log('ASD', available) //remove console log if not needed.
  available = available.filter((a, b) => available.indexOf(a) === b)
  if(req.session.username && req.session.username.type == 'SUPER_ADMIN'){
    res.render('add-product',{
      label : 'Edit Product',
      label_btn : 'Update',
      user_data : req.session.username,
      image_label : 'Update image',
      availableOrder : available,
    });
  }
  else{
    res.redirect('/');
  }
};
