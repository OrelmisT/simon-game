import express from 'express'
import cors from 'cors'
import path, {dirname} from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcrypt'
import config from './config/config.js'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import { RedisStore } from 'connect-redis'
import db from './config/db.js'
import redisClient from './config/redis.js'
import mailer from './config/nodemailer.js'
import jwt from 'jsonwebtoken'


const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({
    store: new RedisStore({client: redisClient, prefix:'simon-game:'}),
    secret: config.SESSION_KEY,
    resave: false,
    rolling: true,
    saveUninitialized: false,
    cookie: {httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 365, name:'user_session' }
}))



app.get('/', (req, res) =>{

    res.render('index.ejs', {"username": req.session.user ? req.session.user.username : undefined})
    // res.sendFile(__dirname + '/pages/index.html')
})


app.post('/sign_up', async (req, res) =>{
    const {username, email, password} = req.body

    // check if username or email already exists
    const existsResponse =  await db.query('select * from accounts where username = $1 or email = $2', [username, email])
    if(existsResponse.rowCount > 0){
        return res.render('signup.ejs', {"error_message": "An account with this username or email already exists"})
    }

    try{
        // create the new account
        
        const encryptedPassword  =  await bcrypt.hash(password, parseInt(config.SALT_ROUNDS))
        const response = await db.query('insert into accounts (username, email, password) values ($1, $2, $3) returning *', [username, email, encryptedPassword])
        const newUser = response.rows[0]
        req.session.user = {username, email, id: newUser.id}
        res.status(201).redirect('/')
    } catch(err){
        res.render('signup.ejs', {"error_message": "Something went wrong while trying to create your account"})
    }

})


app.get('/sign_in', (req, res) => {

    if (req.session.user){
       return res.redirect('/')
    }
    res.render('login.ejs')
})


app.post('/sign_in', async (req, res) => {
    if (req.session.user){
        return res.redirect('/')
    }

    const {email, password} = req.body

   

    const response = await db.query('select * from accounts where email = $1', [email])
    if(response.rowCount == 0 || !(await bcrypt.compare(password, response.rows[0].password))){
        res.render('login.ejs', {'error_message':'Incorrect email or password. Try again.'})
        return
    } 

    const user = response.rows[0]

    req.session.user = {username:user.username, email, id: user.id}
    return res.redirect('/')
})


app.get('/sign_up', (req, res) => {
    if (req.session.user){
        return res.redirect('/')
    }
    res.render('signup.ejs')
})


app.get('/leaderboard', async (req, res) => {


    const userScores = await db.query('select accounts.username as username, user_scores.score as score from accounts join user_scores on accounts.id = user_scores.user_id order by user_scores.score desc limit 5')

    if(req.session.user){
        const score_res = await db.query('select * from user_scores where user_id = $1', [req.session.user.id])
        if(score_res.rowCount > 0){
            const personalBest = score_res.rows[0].score
            return res.render('leaderboard.ejs', {userScores:userScores.rows, personalBest})
        }
        else{
             return res.render('leaderboard.ejs', {userScores:userScores.rows, personalBest:0})
        }
    }

    return res.render('leaderboard.ejs', {userScores:userScores.rows})
})


app.post('/sign_out', (req, res) => {
    req.session.destroy((err) => {
        if(err){
            return res.sendStatus(500)

        }
        else{
            res.clearCookie('user_session').sendStatus(204)
        }

    })
})



app.post('/submit_score', async (req, res) => {
    if(!req.session.user){
        return res.sendStatus(401)
    }
    const user = req.session.user
    const score = req.body.score

    const prev_user_best = await db.query('select * from user_scores where user_id = $1', [req.session.user.id])
    if(prev_user_best.rowCount === 0){
        // insert new score for user
        await db.query('insert into user_scores(user_id, score) values ($1, $2)', [user.id, score])
        return res.sendStatus(201)
    }
    else if (prev_user_best.rows[0].score < score){
        await db.query('update user_scores set score = $1 where user_id = $2', [score, req.session.user.id])
        return res.sendStatus(200)
    }
    else{
        return res.sendStatus(200)
    }

})



app.get('/password_reset', (req, res) => {
    
    const token = req.query.token
    try{

        const decoded = jwt.verify(token, config.NODE_MAILER_SECRET)
        const email = decoded.email
        res.render('reset.ejs', {email})

        
    }catch(e){
        res.render('reset.ejs', {invalid_link_msg:'Invalid or expired reset link.'})
    }


})


app.post('/password_reset', async (req, res) =>{
    
    const {email, password} = req.body

    try{


        const encryptedPassword =  await bcrypt.hash(password, config.SALT_ROUNDS)
        await db.query('update accounts set password = $1 where email = $2', [encryptedPassword, email])
        return res.render('reset.ejs', {email, msg:"Your password was successfully reset. You may now login in with your new credentials."})


    }catch(e){
        console.log(e)
        return res.render('reset.ejs', {email, error_msg:"Something went wrong. Try again later."})

    }


})


app.get('/password_reset_request', (req, res) =>{

    res.render('request_reset.ejs')
})


app.post('/password_reset_request', async (req, res) =>{

    const email = req.body.email
    
    // verify that account with email exists
    const response = await db.query('select * from accounts where email = $1', [req.body.email])
    if(response.rowCount === 0){
        return res.render('request_reset.ejs', {"msg":"A reset link has been sent to your inbox if an account with this email exists"})
    }

    // create reset token
    const token = jwt.sign({email}, config.NODE_MAILER_SECRET, {expiresIn:'15m'})


    try{

        await mailer.sendMail({
  from: `"Simon Game Clone" <${config.NODE_MAILER_EMAIL}>`,
  to: email,
  subject: "Password Reset Link",
  html: `
    <div style="background-color:#222; color:white; font-family: 'Arial Black', Gadget, sans-serif; padding:30px; text-align:center;">
        <!-- Logo spot -->
        <div style="margin-bottom:20px;">
        <img src="cid:simonlogo" alt="Simon Logo" style="max-width:120px;">
        </div>

        <h1 style="font-size:32px; letter-spacing:2px; margin-bottom:10px;">SIMON</h1>
        <p style="font-size:14px; color:#ccc; margin-top:-10px; margin-bottom:30px;">The Memory Game</p>

        <h2 style="font-size:22px; margin-bottom:20px;">Password Reset</h2>
        <p style="font-size:16px; margin-bottom:30px;">Click the button below to reset your password:</p>

        <a href="${config.APP_DOMAIN}/password_reset?token=${token}" style="display:inline-block; background:linear-gradient(90deg, #ff0000, #00ff00, #0000ff, #ffff00); 
        color:#fff; text-decoration:none; font-weight:bold; padding:15px 30px; border-radius:8px;">
        Reset Password
        </a>

        <p style="margin-top:40px; font-size:12px; color:#777;">
        If you didn’t request this, you can safely ignore this email.
        </p>

        <p style="margin-top:20px; font-size:11px; color:#555;">
        &copy; ${new Date().getFullYear()} Simon Game Clone
        </p>
    </div>
    `,
    attachments: [
        {
        filename: "logo.png",
        path: __dirname + "/public/simon-logo.png", // adjust path to your logo in project root
        cid: "simonlogo" // same as in the <img src="cid:simonlogo">
        }
    ]
    })


        res.render('request_reset.ejs', {"msg": "A reset link has been sent to your inbox if an account with this email exists."})
        
    }catch(error){
        console.log(error)
        return res.render('request_reset.ejs', {"error_msg": "Something went wrong while creating your reset link. Please try again later. "})
    }
    

})



app.listen(config.PORT, async () => {

   

    // setup database tables if they don't exist
    const usersTableExists = await db.query("select exists(select * from information_schema.tables where table_name = 'accounts') ")
    if(!usersTableExists.rows[0].exists){
        console.log("Creating accounts table")
        await db.query("create table accounts (id serial primary key, username varchar(255) unique not null, email varchar(255) unique not null, password varchar(255) not null)")
    }


    const userScoreTableExists = await db.query("select exists(select * from information_schema.tables where table_name = 'user_scores')")
    if (!userScoreTableExists.rows[0].exists){
        console.log("Creating user score table")
        await db.query("create table user_scores (id serial primary key, user_id INT REFERENCES accounts(id) ON DELETE CASCADE, score INT not null)")
    }


    console.log(`App running at http://localhost:${config.PORT}`)
})
