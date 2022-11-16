var moment = require('moment');
const { spawn, exec } = require("child_process");
const process = require("process")
const express = require("express");
const config = require("./config.json");

let knex = require('knex')({
    client: 'pg',
    connection:config.pgConnection,
    pool: { min: 0, max: 40 }
});

async function work(){
    let tasks=await knex.select("*").from("t_22_trackTask").where({status:0}).orderBy("id")
    if(tasks.length>0 ){
        let task=tasks[0];
       // await knex("t_22_trackTask").update({status:1}).where({id:task.id});
        let track= await knex.select("*").from("t_22_tracks").where({id:task.trackid});
        let stream= await knex.select("*").from("t_22_streams").where({id:track[0].streamid});
        let records = await knex.select("*").from("t_22_records")
            .where({streamid:track[0].streamid,})
            .andWhere("startDate", '<=', task.startDate)
            .orderBy("id","desc")
        ;
       // console.log(records);
        if(records.length>0 && records[0].filename){
            let offsetStart=moment(task.startDate).unix()-records[0].startDateUnix;
            let duration=moment(task.endDate).unix()-moment(task.startDate).unix();
            //console.log({offsetStart:formatTime(offsetStart),duration:formatTime(duration) });
            //console.log(records[0].startDateUnix, moment(task.startDate).unix(),  moment(task.endDate).unix())
            let ruFilename =createRecord(records[0].filename, "ru", {offsetStart:formatTime(offsetStart),duration:formatTime(duration) })
        }
    }

    setTimeout(work,1000)
};
function formatTime(s){
    let t=moment().startOf("day");
    t.add(s, "seconds")
    return t.format("HH:mm:ss")
}
function createRecord(inFilename, lang, time){
    let outFilename=inFilename.replace(".mkv", lang+".mp4");
    let params=["-ss" ,time.offsetStart , "-i", "/var/video/"+ inFilename,  "-c:v", "copy","-c:a", "aac", "-af", "pan=mono|c0=c"+(lang=="ru"?0:1),'-t', time.duration,  "/var/video/"+outFilename]
    console.log(params)
}

work();
