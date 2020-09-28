const axios = require('axios')
exports.messageEditPage = async (req, res) => {
  console.log(req.params)
  console.log(req.protocol)
  const messages = await axios.post(`${req.protocol}://${req.get('host')}/api/messages/${req.params.id}`); //add null and undefined checking for messages
  if(req.session.username && req.session.username.type == 'SUPER_ADMIN'){
    res.render('edit-messages', {
      messages : messages.data.payload,
      user_data : req.session.username
    });
  }
  else{
    res.redirect('/');
  }
};
