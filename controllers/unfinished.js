exports.unfinishedPage = async (req, res) => {
  console.log('REQ CONTROLLER', req.session)
  if(req.session.username){
    res.render('unfinished', {
      user_data : req.session.username
    });
  }
  else{
    res.redirect('/');
  }
};
