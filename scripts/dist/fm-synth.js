/*
 * Copyright (c) 2026 Igarin
 * This software is released under the MIT License.
 * https://opensource.org
 */
// Signal
export class Signal {
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
    constructor(value) {
        this.value = value;
    }
}
// FM Synth Modules
export class MasterPhase {
    get output() {
        return this.outputSource;
    }
    constructor(fmSynth) {
        this.outputSource = new Signal(0.0);
        this.fmSynth = fmSynth;
    }
    moveFrameForward() {
        const deltaPhase = this.fmSynth.waveFrequency / this.fmSynth.samplingRate;
        this.outputSource.value = (this.outputSource.value + deltaPhase) % 1;
    }
}
export class Phase {
    get isLooped() {
        return this.valuesWithoutMod[0] < this.valuesWithoutMod[1];
    }
    get output() {
        return this.outputSource;
    }
    get modulationValue() {
        const modulationCoefficient = 0.25;
        if (this.modulatorSignal != null) {
            return this.modulatorSignal.value * modulationCoefficient;
        }
        else {
            return 0;
        }
    }
    constructor(operator, masterPhaseSignal, modulatorSignal) {
        this.valuesWithoutMod = [0.0, 0.0];
        this.outputSource = new Signal(0.0);
        this.operator = operator;
        this.input = masterPhaseSignal;
        this.modulatorSignal = modulatorSignal;
    }
    process() {
        let value = this.valuesWithoutMod[0] + this.modulationValue;
        value -= Math.floor(value);
        return value;
    }
    moveFrameForward() {
        let valueWithoutMod = this.input.value * this.operator.ratio % 1;
        this.valuesWithoutMod.pop();
        this.valuesWithoutMod.splice(0, 0, valueWithoutMod);
        this.outputSource.value = this.process();
    }
}
export class Operator {
    get output() {
        return this.outputSource;
    }
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
    moveFrameForward() {
        this.phase.moveFrameForward();
        this.outputSource.value = this.process();
    }
}
export class FMSynth {
    get output() {
        return this.outputSource;
    }
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
    moveFrameForward() {
        let frameUpdateQueue = [this.masterPhase, this.modulator, this.carrier];
        frameUpdateQueue.forEach(syncable => {
            syncable.moveFrameForward();
        });
        this.outputSource.value = this.process();
    }
}
