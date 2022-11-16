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
    if(tasks.length>0){
        let task=tasks[0];
       // await knex("t_22_trackTask").update({status:1}).where({id:task.id});
        let track= await knex.select("*").from("t_22_tracks").where({id:task.trackid});
        let stream= await knex.select("*").from("t_22_streams").where({id:track[0].streamid});
        let records = await knex.select("*").from("t_22_records")
            .where({streamid:track[0].streamid,})
            .andWhere("startDate", '<=', task.startDate)
            .orderBy("id","desk")
        ;
        console.log(records);
    }

    setTimeout(work,1000)
};

work();
