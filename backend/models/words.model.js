const mongoose = require('mongoose');
const Schema = mongoose.Schema

const wordsSchema = new Schema({
    type: {
        type: String
        , required: [true]
        , unique: true
        , trim: true
    },
   names: [String]
})

const Word = mongoose.model('Word', wordsSchema);

module.exports = Word;
