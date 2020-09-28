const axios = require('axios')
exports.manageUserPage = async (req, res) => {
  console.log('REQ CONTROLLER', req.session)
  if(req.session.username && req.session.username.type == 'SUPER_ADMIN'){
    const users = await axios.get(`${req.protocol}://${req.get('host')}/api/user-accounts`); //add null and undefined checker for users and users.data
    console.log(users.data) //remove console log if not needed
    res.render('manage-users', {
      users : users.data,
      user_data : req.session.username
    });
  }
  else{
    res.redirect('/');
  }
};
