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