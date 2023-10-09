const express = require("express");
require("dotenv").config();
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const router = express.Router();
const HTTP_PORT = process.env.PORT || 8080;

app.use(router);
app.engine(".hbs", exphbs.engine({ extname: ".hbs" }));
app.set("view engine", ".hbs");
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

const MONGODB_URI = process.env.MONGODB_URI;
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB: " + err.message);
  });

app.listen(HTTP_PORT, () => {
  console.log(`Server is running at http://localhost:${HTTP_PORT}`);
});

const orderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
  },
  deliveryAddress: {
    type: String,
    required: true,
  },
  itemsOrdered: {
    type: [String],
    required: true,
  },
  orderDateTime: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["RECEIVED", "READY FOR DELIVERY", "IN TRANSIT", "DELIVERED"],
    default: "RECEIVED",
  },
  orderConfirmation: {
    type: Number,
    unique: true,
    required: true,
  },
});

const Order = mongoose.model("Order", orderSchema);

router.get("/current-orders", async (req, res) => {
  try {
    // Fetch current orders from the database
    const currentOrders = await Order.find({ status: "RECEIVED" })
      .sort({ orderDateTime: -1 })
      .exec();

    // Render the "currentOrders" view and pass data
    res.render("currentOrders", {
      layout: "layout",
      orders: currentOrders,
    });
  } catch (error) {
    console.error("Error fetching current orders:", error);
    res.status(500).send("Internal Server Error");
  }
});
