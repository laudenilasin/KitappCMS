const axios = require('axios')
exports.powerOfBrandPage = async (req, res) => {
  let video = await axios.get(`${req.protocol}://${req.get('host')}/api/pb-video`)
  if(req.session.username && req.session.username.type == 'SUPER_ADMIN'){
    res.render('power-of-brand', {
      label : 'Add New Product',
      label_btn : 'Update',
      user_data : req.session.username,
      video : video.data
    });
  }
  else{
    res.redirect('/');
  }
};
