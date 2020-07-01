//jshint esversion:6
require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const socket = require("socket.io");
const app = express();
const port = 5000;

//necessary to get the submitted values from index.html
app.use(bodyParser.urlencoded({extended:true}));

//connect to db
mongoose.connect(process.env.DB_HOST, { useUnifiedTopology: true,  useNewUrlParser: true  });

app.get("/", function(req,res){
  res.send("Listening for messages!");
})
//user schema
const todoSchema = new mongoose.Schema({
  date: String,
  item: String,
});

const Todo = new mongoose.model("todo", todoSchema);

//localost listener
const server = app.listen(process.env.PORT || port, function(){
  console.log(`App listening at http://localhost:` + port)
});

//websocket variable
const io = socket(server);

//check for connection
io.on('connection', (socket) => {

  let itemArr = [];
  Todo.find({}, function(err, items){
    if(!err){
      items.map(function(found){
        itemArr.push(found.item);
      })
      console.log(itemArr);
      socket.emit("items", itemArr);
    }else{
      console.log("Error in DB!");
    }
  })

  socket.on('new', (data) => {
    console.log(data);
    const {date, item} = data;

    const newTodo = new Todo({
      date: date,
      item: item
    });

    newTodo.save(function(err){
      if(!err){
        let itemArr = [];
        Todo.find({}, function(err, items){
          if(!err){
            items.map(function(found){
              itemArr.push(found.item);
            })
            console.log(itemArr);
            socket.emit("items", itemArr);
          }else{
            console.log("Error in DB!");
          }
        })
      }else{
        socket.emit("items", "Error is saving file");
      }
    });
  })

  socket.on('remove', (data) => {
    console.log("Removing: " + data);
    Todo.deleteOne({item: data}, function(err){
      if(!err){
        let itemArr = [];
        Todo.find({}, function(err, items){
          if(!err){
            items.map(function(found){
              itemArr.push(found.item);
            })
            console.log(itemArr);
            socket.emit("items", itemArr);
          }else{
            console.log("Error in DB!");
          }
        })
      }else{
        console.log("Error in DB!");
      }
    });
  })

});
