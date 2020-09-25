exports.psspPage = async (req, res) => {
  console.log('REQ CONTROLLER', req.session)
  if(req.session.username && req.session.username.type == 'SUPER_ADMIN'){
    res.render('pssp', {
      label : 'Add New Product',
      label_btn : 'Update',
      user_data : req.session.username
    });
  }
  else{
    res.redirect('/');
  }
};
