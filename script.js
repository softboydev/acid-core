import {ACIDWrapper} from './js/acidWrapper.js'

window.addEventListener('DOMContentLoaded',function(){
  const input = document.getElementById('input')
  input.addEventListener("input",function(e){
    e.preventDefault()
  })
  new ACIDWrapper(input)
})