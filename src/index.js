// init project
const app = require("express")();
const cors = require("cors");
const bodyParser = require("body-parser");
const server = require("http").Server(app);
const io = require("socket.io")(server);
const Room = require("./Room/Room");
// const Datastore = require("nedb");
const rooms = [];

app.use(cors());
app.use(bodyParser.json());

server.listen(8080, {}, _ => console.log("Listening on http://localhost:8080"));

// Serve the root url: http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  console.log("hello");
  response.send("Hello");
});

app.post("/create", (req, res) => {
  const { startWith, endWith } = req.body;
  const room = Room.createRoom(io, {
    initialCardAmount: parseInt(startWith, 10),
    lastCardAmount: parseInt(endWith, 10)
  });

  rooms.push(room);
  console.log("Room created: ", room.id);
  res.send({ id: room.id });
});

// const db = new Datastore({
//   filename: "/sandbox/src/db/database",
//   autoload: true
// });
// // Using `public` for static files: http://expressjs.com/en/starter/static-files.html
// app.use(express.static("public"));

// // Send user data - used by client.js
// app.get("/users", function(request, response) {
//   db.find({ name: { $exists: true } }, function(err, docs) {
//     // finds all users in the database
//     response.send(docs); // sends users back to the page
//   });
// });

// // create a new users entry
// app.post("/new", function(request, response) {
//   db.insert({ name: request.body.user }, function(err, numReplaced, upsert) {
//     response.redirect("/");
//   });
// });
