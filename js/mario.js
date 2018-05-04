class Mario{
  constructor(element, id){
    this.dx = 0;
    this.dy = 0;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.element = element;
    //this.neuralNet = new NeuralNetwork([4, 4]);
    //this.neuralNet.rigWeights();
    this.neuralNet = new NeuralNetwork([7, 20, 20, 4]);
    //this.neuralNet = new NeuralNetwork([5, 10, 4]);
    this.alive = true;
    this.creationTime = new Date();
    this.deathTime = new Date(); //change this later in code
    this.stomps = 0;
    this.direction = -1;
    this.lastDirectionChangeTime = new Date() - Mario.DIRECTION_CHANGE_TIME;
    this.id = id;
    this.player = false;
    this.clone = false;
  }

  setPlayer(){
    this.player = true;
    if(this.direction == 1) this.element.css({background: "url('res/img/luigi4.png')"});
    else this.element.css({background: "url('res/img/luigi4_left.png')"});
    this.id = "player " + this.id;
    this.vertData = [];
    this.horizData = [];
  }

  setClone(){
    this.clone = true;
    if(this.direction == 1) this.element.css({background: "url('res/img/waluigi4.png')"});
    else this.element.css({background: "url('res/img/waluigi4_left.png')"});
    this.id = "clone " + this.id;
  }

  distance(other){
    var horizDist = other.dx-this.dx;
    var vertDist = other.dy-this.dy;
    return Math.sqrt(horizDist*horizDist + vertDist*vertDist);
  }

  aiAll(marios){
    //feedforward all marios
    var outputSum = [];
    for(var i = 0; i < this.neuralNet.outputLayer.prevLayer.neurons.length; ++i){
      outputSum.push(0);
    }
    var added = 0;
    for(var i = 0; i < marios.length; ++i){
      var other = marios[i];
      if(other.equals(this)) continue;
      if(!other.alive) continue;
      ++added;
      this.neuralNet.feedForward(this.getNetworkInputs(other));
      var outputs = this.neuralNet.getOutputs();
      outputSum = this.sum(outputSum, outputs);
    }
    if(added == 0){
      this.stopHorizontal();
      return;
    }
    var outputAvg = this.div(outputSum, added);

    //action based on avg output
    if(outputAvg[2] > 0.5) this.up();
    if(outputAvg[0] > 0.5 || outputAvg[1] > 0.5){
      if(outputAvg[0] > outputAvg[1]) this.left();
      else this.right();
    }else this.stopHorizontal();
  }

  sgd(marios, directions){
    //convert directions -> target outputs
    var outputs = [];
    for(var i = 0; i < 4; ++i) outputs.push(0);
    if(directions[0]) outputs[2] = 1;
    if(directions[1] ^ directions[3]){
      if(directions[1]) outputs[0] = true;
      else outputs[1] = true;
    }else{
      outputs[3] = 1;
    }
    //loop over all marios
    for(var i = 0; i < marios.length; ++i){
      var other = marios[i];
      if(this.equals(other)) continue;
      if(!other.alive) continue;
      this.neuralNet.sgd(this.getNetworkInputs(other), outputs);
    }

    //print error
    var printError = false;
    if(printError){
      var error = 0;
      for(var i = 0; i < marios.length; ++i){
        var other = marios[i];
        if(this.equals(other)) continue;
        if(!other.alive) continue;
        var nextError = this.neuralNet.errorScalor(this.getNetworkInputs(other), outputs);
        error += nextError;
      }
      console.log("error: " + error);
    }

    if(this.player){
      //append to log
      var vertStatus = directions[0] ? "jumped" : "stayed";
      var horizStatus = outputs[0] ? "left" : outputs[1] ? "right" : "stayed";
      //loop over all marios
      for(var i = 0; i < marios.length; ++i){
        var other = marios[i];
        if(this.equals(other)) continue;
        if(!other.alive) continue;
        this.vertData.push([other.dx-this.dx, -(other.dy-this.dy), vertStatus]);
        this.horizData.push([other.dx-this.dx, -(other.dy-this.dy), horizStatus]);
      }
    }
  }

  //move these math functions somewhere else
  sum(v1, v2){
    var v3 = [];
    for(var i = 0; i < v1.length && i < v2.length; ++i){
      v3.push(v1[i] + v2[i]);
    }
    return v3;
  }

  div(v, num){
    var v2 = [];
    for(var i = 0; i < v.length; ++i){
      v2.push(v[i]/num);
    }
    return v2;
  }

  cappedRecipricol(val){
    if(val == 0) return 0;
    var val2 = 1 / val;
    if(val2 > 1) return 1;
    if(val2 < -1) return -1;
    return val2;
  }

  equals(other){
    return this.id == other.id;
  }

  tick(){
    //move variables
    this.ay += Mario.GRAVITY;
    this.vy += this.ay;
    if(this.vy >= Mario.TERMINAL_VY_DOWN){
      this.vy = Mario.TERMINAL_VY_DOWN;
    }
    this.dy += this.vy;
    var bottom = this.dy + Mario.HEIGHT;
    if(bottom >= Mario.GROUND){
      this.ay = 0;
      this.vy = 0;
      this.dy = Mario.GROUND-Mario.HEIGHT;
    }
    this.vx += this.ax; //will ever have ax?
    this.dx += this.vx;

    if(this.dx <= 0){
      this.vx = 0;
      this.dx = 0;
    }
    var right = this.dx + Mario.WIDTH;
    if(right >= Mario.GAME_WIDTH){
      this.vx = 0;
      this.dx = Mario.GAME_WIDTH - Mario.WIDTH;
    }

    //move element
    this.element.css({top: this.dy, left: this.dx});
  }

  setX(x){
    this.dx = x;
    this.element.css({left: x});
  }

  setY(y){
    this.dy = y;
    this.element.css({top: y});
  }

  up(){
    var bottom = this.dy + Mario.HEIGHT;
    //on ground, can jump
    if(bottom >= Mario.GROUND){
      this.vy = Mario.JUMP_SPEED;
    }
  }

  left(){
    if(this.direction == 0) return;
    var currentTime = new Date();
    if(currentTime - this.lastDirectionChangeTime >= Mario.DIRECTION_CHANGE_TIME){
      this.vx = -Mario.GROUND_SPEED;
      if(this.player) this.element.css({background: "url('res/img/luigi4_left.png')"});
      else if(this.clone) this.element.css({background: "url('res/img/waluigi4_left.png')"});
      else this.element.css({background: "url('res/img/mario4_left.png')"});
      this.lastDirectionChangeTime = currentTime;
      this.direction = 0;
    }
  }

  right(){
    if(this.direction == 1) return;
    var currentTime = new Date();
    if(currentTime - this.lastDirectionChangeTime >= Mario.DIRECTION_CHANGE_TIME){
      this.vx = Mario.GROUND_SPEED;
      if(this.player) this.element.css({background: "url('res/img/luigi4.png')"});
      else if(this.clone) this.element.css({background: "url('res/img/waluigi4.png')"});
      else this.element.css({background: "url('res/img/mario4.png')"});
      this.lastDirectionChangeTime = currentTime;
      this.direction = 1;
    }
  }

  stopHorizontal(){
    this.vx = 0;
    this.direction = -1;
  }

  stomped(other){
    var l1 = this.dx;
    var r1 = this.dx+Mario.WIDTH;
    var t1 = this.dy;
    var l2 = other.dx;
    var r2 = other.dx+Mario.WIDTH;
    var t2 = other.dy;
    var diffHeight = -(t1 - t2);

    //alligned horizontally
    if((l2 <= l1 && l1 <= r2) || (l2 <= r1 && r1 <= r2)){
      //on top, by at least 0 px
      if(0 < diffHeight && diffHeight <= Mario.HEIGHT){
        //falling
        if(this.vy > 0){
          return true;
        }
      }
    }
    return false;
  }

  toCSV(matrix){
    var str = "";
    for(var i = 0; i < matrix.length; ++i){
      var row = matrix[i];
      for(var j = 0; j < row.length; ++j){
        str += row[j];
        if(j != row.length-1){
          str += ",";
        }
      }
      str += "\n";
    }
    return str;
  }

  die(){
    this.alive = false;
    this.element.remove();
    this.deathTime = new Date();
    this.survived = false;
    if(this.player){
      console.log("vertData: ");
      console.log(this.toCSV(this.vertData));
      for(var i = 0; i < 25; ++i) console.log("\n");
      console.log("horizData: ");
      console.log(this.toCSV(this.horizData));
    }
  }

  survive(){
    this.element.remove();
  }

  stomp(){
    ++this.stomps;
  }

  getScore(){
    var score = Mario.SCORE_PER_STOMP * this.stomps;
    if(this.alive) score += Mario.SCORE_FOR_SURVIVAL;
    else score += (this.deathTime - this.creationTime)*Mario.SCORE_PER_SECOND/1000;
    return score;
  }

  breed(other){
    return this.neuralNet.combine(other.neuralNet);
  }

  getNetworkInputs(other){
    var horizDist = (other.dx-this.dx) * Mario.HORIZONTAL_SCALING;
    var vertDist = (other.dy-this.dy) * Mario.VERTICAL_SCALING;
    var horizClose = this.cappedRecipricol(horizDist);
    var vertClose = this.cappedRecipricol(vertDist);
    var leftClose = Math.max(0, -horizClose); //how far left to other
    var rightClose = Math.max(0, horizClose);
    var upClose = Math.max(0, -vertClose);    //how far up to other
    var downClose = Math.max(0, vertClose);   //how far down to other
    var groundDist = (Mario.GROUND-this.dy-Mario.HEIGHT) * Mario.VERTICAL_SCALING;
    var groundClose = this.cappedRecipricol(groundDist);
    var centerDist = (Mario.GAME_WIDTH - this.dx - Mario.WIDTH) * 2 - 1;
    var centerClose = this.cappedRecipricol(centerDist);
    var spazFactor = Math.random() - Math.random(); // -1 to +1
    return [leftClose, rightClose, upClose, downClose, groundClose, centerClose, spazFactor];
  }
}

Mario.WIDTH                 = 32;
Mario.HEIGHT                = 28;
Mario.GRAVITY               = 0.025;
Mario.GROUND                = 499; //eventually, do more than just ground, but multiple platforms
Mario.GAME_WIDTH            = 960;
Mario.TERMINAL_VY_DOWN      = 10;
Mario.JUMP_SPEED            = -10;
//Mario.GROUND_DRAG           = 0.0001;
//Mario.AIR_DRAG              = 0.00005;
Mario.GROUND_SPEED          = 10;
Mario.SCORE_PER_STOMP       = 20;
Mario.SCORE_PER_SECOND      = 1;
Mario.SCORE_FOR_SURVIVAL    = 10;
//Mario.DIRECTION_CHANGE_TIME = 100; //can only change directions every 100ms
Mario.DIRECTION_CHANGE_TIME = 0; //maybe not such a good idea to enforce that
Mario.HORIZONTAL_SCALING    = 1/10;
Mario.VERTICAL_SCALING      = 1/10;
