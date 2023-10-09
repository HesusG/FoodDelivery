//express
const express = require("express")
const app = express()
const HTTP_PORT = process.env.PORT || 8080

//express-handlebars
const exphbs = require("express-handlebars")
app.engine(`.hbs`, exphbs.engine({ extname: `.hbs` }))
app.set(`view engine`, `.hbs`)

// receive data from a <form>
app.use(express.urlencoded({ extended: true }))

let menuItemsCollection = [
    {
        name: "Burger",
        image: "burger.jpg",
        description: "Delicious beef burger with lettuce, tomato, and cheese",
        price: 5.99
    },
    {
        name: "Pizza",
        image: "pizza.jpg",
        description: "Large pepperoni pizza with extra cheese",
        price: 12.99
    },
    // Add more menu item objects as needed
];

let ordersCollection = [
    {
        customerName: "John Smith",
        deliveryAddress: "123 Main St, Cityville",
        itemsOrdered: ["Burger", "Fries", "Soda"],
        dateTimeOfOrder: new Date("2023-10-09T12:00:00"),
        status: "RECEIVED"
    },
    {
        customerName: "Jane Doe",
        deliveryAddress: "456 Elm St, Townsville",
        itemsOrdered: ["Pizza", "Salad", "Water"],
        dateTimeOfOrder: new Date("2023-10-09T12:30:00"),
        status: "IN TRANSIT"
    }
];

let driversCollection = [
    {
        username: "driver1",
        password: "password1",
        fullName: "John Doe",
        vehicleModel: "Toyota Camry",
        color: "Blue",
        licensePlate: "ABC123"
    },
    {
        username: "driver2",
        password: "password2",
        fullName: "Jane Smith",
        vehicleModel: "Honda Civic",
        color: "Red",
        licensePlate: "XYZ789"
    }
];




app.get("/", (req, res) => {
    console.log(`here at /`)
    res.render("driver-page",
        {
            layout: false
        })
})

app.get("/login", (req, res) => {
    console.log(`here at /login`)
    // Accessing a driver's information
    console.log(driversCollection[0].fullName); // Outputs: "John Doe"
    res.render("driver-login",
        {
            layout: false
        })
})

// Handle driver login POST request
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Check if the provided username and password match any driver in driversCollection
    const loggedInDriver = driversCollection.find(driver => driver.username === username && driver.password === password);

    if (loggedInDriver) {
        // If login is successful, you can set a session or a cookie to keep the user logged in
        // For simplicity, we'll just redirect to a success page
        res.redirect("/login-success");
    } else {
        // If login fails, you can show an error message or redirect back to the login page
        res.redirect("/login?error=true");
    }
});

// Handle login success
app.get("/login-success", (req, res) => {
    console.log(`here at /login-success`)
    res.render("login-success", {
        layout: false
    });
});

// ... (remaining routes)

// Handle logout, you can clear the session or cookie here
app.get("/logout", (req, res) => {
    // Clear the session or cookie as needed
    // Redirect to the login page or home page
    res.redirect("/login");
});

app.get("/register", (req, res) => {
    console.log(`here at /register`)
    for(driver of driversCollection)
    {
        console.log(`${driver.username}`)
    }
    res.render("driver-register",
        {
            layout: false
        })
})

// Handle driver registration POST request
app.post("/register", (req, res) => {
    const { username, password, fullName, vehicleModel, color, licensePlate } = req.body;

    // Create a new driver object
    const newDriver = {
        username,
        password,
        fullName,
        vehicleModel,
        color,
        licensePlate
    };

    // Add the new driver to the driversCollection array
    driversCollection.push(newDriver);

    for(driver of driversCollection)
    {
        console.log(`${driver.fullName}`)
    }

    // Redirect to a confirmation page (you can create this page)
    res.redirect("/register-success");
});

app.get("/register-success", (req, res) => {
    console.log(`here at /register-success`)
    res.render("register-success",
        {
            layout: false
        })
})

app.get("/orderlist", (req, res) => {
    console.log(`here at /register`)
    res.render("order-list",
        {
            layout: false
        })
})

app.get("/deliverylist", (req, res) => {
    console.log(`here at /deliverylist`)
    res.render("delivery-fulfillment",
        {
            layout: false
        })
})


const onHTTPStart = () => {
    console.log("Server is live!")
}

app.listen(HTTP_PORT, onHTTPStart)