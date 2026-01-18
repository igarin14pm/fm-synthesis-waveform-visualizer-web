// Params
class OperatorParam {
  constructor(
    volume,
    ratio
  ) {
    this.volume = volume;
    this.ratio = ratio;
  }
}

class FMSynthParam {
  constructor(
    samplingRate,
    waveFrequency,
    modulator,
    carrier,
    outputVolume
  ) {
    this.samplingRate = samplingRate;
    this.waveFrequency = waveFrequency;
    this.modulator = modulator;
    this.carrier = carrier;
    this.outputVolume = outputVolume;
  }
}

class MasterPhase {
  constructor(fmSynthParam) {
    this.fmSynthParam = fmSynthParam;
    this.value = 0.0;
  }
  
  getDeltaPhase() {
    return this.fmSynthParam.waveFrequency / this.fmSynthParam.samplingRate;
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
  constructor(operatorParam) {
    this.operatorParam = operatorParam;
    this.value = 0.0;
    this.oldValue = 0.0;
    this.modulatorInput = 0.0;
  }
  
  isLooped() {
    return this.value < this.oldValue;
  }
  
  getValue() {
    return this.value + this.modulatorInput / 4;
  }
    
  setMasterPhase(newValue) {
    this.oldValue = this.value;
    this.value = newValue * this.operatorParam.ratio;
    this.value -= Math.floor(this.value);
  }
  
  setModulatorInput(newValue) {
    this.modulatorInput = newValue;
  }

}

class Operator {
  constructor(operatorParam) {
    this.operatorParam = operatorParam;
    this.value = 0.0;
    this.phase = new Phase(operatorParam);
  }
  
  getOutput() {
    return (this.operatorParam.volume / 100) * Math.sin(2 * Math.PI * this.phase.getValue());
  }
  
  setInput(newValue) {
    this.phase.setModulatorInput(newValue);
  }
  
  setPhase(masterPhaseValue) {
    this.phase.setMasterPhase(masterPhaseValue);
  }
  
  setRatio(newValue) {
    this.operatorParam.ratio = newValue;
  }
  
  setVolume(newValue) {
    this.operatorParam.volume = newValue;
  }
}

class FMSynth {
  constructor(fmSynthParam) {
    this.fmSynthParam = fmSynthParam;
    this.masterPhase = new MasterPhase(fmSynthParam);
    this.modulator = new Operator(fmSynthParam.modulator);
    this.carrier = new Operator(fmSynthParam.carrier);
  }
  
  getOutput() {
    return this.carrier.getOutput() * this.fmSynthParam.outputVolume;
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
    
    let fmSynthParam = new FMSynthParam(
      sampleRate,
      440,
      new OperatorParam(1.0, 1),
      new OperatorParam(1.0, 1),
      1
    );
    this.fmSynth = new FMSynth(fmSynthParam);
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
