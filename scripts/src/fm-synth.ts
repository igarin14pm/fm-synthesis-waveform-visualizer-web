/*
 * Copyright (c) 2026 Igarin
 * This software is released under the MIT License.
 * https://opensource.org
 */

// Signal

export class Signal {

  value: number;

  get clippedValue(): number {
    if (this.value > 1.0) {
      return 1.0;
    } else if (this.value < -1.0) {
      return -1.0;
    } else {
      return this.value;
    }
  }

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
  output: Signal;
}

export interface Syncable {
  moveFrameForward(): void;
}

// FM Synth Modules

export class MasterPhase implements Outputting, Syncable {

  fmSynth: FMSynth;

  private outputSource = new Signal(0.0);

  get output(): Signal {
    return this.outputSource;
  }

  constructor(fmSynth: FMSynth) {
    this.fmSynth = fmSynth;
  }

  moveFrameForward(): void {
    const deltaPhase = this.fmSynth.waveFrequency / this.fmSynth.samplingRate;
    this.outputSource.value = (this.outputSource.value + deltaPhase) % 1;
  }

}

export class Phase implements Inputting, Processing, Outputting, Syncable {
  
  operator: Operator;
  input: Signal;
  modulatorSignal: Signal | null;

  valuesWithoutMod: number[] = [0.0, 0.0];
  private outputSource = new Signal(0.0);

  get isLooped(): boolean {
    return this.valuesWithoutMod[0] < this.valuesWithoutMod[1];
  }

  get output(): Signal {
    return this.outputSource;
  }

  get modulationValue(): number {
    const modulationCoefficient: number = 0.25;
    if (this.modulatorSignal != null) {
      return this.modulatorSignal.value * modulationCoefficient;
    } else {
      return 0
    }
  }

  constructor(operator: Operator, masterPhaseSignal: Signal, modulatorSignal: Signal | null) {
    this.operator = operator;
    this.input = masterPhaseSignal;
    this.modulatorSignal = modulatorSignal
  }

  process(): number {
    let value = this.valuesWithoutMod[0] + this.modulationValue;
    value -= Math.floor(value);
    return value;
  }

  moveFrameForward(): void {
    let valueWithoutMod = this.input.value * this.operator.ratio % 1;
    this.valuesWithoutMod.pop();
    this.valuesWithoutMod.splice(0, 0, valueWithoutMod);

    this.outputSource.value = this.process();
  }

}

export class Operator implements Inputting, Processing, Outputting, Syncable {

  phase: Phase;
  input: Signal;

  volume: number = 1.0;
  ratio: number = 1;

  private outputSource = new Signal(0.0);

  get output(): Signal {
    return this.outputSource;
  }

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

  private outputSource = new Signal(0.0);

  get output(): Signal {
    return this.outputSource;
  }

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

  moveFrameForward(): void {
    let frameUpdateQueue: Syncable[] = [this.masterPhase, this.modulator, this.carrier];
    frameUpdateQueue.forEach(syncable => {
      syncable.moveFrameForward();
    });

    this.outputSource.value = this.process();
  }

}
