//modules that are required
const express = require('express')
const router = express.Router()
const bodyParser = require("body-parser")
const { body, validationResult } = require('express-validator');

const app = express();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// import all the modules
const { con } = require("./mysqlUtil");

//use moment.js for specific date format
var moment = require("moment")
var created_on_date = moment().format('YYYY-MM-DD')
var created_on_time = moment().format('HH:MM')

//post request for otp verification 
router.post("/v1/user/verifyotp", [
    //validations through express-validator
    body('mobile_number', 'Enter a valid Mobile Number').isLength({ min: 10, max: 10 }).matches(/\d+/),
    body('otp', 'Enter a valid OTP').isLength({ min: 1 })
], function (req, res) {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array()[0].msg })
    }
    else {
        var id
        mobile_number = req.body.mobile_number
        otp = req.body.otp

        //query to check if the mobile number is present in data base
        const query = "SELECT COUNT(mobile_number) FROM Registration WHERE (mobile_number = '" + mobile_number + "')"
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
                    //query to select the registration id of entered mobile number
                    const verification = "SELECT registration_id FROM Registration WHERE (mobile_number= '" + mobile_number + "')"
                    con.query(verification, async function (err, result) {
                        if (err) {
                            res.status(500).json({ 'statusText': err })
                        } else {
                            id = result[0]['registration_id']
                            //query to count the wrong otp attempts of the user
                            const query = "SELECT COUNT(registration_id) FROM otp WHERE status = '" + false + "' AND registration_id='" + id + "' AND otp_enter_date='" + created_on_date + "'"
                            con.query(query, function (err, result) {
                                if (err) {
                                    res.status(500).json({ 'statusText': err })
                                } else {
                                    if (result[0]['COUNT(registration_id)'] <= 3) {
                                        if (otp == "1234") {
                                            //query to insert data into otp table 
                                            const query_otp = "INSERT INTO OTP (registration_id , otp , otp_expiry  , otp_generating_time , otp_enter_date, otp_enter_time , status)" +
                                                "VALUES('" + id + "' , '" + otp + "' , '" + created_on_date + "' , '" + created_on_date + "','" + created_on_date + "', '" + created_on_time + "','" + "true" + "')"
                                            con.query(query_otp, function (err, result) {
                                                if (err) {
                                                    res.status(500).json({ 'statusText': err })
                                                } else {
                                                    //query to select all the data from registration table
                                                    const registration_data = "SELECT * FROM Registration WHERE (registration_id='" + id + "')"
                                                    con.query(registration_data, function (err, result) {
                                                        if (err) {
                                                            res.status(500).json({ 'statusText': err })
                                                        } else {
                                                            //insert all the data from the registration table to the user table
                                                            const insert = "INSERT INTO users (registration_id, first_name , last_name , country_code , mobile_number, password,status , created_on_date,created_on_time,modified_on_date,modified_on_time) VALUES ('" + result[0]['registration_id'] + "' , '" + result[0]['first_name'] + "' , '" + result[0]['last_name'] + "' , '" + result[0]['country_code'] + "' , '" + result[0]['mobile_number'] + "' , '" + result[0]['password'] + "' , '" + "LogIn" + "' ,'" + created_on_date + "' , '" + created_on_time + "' , '" + created_on_date + "' , '" + created_on_time + "')"
                                                            con.query(insert, function (err, result) {
                                                                if (err) {
                                                                    res.status(500).json({ 'statusText': err })
                                                                } else {
                                                                    const query = "UPDATE Registration SET registration_status = '" + "complete" + "' WHERE mobile_number = '" + mobile_number + "'"
                                                                    con.query(query, function (err, result) {
                                                                        if (err) {
                                                                            res.status(500).json({ 'statusText': err })
                                                                        } else {
                                                                            res.status(200).json({ 'statusText': "OTP Verified Successful. User Logged In", 'registration_id': id })
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                        else {
                                            //query to insert data into otp table 
                                            const query_otp = "INSERT INTO OTP (registration_id , otp , otp_expiry  , otp_generating_time , otp_enter_date , otp_enter_time , status)" +
                                                "VALUES('" + id + "' , '" + otp + "' , '" + created_on_date + "' , '" + created_on_date + "','" + created_on_date + "', '" + created_on_time + "', '" + "false" + "')"
                                            con.query(query_otp, function (err, result) {
                                                if (err) {
                                                    res.status(500).json({ 'statusText': err })
                                                } else {
                                                    //query to count the wrong otp attempts of the user
                                                    const query = "SELECT COUNT(registration_id) FROM otp WHERE status = '" + false + "' AND registration_id='" + id + "' AND otp_enter_date='" + created_on_date + "'"
                                                    con.query(query, function (err, result) {
                                                        if (err) {
                                                        } else {
                                                            if (result[0]['COUNT(registration_id)'] <= 3) {
                                                                let count = 3 - result[0]['COUNT(registration_id)']
                                                                res.status(400).json({ 'statusText': "OTP verification failed. " + count + " attempts remaning." })
                                                            } else {
                                                                res.status(400).json({ 'statusText': "OTP verification failed. " + "0 attempts remaning." })
                                                            }
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    }
                                    else if (result[0]['COUNT(registration_id)'] > 3) {
                                        res.status(400).json({ 'statusText': "OTP verification failed. " + "0 attempts remaning." })
                                    }
                                }
                            })
                        }
                    })
                }
            }
        })
    }
})
module.exports = router
