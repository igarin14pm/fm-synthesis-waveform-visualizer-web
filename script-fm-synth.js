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
  constructor(masterPhaseSignal, operatorParam, modulatorSignal) {
    this.masterPhaseSignal = masterPhaseSignal;
    this.operatorParam = operatorParam;
    this.value = 0.0;
    this.oldValue = 0.0;
    this.modulatorSignal = modulatorSignal;
  }
  
  isLooped() {
    return this.value < this.oldValue;
  }
  
  getOutput() {
    if (this.modulatorSignal != null) {
      return this.value + this.modulatorSignal.getValue() / 4;
    } else {
      return this.value
    }    
  }
  
  moveFrameForward() {
    this.oldValue = this.value;
    this.value = this.masterPhaseSignal.getValue() * this.operatorParam.ratio;
    this.value -= Math.floor(this.value);
  }

}

export class Operator {
  constructor(operatorParam, masterPhaseSignal, modulatorSignal) {
    this.operatorParam = operatorParam;
    this.outputSignal = new Signal(0.0);
    this.phase = new Phase(masterPhaseSignal, operatorParam, modulatorSignal);
  }
  
  getOutput() {
    return this.outputSignal;
  }
  
  moveFrameForward() {
    this.phase.moveFrameForward();
    this.outputSignal.setValue((this.operatorParam.volume / 100) * Math.sin(2 * Math.PI * this.phase.getOutput()));
  }
}

export class FMSynth {
  constructor(fmSynthParam) {
    this.fmSynthParam = fmSynthParam;
    this.masterPhase = new MasterPhase(fmSynthParam);
    this.modulator = new Operator(fmSynthParam.modulator, this.masterPhase.signal, null);
    this.carrier = new Operator(fmSynthParam.carrier, this.masterPhase.signal, this.modulator.getOutput());
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
