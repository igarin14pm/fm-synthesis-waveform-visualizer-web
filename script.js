const OPERATOR_INITIAL_VOLUME = 100;
const OPERATOR_INITIAL_RATIO = 1;

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
    this.ratio = OPERATOR_INITIAL_RATIO;
  }
  
  getValue() {
    return this.value;
  }
    
  setMasterPhase(newValue) {
    this.value = newValue * this.ratio;
    this.value -= Math.floor(this.value);
  }
  
  setRatio(newValue) {
    this.ratio = newValue;
  }
}

class Operator {
  constructor() {
    this.value = 0.0;
    this.phase = new Phase();
    this.volume = 100;
  }
  
  getOutput() {
    return (this.volume / 100) * Math.sin(2 * Math.PI * this.phase.value);
  }
  
  setPhase(masterPhaseValue) {
    this.phase.setMasterPhase(masterPhaseValue);
  }
  
  setRatio(newValue) {
    this.phase.setRatio(newValue);
  }
  
  setVolume(newValue) {
    this.volume = newValue;
  }
}

class PhaseGraph {
  constructor(element) {
    this.element = element;
    this.width = element.width;
    this.height = element.height;
    this.phase = 0;
    this.volume = OPERATOR_INITIAL_VOLUME;
  }
  
  setPhase(phase) {
    this.phase = phase;
  }
  
  setVolume(newValue) {
    this.volume = newValue;
  }
  
  draw() {
    let circleCenterX = this.width / 3;
    let circleCenterY = this.height / 2;
    let circleRadius = this.height / 2 * this.volume / 100;
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
  
  setPhase(masterPhaseValue) {
    this.operator.setPhase(masterPhaseValue);
  }
  
  setRatio(newValue) {
    this.operator.setRatio(newValue);
  }
  
  setVolume(newValue) {
    this.operator.setVolume(newValue);
    this.phaseGraph.setVolume(newValue);
  }
  
  moveFrameForward() {
    this.phaseGraph.setPhase(this.operator.phase.getValue());
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
  carrierUI: new OperatorUI(
    document.getElementById('phase-graph-carrier'),
    document.getElementById('waveform-graph-carrier')
  ),
  moveFrameForward: function() {
    this.masterPhase.moveFrameForward();
    
    this.modulatorUI.setPhase(this.masterPhase.value);
    this.modulatorUI.moveFrameForward();
    
    this.carrierUI.setPhase(this.masterPhase.value);
    this.carrierUI.moveFrameForward();
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
      this.updateValue();
      synth.modulatorUI.setVolume(this.input.value);
    });
  },
  setUp: function() {
    this.input.value = OPERATOR_INITIAL_VOLUME;
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
      synth.modulatorUI.setRatio(this.input.value);
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
