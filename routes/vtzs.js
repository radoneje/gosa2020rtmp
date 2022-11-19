var express = require('express');
var router = express.Router();
const { spawn } = require("node:child_process");

/* GET users listing. */
router.post('/startStream', async function(req, res, next) {

  setTimeout(()=>{

    startRestreamToHLS(req.body.name,"ru", req);
    startRestreamToHLS(req.body.name,"en", req);
    setTimeout(()=>{
      startRestreamToNgenix(req.body.name,"ru", req);
      startRestreamToNgenix(req.body.name,"en", req);
    },1000)

  },500)
  res.json(1)
});

function startRestreamToNgenix(key, lang, req){

  console.log("startRestreamToNgenix", key, lang)
  let ch=0;
  if(lang=="en")
    ch=1;
  let params=[ "-re", "-i", "rtmp://localhost/stram/"+key+lang, "-c", "copy", "-f", "flv", "rtmp://s36335-media-origin1.cdn.ngenix.net:1935/s36335-media-origin/live/"+key+lang+"?password=7fstvAaMXdsr" ]
  let stream = spawn("ffmpeg", params , {detached: true, stdio: 'ignore'});
  stream.unref();

}
function startRestreamToHLS(key, lang, req){
  let ch=0;
  if(lang=="en")
    ch=1;
  let params=[ "-re", "-i", "rtmp://localhost/live/"+key, "-c:v", "copy","-c:a", "aac", "-af", "pan=mono|c0=c"+ch, "-f", "flv", "rtmp://localhost/stream/"+key+lang ]
  //let params=["-m","/var/restream",key, lang, (lang=="ru"?0:1)]
  let stream = spawn("ffmpeg", params , {detached: true, stdio: 'ignore'});
  stream.on("close", async (code) => {
    console.log(`ffmpeg close om ${key} ${lang}`);
  });
  //stream.stderr.on("data", data => {
   // console.log(`stderr: ${data}`);
  //});
  stream.unref();
}

module.exports = router;
