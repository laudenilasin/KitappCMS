exports.privacyPolicyPage = async (req, res) => {
  console.log('REQ CONTROLLER', req.session)
    res.render('privacy-policy' , {
      layout : false
    });
};
