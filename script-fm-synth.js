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

// Signal
export class Signal {
  constructor(value) {
    this.value = value
  }
  
  getValue() {
    return this.value;
  }
  
  setValue(newValue) {
    this.value = newValue;
  }
}

// Synth
export class MasterPhase {
  constructor(fmSynthParam) {
    this.fmSynthParam = fmSynthParam;
    this.signal = new Signal(0);
  }
  
  getDeltaPhase() {
    return this.fmSynthParam.waveFrequency / this.fmSynthParam.samplingRate;
  }
  
  getOutput() {
    return this.signal;
  }
  
  moveFrameForward() {
    this.signal.value += this.getDeltaPhase();
    this.signal.value -= Math.floor(this.signal.getValue());
  }
}

export class Phase {
  constructor(masterPhaseSignal, operatorParam) {
    this.masterPhaseSignal = masterPhaseSignal;
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
  
  setModulatorInput(newValue) {
    this.modulatorInput = newValue;
  }
  
  moveFrameForward() {
    this.oldValue = this.value;
    this.value = this.masterPhaseSignal.getValue() * this.operatorParam.ratio;
    this.value -= Math.floor(this.value);
  }

}

export class Operator {
  constructor(operatorParam, masterPhaseSignal) {
    this.operatorParam = operatorParam;
    this.value = 0.0;
    this.phase = new Phase(masterPhaseSignal, operatorParam);
  }
  
  getOutput() {
    return (this.operatorParam.volume / 100) * Math.sin(2 * Math.PI * this.phase.getValue());
  }
  
  setInput(newValue) {
    this.phase.setModulatorInput(newValue);
  }
  
  moveFrameForward() {
    this.phase.moveFrameForward();
  }
}

export class FMSynth {
  constructor(fmSynthParam) {
    this.fmSynthParam = fmSynthParam;
    this.masterPhase = new MasterPhase(fmSynthParam);
    this.modulator = new Operator(fmSynthParam.modulator, this.masterPhase.signal);
    this.carrier = new Operator(fmSynthParam.carrier, this.masterPhase.signal);
  }
  
  getOutput() {
    return this.carrier.getOutput() * this.fmSynthParam.outputVolume;
  }
  
  moveFrameForward() {
    this.masterPhase.moveFrameForward();
    
    this.modulator.moveFrameForward();
    
    this.carrier.setInput(this.modulator.getOutput());
    this.carrier.moveFrameForward();
  }
}
