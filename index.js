// Mongo db start command :- "C:\Program Files\MongoDB\Server\5.0\bin\mongo.exe"

if(process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/user');
const Comment = require('./models/comment');
const Post = require('./models/post');
const ejs = require('ejs');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const expressSession = require('express-session');
const methodOverride = require('method-override');
const { Console } = require('console');
const app = express();
const dbUrl = 'mongodb://localhost:27017/discussPortal'; //process.env.DB_URL;
const port = process.env.PORT || 3000;

let errorMessage = false;

function getCurrentDate(){
    const currentDate = new Date();
        const day = currentDate.getDate();
        const month = currentDate.getMonth(); 
        const year = currentDate.getFullYear();
        const monthArray = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return day+" "+monthArray[month]+" "+year;
} 

function validUsername(username) {
    for(char of username) {
        if((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || (char >= '0' && char <= '9')
         || char == '-' || char === '_') {

         }
         else return false; 
    }
    return true; 
} 

function validatePassword(password) {
    if(password.length < 8) return false; 
    let containNumber = false, containLetter = false; 
    for(char of password) {
        if(char >= '0' && char <= '9') containNumber = true;
        if((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')) containLetter = true; 
        if(char === ' ') return false;
    }
    if(!containNumber || !containLetter) return false; 
    return true; 
}

function userNameUsed(allUsers, username) {
    for(user of allUsers) {
        if(user.username === username) return true; 
    }
    return false;
}

const connectionParams={
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true 
}
mongoose.connect(dbUrl,connectionParams)
    .then( () => {
        console.log('Connected to database ')
    })
    .catch( (err) => {
        console.error(`Error connecting to the database. \n${err}`);
    });

app.use(cookieParser());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine','ejs'); 
// app.use(express.static(__dirname + '/public'));
app.use(expressSession({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
  }));

app.use((req,res,next) => {
    res.locals.userId = req.session.userId;   
    errorMessage = false;
    next();
});
app.use(express.urlencoded({extended: true}));
app.set('public', path.join(__dirname, 'public'));
app.use(methodOverride('_method'));
app.use(express.static('public'));

app.get('/home',(req,res) => {
    res.render('home');
});

app.get('/user/allUsers',async (req,res) => {
    const users = await User.find({});
    res.render('user/allUser',{users});
});

app.get('/user/:username/userDetails',async (req,res) => {
    // const id = req.params.id;
    const {username} = req.params; 
    const user = await User.findOne({username:username}).populate('postsCreated');  
    let totalLikes = 0; 
    for(let post of user.postsCreated){
        if(post.upvotes.length>=0) totalLikes+=post.upvotes.length;
    } 
    res.render('user/userDetail',{user,totalLikes});
});

app.get('/user/newUser',(req,res) => {
    res.render('user/newUser');
}); 

app.post('/user/newUser', async (req,res) => {
    const {name,password,username} = req.body; 
    const allUsers = await User.find({});   
    if(!validUsername(username)) res.send("The username must contain only letters, numbers, hyphens and underscores");  
    else if(!validatePassword(password)) res.send("Password must be 8 characters or more, needs at least one number and one letter and should not contain spaces");
    else if(userNameUsed(allUsers, username)) res.send("Userame already exist please take other username");  
    else {
        const hash = await bcrypt.hash(password,13);
        const newUser = new User({
            name: name, 
            password : hash, 
            username: username,
        }); 
        await newUser.save();
        req.session.userId = newUser._id; 
        res.locals.userId = newUser._id; 
        res.redirect(`/user/${newUser.username}/userDetails`);
    }
});

app.get('/user/login',(req,res) => {
    if(req.session.userId) res.redirect('/home');
    else res.render('user/login',{errorMessage});
}); 

app.post('/user/login',async (req,res) => {
    const {username,password} = req.body; 
    const user = await User.findOne({username: username});
    if(!user) {
        // res.send("enter valid name or password");
        errorMessage = true;
        res.render('user/login',{errorMessage});
    } 
    else{
        const compare = await bcrypt.compare(password,user.password);
        if(!compare) res.send("enter valid name or password");
        else{
            console.log(user);
            req.session.userId = user._id; 
            res.locals.userId = user._id;
            res.redirect(`/user/${user.username}/userDetails`);
        }
    }
}); 

app.post('/user/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/user/login');
});

app.get('/post/allPosts',async (req,res) => {
    const posts = await Post.find({}).populate('author');
    res.render('post/allPosts',{posts});
});

app.get('/post/:postId/postDetails',async (req,res) => {
    const {postId} = req.params; 
    const {userId} = req.session;
    const user = await User.findById(userId);
    let isBookmarked = false; 
    if(user) isBookmarked = (user.bookmarkedPost.indexOf(postId) === -1)?false:true;
    /* Nested population example */
    const post = await Post.findById(postId).populate('author').populate({
        path:'comments', 
        populate:{
            path:'author',
        }
    })
    res.render('post/postDetail',{post, isBookmarked});
}); 

app.get('/post/newPost',(req,res)=>{
       res.render('post/newPost');
});

app.post('/post/newPost',async (req,res) => {
    if(!req.session.userId) res.redirect('/user/login');
    else{
        const {content,title} = req.body; 
        const {userId} = req.session;
        const user = await User.findById(userId);
        const date = "Posted on "+getCurrentDate();
        const newPost = new Post({
            title: title,
            content: content, 
            author : userId, 
            postingDate: date,
        }); 
        user.postsCreated.push(newPost._id);
        const post = await newPost.save();
        const userP = await user.save();
        res.redirect('/post/'+newPost._id+'/postDetails');
    }
}); 

app.post('/post/:postId/postDetails/upvote',async (req,res) => {
    const {postId} = req.params;
    const post = await Post.findById(postId);
    if(!req.session.userId) res.redirect(`/user/login`);
    else{
        const {userId} = req.session;
        if(post.upvotes.indexOf(userId) !== -1) res.send("already upvoted");
        else{
            if(post.downvotes.indexOf(userId) !== -1){
                const index = post.downvotes.indexOf(userId);
                post.downvotes.splice(index,1);
            }
            post.upvotes.push(userId);
            const postCreator = await User.findById(post.author);
            await post.save();
            await postCreator.save();
            res.redirect(`/post/${postId}/postDetails`);
        }
    }
}); 

app.post('/post/:postId/postDetails/downvote',async (req,res) => {
    const {postId} = req.params;
    const post = await Post.findById(postId);
    if(!req.session.userId) res.redirect(`/user/login`);
    else{
        const {userId} = req.session;
        if(post.downvotes.indexOf(userId) !== -1) res.send("already downvoted");
        else{
            if(post.upvotes.indexOf(userId) !== -1){
                const index = post.upvotes.indexOf(userId);
                post.upvotes.splice(index,1);
            }
            post.downvotes.push(userId);
            await post.save();
            res.redirect(`/post/${postId}/postDetails`);
        }
    }
});   

app.post('/post/:postId/bookmark', async (req, res) => {
    console.log("hitted the route successfully");
    const {postId} = req.params;
    if(!req.session.userId) res.redirect('/user/login');
    else {
        const {userId} = req.session; 
        const user = await User.findById(userId);
        if(!user) res.send("No such user exist");
        else {
            if(user.bookmarkedPost.indexOf(postId) !== -1) res.send("already bookmarked why bookmark it again"); 
            else {
                user.bookmarkedPost.push(postId); 
                console.log(user); 
                await user.save();
                res.redirect(`/post/${postId}/postDetails`);
            } 
        }
    }
});

app.get('/post/:postId/edit',async (req,res) => {
    const post = await Post.findById(req.params.postId);
    res.render('post/editPost',{post});
}); 

app.put('/post/:postId/edit',async (req,res) => {
    if(!req.session.userId) res.render('/user/login');
    else{
        const {title,content} = req.body; 
        const {postId} = req.params;
        const post = await Post.findById(postId);
        post.title = title; 
        post.content = content; 
        // res.send(post);
        await post.save();
        res.redirect(`/post/${postId}/postDetails`);
    }
});


app.post('/comment/:postId/newComment',async (req,res)=>{
    if(!req.session.userId) res.redirect('/user/login');
    else{
        const {postId} = req.params; 
        const {userId} = req.session;
        const user = await User.findById(userId);
        const post = await Post.findById(postId);
        const content = req.body.commentContent;
        const date = "Answered on "+getCurrentDate();
        const newCommment = new Comment({
            content : content, 
            author: user._id,
            date: date,
        }); 
        post.comments.push(newCommment._id);
        user.comments.push(newCommment._id);
        await newCommment.save();
        await post.save();
        await user.save();
        res.redirect(`/post/${post._id}/postDetails`);
    }
});

app.listen(port,()=>{
    console.log("connected to the server");
});