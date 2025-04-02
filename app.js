const express= require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const { graphqlHTTP } = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./Middleware/Auth');

const app = express();

const cors = require('cors');
const { schema } = require('./models/user');
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(auth);

app.use('/graphql' , graphqlHTTP({
    schema : graphqlSchema,
    rootValue : graphqlResolver,
    graphiql : true ,
    customFormatErrorFn(err) {
        if (!err.originalError) {
            return err;
        }
        const data = err.originalError.data;
        const message = err.message || 'An error occured!';
        const code = err.originalError.code || 500;
        return {message : message , status : code , data : data};    
    }
}));

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
    app.listen(8080);
})
.catch(err => console.log(err));

