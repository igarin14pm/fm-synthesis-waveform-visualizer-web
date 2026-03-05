// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org
import { assertIsHTMLButtonElement, assertIsHTMLCanvasElement, assertIsHTMLInputElement, assertIsHTMLLabelElement } from "./assertion.js";
import { AudioEngine } from "./audio-engine.js";
import { FmSynth } from "./fm-synth.js";
import { Mode } from "./mode.js";
import { FmSynthProgram, OperatorProgram, OperatorRatioParameter, OperatorVolumeParameter } from "./program.js";
import { AudioButtonComponent, OutputGraphComponent, PhaseGraphComponent, RangeInputComponent, WaveformGraphComponent } from "./ui-component.js";
/**
 * "FM-Synthesis Waveform Visualizer"内で"Synthesis Mode"を"Carrier and Modulator"に
 * した時の画面をコントロールするクラスです。
 */
export class CarrierAndModulatorMode extends Mode {
    /**
     * `CarrierAndModulatorMode`のインスタンスを生成します。
     */
    constructor() {
        super();
        /**
         * `window.setInterval()`を呼び出した時の返り値
         */
        this.intervalId = null;
        // Program
        this.visualFmSynthProgram = new FmSynthProgram(120, 0.5, 1);
        this.modulatorProgram = new OperatorProgram(new OperatorVolumeParameter('modulatorVolume', 1), new OperatorRatioParameter('modulatorRatio', 1));
        // グラフ用の`FmSynth`
        this.visualFmSynth = new FmSynth(this.visualFmSynthProgram.samplingRate, this.visualFmSynthProgram.waveFrequency, this.visualFmSynthProgram.outputVolume);
        // `AudioEngine`
        this.audioEngine = new AudioEngine();
        // `ModulatorComponent`
        const modulatorVolumeInputElement = document.querySelector('#modulator-volume-input');
        const modulatorVolumeValueLabelElement = document.querySelector('#modulator-volume-value-label');
        const modulatorRatioInputElement = document.querySelector('#modulator-ratio-input');
        const modulatorRatioValueLabelElement = document.querySelector('#modulator-ratio-value-label');
        const modulatorPhaseGraphElement = document.querySelector('#modulator-phase-graph');
        const modulatorOutputGraphElement = document.querySelector('#modulator-output-graph');
        const modulatorWaveformGraphElement = document.querySelector('#modulator-waveform-graph');
        assertIsHTMLInputElement(modulatorVolumeInputElement);
        assertIsHTMLLabelElement(modulatorVolumeValueLabelElement);
        assertIsHTMLInputElement(modulatorRatioInputElement);
        assertIsHTMLLabelElement(modulatorRatioValueLabelElement);
        assertIsHTMLCanvasElement(modulatorPhaseGraphElement);
        assertIsHTMLCanvasElement(modulatorOutputGraphElement);
        assertIsHTMLCanvasElement(modulatorWaveformGraphElement);
        this.modulatorComponent = {
            volumeInput: new RangeInputComponent(modulatorVolumeInputElement, modulatorVolumeValueLabelElement, this.modulatorProgram.volumeParameter.uiValue),
            ratioInput: new RangeInputComponent(modulatorRatioInputElement, modulatorRatioValueLabelElement, this.modulatorProgram.ratioParameter.uiValue),
            phaseGraph: new PhaseGraphComponent(modulatorPhaseGraphElement, this.visualFmSynth.modulator),
            outputGraph: new OutputGraphComponent(modulatorOutputGraphElement, this.visualFmSynth.modulator, true),
            waveformGraph: new WaveformGraphComponent(modulatorWaveformGraphElement, this.visualFmSynthProgram.samplingRate)
        };
        // `CarrierComponent`
        const carrierPhaseGraphElement = document.querySelector('#carrier-phase-graph');
        const carrierOutputGraphElement = document.querySelector('#carrier-output-graph');
        const carrierWaveformGraphElement = document.querySelector('#carrier-waveform-graph');
        assertIsHTMLCanvasElement(carrierPhaseGraphElement);
        assertIsHTMLCanvasElement(carrierOutputGraphElement);
        assertIsHTMLCanvasElement(carrierWaveformGraphElement);
        this.carrierComponent = {
            phaseGraph: new PhaseGraphComponent(carrierPhaseGraphElement, this.visualFmSynth.carrier),
            outputGraph: new OutputGraphComponent(carrierOutputGraphElement, this.visualFmSynth.carrier, false),
            waveformGraph: new WaveformGraphComponent(carrierWaveformGraphElement, this.visualFmSynthProgram.samplingRate)
        };
        // "音声を再生する"ボタン
        const startAudioButtonElement = document.querySelector('#start-audio-button');
        assertIsHTMLButtonElement(startAudioButtonElement);
        this.startAudioButtonComponent = new AudioButtonComponent(startAudioButtonElement);
        // "音声を停止する"ボタン
        const stopAudioButtonElement = document.querySelector('#stop-audio-button');
        assertIsHTMLButtonElement(stopAudioButtonElement);
        this.stopAudioButtonComponent = new AudioButtonComponent(stopAudioButtonElement);
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
        graphComponents.forEach((graphComponent) => graphComponent.update());
    }
    /**
     * ModulatorのVolumeをUIから取得し、`visualFmSynth`/`audioEngine`に適用させます。
     */
    assignModulatorVolumeToSynth() {
        // UIから値を取得
        this.modulatorProgram.volumeParameter.uiValue = this.modulatorComponent.volumeInput.value;
        // グラフ用`FmSynth`に適用
        this.visualFmSynth.modulator.volume = this.modulatorProgram.volumeParameter.value;
        // 音声用`FmSynth`に適用
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
        // グラフ用`FmSynth`に適用
        this.visualFmSynth.modulator.ratio = this.modulatorProgram.ratioParameter.value;
        // 音声用`FmSynth`に適用
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
    addEventListenerToAudioButtonComponents() {
        this.startAudioButtonComponent.addClickEventListener(async () => {
            if (!this.audioEngine.isRunning) {
                await this.audioEngine.start(this.modulatorProgram);
            }
            this.startAudioButtonComponent.hide();
            this.stopAudioButtonComponent.show();
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
     * `CarrierAndModulatorMode`が継続的に`moveFrameForward()`を呼び出すように設定します。
     */
    setInterval() {
        const oneSecond_ms = 1000;
        this.intervalId = window.setInterval(() => {
            this.moveFrameForward();
        }, oneSecond_ms / this.visualFmSynthProgram.samplingRate);
    }
    /**
     * 継続的な`moveFrameForward()`の呼び出しを消去します。
     */
    clearInterval() {
        if (this.intervalId != null) {
            window.clearInterval(this.intervalId);
        }
    }
    /**
     * `CarrierAndModulatorMode`の動作を開始します。
     */
    start() {
        this.setInterval();
    }
    /**
     * `CarrierAndModulatorMode`の動作を停止します。
     */
    stop() {
        this.clearInterval();
        this.audioEngine.stop();
        this.stopAudioButtonComponent.hide();
        this.startAudioButtonComponent.show();
    }
    /**
     * アプリが読み込まれた時の動作です
     */
    init() {
        this.assignModulatorVolumeToSynth();
        this.assignModulatorRatioToSynth();
        this.addEventListenerToRangeInputComponents();
        this.addEventListenerToAudioButtonComponents();
    }
}
