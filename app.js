const express = require('express');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const User = require('./models/user');
const ejsMate = require('ejs-mate');
const userRoutes = require('./routes/users');
const ExpressError = require('./utils/ExpressError');
const WebSocket = require('ws');
const cookieParser = require('cookie-parser');
const http = require('http');

const app = express();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.engine('ejs', ejsMate);

const dbUrl = 'mongodb://127.0.0.1:27017/rojgar';
mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
    console.log("Database connected");
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser('thisismysecret'));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: 'thisshouldbeabettersecret!'
    }
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e);
});

const sessionConfig = {
    store,
    name: 'session',
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 3600 * 24 * 7,
        maxAge: 1000 * 3600 * 24 * 7
    }
};

app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.use('/', userRoutes);

app.get('/', async(req, res) => {
  // const id = res.locals.currentUser._id.toString();
  // console.log(id);
    res.render('home');
});

app.all('*', (req, res, next) => {
    next();
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something went wrong!';
    res.status(statusCode).render('error', { err });
});

function f(){
 console.log("HIII");
}

const users = {};

wss.on('connection', function connection(ws, req) {
    console.log('New client connected');
    let currentUserId = null;
    ws.on('message', function incoming(message){
        const data = JSON.parse(message);
        // console.log(data);
        const userId = data.userId;
        if(userId){
            currentUserId = userId;
        }
        const rider = data.rider;
        const timestamp = data.timestamp;
        if(rider===0){
            const start = data.start;
            const end = data.end;
            console.log(`Client ${userId} sent request from Start: ${start} to End: ${end} at ${timestamp}`)
            // f(userId,start,end,timestamp);
        }
        else{
        const latitude = data.latitude;
        const longitude = data.longitude;
        // Map the latitude and longitude to the user ID
        if (userId){
            users[userId] = {latitude, longitude, timestamp };
            currentUserId = userId;
            console.log(`Rider ${userId} location updated to lat: ${latitude}, long: ${longitude} at ${timestamp}`);
        }
        }
        
    });

    ws.send(JSON.stringify({ message: 'WebSocket connection established' }));
    const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ message: 'Hello from server', userId: currentUserId, timestamp: new Date().toISOString() }));
        }
    }, 2000);

    ws.on('close', () => {
        clearInterval(interval);
    });
});

server.listen(3000, () => {
    console.log("SERVING ON PORT 3000...");
});


//varun