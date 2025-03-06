const express = require('express');
const { body } = require('express-validator');
const User = require('../models/user');
const authCotroller = require('../controllers/auth');

const router = express.Router();

router.put('/signup' , 
    [
        body('email')
            .isEmail()
            .withMessage('Pls Enter a valid Email!')
            .custom((value , {req}) => {
                return User.findOne({email : value})
                    .then(userDoc => {
                        if (userDoc) {
                            return Promise.reject('Email already exists!');
                        }  
                    })
            })
            .normalizeEmail()
        ,
        body('name')
            .trim()
            .not()
            .isEmpty()
        ,
        body('password')
        .trim()
        .isLength({ min: 5 }) // Correct syntax
        .withMessage('Password must be at least 5 characters long')
        .isAlphanumeric()
        .withMessage('Password must be Alpahbet and Numbers.')

    ] , authCotroller.signup);

router.post('/login' , authCotroller.login);

module.exports = router;