const mongoose = require('mongoose'); 
const Schema = mongoose.Schema;
const User = require('./user');
const commentSchema = new Schema({
    content:{
        type: String, 
        required: true,
    },
    author:{
        type: Schema.Types.ObjectId, 
        required: true,
        ref: 'User',
    }, 
    date:{ 
        type : String, 
        required: true,
    }
});

const Comment = mongoose.model('Comment',commentSchema);

module.exports = Comment;