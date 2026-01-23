// Signal

export class Signal {
  
  constructor(value) {
    this.value = value
  }
  
  get clippedValue() {
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
  
  get output() {
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
  
  get isLooped() {
    return this.value < this.oldValue;
  }
  
  get output() {
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
    this.phase = new Phase(this, fmSynth.masterPhase.output, modulatorSignal);
  }
  
  volume = 1;
  ratio = 1;
  
  outputSignal = new Signal(0);
  
  get output() {
    return this.outputSignal;
  }
  
  process() {
    return this.volume * Math.sin(2 * Math.PI * this.phase.output.value);
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
    this.carrier = new Operator(this, this.modulator.output);
  }
  
  outputSignal = new Signal(0);
  
  get output() {
    return this.outputSignal;
  }
  
  process() {
    return this.carrier.output.value * this.outputVolume;
  }
  
  moveFrameForward() {
    let frameUpdateQueue = [this.masterPhase, this.modulator, this.carrier];
    frameUpdateQueue.forEach((module) => {
      module.moveFrameForward();
    });
    
    this.outputSignal.value = this.process();
  }
  
}
