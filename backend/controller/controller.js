require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require("../models/user.model.js");

const handleErrors = (error) => {
    console.log(error.message, error.code);
    let errors = { email: '', password: '', username: '' };

    if (error.message.includes('user validation failed')) {
        Object.values(error.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        });
    }

    if (error.code === 11000) {
        errors.email = 'That email is already registered';
    }

    return errors;
};

const maxAge = 1 * 24 * 60 * 60;
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: maxAge
    });
};

module.exports.signup_get = (req, res) => {
    res.render('signup');
};

module.exports.login_get = (req, res) => {
    res.render('login');
};

module.exports.signup_post = async (req, res) => {
    const { email, password, username } = req.body;
    try {
        if (!email || !password || !username) {
            throw new Error('All fields are required');
        }
        const user = await User.create({ email, password, username });
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.cookie('userName', username, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(201).json({ user: user._id });
    } catch (error) {
        const errors = handleErrors(error);
        res.status(400).json({ errors });
    }
};

module.exports.login_post = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }
        const user = await User.login(email, password);
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.cookie('userName', user.username, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(200).json({ user: user._id });
    } catch (error) {
        const errors = handleErrors(error);
        res.status(400).json({ errors });
    }
};

module.exports.logout_get = (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.cookie('userName', '', { maxAge: 1 });
    res.redirect('/');
};