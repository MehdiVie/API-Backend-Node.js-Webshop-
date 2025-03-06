const express= require('express');
const {body} = require('express-validator');

const feedCotroller = require('../controllers/feed');
const isAuth = require('../Middleware/is-Auth');


const router = express.Router();

router.get('/posts' , isAuth , feedCotroller.getPosts );

router.post('/post' , isAuth ,
    [
    body('title')
        .trim()
        .isLength({min : 5}),
    body('content')
        .trim()
        .isLength({min : 5})
    ],
    feedCotroller.createPost );

router.get('/post/:postId' ,isAuth , feedCotroller.getPost);

router.put('/post/:postId', isAuth ,
    [
    body('title')
        .trim()
        .isLength({min : 5}),
    body('content')
        .trim()
        .isLength({min : 5})
    ],
    feedCotroller.postUpdate);

router.delete('/post/:postId' ,isAuth , feedCotroller.deletePost);

module.exports = router;