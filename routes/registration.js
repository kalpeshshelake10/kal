// modules the are required
const express = require('express');
const router = express.Router();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const { body, validationResult } = require('express-validator');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// import all the modules
const { con } = require("./mysqlUtil");

//use moment.js for specific date format
var moment = require("moment")
var created_on = moment().format('YYYY-MM-DDTHH:MM:SS')

//post requiest for registration
router.post("/v1/user/registration", [
    //validations through express-validator
    body('first_name', 'Enter a valid First Name').isLength({ min: 1 }).matches(/^[A-Za-z]+$/),
    body('last_name', 'Enter a valid Last Name').isLength({ min: 1 }).matches(/^[A-Za-z]+$/),
    body('mobile_number', 'Enter a valid Mobile Number').isLength({ min: 10, max: 10 }).matches(/\d+/),
    body('password', 'Enter a vaild Password').isLength({ min: 8 }).matches(/[!@#$%^&*()_+\-=;:|,.<>/|?]+/).matches(/[A-Z]/),
    body('country', 'Enter a vaild Country Name').isLength({ min: 1 }).matches(/^[A-Za-z]+$/),
    body('state', 'Enter a vaild State Name').isLength({ min: 1 }).matches(/^[A-Za-z]+$/),
    body('district', 'Enter a vaild District Name').isLength({ min: 1 }).matches(/^[A-Za-z]+$/),
    body('city', 'Enter a vaild City Name').isLength({ min: 1 }).matches(/^[A-Za-z]+$/),
    body('area', 'Enter a vaild Area Name').isLength({ min: 1 }).matches(/^[A-Za-z]+$/),
    body('pincode', 'Enter a vaild PinCode').isLength({ min: 6, max: 6 }).matches(/\d+/),
], async function (req, res) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array()[0].msg })
    }
    else {
        //query to check if the mobile number is present in data base
        const count = "SELECT COUNT(mobile_number) FROM Registration WHERE (mobile_number='" + req.body.mobile_number + "')"
        con.query(count, async function (err, result) {
            if (err) {
                console.log("Count err" + err)
                res.status(500).json({ "statusText": err })
            } else {
                if (result[0]['COUNT(mobile_number)'] == 1) {
                    res.status(200).json({ "statusText": "User is already registered." })
                } else {

                    //hasing the password 
                    const salt = await bcrypt.genSalt(10)
                    const hashedPassword = await bcrypt.hash(req.body.password, salt)

                    country_code = '+91'
                    mobile_number = (req.body.mobile_number)
                    first_name = (req.body.first_name)
                    last_name = (req.body.last_name)
                    registration_status = ("pending")
                    password = String(hashedPassword)
                    address_type = ("residential")
                    country = (req.body.country)
                    state = (req.body.state)
                    district = (req.body.district)
                    city = (req.body.city)
                    area = (req.body.area)
                    pincode = (req.body.pincode)

                    //query to insert data in the registered address table 
                    const query_address = "INSERT INTO registered_address(address_type,area,city,district,state,country,pincode)" +
                        "VALUES('" + address_type + "','" + area + "','" + city + "','" + district + "','" + state + "','" + country + "'," +
                        "'" + pincode + "')";
                    con.query(query_address, function (err, result) {
                        if (err) {
                            res.status(500).json({ 'statusText': err })
                        } else {
                            //query to insert data in the registration table 
                            const query = "INSERT INTO Registration(country_code,mobile_number,first_name,last_name,created_on,registration_status,password,register_address_id)" +
                                "VALUES('" + country_code + "','" + mobile_number + "','" + first_name + "','" + last_name + "','" + created_on + "','" + registration_status + "'," +
                                "'" + password + "','" + result.insertId + "')";
                            con.query(query, function (err, result) {
                                if (err) {
                                    res.status(500).json({ 'statusText': err })
                                } else {
                                    res.status(200).json({ "statusText": "Successfully Registered" })
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
