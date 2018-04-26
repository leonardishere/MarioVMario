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

  PIPE_WIDTH = 49;
  PIPE_HEIGHT = 62;
  NUM_PIPES = 5;
  LEFT_PIPE_X = 100;
  RIGHT_PIPE_X = GAME_WIDTH-LEFT_PIPE_X-PIPE_WIDTH;

  SPAWN_DELAY = 400;
  USE_GENERATIONS = false; //as opposed to spawning
  NUM_BEST_TO_STORE = 5;

  //variables
  var numMarios = 0;
  var gameArea = $(".gameArea");
  var pipeXs = [];

  //init pipes
  var spacing = (RIGHT_PIPE_X-LEFT_PIPE_X)/(NUM_PIPES-1);
  for(var i = 0; i < NUM_PIPES; ++i){
    var x = LEFT_PIPE_X + spacing*i;
    var pipe = $("<div class='pipe'></div>");
    pipe.css({left: x});
    pipeXs.push(x);
    gameArea.append(pipe);
  }

  //functions
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }

  //creates a new mario near the floor
  function createMario(){
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

  //spawns a new mario from a pipe. calls back when it is done falling through the pipe
  function spawnMario(cb){
    ++numMarios;
    var num = numMarios;
    var ele = $("<div class='mario' id='mario" + num + "'></div>");
    var mario = new Mario(ele, num);
    var pipeNum = getRandomInt(0, NUM_PIPES);
    var pipeX = pipeXs[pipeNum];
    var x = pipeX + PIPE_WIDTH/2 - MARIO_WIDTH/2;
    var y = PIPE_HEIGHT-MARIO_HEIGHT;
    mario.setX(x);
    mario.setY(y);
    gameArea.append(ele);
    ele.animate({top: PIPE_HEIGHT}, 100, () => {
      mario.setY(PIPE_HEIGHT);
      window.setTimeout(() => {
        cb(mario);
      }, TICK_DELAY*3);
    });
  }

  if(USE_GENERATIONS){
    var generation = 0;
    var killingGenerations = 0;
    var generationEle = $("<h3 id='generation'>Generation : 0</h3>");
    var killingGenerationsEle = $("<h3 id='killingGenerations'>Killing generations : 0</h3>");
    gameArea.after(generationEle);
    generationEle.after(killingGenerationsEle);

    function nextIteration(marios, cb){
      ++generation;
      generationEle.text("Generation : " + generation);
      killingGenerationsEle.text("Killing generations : " + killingGenerations);

      //setup timer handler
      var running = true;
      var timerID = window.setInterval(() => {
        //ai move against all
        for(var i = 0; i < marios.length; ++i){
          marios[i].aiAll(marios);
        }

        //move all for time
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
            var marioObject2 = marios[j];
            if(!marioObject2.alive) continue;
            if(marioObject1.stomped(marioObject2)){
              marioObject1.stomp();
              marioObject2.die();
            }
          }
        }

        //check if winner
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

      //check if over time limit
      window.setTimeout(() => {
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

    function callback(marios){
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
  }else{
    var aliveMarios = [];
    var deadMarios = [];
    var bestMarios = []; //the best marios by score, index 0 being best

    var spawnedEle = $("<h3 id='spawned'>Marios spawned: 5</h3>");
    gameArea.after(spawnedEle);
    var tableName = $("<h3>Top Scores</h3");
    spawnedEle.after(tableName);
    var table = $("<table id='best'></table>");
    tableName.after(table);
    var th = $("<tr></tr>");
    th.append($("<th>ID</th>"));
    th.append($("<th>Score</th>"));
    table.append(th);

    function onDeath(deadMario){
      var inserted = false;
      var score = deadMario.getScore();
      for(var i = 0; i < NUM_BEST_TO_STORE && i < bestMarios.length; ++i){
        if(score >= bestMarios[i].getScore()){
          inserted = true;
          bestMarios.splice(i, 0, deadMario);
          while(bestMarios.length > NUM_BEST_TO_STORE) bestMarios.pop();
          break;
        }
      }
      if(!inserted && bestMarios.length < 5){
        inserted = true;
        bestMarios.push(deadMario);
      }
      if(inserted){
        //change the table
        $(".topScore").remove();
        for(var i = 0; i < bestMarios.length; ++i){
          var tr = $("<tr class='topScore'></tr>");
          tr.append("<td>"+bestMarios[i].id+"</td>");
          tr.append($("<td>"+bestMarios[i].getScore().toFixed(0)+"</td>"));
          table.append(tr);
        }
      }
    }

    function getBrains(mario){
      if(bestMarios.length <= 1 || Math.random() > 0.5){
        mario.neuralNet.randomize();
        return;
      }
      var num1 = getRandomInt(0, bestMarios.length);
      var num2 = num1;
      do{
        num2 = getRandomInt(0, bestMarios.length);
      }while(num1 == num2);
      mario.neuralNet = bestMarios[num1].breed(bestMarios[num2]);
    }

    function frameTick(){
      //move dead marios from alive marios to dead marios
      for(var i = 0; i < aliveMarios.length; ){
        if(aliveMarios[i].alive) ++i;
        else{
          deadMarios.push(aliveMarios[i]);
          onDeath(aliveMarios[i]);
          aliveMarios.splice(i, 1);
        }
      }

      //ai move against all
      for(var i = 0; i < aliveMarios.length; ++i){
        aliveMarios[i].aiAll(aliveMarios);
      }

      //move all for time
      aliveMarios.forEach((marioObject) => {
        marioObject.tick();
      });

      //check collisions
      var alive = 0;
      for(var i = 0; i < aliveMarios.length; ++i){
        var marioObject1 = aliveMarios[i];
        if(!marioObject1.alive) continue;
        ++alive;
        for(var j = 0; j < aliveMarios.length; ++j){
          if(i == j) continue;
          var marioObject2 = aliveMarios[j];
          if(!marioObject2.alive) continue;
          if(marioObject1.stomped(marioObject2)){
            marioObject1.stomp();
            marioObject2.die();
          }
        }
      }
    }

    function spawnTick(){
      spawnMario((newMario) => {
        getBrains(newMario);
        aliveMarios.push(newMario);
        spawnedEle.text("Marios spawned: " + numMarios);
      });
    }

    //init
    for(var i = 0; i < 5; ++i){
      var newMario = createMario();
      aliveMarios.push(newMario);
    }

    window.setInterval(() => {
      frameTick();
    }, TICK_DELAY);

    window.setInterval(() => {
      spawnTick();
    }, SPAWN_DELAY);
  }


});
