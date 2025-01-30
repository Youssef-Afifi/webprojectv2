console.log('Server file is being executed...');
const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const db_access = require('./db1.js')
const db = db_access.db
const cookieParser = require('cookie-parser');
const server = express()
const port = 1911
server.use(express.json())
server.use(cookieParser())

server.use(express.json())
server.use(cookieParser())
const secret_key = "12345678";
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
    db.get(`SELECT * FROM USER WHERE EMAIL=?  `, [email], (err, row) => {
        bcrypt.compare(password, row.PASSWORD, (err, isMatch) => {
            if (err) {
                return res.status(500).send('error comparing password.')
            }
            if (!isMatch) {
                return res.status(401).send('invalid credentials')
            }
            else {
                let userID = row.ID
                let isAdmin = row.ISADMIN
                const token = generateToken(userID, isAdmin)

                res.cookie('authToken', token, {
                    httpOnly: true,
                    sameSite: 'none',
                    secure:true,
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
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).send('error hashing password')
        }
        db.run(`INSERT INTO USER (name,email,password,isadmin) VALUES (?,?,?,?)`, [name, email, hashedPassword, 0], (err) => {
            if (err) {

                return res.status(401).send(err)
            }
            else
                return res.status(200).send(`registration successfull`)
        })
    })
})

server.post(`/products/addproduct`, verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1)
        return res.status(403).send("you are not an admin")
    const name = req.body.name
    const description = req.body.description
    const price = req.body.price
    const quantity = parseInt(req.body.quantity, 10)
    let query = `INSERT INTO FLIGHT (name,description,price,quantity) VALUES
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

    // Fetch all cart items for the user
    const getCartQuery = `
        SELECT CART.PRODUCT_ID, CART.QUANTITY, PRODUCT.PRICE 
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
        let orderPromises = [];

        // Check stock availability and calculate total amount
        cartItems.forEach((item) => {
            totalAmount += item.QUANTITY * item.PRICE;

            orderPromises.push(new Promise((resolve, reject) => {
                // Check if product stock is enough
                db.get(`SELECT QUANTITY FROM PRODUCT WHERE ID = ?`, [item.PRODUCT_ID], (err, product) => {
                    if (err || !product || product.QUANTITY < item.QUANTITY) {
                        reject(`Product ID ${item.PRODUCT_ID} is out of stock or insufficient quantity`);
                    } else {
                        resolve();
                    }
                });
            }));
        });

        // If all stock checks pass, insert orders
        Promise.all(orderPromises)
            .then(() => {
                let insertOrderPromises = cartItems.map((item) => {
                    return new Promise((resolve, reject) => {
                        db.run(`INSERT INTO ORDERS (USER_ID, PRODUCT_ID, QUANTITY, TOTAL_PRICE, NAME, ADDRESS, PAYMENT_METHOD) 
                                VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                            [userId, item.PRODUCT_ID, item.QUANTITY, item.QUANTITY * item.PRICE, name, address, paymentMethod], 
                            (err) => {
                                if (err) reject('Error inserting order');
                                else resolve();
                            });
                    });
                });

                // Update product stock
                let updateStockPromises = cartItems.map((item) => {
                    return new Promise((resolve, reject) => {
                        db.run(`UPDATE PRODUCT SET QUANTITY = QUANTITY - ? WHERE ID = ?`,
                            [item.QUANTITY, item.PRODUCT_ID], (err) => {
                                if (err) reject('Error updating product stock');
                                else resolve();
                            });
                    });
                });

                // Clear user cart after order placement
                const clearCartQuery = `DELETE FROM CART WHERE USER_ID = ?`;

                Promise.all([...insertOrderPromises, ...updateStockPromises])
                    .then(() => {
                        db.run(clearCartQuery, [userId], (err) => {
                            if (err) {
                                console.error('Error clearing cart:', err);
                                return res.status(500).send('Order placed, but failed to clear cart');
                            }
                            return res.status(200).send(`Order placed successfully!`);
                        });
                    })
                    .catch((error) => {
                        console.error(error);
                        return res.status(500).send('Error processing order');
                    });
            })
            .catch((error) => {
                return res.status(400).send(error);
            });
    });
});



server.listen(port, () => console.log(`Server running on port ${port}`));
