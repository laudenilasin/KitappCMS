exports.tradeProgramPage = async (req, res) => {
  if(req.session.username){
    res.render('trade-programs', {
      user_data : req.session.username,
    });
  }
  else{
    res.redirect('/');
  }
};
