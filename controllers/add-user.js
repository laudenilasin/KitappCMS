exports.addUserPage = async (req, res) => {
  console.log('REQ CONTROLLER', req.session && req.session.username.type == 'SUPER_ADMIN')
  if(req.session.username){
    res.render('add-user', {
      label : 'Add New Product',
      label_btn : 'Add',
      user_data : req.session.username
    });
  }
  else{
    res.redirect('/');
  }
};
