class Mario{
  constructor(element, id){
    this.dx = 0;
    this.dy = 0;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.element = element;
    //this.neuralNet = new NeuralNetwork([2, 4]);
    //this.neuralNet.rigWeights();
    this.neuralNet = new NeuralNetwork([2, 5, 5]);
    this.alive = true;
    this.creationTime = new Date();
    this.deathTime = new Date(); //change this later
    this.stomps = 0;
    this.direction = -1;
    this.lastDirectionChangeTime = new Date() - Mario.DIRECTION_CHANGE_TIME;
    this.id = id;
  }

  distance(other){
    var horizDist = other.dx-this.dx;
    var vertDist = other.dy-this.dy;
    return Math.sqrt(horizDist*horizDist + vertDist*vertDist);
  }

  ai(other){
    var horizDist = other.dx-this.dx;
    var vertDist = other.dy-this.dy;
    this.neuralNet.feedForward([
      //this.dx,
      //Mario.GAME_WIDTH-this.dx-Mario.WIDTH,
      //this.dy+Mario.HEIGHT-Mario.GROUND,
      horizDist,
      vertDist
    ]);
    var outputs = this.neuralNet.getOutputs();
    if(outputs[2] > 0.5) this.up();
    if(outputs[0] > 0.5 || outputs[1] > 0.5){
      if(outputs[0] > outputs[1]) this.left();
      else this.right();
    }else this.stopHorizontal();
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
      var horizDist = (other.dx-this.dx)/100;
      var vertDist = (other.dy-this.dy)/100;
      var horizClose = this.cappedRecipricol(horizDist);
      var vertClose = this.cappedRecipricol(vertDist);
      this.neuralNet.feedForward([
        horizClose,
        vertClose
      ]);
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

  getX(){
    return this.dx;
  }

  getY(){
    return this.dy;
  }

  setX(x){
    this.dx = x;
  }

  setY(y){
    this.dy = y;
  }

  up(){
    var bottom = this.dy + Mario.HEIGHT;
    //on ground, can jump
    if(bottom >= Mario.GROUND){
      this.vy += Mario.JUMP_SPEED;
    }
  }

  left(){
    if(this.direction == 0) return;
    var currentTime = new Date();
    if(currentTime - this.lastDirectionChangeTime >= Mario.DIRECTION_CHANGE_TIME){
      this.vx = -Mario.GROUND_SPEED;
      this.element.addClass("left");
      this.lastDirectionChangeTime = currentTime;
      this.direction = 0;
    }
  }

  right(){
    if(this.direction == 1) return;
    var currentTime = new Date();
    if(currentTime - this.lastDirectionChangeTime >= Mario.DIRECTION_CHANGE_TIME){
      this.vx = Mario.GROUND_SPEED;
      this.element.removeClass("left");
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

  die(){
    this.alive = false;
    //this.element.css({display: "none"});
    this.element.remove();
    this.deathTime = new Date();
    this.survived = false;
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
    else{
      //console.log("died at ", this.deathTime, this.deathTime.value);
      //console.log("time alive: ", this.deathTime - this.creationTime);
      score += (this.deathTime - this.creationTime)*Mario.SCORE_PER_SECOND/1000;
    }
    return score;
  }

  breed(other){
    return this.neuralNet.combine(other.neuralNet);
  }
}

//Mario.WIDTH            = 16;
//Mario.HEIGHT           = 16;
Mario.WIDTH            = 32;
Mario.HEIGHT           = 28;
Mario.GRAVITY          = 0.025;
Mario.GROUND           = 499; //eventually, do more than just ground, but multiple platforms
Mario.GAME_WIDTH       = 960;
Mario.TERMINAL_VY_DOWN = 10;
Mario.JUMP_SPEED       = -10;
//Mario.GROUND_DRAG      = 0.0001;
//Mario.AIR_DRAG         = 0.00005;
Mario.GROUND_SPEED     = 10;
Mario.SCORE_PER_STOMP  = 100;
Mario.SCORE_PER_SECOND = 1;
Mario.SCORE_FOR_SURVIVAL = 20;
//Mario.DIRECTION_CHANGE_TIME = 100; //can only change directions every 100ms
Mario.DIRECTION_CHANGE_TIME = 0; //can only change directions every 100ms
