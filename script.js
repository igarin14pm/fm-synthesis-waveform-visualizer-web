import { OperatorParam, FMSynthParam, FMSynth } from './script-fm-synth.js'

class PhaseGraph {
  constructor(element, operatorParam) {
    this.element = element;
    this.width = element.width;
    this.height = element.height;
    this.phase = 0;
    this.operatorParam = operatorParam;
  }
  
  setPhase(phase) {
    this.phase = phase;
  }
  
  draw() {
    let circleCenterX = this.width / 3;
    let circleCenterY = this.height / 2;
    let circleRadius = this.height / 2 * this.operatorParam.volume;
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
  constructor(operator, operatorParam, phaseGraphElement, waveformGraphElement) {
    this.operator = operator;
    this.operatorParam = operatorParam;
    this.phaseGraph = new PhaseGraph(phaseGraphElement, this.operatorParam);
    this.waveformGraph = new WaveformGraph(waveformGraphElement);
    
    this.phaseGraph.update();
    this.waveformGraph.update();
  }
  
  moveFrameForward() {
    this.phaseGraph.setPhase(this.operator.phase.getOutput().value);
    this.phaseGraph.update();
    
    this.waveformGraph.data.add(this.operator.getOutput().value);
    this.waveformGraph.update();
  }
}

const WAVEFORM_GRAPH_SAMPLING_RATE = 60;
const WAVEFORM_GRAPH_WAVE_FREQUENCY = 0.5;

class FMSynthUI {
  constructor(
    fmSynthParam,
    modulatorElements,
    carrierElements
  ) {
    this.fmSynthParam = fmSynthParam;
    this.fmSynth = new FMSynth(this.fmSynthParam);
    this.modulatorUI = new OperatorUI(
      this.fmSynth.modulator,
      this.fmSynth.fmSynthParam.modulator,
      modulatorElements.phaseGraph,
      modulatorElements.waveformGraph
    );
    this.carrierUI = new OperatorUI(
      this.fmSynth.carrier,
      this.fmSynth.fmSynthParam.carrier,
      carrierElements.phaseGraph,
      carrierElements.waveformGraph
    )
  }
  
  moveFrameForward() {
    this.fmSynth.moveFrameForward();
    
    this.modulatorUI.moveFrameForward();
    
    this.carrierUI.moveFrameForward();
  }
}

let fmSynthUI = new FMSynthUI(
  new FMSynthParam(
    WAVEFORM_GRAPH_SAMPLING_RATE,
    WAVEFORM_GRAPH_WAVE_FREQUENCY,
    new OperatorParam(1, 1),
    new OperatorParam(1, 1),
    1
  ),
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
      fmSynthUI.fmSynthParam.modulator.volume = synthUIParam.modulator.volume / synthUIParam.modulator.maxVolume;
      
      if (audioContext != null && audioWorkletNode != null) {
        const modulatorVolumeParam = audioWorkletNode.parameters.get('modulatorVolume');
        modulatorVolumeParam.setValueAtTime(fmSynthUI.fmSynthParam.modulator.volume, audioContext.currentTime);
      }
    });
  },
  setUp: function() {
    this.input.value = fmSynthUI.fmSynthParam.modulator.volume * synthUIParam.modulator.maxVolume;
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
      fmSynthUI.fmSynthParam.modulator.ratio = synthUIParam.modulator.ratio;
      
      if (audioContext != null && audioWorkletNode != null) {
        const modulatorRatioParam = audioWorkletNode.parameters.get('modulatorRatio');
        modulatorRatioParam.setValueAtTime(synthUIParam.modulator.ratio, audioContext.currentTime);
      }
    })
  },
  setUp: function() {
    this.input.value = fmSynthUI.fmSynthParam.modulator.ratio;
    this.updateValue();
    this.addEventListener();
  }
}

let carrierAngularVelocityIndicator = {
  element: document.getElementById('carrier-angular-velocity-meter'),
  phase: [null, null], 
  moveFrameForward: function() {
    this.phase.pop();
    this.phase.splice(0, 0, fmSynthUI.fmSynth.carrier.phase.getOutput().value);
    if (this.phase[0] != null && this.phase[1] != null) {
      let value = this.phase[0] - this.phase[1];
      if (fmSynthUI.fmSynth.carrier.phase.isLooped()) {
        value += 1;
      }
      this.element.value = value;
    }
  }
}

let audioContext = null;
let audioWorkletNode = null;

async function startAudio() {
  audioContext = new AudioContext();
  await audioContext.audioWorklet.addModule('script-audio-processor.js');
  audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
  
  const modulatorVolumeParam = audioWorkletNode.parameters.get('modulatorVolume');
  modulatorVolumeParam.setValueAtTime(synthUIParam.modulator.volume / synthUIParam.modulator.maxVolume, audioContext.currentTime);
  const modulatorRatioParam = audioWorkletNode.parameters.get('modulatorRatio');
  modulatorRatioParam.setValueAtTime(synthUIParam.modulator.ratio, audioContext.currentTime);
  
  audioWorkletNode.connect(audioContext.destination);
}

function stopAudio() {
  if (audioContext != null) {
    audioContext.close();
  }
  audioContext = null;
  audioWorkletNode = null;
}

function setUp() {
  // Audio
  document.getElementById('start-audio-button').addEventListener('click', function() {
    if (audioContext == null) {
      startAudio();
    }
  });
  document.getElementById('stop-audio-button').addEventListener('click', function() {
    stopAudio();
  });
  
  // UI
  modulatorVolumeControl.setUp();  
  modulatorRatioControl.setUp();
  
  // Synth
  let synthFrameCallback = function() {
    fmSynthUI.moveFrameForward();
    carrierAngularVelocityIndicator.moveFrameForward();
  }
  let intervalID = setInterval(synthFrameCallback, 1000 / 60);
}

setUp();
