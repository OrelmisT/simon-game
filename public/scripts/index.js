// import axios from "axios"
const gameStates = {titleScreen:0, animation:1, play:2, gameOver:3}
let currentGameState = gameStates.titleScreen
let panelOrder = []
let playerClickIndex = 0
let roundNum = 1
const sounds = [
  "../audio/simonSound1.mp3",
  "../audio/simonSound2.mp3",
  "../audio/simonSound3.mp3",
  "../audio/simonSound4.mp3",
"../audio/error.mp3"

]


const playAudio = (url)=>{
    const audio = new Audio(url)
    audio.play()
}




for(let i = 0; i < 4; i++){
    $(`.c${i + 1}`).on('click', async() =>{
        if(currentGameState != gameStates.play){
            return
        }
        //Clicked on correct panel
        if(i + 1 === panelOrder[playerClickIndex]){
            $(`.c${i + 1}`).addClass('selected')
            playAudio(sounds[panelOrder[playerClickIndex] - 1])
            currentGameState = gameStates.animation
            await sleep(280)
            $(`.c${i + 1}`).removeClass('selected')
            playerClickIndex += 1
            currentGameState = gameStates.play
            await sleep(280)
            if(playerClickIndex === panelOrder.length){
                roundNum += 1;
                playerClickIndex = 0
                playRound(roundNum)

            }

        }
        //clicked on incorrect panel
        else{
           
            fetch('/submit_score', {method:"POST", body:JSON.stringify({"score": roundNum - 1}), headers:{"Content-Type":'application/json'}, credentials:'include'})
            
            currentGameState = gameStates.animation
            $('body').css('background-color', 'red')
            $('.circle-container').css('background-color', 'red')
            playAudio(sounds[4])
            // sounds[4].play()
            await sleep(400)
            $('body').css('background-color', 'rgba(39, 39, 39, 1)')
            $('.circle-container').css('background-color','rgba(39, 39, 39, 1)')
            $('.fail-buttons').css('display', 'flex')
            level = 1
            playerClickIndex = 0;
            currentGameState = gameStates.gameOver

        }
        
    })
}

const playButton = document.querySelector('.play-button')

playButton.addEventListener('click', async()=>{
    $('.navigation-buttons').css('display', 'none')
    // document.querySelector('.navigation-buttons').style.display = 'none'
    $('.fail-buttons').css('display', 'flex')
    currentGameState = gameStates.animation
    playButton.classList.add('gone')
    panelOrder= []
    await sleep(600)
    playRound(1)
})

const goBackButton = document.querySelector('.go-back')

goBackButton.addEventListener("click", async()=>{
    // if(currentGameState !== gameStates.gameOver){
    //     return
    // }
    playButton.classList.remove('gone')
    currentGameState = gameStates.animation
    await sleep(260)
    $('h2').text('THE MEOMORY GAME')
    $('.navigation-buttons').css('display', 'flex')
    panelOrder = []
    playerClickIndex = 0
    roundNum = 1
    currentGameState = gameStates.titleScreen
    $('.fail-buttons').css('display', 'none')


})


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const chooseRandomPanel = ()=>{
    return Math.floor(Math.random() *4) + 1 
}



//play round next
const playRound = async (level)=>{
    currentGameState = gameStates.animation
    $('h2').text(`Level ${level}`)
    const panelNum = chooseRandomPanel()
    panelOrder.push(panelNum)
    for(let i = 0; i < level; i ++){
        await sleep(250)
        $(`.c${panelOrder[i]}`).addClass('selected')
        playAudio(sounds[panelOrder[i] - 1])
        // const audio = sounds[panelOrder[i] - 1]
        // audio.currentTime = 0
        // audio.play()
        await sleep(250)
        $(`.c${panelOrder[i]}`).removeClass('selected')
    }
    currentGameState = gameStates.play
}

const retryButton = $('.retry')
retryButton.on('click', ()=>{
    panelOrder = []
    playerClickIndex = 0
    roundNum = 1
    sleep(100)
    playRound(1)
})


// sign up button click
$('.login').click(()=>{
    window.location.href = '/sign_in'
})


$('.leaderboard').click(() => {
    window.location.href = '/leaderboard'
})


$('.logout').click(async() => {
    const response = await fetch('/sign_out', {method:"POST", credentials:'include'})
    if(response.status === 204){
        $('.logout').css('display', 'none')
        $('.login').css('display', 'block')
    }
    
})