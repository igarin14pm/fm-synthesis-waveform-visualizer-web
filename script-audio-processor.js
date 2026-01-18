const SAMPLING_RATE = 44100;
const WAVE_FREQUENCY = 440;
const OPERATOR_INITIAL_VOLUME = 100;
const OPERATOR_INITIAL_RATIO = 1;

class MasterPhase {
  constructor(samplingRate, waveFrequency) {
    this.samplingRate = samplingRate;
    this.waveFrequency = waveFrequency;
    this.value = 0.0;
  }
  
  getDeltaPhase() {
    return this.waveFrequency / this.samplingRate;
  }
  
  getValue() {
    return this.value;
  }
  
  moveFrameForward() {
    this.value += this.getDeltaPhase();
    this.value -= Math.floor(this.value);
  }
}

class Phase {
  constructor() {
    this.value = 0.0;
    this.oldValue = 0.0;
    this.modulatorInput = 0.0;
    this.ratio = OPERATOR_INITIAL_RATIO;
  }
  
  isLooped() {
    return this.value < this.oldValue;
  }
  
  getValue() {
    return this.value + this.modulatorInput / 4;
  }
    
  setMasterPhase(newValue) {
    this.oldValue = this.value;
    this.value = newValue * this.ratio;
    this.value -= Math.floor(this.value);
  }
  
  setModulatorInput(newValue) {
    this.modulatorInput = newValue;
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
    return (this.volume / 100) * Math.sin(2 * Math.PI * this.phase.getValue());
  }
  
  setInput(newValue) {
    this.phase.setModulatorInput(newValue);
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

class FMSynth {
  constructor(samplingRate, waveFrequency) {
    this.samplingRate = samplingRate;
    this.waveFrequency = waveFrequency;
    
    this.masterPhase = new MasterPhase(samplingRate, waveFrequency);
    this.modulator = new Operator();
    this.carrier = new Operator();
  }
  
  getOutput() {
    return this.carrier.getOutput();
  }
  
  moveFrameForward() {
    this.masterPhase.moveFrameForward();
    
    this.modulator.setPhase(this.masterPhase.getValue());
    
    this.carrier.setInput(this.modulator.getOutput());
    this.carrier.setPhase(this.masterPhase.getValue());
  }
}

class AudioProcessor extends AudioWorkletProcessor {
  
  constructor() {
    super();
    this.fmSynth = new FMSynth(sampleRate, WAVE_FREQUENCY);
  }
  
  process(inputs, outputs, parameters) {
    
    let output = outputs[0];
    let channel = output[0];
    
    for (let i = 0; i < channel.length; i++) {
      channel[i] = this.fmSynth.getOutput();
      this.fmSynth.moveFrameForward();
    }
    
    return true;
  }
  
}

registerProcessor('audio-processor', AudioProcessor);
