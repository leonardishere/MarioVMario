class Mario{
  constructor(){
    this.dx = 0;
    this.dy = 0;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
  }

  tick(){

  }

  getX(){
    return dx;
  }

  getY(){
    return dy;
  }
}

Mario.WIDTH = 16;
Mario.HEIGHT = 16;
Mario.GRAVITY = 8;
Mario.GROUND = 498; //eventually, do more than just ground, but multiple platforms
