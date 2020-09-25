exports.changePasswordPage = async (req, res) => {
  console.log('REQ CONTROLLER', req.session)
  if(req.session.username){
    res.render('change-password', {
      label : 'Add New Product',
      label_btn : 'Update',
      user_data : req.session.username
    });
  }
  else{
    res.redirect('/');
  }
};
