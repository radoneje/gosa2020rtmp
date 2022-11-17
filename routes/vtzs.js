var express = require('express');
var router = express.Router();

/* GET users listing. */
router.post('/startStream', async function(req, res, next) {

  console.log(req.body)
  res.json(1)
});

module.exports = router;
