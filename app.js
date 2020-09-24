//packages
const express = require("express");
const bodyParser = require("body-parser");
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride  = require('method-override');
const path = require('path');
const crypto = require('crypto');
const mongoose = require("mongoose");

//use express
const app = express();
app.use(bodyParser.json());
app.use(methodOverride('_method'));
//set view with ejs
app.set('view engine', 'ejs');

//set database with mongodb
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://endergottipati:imgboard@cluster0.wdjoz.mongodb.net/imgboard?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});

const conn = mongoose.createConnection(uri);

let gfs;

conn.once('open', ()=>{
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});



const storage = new GridFsStorage({
  url: uri,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

//home route
app.get('/', (req,res) => {
  //show all image files
  gfs.files.find().toArray((err, files)=>{
    if(!files || files.length === 0){
      res.render('index', {files: false});
    }
    else{
      files.map(file =>{
        if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){

          file.isImage = true;
        }
        else{
          file.isImage = false;
        }
      });
      res.render('index', {files: files});
    }
  });
});

//posting image files
app.post('/upload', upload.single('file'), (req, res) => {
  res.redirect('/');
});

//get image file
app.get('/image/:filename', (req, res)=>{
  gfs.files.findOne({filename: req.params.filename}, (err, file)=>{
    if(!file || file.length === 0){
      return res.status(404).json({
        err: 'no file exists'
      });
  }
  if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
  const readstream = gfs.createReadStream(file.filename);
  readstream.pipe(res);
}
});
});


//server
const port= process.env.port || 3000;
app.listen(port,function(){
console.log("Server up");
});
