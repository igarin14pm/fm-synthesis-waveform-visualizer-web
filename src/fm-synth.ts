// Signal

export class Signal {

  value: number;

  constructor(value: number) {
    this.value = value;
  }

}

// Interface

export interface Outputting {

  output: Signal;

}

// FM Synth Modules

export class FMSynth implements Outputting {

  samplingRate: number;
  waveFrequency: number;
  outputVolume: number;

  outputSource = new Signal(1);

  constructor(samplingRate: number, waveFrequency: number, outputVolume: number) {
    this.samplingRate = samplingRate;
    this.waveFrequency = waveFrequency;
    this.outputVolume = outputVolume;
  }

  get output(): Signal {
    return this.outputSource;
  }

}