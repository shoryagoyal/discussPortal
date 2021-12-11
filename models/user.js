const mongoose = require('mongoose');
const Comment = require('./comment');
const Post = require('./post');

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/discussPortal');
}

const userSchema = new mongoose.Schema({
    name :{
        type: String, 
        required: true,
    },
    postsCreated:[
        {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Post'
        }
    ], 
    comments:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Comment',
        }
    ], 
    password:{
        type: String, 
        required: true,
    }, 
    username : {
        type: String,  
        required: true,
    }, 
    bookmarkedPost:[
        {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Post',
        }
    ]
});  


const User = mongoose.model('User',userSchema);

module.exports = User;