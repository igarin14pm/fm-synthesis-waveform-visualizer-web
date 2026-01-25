// Signal
export class Signal {
    constructor(value) {
        this.value = value;
    }
}
// FM Synth Modules
export class FMSynth {
    constructor(samplingRate, waveFrequency, outputVolume) {
        this.outputSource = new Signal(1);
        this.samplingRate = samplingRate;
        this.waveFrequency = waveFrequency;
        this.outputVolume = outputVolume;
    }
    get output() {
        return this.outputSource;
    }
}
