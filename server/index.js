const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config()
const User = require('./models/user');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser')
const app = express();
const bcrypt = require('bcryptjs');
const ws = require('ws');


app.use(cors({
    credentials:true,
    origin:"http://localhost:5173",
}));
app.use(express.json());
app.use(cookieParser())


const PORT = 4000;
const mongoURL = process.env.MONGOURL;
const jwtSecret = process.env.JWT_SECRET;
const salt = bcrypt.genSaltSync(10);


mongoose.connect(mongoURL)
    .then(()=>{
        console.log("Connected to Mongo");
    })
    .catch((err)=>{
        console.log("Lovely error :"+err.message);
    })


app.get('/test', (req,res)=>{
    res.json('test alright gigdy');
})

app.get('/profile', (req,res)=>{
    const token = req.cookies?.token;
    if(token){
        jwt.verify(token, jwtSecret, {}, (err, userData)=>{
            if(err) throw err;
            res.json(userData);
        })
    }else{
        res.status(401).json("no token");
    }
})

////////////////////////////////
//  Register User
app.post('/register', async (req,res)=>{
    const {username, password} = req.body;
    const hashedPass = bcrypt.hashSync(password, salt);
    const createdUser = await User.create({
        username: username, 
        password: hashedPass,
    });
    jwt.sign({userId: createdUser._id, username:username}, jwtSecret, {}, (err, token)=>{
        if(err) throw err;
        res.cookie('token', token, {sameSite:'none', secure:true}).status(201).json(createdUser);
    });
})

////////////////////////////////
//  Login User
app.post('/login', async(req, res)=>{
    const {username, password} = req.body;
    const findUser = await User.findOne({username: username});
    if(findUser){
        let isCorrect = bcrypt.compareSync(password, findUser.password);
        if(isCorrect){
            jwt.sign({userId:findUser._id, username:username}, jwtSecret, {}, (err, token)=>{
                if(err) throw err;
                res.cookie('token',token, {sameSite:'none', secure:true}).status(201).json("Logged in");
            })
        }else{
            res.send("wrong password");
        }
    }else{
        res.send("weonrg");
    }
})



const server = app.listen(4000, ()=>{
    console.log("Listening on port "+PORT);
});

const wss = new ws.WebSocketServer({server:server});

wss.on('connection', (connection, req)=>{
    let cookies = req.headers.cookie;
    if(cookies){
        let tokenCookieString = cookies.split('; ').find(str => str.startsWith('token='));
        if(tokenCookieString){
            let token = tokenCookieString.split('=')[1];
            if(token){
                jwt.verify(token, jwtSecret, {}, (err, userData)=> {
                    if(err) console.log(err);
                    const {userId, username} = userData;
                    connection.userId = userId;
                    connection.username = username;
                })
            }
        }
    }


    connection.on('message', (message)=>{
        const messageData = JSON.parse(message.toString());
        const {recipient, text} = messageData;
        if(recipient && text){
            [...wss.clients]
                .filter(c => c.userId === recipient )
                .forEach(c => c.send(JSON.stringify({text:text, sender:connection.userId})))

        }
    });

    [...wss.clients].forEach((client) => {
        client.send(JSON.stringify({
            online: [...wss.clients].map(c => ({userId:c.userId, username:c.username}))
        }))
    })

})


