var express = require('express');
var router = express.Router();
const { spawn } = require("node:child_process");

/* GET users listing. */
router.post('/startStream', async function(req, res, next) {

  setTimeout(()=>{

    startRestreamToHLS(req.body.name,"ru", req);
  },500)
  res.json(1)
});

function startRestreamToHLS(key, lang, req){
  let params=[ "-re", "-i", "rtmp://localhost/live/"+key, "-c:v", "copy","-c:a", "aac", "-af", "pan=mono|c0=c"+(lang=="ru"?0:1), "-f", "flv", "rtmp://localhost/hls/"+key+lang ]
  //let params=["-m","/var/restream",key, lang, (lang=="ru"?0:1)]
  let stream = spawn("ffmpeg", params , {detached: true/*, stdio: 'ignore'*/});
  stream.on("close", async (code) => {
    console.log(`ffmpeg close om ${key} ${lang}`);
  });
  stream.stderr.on("data", data => {
    console.log(`stderr: ${data}`);
  });
  //stream.unref();
}

module.exports = router;
