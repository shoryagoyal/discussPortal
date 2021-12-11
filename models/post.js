const express = require('express');
const mongoose = require('mongoose');
const User = require('./user');
const Comment = require('./comment');

const postSchema = new mongoose.Schema({
    title:{
        type: String, 
        required: true,
    },
    content: String, 
    upvotes:[
        {
            type: mongoose.Schema.Types.ObjectId, 
            ref:'User',
        }
    ],
    downvotes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
    author:{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required:true,
    },
    comments:[
        {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Comment',
        }
    ], 
    postingDate:{
        type: String, 
        req: true,
    },
});
const Post = mongoose.model('Post',postSchema);
module.exports = Post;