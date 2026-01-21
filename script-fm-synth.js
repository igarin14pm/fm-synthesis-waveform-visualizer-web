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
  
  constructor(fmSynth) {
    this.fmSynth = fmSynth;
  }
  
  outputSignal = new Signal(0);
  
  getOutput() {
    return this.outputSignal;
  }
  
  moveFrameForward() {
    const deltaPhase = this.fmSynth.waveFrequency / this.fmSynth.samplingRate;
    this.outputSignal.value += deltaPhase;
    this.outputSignal.value -= Math.floor(this.outputSignal.value);
  }
  
}

export class Phase {
  
  constructor(operator, masterPhaseSignal, modulatorSignal) {
    this.operator = operator;
    this.masterPhaseSignal = masterPhaseSignal;
    this.modulatorSignal = modulatorSignal;
  }
  
  value = 0;
  oldValue = 0;
  
  outputSignal = new Signal(0);
  
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
    this.value = this.masterPhaseSignal.value * this.operator.ratio;
    this.value -= Math.floor(this.value);
    
    this.outputSignal.value = this.process();
  }

}

export class Operator {
  
  constructor(fmSynth, modulatorSignal) {
    this.phase = new Phase(this, fmSynth.masterPhase.getOutput(), modulatorSignal);
  }
  
  volume = 1;
  ratio = 1;
  
  outputSignal = new Signal(0);
  
  getOutput() {
    return this.outputSignal;
  }
  
  process() {
    return this.volume * Math.sin(2 * Math.PI * this.phase.getOutput().value);
  }
  
  moveFrameForward() {
    this.phase.moveFrameForward();
    this.outputSignal.value = this.process();
  }
  
}

export class FMSynth {
  
  constructor(samplingRate, waveFrequency, outputVolume) {
    this.samplingRate = samplingRate;
    this.waveFrequency = waveFrequency;
    this.outputVolume = outputVolume;
    
    this.masterPhase = new MasterPhase(this);
    this.modulator = new Operator(this, null);
    this.carrier = new Operator(this, this.modulator.getOutput());
  }
  
  outputSignal = new Signal(0);
  
  getOutput() {
    return this.outputSignal;
  }
  
  process() {
    return this.carrier.getOutput().value * this.outputVolume;
  }
  
  moveFrameForward() {
    this.masterPhase.moveFrameForward();
    this.modulator.moveFrameForward();
    this.carrier.moveFrameForward();
    
    this.outputSignal.value = this.process();
  }
  
}
