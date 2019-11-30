const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const cors = require("cors");
const http = require("http");
const socketio = require("socket.io");
const users = require("./routes/api/users");
const images = require("./routes/api/images");
const {
  addUser,
  removeUser,
  getUser,
  getMatchedUsers
} = require("./helper/matchUser");
const port = process.env.PORT || 5001;

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketio(server);
io.set("origins", "*:*");

io.on("connection", socket => {
  console.log("we have a new connection");

  socket.on("join", async ({ userId }, callback) => {
    // helper function
    // console.log(await addUser(userId, socket.id));
    const { err, currentUser } = await addUser(userId, socket.id);
    console.log(currentUser);
    if (err) {
      console.log("Theres an err", userId, err);
      return callback({ err });
    }

    socket.emit("mymessage", {
      user: "admin",
      text: `Matching please wait`
    });

    // tell about match
    socket.broadcast.to(currentUser.roomId).emit("mymessage", {
      user: "admin",
      text: `You have a match with ${currentUser.name}`
    });

    socket.join(currentUser.roomId);

    io.to(currentUser.roomId).emit("roomData", {
      room: currentUser.roomId,
      users: getMatchedUsers(currentUser.roomId)
    });
    // console.log(getUsersInRoom(currentUser.roomId), "users in room id");
    callback();
  });

  socket.on("sendMessage", ({ message, userId }, callback) => {
    // console.log(message, userId);
    const user = getUser(userId);
    console.log(user);
    // io.emit("mymessage", { user: user.name, text: message });
    // io.emit("mymessage", { a: "fasdfsa" });
    io.to(user.roomId).emit("mymessage", { user: user.name, text: message });
    callback();
  });

  socket.on("unmatch", ({ userId }) => {
    console.log(userId);
    removeUser(socket.id);
    // getMatch({ userId });
  });

  socket.on("disconnect", ({ userId }, callback) => {
    console.log("User has left", userId);
    removeUser(socket.id);
  });
});

// Bodyparser middleware
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);

app.use(bodyParser.json()); // DB Config
const db = require("./config/keys").mongoURI; // Connect to MongoDB

mongoose
  .connect(db, { useNewUrlParser: true })
  .then(() => console.log("MongoDB successfully connected"))
  .catch(err => console.log(err));

// Passport middleware
app.use(passport.initialize()); // Passport config
require("./config/passport")(passport); // Routes
app.use("/api/users", users);
app.use("/api", images);

app.use("/uploads", express.static("uploads"));

// process.env.port is Heroku's port if you choose to deploy the app there.

server.listen(port, () =>
  console.log(`Local Server up and running on port ${port} !`)
);
