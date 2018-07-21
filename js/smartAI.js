class SmartAI extends Mario {
  constructor(element, id){
    super(element, id);
    this.id = "smart " + id;
    //this.setPlayer();
  }

  aiAll(marios){
    if(marios.length == 1){
      this.stopHorizontal();
      return;
    }

    //check if in immediate danger
    for(var i = 0; i < marios.length; ++i){
      if(this.equals(marios[i])) continue;
      var distX = marios[i].dx - this.dx;
      var diffX = Math.abs(distX);
      //if other is nearby
      if(diffX < 100){
        var distY = this.dy - marios[i].dy;
        //and other is above
        if(distY > 0){
            //bailout
            //if near left wall, bail right
            if(this.dx < 100) this.right();
            //if near right wall, bail left
            else if(Mario.GAME_WIDTH - Mario.WIDTH - this.dx < 100) this.left();
            //if other is to left, bail right
            else if(distX < 0) this.right();
            //if other is to right, bail left
            else this.left();
            return;
        }
      }
    }

    //if not in immediate danger, move towards nearest
    var nearestDist = 99999;
    var nearestDiff = 99999;
    //for(var i = 0; i < marios.length; ++i)
    for(var i = 0; i < marios.length; ++i){
      if(this.equals(marios[i])) continue;
      var dist = marios[i].dx - this.dx;
      var diff = Math.abs(dist);
      if(diff < nearestDiff){
        nearestDiff = diff;
        nearestDist = dist;
      }
    }
    if(nearestDist > 0) this.right();
    else this.left();
    this.up();
  }

  left(){
    super.left();
    this.element.css({background: "url('res/img/luigi4_left.png')"});
  }

  right(){
    super.right();
    this.element.css({background: "url('res/img/luigi4.png')"});
  }
  
  //test
}
