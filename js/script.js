$(() => {
  //define constants
  MARIO_HEIGHT = 32;
  MARIO_WIDTH = 28;
  GAME_WIDTH = 960;
  GAME_HEIGHT = 540;
  GROUND_HEIGHT = 499;
  GRAVITY = 8;
  TICK_DELAY = 17;
  MAX_GAME_TIME = 5000;
  NUM_MARIOS_PER_ITERATION = 50;
  NUM_SURVIVORS = 5;
  WINNER_SURVIVES = true;
  NEW_MEMBERS = 5;

  //variables
  var numMarios = 0;
  var gameArea = $(".gameArea");
  var gameOver = false;
  var generation = 0;
  var killingGenerations = 0;
  var generationEle = $("#generation");
  var killingGenerationsEle = $("#killingGenerations");

  //functions
  var createMario = function(){
    ++numMarios;
    var num = numMarios;
    var ele = $("<div class='mario' id='mario" + num + "'></div>");
    var mario = new Mario(ele, num);
    var x = Math.random() * (GAME_WIDTH-MARIO_WIDTH);
    //var y = Math.random() * (GROUND_HEIGHT-MARIO_HEIGHT);
    //var y = GROUND_HEIGHT-MARIO_HEIGHT;
    var y = GROUND_HEIGHT-MARIO_HEIGHT- Math.random()*50;
    mario.setX(x);
    mario.setY(y);
    gameArea.append(ele);
    return mario;
  }

  var nextIteration = function(marios, cb){
    ++generation;
    generationEle.text("Generation : " + generation);
    killingGenerationsEle.text("killingGenerations : " + killingGenerations);

    //setup timer handler
    var running = true;
    var timerID = window.setInterval(() => {
      //neural net stuff
      //move strictly based on nearest other
      /*
      for(var i = 0; i < marios.length; ++i){
        var marioObject1 = marios[i];
        if(!marioObject1.alive) continue;
        var minD = 9999999;
        var minI = -1;
        for(var j = 0; j < marios.length; ++j){
          if(i == j) continue;
          var marioObject2 = marios[j];
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
          marioObject1.ai(marios[minI]);
        }
      }
      */
      //move against all
      for(var i = 0; i < marios.length; ++i){
        marios[i].aiAll(marios);
      }

      //move all
      marios.forEach((marioObject) => {
        marioObject.tick();
      });

      //check collisions
      var alive = 0;
      for(var i = 0; i < marios.length; ++i){
        var marioObject1 = marios[i];
        if(!marioObject1.alive) continue;
        ++alive;
        for(var j = 0; j < marios.length; ++j){
          if(i == j) continue;
          //console.log("check stomps " + i + ", " + j);
          var marioObject2 = marios[j];
          if(!marioObject2.alive) continue;
          if(marioObject1.stomped(marioObject2)){
            //console.log(i + " stomped " + j);
            marioObject1.stomp();
            marioObject2.die();
          }
        }
      }
      if(alive <= 1){
        console.log("game over!");
        console.log("player, stomps, score");
        for(var i = 0; i < marios.length; ++i){
          var winnerMessage = "";
          if(marios[i].alive) winnerMessage = " winner!";
          console.log(i + ", " + marios[i].stomps + ", " + marios[i].getScore() + winnerMessage);
        }
        window.clearInterval(timerID);
        if(running){
          running = false;
          for(var i = 0; i < marios.length; ++i){
            if(marios[i].alive) marios[i].survive();
          }
          ++killingGenerations;
          cb(marios);
        }
      }
    }, TICK_DELAY);

    window.setTimeout(() => {
      //console.log("window timeout");
      if(running){
        window.clearInterval(timerID);
        running = false;
        for(var i = 0; i < marios.length; ++i){
          if(marios[i].alive) marios[i].survive();
        }
        cb(marios);
      }
    }, MAX_GAME_TIME);
  }

  //init first generation
  var firstMarios = [];
  for(var i = 0; i < NUM_MARIOS_PER_ITERATION; ++i){
    var nextMario = createMario();
    firstMarios.push(nextMario);
  }

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }

  var callback = function(marios){
    //do something to create next generation of marios from the previous generation

    //get those that reproduce
    var bestMarios = [];
    var selected = [];
    for(var i = 0; i < marios.length; ++i) selected.push(false);
    for(var i = 0; i < NUM_SURVIVORS; ++i){
      var bestScore = -1;
      var bestIndex = -1;
      for(var j = 0; j < marios.length; ++j){
        if(!selected[j]){
          var score = marios[j].getScore();
          if(score > bestScore){
            bestScore = score;
            bestIndex = j;
          }
        }
      }
      //bestMarios.push(marios.remove(j));
      bestMarios.push(marios[bestIndex]);
      selected[bestIndex] = true;
    }

    //create next generation
    var nextMarios = [];
    var max = NUM_MARIOS_PER_ITERATION - NEW_MEMBERS;
    if(WINNER_SURVIVES) --max;
    for(var i = 0; i < max; ++i){
      var num1 = getRandomInt(0, NUM_SURVIVORS);
      var num2 = getRandomInt(0, NUM_SURVIVORS);
      while(num1 == num2) num2 = getRandomInt(0, NUM_SURVIVORS);
      var mario1 = bestMarios[num1];
      var mario2 = bestMarios[num2];
      //var mario3 = mario1.breed(mario2);
      var brains = mario1.breed(mario2);
      var mario3 = createMario();
      mario3.neuralNet = brains;
      nextMarios.push(mario3);
    }
    for(var i = 0; i < NEW_MEMBERS; ++i){
      var mario3 = createMario();
      nextMarios.push(mario3);
    }
    if(WINNER_SURVIVES){
      var mario3 = createMario();
      mario3.neuralNet = bestMarios[0].neuralNet;
      nextMarios.push(mario3);
    }

    nextIteration(nextMarios, callback);
  }
  nextIteration(firstMarios, callback);
  //console.log("here");
});
