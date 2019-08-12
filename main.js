const sql = require('mssql')
const express = require('express')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const jwtdecode = require('jwt-decode')
const { Parser } = require('json2csv');

const app = express()
app.use(express.urlencoded({extended: true})); 
app.use(express.json());   

const config = {
  user: 'sa',
  password: '@sm2sm2Programad0res',
  server: "192.168.1.110",
  database: 'bd_encuestas',
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

app.get('/csv', async (req, res) => {
  const fields = ['field1', 'field2', 'field3'];
  const opts = { fields };
  const myData = [{"field1":1000, "field2":10, "field3":100},{"field1":100, "field2":1000, "field3":1}]
  try {
    const parser = new Parser(opts);
    const csv = parser.parse(myData);
    console.log(csv);
  } catch (err) {
    console.error(err);
  }
  let query = `SELECT * FROM respuestas`;
  await pool1Connect; // ensures that the pool has been created
  try {
    const request = pool1.request()
    const results = await request.query(query)
    res.send(results.recordset)
  } catch (err) {
    console.error('SQL error', err);
    res.send("Error")
  }
})

app.get('/login', async (req, res) => {
  let {username, password} = req.query
  let query = `SELECT * FROM users WHERE username = '${username}'`;
  await pool1Connect; // ensures that the pool has been created
  try {
    const request = pool1.request()
    const results = await request.query(query)
    if (results.recordset.length !== 0) {
      const user = results.recordset[0]
      const hashBool = bcrypt.compareSync(password, user.password)
      if (hashBool) {
        let token = jwt.sign({
          ID: user.ID,
          nombre: user.nombre,
          email: user.email,
          username: user.username,
        }, user.password)
        res.json(token)
      }
      else {
        res.status(403).send("Forbidden")
      }
    }
    else {
      res.status(403).send("Forbidden")
    }
  } catch (err) {
    console.error('SQL error', err);
    res.send("Error")
  }
})

app.get("/encuestas", async (req, res) => {
  let { token } = req.query
  let username = jwtdecode(token).username
  let queryToken = `SELECT * FROM users WHERE username = '${username}'`;
  let queryIfSuccess = `SELECT t1.ID, t1.Imagen, t1.Color, t1.Titulo, t1.Modificada, t1.Preguntas, COALESCE(t2.Total, 0) AS Total
  FROM
  (SELECT ID, Imagen, Color, Titulo, Modificada, Preguntas FROM EncuestasJSON GROUP BY ID, Imagen, Color, Titulo, Modificada, Preguntas) t1
  LEFT JOIN
  (SELECT ID, COUNT(respuestas.IDI) AS 'Total' FROM EncuestasJSON
  CROSS APPLY OPENJSON (Respuestas)
  WITH (IDI varchar(50) '$.ID') AS respuestas
  GROUP BY ID) t2
  ON t1.ID = t2.ID`;
  await pool1Connect;
  try {
    const request = pool1.request()
    const resultsToken = await request.query(queryToken)
    if (resultsToken.recordset.length !== 0) {
      jwt.verify(token, resultsToken.recordset[0].password, async (err, decoded) => {
        if (decoded !== undefined) {
          let resultsIfSuccess =  await request.query(queryIfSuccess)
          res.send(resultsIfSuccess.recordset)
        } else {
          res.status(403).send("Forbidden")
        }
      })
    }
    else {
      res.status(403).send("Forbidden")
    }
  } catch (err) {
    console.error('SQL error', err);
    res.send("Error")
  }
})

/*app.get("/preguntas", async (req, res) => {
  let { token, ID } = req.query
  let username = jwtdecode(token).username
  let queryToken = `SELECT * FROM users WHERE username = '${username}'`;
  let queryIfSuccess = `SELECT IDPregunta, Activo, TituloPregunta, Tipo, Opciones
  FROM EncuestasJSON
  CROSS APPLY OPENJSON(Preguntas)
  WITH (   
    IDPregunta varchar(50) '$.ID',
    Activo nvarchar(max) '$.Activo',
    TituloPregunta nvarchar(max) '$.Titulo',
    Tipo nvarchar(max) '$.Tipo',
    Opciones nvarchar(max) '$.Opciones' as JSON
   ) WHERE ID = '${ID}'`;
  await pool1Connect;
  try {
    const request = pool1.request()
    const resultsToken = await request.query(queryToken)
    if (resultsToken.recordset.length !== 0) {
      jwt.verify(token, resultsToken.recordset[0].password, async (err, decoded) => {
        if (decoded !== undefined) {
          let resultsIfSuccess = await request.query(queryIfSuccess)
          resultsIfSuccess.recordset = resultsIfSuccess.recordset.map(pregunta => {
            pregunta.Opciones = JSON.parse(pregunta.Opciones)
            return(
              pregunta
            )
          })
          res.send(resultsIfSuccess.recordset)
        } else {
          res.status(403).send("Forbidden")
        }
      })
    }
    else {
      res.status(403).send("Forbidden")
    }
  } catch (err) {
    console.error('SQL error', err);
    res.send("Error")
  }
})*/

app.post("/enviarRespuesta", async (req, res) => {
  let { token, ID, newJsonAnswer } = req.body
  console.log(newJsonAnswer)
  let username = jwtdecode(token).username
  let queryToken = `SELECT * FROM users WHERE username = '${username}'`;
  let queryIfSuccess = `UPDATE E
  SET E.Respuestas = JSON_MODIFY(E.Respuestas, 'append $', JSON_QUERY(N'
  ${newJsonAnswer}'))
  FROM EncuestasJSON as E
  WHERE ID = '${ID}'`;
  await pool1Connect;
  try {
    const request = pool1.request()
    const resultsToken = await request.query(queryToken)
    if (resultsToken.recordset.length !== 0) {
      jwt.verify(token, resultsToken.recordset[0].password, async (err, decoded) => {
        if (decoded !== undefined) {
          let resultsIfSuccess = await request.query(queryIfSuccess)
          console.log(resultsIfSuccess)
          res.send(true)
        } else {
          res.status(403).send("Forbidden")
        }
      })
    }
    else {
      res.status(403).send("Forbidden")
    }
  } catch (err) {
    console.error('SQL error', err);
    res.send("Error")
  }
})

/*app.get('/loginWithToken', async (req, res) => {
  let { token } = req.query
  let username = jwtdecode(token).username
  let query = `SELECT * FROM users WHERE username = '${username}'`;
  await pool1Connect;
  try {
    const request = pool1.request()
    const results = await request.query(query)
    if (results.recordset.length !== 0) {
      jwt.verify(token, results.recordset[0].password, (err, decoded) => {
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
  } catch (err) {
    console.error('SQL error', err);
    res.send("Error")
  }
})*/

app.listen(3000)