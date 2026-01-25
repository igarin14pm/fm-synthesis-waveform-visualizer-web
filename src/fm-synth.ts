// Signal

export class Signal {

  value: number;

  constructor(value: number) {
    this.value = value;
  }

}

// Interface

export interface Inputting {
  input: Signal;
}

export interface Processing {
  process(): number;
}

export interface Outputting {
  outputSource: Signal;
  output: Signal;
}

export interface Syncable {
  moveFrameForward(): void;
}

// FM Synth Modules

export class MasterPhase implements Outputting, Syncable {

  fmSynth: FMSynth;

  outputSource = new Signal(0.0);

  constructor(fmSynth: FMSynth) {
    this.fmSynth = fmSynth;
  }
  
  get output(): Signal {
    return this.outputSource;
  }

  moveFrameForward(): void {
    const deltaPhase = this.fmSynth.waveFrequency / this.fmSynth.samplingRate;
    this.outputSource.value = (this.outputSource.value + deltaPhase) % 1;
  }

}

export class Phase implements Inputting, Outputting, Syncable {
  
  operator: Operator;
  input: Signal;
  modulationSignal: Signal;

  valuesWithoutMod: number[] = [0.0, 0.0];
  outputSource = new Signal(0.0);

  constructor(operator: Operator, masterPhaseSignal: Signal, modulatorSignal: Signal | null) {
    this.operator = operator;
    this.input = masterPhaseSignal;
    if (modulatorSignal !== null) {
      this.modulationSignal = modulatorSignal;
    } else {
      this.modulationSignal = new Signal(0.0);
    }
  }

  get isLooped(): boolean {
    return this.valuesWithoutMod[0] < this.valuesWithoutMod[1];
  }

  get output(): Signal {
    return this.outputSource;
  }

  proess(): number {
    const modulatorCoefficient = 0.25;
    return this.valuesWithoutMod[0] + this.modulationSignal.value * modulatorCoefficient;
  }

  moveFrameForward(): void {
    let valueWithoutMod = this.input.value * this.operator.ratio % 1;
    this.valuesWithoutMod.pop();
    this.valuesWithoutMod.splice(0, 0, valueWithoutMod);

    this.outputSource.value = this.proess();
  }

}

export class Operator implements Inputting, Processing, Outputting, Syncable {

  phase: Phase;
  input: Signal;

  volume: number = 1.0;
  ratio: number = 1;

  outputSource = new Signal(0.0);

  constructor(fmSynth: FMSynth, modulatorSignal: Signal | null) {
    this.phase = new Phase(this, fmSynth.masterPhase.output, modulatorSignal);
    if (modulatorSignal !== null) {
      this.input = modulatorSignal;
    } else {
      this.input = new Signal(0.0);
    }
  }

  process(): number {
    return this.volume * Math.sin(2 * Math.PI * this.phase.output.value);
  }

  get output(): Signal {
    return this.outputSource;
  }

  moveFrameForward(): void {
    this.phase.moveFrameForward();
    this.outputSource.value = this.process();
  }

}

export class FMSynth implements Processing, Outputting, Syncable {

  samplingRate: number;
  waveFrequency: number;
  outputVolume: number;

  masterPhase: MasterPhase;
  modulator: Operator;
  carrier: Operator;

  outputSource = new Signal(0.0);

  constructor(samplingRate: number, waveFrequency: number, outputVolume: number) {
    this.samplingRate = samplingRate;
    this.waveFrequency = waveFrequency;
    this.outputVolume = outputVolume;

    this.masterPhase = new MasterPhase(this);
    this.modulator = new Operator(this, null);
    this.carrier = new Operator(this, this.modulator.output);
  }

  process(): number {
    return this.carrier.output.value * this.outputVolume;
  }

  get output(): Signal {
    return this.outputSource;
  }

  moveFrameForward(): void {
    let frameUpdateQueue: Syncable[] = [this.masterPhase, this.modulator, this.carrier];
    frameUpdateQueue.forEach(syncable => {
      syncable.moveFrameForward();
    });

    this.outputSource.value = this.process();
  }

}