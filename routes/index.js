var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.post('/startStream', async function(req, res, next) {
  console.log("startStream", req.body)
  let streams = await req.knex("t_22_streams").where({rtmpKey:req.body.name});
  if(streams.length==0)
    return res.send(404);



  res.json("ok")
});

module.exports = router;
