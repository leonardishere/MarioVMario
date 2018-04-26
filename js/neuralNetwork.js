var sigmoid = function(x){
  return 1.0 / (1.0 + Math.exp(-x));
}

class Neuron{
  constructor(prevLayer){
    this.weights = [];
    for(var i = 0; i < prevLayer.neurons.length; ++i){
      this.weights.push(Math.random());
    }
    this.bias = Math.random();
    this.prevLayer = prevLayer;
    this.output = 0;
  }

  feedForward(){
    var sum = this.bias;
    for(var i = 0; i < this.prevLayer.neurons.length; ++i){
      sum += this.weights[i] * this.prevLayer.neurons[i].getOutput();
    }
    this.output = sigmoid(sum);
  }

  getOutput(){
    return this.output;
  }
}

class SigmoidLayer{
  constructor(prevLayer, width){
    this.neurons = [];
    for(var i = 0; i < width; ++i){
      this.neurons.push(new Neuron(prevLayer));
    }
  }

  feedForward(){
    for(var i = 0; i < this.neurons.length; ++i){
      this.neurons[i].feedForward();
    }
  }
}

class InputNeuron{
  constructor(){
    this.val = 0;
  }

  setInput(val){
    this.val = val;
  }

  getOutput(){
    return this.val;
  }
}

class InputLayer{
  constructor(size){
    this.neurons = [];
    for(var i = 0; i < size; ++i){
      this.neurons.push(new InputNeuron());
    }
  }

  setInputs(inputs){
    for(var i = 0; i < inputs.length; ++i){
      this.neurons[i].setInput(inputs[i]);
    }
  }
}

class OutputLayer{
  constructor(prevLayer){
    this.prevLayer = prevLayer;
  }

  getOutputs(){
    var vals = [];
    for(var i = 0; i < this.prevLayer.neurons.length; ++i){
      vals.push(this.prevLayer.neurons[i].getOutput());
    }
    return vals;
  }

  getOutput(){
    var vals = this.getOutputs();
    var maxI = -1;
    var maxV = -1;
    for(var i = 0; i < vals.length; ++i){
      if(vals[i] > maxV){
        maxV = vals[i];
        maxI = i;
      }
    }
    return maxI;
  }
}

class NeuralNetwork{
  constructor(layerWidths){
    if(layerWidths < 2){
      console.log("Error: neural network requires >= 2 layers");
    }
    this.inputLayer = new InputLayer(layerWidths[0]);
    var prevLayer = this.inputLayer;
    this.hiddenLayers = [];
    for(var i = 1; i < layerWidths.length; ++i){
      var nextLayer = new SigmoidLayer(prevLayer, layerWidths[i]);
      this.hiddenLayers.push(nextLayer);
      prevLayer = nextLayer;
    }
    this.outputLayer = new OutputLayer(prevLayer);
  }

  feedForward(vals){
    this.inputLayer.setInputs(vals);
    for(var i = 0; i < this.hiddenLayers.length; ++i){
      this.hiddenLayers[i].feedForward();
    }
    //this.outputLayer.feedForward
  }

  getOutput(){
    return this.outputLayer.getOutput();
  }

  rigWeights(){
    var layer = this.hiddenLayers[0];
    var leftOut = layer.neurons[0];
    var rightOut = layer.neurons[1];
    var jumpOut = layer.neurons[2];
    var nothingOut = layer.neurons[3];
    leftOut.weights = [-1, 0];
    leftOut.bias = 0;
    rightOut.weight = [+1, 0];
    rightOut.bias = 0;
    jumpOut.weights = [0, 0];
    jumpOut.bias = +5;
    nothingOut.weights = [0, +1];
    nothingOut.bias = 0;
  }
}