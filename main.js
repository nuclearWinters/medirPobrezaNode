const sql = require('mssql')
const express = require('express')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const jwtdecode = require('jwt-decode')

const app = express()

const config = {
  user: 'sa',
  password: '@sm2sm2Programad0res',
  server: "192.168.1.110",
  database: 'EncuestasJSON',
  options: {
    encrypt: true
  }
}

// async/await style:
const pool1 = new sql.ConnectionPool(config);
const pool1Connect = pool1.connect();

pool1.on('error', err => {
    console.log(err)
})

app.get('/GetRespuestas', async (req, res) => {
  await pool1Connect; // ensures that the pool has been created
  try {
    const request = pool1.request()
      const result = await request.query("SELECT IDI, #UUID1, #UUID2, #UUID3, #UUID4 FROM Encuestas1 CROSS APPLY OPENJSON(Respuestas) WITH (IDI varchar(50) '$.ID', #UUID1 nvarchar(max), #UUID2 nvarchar(max), #UUID3 nvarchar(max), #UUID4 nvarchar(max))")
      let numbers = result.recordset.map(res => res)
      res.send(numbers)
  } catch (err) {
      console.error('SQL error', err);
      res.send("Error")
  }
})

/*app.get("/loginWithToken", (req, res) => {
  let { token } = req.query
  let username = jwtdecode(token).username
  let query = "SELECT * FROM `users` WHERE username = ?";
  let table = [username];
  query = mysql.format(query,table);
  connection.query(query, (error, results, fields) => {
    if (results.length !== 0) {
      jwt.verify(token, results[0].password, (err, decoded) => {
        if (decoded !== undefined) {
          res.json(true)
        } else {
          res.status(403).send("Forbidden")
        }
      })
    }
    else {
      res.status(403).send("Forbidden")
    }
  })
})

app.get('/login', (req, res) => {
  let {username, password} = req.query
  let query = "SELECT * FROM `users` WHERE username = ?";
  let table = [username];
  query = mysql.format(query,table);
  connection.query(query, (error, results, fields) => {
    if (results.length !== 0) {
      const hashBool = bcrypt.compareSync(password, results[0].password)
      if (hashBool) {
        let token = jwt.sign({
          id: results[0].id,
          nombre: results[0].nombres,
          correo: results[0].correo,
          username: results[0].username,
        }, results[0].password)
        res.json(token)
      }
      else {
        res.status(403).send("Forbidden")
      }
    }
    else {
      res.status(403).send("Forbidden")
    }
  })
})*/

app.listen(3000)