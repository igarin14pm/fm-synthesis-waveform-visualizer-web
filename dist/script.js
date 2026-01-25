import { FMSynth } from './fm-synth.js';
// Value Class
class OperatorValue {
    constructor(volumeParameterName, volumeValue, ratioParameterName, ratioValue) {
        this.volumeParameterName = volumeParameterName;
        this.volumeValue = volumeValue;
        this.ratioParameterName = ratioParameterName;
        this.ratioValue = ratioValue;
    }
    get volumeUIValue() {
        return this.volumeValue * 100;
    }
    set volumeUIValue(newValue) {
        this.volumeValue = newValue / 100;
    }
    get ratioUIValue() {
        return this.ratioValue;
    }
    set ratioUIValue(newValue) {
        this.ratioValue = newValue;
    }
}
class FMSynthValue {
    constructor(samplingRate, waveFrequency, outputVolume, modulator) {
        this._samplingRate = samplingRate;
        this._waveFrequency = waveFrequency;
        this._outputVolume = outputVolume;
        this.modulator = modulator;
    }
    get samplingRate() {
        return this._samplingRate;
    }
    get waveFrequency() {
        return this._waveFrequency;
    }
    get outputVolume() {
        return this._outputVolume;
    }
}
// UI Classes
class PhaseGraph {
    constructor(element, operator) {
        this.element = element;
        this.operator = operator;
    }
    get width() {
        return this.element.width;
    }
    get height() {
        return this.element.height;
    }
    draw() {
        let circleCenterX = this.width / 3;
        let circleCenterY = this.height / 2;
        let circleRadius = this.height / 2 * this.operator.volume;
        if (this.element.getContext) {
            let phaseValue = this.operator.phase.output.value;
            let context = this.element.getContext('2d');
            context?.beginPath();
            context?.arc(circleCenterX, circleCenterY, circleRadius, 0, 2 * Math.PI);
            context?.moveTo(circleCenterX, circleCenterY);
            context?.lineTo(circleRadius * Math.cos(2 * Math.PI * phaseValue) + circleCenterX, -1 * circleRadius * Math.sin(2 * Math.PI * phaseValue) + circleCenterY);
            context?.lineTo(this.width, -1 * circleRadius * Math.sin(2 * Math.PI * phaseValue) + circleCenterY);
            context?.stroke();
        }
    }
    clear() {
        if (this.element.getContext) {
            let context = this.element.getContext('2d');
            context?.clearRect(0, 0, this.width, this.height);
        }
    }
    update() {
        this.clear();
        this.draw();
    }
}
class WaveformGraphData {
    constructor(samplingRate) {
        const numberOfWaves = 4;
        this.valueLength = samplingRate * numberOfWaves;
        let values = new Array(this.valueLength);
        values.fill(0.0);
        this.values = values;
    }
    add(value) {
        this.values.pop();
        this.values.splice(0, 0, value);
    }
}
class WaveformGraph {
    constructor(element, samplingRate) {
        this.element = element;
        this.data = new WaveformGraphData(samplingRate);
    }
    get width() {
        return this.element.width;
    }
    get height() {
        return this.element.height;
    }
    draw() {
        if (this.element.getContext) {
            let context = this.element.getContext('2d');
            context?.beginPath();
            for (const [index, value] of this.data.values.entries()) {
                let x = (index / (this.data.valueLength - 1)) * this.width;
                let y = (-(value) + 1) / 2 * this.height;
                if (index === 0) {
                    context?.moveTo(x, y);
                }
                else {
                    context?.lineTo(x, y);
                }
            }
            context?.stroke();
        }
    }
    clear() {
        if (this.element.getContext) {
            let context = this.element.getContext('2d');
            context?.clearRect(0, 0, this.width, this.height);
        }
    }
    update() {
        this.clear();
        this.draw();
    }
}
class OperatorUI {
    constructor(operator, phaseGraphElement, waveformGraphElement, samplingRate) {
        this.operator = operator;
        this.phaseGraph = new PhaseGraph(phaseGraphElement, operator);
        this.waveformGraph = new WaveformGraph(waveformGraphElement, samplingRate);
        this.phaseGraph.draw();
        this.waveformGraph.draw();
    }
    moveFrameForward() {
        this.phaseGraph.update();
        this.waveformGraph.data.add(this.operator.output.value);
        this.waveformGraph.update();
    }
}
class MeterUI {
    constructor(meterElement) {
        this.meterElement = meterElement;
    }
    get value() {
        return this.meterElement.value;
    }
    set value(newValue) {
        this.meterElement.value = newValue;
    }
}
class AngularVelocityMeterUI {
    constructor(phase, meterElement) {
        this.phase = phase;
        this.phaseValues = [phase.output.value, phase.output.value];
        this.meterUI = new MeterUI(meterElement);
    }
    moveFrameForward() {
        this.phaseValues.pop();
        this.phaseValues.splice(0, 0, this.phase.output.value);
        let newValue = this.phaseValues[0] - this.phaseValues[1];
        if (this.phase.isLooped) {
            newValue += 1.0;
        }
        this.meterUI.value = newValue;
    }
}
// Script
const visualFMSynthValue = new FMSynthValue(120, 0.5, 1, new OperatorValue('modulatorVolume', 1, 'modulatorRatio', 1));
const visualFMSynth = new FMSynth(visualFMSynthValue.samplingRate, visualFMSynthValue.waveFrequency, visualFMSynthValue.outputVolume);
const modulatorUI = new OperatorUI(visualFMSynth.modulator, document.getElementById('modulator-phase-graph'), document.getElementById('modulator-waveform-graph'), visualFMSynthValue.samplingRate);
const carrierAngularVelocityMeter = new AngularVelocityMeterUI(visualFMSynth.carrier.phase, document.getElementById('carrier-angular-velocity-meter'));
const carrierUI = new OperatorUI(visualFMSynth.carrier, document.getElementById('carrier-phase-graph'), document.getElementById('carrier-waveform-graph'), visualFMSynthValue.samplingRate);
function moveFrameForward() {
    let frameUpdateQueue = [visualFMSynth, modulatorUI, carrierAngularVelocityMeter, carrierUI];
    frameUpdateQueue.forEach(syncable => {
        syncable.moveFrameForward();
    });
}
function setUp() {
    const oneSecond_ms = 1000;
    let intervalId = setInterval(moveFrameForward, oneSecond_ms / visualFMSynthValue.samplingRate);
}
setUp();
