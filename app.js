require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// mongoose.connect("mongodb://localhost:27017/todoListDB", {
//   useUnifiedTopology: true
// });

const mongoURL = "mongodb+srv://admin-sha:"+process.env.MONGOPWD+"@cluster0.huqzl.mongodb.net/todoListDB?retryWrites=true&w=majority";
mongoose.connect(mongoURL, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

const itemSchema = new mongoose.Schema({
  name: String
});

const listSchema = new mongoose.Schema({
  name:String,
  items:[itemSchema]
});

const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List",listSchema);

const item1 = new Item({
  name: "Welcome to TodoList"
});
const item2 = new Item({
  name: "Press + to add items"
});
const item3 = new Item({
  name: "<------Click checkbox to delete items"
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {

  Item.find(function(err, items_retr) {

      console.log("retrieved successfully");

      if (items_retr.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Inserted default items successfully");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {
          listTitle: "Today",
          newListItems: items_retr
        });
      }
    });
  });
//let day = date();

app.get("/:customListName",function(req,res){
  //console.log(req.params.customListName);
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name:customListName},function(err,list){
    if(!err){
      if(!list){
        console.log("Doesnt Exist");
        //create a new list
        const list = new List({
          name:customListName,
          items:defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }else{
        //console.log("Exist");
        res.render("list",{listTitle:list.name,newListItems:list.items});
      }
    }
  });

});

app.post("/", function(req, res) {
  //console.log(req.body);
  const taskname = req.body.task;
  const listtitle = req.body.button;

  let newItem = new Item({
    name:taskname
  });

  if(listtitle === "Today"){
    newItem.save();
    res.redirect("/");
  }else{
    List.findOne({name:listtitle},function(err,foundlist){
      if(!err){
        foundlist.items.push(newItem);
        foundlist.save();
        res.redirect("/"+foundlist.name);
      }
    });
  }

});

app.post("/delete",function(req,res){
  //console.log(req.body.checkbox);
  const delID = req.body.checkbox;
  const list = req.body.listName;

  if(list === "Today"){
    Item.findByIdAndDelete(delID,function(){
      console.log("Deleted successfully");
    });
    res.redirect("/");
  }else{
    List.findOneAndUpdate({name:list}, {$pull : {items : {_id : delID}}},function(err,foundlist){
      if(!err){
        res.redirect("/"+list);
      }
    });
  }

});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 4000;
}
app.listen(port, function() {
  console.log("Server started at port 3000");
});
