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

const getRoutePoints = async (origin, destination) =>{
    const response = await directionsClient.getDirections({
      profile: 'driving',
      waypoints: [
        { coordinates: origin },
        { coordinates: destination }
      ],
      geometries: 'polyline'
    }).send();
  
    return response.body.routes[0].geometry;
  };
  
  // Function to decode polyline points
  const decodePolyline = (polyline) => {
    return require('@mapbox/polyline').decode(polyline);
  };
  
  // Function to check if two routes overlap significantly
  const doRoutesOverlap = async (origin1, destination1, origin2, destination2) => {
    try {
      const points1 = await getRoutePoints(origin1, destination1);
      const points2 = await getRoutePoints(origin2, destination2);
  
      // Decode polyline points
      const decodedPoints1 = decodePolyline(points1);
      const decodedPoints2 = decodePolyline(points2);
  
      // Compare the points to see if they overlap
      const overlap = checkOverlap(decodedPoints1, decodedPoints2);
      if(overlap===1) return 1; // for example, check if more than 50% of the points overlap
    } catch (error) {
      console.error('Error comparing routes:', error);
      return false;
    }
  };
  
  // Function to check overlap between two sets of points
  const checkOverlap = (points1, points2) => {
    let overlapCount = 0;
    points1.forEach(point1 => {
      points2.forEach(point2 => {
        if (geolib.isPointWithinRadius(
          { latitude: point1[0], longitude: point1[1] },
          { latitude: point2[0], longitude: point2[1] },
          50 // 50 meters tolerance
        )) {
          overlapCount++;
        }
      });
    });
    return overlapCount / points1.length;
  };
  
  // Example usage
//   const origin1 = [77.5946, 12.9716]; // Coordinates for Bangalore
//   const destination1 = [77.6288, 12.9345]; // Coordinates for another point in Bangalore
//   const origin2 = [77.5946, 12.9716]; // Coordinates for Bangalore
//   const destination2 = [77.6288, 12.9345]; // Coordinates for another point in Bangalore
  
  doRoutesOverlap(origin1, destination1, origin2, destination2)
    .then(overlap => {
      if (overlap) {
        console.log('The routes overlap significantly.');
      } else {
        console.log('The routes do not overlap significantly.');
      }
    });
  
    const getRider = (users,userStart,userEnd) => {
      Object.values(users).forEach(value =>{
          console.log(value);
      });
    };
  















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


function f(){
 console.log("HIII");
}

let users = {};

io.on('connection', (socket) => {
    console.log('New client connected');
    let currentUserId = null;

    socket.on('locationUpdate', (message) => {
        const data = message;
        const userId = data.userId;
        if (userId) {
            currentUserId = userId;
        }
        const rider = data.rider;
        const timestamp = data.timestamp;
        if (rider === 0) {
            const start = data.start;
            const end = data.end;
            console.log(`Client ${userId} sent request from Start: ${start} to End: ${end} at ${timestamp}`);
            //f();
        } else {
            const latitude = data.latitude;
            const longitude = data.longitude;
            const start = data.start;
            const end = data.end;
            if (userId) {
                users[userId] = { latitude, longitude, timestamp };
                currentUserId = userId;
                console.log(`Rider ${userId} location updated to start: ${start}, end: ${end} at ${timestamp}`);
            }
        }
        console.log(users);
        // console.log(message);
    });
    socket.on('rideRequest', (message) => {
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

module.exports = users;
server.listen(3000, () => {
    console.log("SERVING ON PORT 3000...");
});

// gaurav

//varun