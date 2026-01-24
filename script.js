import { FMSynth } from './script-fm-synth.js'

// Value Class

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

// Audio Class

class AudioEngine {
    
  audioContext = null;
  audioWorkletNode = null;
  
  get isRunning() {
    return this.audioContext != null && this.audioWorkletNode != null;
  }
  
  setParameterValue(name, value) {
    const param = this.audioWorkletNode.parameters.get(name);
    param.setValueAtTime(value, this.audioContext.currentTime);
  }
  
  async start(modulatorValue) {
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

class RangeInputUI {
  
  constructor(inputElement, valueLabelElement, initialValue) {
    this.inputElement = inputElement;
    this.valueLabelElement = valueLabelElement;
    
    this.inputElement.value = initialValue;
    this.valueLabelElement.textContent = initialValue;
  }
  
  get value() {
    return this.inputElement.value;
  }
  
  updateLabel() {
    this.valueLabelElement.textContent = this.inputElement.value;
  }
  
  addEventListener(listener) {
    this.inputElement.addEventListener('input', () => {
      listener();
      this.updateLabel();
    })
  }
  
}

class MeterUI {
  
  constructor(meterElement, initialValue, minValue, maxValue) {
    this.meterElement = meterElement;
    this.meterElement.value = initialValue;
    this.meterElement.min = minValue;
    this.meterElement.max = maxValue;
  }
  
  get value() {
    return this.meterElement.value;
  }
  
  set value(newValue) {
    this.meterElement.value = newValue;
  }

}

class AngularVelocityMeterUI {
  
  constructor(phase, meterElement, minValue, maxValue) {
    this.phase = phase;
    this.phaseValues = [this.phase.output.value, this.phase.output.value];
    this.meterUI = new MeterUI(meterElement, this.phase.output.value, minValue, maxValue);
  }
  
  moveFrameForward() {
    this.phaseValues.pop();
    this.phaseValues.splice(0, 0, this.phase.output.value);
    let newValue = this.phaseValues[0] - this.phaseValues[1];
    if (this.phase.isLooped) {
      newValue += 1;
    }
    this.meterUI.value = newValue;
  }
  
}

// Script

const SAMPLING_RATE = 120;
const WAVE_FREQUENCY = 0.5;
const OUTPUT_VOLUME = 1;

let modulatorValue = new OperatorValue(
  'modulatorVolume',
  1,
  'modulatorRatio',
  1
);

let audioEngine = new AudioEngine();

let visualFMSynth = new FMSynth(SAMPLING_RATE, WAVE_FREQUENCY, OUTPUT_VOLUME);

let modulatorVolumeInputUI = new RangeInputUI(
  document.getElementById('modulator-volume-input'),
  document.getElementById('modulator-volume-value-label'),
  modulatorValue.volumeUIValue
);

let modulatorRatioInputUI = new RangeInputUI(
  document.getElementById('modulator-ratio-input'),
  document.getElementById('modulator-ratio-value-label'),
  modulatorValue.ratioUIValue
);

let modulatorUI = new OperatorUI(
  visualFMSynth.modulator,
  document.getElementById('modulator-phase-graph'),
  document.getElementById('modulator-waveform-graph')
);

let carrierAngularVelocityMeter = new AngularVelocityMeterUI(
  visualFMSynth.carrier.phase,
  document.getElementById('carrier-angular-velocity-meter'),
  -0.3,
  0.3
);

let carrierUI = new OperatorUI(
  visualFMSynth.carrier,
  document.getElementById('carrier-phase-graph'),
  document.getElementById('carrier-waveform-graph')
)

function moveFrameForward() {
  let frameUpdateQueue = [visualFMSynth, modulatorUI, carrierAngularVelocityMeter, carrierUI];
  frameUpdateQueue.forEach((object) => {
    object.moveFrameForward();
  });
}

function setUp() {
  
  function setModulatorVolume() {
    modulatorValue.volumeUIValue = modulatorVolumeInputUI.value;
    
    visualFMSynth.modulator.volume = modulatorValue.volumeValue;
    if (audioEngine.isRunning) {
      audioEngine.setParameterValue(modulatorValue.volumeParameterName, modulatorValue.volumeValue);
    }
  }
  
  function setModulatorRatio() {
    modulatorValue.ratioUIValue = modulatorRatioInputUI.value;
    
    visualFMSynth.modulator.ratio = modulatorValue.ratioValue;
    if (audioEngine.isRunning) {
      audioEngine.setParameterValue(modulatorValue.ratioParameterName, modulatorValue.ratioValue);
    }
  }
  
  setModulatorVolume();
  setModulatorRatio();
  
  document.getElementById('start-audio-button').addEventListener('click', function() {
    if (!audioEngine.isRunning) {
      audioEngine.start(modulatorValue);
    }
  });
  document.getElementById('stop-audio-button').addEventListener('click', function() {
    if (audioEngine.isRunning) {
      audioEngine.stop();
    }
  });
  
  modulatorVolumeInputUI.addEventListener(function() {
    setModulatorVolume();
  });
  modulatorRatioInputUI.addEventListener(function() {
    setModulatorRatio();
  })
  
  const oneSecond_ms = 1000;
  let intervalID = setInterval(moveFrameForward, oneSecond_ms / SAMPLING_RATE);
  
}

setUp();
