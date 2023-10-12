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

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    itemsOrdered: {
      type: [
        {
          name: String,
          quantity: Number,
          price: Number,
        },
      ],
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
      type: String,
      unique: true,
      required: true,
    },
    assignedTo: {
      type: String,
      default: "",
    },
  },
  { versionKey: false }
);
const driverSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  vehicleModel: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true,
  },
});

const Order = mongoose.model("Order", orderSchema);
const Driver = mongoose.model("Driver", driverSchema);

const setupDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const orderCount = await Order.countDocuments();

    if (orderCount === 0) {
      const timestamp = new Date();

      await Order.insertMany([
        {
          customerName: "John Doe",
          deliveryAddress: "123 Main Street, City, State",
          itemsOrdered: [
            {
              name: "Taco",
              quantity: 2,
              price: 2.99,
            },
          ],
          orderDateTime: new Date(),
          status: "RECEIVED",
          orderConfirmation: "abc123",
        },
        {
          customerName: "Jane Smith",
          deliveryAddress: "456 Elm Street, Town, State",
          itemsOrdered: [
            {
              name: "Taco",
              quantity: 1,
              price: 2.99,
            },
          ],
          orderDateTime: new Date(Date.now() + 1 * 60 * 1000),
          status: "READY FOR DELIVERY",
          orderConfirmation: "def456",
          assignedTo: "XYZ-123",
        },
        {
          customerName: "Alice Johnson",
          deliveryAddress: "789 Oak Avenue, Village, State",
          itemsOrdered: [
            {
              name: "Burger",
              quantity: 3,
              price: 4.99,
            },
          ],
          orderDateTime: new Date(Date.now() + 2 * 60 * 1000),
          status: "IN TRANSIT",
          orderConfirmation: "ghi789",
          assignedTo: "ABC-789",
        },
        {
          customerName: "Bob Wilson",
          deliveryAddress: "101 Pine Street, Hamlet, State",
          itemsOrdered: [
            {
              name: "Burger",
              quantity: 2,
              price: 4.99,
            },
          ],
          orderDateTime: new Date(Date.now() + 3 * 60 * 1000),
          status: "DELIVERED",
          orderConfirmation: "jkl101",
          assignedTo: "DEF-456",
        },
        {
          customerName: "Eve Johnson",
          deliveryAddress: "789 Oak Avenue, Village, State",
          itemsOrdered: [
            {
              name: "Taco",
              quantity: 3,
              price: 2.99,
            },
          ],
          orderDateTime: new Date(Date.now() + 4 * 60 * 1000),
          status: "READY FOR DELIVERY",
          orderConfirmation: "mno456",
          assignedTo: "",
        },
        {
          customerName: "Charlie Brown",
          deliveryAddress: "101 Pine Street, Hamlet, State",
          itemsOrdered: [
            {
              name: "Taco",
              quantity: 2,
              price: 2.99,
            },
          ],
          orderDateTime: new Date(Date.now() + 5 * 60 * 1000),
          status: "IN TRANSIT",
          orderConfirmation: "pqr101",
          assignedTo: "OPQ-123",
        },
      ]);

      console.log("Orders collection was created and prepopulated with data");
    } else {
      console.log("Orders collection already exists, no prepopulation needed");
    }
  } catch (error) {
    console.error("Error setting up orders collection: " + error.message);
  }
};

setupDatabase();
app.get("/", async (req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: "DELIVERED" } })
      .sort({ orderDateTime: 1 })
      .lean()
      .exec();

    const isEmptyOrders = orders.length === 0;

    for (const order of orders) {
      order.formattedOrderDateTime = formatDate(order.orderDateTime);
      order.orderTotal = calculateOrderTotal(order.itemsOrdered);
      order.isReceived = order.status === "RECEIVED";
      order.isDelivered = order.status === "DELIVERED";
      order.isAssigned = order.assignedTo !== "";

      const matchedDriver = await Driver.findOne({
        licensePlate: order.assignedTo,
      })
        .lean()
        .exec();

      if (matchedDriver) {
        order.driverName = matchedDriver.fullName;
        order.driverLicensePlate = matchedDriver.licensePlate;
      }
    }

    return res.render("orders", { orders, isEmptyOrders });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
});

app.post("/changeStatus", async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const newStatus = req.body.newStatus;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    if (newStatus === "IN TRANSIT" || newStatus === "DELIVERED") {
      if (!order.assignedTo) {
        return res
          .status(400)
          .send(
            "Order cannot be changed to IN TRANSIT or DELIVERED if it's not assigned."
          );
      }
    }

    order.status = newStatus;
    await order.save();

    return res.redirect("/");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});

app.get("/order-history", async (req, res) => {
  try {
    const deliveredOrders = await Order.find({ status: "DELIVERED" })
      .sort({ orderDateTime: 1 })
      .lean()
      .exec();
    const isEmptyOrders = deliveredOrders.length === 0;

    for (const order of deliveredOrders) {
      order.formattedOrderDateTime = formatDate(order.orderDateTime);
      order.orderTotal = calculateOrderTotal(order.itemsOrdered);

      const matchedDriver = await Driver.findOne({
        licensePlate: order.assignedTo,
      })
        .lean()
        .exec();

      if (matchedDriver) {
        order.driverName = matchedDriver.fullName;
        order.driverLicensePlate = matchedDriver.licensePlate;
      }
    }

    return res.render("order-history", {
      orders: deliveredOrders,
      isEmptyOrders,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
});

const formatDate = (orderDateTime) => {
  return orderDateTime;
};

const calculateOrderTotal = (itemsOrdered) => {
  let total = 0;
  for (const item of itemsOrdered) {
    total += item.quantity * item.price;
  }
  return total;
};
