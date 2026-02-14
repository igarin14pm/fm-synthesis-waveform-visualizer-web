// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org
import { FmSynth } from './modules/fm-synth.js';
// -------- Program Class --------
/**
 * プログラムのパラメータを表す抽象クラスです
 */
class ProgramParameter {
    /**
     * `ProgramParameter`のインスタンスを生成します
     * @param name `AudioParam`で使用するパラメータ名
     * @param initialValue パラメータの初期値
     */
    constructor(name, initialValue) {
        this.name = name;
        this.value = initialValue;
    }
}
/**
 * `Operator`のVolumeパラメータを表すクラスです
 */
class OperatorVolumeParameter extends ProgramParameter {
    /**
     * UI上で表示するパラメーターの値
     */
    get uiValue() {
        return this.value * 100;
    }
    /**
     * UI上で表示するパラメーターの値
     */
    set uiValue(newValue) {
        this.value = newValue / 100;
    }
    /**
     * `OperatorVolumeParameter`のインスタンスを生成します
     * @param name `AudioParam`で使用するパラメータ名
     * @param initialValue パラメータの初期値
     */
    constructor(name, initialValue) {
        super(name, initialValue);
    }
}
/**
 * `Operator`のRatioパラメータを表すクラスです
 */
class OperatorRatioParameter extends ProgramParameter {
    /**
     * UI上で表示するパラメーターの値
     */
    get uiValue() {
        return this.value;
    }
    /**
     * UI上で表示するパラメーターの値
     */
    set uiValue(newValue) {
        this.value = newValue;
    }
    /**
     * `OperatorRatioParameter`のインスタンスを生成します
     * @param name `AudioParam`で使用するパラメータ名
     * @param initialValue パラメータの初期値
     */
    constructor(name, initialValue) {
        super(name, initialValue);
    }
}
/**
 * `Operator`のプログラムを表すクラスです
 */
class OperatorProgram {
    /**
     * `OperatorProgram`のインスタンスを生成します
     * @param volumeParameter Volumeパラメータを表す`OperatorVolumeParameter`のインスタンス
     * @param ratioParameter Ratioパラメータを表す`OperatorRatioParameter`のインスタンス
     */
    constructor(volumeParameter, ratioParameter) {
        this.volumeParameter = volumeParameter;
        this.ratioParameter = ratioParameter;
    }
}
/**
 * `FmSynth`のプログラムを表すクラスです
 */
class FmSynthProgram {
    /**
     * `FmSynthProgram`のインスタンスを生成します
     * @param samplingRate `FmSynth`のサンプリングレート
     * @param waveFrequency `FmSynth`の出力波形の周波数
     * @param outputVolume `FmSynth`の出力のボリューム
     */
    constructor(samplingRate, waveFrequency, outputVolume) {
        this.samplingRate = samplingRate;
        this.waveFrequency = waveFrequency;
        this.outputVolume = outputVolume;
    }
}
// -------- Audio Class --------
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
        return this.audioContext != null;
    }
    /**
     * 指定したパラメーター名にパラメーターの値をセットします
     * @param name AudioParamDescriptorで指定したパラメーター名
     * @param value パラメーターの値
     */
    setParameterValue(name, value) {
        if (this.audioContext != null && this.audioWorkletNode != null) {
            const param = this.audioWorkletNode.parameters.get(name);
            param?.setValueAtTime(value, this.audioContext.currentTime);
        }
    }
    /**
     * 音声を再生します。
     * @param modulatorValue モジュレーターの値を格納したOperatorValueのインスタンス
     * @param callback 再生を始める処理が完了した後に呼ばれる関数
     */
    async start(modulatorProgram, callback) {
        this.audioContext = new AudioContext();
        await this.audioContext.audioWorklet.addModule('./assets/scripts/dist/modules/fm-synth-audio-processor.js');
        this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'fm-synth-audio-processor');
        this.setParameterValue(modulatorProgram.volumeParameter.name, modulatorProgram.volumeParameter.value);
        this.setParameterValue(modulatorProgram.ratioParameter.name, modulatorProgram.ratioParameter.value);
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
// -------- UI Components --------
/**
 * UIコンポーネントであることを表す基底クラスです。
 */
class UiComponent {
}
/**
 * パラメーターを変更する`<input>`要素を扱うためのクラスです。
 */
class RangeInputComponent extends UiComponent {
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
        super();
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
 * `<canvas>`要素にグラフを描画するための抽象クラスです
 */
class GraphComponent extends UiComponent {
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
        super();
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
class PhaseGraphComponent extends GraphComponent {
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
     * モジュレーション量を描画します。
     */
    drawModulatedAmount() {
        const context = this.element.getContext('2d');
        if (context != null) {
            context.fillStyle = '#00cdb944';
            const phaseWithoutModX = this.width * this.operator.phase.valuesWithoutMod[0];
            const modRectY = 0;
            const modRectWidth = this.width * this.operator.phase.modulationValue;
            const modRectHeight = this.height;
            if (phaseWithoutModX + modRectWidth > this.width) { // 長方形がCanvas要素から右側にはみ出る場合
                // 右端の長方形を描画
                context.fillRect(phaseWithoutModX, modRectY, this.width - phaseWithoutModX, this.height);
                // 左端の長方形を描画
                context.fillRect(0, modRectY, phaseWithoutModX + modRectWidth - this.width, modRectHeight);
            }
            else if (phaseWithoutModX + modRectWidth < 0) { // 図形がCanvas要素から左側にはみ出る場合
                // 左端の長方形を描画
                context.fillRect(phaseWithoutModX, modRectY, -1 * phaseWithoutModX, modRectHeight);
                // 右端の長方形を描画
                context.fillRect(this.width, modRectY, phaseWithoutModX + modRectWidth, modRectHeight);
            }
            else { // 長方形がCanvas要素からはみ出ない場合
                context.fillRect(phaseWithoutModX, modRectY, modRectWidth, modRectHeight);
            }
        }
    }
    /**
     * サイン波を描画します。
     */
    drawSineWave() {
        const sineWaveValueLength = 120 + 1; // sin(x) = 0 の時の値が綺麗に描画されるように+1する(植木算の考えで)
        const context = this.element.getContext('2d');
        if (context != null) {
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
        }
    }
    /**
     * 位相を表す線分を描画します。
     */
    drawPhaseLine() {
        const context = this.element.getContext('2d');
        if (context != null) {
            context.strokeStyle = '#00cdb9';
            context.lineWidth = 8;
            context.beginPath();
            const phaseLineX = this.width * this.operator.phase.output.value;
            const phaseLineStartY = 0;
            const phaseLineEndY = this.height;
            context.moveTo(phaseLineX, phaseLineStartY);
            context.lineTo(phaseLineX, phaseLineEndY);
            context.stroke();
        }
    }
    /**
     * 出力を表す線分を描画します。
     */
    drawOutputLine() {
        const context = this.element.getContext('2d');
        if (context != null) {
            context.strokeStyle = '#888888';
            context.lineWidth = 4;
            context.beginPath();
            const outputLineStartX = this.width * this.operator.phase.output.value;
            const outputLineEndX = this.width;
            const outputLineY = this.convertToCoordinateY(this.operator.output.value);
            context.moveTo(outputLineStartX, outputLineY);
            context.lineTo(outputLineEndX, outputLineY);
            context.stroke();
        }
    }
    /**
     * サイン波と位相を表す線分の交点に円を描画します。
     */
    drawValueCircle() {
        const context = this.element.getContext('2d');
        if (context != null) {
            context.fillStyle = '#00cdb9';
            const valueCircleX = this.width * this.operator.phase.output.value; // phaseLineX;
            const valueCircleY = this.convertToCoordinateY(this.operator.output.value); // outputLineY;
            const valueCircleRadius = 12.5;
            context.arc(valueCircleX, valueCircleY, valueCircleRadius, 0, 2 * Math.PI);
            context.fill();
        }
    }
    /**
     * グラフを描画します。
     */
    draw() {
        this.drawModulatedAmount();
        this.drawSineWave();
        this.drawPhaseLine();
        this.drawOutputLine();
        this.drawValueCircle();
    }
}
/**
 * 出力グラフを描画するためのクラスです。
 * モジュレーターの出力量を描画します。
 */
class OutputGraphComponent extends GraphComponent {
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
     * 変調を掛ける量を表す長方形を描画します。
     */
    drawModulatingAmount() {
        const context = this.element.getContext('2d');
        if (context != null) {
            const outputLineY = this.convertToCoordinateY(this.operator.output.value);
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
    }
    /**
     * 出力を表す線分を描画します。
     */
    drawOutputLine() {
        const context = this.element.getContext('2d');
        if (context != null) {
            const outputLineStartX = 0;
            const outputLineEndX = this.width;
            const outputLineY = this.convertToCoordinateY(this.operator.output.value);
            context.strokeStyle = '#888888';
            context.lineWidth = 4;
            context.beginPath();
            context.moveTo(outputLineStartX, outputLineY);
            context.lineTo(outputLineEndX, outputLineY);
            context.stroke();
        }
    }
    /**
     * グラフを描画します。
     */
    draw() {
        if (this.showsModulatingAmount) {
            this.drawModulatingAmount();
        }
        this.drawOutputLine();
    }
}
/**
 * 波形グラフを描画するためのクラスです。
 * オペレーターの波形を描画します。
 */
class WaveformGraphComponent extends GraphComponent {
    /**
     * WaveformGraphのインスタンスを生成します。
     * @param element DOMで取得した`<canvas>`要素
     * @param samplingRate FMSynthのサンプリングレート
     */
    constructor(element, samplingRate) {
        super(element);
        const duration_sec = 4;
        const valueLength = samplingRate * duration_sec + 1; // sin(x) = 0 の時の値が綺麗に描画されるように+1する(植木算の考えで)
        this.values = new Array(valueLength).fill(0);
    }
    /**
     * データの配列に値を追加します
     * @param value 追加する値
     */
    addValue(value) {
        this.values.pop();
        this.values.splice(0, 0, value);
    }
    /**
     * 波形を描画します。
     */
    drawWaveform() {
        const context = this.element.getContext('2d');
        if (context != null) {
            context.strokeStyle = '#eeeeee';
            context.lineWidth = 4;
            context.beginPath();
            for (const [index, value] of this.values.entries()) {
                const waveX = (index / (this.values.length - 1)) * this.width;
                const waveY = this.convertToCoordinateY(value);
                if (index === 0) {
                    context.moveTo(waveX, waveY);
                }
                else {
                    context.lineTo(waveX, waveY);
                }
            }
            context.stroke();
        }
    }
    /**
     * 左端に線分を描画します。
     */
    drawBorderLeft() {
        const context = this.element.getContext('2d');
        if (context != null) {
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
     * グラフを描画します。
     */
    draw() {
        this.drawWaveform();
        this.drawBorderLeft();
    }
}
class ButtonComponent extends UiComponent {
    constructor(element) {
        super();
        this.element = element;
    }
    addClickEventListener(listener) {
        this.element.addEventListener('click', listener);
    }
}
class AudioButtonComponent extends ButtonComponent {
    constructor(element) {
        super(element);
    }
    hide() {
        this.element.style.display = 'none';
    }
    show() {
        this.element.style.display = 'block';
    }
}
// -------- Casting HTML Elements --------
/**
 * 取得したHTML要素の型が正しくない時に発生するエラーです。
 */
class InvalidHtmlElementError extends TypeError {
    /**
     * `InvalidHtmlElementError`のインスタンスを生成します。
     * @param message エラーメッセージ
     */
    constructor(message) {
        super(message);
        this.name = 'InvalidHtmlElementError';
    }
}
/**
 * `element`が`HTMLButtonElement`である場合はその型にキャストして返し、
 * そうでない場合は`InvalidHtmlElementError`を投げます。
 * @param element `document.querySelector()`で取得したHTML要素
 * @returns `HTMLButtonElement`にキャストされた`element`
 */
function returnHTMLButtonElementOrError(element) {
    if (element instanceof HTMLButtonElement) {
        return element;
    }
    else {
        throw new InvalidHtmlElementError(`${element} is not HTMLButtonElement`);
    }
}
/**
 * `element`が`HTMLCanvasElement`である場合はその型にキャストして返し、
 * そうでない場合は`InvalidHtmlElementError`を投げます。
 * @param element `document.querySelector()`で取得したHTML要素
 * @returns `HTMLCanvasElement`にキャストされた`element`
 */
function returnHTMLCanvasElementOrError(element) {
    if (element instanceof HTMLCanvasElement) {
        return element;
    }
    else {
        throw new InvalidHtmlElementError(`${element} is not HTMLCanvasElement`);
    }
}
/**
 * `element`が`HTMLInputElement`である場合はその型にキャストして返し、
 * そうでない場合は`InvalidHtmlElementError`を投げます。
 * @param element `document.querySelector()`で取得したHTML要素
 * @returns `HTMLInputElement`にキャストされた`element`
 */
function returnHTMLInputElementOrError(element) {
    if (element instanceof HTMLInputElement) {
        return element;
    }
    else {
        throw new InvalidHtmlElementError(`${element} is not HTMLInputElement`);
    }
}
/**
 * `element`が`HTMLLabelElement`である場合はその型にキャストして返し、
 * そうでない場合は`InvalidHtmlElementError`を投げます。
 * @param element `document.querySelector()`で取得したHTML要素
 * @returns `HTMLLabelElement`にキャストされた`element`
 */
function returnHTMLLabelElementOrError(element) {
    if (element instanceof HTMLLabelElement) {
        return element;
    }
    else {
        throw new InvalidHtmlElementError(`${element} is not HTMLLabelElement`);
    }
}
/**
 * "FM-Synthesis Waveform Visualizer"のアプリを表すクラスです。
 */
class FmSynthesisWaveformVisualizerApp {
    /**
     * `FmSynthesisWaveformVisualizerApp`のインスタンスを生成します。
     */
    constructor() {
        // Program
        this.visualFmSynthProgram = new FmSynthProgram(120, 0.5, 1);
        this.modulatorProgram = new OperatorProgram(new OperatorVolumeParameter('modulatorVolume', 1), new OperatorRatioParameter('modulatorRatio', 1));
        // Visual FM Synth
        this.visualFmSynth = new FmSynth(this.visualFmSynthProgram.samplingRate, this.visualFmSynthProgram.waveFrequency, this.visualFmSynthProgram.outputVolume);
        // Audio Engine
        this.audioEngine = new AudioEngine();
        // UI Components
        const modulatorVolumeInputElement = returnHTMLInputElementOrError(document.querySelector('#modulator-volume-input'));
        const modulatorVolumeValueLabelElement = returnHTMLLabelElementOrError(document.querySelector('#modulator-volume-value-label'));
        const modulatorRatioInputElement = returnHTMLInputElementOrError(document.querySelector('#modulator-ratio-input'));
        const modulatorRatioValueLabelElement = returnHTMLLabelElementOrError(document.querySelector('#modulator-ratio-value-label'));
        const modulatorPhaseGraphElement = returnHTMLCanvasElementOrError(document.querySelector('#modulator-phase-graph'));
        const modulatorOutputGraphElement = returnHTMLCanvasElementOrError(document.querySelector('#modulator-output-graph'));
        const modulatorWaveformGraphElement = returnHTMLCanvasElementOrError(document.querySelector('#modulator-waveform-graph'));
        this.modulatorComponent = {
            volumeInput: new RangeInputComponent(modulatorVolumeInputElement, modulatorVolumeValueLabelElement, this.modulatorProgram.volumeParameter.uiValue),
            ratioInput: new RangeInputComponent(modulatorRatioInputElement, modulatorRatioValueLabelElement, this.modulatorProgram.ratioParameter.uiValue),
            phaseGraph: new PhaseGraphComponent(modulatorPhaseGraphElement, this.visualFmSynth.modulator),
            outputGraph: new OutputGraphComponent(modulatorOutputGraphElement, this.visualFmSynth.modulator, true),
            waveformGraph: new WaveformGraphComponent(modulatorWaveformGraphElement, this.visualFmSynthProgram.samplingRate)
        };
        const carrierPhaseGraphElement = returnHTMLCanvasElementOrError(document.querySelector('#carrier-phase-graph'));
        const carrierOutputGraphElement = returnHTMLCanvasElementOrError(document.querySelector('#carrier-output-graph'));
        const carrierWaveformGraphElement = returnHTMLCanvasElementOrError(document.querySelector('#carrier-waveform-graph'));
        this.carrierComponent = {
            phaseGraph: new PhaseGraphComponent(carrierPhaseGraphElement, this.visualFmSynth.carrier),
            outputGraph: new OutputGraphComponent(carrierOutputGraphElement, this.visualFmSynth.carrier, false),
            waveformGraph: new WaveformGraphComponent(carrierWaveformGraphElement, this.visualFmSynthProgram.samplingRate)
        };
        const startAudioButtonElement = returnHTMLButtonElementOrError(document.querySelector('#start-audio-button'));
        const stopAudioButtonElement = returnHTMLButtonElementOrError(document.querySelector('#stop-audio-button'));
        this.startAudioButtonComponent = new AudioButtonComponent(startAudioButtonElement);
        this.stopAudioButtonComponent = new AudioButtonComponent(stopAudioButtonElement);
    }
    /**
     * `<html>`タグの`.no-js`クラスを`.js`に置き換え、JavaScriptが必要な要素の表示を切り替えます。
     */
    applyJsStyle() {
        document.documentElement.classList.replace('no-js', 'js');
    }
    /**
     * アプリの動作を`visualFmSynth`のサンプリングレート1つ分進めます。
     */
    moveFrameForward() {
        this.visualFmSynth.moveFrameForward();
        const modulatorOutputValue = this.visualFmSynth.modulator.output.value;
        this.modulatorComponent.waveformGraph.addValue(modulatorOutputValue);
        const carrierOutputValue = this.visualFmSynth.carrier.output.value;
        this.carrierComponent.waveformGraph.addValue(carrierOutputValue);
        const graphComponents = [
            this.modulatorComponent.phaseGraph,
            this.modulatorComponent.outputGraph,
            this.modulatorComponent.waveformGraph,
            this.carrierComponent.phaseGraph,
            this.carrierComponent.outputGraph,
            this.carrierComponent.waveformGraph
        ];
        graphComponents.forEach((graphComponent) => {
            graphComponent.update();
        });
    }
    /**
     * ModulatorのVolumeをUIから取得し、`visualFmSynth`/`audioEngine`に適用させます。
     */
    assignModulatorVolumeToSynth() {
        // UIから値を取得
        this.modulatorProgram.volumeParameter.uiValue = this.modulatorComponent.volumeInput.value;
        // グラフ用FMSynthに適用
        this.visualFmSynth.modulator.volume = this.modulatorProgram.volumeParameter.value;
        // 音声用FMSynthに適用
        if (this.audioEngine.isRunning) {
            this.audioEngine.setParameterValue(this.modulatorProgram.volumeParameter.name, this.modulatorProgram.volumeParameter.value);
        }
    }
    /**
     * ModulatorのRatioをUIから取得し、`visualFmSynth`/`audioEngine`に適用させます。
     */
    assignModulatorRatioToSynth() {
        // UIから値を取得
        this.modulatorProgram.ratioParameter.uiValue = this.modulatorComponent.ratioInput.value;
        // グラフ用FMSynthに適用
        this.visualFmSynth.modulator.ratio = this.modulatorProgram.ratioParameter.value;
        // 音声用FMSynthに適用
        if (this.audioEngine.isRunning) {
            this.audioEngine.setParameterValue(this.modulatorProgram.ratioParameter.name, this.modulatorProgram.ratioParameter.value);
        }
    }
    /**
     * `RangeInputComponent`にイベントリスナーを追加します。
     */
    addEventListenerToRangeInputComponents() {
        this.modulatorComponent.volumeInput.addEventListener(() => {
            this.assignModulatorVolumeToSynth();
        });
        this.modulatorComponent.ratioInput.addEventListener(() => {
            this.assignModulatorRatioToSynth();
        });
    }
    /**
     * `AudioButtonComponent`にイベントリスナーを追加します。
     */
    addEventListenerToAudioButtons() {
        this.startAudioButtonComponent.addClickEventListener(() => {
            if (!this.audioEngine.isRunning) {
                this.audioEngine.start(this.modulatorProgram, () => {
                    this.startAudioButtonComponent.hide();
                    this.stopAudioButtonComponent.show();
                });
            }
        });
        this.stopAudioButtonComponent.addClickEventListener(() => {
            if (this.audioEngine.isRunning) {
                this.audioEngine.stop();
            }
            this.stopAudioButtonComponent.hide();
            this.startAudioButtonComponent.show();
        });
    }
    /**
     * アプリが継続的に`moveFrameForward()`を呼び出すように設定します。
     */
    setInterval() {
        const oneSecond_ms = 1000;
        let intervalId = setInterval(() => {
            this.moveFrameForward();
        }, oneSecond_ms / this.visualFmSynthProgram.samplingRate);
    }
    /**
     * アプリの動作を開始します。
     */
    init() {
        this.applyJsStyle();
        this.assignModulatorVolumeToSynth();
        this.assignModulatorRatioToSynth();
        this.addEventListenerToRangeInputComponents();
        this.addEventListenerToAudioButtons();
        this.setInterval();
    }
}
// -------- Script --------
document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new FmSynthesisWaveformVisualizerApp();
        app.init();
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`${error.name}: ${error.message}`);
        }
        window.alert('アプリの内部でエラーが発生しました。\n' +
            'アプリの設計上の不具合の可能性がありますので、開発者までお知らせください。');
    }
});
