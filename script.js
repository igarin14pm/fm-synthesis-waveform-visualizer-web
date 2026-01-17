class Phase {
  constructor() {
    this.value = 0.0;
    this.samplingRate = 60.0;
    this.frequency = 0.5;
  }
    
  getDeltaPhase() {
    return this.frequency / this.samplingRate;
  }
  
  moveFrameForward() {
    this.value += this.getDeltaPhase();
    this.value -= Math.floor(this.value);
  }
}

class WaveGenerator {
  constructor() {
    this.value = 0.0;
    this.phase = new Phase();
  }
  
  getOutput() {
    return Math.sin(2 * Math.PI * this.phase.value);
  }
  
  moveFrameForward() {
    this.phase.moveFrameForward();
  }
}

class Wave {
  constructor() {
    this.VALUES_LENGTH = 240;
    
    let values = new Array(this.VALUES_LENGTH);
    values.fill(0.0);
    this.values = values;
  }
  
  add(value) {
    this.values.pop();
    this.values.splice(0, 0, value);
  }
}

class WaveformGraph {
  constructor(element) {
    this.element = element;
    this.wave = new Wave();
    this.width = element.width;
    this.height = element.height;
  }
  
  draw() {
    if (this.element.getContext) {
      let context = this.element.getContext('2d');
      context.beginPath();
      for (let i = 0; i < this.wave.VALUES_LENGTH; i++) {
        let x = (i / (this.wave.VALUES_LENGTH - 1)) * this.width;
        let y = (-(this.wave.values[i]) + 1.0) / 2.0 * this.height;
        if (i == 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.stroke();
    }
  }
  
  clear() {
    if (this.element.getContext) {
      let context = this.element.getContext('2d');
      context.clearRect(0, 0, this.element.width, this.element.height);
    }
  }
  
  update() {
    this.clear();
    this.draw();
  }
}

class Operator {
  constructor(waveformGraphElement) {
    this.waveGenerator = new WaveGenerator();
    this.waveformGraph = new WaveformGraph(waveformGraphElement);
    
    this.waveformGraph.update();
  }
  
  moveFrameForward() {
    this.waveGenerator.moveFrameForward();
    this.waveformGraph.wave.add(this.waveGenerator.getOutput());
    this.waveformGraph.update();
  }
}

let operator = new Operator(document.getElementById('waveform-graph-test'));

let synthFrameCallback = function() {
  operator.moveFrameForward();
}
let intervalID = setInterval(synthFrameCallback, 1000 / 60);
