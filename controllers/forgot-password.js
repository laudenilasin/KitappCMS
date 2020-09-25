exports.forgotPasswordPage = async (req, res) => {
  console.log('REQ CONTROLLER', req.session)
    res.render('forgot-password' , {
      layout : false
    });
};
