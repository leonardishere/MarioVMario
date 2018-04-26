class Mario{
  constructor(element){
    this.dx = 0;
    this.dy = 0;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.element = element;
    this.neuralNet = new NeuralNetwork([2, 4]);
    this.neuralNet.rigWeights();
    this.player = false;
    this.alive = true;
  }

  distance(other){
    var horizDist = other.dx-this.dx;
    var vertDist = other.dy-this.dy;
    return Math.sqrt(horizDist*horizDist + vertDist*vertDist);
  }

  ai(other){
    if(this.player) return;
    var horizDist = other.dx-this.dx;
    var vertDist = other.dy-this.dy;
    this.neuralNet.feedForward([
      //this.dx,
      //Mario.GAME_WIDTH-this.dx-Mario.WIDTH,
      //this.dy+Mario.HEIGHT-Mario.GROUND,
      horizDist,
      vertDist
    ]);
    //console.log("feedForward(" + horizDist, vertDist);
    var output = this.neuralNet.getOutput();
    if(output == 0) this.left();
    else if(output == 1) this.right();
    else if(output == 2){
      this.up();
      this.stopHorizontal();
    }
    else {
      this.stopHorizontal();
    }
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
    /*
    else{
      console.log("vy: ", this.vy);
    }
    */
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

    //console.log("move to " + this.dx + ", " + this.dy);

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

  setPlayer(){
    this.player = true;
    this.element.addClass("player");
  }

  up(){
    var bottom = this.dy + Mario.HEIGHT;
    //on ground, can jump
    if(bottom >= Mario.GROUND){
      this.vy += Mario.JUMP_SPEED;
    }
  }

  left(){
    //console.log("left");
    this.vx = -Mario.GROUND_SPEED;
  }

  right(){
    //console.log("right");
    this.vx = Mario.GROUND_SPEED;
  }

  stopHorizontal(){
    this.vx = 0;
  }

  stomped(other){
    var l1 = this.dx;
    var r1 = this.dx+Mario.WIDTH;
    var t1 = this.dy;
    //var b1 = this.dy+Mario.HEIGHT;
    var l2 = other.dx;
    var r2 = other.dx+Mario.WIDTH;
    var t2 = other.dy;
    //console.log(other, other.dx);
    //var b2 = other.dy+Mario.HEIGHT;
    var diffHeight = -(t1 - t2);


    //alligned horizontally
    if((l2 <= l1 && l1 <= r2) || (l2 <= r1 && r1 <= r2)){
      //console.log("alligned horizontally");
      //on top, by at least 0 px
      if(0 < diffHeight && diffHeight <= Mario.HEIGHT){
        //console.log("on top");
        //falling
        if(this.vy > 0){
          //console.log("falling");
          return true;
        }
      }
    }
    return false;
  }

  die(){
    this.alive = false;
    this.element.css({display: "none"});
  }
}

Mario.WIDTH            = 16;
Mario.HEIGHT           = 16;
Mario.GRAVITY          = 0.025;
Mario.GROUND           = 499; //eventually, do more than just ground, but multiple platforms
Mario.GAME_WIDTH       = 960;
Mario.TERMINAL_VY_DOWN = 10;
Mario.JUMP_SPEED       = -10;
//Mario.GROUND_DRAG      = 0.0001;
//Mario.AIR_DRAG         = 0.00005;
Mario.GROUND_SPEED     = 10;
