var express = require('express');
var moment = require('moment');
var router = express.Router();
const { spawn, exec } = require("child_process");
const process = require("process")

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.post('/startStream', async function(req, res, next) {

  console.log(req.body)
  let streams = await req.knex("t_22_streams").where({rtmpKey:req.body.name});
  if(streams.length==0)
    return res.send(404);

  res.json("ok")
  setTimeout(async ()=>{
    startRestreamToCDN(req.body.name,"ru", streams[0].id, req);
    startRestreamToCDN(req.body.name,"en", streams[0].id, req);
    await req.knex("t_22_streams").update({recStatus:new Date()}).where({id:streams[0].id});

    let rec=await req.knex("t_22_records").insert({
      startDate:new Date(),
      startDateUnix:moment().unix(),
      streamid:streams[0].id,

    }, "*")
    let filename=startRecord(req.body.name, streams[0].id, rec[0].id, req);
    await req.knex("t_22_records").update({filename:filename}).where({id:rec[0].id})
  },500)
});

function startRestreamToCDN(key, lang, streamid, req){
  let params=["-re", "-i", "rtmp://localhost/live/"+key, "-c:v", "copy","-c:a", "aac", "-af", "pan=mono|c0=c"+(+lang=="ru"?0:1), "-f", "flv", "rtmp://pub2.rtmp.s01.l.fabrikanews.cdnvideo.ru/fabrikanews4/"+key+lang+"?auth=20200s9FJSP2v2ASD3" ]
  let stream = spawn("ffmpeg", params , {detached: true});
  stream.on("close", async (code) => {
    console.log(`ffmpeg close om ${key} ${lang}`);
  });
  stream.unref();
}
function startRecord(key, streamid, recordid, req){
  let filename=key+"_" +moment().unix()+".mkv"
  let params=["-re", "-i", "rtmp://localhost/live/"+key, "-c", "copy",  "-f", "matroska", "/var/video/"+filename ]
  let stream = spawn("ffmpeg", params , {detached: true});
  console.log("record started: "+ filename )
  stream.stderr.on("data", data => {
   // console.log(`stderr: ${data}`);
  });
  stream.on("close", async (code) => {
    console.log(`ffmpeg record close on  ${key} `);
    let rec=await req.knex("t_22_records").update({
      endDate:new Date(),
      endDateUnix:moment().unix(),
      filename:req.body.filename
    }, "*")
        .where({id:recordid})
  });
  return filename;
}

module.exports = router;
