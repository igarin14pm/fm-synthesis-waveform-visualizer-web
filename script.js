import { FMSynth } from './script-fm-synth.js'

// Value

class OperatorValue {
  
  constructor(
    volumeParameterName, 
    volumeValue,
    ratioParameterName,
    ratioValue
  ) {
    this.volumeParameterName = volumeParameterName;
    this.volumeValue = volumeValue;
    this.ratioParameterName = ratioParameterName;
    this.ratioValue = ratioValue;
  }
  
  get volumeUIValue() {
    return this.volumeValue * 100;
  }
  
  set volumeUIValue(newValue) {
    this.volumeValue = newValue / 100;
  }
  
  get ratioUIValue() {
    return this.ratioValue;
  }
  
  set ratioUIValue(newValue) {
    this.ratioValue = newValue;
  }
  
}

// Audio

class AudioEngine {
  
  constructor(modulatorValue) {
    this.modulatorValue = modulatorValue;
  }
    
  audioContext = null;
  audioWorkletNode = null;
  
  get isRunning() {
    return this.audioContext != null && this.audioWorkletNode != null;
  }
  
  setParameterValue(name, value) {
    const param = this.audioWorkletNode.parameters.get(name);
    param.setValueAtTime(value, this.audioContext.currentTime);
  }
  
  async start() {
    this.audioContext = new AudioContext();
    await this.audioContext.audioWorklet.addModule('script-audio-processor.js');
    this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
    
    this.setParameterValue(
      modulatorValue.volumeParameterName, 
      modulatorValue.volumeValue
    );
    this.setParameterValue(
      modulatorValue.ratioParameterName,
      modulatorValue.ratioValue
    );
    this.audioWorkletNode.connect(this.audioContext.destination);
  }
  
  stop() {
    this.audioContext.close();
    this.audioContext = null;
    this.audioWorkletNode = null;
  }
  
}

// UI Classes

class PhaseGraph {
  
  constructor(element, operator) {
    this.element = element;
    this.operator = operator;
    this.phaseSignal = this.operator.phase.output;
  }
  
  get width() {
    return this.element.width;
  }
  
  get height() {
    return this.element.height;
  }
  
  draw() {
    let circleCenterX = this.width / 3;
    let circleCenterY = this.height / 2;
    let circleRadius = this.height / 2 * this.operator.volume;
    if (this.element.getContext) {
      let context = this.element.getContext('2d');
      context.beginPath();
      context.arc(circleCenterX, circleCenterY, circleRadius, 0, Math.PI * 2);
      context.moveTo(circleCenterX, circleCenterY);
      context.lineTo(
        circleRadius * Math.cos(2 * Math.PI * this.phaseSignal.value) + circleCenterX, 
        -1 * circleRadius * Math.sin(2 * Math.PI * this.phaseSignal.value) + circleCenterY
      );
      context.lineTo(
        this.width,
        -1 * circleRadius * Math.sin(2 * Math.PI * this.phaseSignal.value) + circleCenterY
      );
      context.stroke();
    }
  }
  
  clear() {
    if (this.element.getContext) {
      let context = this.element.getContext('2d');
      context.clearRect(0, 0, this.width, this.height);
    }
  }
  
  update() {
    this.clear();
    this.draw();
  }
  
}

class WaveformGraphData {
  
  constructor() {
    const numberOfWaves = 4
    this.valueLength = SAMPLING_RATE * numberOfWaves;
    
    let values = new Array(this.valueLength);
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
  }
  
  data = new WaveformGraphData();
  
  get width() {
    return this.element.width;
  }
  
  get height() {
    return this.element.height;
  }
  
  draw() {
    if (this.element.getContext) {
      let context = this.element.getContext('2d');
      context.beginPath();
      for (let i = 0; i < this.data.valueLength; i++) {
        let x = (i / (this.data.valueLength - 1)) * this.width;
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
  
  constructor(operator, phaseGraphElement, waveformGraphElement) {
    this.operator = operator;
    this.phaseGraph = new PhaseGraph(phaseGraphElement, this.operator);
    this.waveformGraph = new WaveformGraph(waveformGraphElement);
    
    this.phaseGraph.update();
    this.waveformGraph.update();
  }
  
  moveFrameForward() {
    this.phaseGraph.update();
    
    this.waveformGraph.data.add(this.operator.output.value);
    this.waveformGraph.update();
  }
  
}

class FMSynthUI {
  
  constructor(
    fmSynth,
    modulatorElements,
    carrierElements
  ) {
    this.fmSynth = fmSynth;
    this.modulatorUI = new OperatorUI(
      this.fmSynth.modulator,
      modulatorElements.phaseGraph,
      modulatorElements.waveformGraph
    );
    this.carrierUI = new OperatorUI(
      this.fmSynth.carrier,
      carrierElements.phaseGraph,
      carrierElements.waveformGraph
    );
  }
  
  moveFrameForward() {
    this.fmSynth.moveFrameForward();
    
    this.modulatorUI.moveFrameForward();
    
    this.carrierUI.moveFrameForward();
  }
  
}

const SAMPLING_RATE = 60;
const WAVE_FREQUENCY = 0.5;
const OUTPUT_VOLUME = 1;

let modulatorValue = new OperatorValue(
  'modulatorVolume',
  1,
  'modulatorRatio',
  1
);

let audioEngine = new AudioEngine(modulatorValue);

let visualFMSynth = new FMSynth(SAMPLING_RATE, WAVE_FREQUENCY, OUTPUT_VOLUME);

let fmSynthUI = new FMSynthUI(
  visualFMSynth,
  {
    phaseGraph: document.getElementById('phase-graph-modulator'),
    waveformGraph: document.getElementById('waveform-graph-modulator')
  },
  {
    phaseGraph: document.getElementById('phase-graph-carrier'),
    waveformGraph: document.getElementById('waveform-graph-carrier')
  }
);

// UI

let modulatorVolumeControl = {
  
  input: document.getElementById('modulator-volume'),
  value: document.getElementById('modulator-volume-value'),
  
  updateValue: function() {
    this.value.textContent = Math.round(modulatorValue.volumeUIValue);
  },
  
  addEventListener: function() {
    this.input.addEventListener('input', () => {
      modulatorValue.volumeUIValue = this.input.value;
      this.updateValue();
      
      visualFMSynth.modulator.volume = modulatorValue.volumeValue;
      
      if (audioEngine.isRunning) {
        audioEngine.setParameterValue(modulatorValue.volumeParameterName, modulatorValue.volumeValue);
      }
    });
  },
  
  setUp: function() {
    this.input.value = Math.round(modulatorValue.volumeUIValue);
    this.updateValue();
    this.addEventListener();
  }
  
}

let modulatorRatioControl = {
  
  input: document.getElementById('modulator-ratio'),
  value: document.getElementById('modulator-ratio-value'),
  
  updateValue: function() {
    this.value.textContent = modulatorValue.ratioUIValue;
  },
  
  addEventListener: function() {
    this.input.addEventListener('input', () => {
      modulatorValue.ratioUIValue = this.input.value;
      this.updateValue();
      visualFMSynth.modulator.ratio = modulatorValue.ratioValue;
      
      if (audioEngine.isRunning) {
        audioEngine.setParameterValue(modulatorValue.ratioParameterName, modulatorValue.ratioValue);
      }
    })
  },
  
  setUp: function() {
    this.input.value = visualFMSynth.modulator.ratio;
    this.updateValue();
    this.addEventListener();
  }
  
}

let carrierAngularVelocityIndicator = {
  
  element: document.getElementById('carrier-angular-velocity-meter'),
  phase: [null, null], 
  
  moveFrameForward: function() {
    this.phase.pop();
    this.phase.splice(0, 0, visualFMSynth.carrier.phase.output.value);
    if (this.phase[0] != null && this.phase[1] != null) {
      let value = this.phase[0] - this.phase[1];
      if (visualFMSynth.carrier.phase.isLooped) {
        value += 1;
      }
      this.element.value = value;
    }
  }
  
}

function setUp() {
  
  // Audio
  
  document.getElementById('start-audio-button').addEventListener('click', function() {
    if (!audioEngine.isRunning) {
      audioEngine.start();
    }
  });
  document.getElementById('stop-audio-button').addEventListener('click', function() {
    if (audioEngine.isRunning) {
      audioEngine.stop();
    }
  });
  
  // UI
  
  modulatorVolumeControl.setUp();  
  modulatorRatioControl.setUp();
  
  // Synth
  
  let synthFrameCallback = function() {
    fmSynthUI.moveFrameForward();
    carrierAngularVelocityIndicator.moveFrameForward();
  }
  const oneSecond_ms = 1000;
  let intervalID = setInterval(synthFrameCallback, oneSecond_ms / SAMPLING_RATE);
  
}

setUp();
