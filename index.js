require("dotenv").config();
let express = require("express");
let cors = require("cors");
let dbConnection = require("./dbb.js");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyToken = require("./middleware.js");

let app = express();
app.use(cors());
app.use(express.json());

app.post("/sign-up", async (req, res) => {
    try {
        let { Name, Email, Password } = req.body;
        const db = await dbConnection();

        // 1. Password ko hash (encrypt) karein (Salt rounds = 10)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(Password, saltRounds);

        // 2. Database mein 'hashedPassword' insert karein
        const sqlQuery = `insert into accounts(account_name, account_email, account_password) values(?,?,?)`;
        await db.query(sqlQuery, [Name, Email, hashedPassword]);

        res.send({ success: true, message: "Account created successfully!" });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

app.post("/login", async (req, res) => {
    try {
        let { Email, Password } = req.body;
        const db = await dbConnection();

        // Step 1: Check karein ke email database mein hai ya nahi
        const sqlQuery = `SELECT * FROM accounts WHERE account_email = ?`;
        const [rows] = await db.query(sqlQuery, [Email]);

        if (rows.length === 0) {
            return res.status(400).send({ success: false, message: "Email nahi mila! Pehle Sign Up karein." });
        }

        const user = rows[0]; // User ka saara data mil gaya

        // Step 2: Password check karein (Bcrypt ke zariye)
        const isPasswordValid = await bcrypt.compare(Password, user.account_password);

        if (!isPasswordValid) {
            return res.status(400).send({ success: false, message: "Galat Password! Dubara koshish karein." });
        }

        // Step 3: Agar sab sahi hai, toh JWT Token banayein
        // 'SECRET_KEY' ki jagah aap koi bhi khufiya string rakh sakti hain
        const token = jwt.sign(
            { id: user.account_id, email: user.account_email }, 
            "MeraKhufiyaSecretKey", 
            { expiresIn: "1h" } // Token 1 ghante baad expire ho jayega
        );

        // Frontend ko token aur success message bhejein
        res.send({ 
            success: true, 
            message: "Login Successful!", 
            token: token 
        });

    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

// 1. SAARI ENQUIRIES READ KARNE KE LIYE (Frontend requires this for loadEnquiries)
app.get("/enquiries", verifyToken,async (req, res) => {
    try {
        const db = await dbConnection();
        const sqlQuery = `SELECT * FROM users_info`;
        const [rows] = await db.query(sqlQuery);
        res.send(rows); // Yeh poori array frontend ko bhejega
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

// 2. INSERT ROUTE (Fixed variable casing)
app.post("/insert", verifyToken,async (req, res) => {
    try {
        // Frontend se 'Phone' aur 'Message' capital P aur M ke sath aa rahe hain
        let { Name, Email, Phone, Message } = req.body; 
        const db = await dbConnection();
        const sqlQuery = `insert into users_info(user_name,user_email,user_phone,user_message) values (?,?,?,?)`;
        await db.query(sqlQuery, [Name, Email, Phone, Message]);
        
        // success: true bhejein taake frontend alert dikha sake
        res.send({ success: true, message: "Record inserted" }); 
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

// 3. UPDATE ROUTE (Fixed variable casing)
app.put("/update/:id", verifyToken,async (req, res) => {
    try {
        let { id } = req.params;
        let { Name, Email, Phone, Message } = req.body; // Fixed casing
        const db = await dbConnection();
        let updatedFields = [];
        let updatedValues = [];

        if (Name) { updatedFields.push(`user_name=?`); updatedValues.push(Name); }
        if (Email) { updatedFields.push(`user_email=?`); updatedValues.push(Email); }
        if (Phone) { updatedFields.push(`user_phone=?`); updatedValues.push(Phone); }
        if (Message) { updatedFields.push(`user_message=?`); updatedValues.push(Message); }

        if (updatedFields.length === 0) {
            return res.send({ success: false, message: "Nothing to update" });
        }

        updatedValues.push(id);
        const sqlQuery = `update users_info set ${updatedFields.join(",")} where user_id=?`;
        await db.query(sqlQuery, updatedValues);
        
        res.send({ success: true, message: "Record Updated" });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

// 4. DELETE ROUTE
app.delete("/delete/:id", verifyToken,async (req, res) => {
    try {
        let { id } = req.params;
        const db = await dbConnection();
        const sqlQuery = `delete from users_info where user_id = ?`;
        await db.query(sqlQuery, [id]);
        
        res.send({ success: true, message: "Record deleted" });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

app.listen("3000", () => console.log("Server running on port 3000"));