const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config()
const User = require('./models/user');
const Message = require('./models/message');
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


async function getUserDataFromToken (req) {
    return new Promise((resolve, reject)=>{
        const token = req.cookies?.token;
        if(token){
            jwt.verify(token, jwtSecret, {}, (err, userData)=>{
                if(err) throw err;
                resolve(userData);
            })
        }else{
            reject('no token');
        }
    })
}

app.get('/test', (req,res)=>{
    res.json('test alright gigdy');
})

app.get('/messages/:userId', async (req, res)=>{
    const {userId} = req.params;
    const userData = await getUserDataFromToken(req);
    const ourUserId = userData.userId;
    const messages = await Message.find({
        sender:{$in:[userId, ourUserId]},
        recipient:{$in:[userId, ourUserId]}
    }).sort({createdAt: 1});
    res.json(messages);
    
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

app.get('/people', async (req, res)=>{
    const people = await User.find();
    res.json(people);
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

app.post('/logout', (req, res)=>{
    res.cookie('token','', {sameSite:'none', secure:true}).json("Logged out");
})


const server = app.listen(4000, ()=>{
    console.log("Listening on port "+PORT);
});

const wss = new ws.WebSocketServer({server:server});

wss.on('connection', (connection, req)=>{

    function notifyAboutOnlinePeople () {
        [...wss.clients].forEach((client) => {
            client.send(JSON.stringify({
                online: [...wss.clients].map(c => ({userId:c.userId, username:c.username}))
            }))
        })
    }

    connection.isAlive = true;

    connection.timer = setInterval(()=>{
        connection.ping();
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false;
            clearInterval(connection.deathTimer);
            connection.terminate();
            notifyAboutOnlinePeople();
        },1000);
    },5000)

    connection.on('pong',()=>{
        clearTimeout(connection.deathTimer);
    })






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


    connection.on('message', async (message)=>{
        const messageData = JSON.parse(message.toString());
        const {recipient, text, file} = messageData;
        console.log(file);
        if(recipient && text){
            const messageDoc = await Message.create({
                sender: connection.userId,
                recipient:recipient,
                text:text,
            });

            [...wss.clients]
                .filter(c => c.userId === recipient )
                .forEach(c => c.send(JSON.stringify({
                    text: text,
                    sender: connection.userId,
                    recipient: recipient,
                    _id: messageDoc._id,
                })))

        }
    });

    notifyAboutOnlinePeople();

})



