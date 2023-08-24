const express = require('express')
const router = express.Router()
const mysql = require('mysql')
const bodyParser = require("body-parser")
const bcrypt = require("bcrypt")
const session = require("express-session")

const app = express();

app.use(bodyParser.urlencoded({ extended: true }))

var con = mysql.createConnection({
    host: "localhost",
    database: "platesharing",
    user: "root",
    password: "sql123"
});
con.connect(function (err) {
    if (err) throw err;
    console.log("db Connected!");
});
 
 //save selected combination
router.post("/saveCombination", async function(req,res){
    const requestData = req.body;
 // Save the request_id and offered_datetime in database


 connection.query('INSERT INTO offered_combinations (request_id, offered_datetime) VALUES (?, NOW())', [requestData.request_id], (error, results) => {
    if (error) {
      console.error('Error due to saving the data', error);
      res.status(500).json({ error: 'Error while saving the data.' });
      return;
    }

    const offeredCombinationId = results.insertId;

    const values = [];
    
    
    requestData.offered_combination_details.forEach(detail => {
      detail.offered_stock.forEach(stock => {
        values.push([
          detail.user_id,
          offeredCombinationId,
          stock.type,
          stock.Quantity,
          stock.Material,
          stock.Use,
          stock.Category
        ]);

        const requiredQty = 'SELECT quantity FROM required_stock WHERE reqeust_id = ? and type =?';
        connection.requiredQty(query, [requestData.request_id, stock.type], (error, results) => {
            if (error) {
              console.error('Error occured when qty query' , error);
              res.status(500).json({ error: 'Error while saving the data.' });
            } else {
              if (results.length > 0) {
                const quantity = results[0].quantity;
                console.log('Quantity:', quantity);
              } else {
                console.log('No data found for the given request_id');
              }
            }
      });
    });
    });

    connection.query('INSERT INTO offered_combination_details (user_id, offered_combination_id, type, quantity, material, use, category) VALUES ?', [values], (error) => {
      if (error) {
        console.error('Error saving data to offered_combination_details table:', error);
        res.status(500).json({ error: 'An error occurred while saving the data.' });
        return;
      }

      res.status(200).json({ message: 'Data saved successfully.' });
    });
  });

});


module.exports = router

