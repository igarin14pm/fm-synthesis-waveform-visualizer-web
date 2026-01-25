// Signal
export class Signal {
    constructor(value) {
        this.value = value;
    }
}
// FM Synth Modules
export class MasterPhase {
    constructor(fmSynth) {
        this.outputSource = new Signal(0);
        this.fmSynth = fmSynth;
    }
    get output() {
        return this.outputSource;
    }
    moveFrameForward() {
        const deltaPhase = this.fmSynth.waveFrequency / this.fmSynth.samplingRate;
        this.outputSource.value = (this.outputSource.value + deltaPhase) % 1;
    }
}
export class FMSynth {
    constructor(samplingRate, waveFrequency, outputVolume) {
        this.outputSource = new Signal(0);
        this.samplingRate = samplingRate;
        this.waveFrequency = waveFrequency;
        this.outputVolume = outputVolume;
        this.masterPhase = new MasterPhase(this);
    }
    process() {
        // temporary code
        return this.masterPhase.output.value;
    }
    get output() {
        return this.outputSource;
    }
    moveFrameForward() {
        let frameUpdateQueue = [this.masterPhase];
        frameUpdateQueue.forEach(syncable => {
            syncable.moveFrameForward();
        });
        this.outputSource.value = this.process();
    }
}
