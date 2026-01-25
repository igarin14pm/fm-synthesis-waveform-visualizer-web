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
// Script
const visualFMSynthValue = new FMSynthValue(120, 0.5, 1, new OperatorValue('modulatorVolume', 1, 'modulatorRatio', 1));
let visualFMSynth = new FMSynth(visualFMSynthValue.samplingRate, visualFMSynthValue.waveFrequency, visualFMSynthValue.outputVolume);
// temporary code
let carrierWaveformGraph = new WaveformGraph(document.getElementById('carrier-waveform-graph'), visualFMSynthValue.samplingRate);
function moveFrameForward() {
    let frameUpdateQueue = [visualFMSynth];
    frameUpdateQueue.forEach(syncable => {
        syncable.moveFrameForward();
    });
    // temporary code
    carrierWaveformGraph.data.add(visualFMSynth.output.value);
    carrierWaveformGraph.update();
}
function setUp() {
    const oneSecond_ms = 1000;
    let intervalId = setInterval(moveFrameForward, oneSecond_ms / visualFMSynthValue.samplingRate);
}
setUp();
