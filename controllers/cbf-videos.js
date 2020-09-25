const axios = require('axios')
exports.cbfVideoPage = async (req, res) => {
  let video = await axios.get(`${req.protocol}://${req.get('host')}/api/video`)
  if(req.session.username && req.session.username.type == 'SUPER_ADMIN'){
    res.render('cbf-videos', {
      label : 'Add New Product',
      label_btn : 'Add',
      user_data : req.session.username,
      video : video.data
    });
  }
  else{
    res.redirect('/');
  }
};
