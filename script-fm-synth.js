// Param
export class OperatorParam {
  constructor(
    volume,
    ratio
  ) {
    this.volume = volume;
    this.ratio = ratio;
  }
}

export class FMSynthParam {
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

// Synth
export class MasterPhase {
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

export class Phase {
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

export class Operator {
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

export class FMSynth {
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
