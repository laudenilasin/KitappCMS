exports.termsConditionsPage = async (req, res) => {
  console.log('REQ CONTROLLER', req.session)
    res.render('terms-conditions' , {
      layout : false
    });
};
