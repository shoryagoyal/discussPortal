// Mongo db start command :- "C:\Program Files\MongoDB\Server\5.0\bin\mongo.exe"
// snakdown :- https://snackdown.codechef.com/registration?ref=shoryagoyal18

// TODO: Implement bookmark feature 

// ! There is a error in user total like count

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
const dbUrl = process.env.DB_URL;  // 'mongodb://localhost:27017/discussPortal'
let errorMessage = false;

function getCurrentDate(){
    const currentDate = new Date();
        const day = currentDate.getDate();
        const month = currentDate.getMonth(); 
        const year = currentDate.getFullYear();
        const monthArray = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return day+" "+monthArray[month]+" "+year;
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
    res.locals.userDetails = req.session.userDetails;   
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

app.post('/user/newUser',async (req,res) => {
    const {name,password,username} = req.body; 
    const hash = await bcrypt.hash(password,13);
    const newUser = new User({
        name: name, 
        password : hash, 
        username: username,
    }); 
    await newUser.save();
    req.session.userDetails = newUser._id; 
    res.locals.userDetails = newUser._id; 
    res.redirect(`/user/${newUser.username}/userDetails`);
});

app.get('/user/login',(req,res) => {
    if(req.session.userDetails) res.redirect('/home');
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
            req.session.userDetails = user._id; 
            res.locals.userDetails = user._id;
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
    /* Nested population example */
    const post = await Post.findById(postId).populate('author').populate({
        path:'comments', 
        populate:{
            path:'author',
        }
    })
    res.render('post/postDetail',{post});
}); 

app.get('/post/newPost',(req,res)=>{
       res.render('post/newPost');
});

app.post('/post/newPost',async (req,res) => {
    if(!req.session.userDetails) res.redirect('/user/login');
    else{
        const {content,title} = req.body; 
        const {userDetails} = req.session;
        const user = await User.findById(userDetails);
        const date = "Posted on "+getCurrentDate();
        const newPost = new Post({
            title: title,
            content: content, 
            author :userDetails, 
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
    if(!req.session.userDetails) res.redirect(`/user/login`);
    else{
        const {userDetails} = req.session;
        if(post.upvotes.includes(userDetails._id)) res.send("already upvoted");
        else{
            if(post.downvotes.includes(userDetails._id)){
                const index = post.downvotes.indexOf(userDetails._id);
                post.downvotes.splice(index,1);
            }
            post.upvotes.push(userDetails._id);
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
    if(!req.session.userDetails) res.redirect(`/user/login`);
    else{
        const {userDetails} = req.session;
        if(post.downvotes.includes(userDetails._id)) res.send("already downvoted");
        else{
            if(post.upvotes.includes(userDetails._id)){
                const index = post.upvotes.indexOf(userDetails._id);
                post.upvotes.splice(index,1);
            }
            post.downvotes.push(userDetails._id);
            await post.save();
            // res.send("will downvotee "+post);
            res.redirect(`/post/${postId}/postDetails`);
        }
    }
});  

app.get('/post/:postId/edit',async (req,res) => {
    const post = await Post.findById(req.params.postId);
    res.render('post/editPost',{post});
}); 

app.put('/post/:postId/edit',async (req,res) => {
    if(!req.session.userDetails) res.render('/user/login');
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
    if(!req.session.userDetails) res.redirect('/user/login');
    else{
        const {postId} = req.params; 
        const {userDetails} = req.session;
        const user = await User.findById(userDetails);
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

app.listen('3000',()=>{
    console.log("connected to the server");
});