const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/user'); 
const Comment = require('./models/comment');
const Post = require('./models/post');
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/discussPortal');
}




