const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const util = require("util");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
var mysql = require("mysql");
const app = express();
__dirname = "C:/Users/Sacrum/Desktop/proj2";

//-------------------------------------Declaration----------------------------------------------
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("trust proxy", 1); // trust first proxy
app.use(
  session({
    secret: "ourLittlesecret.",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 },
  })
);
app.use(passport.initialize());
app.use(passport.session());

//--------------------------------------------------DataBase---------------------------------------------------------------------

//------------------------------------------------Connection string---------------------------------------------------------------
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });
//-------------------------------------------------Creating a Schema----------------------------------------------------------------
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//Model
const User = mongoose.model("User", userSchema);

//Creating Strategies
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//SQl
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "efffsola",
  database: "pricegram",
  port: 3306,
});

con.connect(function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log("Connected!");
  }
});

//Main Function
app.get("/", function (req, res) {
  res.render("home");
});

app.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/signup", function (req, res) {
  res.render("signup");
});

app.get("/item/:id", function (req, res) {
  if (req.isAuthenticated()) {
    var product;
    var rproducts;
    var prods = [];
    var id = req.params.id;
    let user = req.user.username;
    con.query("CALL get_product(" + id + ");", function (err, result, fields) {
      if (err) throw console.log("Item Error");
      product = result[0][0];
      if (product.deliveryDetails) {
        product.deliveryDetails = product.deliveryDetails.split(",");
      }
      if (product.reviews) {
        product.reviews = product.reviews.split("|");
      }
      if (product.rid) {
        var rids;
        product.rid = product.rid.split(",");
        rids = product.rid;
        for (let i = 0; i < rids.length; i++) {
          prods[i] = parseInt(rids[i]);
        }
        prods = prods.slice(0, 4);
        while (prods.length < 4) {
          prods[prods.length] = prods[0];
        }
        console.log(prods);
      }
      product.mainImageLink = product.mainImageLink.split(",")[0];

      con.query(
        "select product_id as id, product.link as slug, product_gallery.link as mainImageLink, title, price, discounted_price from product join product_gallery using(product_id) where product_id = " +
          prods[0] +
          " or product_id = " +
          prods[1] +
          " or product_id = " +
          prods[2] +
          " or product_id = " +
          prods[3] +
          " group by id",
        function (err, result, fields) {
          if (err) console.log("wrong recommendations");
          rproducts = result;
          console.log(rproducts);
          res.render("item", { product: product, rproducts: rproducts });
        }
      );
    });
    try {
      con.query(
        'CALL insert_history("' + user + '", ' + id + ");",
        function (err, result, fields) {
          if (err) console.log("History Error");
        }
      );
    } catch (err) {
      console.log("History Error");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/products/:id", function (req, res) {
  if (req.isAuthenticated()) {
    var products;
    let id = req.params.id;
    var q = req.query.q;

    if (id != "na") {
      con.query(
        "CALL get_product_by_category_id(" + id + ", " + 100 + ")",
        function (err, result, fields) {
          if (err) console.log("Search Product By Category Error");
          products = result[0];
          res.render("products", { products: products, q: q });
        }
      );
    }

    if (q) {
      con.query(
        'CALL search_by_title("' + q + '");',
        function (err, result, fields) {
          if (err) console.log("Search Product By Query Error");
          products = result[0];
          res.render("products", { products: products, q: q });
        }
      );
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/dashboard", function (req, res) {
  let sale1, sale2, sale3;
  console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    con.query(
      "CALL get_product_by_vendor_id(0, 4)",
      function (err, result, fields) {
        if (err) throw err;
        sale1 = result[0];
        con.query(
          "CALL get_product_by_vendor_id(1, 4)",
          function (err, result, fields) {
            if (err) throw err;
            sale2 = result[0];
            con.query(
              "CALL get_product_by_vendor_id(2, 4)",
              function (err, result, fields) {
                if (err) throw err;
                sale3 = result[0];
                res.render("dashboard", {
                  products1: sale1,
                  products2: sale2,
                  products3: sale3,
                });
              }
            );
          }
        );
      }
    );
  } else {
    res.redirect("/login");
  }
});

app.get("/profile", function (req, res) {
  var profile;
  if (req.isAuthenticated()) {
    con.query(
      'CALL get_user("' + req.user.username + '");',
      function (err, result, fields) {
        if (err) console.log("profile error");
        profile = result[0][0];
        console.log(profile);
        res.render("profile", { profile: profile });
      }
    );
  } else {
    res.redirect("login");
  }
});

app.post("/profile", function (req, res) {
  if (req.isAuthenticated()) {
    try {
      con.query(
        'CALL update_user("' +
          req.user.username +
          '", "' +
          req.body.password +
          '", "' +
          req.body.email +
          '", "' +
          req.body.mobile +
          '", "' +
          req.body.first_name +
          '", "' +
          req.body.last_name +
          '")',
        function (err, result, fields) {
          if (err) console.log("Update Profile Error");
          res.redirect("/dashboard");
        }
      );
    } catch (err) {
      console.log("Update Profile Error");
    }
  } else {
    res.redirect("login");
  }
});

app.get("/favourites", function (req, res) {
  if (req.isAuthenticated()) {
    con.query(
      'CALL get_favourite("' + req.user.username + '");',
      function (err, result, fields) {
        if (err) console.log("Favourites Error");
        favourites = result[0];
        res.render("favourites", { favourites: favourites });
      }
    );
  } else {
    res.redirect("/login");
  }
});

app.post("/favourites", function (req, res) {
  try {
    con.query(
      'CALL insert_favourite("' +
        req.user.username +
        '", ' +
        req.body.id +
        ");",
      function (err, result, fields) {
        if (err) console.log("Favourites Error");
        res.redirect("/favourites");
      }
    );
  } catch (err) {
    console.log("Favourites Error");
  }
});

app.get("/history", function (req, res) {
  if (req.isAuthenticated()) {
    con.query(
      'CALL get_history("' + req.user.username + '");',
      function (err, result, fields) {
        if (err) throw err;
        history = result[0];
        res.render("history", { history: history });
      }
    );
  } else {
    res.redirect("/login");
  }
});

app.post("/signup", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/signup");
      } else {
        passport.authenticate("local")(req, res, function () {
          try {
            con.query(
              'CALL insert_user("' +
                req.user.username +
                '", "' +
                req.body.password +
                '", "' +
                req.body.email +
                '", "' +
                req.body.phone +
                '", "' +
                req.body.firstname +
                '", "' +
                req.body.lastname +
                '")',
              function (err, result, fields) {
                if (err) console.log("Sign Up Error");
                res.redirect("/dashboard");
              }
            );
          } catch (err) {
            console.log("Sign Up Error");
          }
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const user = new User({
    email: req.body.username,
    password: req.body.password,
  });
  passport.authenticate("local", { failureRedirect: "/login" })(
    req,
    res,
    function () {
      if (req.isAuthenticated()) {
        res.redirect("/dashboard");
      } else {
        res.redirect("/login");
      }
    }
  );
});

app.post("/search", function (req, res) {
  con.query(
    'SELECT title,product_id as id FROM product WHERE title LIKE "%' +
      req.body.q +
      '%"',
    function (err, result, fields) {
      if (err) console.log("Recommendation Search Error");
      res.send(result.slice(0, 7));
    }
  );
});

app.post("/username", function (req, res) {
  con.query(
    'SELECT username FROM user WHERE username = "' + req.body.username + '"',
    function (err, result, fields) {
      if (err) console.log("Username Error");
      console.log(result);
      res.send(result[0]);
    }
  );
});

//--------------------------------------Local Hosting--------------------------------------------------
app.listen(3000, function (req, res) {
  console.log("Server listening at port 3000.");
});
