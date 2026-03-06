// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

import { 
  assertIsHTMLButtonElement, 
  assertIsHTMLCanvasElement, 
  assertIsHTMLInputElement, 
  assertIsHTMLLabelElement 
} from './assertion.js';
import { AudioEngine } from './audio-engine.js';
import { FmSynth } from './fm-synth.js';
import { Mode } from './mode.js';
import { 
  FmSynthProgram, 
  OperatorFeedbackParameter, 
  OperatorProgram, 
  OperatorRatioParameter, 
  OperatorVolumeParameter 
} from './program.js';
import { 
  AudioButtonComponent,
  GraphComponent, 
  OutputGraphComponent, 
  PhaseGraphComponent, 
  RangeInputComponent, 
  WaveformGraphComponent 
} from './ui-component.js';

/**
 *  Carrierに関連する`UiComponent`クラスのインスタンスをまとめたオブジェクトの型を定義するインターフェースです。
 */
export interface CarrierComponent {

  /**
   * CarrierのFeedbackを操作する`RangeInputComponent`のインスタンス
   */
  feedbackInput: RangeInputComponent;

  /**
   * Carrierの位相グラフを描画する`PhaseGraphComponent`のインスタンス
   */
  phaseGraph: PhaseGraphComponent;

  /**
   * Carrierの出力グラフを描画する`OutputGraphComponent`のインスタンス
   */
  outputGraph: OutputGraphComponent;

  /**
   * Carrierの波形グラフを描画する`WaveformGraphComponent`のインスタンス
   */
  waveformGraph: WaveformGraphComponent;

}

/**
 * "FM-Synthesis Waveform Visualizer"内で"Synthesis Mode"を"Feedback"に
 * した時の画面をコントロールするクラスです。
 */
export class FeedbackMode extends Mode {

  /**
   * `visualFmSynth`のパラメータを格納する`FmSynthProgram`のインスタンス
   */
  visualFmSynthProgram: FmSynthProgram;

  /**
   * `visualFmSynth.carrier`のパラメータを格納する`OperatorProgram`のインスタンス
   */
  carrierProgram: OperatorProgram;

  /**
   * 画面上の波形の描画に使われる`FmSynth`のインスタンス
   */
  visualFmSynth: FmSynth;

  /**
   * FM音源の再生に使われる`AudioEngine`のインスタンス
   */
  audioEngine: AudioEngine;

  /**
   * Carrier関連の`UiComponent`が格納されたオブジェクト
   */
  carrierComponent: CarrierComponent;

  /**
   * "音声を再生する"ボタンを操作する`AudioButtonComponent`のインスタンス
   */
  startAudioButtonComponent: AudioButtonComponent;

  /**
   * "音声を停止する"ボタンを操作する`AudioButtonComponent`のインスタンス
   */
  stopAudioButtonComponent: AudioButtonComponent;

  /**
   * `window.setInterval()`を呼び出した時の返り値
   */
  intervalId: number | null = null;

  /**
   * `FeedbackMode`のインスタンスを生成します。
   */
  constructor() {

    super();

    // Program
    this.visualFmSynthProgram = new FmSynthProgram(120, 0.5, 1);
    this.carrierProgram = new OperatorProgram(
      new OperatorVolumeParameter('', 1),
      new OperatorRatioParameter('', 1),
      new OperatorFeedbackParameter('carrierFeedback', 1)
    );

    // グラフ用の`FmSynth`
    this.visualFmSynth = new FmSynth(
      this.visualFmSynthProgram.samplingRate,
      this.visualFmSynthProgram.waveFrequency,
      this.visualFmSynthProgram.outputVolume
    );

    // Audio Engine
    this.audioEngine = new AudioEngine();

    // `UiComponent`
    const carrierFeedbackInputElement: Element | null = document.querySelector('#fb-carrier-feedback-input');
    const carrierFeedbackValueLabelElement: Element | null = document.querySelector('#fb-carrier-feedback-value-label');
    const carrierPhaseGraphElement: Element | null = document.querySelector('#fb-carrier-phase-graph');
    const carrierOutputGraphElement: Element | null = document.querySelector('#fb-carrier-output-graph');
    const carrierWaveformGraphElement: Element | null = document.querySelector('#fb-carrier-waveform-graph');
    assertIsHTMLInputElement(carrierFeedbackInputElement);
    assertIsHTMLLabelElement(carrierFeedbackValueLabelElement);
    assertIsHTMLCanvasElement(carrierPhaseGraphElement);
    assertIsHTMLCanvasElement(carrierOutputGraphElement);
    assertIsHTMLCanvasElement(carrierWaveformGraphElement);
    this.carrierComponent = {
      feedbackInput: new RangeInputComponent(
        carrierFeedbackInputElement,
        carrierFeedbackValueLabelElement,
        this.carrierProgram.feedbackParameter.uiValue
      ),
      phaseGraph: new PhaseGraphComponent(
        carrierPhaseGraphElement,
        this.visualFmSynth.carrier
      ),
      outputGraph: new OutputGraphComponent(
        carrierOutputGraphElement,
        this.visualFmSynth.carrier,
        true
      ),
      waveformGraph: new WaveformGraphComponent(
        carrierWaveformGraphElement,
        this.visualFmSynthProgram.samplingRate
      )
    };

    // "音声を再生する"ボタン
    const startAudioButtonElement: Element | null = document.querySelector('#fb-start-audio-button');
    assertIsHTMLButtonElement(startAudioButtonElement);
    this.startAudioButtonComponent = new AudioButtonComponent(startAudioButtonElement);

    // "音声を停止する"ボタン
    const stopAudioButtonElement: Element | null = document.querySelector('#fb-stop-audio-button');
    assertIsHTMLButtonElement(stopAudioButtonElement);
    this.stopAudioButtonComponent = new AudioButtonComponent(stopAudioButtonElement);

  }

  /**
   * アプリの動作を`visualFmSynth`のサンプリングレート1つ分進めます。
   */
  moveFrameForward(): void {

    this.visualFmSynth.moveFrameForward();

    const carrierOutputValue: number = this.visualFmSynth.carrier.output.value;
    this.carrierComponent.waveformGraph.addValue(carrierOutputValue);

    const graphComponents: GraphComponent[] = [
      this.carrierComponent.phaseGraph,
      this.carrierComponent.outputGraph,
      this.carrierComponent.waveformGraph
    ];
    graphComponents.forEach((graphComponent) => graphComponent.update());

  }

  /**
   * CarrierのFeedbackをUIから取得し、`visualFmSynth`/`audioEngine`に適用させます。
   */
  assignCarrierFeedbackToSynth(): void {

    // UIから値を取得
    this.carrierProgram.feedbackParameter.uiValue = this.carrierComponent.feedbackInput.value;

    // グラフ用`FmSynth`に適用
    this.visualFmSynth.carrier.feedback = this.carrierProgram.feedbackParameter.value;

    // 音声用`FmSynth`に適用
    if (this.audioEngine.isRunning) {
      this.audioEngine.setParameterValue(
        this.carrierProgram.feedbackParameter.name,
        this.carrierProgram.feedbackParameter.value
      );
    }
  }

  addEventListenerToRangeInputComponent(): void {
    this.carrierComponent.feedbackInput.addEventListener(() => {
      this.assignCarrierFeedbackToSynth();
    });
  }

  addEventListenerToAudioButtonComponents(): void {
    this.startAudioButtonComponent.addClickEventListener(async () => {
      if (!this.audioEngine.isRunning) {
        await this.audioEngine.start(null, this.carrierProgram);
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
   * `FeedbackMode`が継続的に`moveFrameForward()`を呼び出すように設定します。
   */
  setInterval(): void {
    const oneSecond_ms = 1_000;
    this.intervalId = window.setInterval(() => {
      this.moveFrameForward();
    }, oneSecond_ms / this.visualFmSynthProgram.samplingRate);
  }

  /**
   * 継続的な`moveFrameForward()`の呼び出しを消去します。
   */
  clearInterval(): void {
    if (this.intervalId != null) {
      window.clearInterval(this.intervalId);
    }
  }

  /**
   * `FeedbackMode`の動作を開始します。
   */
  override start(): void {
    this.setInterval();
  }

  /**
   * `FeedbackMode`の動作を停止します。
   */
  override stop(): void {
    this.clearInterval();

    if (this.audioEngine.isRunning) {
      this.audioEngine.stop();
    }
    this.stopAudioButtonComponent.hide();
    this.startAudioButtonComponent.show();
  }

  /**
   * アプリが読み込まれた時の動作です。
   */
  init(): void {
    this.assignCarrierFeedbackToSynth();

    this.addEventListenerToRangeInputComponent();
    this.addEventListenerToAudioButtonComponents();
  }

}
