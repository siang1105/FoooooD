require('dotenv').config();
const express = require('express');
const memberRouter = express.Router();
const {db, query} = require('./db.js');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cookieParser = require("cookie-parser");
const multer = require('multer');//upload image
const path = require('path');//upload image
// const CORS = require('cors')

// memberRouter.use(CORS());
memberRouter.use(cookieParser());
memberRouter.use(express.json());
memberRouter.use(express.static(__dirname + '/public'));

const storage = multer.diskStorage({
    destination:(req, file, cb) =>{
        cb(null, "public/images")
    },
    filename:(req, file, cb) => {
        console.log(file)
        cb(null, Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({storage: storage})

memberRouter.post("/signup.html", async (req, res) => {
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    const result = await query('select * from members where email = ?', [email]);
    if(result && result.length > 0){
        res.status(403).send("you are already registered!");
    }
    else{
        var str = crypto.createHash('sha256').update(`${password}`).digest('base64');
        let sql = `INSERT INTO members (username, email, password) VALUES (?, ?, ?);`;
        const ans = await query(sql, [username, email, str])
        // console.log("Row inserted with id = "+ ans.insertId);
        res.status(200).send("sign up!");
    }
});


memberRouter.post("/signin.html", async (req, res) => {
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var str = crypto.createHash('sha256').update(`${password}`).digest('base64');
    var tok = 0;
    const ans = await query('select * from members where username = ? and email = ?', [username, email]);
    
    if(ans && ans.length > 0){
        if(ans[0].password == str) tok = 1;
        else res.status(400).send("wrong password! ");
    }
    else res.status(500).send("You have not registered as a member or your username is wrong! ");
    if(tok == 1){
        var id = ans[0].userId;
        const user = { name: `${username}`,
                       id: `${id}`,
                       email: `${email}`,
                       password: `${password}`};
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1 day' })
        return res.cookie("access_token", accessToken, { httpOnly: true, })
        .status(200)
        .json({ message: "Logged in successfully 😊 👌",
            accessToken: accessToken });
    }
}); 

const authorization = (req, res, next) => {
    const token = req.cookies.access_token;
    if(!token){
        return res.sendStatus(403);
    }
    try{
        const data = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.userId = data.id;
        req.userName = data.name;
        req.userEmail = data.email;
        req.userPassword = data.password;
        return next();
    }
    catch{
        return res.sendStatus(403);
    }
};


memberRouter.get("/profile", authorization, async (req, res) => {
    const sql = 'select postId, photo, place, restaurant from post where userId = ?'
    const result = await query(sql, [req.userId])
    const resultArr = Object.values(JSON.parse(JSON.stringify(result)))
    res.json({
        id: req.userId,
        name: req.userName,
        email: req.userEmail,
        post: resultArr
    })
});

memberRouter.get("/profile/:city", authorization, async (req, res) => {
    const city = req.params.city
    const sql = 'select postId, photo from post where userId = ? and city = ?'
    const result = await query(sql, [req.userId, city])
    const resultArr = Object.values(JSON.parse(JSON.stringify(result)))
    res.json({
        id: req.userId,
        name: req.userName,
        email: req.userEmail,
        post: resultArr
    })
});

memberRouter.get("/logout", authorization, (req, res) => {
    return res
    .clearCookie("access_token")
    .status(200)
    .json({ message: "Successfully logged out 😏 🍀" });
});

memberRouter.post("/post.html", authorization, upload.single("image"), async (req, res) => {
    const restaurant = req.body.restaurant;
    const city = req.body.city;
    const description = req.body.description;
    const place = req.body.place;
    const userId = req.userId
    const filename = req.file.filename;
    const sql = 'INSERT INTO post (restaurant, city, photo, description, userId, heart, place) VALUES (?, ?, ?, ?, ?, ?, ?)'
    const result = await query(sql, [restaurant, city, filename, description, userId, 0, place])
    // console.log("Row inserted with id = "+ result.insertId);
    res.json("Post Successfully")
});

memberRouter.post("/like.html", authorization, async(req, res) => {
    const id = req.body.pid
    const userId = req.userId
    const sql1 = 'select heart from post where postId = ?'
    const sql2 = 'update post set heart = ? where postId = ?'
    const sql3 = ' INSERT INTO getheart (userId, postId) VALUES (?, ?)'
    const result = await query(sql1, [id])
    const resultJson = Object.values(JSON.parse(JSON.stringify(result)))
    const like = (resultJson[0].heart) + 1
    const newResult = await query(sql2, [like, id])
    const Result = await query(sql3, [userId, id])
    // console.log("Row inserted with id = "+ Result.insertId);
    res.json({
        message: "Like success",
        nowheart: like
    })
})

memberRouter.post("/checklike.html", authorization, async(req, res) => {
    const id = req.body.pid
    const userId = req.userId
    const sql = 'select * from getheart where postId = ? and userId = ?'
    const Result = await query(sql, [id, userId])
    res.json({
        isLiked: Result.length
    })
})

memberRouter.post("/notlike.html", authorization, async(req, res) => {
    const id = req.body.pid
    const userId = req.userId
    const sql1 = 'select heart from post where postId = ?'
    const sql2 = 'update post set heart = ? where postId = ?'
    const sql3 = 'DELETE FROM getheart where postId = ? and userId = ?'
    const result = await query(sql1, [id])
    const resultJson = Object.values(JSON.parse(JSON.stringify(result)))
    const like = (resultJson[0].heart) - 1
    const newResult = await query(sql2, [like, id])
    const Result = await query(sql3, [id, userId])
    res.json({
        message: "not Like success",
        nowheart: like
    })
})

memberRouter.post("/comment.html", authorization, async(req, res) => {
    const userId = req.userId
    const username = req.userName
    const postId = req.body.pid
    const text = req.body.text
    const sql = 'insert into comment (userId, username, postId, text) values (?, ?, ?, ?)'
    const result = await query(sql, [userId, username, postId, text])
    // console.log("Row inserted with id = "+ result.insertId);
    res.json({
        message: "comment success",
        username: username,
        comment: text
    })
})

module.exports = memberRouter;