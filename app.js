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
// const WebSocket = require('ws');
const cookieParser = require('cookie-parser');
const http = require('http');
const {Server} = require('socket.io');
// const users = require('./controllers/users');
const { storeReturnTo,isLoggedIn } = require('./middleware');
const mbxClient = require('@mapbox/mapbox-sdk');
const mbxDirections = require('@mapbox/mapbox-sdk/services/directions');
const geolib = require('geolib');
const baseClient = mbxClient({accessToken: 'pk.eyJ1IjoiMTIzZ2F1cmF2IiwiYSI6ImNsd203MzFjcDFyeWYya215eno5NHpveGgifQ.HGwwKwppvbuFYvm5OSvTOQ'});
const directionsClient = mbxDirections(baseClient);

const app = express();

const server = http.createServer(app);
// const wss = new WebSocket.Server({ server });
const io = new Server(server);

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

// route matching function 

















app.use('/', userRoutes);

app.get('/requestRide',isLoggedIn,(req,res)=>{
    const {currentUser} = req.cookies;
    res.render('users/requestRide',{currentUser});
})
app.post('/requestRide',isLoggedIn,(req,res)=>{
    console.log("Hiii");
})

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

let users = {};

io.on('connection', (socket) => {
    console.log('New client connected');
    let currentUserId = null;

    socket.on('locationUpdate', (message) => { // for rider
        const data = message;
        const userId = data.userId;
        if (userId) {
            currentUserId = userId;
        }
        const rider = data.rider;
        const timestamp = data.timestamp;
        
            const latitude = data.latitude;
            const longitude = data.longitude;
            const start = data.start;
            const end = data.end;
            if (userId) {
                users[userId] = { latitude, longitude, timestamp };
                currentUserId = userId;
                console.log(`Rider ${userId} location updated to start: ${start}, end: ${end} at ${timestamp}`);
            }
        console.log(users);
        // console.log(message);
    });
    socket.on('rideRequest', (message) => { // for user
        const data = message;
        const userId = data.userId;
        if (userId) {
            currentUserId = userId;
        }
        const rider = data.rider;
        const timestamp = data.timestamp;
        if (rider === 0){
            const start = data.start;
            const end = data.end;
            console.log(`Client ${userId} sent request from Start: ${start} to End: ${end} at ${timestamp}`);
        }
    });

    socket.emit('message','Socket.io connection established');

    const interval = setInterval(() => {
        const ms = "Hello from server";
        socket.emit('message',{ms, userId: currentUserId, timestamp: new Date().toISOString() });
    }, 2000);

    socket.on('disconnect', () => {
        clearInterval(interval);
        console.log('Client disconnected');
    });
});

// gaurav

//varun