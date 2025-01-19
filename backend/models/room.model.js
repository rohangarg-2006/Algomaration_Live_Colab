const mongoose = require('mongoose');
const Schema = mongoose.Schema


const roomSchema = new Schema({
    name: {
        type: String
        , required: [true, 'input room name']
        , unique: true
        , trim: true
    },
    code: {
        type: String
        , requried: true
        , unique: true
        , trim: true
    }
    , master: {
        type: String,
        required: true
    }
    , users: [String]
    , playerCount: { type: Number }
    , roomType: {type:String}
    , slaves: [String]
})

const Room = mongoose.model('Room', roomSchema)

module.exports = Room
