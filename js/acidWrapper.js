import {ACID} from './acid.js'
import {GLWrapper} from './glWrapper.js'
import mainShader from "./shaders/main.js"
import vertexShader from "./shaders/vertex.js"
import helperShader from "./shaders/helper.js"

export class ACIDWrapper{
	#seed = 0
	#canvas = false
	#input = false
	#shaders = {}
	ACIDModule
	GL

	constructor(input,seed) {
    	this.#seed = seed || 0;
    	this.#canvas = document.createElement("canvas")
    	document.body.appendChild(this.#canvas)
    	this.#shaders.main = mainShader
    	this.#shaders.vertex = vertexShader
    	this.#shaders.helper = helperShader
    	this.#input = input
    	this.GL = new GLWrapper(this.#canvas,this.#shaders)
    	this.ACID = new ACID(this.#seed,this.GL)
    	this.#init()
  	}
  	#init(){
  		this.#input.addEventListener('input',this.#refresh.bind(this))
  		this.#refresh()
  	}
  	#refresh(){
      	let n = this.ACID.update(this.#input.innerText)
      	this.#shaders.main = this.#shaders.main.slice(0,this.#shaders.main.indexOf("gl_FragColor")) + "gl_FragColor =" + n + ";}"
      	this.GL.refresh(this.#shaders)
  	}
}