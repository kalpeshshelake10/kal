const express = require('express');
const bodyParser = require('body-parser');
const mysqlUtil = require('./mysqlUtil'); // Import the mysqlUtil module

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Exception
// Middleware to check request method and body for GET requests
const validateGetMethod = (req, res, next) => {
  if (req.method === 'GET' && Object.keys(req.body).length > 0) {
    return res.status(400).json({ status: 'failed', statusText: 'Request body is not allowed for GET requests.' });
  }
  next();
};

// GET endpoint to retrieve choices by name
app.get('/v1/choices/:name', validateGetMethod, async (req, res) => {
  const name = req.params.name;

  if (!name) {
    return res.status(400).json({ status: 'failed', statusText: "Missing mandatory field: 'name'." });
  }

  try {
    let tableName = '';
    let field = '';

    switch (name) {
      case 'allow_menu_type':
        tableName = 'allow_menu_type_master';
        field = 'menu_type';
        break;
      case 'type':
        tableName = 'type_master';
        field = 'value';
        break;
      case 'dish_menu':
        tableName = 'dish_menu_master';
        field = 'dish_menu';
        break;
        case 'material':
        tableName = 'material_master';
        field = 'material';
        break;
        case 'category':
        tableName = 'category_master';
        field = 'category_name';
        break;
        case 'city':
        tableName = 'city_master';
        field = 'city_name';
        break;
        case 'area':
        tableName = 'area_master';
        field = 'area_name';
        break;
      default:
        return res.status(404).json({ status: 'failed', statusText: 'Invalid endpoint or URL.' });
    }

    const [rows] = await connection.query(`select id, ${field} as value from ${tableName}`);
    
    if (rows.length > 0) {
      const response = { name: name, choices: rows };
      res.status(200).json(response);
    } else {
      res.status(200).json({ status: 'sucess', statusText: 'No data found.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'failed', statusText: 'database does not exist.' });
  }
});

// Default route handler for unsupported methods
app.all('/v1/choices/:name', (req, res) => {
    res.status(405).json({ status: 'failed', statusText: 'Method not allowed.' });
  });



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
