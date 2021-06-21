const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer'); // to file uploads
const path = require('path');
const { graphqlHTTP } = require('express-graphql');

const mongoDbConnect = require('./db/mongoDbConnect');
const { fileStorage, fileFilter } = require('./middlewares/fileStorage.middleware');
const graphqlSchema = require('./graphql/schema');
const graphqlResolvers = require('./graphql/resolvers');
const authMiddleware = require('./middlewares/auth.middleware');

const app = express();

//Set CORS configuration to any client
app.use((req, res, next) => {
    // Set any origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Set HTTP methods allowed
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    // Set allowed headers
    res.setHeader('Access-Control-Allow-Headers', 'Content-type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Configure json parser middleware
app.use(express.json());
//Configure multer middleware
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
// Configure to serve static files inside 'images' folder
app.use('/images', express.static(path.join(__dirname, 'images')));
//Configure authentication middleware
app.use(authMiddleware);
//GraphQl Configuration
app.use(
    '/graphql',
    graphqlHTTP({
        schema: graphqlSchema,
        rootValue: graphqlResolvers,
        graphiql: true,
        customFormatErrorFn(error) {
            if (!error.originalError) {
                return error;
            }
            const data = error.originalError.data;
            const message = error.message || 'An error ocurred!';
            const code = error.originalError.code;
            return { message, code, data };
        },
    })
);

//Global error handling
app.use((error, req, res, next) => {
    console.log(error);
    const { statusCode, message, data } = error || 500;
    res.status(statusCode).json({ message, data });
});

mongoose
    .connect(mongoDbConnect.dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        app.listen(8000);
        console.log(
            '\x1b[32m', // set green color
            '--------- Application is Running!!! ---------'
        );
        console.log('\x1b[0m');
    })
    .catch(err => console.log(err));
