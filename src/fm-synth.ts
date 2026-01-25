// Signal

export class Signal {

  value: number;

  constructor(value: number) {
    this.value = value;
  }

}

// Interface

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

  outputSource = new Signal(0);

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

export class FMSynth implements Processing, Outputting, Syncable {

  samplingRate: number;
  waveFrequency: number;
  outputVolume: number;

  masterPhase: MasterPhase;

  outputSource = new Signal(0);

  constructor(samplingRate: number, waveFrequency: number, outputVolume: number) {
    this.samplingRate = samplingRate;
    this.waveFrequency = waveFrequency;
    this.outputVolume = outputVolume;

    this.masterPhase = new MasterPhase(this);
  }

  process(): number {
    // temporary code
    return this.masterPhase.output.value;
  }

  get output(): Signal {
    return this.outputSource;
  }

  moveFrameForward(): void {
    let frameUpdateQueue: Syncable[] = [this.masterPhase];
    frameUpdateQueue.forEach(syncable => {
      syncable.moveFrameForward();
    });

    this.outputSource.value = this.process();
  }

}