// import axios from "axios"
let gameStates = {titleScreen:0, animation:1, play:2, gameOver:3}
const currentGameState = gameStates.titleScreen


const greenCircle = document.querySelector('.c1')
greenCircle.addEventListener("click", ()=>{
  alert('green')
})

const redCircle = document.querySelector('.c2')
redCircle.addEventListener("click", ()=>{
  alert('red')
})

const yellowCircle = document.querySelector('.c3')
yellowCircle.addEventListener("click", ()=>{
  alert('yellow')
})

const blueCircle = document.querySelector('.c4')
blueCircle.addEventListener("click", ()=>{
  alert('blue')
})

const playButton = document.querySelector('.play-button')

playButton.addEventListener('click', ()=>{
  playButton.classList.add('gone')
})

const goBackButton = document.querySelector('.go-back')

goBackButton.addEventListener("click", ()=>{
  playButton.classList.remove('gone')
})