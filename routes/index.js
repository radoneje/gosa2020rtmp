var express = require('express');
var router = express.Router();
const { spawn, exec } = require("child_process");
const process = require("process")

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.post('/startStream', async function(req, res, next) {

  let streams = await req.knex("t_22_streams").where({rtmpKey:req.body.name});
  if(streams.length==0)
    return res.send(404);

  res.json("ok")
  setTimeout(()=>{
    startRestreamToCDN(req.body.name);
  },500)
});

function startRestreamToCDN(key){
  let params=["-re", "-i", "rtmp://localhost/live"+key, "-c:v", "copy","-c:a", "aac", "-af", "pan=mono|c0=c0", "-f", "flv", "rtmp://pub2.rtmp.s01.l.fabrikanews.cdnvideo.ru/fabrikanews4/"+key+"ru?auth=20200s9FJSP2v2ASD3" ]
  console.log(params)
  //let stream = spawn("ffmpeg", params , {detached: true});
}

module.exports = router;
