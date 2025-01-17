// import axios from "axios"
const gameStates = {titleScreen:0, animation:1, play:2, gameOver:3}
let currentGameState = gameStates.titleScreen
let panelOrder = []
let playerClickIndex = 0
let roundNum = 1
const sounds = [
  new Audio("../audio/simonSound1.mp3"),
  new Audio("../audio/simonSound2.mp3"),
  new Audio("../audio/simonSound3.mp3"),
  new Audio("../audio/simonSound4.mp3"),
  new Audio("../audio/error.mp3")

]



for(let i = 0; i < 4; i++){
    $(`.c${i + 1}`).on('click', async() =>{
        if(currentGameState != gameStates.play){
            return
        }
        if(i + 1 === panelOrder[playerClickIndex]){
            $(`.c${i + 1}`).addClass('selected')
            const audio = sounds[panelOrder[playerClickIndex] - 1]
            audio.currentTime = 0
            audio.play()
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
        else{
            currentGameState = gameStates.animation
            $('body').css('background-color', 'red')
            $('.circle-container').css('background-color', 'red')
            sounds[4].play()
            await sleep(400)
            $('body').css('background-color', 'rgba(39, 39, 39, 1)')
            $('.circle-container').css('background-color','rgba(39, 39, 39, 1)')
            level = 1
            playerClickIndex = 0;
            $('h1').text('You are Die')

        }
        
    })
}

const playButton = document.querySelector('.play-button')

playButton.addEventListener('click', async()=>{
    currentGameState = gameStates.animation
    playButton.classList.add('gone')
    panelOrder= []
    await sleep(260)
    playRound(1)
})

const goBackButton = document.querySelector('.go-back')

goBackButton.addEventListener("click", ()=>{
  playButton.classList.remove('gone')
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
    $('h1').text(`Level ${level}`)
    const panelNum = chooseRandomPanel()
    panelOrder.push(panelNum)
    for(let i = 0; i < level; i ++){
        await sleep(280)
        $(`.c${panelOrder[i]}`).addClass('selected')
        const audio = sounds[panelOrder[i] - 1]
        audio.currentTime = 0
        audio.play()
        await sleep(280)
        $(`.c${panelOrder[i]}`).removeClass('selected')
    }
    currentGameState = gameStates.play
}