class MasterPhase {
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

class Phase {
  constructor() {
    this.value = 0.0;
  }
    
  set(masterPhaseValue) {
    this.value = masterPhaseValue;
    this.value -= Math.floor(this.value);
  }
}

class Operator {
  constructor() {
    this.value = 0.0;
    this.phase = new Phase();
  }
  
  getOutput() {
    return Math.sin(2 * Math.PI * this.phase.value);
  }
  
  set(masterPhaseValue) {
    this.phase.set(masterPhaseValue);
  }
}

class PhaseGraph {
  constructor(element) {
    this.element = element;
    this.width = element.width;
    this.height = element.height;
    this.phase = 0;
  }
  
  set(phase) {
    this.phase = phase;
  }
  
  draw() {
    let circleCenterX = this.width / 3;
    let circleCenterY = this.height / 2;
    let circleRadius = this.height / 2;
    if (this.element.getContext) {
      let context = this.element.getContext('2d');
      context.beginPath();
      context.arc(circleCenterX, circleCenterY, circleRadius, 0, Math.PI * 2);
      context.moveTo(circleCenterX, circleCenterY);
      context.lineTo(
        circleRadius * Math.cos(2 * Math.PI * this.phase) + circleCenterX, 
        -1 * circleRadius * Math.sin(2 * Math.PI * this.phase) + circleCenterY
      );
      context.lineTo(
        this.width,
        -1 * circleRadius * Math.sin(2 * Math.PI * this.phase) + circleCenterY
      );
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

class WaveformGraphData {
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
    this.data = new WaveformGraphData();
    this.width = element.width;
    this.height = element.height;
  }
  
  draw() {
    if (this.element.getContext) {
      let context = this.element.getContext('2d');
      context.beginPath();
      for (let i = 0; i < this.data.VALUES_LENGTH; i++) {
        let x = (i / (this.data.VALUES_LENGTH - 1)) * this.width;
        let y = (-(this.data.values[i]) + 1.0) / 2.0 * this.height;
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

class OperatorUI {
  constructor(phaseGraphElement, waveformGraphElement) {
    this.operator = new Operator();
    this.phaseGraph = new PhaseGraph(phaseGraphElement);
    this.waveformGraph = new WaveformGraph(waveformGraphElement);
    
    this.phaseGraph.update();
    this.waveformGraph.update();
  }
  
  set(masterPhaseValue) {
    this.operator.set(masterPhaseValue);
  }
  
  moveFrameForward() {
    this.phaseGraph.set(this.operator.phase.value);
    this.phaseGraph.update();
    
    this.waveformGraph.data.add(this.operator.getOutput());
    this.waveformGraph.update();
  }
}

let synth = {
  masterPhase: new MasterPhase(),
  modulatorUI: new OperatorUI(
    document.getElementById('phase-graph-modulator'),
    document.getElementById('waveform-graph-modulator')
  ),
  moveFrameForward: function() {
    this.masterPhase.moveFrameForward();
    
    this.modulatorUI.set(this.masterPhase.value);
    this.modulatorUI.moveFrameForward();
  }
}

// UI

let modulatorVolumeControl = {
  input: document.getElementById('modulator-volume'),
  value: document.getElementById('modulator-volume-value'),
  updateValue: function() {
    this.value.textContent = this.input.value;
  },
  addEventListener: function() {
    this.input.addEventListener('input', () => {
      this.updateValue()
    });
  },
  setUp: function() {
    this.updateValue();
    this.addEventListener();
  }
}

let modulatorRatioControl = {
  input: document.getElementById('modulator-ratio'),
  value: document.getElementById('modulator-ratio-value'),
  updateValue: function() {
    this.value.textContent = this.input.value;
  },
  addEventListener: function() {
    this.input.addEventListener('input', () => {
      this.updateValue();
    })
  },
  setUp: function() {
    this.updateValue();
    this.addEventListener();
  }
}

function setUp() {
  // UI
  modulatorVolumeControl.setUp();  
  modulatorRatioControl.setUp();
  
  // Synth
  let synthFrameCallback = function() {
    synth.moveFrameForward();
  }
  let intervalID = setInterval(synthFrameCallback, 1000 / 60);
}

setUp();
