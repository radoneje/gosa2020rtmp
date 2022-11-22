var express = require('express');
var moment = require('moment');
var router = express.Router();
const { spawn } = require("child_process");
const process = require("process")

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/reststream', function(req, res, next) {

  res.render("restreamtiView")
});
router.get('/ps', function(req, res, next) {
  let params=[ "-ax" ]
  let ps = spawn("ps", params );
  let ret=[];
  ps.stderr.on("data", data => {
    //console.log(`stderr: ${data}`);
  //  ret.push(data)
  });
  ps.stdout.on("data", data => {
  //  console.log(`stdout: ${data}`);
    ret.push((data + "").split("\n"))
    console.log(data);
  });
  ps.on("close", async (code) => {
    ret=ret.filter(r=>{

      try {
        return r.match(/ffmpeg/)
      }
      catch (e){
        return false
      }
    })

    res.json(ret)
  });


});

router.post('/restsream', function(req, res, next) {
//https://s36335.cdn.ngenix.net/s36335-media-origin/live/<Stream_name>/index.m3u8
  let params=[ "-re", "-i", "https://s36335.cdn.ngenix.net/s36335-media-origin/live/"+req.body.src+"/index.m3u8", "-c", "copy", "-f", "flv", req.body.dest ]
  console.log(params)


  let debug= {detached: true, stdio: 'ignore'}
  debug={}

  let stream = spawn("ffmpeg", params, debug );
  console.log("restream started: "+ req.body.dest )

  if(debug.detached)
  stream.unref();
  else {
    stream.stderr.on("data", data => {
      console.log(`stderr: ${data}`);
    });
  }
  res.json("ok")
  // stream.on("close", async (code) => {
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
    setTimeout(async ()=>{
      let filename=await startRecord(req.body.name, streams[0].id, rec[0].id, req);
      await req.knex("t_22_records").update({filename:filename}).where({id:rec[0].id})

      },2000);

  },2000)
});

function startRestreamToCDN(key, lang, streamid, req){
  let ch=0;
  if(lang=="en")
    ch=1;

  let cdnKey="rtmp://pub2.rtmp.s01.l.fabrikanews.cdnvideo.ru/fabrikanews4/"+key+lang+"?auth=20200s9FJSP2v2ASD3"
  let params=[ "-re", "-i", "rtmp://localhost/live/"+key, "-c:v", "copy","-c:a", "aac", "-af", "pan=mono|c0=c"+ch, "-f", "flv", cdnKey ]

  //let params=["-m","/var/restream",key, lang, (lang=="ru"?0:1)]
  let stream = spawn("ffmpeg", params , {detached: true, stdio: 'ignore'});
  console.log("restream started: "+ cdnKey )
  //stream.on("close", async (code) => {
  //  console.log(`ffmpeg close om ${key} ${lang}`);
  //});
  stream.unref();
}
async function startRecord(key, streamid, recordid, req){
  let filename=key+"_" +moment().unix()+".mkv"
  //let filename=key+"_" +moment().unix()+".ts"
  let params=["-re", "-i", "rtmp://localhost/live/"+key, "-c", "copy",  "-f", "matroska", "/var/video/"+filename ]
  //let params=["-re", "-i", "rtmp://localhost/live/"+key, "-c", "copy",  "-f", "mpegts", "/var/video/"+filename ]


  let stream = spawn("ffmpeg", params , {detached: true, stdio: 'ignore'});
  console.log("record started: "+ filename )
  stream.unref();
  //stream.stderr.on("data", data => {
   // console.log(`stderr: ${data}`);
  //});
 // stream.on("close", async (code) => {
    console.log(`ffmpeg record close on  ${key} `);
    let rec=await req.knex("t_22_records").update({
      //endDate:new Date(),
      //endDateUnix:moment().unix(),
      filename:filename
    }, "*")
        .where({id:recordid})
  //});
  return filename;
}

module.exports = router;
