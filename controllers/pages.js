const axios = require('axios')
exports.pagePage = async (req, res) => {
  let page = await axios.get(`${req.protocol}://${req.get('host')}/api/pages`)
  console.log(page.data)
  if(req.session.username && req.session.username.type == 'SUPER_ADMIN'){
    res.render('pages', {
      user_data : req.session.username,
      page : page.data
    });
  }
  else{
    res.redirect('/');
  }
};
