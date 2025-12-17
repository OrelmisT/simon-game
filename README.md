<p align="center">
  <img src="./public/simon-logo.png" width="150" alt="Yapper logo" />
</p>


# Simon Game Clone

A multi-page **Express** web application replicating the classic Simon game with interactive gameplay, a leaderboard, and user authentication.


## Tech Stack

* Node.js
* Express
* EJS
* bcrypt for password hashing
* NodeMailer for email-based password resets
* Sessions for user authentication


## Deployment

You can access the live deployed version of the application here:

[**View Simon Game Clone**](https://simon-game.fly.dev/)

* NOTE: This deployment may occasionally go down since it is running entirely using free tiers


## Prerequisites

* Node.js
* npm or yarn
* An SMTP email account for password reset emails


## Environment Variables

Create a `.env` file in the root of the project with the following:

```env
SALT_ROUNDS=<Number of bcrypt salt rounds>
PORT=<PORT>
SESSION_KEY=<Secret for express sessions>
NODE_MAILER_EMAIL=<email for password resets>
NODE_MAILER_PASSWORD=<password for password reset email>
NODE_MAILER_SECRET=<JWT secret for password reset links>
APP_DOMAIN=http://localhost:<PORT>
```

### Variable Descriptions

* **SALT_ROUNDS** – Number of rounds for bcrypt password hashing
* **PORT** – Port number the Express server will listen on
* **SESSION_KEY** – Secret used to sign Express sessions
* **NODE_MAILER_EMAIL** – Email used to send password reset links
* **NODE_MAILER_PASSWORD** – Password for the above email account
* **NODE_MAILER_SECRET** – JWT secret for generating secure password reset tokens
* **APP_DOMAIN** – Domain of the app (used for constructing password reset links)


## Running the Application Locally

### 1. Install Dependencies

```bash
npm install
```


### 2. Start the Server

```bash
npm run dev
```

The application will be available at:

```
http://localhost:<PORT>
```


