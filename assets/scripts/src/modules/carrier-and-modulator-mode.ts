// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

import { 
  assertIsHTMLButtonElement, 
  assertIsHTMLCanvasElement, 
  assertIsHTMLInputElement, 
  assertIsHTMLLabelElement 
} from "./assertion.js";
import { AudioEngine } from "./audio-engine.js";
import { FmSynth } from "./fm-synth.js";
import { Mode } from "./mode.js";
import { 
  FmSynthProgram, 
  OperatorFeedbackParameter, 
  OperatorProgram, 
  OperatorRatioParameter, 
  OperatorVolumeParameter 
} from "./program.js";
import { 
  AudioButtonComponent, 
  GraphComponent, 
  OutputGraphComponent, 
  PhaseGraphComponent, 
  RangeInputComponent, 
  WaveformGraphComponent 
} from "./ui-component.js";

/**
 * Modulatorに関連する`UiComponent`クラスのインスタンスをまとめたオブジェクトの型を定義するインターフェースです。
 */
export interface ModulatorComponent {

  /**
   * ModulatorのVolumeを操作する`RangeInputComponent`のインスタンス
   */
  volumeInput: RangeInputComponent;

  /**
   * ModulatorのRatioを操作する`RangeInputComponent`のインスタンス
   */
  ratioInput: RangeInputComponent;

  /**
   * Modulatorの位相グラフを描画する`PhaseGraphComponent`のインスタンス
   */
  phaseGraph: PhaseGraphComponent;

  /**
   * Modulatorの出力グラフを描画する`OutputGraphComponent`のインスタンス
   */
  outputGraph: OutputGraphComponent;

  /**
   * Modulatorの波形グラフを描画する`WaveformGraphComponent`のインスタンス
   */
  waveformGraph: WaveformGraphComponent;

}

/**
 * Carrierに関連する`UiComponent`クラスのインスタンスをまとめたオブジェクトの型を定義するインターフェースです。
 */
export interface CarrierComponent {

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
 * "FM-Synthesis Waveform Visualizer"内で"Synthesis Mode"を"Carrier and Modulator"に
 * した時の画面をコントロールするクラスです。
 */
export class CarrierAndModulatorMode extends Mode {

  /**
   * `visualFmSynth`のパラメータを格納する`FmSynthProgram`のインスタンス
   */
  visualFmSynthProgram: FmSynthProgram;

  /**
   * `visualFmSynth.modulator`のパラメータを格納する`OperatorProgram`のインスタンス
   */
  modulatorProgram: OperatorProgram;

  /**
   * 画面上の波形の描画に使われる`FmSynth`のインスタンス
   */
  visualFmSynth: FmSynth;

  /**
   * FM音源の再生に使われる`AudioEngine`のインスタンス
   */
  audioEngine: AudioEngine;

  /**
   * Modulator関連の`UiComponent`が格納されたオブジェクト
   */
  modulatorComponent: ModulatorComponent;

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
   * `CarrierAndModulatorMode`のインスタンスを生成します。
   */
  constructor() {

    super();

    // Program
    this.visualFmSynthProgram = new FmSynthProgram(120, 0.5, 1);
    this.modulatorProgram = new OperatorProgram(
      new OperatorVolumeParameter('modulatorVolume', 1),
      new OperatorRatioParameter('modulatorRatio', 1),
      new OperatorFeedbackParameter('', 0)
    );

    // グラフ用の`FmSynth`
    this.visualFmSynth = new FmSynth(
      this.visualFmSynthProgram.samplingRate,
      this.visualFmSynthProgram.waveFrequency,
      this.visualFmSynthProgram.outputVolume
    );

    // `AudioEngine`
    this.audioEngine = new AudioEngine();

    // `ModulatorComponent`
    const modulatorVolumeInputElement: Element | null = document.querySelector('#cnm-modulator-volume-input');
    const modulatorVolumeValueLabelElement: Element | null = document.querySelector('#cnm-modulator-volume-value-label');
    const modulatorRatioInputElement: Element | null = document.querySelector('#cnm-modulator-ratio-input');
    const modulatorRatioValueLabelElement: Element | null = document.querySelector('#cnm-modulator-ratio-value-label');
    const modulatorPhaseGraphElement: Element | null = document.querySelector('#cnm-modulator-phase-graph');
    const modulatorOutputGraphElement: Element | null = document.querySelector('#cnm-modulator-output-graph');
    const modulatorWaveformGraphElement: Element | null = document.querySelector('#cnm-modulator-waveform-graph');
    assertIsHTMLInputElement(modulatorVolumeInputElement);
    assertIsHTMLLabelElement(modulatorVolumeValueLabelElement);
    assertIsHTMLInputElement(modulatorRatioInputElement);
    assertIsHTMLLabelElement(modulatorRatioValueLabelElement);
    assertIsHTMLCanvasElement(modulatorPhaseGraphElement);
    assertIsHTMLCanvasElement(modulatorOutputGraphElement);
    assertIsHTMLCanvasElement(modulatorWaveformGraphElement);
    this.modulatorComponent = {
      volumeInput: new RangeInputComponent(
        modulatorVolumeInputElement,
        modulatorVolumeValueLabelElement,
        this.modulatorProgram.volumeParameter.uiValue
      ),
      ratioInput: new RangeInputComponent(
        modulatorRatioInputElement,
        modulatorRatioValueLabelElement,
        this.modulatorProgram.ratioParameter.uiValue
      ),
      phaseGraph: new PhaseGraphComponent(
        modulatorPhaseGraphElement,
        this.visualFmSynth.modulator
      ),
      outputGraph: new OutputGraphComponent(
        modulatorOutputGraphElement,
        this.visualFmSynth.modulator,
        true
      ),
      waveformGraph: new WaveformGraphComponent(
        modulatorWaveformGraphElement,
        this.visualFmSynthProgram.samplingRate
      )
    };

    // `CarrierComponent`
    const carrierPhaseGraphElement: Element | null = document.querySelector('#cnm-carrier-phase-graph');
    const carrierOutputGraphElement: Element | null = document.querySelector('#cnm-carrier-output-graph');
    const carrierWaveformGraphElement: Element | null = document.querySelector('#cnm-carrier-waveform-graph');
    assertIsHTMLCanvasElement(carrierPhaseGraphElement);
    assertIsHTMLCanvasElement(carrierOutputGraphElement);
    assertIsHTMLCanvasElement(carrierWaveformGraphElement);
    this.carrierComponent = {
      phaseGraph: new PhaseGraphComponent(
        carrierPhaseGraphElement,
        this.visualFmSynth.carrier
      ),
      outputGraph: new OutputGraphComponent(
        carrierOutputGraphElement,
        this.visualFmSynth.carrier,
        false
      ),
      waveformGraph: new WaveformGraphComponent(
        carrierWaveformGraphElement,
        this.visualFmSynthProgram.samplingRate
      )
    };

    // "音声を再生する"ボタン
    const startAudioButtonElement: Element | null = document.querySelector('#cnm-start-audio-button');
    assertIsHTMLButtonElement(startAudioButtonElement);
    this.startAudioButtonComponent = new AudioButtonComponent(startAudioButtonElement);

    // "音声を停止する"ボタン
    const stopAudioButtonElement: Element | null = document.querySelector('#cnm-stop-audio-button');
    assertIsHTMLButtonElement(stopAudioButtonElement);
    this.stopAudioButtonComponent = new AudioButtonComponent(stopAudioButtonElement);

  }

  /**
   * アプリの動作を`visualFmSynth`のサンプリングレート1つ分進めます。
   */
  moveFrameForward(): void {

    this.visualFmSynth.moveFrameForward();

    const modulatorOutputValue: number = this.visualFmSynth.modulator.output.value;
    this.modulatorComponent.waveformGraph.addValue(modulatorOutputValue);

    const carrierOutputValue: number = this.visualFmSynth.carrier.output.value;
    this.carrierComponent.waveformGraph.addValue(carrierOutputValue);

    const graphComponents: GraphComponent[] = [
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
  assignModulatorVolumeToSynth(): void {

    // UIから値を取得
    this.modulatorProgram.volumeParameter.uiValue = this.modulatorComponent.volumeInput.value;

    // グラフ用`FmSynth`に適用
    this.visualFmSynth.modulator.volume = this.modulatorProgram.volumeParameter.value;

    // 音声用`FmSynth`に適用
    if (this.audioEngine.isRunning) {
      this.audioEngine.setParameterValue(
        this.modulatorProgram.volumeParameter.name,
        this.modulatorProgram.volumeParameter.value
      );
    }

  }

  /**
   * ModulatorのRatioをUIから取得し、`visualFmSynth`/`audioEngine`に適用させます。
   */
  assignModulatorRatioToSynth(): void {

    // UIから値を取得
    this.modulatorProgram.ratioParameter.uiValue = this.modulatorComponent.ratioInput.value;

    // グラフ用`FmSynth`に適用
    this.visualFmSynth.modulator.ratio = this.modulatorProgram.ratioParameter.value;

    // 音声用`FmSynth`に適用
    if (this.audioEngine.isRunning) {
      this.audioEngine.setParameterValue(
        this.modulatorProgram.ratioParameter.name,
        this.modulatorProgram.ratioParameter.value
      );
    }

  }

  /**
   * `RangeInputComponent`にイベントリスナーを追加します。
   */
  addEventListenerToRangeInputComponents(): void {
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
  addEventListenerToAudioButtonComponents(): void {
    this.startAudioButtonComponent.addClickEventListener(async () => {
      if (!this.audioEngine.isRunning) {
        await this.audioEngine.start(this.modulatorProgram, null);
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
   * `CarrierAndModulatorMode`の動作を開始します。
   */
  override start(): void {
    this.setInterval();
  }

  /**
   * `CarrierAndModulatorMode`の動作を停止します。
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
   * アプリが読み込まれた時の動作です
   */
  init(): void {
    this.assignModulatorVolumeToSynth();
    this.assignModulatorRatioToSynth();
    this.addEventListenerToRangeInputComponents();
    this.addEventListenerToAudioButtonComponents();
  }

}