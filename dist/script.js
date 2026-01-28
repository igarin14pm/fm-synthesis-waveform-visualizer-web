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
class Graph {
    get width() {
        return this.element.width;
    }
    get height() {
        return this.element.height;
    }
    constructor(element) {
        this.verticalPadding = 10;
        this.element = element;
    }
    convertToCoordinateY(value) {
        return (this.height - this.verticalPadding * 2) * (-1 * value + 1) / 2 + this.verticalPadding;
    }
    clear() {
        let context = this.element.getContext('2d');
        context.clearRect(0, 0, this.width, this.height);
    }
    update() {
        this.clear();
        this.draw();
    }
}
class PhaseGraph extends Graph {
    constructor(element, operator) {
        super(element);
        this.operator = operator;
    }
    draw() {
        const sineWaveValueLength = 120;
        const context = this.element.getContext('2d');
        // モジュレーション量を描画
        context.fillStyle = '#00cdb944';
        const phaseWithoutModX = this.width * this.operator.phase.valuesWithoutMod[0];
        const modRectY = 0;
        const modRectWidth = this.width * this.operator.phase.modulationValue;
        const modRectHeight = this.height;
        if (phaseWithoutModX + modRectWidth > this.width) {
            // 長方形がCanvas要素から右側にはみ出る場合
            // 右端の長方形を描画
            context.fillRect(phaseWithoutModX, modRectY, this.width - phaseWithoutModX, this.height);
            // 左端の長方形を描画
            context.fillRect(0, modRectY, phaseWithoutModX + modRectWidth - this.width, modRectHeight);
        }
        else if (phaseWithoutModX + modRectWidth < 0) {
            // 図形がCanvas要素から左側にはみ出る場合
            // 左端の長方形を描画
            context.fillRect(phaseWithoutModX, modRectY, -1 * phaseWithoutModX, modRectHeight);
            // 右端の長方形を描画
            context.fillRect(this.width, modRectY, phaseWithoutModX + modRectWidth, modRectHeight);
        }
        else {
            // 長方形がCanvas要素からはみ出ない場合
            context.fillRect(phaseWithoutModX, modRectY, modRectWidth, modRectHeight);
        }
        // サイン波を描画
        context.strokeStyle = '#eeeeee';
        context.lineWidth = 2;
        context.beginPath();
        for (let i = 0; i < sineWaveValueLength; i++) {
            const sineWaveValue = Math.sin(2 * Math.PI * i / (sineWaveValueLength - 1));
            const sineWaveX = this.width * i / (sineWaveValueLength - 1);
            const sineWaveY = this.convertToCoordinateY(this.operator.volume * sineWaveValue);
            if (i == 0) {
                context.moveTo(sineWaveX, sineWaveY);
            }
            else {
                context.lineTo(sineWaveX, sineWaveY);
            }
        }
        context.stroke();
        // 位相を表す線分を描画
        context.strokeStyle = '#00cdb9';
        context.lineWidth = 4;
        context.beginPath();
        const phaseLineX = this.width * this.operator.phase.output.value;
        const phaseLineStartY = 0;
        const phaseLineEndY = this.height;
        context.moveTo(phaseLineX, phaseLineStartY);
        context.lineTo(phaseLineX, phaseLineEndY);
        context.stroke();
        // 値の出力を表す線分を描画
        context.strokeStyle = '#888888';
        context.lineWidth = 1;
        context.beginPath();
        const outputLineStartX = phaseLineX;
        const outputLineEndX = this.width;
        const outputLineY = this.convertToCoordinateY(this.operator.output.value);
        context.moveTo(outputLineStartX, outputLineY);
        context.lineTo(outputLineEndX, outputLineY);
        context.stroke();
        // 値を表す円を描画
        context.fillStyle = '#00cdb9';
        const valueCircleX = phaseLineX;
        const valueCircleY = outputLineY;
        const valueCircleRadius = 7.5;
        context.arc(valueCircleX, valueCircleY, valueCircleRadius, 0, 2 * Math.PI);
        context.fill();
    }
}
class OutputGraph extends Graph {
    constructor(element, operator, showsModulatingAmout) {
        super(element);
        this.operator = operator;
        this.showsModulatingAmount = showsModulatingAmout;
    }
    draw() {
        const context = this.element.getContext('2d');
        const outputLineStartX = 0;
        const outputLineEndX = this.width;
        const outputLineY = this.convertToCoordinateY(this.operator.output.value);
        // 変調を掛ける量を表す長方形を描画
        if (this.showsModulatingAmount) {
            const amountRectX = this.width / 3;
            const amountRectWidth = this.width / 3;
            // 枠線を描画
            const amountRectOutlineY = this.verticalPadding;
            const amountRectOutlineHeight = this.height - this.verticalPadding * 2;
            context.strokeStyle = '#eeeeee';
            context.lineWidth = 1;
            context.strokeRect(amountRectX, amountRectOutlineY, amountRectWidth, amountRectOutlineHeight);
            // 塗りつぶしを描画
            const amountRectFillY = this.height / 2;
            const amountRectFillHeight = outputLineY - amountRectFillY;
            context.fillStyle = '#00cdb944';
            context.fillRect(amountRectX, amountRectFillY, amountRectWidth, amountRectFillHeight);
        }
        // 出力を表す線分を描画
        context.strokeStyle = '#888888';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(outputLineStartX, outputLineY);
        context.lineTo(outputLineEndX, outputLineY);
        context.stroke();
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
class WaveformGraph extends Graph {
    constructor(element, samplingRate) {
        super(element);
        this.data = new WaveformGraphData(samplingRate);
    }
    draw() {
        let context = this.element.getContext('2d');
        // 波形を描画
        context.strokeStyle = '#eeeeee';
        context.lineWidth = 2;
        context.beginPath();
        for (const [index, value] of this.data.values.entries()) {
            const x = (index / (this.data.valueLength - 1)) * this.width;
            const y = this.convertToCoordinateY(value);
            if (index === 0) {
                context.moveTo(x, y);
            }
            else {
                context.lineTo(x, y);
            }
        }
        context.stroke();
        // 左端のボーダーの線分を描画
        const borderLineX = 1;
        const borderLineStartY = 0;
        const borderLineEndY = this.height;
        context.strokeStyle = '#888888';
        context.lineWidth = 1;
        context.moveTo(borderLineX, borderLineStartY);
        context.lineTo(borderLineX, borderLineEndY);
        context.stroke();
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
    constructor(operator, phaseGraphElement, outputGraphElement, waveformGraphElement, showsModulatingAmount, samplingRate) {
        this.operator = operator;
        this.phaseGraph = new PhaseGraph(phaseGraphElement, operator);
        this.outputGraph = new OutputGraph(outputGraphElement, operator, showsModulatingAmount);
        this.waveformGraph = new WaveformGraph(waveformGraphElement, samplingRate);
        this.phaseGraph.draw();
        this.outputGraph.draw();
        this.waveformGraph.draw();
    }
    moveFrameForward() {
        this.phaseGraph.update();
        this.outputGraph.update();
        this.waveformGraph.data.add(this.operator.output.value);
        this.waveformGraph.update();
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
const modulatorOutputGraphElement = document.getElementById('modulator-output-graph');
const modulatorWaveformGraphElement = document.getElementById('modulator-waveform-graph');
const modulatorUI = new OperatorUI(visualFMSynth.modulator, modulatorPhaseGraphElement, modulatorOutputGraphElement, modulatorWaveformGraphElement, true, visualFMSynthValue.samplingRate);
const carrierPhaseGraphElement = document.getElementById('carrier-phase-graph');
const carrierOutputGraphElement = document.getElementById('carrier-output-graph');
const carrierWaveformGraphElement = document.getElementById('carrier-waveform-graph');
const carrierUI = new OperatorUI(visualFMSynth.carrier, carrierPhaseGraphElement, carrierOutputGraphElement, carrierWaveformGraphElement, false, visualFMSynthValue.samplingRate);
function moveFrameForward() {
    let frameUpdateQueue = [visualFMSynth, modulatorUI, carrierUI];
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
