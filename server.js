const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const https = require('https');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');


const app = express();

//const privateKey = fs.readFileSync('server.key');
//const cert = fs.readFileSync('server.cert');

const sequelize = require('./util/database');
const User = require('./models/user');
const Post = require('./models/post');

app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
})

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data, statusCode: status });
})

User.hasMany(Post, { foreignKey: 'creator', sourceKey: 'id' });
Post.belongsTo(User, { foreignKey: 'creator', targetKey: 'id' });
sequelize.sync().then(_ => {
  // const server = https.createServer({key: privateKey, cert: cert}, app).listen(process.env.PORT || 3000);
  const server = app.listen(process.env.PORT || 3000);
  const io = require('./socket').init(server);
  io.on('connection', socket => {
    console.log('Client connected');

  })
}).catch(err => console.log(err));

