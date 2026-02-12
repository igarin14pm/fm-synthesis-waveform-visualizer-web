/*
 * Copyright (c) 2026 Igarin
 * This software is released under the MIT License.
 * https://opensource.org
 */
import { FmSynth } from './fm-synth.js';
/* -------- Value Class -------- */
/**
 * オペレーターのパラメーターの値を保持し、UI上での値とFMシンセ側の値を変換するクラスです。
 */
class OperatorValue {
    /**
     * オペレーターのVolumeのUI上での値(0〜100)
     */
    get volumeUiValue() {
        return this.volumeValue * 100;
    }
    /**
     * オペレーターのVolumeのUI上での値(0〜100)
     */
    set volumeUiValue(newValue) {
        this.volumeValue = newValue / 100;
    }
    /**
     * オペレーターのRatioのUI上での値(1〜10)
     */
    get ratioUiValue() {
        return this.ratioValue;
    }
    /**
     * オペレーターのRatioのUI上での値(1〜10)
     */
    set ratioUiValue(newValue) {
        this.ratioValue = newValue;
    }
    /**
     * OperatorValueのインスタンスを生成します。
     * @param volumeParameterName AudioParamDescriptorにおけるVolumeのパラメーター名
     * @param volumeValue OperatorのパラメーターVolumeの値(0〜1.0)
     * @param ratioParameterName AudioParamDescriptorにおけるRatioのパラメーター名
     * @param ratioValue OperatorのパラメーターRatioの値(1〜10)
     */
    constructor(volumeParameterName, volumeValue, ratioParameterName, ratioValue) {
        this.volumeParameterName = volumeParameterName;
        this.volumeValue = volumeValue;
        this.ratioParameterName = ratioParameterName;
        this.ratioValue = ratioValue;
    }
}
/**
 * FMシンセサイザーの値を保持するクラスです。
 */
class FmSynthValue {
    /**
     * FMSynthValueのインスタンスを生成します。
     * @param samplingRate FMシンセサイザーのサンプリングレート
     * @param waveFrequency 出力波形の周波数
     * @param outputVolume 出力波形のボリューム
     */
    constructor(samplingRate, waveFrequency, outputVolume) {
        this.samplingRate = samplingRate;
        this.waveFrequency = waveFrequency;
        this.outputVolume = outputVolume;
    }
}
/* -------- Audio Class -------- */
/**
 * オーディオの処理を行うクラスです。
 */
class AudioEngine {
    constructor() {
        /**
         * Web Audio APIのAudioContextインスタンスです
         */
        this.audioContext = null;
        /**
         * FMシンセサイザーの音を出力するAudioWorkletNodeです
         */
        this.audioWorkletNode = null;
    }
    /**
     * AudioEngineが音を出力中かを表します
     */
    get isRunning() {
        return this.audioContext != null && this.audioWorkletNode != null;
    }
    /**
     * 指定したパラメーター名にパラメーターの値をセットします
     * @param name AudioParamDescriptorで指定したパラメーター名
     * @param value パラメーターの値
     */
    setParameterValue(name, value) {
        if (this.isRunning) {
            const param = this.audioWorkletNode.parameters.get(name);
            param?.setValueAtTime(value, this.audioContext.currentTime);
        }
    }
    /**
     * 音声を再生します。
     * @param modulatorValue モジュレーターの値を格納したOperatorValueのインスタンス
     * @param callback 再生を始める処理が完了した後に呼ばれる関数
     */
    async start(modulatorValue, callback) {
        this.audioContext = new AudioContext();
        await this.audioContext.audioWorklet.addModule('./scripts/dist/audio-processor.js');
        this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
        this.setParameterValue(modulatorValue.volumeParameterName, modulatorValue.volumeValue);
        this.setParameterValue(modulatorValue.ratioParameterName, modulatorValue.ratioValue);
        this.audioWorkletNode.connect(this.audioContext.destination);
        callback();
    }
    /**
     * 音声を停止します。
     */
    stop() {
        this.audioContext?.close();
        this.audioContext = null;
        this.audioWorkletNode = null;
    }
}
/* -------- UI Classes -------- */
/**
 * `<canvas>`要素にグラフを描画するための抽象クラスです
 */
class Graph {
    /**
     * `<canvas>`要素の幅
     */
    get width() {
        return this.element.width;
    }
    /**
     * `<canvas>`要素の高さ
     */
    get height() {
        return this.element.height;
    }
    /**
     * Graphのインスタンスを生成します。
     * @param element DOMで取得したCanvas要素
     */
    constructor(element) {
        this.element = element;
        /**
         * グラフに描画する波形の上下の余白の大きさ
         */
        this.verticalPadding = 10;
    }
    /**
     * 波形の出力信号の値(-1.0〜1.0)をグラフのY座標に変換します
     * @param value 変換する波形の出力信号の値
     * @returns グラフのY座標
     */
    convertToCoordinateY(value) {
        return (this.height - this.verticalPadding * 2) * (-1 * value + 1) / 2 + this.verticalPadding;
    }
    /**
     * グラフの描画をすべて削除します。
     */
    clear() {
        let context = this.element.getContext('2d');
        context.clearRect(0, 0, this.width, this.height);
    }
    /**
     * グラフを削除して描画し直します。
     */
    update() {
        this.clear();
        this.draw();
    }
}
/**
 * 位相グラフを描画するためのクラスです。
 * オペレーターの位相を描画します。
 */
class PhaseGraph extends Graph {
    /**
     * PhaseGraphのインスタンスを生成します。
     * @param element DOMで取得した`<canvas>`要素
     * @param operator 位相グラフに描画したいOperatorのインスタンス
     */
    constructor(element, operator) {
        super(element);
        this.operator = operator;
    }
    /**
     * グラフを描画します。
     */
    draw() {
        // sin(x) = 0 の時の値が綺麗に描画されるように+1する(植木算の考えで)
        const sineWaveValueLength = 120 + 1;
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
        context.lineWidth = 4;
        context.beginPath();
        for (let i = 0; i < sineWaveValueLength; i++) {
            const sineWaveValue = Math.sin(2 * Math.PI * i / (sineWaveValueLength - 1));
            const sineWaveX = this.width * i / (sineWaveValueLength - 1);
            const sineWaveY = this.convertToCoordinateY(this.operator.volume * sineWaveValue);
            if (i === 0) {
                context.moveTo(sineWaveX, sineWaveY);
            }
            else {
                context.lineTo(sineWaveX, sineWaveY);
            }
        }
        context.stroke();
        // 位相を表す線分を描画
        context.strokeStyle = '#00cdb9';
        context.lineWidth = 8;
        context.beginPath();
        const phaseLineX = this.width * this.operator.phase.output.value;
        const phaseLineStartY = 0;
        const phaseLineEndY = this.height;
        context.moveTo(phaseLineX, phaseLineStartY);
        context.lineTo(phaseLineX, phaseLineEndY);
        context.stroke();
        // 値の出力を表す線分を描画
        context.strokeStyle = '#888888';
        context.lineWidth = 4;
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
        const valueCircleRadius = 12.5;
        context.arc(valueCircleX, valueCircleY, valueCircleRadius, 0, 2 * Math.PI);
        context.fill();
    }
}
/**
 * 出力グラフを描画するためのクラスです。
 * モジュレーターの出力量を描画します。
 */
class OutputGraph extends Graph {
    /**
     * OutputGraphのインスタンスを生成します。
     * @param element DOMで取得した`<canvas>`要素
     * @param operator 出力グラフに描画したいOperatorのインスタンス
     * @param showsModulatingAmount モジュレーターの出力量を描画するか operatorがモジュレーターである時にtrueにします
     */
    constructor(element, operator, showsModulatingAmount) {
        super(element);
        this.operator = operator;
        this.showsModulatingAmount = showsModulatingAmount;
    }
    /**
     * グラフを描画します。
     */
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
            context.lineWidth = 4;
            context.strokeRect(amountRectX, amountRectOutlineY, amountRectWidth, amountRectOutlineHeight);
            // 塗りつぶしを描画
            const amountRectFillY = this.height / 2;
            const amountRectFillHeight = outputLineY - amountRectFillY;
            context.fillStyle = '#00cdb944';
            context.fillRect(amountRectX, amountRectFillY, amountRectWidth, amountRectFillHeight);
        }
        // 出力を表す線分を描画
        context.strokeStyle = '#888888';
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(outputLineStartX, outputLineY);
        context.lineTo(outputLineEndX, outputLineY);
        context.stroke();
    }
}
/**
 * 波形グラフのためのデータを保持するクラスです。
 */
class WaveformGraphData {
    /**
     * WaveformGraphDataのインスタンスを生成します。
     * @param samplingRate FMSynthのサンプリングレート
     */
    constructor(samplingRate) {
        const numberOfWaves = 4;
        // sin(x) = 0 の時の値が綺麗に描画されるように+1する(植木算の考えで)
        this.valueLength = samplingRate * numberOfWaves + 1;
        let values = new Array(this.valueLength);
        values.fill(0.0);
        this.values = values;
    }
    /**
     * データに値を追加します。
     * @param value 追加する波形の出力信号の値
     */
    add(value) {
        this.values.pop();
        this.values.splice(0, 0, value);
    }
}
/**
 * 波形グラフを描画するためのクラスです。
 * オペレーターの波形を描画します。
 */
class WaveformGraph extends Graph {
    /**
     * WaveformGraphのインスタンスを生成します。
     * @param element DOMで取得した`<canvas>`要素
     * @param samplingRate FMSynthのサンプリングレート
     */
    constructor(element, samplingRate) {
        super(element);
        this.data = new WaveformGraphData(samplingRate);
    }
    /**
     * グラフを描画します。
     */
    draw() {
        let context = this.element.getContext('2d');
        // 波形を描画
        context.strokeStyle = '#eeeeee';
        context.lineWidth = 4;
        context.beginPath();
        for (const [index, value] of this.data.values.entries()) {
            const waveX = (index / (this.data.valueLength - 1)) * this.width;
            const waveY = this.convertToCoordinateY(value);
            if (index === 0) {
                context.moveTo(waveX, waveY);
            }
            else {
                context.lineTo(waveX, waveY);
            }
        }
        context.stroke();
        // 左端のボーダーの線分を描画
        const borderLineX = 1;
        const borderLineStartY = 0;
        const borderLineEndY = this.height;
        context.strokeStyle = '#888888';
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(borderLineX, borderLineStartY);
        context.lineTo(borderLineX, borderLineEndY);
        context.stroke();
    }
}
/**
 * パラメーターを変更する`<input>`要素を扱うためのクラスです。
 */
class RangeInputUi {
    /**
     * `<input>`要素の値
     */
    get value() {
        return parseInt(this.inputElement.value);
    }
    /**
     * RangeInputUIのインスタンスを生成します。
     * @param inputElement DOMで取得した`<input>`要素
     * @param valueLabelElement DOMで取得した値を表示する`<label>`要素
     * @param initialValue `<input>`要素に設定する初期値
     */
    constructor(inputElement, valueLabelElement, initialValue) {
        this.inputElement = inputElement;
        this.valueLabelElement = valueLabelElement;
        inputElement.value = initialValue.toString();
        valueLabelElement.textContent = initialValue.toString();
    }
    /**
     * `<input>`要素に値が入力した時に発生するイベントリスナーを設定します。
     */
    addEventListener(listener) {
        this.inputElement.addEventListener('input', () => {
            listener();
            this.valueLabelElement.textContent = this.inputElement.value;
        });
    }
}
/**
 * オペレーターが関わるグラフを管理するクラスです。
 */
class OperatorUi {
    /**
     * OperatorUIのインスタンスを生成します。
     * @param operator グラフに表示させたいOperatorのインスタンス
     * @param phaseGraphElement DOMで取得した位相グラフの`<canvas>`要素
     * @param outputGraphElement DOMで取得した出力グラフの`<canvas>`要素
     * @param waveformGraphElement DOMで取得した波形グラフの`<canvas>`要素
     * @param showsModulatingAmount 出力グラフにモジュレーションを掛ける量を表示するか
     * @param samplingRate FMSynthのサンプリングレート
     */
    constructor(operator, phaseGraphElement, outputGraphElement, waveformGraphElement, showsModulatingAmount, samplingRate) {
        this.operator = operator;
        this.phaseGraph = new PhaseGraph(phaseGraphElement, operator);
        this.outputGraph = new OutputGraph(outputGraphElement, operator, showsModulatingAmount);
        this.waveformGraph = new WaveformGraph(waveformGraphElement, samplingRate);
        this.phaseGraph.draw();
        this.outputGraph.draw();
        this.waveformGraph.draw();
    }
    /**
     * OperatorUIの動作をサンプリングレート一つ分進めます。
     */
    moveFrameForward() {
        this.phaseGraph.update();
        this.outputGraph.update();
        this.waveformGraph.data.add(this.operator.output.value);
        this.waveformGraph.update();
    }
}
/* -------- Script -------- */
/**
 * 画面に表示される波形を生成する`FMSynth`のパラメーター値を管理する`FMSynthValue`のインスタンス
 */
const visualFmSynthValue = new FmSynthValue(120, 0.5, 1);
/**
 * 画面に表示される波形を生成する`FMSynth`にあるModulatorのパラメーター値を管理する`OperatorValue`のインスタンス
 */
const modulatorValue = new OperatorValue('modulatorVolume', 1, 'modulatorRatio', 1);
/**
 * 音声を再生・停止する`AudioEngine`のインスタンス
 */
const audioEngine = new AudioEngine();
/**
 * 画面に表示される波形を生成する`FMSynth`のインスタンス
 */
const visualFmSynth = new FmSynth(visualFmSynthValue.samplingRate, visualFmSynthValue.waveFrequency, visualFmSynthValue.outputVolume);
// Modulator Volume Input
// `index.html`上で`#modulator-volume-input`は`<input>`要素、`#modulator-volume-value-label`は`<label>`要素であり、
// 要素は動的に削除されず、これらのidが動的に要素に付与・削除されることはないため、この型キャストは成功する。
const modulatorVolumeInputElement = document.getElementById('modulator-volume-input');
const modulatorVolumeValueLabelElement = document.getElementById('modulator-volume-value-label');
/**
 * ModulatorのVolumeパラメーターの`<input>`要素を制御するクラスのインスタンス
 */
const modulatorVolumeInputUi = new RangeInputUi(modulatorVolumeInputElement, modulatorVolumeValueLabelElement, modulatorValue.volumeUiValue);
// Modulator Ratio Input
// `index.html`上で`#modulator-ratio-input`は`<input>`要素、`#modulator-ratio-value-label`は`<label>`要素であり、
// 要素は動的に削除されず、これらのidが動的に要素に付与・削除されることはないため、この型キャストは成功する。
const modulatorRatioInputElement = document.getElementById('modulator-ratio-input');
const modulatorRatioValueLabelElement = document.getElementById('modulator-ratio-value-label');
/**
 * ModulatorのRatioパラメーターの`<input>`要素を制御するクラスのインスタンス
 */
const modulatorRatioInputUi = new RangeInputUi(modulatorRatioInputElement, modulatorRatioValueLabelElement, modulatorValue.ratioUiValue);
// Modulator Graph
// `index.html`上で`#modulator-phase-graph`・`#modulator-output-graph`、`#modulator-waveform-graph`はすべて`<canvas>`要素であり
// 要素は動的に削除されず、これらのidが動的に要素に付与・削除されることはないため、この型キャストは成功する。
const modulatorPhaseGraphElement = document.getElementById('modulator-phase-graph');
const modulatorOutputGraphElement = document.getElementById('modulator-output-graph');
const modulatorWaveformGraphElement = document.getElementById('modulator-waveform-graph');
/**
 * Modulatorのグラフを制御するクラスのインスタンス
 */
const modulatorUi = new OperatorUi(visualFmSynth.modulator, modulatorPhaseGraphElement, modulatorOutputGraphElement, modulatorWaveformGraphElement, true, visualFmSynthValue.samplingRate);
// Carrier Graph
// `index.html`上で`#carrier-phase-graph`・`#carrier-output-graph`、`#carrier-waveform-graph`はすべて`<canvas>`要素であり
// 要素は動的に削除されず、これらのidが動的に要素に付与・削除されることはないため、この型キャストは成功する。
const carrierPhaseGraphElement = document.getElementById('carrier-phase-graph');
const carrierOutputGraphElement = document.getElementById('carrier-output-graph');
const carrierWaveformGraphElement = document.getElementById('carrier-waveform-graph');
/**
 * Carrierのグラフを制御するクラスのインスタンス
 */
const carrierUi = new OperatorUi(visualFmSynth.carrier, carrierPhaseGraphElement, carrierOutputGraphElement, carrierWaveformGraphElement, false, visualFmSynthValue.samplingRate);
/**
 * グラフの動作をサンプリングレート一つ分進めます。
 */
function moveFrameForward() {
    let frameUpdateQueue = [visualFmSynth, modulatorUi, carrierUi];
    frameUpdateQueue.forEach(syncable => {
        syncable.moveFrameForward();
    });
}
/**
 * WebページのJavaScriptの動作を開始します。
 */
function setUp() {
    // JavaScript無効時に非表示になっている要素を表示させる
    // `index.html`内で`.div-working-with-javascript`が付与されている要素は全て`<div>`要素であり、
    // これらの要素は動的に削除されず、classが動的に付与・削除されることがないため、この型キャストは成功する。
    const divWorkingWithJavascript = document.getElementsByClassName('div-working-with-javascript');
    for (let i = 0; i < divWorkingWithJavascript.length; i++) {
        divWorkingWithJavascript[i].style.display = 'block';
    }
    /**
     * UIからモジュレーターのVolumeの値を取得し、FMSynthに適用します。
     */
    function setModulatorVolume() {
        // UIから値を取得
        modulatorValue.volumeUiValue = modulatorVolumeInputUi.value;
        // グラフ用FMSynthに適用
        visualFmSynth.modulator.volume = modulatorValue.volumeValue;
        // 音声用FMSynthに適用
        if (audioEngine.isRunning) {
            audioEngine.setParameterValue(modulatorValue.volumeParameterName, modulatorValue.volumeValue);
        }
    }
    /**
     * UIからモジュレーターのRatioの値を取得し、FMSynthに適用します。
     */
    function setModulatorRatio() {
        // UIから値を取得
        modulatorValue.ratioUiValue = modulatorRatioInputUi.value;
        // グラフ用FMSynthに適用
        visualFmSynth.modulator.ratio = modulatorValue.ratioValue;
        // 音声用FMSynthに適用
        if (audioEngine.isRunning) {
            audioEngine.setParameterValue(modulatorValue.ratioParameterName, modulatorValue.ratioValue);
        }
    }
    setModulatorVolume();
    setModulatorRatio();
    /**
     * "音声を再生する"ボタンの要素
     */
    // `index.html`内で`#start-audio-button`は`<button>`要素であり、
    // 要素は動的に削除されず、このidを動的に付与・削除されることもないため、この型キャストは成功する。
    const startAudioButton = document.getElementById('start-audio-button');
    /**
     * "音声を停止する"ボタンの要素
     */
    // `index.html`内で`#stop-audio-button`は`<button>`要素であり、
    // 要素は動的に削除されず、このidを動的に付与・削除されることもないため、この型キャストは成功する。
    const stopAudioButton = document.getElementById('stop-audio-button');
    startAudioButton.addEventListener('click', () => {
        if (!audioEngine.isRunning) {
            audioEngine.start(modulatorValue, () => {
                startAudioButton.style.display = 'none';
                stopAudioButton.style.display = 'block';
            });
        }
    });
    stopAudioButton.addEventListener('click', () => {
        if (audioEngine.isRunning) {
            audioEngine.stop();
        }
        startAudioButton.style.display = 'block';
        stopAudioButton.style.display = 'none';
    });
    modulatorVolumeInputUi.addEventListener(() => {
        setModulatorVolume();
    });
    modulatorRatioInputUi.addEventListener(() => {
        setModulatorRatio();
    });
    /**
     * 1秒をミリ秒で表した数
     */
    const oneSecond_ms = 1000;
    let intervalId = setInterval(moveFrameForward, oneSecond_ms / visualFmSynthValue.samplingRate);
}
// 読み込みが終わってからコードを実行する
window.addEventListener('load', () => {
    setUp();
});
