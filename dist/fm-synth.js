// Signal
export class Signal {
    constructor(value) {
        this.value = value;
    }
    get clippedValue() {
        if (this.value > 1.0) {
            return 1.0;
        }
        else if (this.value < -1.0) {
            return -1.0;
        }
        else {
            return this.value;
        }
    }
}
// FM Synth Modules
export class MasterPhase {
    constructor(fmSynth) {
        this.outputSource = new Signal(0.0);
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
export class Phase {
    constructor(operator, masterPhaseSignal, modulatorSignal) {
        this.valuesWithoutMod = [0.0, 0.0];
        this.outputSource = new Signal(0.0);
        this.operator = operator;
        this.input = masterPhaseSignal;
        if (modulatorSignal !== null) {
            this.modulationSignal = modulatorSignal;
        }
        else {
            this.modulationSignal = new Signal(0.0);
        }
    }
    get isLooped() {
        return this.valuesWithoutMod[0] < this.valuesWithoutMod[1];
    }
    get output() {
        return this.outputSource;
    }
    process() {
        const modulatorCoefficient = 0.25;
        return this.valuesWithoutMod[0] + this.modulationSignal.value * modulatorCoefficient;
    }
    moveFrameForward() {
        let valueWithoutMod = this.input.value * this.operator.ratio % 1;
        this.valuesWithoutMod.pop();
        this.valuesWithoutMod.splice(0, 0, valueWithoutMod);
        this.outputSource.value = this.process();
    }
}
export class Operator {
    constructor(fmSynth, modulatorSignal) {
        this.volume = 1.0;
        this.ratio = 1;
        this.outputSource = new Signal(0.0);
        this.phase = new Phase(this, fmSynth.masterPhase.output, modulatorSignal);
        if (modulatorSignal !== null) {
            this.input = modulatorSignal;
        }
        else {
            this.input = new Signal(0.0);
        }
    }
    process() {
        return this.volume * Math.sin(2 * Math.PI * this.phase.output.value);
    }
    get output() {
        return this.outputSource;
    }
    moveFrameForward() {
        this.phase.moveFrameForward();
        this.outputSource.value = this.process();
    }
}
export class FMSynth {
    constructor(samplingRate, waveFrequency, outputVolume) {
        this.outputSource = new Signal(0.0);
        this.samplingRate = samplingRate;
        this.waveFrequency = waveFrequency;
        this.outputVolume = outputVolume;
        this.masterPhase = new MasterPhase(this);
        this.modulator = new Operator(this, null);
        this.carrier = new Operator(this, this.modulator.output);
    }
    process() {
        return this.carrier.output.value * this.outputVolume;
    }
    get output() {
        return this.outputSource;
    }
    moveFrameForward() {
        let frameUpdateQueue = [this.masterPhase, this.modulator, this.carrier];
        frameUpdateQueue.forEach(syncable => {
            syncable.moveFrameForward();
        });
        this.outputSource.value = this.process();
    }
}
