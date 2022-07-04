const express = require('express')
const {db, query} = require('./db.js')
var bodyParser = require('body-parser')
const app = express()
const PORT = process.env.PORT || 3000;
// const CORS = require('cors')

app.use(express.json());
app.use( bodyParser.json() );      // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
app.use(express.static(__dirname + '/public'));
const memberRoutes = require('./member.js');
app.use(memberRoutes);
// app.use(CORS())


app.get('/api/v01/post/:city', async (req, res) => {
    const city = req.params.city
    const id = req.query.id;
    const sql = 'select postId, photo, place, restaurant from post where city = ?'
    const result = await query(sql, [city])
    const resultArr = Object.values(JSON.parse(JSON.stringify(result)))
    res.json({
        post: resultArr
    })
})

app.get('/api/v01/home', async (req, res) => {
    const sql = 'select postId, photo from post'
    const result = await query(sql)
    const resultArr = Object.values(JSON.parse(JSON.stringify(result)))
    res.json({
        post: resultArr
    })
})

app.get('/api/v01/detail', async (req, res) => {
    const id = req.query.id;
    const sql = 'select * from post where postId = ?'
    const result = await query(sql, [id])
    const resultArr = Object.values(JSON.parse(JSON.stringify(result)))
    res.json({
        post: resultArr
    })
})

app.get('/api/v01/username', async (req, res) => {
    const id = req.query.id;
    const sql = 'select username from members where userId = ?'
    const result = await query(sql, [id])
    const resultArr = Object.values(JSON.parse(JSON.stringify(result)))
    res.json({
        name: resultArr
    })
})

app.get('/api/v01/search', async (req, res) => {
    const keyword = req.query.keyword
    const sql = `select * from post where restaurant like '%${keyword}%'`
    const result = await query(sql)
    const resultArr = Object.values(JSON.parse(JSON.stringify(result)))
    res.json({
        post: resultArr
    })
})

app.get('/api/v01/comment', async(req, res) => {
    const id = req.query.id
    const sql = 'select * from comment where postId = ?'
    const result = await query(sql, [id])
    const resultArr = Object.values(JSON.parse(JSON.stringify(result)))
    res.json({
        comment: resultArr
    })
})

app.listen(PORT, function () {
    console.log("My app listening on port 3000!")
})