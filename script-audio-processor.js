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
  
  static get parameterDescriptors() {
    return [
      {
        name: 'modulatorVolume',
        defaultValue: 100,
        minValue: 0,
        maxValue: 100,
        automationRate: 'a-rate'
      },
      {
        name: 'modulatorRatio',
        defaultValue: 1,
        minValue: 1,
        maxValue: 10,
        automationRate: 'a-rate'
      }
    ];
  }
  
  process(inputs, outputs, parameters) {
    
    let output = outputs[0];
    let channel = output[0];
    
    for (let i = 0; i < channel.length; i++) { 
      let volumeParameter = parameters['modulatorVolume'];
      this.fmSynth.modulator.setVolume(
        volumeParameter.length > 1 ? volumeParameter[i] : volumeParameter[0]
      );
        
      
      let ratioParameter = parameters['modulatorRatio'];
      this.fmSynth.modulator.setRatio(
        ratioParameter.length > 1 ? ratioParameter[i] : ratioParameter[0]
      );
      
      channel[i] = this.fmSynth.getOutput();
      this.fmSynth.moveFrameForward();
    }
    
    return true;
  }
  
}

registerProcessor('audio-processor', AudioProcessor);
