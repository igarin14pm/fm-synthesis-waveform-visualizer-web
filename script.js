import { FMSynth } from './script-fm-synth.js'

// Global Values

const SAMPLING_RATE = 60;
const WAVE_FREQUENCY = 0.5;
const OUTPUT_VOLUME = 1;

// Audio

class AudioEngine {
  
  audioContext = null;
  audioWorkletNode = null;
  
  get isRunning() {
    return this.audioContext != null && this.audioWorkletNode != null;
  }
  
  async start() {
    this.audioContext = new AudioContext();
    await this.audioContext.audioWorklet.addModule('script-audio-processor.js');
    this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
    
    const modulatorVolumeParam = this.audioWorkletNode.parameters.get('modulatorVolume');
    modulatorVolumeParam.setValueAtTime(synthUIParam.modulator.volume / synthUIParam.modulator.maxVolume, this.audioContext.currentTime);
    
    const modulatorRatioParam = this.audioWorkletNode.parameters.get('modulatorRatio');
    modulatorRatioParam.setValueAtTime(synthUIParam.modulator.ratio, this.audioContext.currentTime);
    
    this.audioWorkletNode.connect(this.audioContext.destination);
  }
  
  stop() {
    this.audioContext.close();
    this.audioContext = null;
    this.audioWorkletNode = null;
  }
  
}

let audioEngine = new AudioEngine();

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

let fmSynth = new FMSynth(SAMPLING_RATE, WAVE_FREQUENCY, OUTPUT_VOLUME);

let fmSynthUI = new FMSynthUI(
  fmSynth,
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

let synthUIParam = {
  
  modulator: {
    
    ratio: 1,
    volume: 100,
    maxVolume: 100
    
  },
  
}

let modulatorVolumeControl = {
  
  input: document.getElementById('modulator-volume'),
  value: document.getElementById('modulator-volume-value'),
  
  updateValue: function() {
    this.value.textContent = synthUIParam.modulator.volume;
  },
  
  addEventListener: function() {
    this.input.addEventListener('input', () => {
      synthUIParam.modulator.volume = this.input.value;
      this.updateValue();
      fmSynth.modulator.volume = synthUIParam.modulator.volume / synthUIParam.modulator.maxVolume;
      
      if (audioEngine.isRunning) {
        const modulatorVolumeParam = audioEngine.audioWorkletNode.parameters.get('modulatorVolume');
        modulatorVolumeParam.setValueAtTime(synthUIParam.modulator.volume / synthUIParam.modulator.maxVolume, audioEngine.audioContext.currentTime);
      }
    });
  },
  
  setUp: function() {
    this.input.value = fmSynth.modulator.volume * synthUIParam.modulator.maxVolume;
    this.updateValue();
    this.addEventListener();
  }
  
}

let modulatorRatioControl = {
  
  input: document.getElementById('modulator-ratio'),
  value: document.getElementById('modulator-ratio-value'),
  
  updateValue: function() {
    this.value.textContent = synthUIParam.modulator.ratio;
  },
  
  addEventListener: function() {
    this.input.addEventListener('input', () => {
      synthUIParam.modulator.ratio = this.input.value;
      this.updateValue();
      fmSynth.modulator.ratio = synthUIParam.modulator.ratio;
      
      if (audioEngine.isRunning) {
        const modulatorRatioParam = audioEngine.audioWorkletNode.parameters.get('modulatorRatio');
        modulatorRatioParam.setValueAtTime(synthUIParam.modulator.ratio, audioEngine.audioContext.currentTime);
      }
    })
  },
  
  setUp: function() {
    this.input.value = fmSynth.modulator.ratio;
    this.updateValue();
    this.addEventListener();
  }
  
}

let carrierAngularVelocityIndicator = {
  
  element: document.getElementById('carrier-angular-velocity-meter'),
  phase: [null, null], 
  
  moveFrameForward: function() {
    this.phase.pop();
    this.phase.splice(0, 0, fmSynth.carrier.phase.output.value);
    if (this.phase[0] != null && this.phase[1] != null) {
      let value = this.phase[0] - this.phase[1];
      if (fmSynth.carrier.phase.isLooped) {
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
