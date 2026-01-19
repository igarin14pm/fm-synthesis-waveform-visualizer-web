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
    modulatorParam,
    carrierParam,
    outputVolume
  ) {
    this.samplingRate = samplingRate;
    this.waveFrequency = waveFrequency;
    this.modulator = modulatorParam;
    this.carrier = carrierParam;
    this.outputVolume = outputVolume;
  }
}

// Signal
export class Signal {
  constructor(value) {
    this.value = value
  }
  
  getClippedValue() {
    if (this.value > 1) {
      return 1;
    } else if (this.value < -1) {
      return -1;
    } else {
      return this.value;
    }
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
    this.outputSignal.value -= Math.floor(this.outputSignal.value);
  }
}

export class Phase {
  constructor(masterPhaseSignal, operatorParam, modulatorSignal) {
    this.masterPhaseSignal = masterPhaseSignal;
    this.operatorParam = operatorParam;
    this.modulatorSignal = modulatorSignal;
    
    this.value = 0;
    this.oldValue = 0;
    
    this.outputSignal = new Signal(0);
  }
  
  isLooped() {
    return this.value < this.oldValue;
  }
  
  getOutput() {
    return this.outputSignal;
  }
  
  process() {
    const modulatorCoefficient = 0.25
    if (this.modulatorSignal != null) {
      return this.value + (this.modulatorSignal.value * modulatorCoefficient);
    } else {
      return this.value;
    }
  }
  
  moveFrameForward() {
    this.oldValue = this.value;
    this.value = this.masterPhaseSignal.value * this.operatorParam.ratio;
    this.value -= Math.floor(this.value);
    
    this.outputSignal.value = this.process();
  }

}

export class Operator {
  constructor(operatorParam, masterPhaseSignal, modulatorSignal) {
    this.param = operatorParam;
    this.outputSignal = new Signal(0);
    this.phase = new Phase(masterPhaseSignal, operatorParam, modulatorSignal);
  }
  
  getOutput() {
    return this.outputSignal;
  }
  
  process() {
    return this.param.volume * Math.sin(2 * Math.PI * this.phase.getOutput().value);
  }
  
  moveFrameForward() {
    this.phase.moveFrameForward();
    this.outputSignal.value = this.process();
  }
}

export class FMSynth {
  constructor(fmSynthParam) {
    this.param = fmSynthParam;
    this.masterPhase = new MasterPhase(this.param);
    this.modulator = new Operator(this.param.modulator, this.masterPhase.getOutput(), null);
    this.carrier = new Operator(this.param.carrier, this.masterPhase.getOutput(), this.modulator.getOutput());
    
    this.outputSignal = new Signal(0);
  }
  
  getOutput() {
    return this.outputSignal;
  }
  
  process() {
    return this.carrier.getOutput().value * this.param.outputVolume;
  }
  
  moveFrameForward() {
    this.masterPhase.moveFrameForward();
    
    this.modulator.moveFrameForward();
    
    this.carrier.moveFrameForward();
    
    this.outputSignal.value = this.process();
  }
}
