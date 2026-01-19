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
    this.outputSignal = new Signal(0);
  }
  
  getDeltaPhase() {
    return this.fmSynthParam.waveFrequency / this.fmSynthParam.samplingRate;
  }
  
  getOutput() {
    return this.outputSignal;
  }
  
  moveFrameForward() {
    this.outputSignal.value += this.getDeltaPhase();
    this.outputSignal.value -= Math.floor(this.outputSignal.getValue());
  }
}

export class Phase {
  constructor(masterPhaseSignal, operatorParam, modulatorSignal) {
    this.masterPhaseSignal = masterPhaseSignal;
    this.operatorParam = operatorParam;
    this.modulatorSignal = modulatorSignal;
    this.rawOutputSignal = new Signal(0);
    this.oldRawOutputSignal = new Signal(0);
    this.outputSignal = new Signal(0);
  }
  
  isLooped() {
    return this.rawOutputSignal.value < this.oldRawOutputSignal.value;
  }
  
  getOutput() {
    if (this.modulatorSignal != null) {
      this.outputSignal.value = this.rawOutputSignal.value + (this.modulatorSignal.value / 4);
    } else {
      this.outputSignal.value = this.rawOutputSignal.value;
    }
    return this.outputSignal;
  }
  
  moveFrameForward() {
    this.oldRawOutputSignal.value = this.rawOutputSignal.value;
    this.rawOutputSignal.value = this.masterPhaseSignal.value * this.operatorParam.ratio;
    this.rawOutputSignal.value -= Math.floor(this.rawOutputSignal.value);
  }

}

export class Operator {
  constructor(operatorParam, masterPhaseSignal, modulatorSignal) {
    this.operatorParam = operatorParam;
    this.outputSignal = new Signal(0);
    this.phase = new Phase(masterPhaseSignal, operatorParam, modulatorSignal);
  }
  
  getOutput() {
    return this.outputSignal;
  }
  
  moveFrameForward() {
    this.phase.moveFrameForward();
    this.outputSignal.value = (this.operatorParam.volume / 100) * Math.sin(2 * Math.PI * this.phase.getOutput().value);
  }
}

export class FMSynth {
  constructor(fmSynthParam) {
    this.fmSynthParam = fmSynthParam;
    this.masterPhase = new MasterPhase(fmSynthParam);
    this.modulator = new Operator(fmSynthParam.modulator, this.masterPhase.getOutput(), null);
    this.carrier = new Operator(fmSynthParam.carrier, this.masterPhase.getOutput(), this.modulator.getOutput());
  }
  
  getOutput() {
    return this.carrier.getOutput().getValue() * this.fmSynthParam.outputVolume;
  }
  
  moveFrameForward() {
    this.masterPhase.moveFrameForward();
    
    this.modulator.moveFrameForward();
    
    this.carrier.moveFrameForward();
  }
}
