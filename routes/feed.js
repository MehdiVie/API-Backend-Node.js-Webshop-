const express= require('express');
const {body} = require('express-validator');

const feedCotroller = require('../controllers/feed')

const router = express.Router();

router.get('/posts' , feedCotroller.getPosts );

router.post('/post' , 
    [
    body('title')
        .trim()
        .isLength({min : 5}),
    body('content')
        .trim()
        .isLength({min : 5})
    ],
    feedCotroller.createPost );

router.get('/post/:postId' , feedCotroller.getPost);

router.put('/post/:postId', 
    [
    body('title')
        .trim()
        .isLength({min : 5}),
    body('content')
        .trim()
        .isLength({min : 5})
    ],
    feedCotroller.postUpdate);

router.delete('/post/:postId' , feedCotroller.deletePost);

module.exports = router;