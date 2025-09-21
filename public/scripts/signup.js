document.querySelector('.back-to-home-nav').addEventListener('click', ()=>{
    location.href = '/'
})


document.querySelector('form').addEventListener('submit', ()=>{
    const submit_button = document.querySelector('button')
    submit_button.setAttribute('disabled', 'true')
    submit_button.style.opacity = 0.5
})