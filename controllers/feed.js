const fs = require('fs');
const path = require('path');

const {validationResult} = require('express-validator');

const io = require('../socket');
const Post = require('../models/post');
const User = require('../models/user');
const user = require('../models/user');

exports.getPosts = async (req , res , next) => {
    const currentPage = req.query.page || 1;
    const perPage=2;
    try{
        const totalItems = await Post.find().countDocuments();
        const posts = await Post.find()
                    .populate('creator')
                    .sort({created_at : -1})
                    .skip((currentPage-1) * perPage)
                    .limit(perPage);
        if (!posts) {
            const error = new Error('no post exist in website!');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            message : 'fetched Posts!' , 
            posts : posts , 
            totalItems : totalItems
        });
    } catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    };


}

exports.createPost = (req , res , next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('validation failed! Entered data is incorrect!');
        error.statusCode = 422;
        throw error;
    }
    
    if (!req.file) {
        const error = new Error('No image provided.');
        error.statusCode = 422;
        throw error;
    }
    const imageUrl = req.file.path;
    const title = req.body.title;
    const content = req.body.content;
    let creator;
    const post = new Post({
        title : title ,
        content : content , 
        imageUrl : imageUrl , 
        creator : req.userId
    })
    post
        .save()
        .then(result => {
            return User.findById(req.userId);
        })
        .then(user => {
            creator = user;
            user.posts.push(post);
            return user.save();
        })
        .then(result => {
            io.getIO().emit('posts' , {
                action : 'create' , 
                post : {...post._doc , creator : {
                                            _id : req.userId , 
                                            name : user.name}}
            });
            res.status(200).json({
                message : 'Post created successfully!' ,
                post : post ,
                creator : {_id : creator._id , name : creator.name}
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
    
 }

 exports.getPost = (req,res,next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('post does not exist!');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                message : 'post fetched!' , 
                post : post
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
 }

exports.postUpdate = (req , res , next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed,entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if (req.file) {
        imageUrl = req.file.path;
    }
    if (!imageUrl) {
        const error = new Error('No image provided.');
        error.statusCode = 422;
        throw error;
    }

    Post.findById(postId).populate('creator')
        .then(post => {
            if (!post) {
                const error = new Error('post does not exist!');
                error.statusCode = 404;
                throw error;
            }
            if (post.creator._id.toString() !== req.userId) {
                const error = new Error('Not authorized!');
                error.statusCode = 403;
                throw error;
            }
            if (imageUrl !== post.imageUrl) {
                clearImage(post.imageUrl);
            }
            post.title = title;
            post.content = content;
            post.imageUrl = imageUrl;
            return post.save();
        })
        .then(result => {
            io.getIO().emit('posts', {action : 'update' , post : result });
            res.status(200).json({
                message : 'Post updated!' , 
                post : result
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;

    Post.findById(postId)
        .then(post => {

            if (!post) {
                const error = new Error('post does not exist!');
                error.statusCode = 404;
                throw error;
            }
            if (post.creator.toString() !== req.userId) {
                const error = new Error('Not authorized!');
                error.statusCode = 403;
                throw error;
            }
            clearImage(post.imageUrl);
            return Post.findByIdAndDelete(postId);
        })
        .then(result => {
            return User.findById(req.userId);
        })
        .then(user => {
            user.posts.pull(postId);
            return user.save();
        })
        .then(result => {
            io.getIO().emit('posts' , {action : 'delete' , post : postId});
            res.status(200).json({
                message : 'Post deleted!' , 
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

const clearImage = filePath => {
    filePath = path.join(__dirname , '..' , filePath);
    fs.unlink(filePath , err => console.log(err) );
}