var moment = require('moment');
const {spawn, exec} = require("child_process");
const process = require("process")
const express = require("express");
const config = require("./config.json");

let knex = require('knex')({
    client: 'pg',
    connection: config.pgConnection,
    pool: {min: 0, max: 40}
});

async function work() {
    console.log("start work", moment().format("DD.MM.YYYY HH:mm:ss"))
    let tasks = await knex.select("*").from("t_22_trackTask").where({status: 0}).orderBy("id")
    if (tasks.length > 0) {
        let task = tasks[0];
        await knex("t_22_trackTask").update({status:1, startDate:new Date()}).where({id:task.id});
        let track = await knex.select("*").from("t_22_tracks").where({id: task.trackid});
        let stream = await knex.select("*").from("t_22_streams").where({id: track[0].streamid});
        let records = await knex.select("*").from("t_22_records")
            .where({streamid: track[0].streamid,})
            .andWhere("startDate", '<=', task.startDate)
            .orderBy("id", "desc")
        ;
        console.log(records);
        if (records.length > 0 && records[0].filename) {
            let offsetStart = moment(task.startDate).unix() - records[0].startDateUnix;
            offsetStart=offsetStart-3;
            if(offsetStart<0)
                offsetStart=0;
            let duration = moment(task.endDate).unix() - moment(task.startDate).unix()+1;
            //console.log({offsetStart:formatTime(offsetStart),duration:formatTime(duration) });
            //console.log(records[0].startDateUnix, moment(task.startDate).unix(),  moment(task.endDate).unix())
            let rand=makeid(5);
            createRecord(records[0].filename,rand, "ru", {
                    offsetStart: formatTime(offsetStart),
                    duration: formatTime(duration)
                },
                async (filename) => {

                    await knex("t_22_tracks").update({recUrlRu: filename}).where({id: track[0].id})
                    console.log("rec en update", {recUrlRu:filename})
                    createRecord(records[0].filename,rand, "en", {offsetStart:formatTime(offsetStart),duration:formatTime(duration) },
                        async (filename )=>{
                            await knex("t_22_tracks").update({recUrlEn:filename}).where({id:track[0].id})
                            await knex("t_22_trackTask").update({status:2, compliteDate:new Date()}).where({id:task.id});
                            console.log("rec en update", {recUrlEn:filename})
                            await workSpeeches()
                    }
                    )
                }
            )

        } else
            await workSpeeches()
    } else
        await workSpeeches()

    //
};
async function workSpeeches(){
    let tasks = await knex.select("*").from("t_22_speechTask").where({status: 0}).orderBy("id")
    if (tasks.length > 0) {
        let task = tasks[0];
        await knex("t_22_speechTask").update({status: 1, startDate: new Date()}).where({id: task.id});
        let speech = await knex.select("*").from("t_22_speaches").where({id: task.speechid});
        let track = await knex.select("*").from("t_22_tracks").where({id: speech[0].trackid});
        let stream = await knex.select("*").from("t_22_streams").where({id: track[0].streamid});
        let records = await knex.select("*").from("t_22_records")
            .where({streamid: track[0].streamid,})
            .andWhere("startDate", '<=', task.startDate)
            .orderBy("id", "desc")
        if (records.length > 0 && records[0].filename) {
            let offsetStart = moment(task.startDate).unix() - records[0].startDateUnix;
            offsetStart=offsetStart-3;
            if(offsetStart<0)
                offsetStart=0;
            let duration = moment(task.endDate).unix() - moment(task.startDate).unix()+1;
            let rand=makeid(5);
            createRecord(records[0].filename,rand, "ru", {
                    offsetStart: formatTime(offsetStart),
                    duration: formatTime(duration)
                },
                async (filename) => {
                    await knex("t_22_speaches").update({recUrlRu: filename}).where({id: speech[0].id})
                    createRecord(records[0].filename,rand, "en", {offsetStart:formatTime(offsetStart),duration:formatTime(duration) },
                        async (filename )=>{
                            await knex("t_22_speaches").update({recUrlEn:filename}).where({id:speech[0].id})
                            await knex("t_22_speechTask").update({status:2, compliteDate:new Date()}).where({id:task.id});
                            console.log("rec speeech en update", {recUrlEn:filename})
                            await workSpeeches()
                        }
                    )
                });

        }
        else
            setTimeout(work, 30*1000)
    }
    else
        setTimeout(work, 30*1000)
}

function formatTime(s) {
    let t = moment().startOf("day");
    t.add(s, "seconds")
    return t.format("HH:mm:ss")
}


function createRecord(inFilename,rand, lang, time, onStop) {
    let outFilename = inFilename.replace(".mkv", "_"+rand+"_"+lang + ".mp4");

    let params = ["-ss", time.offsetStart, "-i", "/var/stream/" + inFilename, "-c:v", "copy", "-c:a", "aac", "-af", "pan=mono|c0=c" + (lang == "ru" ? 0 : 1), '-t', time.duration,"-movflags","+faststart", "-y", "/var/track/" + outFilename]
     console.log(params)
    let stream = spawn("ffmpeg", params, {detached: true});
    stream.on("close", async (code) => {
        onStop(outFilename)
        console.log(`ffmpeg close om ${inFilename} ${lang}`);
    });
    stream.stderr.on("data", data => {
        console.log(`stderr: ${data}`);
    });
}
function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

work();
