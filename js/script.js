$(() => {
  //define constants
  MARIO_HEIGHT = 32;
  MARIO_WIDTH = 28;
  GAME_WIDTH = 960;
  GAME_HEIGHT = 540;
  GROUND_HEIGHT = 499;
  GRAVITY = 8;
  TICK_DELAY = 17;

  PIPE_WIDTH = 49;
  PIPE_HEIGHT = 62;
  NUM_PIPES = 5;
  LEFT_PIPE_X = 100;
  RIGHT_PIPE_X = GAME_WIDTH-LEFT_PIPE_X-PIPE_WIDTH;

  SPAWN_DELAY = 400;
  NUM_BEST_TO_STORE = 10;

  PLAYER = true;

  //variables
  var numMarios = 0;
  var gameArea = $("#gameArea");
  var pipeXs = [];
  var deathScreen = $("#deathScreen");
  var frameNumber = 0;

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

    //10% chance of making a smart ai
    var mario = new Mario(ele, num);
    //var mario;
    //if(Math.random() < 0.1) mario = new SmartAI(ele, num);
    //else mario = new Mario(ele, num);

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
      }, TICK_DELAY*5);
    });
  }

  //plays a sound effect
  function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
        this.sound.play();
    }
    this.stop = function(){
        this.sound.pause();
    }
    return this;
  }

  var aliveMarios = [];
  var deadMarios = [];
  var bestMarios = []; //the best marios by score, index 0 being best
  var player;
  var nextClone = false;
  var cloneBrain = null;
  //var backgroundMusic = sound("res/sounds/background.mp3");
  //backgroundMusic.sound.loop = true;
  //backgroundMusic.play();

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

  function createPlayer(){
    player = createMario();
    player.setPlayer();
    if(cloneBrain){
      player.neuralNet = cloneBrain.clone();
    }
    aliveMarios.push(player);
  }

  $("#restart").click(() => {
    deathScreen.css({visibility: "hidden"});
    createPlayer();
  });

  $("#hide").click(() => {
    deathScreen.css({visibility: "hidden"});
  });

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
        tr.append($("<td>"+Math.floor(bestMarios[i].getScore())+"</td>"));
        table.append(tr);
      }
    }

    if(deadMario.player){
      deathScreen.css({visibility: "visible"});
      nextClone = true;
      cloneBrain = deadMario.neuralNet;
    }
  }

  function getBrains(mario){
    //if need to clone then clone
    if(nextClone){
      nextClone = false;
      mario.neuralNet = cloneBrain.clone();
      mario.setClone();
      return;
    }
    //chance of randomization = 10%, or 100% if <= 1 possible parent
    if(bestMarios.length <= 1 || Math.random() < 0.1){
      mario.neuralNet.randomize();
      return;
    }
    //breed based on random 2 parents
    var num1 = getRandomInt(0, bestMarios.length);
    var num2 = num1;
    do{
      num2 = getRandomInt(0, bestMarios.length);
    }while(num1 == num2);
    mario.neuralNet = bestMarios[num1].breed(bestMarios[num2]);
  }

  function frameTick(){
    ++frameNumber;

    //move dead marios from alive marios to dead marios
    var dead = 0;
    for(var i = 0; i < aliveMarios.length; ){
      if(aliveMarios[i].alive) ++i;
      else{
        deadMarios.push(aliveMarios[i]);
        onDeath(aliveMarios[i]);
        aliveMarios.splice(i, 1);
        //stompSound.play();
        ++dead;
      }
    }
    if(dead > 0){
      /*
      var stompSound = sound("res/sounds/stomp.mp3");
      stompSound.sound.onended = function(){
        //console.log("ended ", stompSound.sound);
        //window.remove(stompSound);
        //stompSound.parent.remove(stompSound);
        var parent = stompSound.sound.parentNode;
        if(parent){
          parent.removeChild(stompSound.sound);
        }else{
          if(!stompSound) console.log("stompSound is null");
          else if(!stompSound.sound) console.log("stompSound.sound is null");
          else console.log("stompSound.sound.parent is null");
        }
        //stompSound.sound.parentNode.removeChild(stompSound.sound);
      }
      stompSound.play();
      */
    }

    //ai move against all, or backpropagate if player
    for(var i = 0; i < aliveMarios.length; ++i){
      if(aliveMarios[i].player){
        aliveMarios[i].sgd(aliveMarios, directions);
      }else{
        aliveMarios[i].aiAll(aliveMarios);
      }
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

  //player setup
  var directions = [];
  for(var i = 0; i < 4; ++i) directions.push(false);
  if(PLAYER){
    //create player
    createPlayer();
    //setup listeners
    var handler = function(){
      if(PLAYER && player.alive){
        if(directions[0]) player.up();
        if(!(directions[1] ^ directions[3])) player.stopHorizontal();
        else if(directions[1]) player.left();
        else if(directions[3]) player.right();
      }
    }
    $("html").keydown((event) => {
           if(event.key == 'w') directions[0] = true;
      else if(event.key == 'a') directions[1] = true;
      else if(event.key == 's') directions[2] = true;
      else if(event.key == 'd') directions[3] = true;
      else if(event.key == 'r'){
        if(PLAYER && !player.alive) $("#restart").click();
      }
      else if(event.key == 'h'){
        $("#hide").click();
      }
      handler();
    });
    $("html").keyup((event) => {
           if(event.key == 'w') directions[0] = false;
      else if(event.key == 'a') directions[1] = false;
      else if(event.key == 's') directions[2] = false;
      else if(event.key == 'd') directions[3] = false;
      handler();
    });
  }

  //initial marios
  for(var i = 0; i < 5; ++i){
    var newMario = createMario();
    newMario.neuralNet.randomize();
    aliveMarios.push(newMario);
  }

  //new frame handler
  window.setInterval(() => {
    frameTick();
  }, TICK_DELAY);

  //mario spawner handler
  window.setInterval(() => {
    spawnTick();
  }, SPAWN_DELAY);


});
