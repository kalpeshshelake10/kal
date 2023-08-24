// modules that are required
const express = require('express')
const router = express.Router()
const bodyParser = require("body-parser")
const bcrypt = require("bcrypt")
const { body, validationResult } = require('express-validator');

const app = express();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// import all the modules
const { con } = require("./mysqlUtil");

//function to generate a random number 
function random_number() {
    let x = Math.random() * 1000000;
    return x
}

//use moment.js for specific date format
var moment = require("moment")
var created_on = moment().format('YYYY-MM-DD HH:MM')
var created_on_date = moment().format('YYYY-MM-DD')
var created_on_time = moment().format('HH:MM')


//post request for login user
router.post("/v1/user/login", [
    //validations through express-validator
    body('mobile_number', 'Enter a valid Mobile Number').isLength({ min: 10, max: 10 }).matches(/\d+/),
    body('password', 'Enter a vaild Password').isLength({ min: 8 }).matches(/[!@#$%^&*()_+\-=;:|,.<>/|?]+/).matches(/[A-Z]/),
], async function (req, res) {
    flag = true
    var random = random_number();
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array()[0].msg })
    }
    else {
        mobile_number = req.body.mobile_number
        password = req.body.password

        //query to check if the mobile number is present in data base
        const query = "SELECT COUNT(mobile_number) FROM users WHERE (mobile_number = '" + mobile_number + "')"
        con.query(query, function (err, result) {
            if (err) {
                res.status(500).json({ 'statusText': err })
            } else {
                //if the entered mobile number is not registered
                if (result[0]['COUNT(mobile_number)'] == 0) {
                    res.status(400).json({ 'statusText': 'Mobile Number is not registered' })
                }
                //if the mobile number is registered
                else {
                    //query to select the stored password of the given mobile number
                    const query = "SELECT password FROM users WHERE (mobile_number='" + mobile_number + "')"
                    con.query(query, async function (err, result) {
                        if (err) {
                            res.status(500).json({ 'statusText': err })
                        } else {

                            //hasing the password 
                            const salt = await bcrypt.genSalt(10)
                            const hashedPassword = await bcrypt.hash(req.body.password, salt)
                            const passwordMatch = await bcrypt.compare(req.body.password, result[0]['password']);

                            if (passwordMatch) {
                                //query to check if the generated session-id is present in the sessionID table
                                const query = "SELECT COUNT(session_id) FROM session WHERE (session_id = '" + random + "') AND (session_status ='" + 'Active' + "')"
                                con.query(query, function (err, result) {
                                    if (err) {
                                        res.status(500).json({ 'statusText': err })
                                    } else {
                                        //if session id is present in the DB then generate new session id
                                        if (result[0]['COUNT(session_id)'] > 0) {
                                            //run until we generate unique session id
                                            while (flag) {
                                                random = random_number();
                                                //query to check if the generated session-id is present in the sessionID table
                                                const query = "SELECT COUNT(session_id) FROM session WHERE session_id = '" + random + "'"
                                                con.query(query, function (err, result) {
                                                    if (err) {
                                                        res.status(500).json({ 'statusText': err })
                                                    } else {
                                                        if (result[0]['COUNT(session_id)'] == 0) {
                                                            flag = false
                                                        }
                                                    }
                                                })
                                            }
                                        }
                                        if (result[0]['COUNT(session_id)'] == 0) {
                                            //query to select user id for entered mobile number
                                            const query = "SELECT user_id FROM users WHERE mobile_number = '" + mobile_number + "'"
                                            con.query(query, function (err, result) {
                                                if (err) {
                                                    res.status(500).json({ 'statusText': err })
                                                } else {
                                                    //insert the generated session id against user id in session table
                                                    const query = "INSERT INTO session(id , session_id ,session_status,created_on_date , created_on_time,modified_on_date,modified_on_time,login_time) VALUES ('" + result[0]['user_id'] + "' , '" + random + "', '" + "Active" + "' , '" + created_on_date + "' , '" + created_on_time + "' ,'" + created_on_date + "' , '" + created_on_time + "' , '" + created_on + "')"
                                                    con.query(query, function (err, result) {
                                                        if (err) {
                                                            res.status(500).json({ 'statusText': err })
                                                        } else {
                                                            res.status(200).json({ "statusText": "Login Successfull. Sessionid: " + random })
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    }
                                })
                            } else {
                                res.status(400).json({ "statusText": "Invalid Credentials" })
                            }
                        }
                    })
                }
            }
        })
    }
})

module.exports = router