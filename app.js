const express= require('express');
const path = require('path');
const bodyParser = require('body-parser');
const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
const mongoose = require('mongoose');
const multer = require('multer');
const socket = require("./socket");

const app = express();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure the images directory is correctly referenced relative to the project folder
        cb(null, path.normalize('images')); // Use the relative path 'images'
    },
    filename: (req, file, cb) => {
        const timestamp = new Date().toISOString().replace(/:/g, '-'); // Remove colons and replace them with dashes
        const safeFilename = file.originalname.replace(/\s+/g, '_'); // Replace spaces with underscores
        const fullFilename = `${timestamp}-${safeFilename}`;
        
        // Ensure the filename is correctly constructed (relative path only)
        cb(null, fullFilename);
    }
});


const fileFilter = (req , file , cb) => {
    if (file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    )
    {
        cb(null , true);
    } else {
        cb(null , false);
    }
}
//app.use(bodyParser.urlencoded()); //x-www-form-urlencoded <form>

app.use(bodyParser.json());


// Apply multer middleware for file uploading
app.use(multer({ storage: fileStorage , fileFilter : fileFilter }).single('image'));

// Serve static files using forward slashes in paths (even on Windows)
app.use('/images', express.static(path.join(__dirname, 'images')));


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed/', feedRoutes);
app.use('/auth/', authRoutes);

app.use((error,req,res,next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message : message , data : data});
})

mongoose.connect(
    'mongodb+srv://UserReadWrite:TcaDJEQnQYgn8TTC@cluster0.pdry4.mongodb.net/messages?retryWrites=true&w=majority&appName=Cluster0'
)
    .then(result => {
        const server = require("http").createServer(app);
        const io = socket.init(server); 
        server.listen(8080, () => {
            console.log("Server is running on port 8080");
          });
        io.on("connection", (socket) => {
            console.log("Client connected!");
          });
    })
    .catch(err => console.log(err));

