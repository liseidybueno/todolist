//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://XXX@cluster0.wapxb.mongodb.net/todolistDB", {useFindAndModify: false, useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = {
  name: String
};

//create mongoose model
const Item = mongoose.model("Item", itemsSchema);

const firstItem = new Item ({
  name: "Welcome to the To Do List"
});

const secondItem = new Item ({
  name: "Use the + button to add an item"
});

const thirdItem = new Item ({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [firstItem, secondItem, thirdItem];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, listItems){

    if(listItems.length === 0){
      //if items collection is empty, add default items
      Item.insertMany(defaultItems, function(err){
         if(err){
           console.log(err);
         } else {
           console.log("inserted default items successfully");
         }
       });
       res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: listItems});
    }

  });

});

app.get("/:listName", function(req, res){

  const listName = _.capitalize(req.params.listName);

  List.findOne({name: listName}, function(err, customList){

    if(!err){
      if(!customList){
        //create a new list
        const list = new List({
          name: listName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + listName);
      } else {
        //show existing list
        res.render("list", {listTitle: customList.name, newListItems: customList.items})
      }
    }

  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;


  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();

    //redirect to show new item from DB on page
    res.redirect("/");

  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }



});

app.post("/delete", function(req, res){

  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){

    Item.findByIdAndRemove(checkedItemID, function(err){
      if(!err){
        console.log("Deleted successfully");
        res.redirect("/");
      }

      });
    } else {
      //use pull
      List.findOneAndUpdate(
        {name: listName},
        {$pull: {items: {_id: checkedItemID}}},
        function(err, foundList){
          if(!err){
            res.redirect("/" + listName);
          }
        });



    }


});


app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
