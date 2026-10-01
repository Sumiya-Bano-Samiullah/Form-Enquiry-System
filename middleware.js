const jwt = require('jsonwebtoken');

// Isko humne arrow function mein convert kar diya variable banakar
const verifyToken = (req, res, next) => {
    // 1. Frontend se request ke headers mein se token nikalna
    const authHeader = req.headers['authorization'];
    
    // Token aam taur par "Bearer <token_string>" ki shakal mein aata hai
    const token = authHeader && authHeader.split(' ')[1];

    // 2. Agar token bilkul hi nahi bheja user ne:
    if (!token) {
        return res.status(401).send({ success: false, message: "Access Denied! Pehle login karein." });
    }

    try {
        // 3. Token ko check (verify) karna apne khufiya password ke sath
        const verified = jwt.verify(token, "MeraKhufiyaSecretKey");
        
        // Agar token sahi hai, toh uske andar ka data request object mein daal dena
        req.user = verified; 
        
        // 4. Agle function (route handler) par bhejna
        next(); 
    } catch (error) {
        // Agar token nakli hai ya expire ho chuka hai:
        res.status(403).send({ success: false, message: "Invalid ya Expired Token!" });
    }
};

module.exports=verifyToken;