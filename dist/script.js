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
    constructor(samplingRate, waveFrequency, outputVolume) {
        this._samplingRate = samplingRate;
        this._waveFrequency = waveFrequency;
        this._outputVolume = outputVolume;
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
// Audio Class
class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.audioWorkletNode = null;
    }
    get isRunning() {
        return this.audioContext !== null && this.audioWorkletNode !== null;
    }
    setParameterValue(name, value) {
        if (this.isRunning) {
            const param = this.audioWorkletNode.parameters.get(name);
            param?.setValueAtTime(value, this.audioContext.currentTime);
        }
    }
    async start(modulatorValue) {
        this.audioContext = new AudioContext();
        await this.audioContext.audioWorklet.addModule('./dist/audio-processor.js');
        this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
        this.setParameterValue(modulatorValue.volumeParameterName, modulatorValue.volumeValue);
        this.setParameterValue(modulatorValue.ratioParameterName, modulatorValue.ratioValue);
        this.audioWorkletNode.connect(this.audioContext.destination);
    }
    stop() {
        this.audioContext?.close();
        this.audioContext = null;
        this.audioWorkletNode = null;
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
class RangeInputUI {
    constructor(inputElement, valueLabelElement, initialValue) {
        this.inputElement = inputElement;
        this.valueLabelElement = valueLabelElement;
        this.inputElement.value = initialValue.toString();
        this.valueLabelElement.textContent = initialValue.toString();
    }
    get value() {
        return parseInt(this.inputElement.value);
    }
    addEventListener(listener) {
        this.inputElement.addEventListener('input', () => {
            listener();
            this.valueLabelElement.textContent = this.inputElement.value;
        });
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
const visualFMSynthValue = new FMSynthValue(120, 0.5, 1);
const modulatorValue = new OperatorValue('modulatorVolume', 1, 'modulatorRatio', 1);
const audioEngine = new AudioEngine();
const visualFMSynth = new FMSynth(visualFMSynthValue.samplingRate, visualFMSynthValue.waveFrequency, visualFMSynthValue.outputVolume);
const modulatorVolumeInputElement = document.getElementById('modulator-volume-input');
const modulatorVolumeValueLabelElement = document.getElementById('modulator-volume-value-label');
const modulatorVolumeInputUI = new RangeInputUI(modulatorVolumeInputElement, modulatorVolumeValueLabelElement, modulatorValue.volumeUIValue);
const modulatorRatioInputElement = document.getElementById('modulator-ratio-input');
const modulatorRatioValueLabelElement = document.getElementById('modulator-ratio-value-label');
const modulatorRatioInputUI = new RangeInputUI(modulatorRatioInputElement, modulatorRatioValueLabelElement, modulatorValue.ratioUIValue);
const modulatorPhaseGraphElement = document.getElementById('modulator-phase-graph');
const modulatorWaveformGraphElement = document.getElementById('modulator-waveform-graph');
const modulatorUI = new OperatorUI(visualFMSynth.modulator, modulatorPhaseGraphElement, modulatorWaveformGraphElement, visualFMSynthValue.samplingRate);
const carrierAngularVelocityMeterElement = document.getElementById('carrier-angular-velocity-meter');
const carrierAngularVelocityMeter = new AngularVelocityMeterUI(visualFMSynth.carrier.phase, carrierAngularVelocityMeterElement);
const carrierPhaseGraphElement = document.getElementById('carrier-phase-graph');
const carrierWaveformGraphElement = document.getElementById('carrier-waveform-graph');
const carrierUI = new OperatorUI(visualFMSynth.carrier, carrierPhaseGraphElement, carrierWaveformGraphElement, visualFMSynthValue.samplingRate);
function moveFrameForward() {
    let frameUpdateQueue = [visualFMSynth, modulatorUI, carrierAngularVelocityMeter, carrierUI];
    frameUpdateQueue.forEach(syncable => {
        syncable.moveFrameForward();
    });
}
function setUp() {
    function setModulatorVolume() {
        modulatorValue.volumeUIValue = modulatorVolumeInputUI.value;
        visualFMSynth.modulator.volume = modulatorValue.volumeValue;
        if (audioEngine.isRunning) {
            audioEngine.setParameterValue(modulatorValue.volumeParameterName, modulatorValue.volumeValue);
        }
    }
    function setModulatorRatio() {
        modulatorValue.ratioUIValue = modulatorRatioInputUI.value;
        visualFMSynth.modulator.ratio = modulatorValue.ratioValue;
        if (audioEngine.isRunning) {
            audioEngine.setParameterValue(modulatorValue.ratioParameterName, modulatorValue.ratioValue);
        }
    }
    setModulatorVolume();
    setModulatorRatio();
    const startAudioButton = document.getElementById('start-audio-button');
    startAudioButton.addEventListener('click', function () {
        if (!audioEngine.isRunning) {
            audioEngine.start(modulatorValue);
        }
    });
    const stopAudioButton = document.getElementById('stop-audio-button');
    stopAudioButton?.addEventListener('click', function () {
        if (audioEngine.isRunning) {
            audioEngine.stop();
        }
    });
    modulatorVolumeInputUI.addEventListener(function () {
        setModulatorVolume();
    });
    modulatorRatioInputUI.addEventListener(function () {
        setModulatorRatio();
    });
    const oneSecond_ms = 1000;
    let intervalId = setInterval(moveFrameForward, oneSecond_ms / visualFMSynthValue.samplingRate);
}
setUp();
