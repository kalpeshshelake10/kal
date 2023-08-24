//require modules
const express = require('express');
const router = express.Router();
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//import module
const { con } = require("./mysqlUtil");


//get request for particular user_id
router.get('/v1/user/:user_id', (req, res) => {


//extract user_id from url and converting from string to integer
const user_id = parseInt(req.params.user_id);

const session_id_header = req.headers.cookie;

//remove uuid from session_id
const session_id_split=session_id_header.split('=')[1];


//information associated with session_id
const sessionQuery = 'select * from session where session_id = ?';

con.query(sessionQuery,[session_id_split],(sessionError, sessionResults) => {
  if (sessionError) {
    console.error('Error fetching session from database:', sessionError);
    res.status(500).json({ error: 'An error occurred while verifying the session' });
    return;
  }

  if(sessionResults[0].session_status=="inactive"){
    res.status(401).json({error:'session id is expired'})
    return;

  }

  if (sessionResults.length === 0) {
    res.status(401).json({ error: 'Session id is invalid or null' });
    return;
  }
});


//query for particular user_id details
const query = 'select * from users left join address on users.user_id=address.user_id where users.user_id=?';

con.query(query, [user_id], (error, results) => {
  if (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ error: 'An error occurred while fetching the user' });
      return;
    }


  if (results.length === 0) {
      res.status(404).json({ error: 'Invalid User id' })
      return;
    } else {
      res.status(200).json({ user: results })
      return;
    }
  });
});

module.exports = router