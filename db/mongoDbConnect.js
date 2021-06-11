const dotenv = require('dotenv');
dotenv.config();

let _db;

const mongoAtlasDbUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gmc3b.mongodb.net/messages?retryWrites=true&w=majority`;

const getDb = () => {
    if (_db) {
        return _db;
    }

    throw 'No database found!';
};

exports.dbUrl = mongoAtlasDbUrl;
exports.getDb = getDb;
