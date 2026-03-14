// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org
import { assertIsHTMLButtonElement, assertIsHTMLCanvasElement, assertIsHTMLInputElement, assertIsHTMLLabelElement } from './assertion.js';
import { AudioEngine } from './audio-engine.js';
import { FmSynth } from './fm-synth.js';
import { Mode } from './mode.js';
import { FmSynthProgram, OperatorFeedbackParameter, OperatorProgram, OperatorRatioParameter, OperatorVolumeParameter } from './program.js';
import { CollapsibleButtonComponent, OutputGraphComponent, PhaseGraphComponent, RangeInputComponent, WaveformGraphComponent } from './ui-component.js';
/**
 * "FM-Synthesis Waveform Visualizer"内で"Synthesis Mode"を"Feedback"に
 * した時の画面をコントロールするクラスです。
 */
export class FeedbackMode extends Mode {
    /**
     * `FeedbackMode`のインスタンスを生成します。
     */
    constructor() {
        super();
        /**
         * `window.setInterval()`を呼び出した時の返り値
         */
        this.intervalId = null;
        // Program
        this.visualFmSynthProgram = new FmSynthProgram(120, 0.5, 1);
        this.carrierProgram = new OperatorProgram(new OperatorVolumeParameter('', 1), new OperatorRatioParameter('', 1), new OperatorFeedbackParameter('carrierFeedback', 1));
        // グラフ用の`FmSynth`
        this.visualFmSynth = new FmSynth(this.visualFmSynthProgram.samplingRate, this.visualFmSynthProgram.waveFrequency, this.visualFmSynthProgram.outputVolume);
        // Audio Engine
        this.audioEngine = new AudioEngine();
        // `UiComponent`
        const carrierFeedbackInputElement = document.querySelector('#fb-carrier-feedback-input');
        const carrierFeedbackValueLabelElement = document.querySelector('#fb-carrier-feedback-value-label');
        const carrierPhaseGraphElement = document.querySelector('#fb-carrier-phase-graph');
        const carrierOutputGraphElement = document.querySelector('#fb-carrier-output-graph');
        const carrierWaveformGraphElement = document.querySelector('#fb-carrier-waveform-graph');
        assertIsHTMLInputElement(carrierFeedbackInputElement);
        assertIsHTMLLabelElement(carrierFeedbackValueLabelElement);
        assertIsHTMLCanvasElement(carrierPhaseGraphElement);
        assertIsHTMLCanvasElement(carrierOutputGraphElement);
        assertIsHTMLCanvasElement(carrierWaveformGraphElement);
        this.carrierComponentGroup = {
            feedbackInput: new RangeInputComponent(carrierFeedbackInputElement, carrierFeedbackValueLabelElement, this.carrierProgram.feedbackParameter.uiValue),
            phaseGraph: new PhaseGraphComponent(carrierPhaseGraphElement, this.visualFmSynth.carrier),
            outputGraph: new OutputGraphComponent(carrierOutputGraphElement, this.visualFmSynth.carrier, true),
            waveformGraph: new WaveformGraphComponent(carrierWaveformGraphElement, this.visualFmSynthProgram.samplingRate)
        };
        // "音声を再生する"ボタン
        const startAudioButtonElement = document.querySelector('#fb-start-audio-button');
        assertIsHTMLButtonElement(startAudioButtonElement);
        this.startAudioButtonComponent = new CollapsibleButtonComponent(startAudioButtonElement);
        // "音声を停止する"ボタン
        const stopAudioButtonElement = document.querySelector('#fb-stop-audio-button');
        assertIsHTMLButtonElement(stopAudioButtonElement);
        this.stopAudioButtonComponent = new CollapsibleButtonComponent(stopAudioButtonElement);
    }
    /**
     * アプリの動作を`visualFmSynth`のサンプリングレート1つ分進めます。
     */
    moveFrameForward() {
        this.visualFmSynth.moveFrameForward();
        const carrierOutputValue = this.visualFmSynth.carrier.output.value;
        this.carrierComponentGroup.waveformGraph.addValue(carrierOutputValue);
        const graphComponents = [
            this.carrierComponentGroup.phaseGraph,
            this.carrierComponentGroup.outputGraph,
            this.carrierComponentGroup.waveformGraph
        ];
        graphComponents.forEach((graphComponent) => graphComponent.update());
    }
    /**
     * CarrierのFeedbackをUIから取得し、`visualFmSynth`/`audioEngine`に適用させます。
     */
    assignCarrierFeedbackToSynth() {
        // UIから値を取得
        this.carrierProgram.feedbackParameter.uiValue = this.carrierComponentGroup.feedbackInput.value;
        // グラフ用`FmSynth`に適用
        this.visualFmSynth.carrier.feedback = this.carrierProgram.feedbackParameter.value;
        // 音声用`FmSynth`に適用
        if (this.audioEngine.isRunning) {
            this.audioEngine.setParameterValue(this.carrierProgram.feedbackParameter.name, this.carrierProgram.feedbackParameter.value);
        }
    }
    addEventListenerToRangeInputComponent() {
        this.carrierComponentGroup.feedbackInput.addEventListener(() => {
            this.assignCarrierFeedbackToSynth();
        });
    }
    addEventListenerToAudioButtonComponents() {
        this.startAudioButtonComponent.addClickEventListener(async () => {
            if (!this.audioEngine.isRunning) {
                await this.audioEngine.start(null, this.carrierProgram);
            }
            this.startAudioButtonComponent.isCollapsed = true;
            this.stopAudioButtonComponent.isCollapsed = false;
        });
        this.stopAudioButtonComponent.addClickEventListener(() => {
            if (this.audioEngine.isRunning) {
                this.audioEngine.stop();
            }
            this.stopAudioButtonComponent.isCollapsed = true;
            this.startAudioButtonComponent.isCollapsed = false;
        });
    }
    /**
     * `FeedbackMode`が継続的に`moveFrameForward()`を呼び出すように設定します。
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
     * `FeedbackMode`の動作を開始します。
     */
    start() {
        this.setInterval();
    }
    /**
     * `FeedbackMode`の動作を停止します。
     */
    stop() {
        this.clearInterval();
        if (this.audioEngine.isRunning) {
            this.audioEngine.stop();
        }
        this.stopAudioButtonComponent.isCollapsed = true;
        this.startAudioButtonComponent.isCollapsed = false;
    }
    /**
     * アプリが読み込まれた時の動作です。
     */
    init() {
        this.assignCarrierFeedbackToSynth();
        this.addEventListenerToRangeInputComponent();
        this.addEventListenerToAudioButtonComponents();
    }
}
