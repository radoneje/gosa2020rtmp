var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.post('/startStream', function(req, res, next) {
  console.log("startStream", req.body)
  /*  app: 'live',
  flashver: 'FMLE/3.0 (compatible; vMix/25.0',
  swfurl: '',
  tcurl: 'rtmp://rtmp.rustv.ru:1935/live',
  pageurl: '',
  addr: '217.67.180.18',
  clientid: '1',
  call: 'publish',
  name: '1',
  type: 'live'
   */
  res.json("ok")
});

module.exports = router;
