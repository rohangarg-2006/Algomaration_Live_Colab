const express = require('express');
const cors = require("cors")
const cookieParser = require("cookie-parser")
// const cors = require('cors');

module.exports = (app) => {
    app.use(express.static('public'))
    app.use(express.static('models'))
    app.use(express.json())
    app.use(cookieParser())
    app.set('view engine', 'ejs')
    app.use(cors({ origin: "*" }))
};