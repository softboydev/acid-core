export class ACID{
	#seed = 0
	#glWrapper

	constructor(seed,glWrapper) {
    	this.#seed = seed || 0;
    	this.#glWrapper = glWrapper
    	this.#init()
  	}

	static LOP_NUMBERS = "0123456789"
	static HIP_NUMBERS = "abcdefghijklmnopqrstuvwxyz"
	static NUMBERS = this.LOP_NUMBERS + this.HIP_NUMBERS //represent a fixed value
	static OPERATORS = "ADTM" //are used to string together values
	static VALUES = "HJRXYZIU" //represent a dynamic value, treated like numbers
	static FUNCTIONS = "QSVIEKCPNOLGBWF"
	static CHARACTERS = this.OPERATORS + this.VALUES + this.FUNCTIONS
	static VALUE_FUNC = this.NUMBERS + this.VALUES
	static OP_CON = ["+","*","/","-"]
	static FNC_CON = ["SQUARE(","SINE(","TRIANGLE(","INVERT(","EXPAND(","COMPRESS(","CLOCK(","PLASMA(","SIMPLEX(","PERLIN(","LOWER(","BIGGER(","BITMAP(","WATER(","FRAME("]
	static MAX_ARG_PER_FNC = [1,1,1,1,1,1,1,1,1,2,2,1,1,1,1]

	static analyzeChar(c){
			c.value = false
		    c.numberOfArguments = 0
		    if(c.type == "NUMBER"){
		      v = c.subtype == "LOP" ? ACID.LOP_NUMBERS.indexOf(c.char) / (ACID.LOP_NUMBERS.length - 1) : ACID.HIP_NUMBERS.indexOf(c.char) / (ACID.HIP_NUMBERS.length - 1)
		      v = v == 1 ? "1.0" : v == 0 ? "0.0" : "" + v
		      c.value = v
		    }
		    else if(c.type == "CHARACTER"){
			      if(c.sub == "OPERATOR"){
			        c.value = ACID.OP_CON[ACID.OPERATORS.indexOf(c.char)]
			      }
			      else if(c.sub == "VALUE"){
			        c.value = c.char
			      }
			      else if(c.sub == "MAPPING"){
			        c.value = ACID.MAP_CON[ACID.MAPPINGS.indexOf(c.char)]
			        c.numberOfArguments = 1
			      }
			      else if(c.sub == "FUNCTION"){
			        c.value = ACID.FNC_CON[ACID.FUNCTIONS.indexOf(c.char)]
			        c.numberOfArguments = ACID.MAX_ARG_PER_FNC[ACID.FUNCTIONS.indexOf(c.char)]
			      }
		  	}
		  	return c
	}	
	static getTypeOfCharacter(char){
			if(char == " " ){
				return "END"
			}
			else if(this.NUMBERS.includes(char)){
				return "NUMBER"
			}
			else if(this.CHARACTERS.includes(char)){
				return "CHARACTER"
			}
			else{
				return "UNKNOWN"
			}
	}
	static getSubtypeOfCharacter(char){
			if(this.OPERATORS.includes(char)){
				return "OPERATOR"
			}
			else if (this.VALUES.includes(char)){
				return "VALUE"
			}
			else if(this.FUNCTIONS.includes(char)){
				return "FUNCTION"
			}
			else{
				return "UNKNOWN"
			}
	}
	static getSubtypeOfNumber(char){
			if(this.LOP_NUMBERS.includes(char)){
				return "LOP"
			}
			else{
				return "HIP"
			}
	} 

	
  	#init(){
  		this.update("")
  	}
  	update(string){
  		return this.#convertStringToShader(string)
  	}
  	#convertStringToShader(string){
	  	let lines = string.replaceAll("\n\n","\n").split("\n")
	    let words = lines.map((l) => l.split(' '))
	    let _lines = []
	    for(let l in words){
	    	let line = words[l]
		    if(
		      	!(line && line[0].charAt(0) == "#")
	      	){
	        	_lines.push(lines[l])
	      	}
	    }
	    lines = _lines
	    lines = lines.map((l) => l.split(""))
	    let bitmap = string.replaceAll("\n","").split("").map((c) => c == " " ? 0.0 : (c.charCodeAt(0) - 47) / 43)
	    this.#glWrapper.parameters.bitmap = new Float32Array(bitmap)
	    this.#glWrapper.parameters.bitmapSize = this.#glWrapper.parameters.bitmap.length
	    let RGB = [["0.0"],["0.0"],["0.0"]]
	    for(let l = 0; l < lines.length; l++){ 
	      let c = l % 4 
	      let brightness = Math.ceil((lines.length-l)/4) / Math.ceil(lines.length/4) 
	      brightness = Math.floor(brightness) == brightness ? brightness + ".0" : brightness
	      let line = lines[l]
	      if(line.length > 0){
	        let conv = this.#convertLineToShader(line) 
	        conv = conv ? conv + "*" + brightness : "0.0"
	        if(conv.length > 0){
	          if(c == 0){
	            RGB[0].push(conv)
	            RGB[1].push(conv)
	            RGB[2].push(conv)
	          }
	          else{
	              RGB[c-1].push(conv)
	          }
	        }
	      }
	    }
	    return "vec4(mod(" + RGB[0].join(" + ") + ",1.0001),mod(" + RGB[1].join(" + ") + ",1.0001),mod(" + RGB[2].join(" + ") + ",1.0001),1.0)"
  	}
  	#convertLineToShader(line){
  		let shader = ""
	    let currentlyOpenBrackets = 0
	    let argumentArray = []
	    let array = line.map((c) => this.#convertCharacterToShader(c))
	    array = array.filter((c) => c.type != "UNKNOWN")
	    for(let c = 0; c < array.length; c++){
	      let N = c == array.length - 1 ? false : array[c+1]
	      let P = c == 0 ? false : array[c-1]
	      let C = array[c]
	      if(C.type == "END"){
	        while(currentlyOpenBrackets > 0){
	          shader += ")"
	          currentlyOpenBrackets--
	        }
	        argumentArray = []
	      }
	      else if(C.func == "VALUE"){
	        let hasBeenAdded = false
	          if(P.sub == "OPERATOR" || P.sub == "FUNCTION" || !P || argumentArray.length > 0){ 
	            shader += C.value 
	            hasBeenAdded = true
	          }
	          if(N.sub != "OPERATOR"){
	            if(argumentArray.length > 0){
	              argumentArray[argumentArray.length-1] = argumentArray[argumentArray.length-1]-1
	              if(argumentArray[argumentArray.length-1] == 0){
	                while(argumentArray[argumentArray.length-1] == 0){
	                  shader += ")"
	                  currentlyOpenBrackets--
	                  argumentArray.pop()
	                  if(argumentArray.length > 0 && N && N.sub != "OPERATOR" && N.type != "END"){
	                    shader += ","
	                  }
	                  else if(argumentArray.length == 0 && N.type != "END"){
	                    while(currentlyOpenBrackets>0){
	                      shader += ")"
	                      currentlyOpenBrackets--
	                    }
	                  }
	                }
	              }
	              else if(N && N.type != "END"){
	                shader += ","
	              }
	            }
	          }
	          if((P.type == "NUMBER" || P.sub == "VALUE" || P.type == "END") && !hasBeenAdded ){ //when the previous char was a number as well add the value with a + operation
	            shader += "+" + C.value
	          }

	      }
	      else if(C.type == "CHARACTER"){
	        if(C.sub == "OPERATOR"){
	          if(C.sub == "OPERATOR" && P.sub == "OPERATOR" && N.sub == "OPERATOR"){
	            //nothing
	          }
	          else if(C.sub == "OPERATOR" && P.sub == "OPERATOR"){
	            if(N){
	              shader += "+1.0"
	              shader += C.value
	            }

	          }
	          else if(N && P && P.sub != "FUNCTION" && N.sub != "OPERATOR"){
	            shader += C.value
	          }
	        }
	        else if(C.sub == "FUNCTION"){
	            if(P.sub == "OPERATOR" || P.sub == "MAPPING" || P.sub == "FUNCTION" || !P || argumentArray.length > 0){ 
	              shader += C.value //add value to command
	            }
	            else if(P.type == "NUMBER" || P.sub == "VALUE" || P.type == "END" ){
	              shader += "+" + C.value
	            }
	            if(argumentArray.length > 0){
	              argumentArray[argumentArray.length-1] = argumentArray[argumentArray.length-1]-1
	              if(argumentArray[argumentArray.length-1] == 0){
	                argumentArray.pop()
	              }
	            }
	            argumentArray.push(C.arguments)
	            currentlyOpenBrackets++
	        }
	      }
	    }
	    while(currentlyOpenBrackets>0){
	      shader += ")"
	      currentlyOpenBrackets--
	    }
	    shader = shader.
	    replaceAll("SIMPLEX(","SIMPLEX(_XY,").replaceAll("SIMPLEX(_XY,)","SIMPLEX(_XY)").replaceAll("SIMPLEX(",() => "SIMPLEX(SIMPLEX(" + this.#seed++ + ".0),").
	    replaceAll("PLASMA(","PLASMA(XY,").replaceAll("PLASMA(XY,)","PLASMA(XY)").replaceAll("PLASMA(",() => "PLASMA(SIMPLEX(" + this.#seed++ + ".0),").
	    replaceAll("PERLIN(","PERLIN(XY,").replaceAll("PERLIN(XY,)","PERLIN(XY)").replaceAll("PERLIN(",() => "PERLIN(SIMPLEX(" + this.#seed++ + ".0),").
	    replaceAll("FIRE(","FIRE(XY,").replaceAll("FIRE(XY,)","FIRE(XY)").replaceAll("FIRE(",() => "FIRE(SIMPLEX(" + this.#seed++ + ".0),").
	    replaceAll("WATER(","WATER(XY,").replaceAll("WATER(XY,)","WATER(XY)").replaceAll("WATER(",() => "WATER(SIMPLEX(" + this.#seed++ + ".0),")
	    return shader
  	}   
	#convertCharacterToShader(char){
	    let type = ACID.getTypeOfCharacter(char)
	    let subtype = type == "NUMBER" ? ACID.getSubtypeOfNumber(char) : ACID.getSubtypeOfCharacter(char)
	    let operation  = ACID.VALUE_FUNC.includes(char) ? "VALUE" : subtype
	    let wrapper = {
	      char: char,
	      type: type,
	      sub: subtype,
	      func: operation
	  	}
	  	return ACID.analyzeChar(wrapper)
	}
		
}