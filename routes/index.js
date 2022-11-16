var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.post('/startStream', function(req, res, next) {
  console.log("startStream", req.body)
  res.json("ok")
});

module.exports = router;
