const mysql = require('mysql')
const util = require('util')
const dotenv = require('dotenv').config()

const db = mysql.createConnection({
    port: process.env.DBPORT,
    host: process.env.HOST,
    user: process.env.USERNAME,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
})

const query = util.promisify(db.query).bind(db)

db.connect(async (err) => {
    if(err){
        throw err;
    }
    console.log('mysql connected');
});





module.exports = {db, query}