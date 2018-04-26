$(() => {
  //define constants
  MARIO_HEIGHT = 16;
  MARIO_WIDTH = 16;
  GAME_WIDTH = 540;
  GAME_HEIGHT = 960;
  GROUND_HEIGHT = 499;
  GRAVITY = 8;
  TICK_DELAY = 17;
  //val TICK_DELAY = 1000;

  //variables
  var numMarios = 0;
  var gameArea = $(".gameArea");
  console.log("Game Area: ", gameArea);
  var marioObjects = [];

  //functions
  var createMario = function(){
    ++numMarios;
    var num = numMarios;
    var ele = $("<div class='mario' id='mario" + num + "'></div>");
    var mario = new Mario(ele);
    gameArea.append(ele);
    marioObjects.push(mario);
    return mario;
  }

  /*
  var player = createMario();
  player.setPlayer();
  player.setX(960-16);
  var ai = createMario();
  */
  for(var i = 0; i < 20; ++i){
    var nextMario = createMario();
    var x = Math.random() * (GAME_WIDTH-MARIO_WIDTH);
    var y = Math.random() * (GROUND_HEIGHT-MARIO_HEIGHT);
    nextMario.setX(x);
    nextMario.setY(y);
  }
  //setup event listeners
  /*
  $("html").keydown((event) => {
    //console.log("keydown ", event.key);
    if(event.key == 'w') marioObjects[0].up();
    else if(event.key == 'a') marioObjects[0].left();
    else if(event.key == 'd') marioObjects[0].right();
  });
  $("html").keypress((event) => {
    //console.log("keypress ", event.key);
  });
  $("html").keyup((event) => {
    //console.log("keyup ", event.key);
    if(event.key == 'a' || event.key == 'd'){
      marioObjects[0].stopHorizontal();
    }
  });
  */

  //setup timer handler
  window.setInterval(() => {
    //neural net stuff
    //marioObjects[1].ai(marioObjects[0]); //for 1 ai and 1 player
    //move strictly based on nearest other
    for(var i = 0; i < marioObjects.length; ++i){
      var marioObject1 = marioObjects[i];
      if(!marioObject1.alive) continue;
      var minD = 9999999;
      var minI = -1;
      for(var j = 0; j < marioObjects.length; ++j){
        if(i == j) continue;
        var marioObject2 = marioObjects[j];
        if(!marioObject2.alive) continue;
        var dist = marioObject1.distance(marioObject2);
        if(dist < minD){
          minD = dist;
          minI = j;
        }
      }
      if(minI == -1){
        marioObject1.stopHorizontal();
      }else{
        marioObject1.ai(marioObjects[minI]);
      }
    }

    //move all
    marioObjects.forEach((marioObject) => {
      marioObject.tick();
    });

    //check collisions
    for(var i = 0; i < marioObjects.length; ++i){
      var marioObject1 = marioObjects[i];
      if(!marioObject1.alive) continue;
      for(var j = 0; j < marioObjects.length; ++j){
        if(i == j) continue;
        //console.log("check stomps " + i + ", " + j);
        var marioObject2 = marioObjects[j];
        if(!marioObject2.alive) continue;
        if(marioObject1.stomped(marioObject2)){
          console.log(i + " stomped " + j);
          marioObject2.die();
        }
      }
    }
  }, TICK_DELAY);
});
