function sigmoid(x){
  return 1.0 / (1.0 + Math.exp(-x));
}

function svSub(num, vec){
  var res = [];
  for(var i = 0; i < vec.length; ++i){
    //if(isNaN(vec[i])) console.log("svSub() receiving NaNs");
    //if(isNaN(num - vec[i])) console.log("svSub() returning NaNs");
    res.push(num - vec[i]);
  }
  return res;
}

function vvSub(vec1, vec2){
  var res = [];
  for(var i = 0; i < vec1.length && i < vec2.length; ++i){
    res.push(vec1[i]-vec2[i]);
  }
  return res;
}

function vvMul(vec1, vec2){
  var res = [];
  for(var i = 0; i < vec1.length && i < vec2.length; ++i){
    res.push(vec1[i]*vec2[i]);
  }
  return res;
}

//sigmoid neuron
class Neuron{
  constructor(prevLayer){
    this.weights = [];
    for(var i = 0; i < prevLayer.neurons.length; ++i){
      this.weights.push(0);
    }
    this.bias = 0;
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

  adjustWeights(learningRate, error){
    var mul = learningRate * error;
    this.bias += mul;
    var prevOutputs = this.prevLayer.getOutputs();
    for(var i = 0; i < this.prevLayer.neurons.length; ++i){
      this.weights[i] += mul * prevOutputs[i];
    }
  }
}

class SigmoidLayer{
  constructor(prevLayer, width){
    this.neurons = [];
    for(var i = 0; i < width; ++i){
      this.neurons.push(new Neuron(prevLayer));
    }
    this.prevLayer = prevLayer;
  }

  feedForward(){
    for(var i = 0; i < this.neurons.length; ++i){
      this.neurons[i].feedForward();
    }
  }

  backpropagate(errors, learningRate){
    //calculate error vector
    var vals = this.prevLayer.getOutputs();
    var oneMinus = svSub(1, vals);
    var weightErrorSum  = [];
    var prevLength = this.prevLayer.neurons.length;
    var thisLength = this.neurons.length;
    for(var i = 0; i < prevLength; ++i) weightErrorSum.push(0);
    for(var i = 0; i < prevLength; ++i){
      for(var j = 0; j < thisLength; ++j){
        var weight = this.neurons[j].weights[i];
        var error = errors[j];
        var weightError = weight*error;
        weightErrorSum[i] += weightError;
        //weightErrorSum[i] += this.neurons[j].weights[i] * errors[j];
      }
    }
    var errors1 = vvMul(vals, oneMinus);
    var prevErrors = vvMul(errors1, weightErrorSum);

    //backpropagate errors
    this.prevLayer.backpropagate(prevErrors, learningRate);

    //adjust weights
    for(var i = 0; i < this.neurons.length; ++i){
      this.neurons[i].adjustWeights(learningRate, errors[i]);
    }
  }

  getOutputs(){
    var outputs = [];
    for(var i = 0; i < this.neurons.length; ++i){
      outputs.push(this.neurons[i].getOutput());
    }
    return outputs;
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
    if(inputs.length != this.neurons.length) console.log("error: please input " + this.neurons.length + " values. " + inputs.length + " received");
    for(var i = 0; i < inputs.length; ++i){
      this.neurons[i].setInput(inputs[i]);
    }
  }

  getOutputs(){
    var outputs = [];
    for(var i = 0; i < this.neurons.length; ++i){
      outputs.push(this.neurons[i].getOutput());
    }
    return outputs;
  }

  //nothing to change for input layer
  backpropagate(errors, learningRate){}
}

class OutputLayer{
  constructor(prevLayer){
    this.prevLayer = prevLayer;
  }

  getOutputs(){
    return this.prevLayer.getOutputs();
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

  backpropagate(outputs, learningRate){
    //calculate error vector
    var vals = this.getOutputs();
    var oneMinus = svSub(1, vals);
    var tMinus = vvSub(outputs, vals);
    var errors = vvMul(vals, oneMinus);
    errors = vvMul(errors, tMinus);

    //backpropagate errors
    this.prevLayer.backpropagate(errors, learningRate);

    //adjust weights (not applicable in output layer)
  }
}

class NeuralNetwork{
  constructor(layerWidths){
    this.layerWidths = layerWidths;
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
  }

  getOutputs(){
    return this.outputLayer.getOutputs();
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
    leftOut.weights = [+1, 0, 0.5, 0]; //move towards, if below get out the way
    leftOut.bias = 0;
    rightOut.weight = [0, +1, 0.5, 0]; //move towards, if below get out the way
    rightOut.bias = 0;
    jumpOut.weights = [0, 0, -20, 0]; //dont jump if below other
    jumpOut.bias = +5;                //else jump
    nothingOut.weights = [0, 0, 0, +5]; //fall if above other
    nothingOut.bias = 0;
  }

  combine(other){
    var neuronBased = true; //as opposed to weight based
    var newnet = new NeuralNetwork(this.layerWidths);
    for(var layerNum = 0; layerNum < this.hiddenLayers.length; ++layerNum){
      var thisLayer = this.hiddenLayers[layerNum];
      var otherLayer = other.hiddenLayers[layerNum];
      var newLayer = newnet.hiddenLayers[layerNum];
      for(var neuronNum = 0; neuronNum < thisLayer.neurons.length; ++neuronNum){
        var thisNeuron = thisLayer.neurons[neuronNum];
        var otherNeuron = otherLayer.neurons[neuronNum];
        var newNeuron = newLayer.neurons[neuronNum];
        var chooseThis = Math.random() < 0.5;
        for(var weightNum = 0; weightNum < thisNeuron.weights.length; ++weightNum){
          var thisWeight = thisNeuron.weights[weightNum];
          var otherWeight = otherNeuron.weights[weightNum];
          if(!neuronBased) chooseThis = Math.random() < 0.5;
          var newWeight = chooseThis ? thisWeight : otherWeight;
          newNeuron.weights[weightNum] = newWeight;
        }
        var thisBias = thisNeuron.bias;
        var otherBias = otherNeuron.bias;
        if(!neuronBased) chooseThis = Math.random() < 0.5;
        var newBias =  chooseThis ? thisBias : otherBias;
        newNeuron.bias = newBias;
      }
    }
    newnet.mutate();
    return newnet;
  }

  mutate(){
    for(var layerNum = 0; layerNum < this.hiddenLayers.length; ++layerNum){
      var thisLayer = this.hiddenLayers[layerNum];
      for(var neuronNum = 0; neuronNum < thisLayer.neurons.length; ++neuronNum){
        var thisNeuron = thisLayer.neurons[neuronNum];
        for(var weightNum = 0; weightNum < thisNeuron.weights.length; ++weightNum){
          thisNeuron.weights[weightNum] = this.singleMutate(thisNeuron.weights[weightNum]);
        }
        thisNeuron.bias = this.singleMutate(thisNeuron.bias);
      }
    }
  }

  singleMutate(value){
    var mulChangeMax = 0.1;
    var addChangeMax = 0.1;
    var mulChange = Math.random() * mulChangeMax;
    if(Math.random() > 0.5) mulChange = -mulChange;
    var addChange = Math.random() * addChangeMax;
    if(Math.random() > 0.5) addChange = -addChange;
    return value * (1+mulChange) + addChange;
  }

  randomize(){
    for(var layerNum = 0; layerNum < this.hiddenLayers.length; ++layerNum){
      var thisLayer = this.hiddenLayers[layerNum];
      for(var neuronNum = 0; neuronNum < thisLayer.neurons.length; ++neuronNum){
        var thisNeuron = thisLayer.neurons[neuronNum];
        for(var weightNum = 0; weightNum < thisNeuron.weights.length; ++weightNum){
          thisNeuron.weights[weightNum] = Math.random() - Math.random(); //-1 to +1
        }
        thisNeuron.bias = Math.random() - Math.random();
      }
    }
  }

  sgd(inputs, outputs){
    this.feedForward(inputs);
    this.backpropagate(outputs);
  }

  backpropagate(outputs){
    var learningRate = 0.1;
    this.outputLayer.backpropagate(outputs, learningRate);
  }

  errorScalor(inputs, outputs){
    this.feedForward(inputs);
    var out = this.getOutputs();
    var sum = 0;
    for(var i = 0; i < out.length; ++i){
      var diff = out[i] - outputs[i];
      sum += diff*diff;
    }
    return sum;
  }

  clone(){
    var newnet = new NeuralNetwork(this.layerWidths);
    for(var layerNum = 0; layerNum < this.hiddenLayers.length; ++layerNum){
      var thisLayer = this.hiddenLayers[layerNum];
      var newLayer = newnet.hiddenLayers[layerNum];
      for(var neuronNum = 0; neuronNum < thisLayer.neurons.length; ++neuronNum){
        var thisNeuron = thisLayer.neurons[neuronNum];
        var newNeuron = newLayer.neurons[neuronNum];
        for(var weightNum = 0; weightNum < thisNeuron.weights.length; ++weightNum){
          var thisWeight = thisNeuron.weights[weightNum];
          newNeuron.weights[weightNum] = thisWeight;
        }
        var thisBias = thisNeuron.bias;
        newNeuron.bias = thisBias;
      }
    }
    return newnet;
  }
}
