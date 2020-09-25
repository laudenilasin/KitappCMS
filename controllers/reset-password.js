exports.resetPasswordPage = async (req, res) => {
  res.render('reset-password', {
    layout : false
  });
};
