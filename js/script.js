$(() => {
  //console.log("ready");
  gameArea = $(".gameArea");
  console.log("Game Area: ", gameArea);
  gameArea.append("<div class='mario'></div>");
  mario = $(".mario");
  console.log("Mario: ", mario);
});
