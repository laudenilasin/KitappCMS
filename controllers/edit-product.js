const axios = require('axios')
exports.editProductPage = async (req, res) => {
  let availableOrder = [];
  let withoutOrder = [];
  const getProducts = await axios.get(`${req.protocol}://${req.get('host')}/api/products`);
  console.log('leng',getProducts.data.length )
  for(let i = 0 ; i < getProducts.data.length; i++){
    availableOrder.push( parseInt(getProducts.data[i].order) )
  }
  let largest= 0;
  for (i = 0; i <= availableOrder.length; i++ ){
      if (availableOrder[i]>largest) {
         largest=availableOrder[i];
      }
  }
  largest += 1
  console.log('Largest', largest)
  console.log('Orders controller', availableOrder)
  let available = [];
  if(getProducts.data[0] != undefined){
    available = getProducts.data[0].withoutOrder
  }
  // available.push(largest)
  console.log('ASD', available)
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
