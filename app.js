import express from 'express'
import cors from 'cors'
import path, {dirname} from 'path'
import { fileURLToPath } from 'url'
import { Client } from 'pg'
import bcrypt from 'bcrypt'
import config from './config.js'
import session from 'express-session'
import cookieParser from 'cookie-parser'


const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({
    secret: config.SESSION_KEY,
    resave: false,
    rolling: true,
    saveUninitialized: false,
    cookie: {httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 365, name:'user_session' }
}))



const db = new Client({
    connectionString:config.DB_CONNECTION_STRING
})
db.connect()

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

    console.log('account does not already exist')
    try{
        // create the new account
        console.log('wepa')
        console.log(`password: ${password}`)
        console.log(`saltRounds: ${config.SALT_ROUNDS}`)
        const encryptedPassword  =  await bcrypt.hash(password, parseInt(config.SALT_ROUNDS))
        console.log(`encrypted password: ${encryptedPassword}`)
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

    console.log(`email: ${email}`)
    console.log(`password: ${password}`)
   

    const response = await db.query('select * from accounts where email = $1', [email])
    if(response.rowCount == 0 || !(await bcrypt.compare(password, response.rows[0].password))){
        res.render('login.ejs', {'error_message':'Incorrect email or password'})
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

    console.log(userScores.rows)


    res.render('leaderboard.ejs', {userScores:userScores.rows})
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
