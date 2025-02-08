console.log('Server file is being executed...');
const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const db_access = require('./db.js')
const db = db_access.db
const cookieParser = require('cookie-parser');
const server = express()
const port = 555
const secret_key='qwertyuiop'
server.use(express.json())
server.use(cookieParser())
server.use(cors({
    origin:"http://localhost:3000",
    credentials:true
}))

server.use(express.json())
server.use(cookieParser())



const generateToken = (id, isAdmin) => {
    return jwt.sign({ id, isAdmin }, secret_key, { expiresIn: '1h' })
}
const verifyToken = (req, res, next) => {
    const token = req.cookies.authToken
    if (!token)
        return res.status(401).send('unauthorized')
    jwt.verify(token, secret_key, (err, details) => {
        if (err)
            return res.status(403).send('invalid or expired token')
        req.userDetails = details

        next()
    })
}

server.post('/user/login', (req, res) => {
    const email = req.body.email
    const password = req.body.password
    db.get(`SELECT * FROM USERS WHERE EMAIL=?  `, [email], (err, row) => {
        bcrypt.compare(password, row.PASSWORD, (err, isMatch) => {
            if (err) {
                return res.status(500).send('error comparing password.')
            }
            if (!isMatch) {
                return res.status(401).send('invalid credentials')
            }
            else {
                let userID = row.ID
                let isAdmin = row.ROLE
                const token = generateToken(userID, isAdmin)

                res.cookie('authToken', token, {
                    httpOnly: true,
                    sameSite: "lax",
                    secure:false,
                    expiresIn: '1h'
                })
                return res.status(200).json({ id: userID, admin: isAdmin })
            }
        })
    })
})
server.post(`/user/register`, (req, res) => {
    const name = req.body.name
    const email = req.body.email
    const password = req.body.password
    const isadmin = req.body.isAdmin || 0

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).send('error hashing password')
        }
        db.run(`INSERT INTO USERS (name,email,password, isadmin) VALUES (?,?,?,?)`, [name, email, hashedPassword, isadmin], (err) => {
            if (err) {

                return res.status(401).send(err)
            }
            else
                return res.status(200).send(`registration successfull`)
        });
    });
});

server.post(`/products/addproduct`, verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1)
        return res.status(403).send("you are not an admin")
    const name = req.body.name
    const description = req.body.description
    const price = req.body.price
    const quantity = parseInt(req.body.quantity, 10)
    let query = `INSERT INTO PRODUCT (name,description,price,quantity) VALUES
    (?,?,?,?)`
    db.run(query, [name, description, price, quantity], (err) => {
        if (err) {
            console.log(err)
            return res.send(err)
        }
        else {
            return res.send(`product added succesfully.`)
        }
    })

})

server.get(`/products`, (req, res) =>{
    const query = `SELECT * FROM PRODUCT WHERE QUANTITY > 0`;
    db.all(query, (err, rows) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).send('Error fetching products');
        }
        res.status(200).json(rows);
    });
});

server.get('/cart/:userId', (req, res) => {
    const { userId } = req.params;

    const query = `
        SELECT CART.PRODUCT_ID, CART.QUANTITY, PRODUCT.NAME, PRODUCT.PRICE 
        FROM CART
        JOIN PRODUCT ON CART.PRODUCT_ID = PRODUCT.ID
        WHERE CART.USER_ID = ?`;

    db.all(query, [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching cart items:', err);
            return res.status(500).send('Error fetching cart items');
        }
        res.status(200).json(rows);
    });
});

server.post('/cart/add', (req, res) => {
    const { userId, productId, quantity } = req.body;

    const checkQuery = `SELECT * FROM CART WHERE USER_ID = ? AND PRODUCT_ID = ?`;
    db.get(checkQuery, [userId, productId], (err, row) => {
        if (err) {
            console.error('Error checking cart:', err);
            return res.status(500).send('Error checking cart');
        }

        if (row) {
            const updateQuery = `UPDATE CART SET QUANTITY = QUANTITY + ? WHERE USER_ID = ? AND PRODUCT_ID = ?`;
            db.run(updateQuery, [quantity, userId, productId], (err) => {
                if (err) {
                    console.error('Error updating cart:', err);
                    return res.status(500).send('Error updating cart');
                }
                res.status(200).send('Cart updated successfully');
            });
        } else {
            const insertQuery = `INSERT INTO CART (USER_ID, PRODUCT_ID, QUANTITY) VALUES (?, ?, ?)`;
            db.run(insertQuery, [userId, productId, quantity], (err) => {
                if (err) {
                    console.error('Error adding product to cart:', err);
                    return res.status(500).send('Error adding product to cart');
                }
                res.status(200).send('Product added to cart successfully');
            });
        }
    });
});

server.get('/products/search', (req, res) => {
    let query = `SELECT * FROM PRODUCT WHERE QUANTITY > 0`;
    if (req.query.name) {
        query += ` AND NAME LIKE ?`;
    }
    db.all(query, [`%${req.query.name}%`], (err, rows) => {
        if (err) {
            console.error('Error searching for products:', err);
            return res.status(500).send('Error searching for products');        }
        return res.json(rows);
    });
});

server.post('/order/place', verifyToken, (req, res) => {
    const userId = req.userDetails.id;
    const { name, address, paymentMethod } = req.body;


    const getCartQuery = `
        SELECT CART.PRODUCT_ID, CART.QUANTITY, PRODUCT.PRICE, PRODUCT.QUANTITY AS STOCK 
        FROM CART
        JOIN PRODUCT ON CART.PRODUCT_ID = PRODUCT.ID
        WHERE CART.USER_ID = ?`;

    db.all(getCartQuery, [userId], (err, cartItems) => {
        if (err) {
            console.error('Error fetching cart items:', err);
            return res.status(500).send('Error fetching cart items');
        }

        if (cartItems.length === 0) {
            return res.status(400).send('Cart is empty. Add items before placing an order.');
        }

        let totalAmount = 0;

        for (const item of cartItems) {
            if (item.STOCK < item.QUANTITY) {
                return res.status(400).send(`Product ID ${item.PRODUCT_ID} is out of stock or insufficient quantity.`);
            }
            totalAmount += item.QUANTITY * item.PRICE;
        }

        for (const item of cartItems) {
            const insertOrderQuery = `
                INSERT INTO ORDERS (USER_ID, PRODUCT_ID, QUANTITY, TOTAL_PRICE, NAME, ADDRESS, PAYMENT_METHOD) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`;

            db.run(insertOrderQuery, [userId, item.PRODUCT_ID, item.QUANTITY, item.QUANTITY * item.PRICE, name, address, paymentMethod], (err) => {
                if (err) {
                    console.error('Error inserting order:', err);
                    return res.status(500).send('Error placing order.');
                }
            });

            const updateStockQuery = `UPDATE PRODUCT SET QUANTITY = QUANTITY - ? WHERE ID = ?`;
            db.run(updateStockQuery, [item.QUANTITY, item.PRODUCT_ID], (err) => {
                if (err) {
                    console.error('Error updating stock:', err);
                    return res.status(500).send('Error updating stock.');
                }
            });
        }
        const clearCartQuery = `DELETE FROM CART WHERE USER_ID = ?`;
        db.run(clearCartQuery, [userId], (err) => {
            if (err) {
                console.error('Error clearing cart:', err);
                return res.status(500).send('Order placed, but failed to clear cart.');
            }
            return res.status(200).send('Order placed successfully!');
        });
    });
});




server.listen(port, () => {
    console.log('server running on port 555');
    db.serialize(() => {
        db.run(db_access.createUserTable);
        db.run(db_access.createProductTable);
        db.run(db_access.createCartTable);
    });
});
    
setInterval (() => {
    console.log('server is still running');
}, 10000);
