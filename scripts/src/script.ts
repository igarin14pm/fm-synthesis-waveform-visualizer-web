// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

import { Operator, FmSynth } from './fm-synth.js';

// -------- Program Class --------

/**
 * プログラムのパラメータを表す抽象クラスです
 */
abstract class ProgramParameter {
  
  /**
   * パラメータの値
   */
  value: number;

  /**
   * UI上で表示するパラメーターの値
   */
  abstract get uiValue(): number;

  /**
   * UI上で表示するパラメーターの値
   */
  abstract set uiValue(newValue: number);

  /**
   * `ProgramParameter`のインスタンスを生成します
   * @param name `AudioParam`で使用するパラメータ名
   * @param initialValue パラメータの初期値
   */
  constructor(
    public name: string,
    initialValue: number
  ) {
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
  override get uiValue(): number {
    return this.value * 100;
  }

  /**
   * UI上で表示するパラメーターの値
   */
  override set uiValue(newValue: number) {
    this.value = newValue / 100;
  }

  /**
   * `OperatorVolumeParameter`のインスタンスを生成します
   * @param name `AudioParam`で使用するパラメータ名
   * @param initialValue パラメータの初期値
   */
  constructor(name: string, initialValue: number) {
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
  override get uiValue(): number {
    return this.value;
  }

  /**
   * UI上で表示するパラメーターの値
   */
  override set uiValue(newValue: number) {
    this.value = newValue;
  }

  /**
   * `OperatorRatioParameter`のインスタンスを生成します
   * @param name `AudioParam`で使用するパラメータ名
   * @param initialValue パラメータの初期値
   */
  constructor(name: string, initialValue: number) {
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
  constructor(
    public volumeParameter: OperatorVolumeParameter,
    public ratioParameter: OperatorRatioParameter
  ) { }

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
  constructor(
    public readonly samplingRate: number,
    public readonly waveFrequency: number,
    public readonly outputVolume: number
  ) { }

}

// -------- Audio Class --------

/**
 * オーディオの処理を行うクラスです。
 */
class AudioEngine {

  /**
   * Web Audio APIのAudioContextインスタンスです
   */
  audioContext: AudioContext | null = null;
  
  /**
   * FMシンセサイザーの音を出力するAudioWorkletNodeです
   */
  audioWorkletNode: AudioWorkletNode | null = null; 

  /**
   * AudioEngineが音を出力中かを表します
   */
  get isRunning(): boolean {
    return this.audioContext != null;
  }

  /**
   * 指定したパラメーター名にパラメーターの値をセットします
   * @param name AudioParamDescriptorで指定したパラメーター名
   * @param value パラメーターの値
   */
  setParameterValue(name: string, value: number) {
    if (this.audioContext != null && this.audioWorkletNode != null) {
      const param: AudioParam | undefined = this.audioWorkletNode.parameters.get(name);
      param?.setValueAtTime(value, this.audioContext!.currentTime);
    }
  }

  /**
   * 音声を再生します。
   * @param modulatorValue モジュレーターの値を格納したOperatorValueのインスタンス
   * @param callback 再生を始める処理が完了した後に呼ばれる関数
   */
  async start(modulatorProgram: OperatorProgram, callback: () => void) {
    this.audioContext = new AudioContext();
    await this.audioContext.audioWorklet.addModule('./scripts/dist/fm-synth-audio-processor.js');
    this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'fm-synth-audio-processor');

    this.setParameterValue(
      modulatorProgram.volumeParameter.name,
      modulatorProgram.volumeParameter.value
    );
    this.setParameterValue(
      modulatorProgram.ratioParameter.name,
      modulatorProgram.ratioParameter.value
    );
    
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
class UiComponent { }

/**
 * パラメーターを変更する`<input>`要素を扱うためのクラスです。
 */
class RangeInputComponent extends UiComponent {

  /**
   * `<input>`要素の値
   */
  get value(): number {
    return parseInt(this.inputElement.value);
  }

  /**
   * RangeInputUIのインスタンスを生成します。
   * @param inputElement DOMで取得した`<input>`要素
   * @param valueLabelElement DOMで取得した値を表示する`<label>`要素
   * @param initialValue `<input>`要素に設定する初期値
   */
  constructor(
    public inputElement: HTMLInputElement,
    public valueLabelElement: HTMLLabelElement,
    initialValue: number
  ) {
    super();
    inputElement.value = initialValue.toString();
    valueLabelElement.textContent = initialValue.toString();
  }

  /**
   * `<input>`要素に値が入力した時に発生するイベントリスナーを設定します。
   */
  addEventListener(listener: () => void): void {
    this.inputElement.addEventListener('input', () => {
      listener();
      this.valueLabelElement.textContent = this.inputElement.value;
    })
  }

}

/**
 * `<canvas>`要素にグラフを描画するための抽象クラスです
 */
abstract class GraphComponent extends UiComponent {

  /**
   * グラフに描画する波形の上下の余白の大きさ
   */
  verticalPadding = 10;

  /**
   * `<canvas>`要素の幅
   */
  get width(): number {
    return this.element.width;
  }

  /**
   * `<canvas>`要素の高さ
   */
  get height(): number {
    return this.element.height;
  }

  /**
   * Graphのインスタンスを生成します。
   * @param element DOMで取得したCanvas要素
   */
  constructor(public element: HTMLCanvasElement) {
    super();
  }

  /**
   * 波形の出力信号の値(-1.0〜1.0)をグラフのY座標に変換します
   * @param value 変換する波形の出力信号の値
   * @returns グラフのY座標
   */
  convertToCoordinateY(value: number): number {
    return (this.height - this.verticalPadding * 2) * (-1 * value + 1) / 2 + this.verticalPadding;
  }

  /**
   * グラフを描画します。
   */
  abstract draw(): void;

  /**
   * グラフの描画をすべて削除します。
   */
  clear(): void {
    let context: CanvasRenderingContext2D = this.element.getContext('2d')!;
    context.clearRect(0, 0, this.width, this.height);
  }

  /**
   * グラフを削除して描画し直します。
   */
  update(): void {
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
  constructor(
    element: HTMLCanvasElement, 
    public operator: Operator
  ) {
    super(element);
  }

  /**
   * グラフを描画します。
   */
  override draw(): void {
    const sineWaveValueLength = 120 + 1; // sin(x) = 0 の時の値が綺麗に描画されるように+1する(植木算の考えで)
    const context: CanvasRenderingContext2D = this.element.getContext('2d')!;

    // モジュレーション量を描画
    context.fillStyle = '#00cdb944';
    const phaseWithoutModX: number = this.width * this.operator.phase.valuesWithoutMod[0];
    const modRectY = 0;
    const modRectWidth: number = this.width * this.operator.phase.modulationValue;
    const modRectHeight: number = this.height;
    if (phaseWithoutModX + modRectWidth > this.width) {
      // 長方形がCanvas要素から右側にはみ出る場合

      // 右端の長方形を描画
      context.fillRect(phaseWithoutModX, modRectY, this.width - phaseWithoutModX, this.height);

      // 左端の長方形を描画
      context.fillRect(0, modRectY, phaseWithoutModX + modRectWidth - this.width, modRectHeight);
      
    } else if (phaseWithoutModX + modRectWidth < 0) {
      // 図形がCanvas要素から左側にはみ出る場合

      // 左端の長方形を描画
      context.fillRect(phaseWithoutModX, modRectY, -1 * phaseWithoutModX, modRectHeight);

      // 右端の長方形を描画
      context.fillRect(this.width, modRectY, phaseWithoutModX + modRectWidth, modRectHeight);

    } else {
      // 長方形がCanvas要素からはみ出ない場合
      context.fillRect(phaseWithoutModX, modRectY, modRectWidth, modRectHeight);
    }

    // サイン波を描画
    context.strokeStyle = '#eeeeee';
    context.lineWidth = 4;
    context.beginPath();
    for (let i = 0; i < sineWaveValueLength; i++) {
      const sineWaveValue: number = Math.sin(2 * Math.PI * i / (sineWaveValueLength - 1));

      const sineWaveX: number = this.width * i / (sineWaveValueLength - 1);
      const sineWaveY: number = this.convertToCoordinateY(this.operator.volume * sineWaveValue);

      if (i === 0) {
        context.moveTo(sineWaveX, sineWaveY);
      } else {
        context.lineTo(sineWaveX, sineWaveY);
      }
    }
    context.stroke();

    // 位相を表す線分を描画
    context.strokeStyle = '#00cdb9';
    context.lineWidth = 8;
    context.beginPath();
    const phaseLineX: number = this.width * this.operator.phase.output.value;
    const phaseLineStartY = 0;
    const phaseLineEndY: number = this.height;
    context.moveTo(phaseLineX, phaseLineStartY);
    context.lineTo(phaseLineX, phaseLineEndY);
    context.stroke();

    // 値の出力を表す線分を描画
    context.strokeStyle = '#888888';
    context.lineWidth = 4;
    context.beginPath();
    const outputLineStartX: number = phaseLineX;
    const outputLineEndX: number = this.width;
    const outputLineY: number = this.convertToCoordinateY(this.operator.output.value);
    context.moveTo(outputLineStartX, outputLineY);
    context.lineTo(outputLineEndX, outputLineY);
    context.stroke();

    // 値を表す円を描画
    context.fillStyle = '#00cdb9';
    const valueCircleX: number = phaseLineX;
    const valueCircleY: number = outputLineY;
    const valueCircleRadius = 12.5;
    context.arc(valueCircleX, valueCircleY, valueCircleRadius, 0, 2 * Math.PI);
    context.fill();
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
  constructor(
    element: HTMLCanvasElement, 
    public operator: Operator, 
    public showsModulatingAmount: boolean
  ) {
    super(element);
  }

  /**
   * グラフを描画します。
   */
  override draw(): void {
    const context: CanvasRenderingContext2D = this.element.getContext('2d')!;

    const outputLineStartX = 0;
    const outputLineEndX: number = this.width;
    const outputLineY: number = this.convertToCoordinateY(this.operator.output.value);

    // 変調を掛ける量を表す長方形を描画
    if (this.showsModulatingAmount) {
      const amountRectX: number = this.width / 3;
      const amountRectWidth: number = this.width / 3;

      // 枠線を描画
      const amountRectOutlineY: number = this.verticalPadding;
      const amountRectOutlineHeight: number = this.height - this.verticalPadding * 2;
      context.strokeStyle = '#eeeeee';
      context.lineWidth = 4;
      context.strokeRect(amountRectX, amountRectOutlineY, amountRectWidth, amountRectOutlineHeight);

      // 塗りつぶしを描画
      const amountRectFillY: number = this.height / 2;
      const amountRectFillHeight: number = outputLineY - amountRectFillY;
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
 * 波形グラフを描画するためのクラスです。
 * オペレーターの波形を描画します。
 */
class WaveformGraphComponent extends GraphComponent {

  /**
   * 表示するデータの値の配列
   */
  values: number[];

  /**
   * WaveformGraphのインスタンスを生成します。
   * @param element DOMで取得した`<canvas>`要素
   * @param samplingRate FMSynthのサンプリングレート
   */
  constructor(element: HTMLCanvasElement, samplingRate: number) {
    super(element);
    const duration_sec = 4;
    const valueLength: number = samplingRate * duration_sec + 1; // sin(x) = 0 の時の値が綺麗に描画されるように+1する(植木算の考えで)
    this.values = new Array<number>(valueLength).fill(0);
  }

  /**
   * データの配列に値を追加します
   * @param value 追加する値
   */
  addValue(value: number) {
    this.values.pop();
    this.values.splice(0, 0, value);
  }

  /**
   * グラフを描画します。
   */
  override draw(): void {
    let context: CanvasRenderingContext2D = this.element.getContext('2d')!;

    // 波形を描画
    context.strokeStyle = '#eeeeee';
    context.lineWidth = 4;
    context.beginPath();
    for (const [index, value] of this.values.entries()) {
      const waveX: number = (index / (this.values.length - 1)) * this.width;
      const waveY: number = this.convertToCoordinateY(value);
      if (index === 0) {
        context.moveTo(waveX, waveY);
      } else {
        context.lineTo(waveX, waveY);
      }
    }
    context.stroke();

    // 左端のボーダーの線分を描画
    const borderLineX = 1;
    const borderLineStartY = 0;
    const borderLineEndY: number = this.height;
    context.strokeStyle = '#888888';
    context.lineWidth = 4;
    context.beginPath()
    context.moveTo(borderLineX, borderLineStartY);
    context.lineTo(borderLineX, borderLineEndY);
    context.stroke();
  }

}

class ButtonComponent extends UiComponent {

  constructor(public element: HTMLButtonElement) {
    super();
  }

  addClickEventListener(listener: () => void): void {
    this.element.addEventListener('click', listener);
  }

}

class AudioButtonComponent extends ButtonComponent {

  constructor(element: HTMLButtonElement) {
    super(element);
  }

  hide(): void {
    this.element.style.display = 'none';
  }

  show(): void {
    this.element.style.display = 'block';
  }

}

// -------- Casting HTML Elements --------

class InvalidHtmlElementError extends TypeError {
  constructor(message?: string) {
    super(message);
    this.name = 'InvalidHtmlElementError';
  }
}

function returnHTMLButtonElementOrError(element: Element | null): HTMLButtonElement {
  if (element instanceof HTMLButtonElement) {
    return element;
  } else {
    throw new InvalidHtmlElementError(`${element} is not HTMLButtonElement`);
  }
}

function returnHTMLCanvasElementOrError(element: Element | null): HTMLCanvasElement {
  if (element instanceof HTMLCanvasElement) {
    return element;
  } else {
    throw new InvalidHtmlElementError(`${element} is not HTMLCanvasElement`);
  }
}

function returnHTMLInputElementOrError(element: Element | null): HTMLInputElement {
  if (element instanceof HTMLInputElement) {
    return element;
  } else {
    throw new InvalidHtmlElementError(`${element} is not HTMLInputElement`);
  }
}

function returnHTMLLabelElementOrError(element: Element | null): HTMLLabelElement {
  if (element instanceof HTMLLabelElement) {
    return element;
  } else {
    throw new InvalidHtmlElementError(`${element} is not HTMLLabelElement`);
  }
}

// -------- App --------

/**
 * Modulatorに関連する`UiComponent`クラスのインスタンスをまとめたオブジェクトの型を定義するインターフェースです。
 */
interface ModulatorComponent {

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
interface CarrierComponent {

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
 * "FM-Synthesis Waveform Visualizer"のアプリを表すクラスです。
 */
class FmSynthesisWaveformVisualizerApp {

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
   * `FmSynthesisWaveformVisualizerApp`のインスタンスを生成します。
   */
  constructor() {

    // Program
    this.visualFmSynthProgram = new FmSynthProgram(120, 0.5, 1);
    this.modulatorProgram = new OperatorProgram(
      new OperatorVolumeParameter('modulatorVolume', 1),
      new OperatorRatioParameter('modulatorRatio', 1)
    );

    // Visual FM Synth
    this.visualFmSynth = new FmSynth(
      this.visualFmSynthProgram.samplingRate,
      this.visualFmSynthProgram.waveFrequency,
      this.visualFmSynthProgram.outputVolume
    );

    // Audio Engine
    this.audioEngine = new AudioEngine();

    // UI Components

    const modulatorVolumeInputElement: HTMLInputElement = returnHTMLInputElementOrError(
      document.querySelector('#modulator-volume-input')
    );
    const modulatorVolumeValueLabelElement = returnHTMLLabelElementOrError(
      document.querySelector('#modulator-volume-value-label')
    );
    const modulatorRatioInputElement: HTMLInputElement = returnHTMLInputElementOrError(
      document.querySelector('#modulator-ratio-input')
    );
    const modulatorRatioValueLabelElement: HTMLLabelElement = returnHTMLLabelElementOrError(
      document.querySelector('#modulator-ratio-value-label')
    );
    const modulatorPhaseGraphElement: HTMLCanvasElement = returnHTMLCanvasElementOrError(
      document.querySelector('#modulator-phase-graph')
    );
    const modulatorOutputGraphElement: HTMLCanvasElement = returnHTMLCanvasElementOrError(
      document.querySelector('#modulator-output-graph')
    );
    const modulatorWaveformGraphElement: HTMLCanvasElement = returnHTMLCanvasElementOrError(
      document.querySelector('#modulator-waveform-graph')
    );

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
    }

    const carrierPhaseGraphElement: HTMLCanvasElement = returnHTMLCanvasElementOrError(
      document.querySelector('#carrier-phase-graph')
    );
    const carrierOutputGraphElement: HTMLCanvasElement = returnHTMLCanvasElementOrError(
      document.querySelector('#carrier-output-graph')
    );
    const carrierWaveformGraphElement: HTMLCanvasElement = returnHTMLCanvasElementOrError(
      document.querySelector('#carrier-waveform-graph')
    );
    
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
    }

    const startAudioButtonElement: HTMLButtonElement = returnHTMLButtonElementOrError(
      document.querySelector('#start-audio-button')
    )
    const stopAudioButtonElement: HTMLButtonElement = returnHTMLButtonElementOrError(
      document.querySelector('#stop-audio-button')
    )

    this.startAudioButtonComponent = new AudioButtonComponent(startAudioButtonElement);
    this.stopAudioButtonComponent = new AudioButtonComponent(stopAudioButtonElement);
    
  }

  /**
   * `<html>`タグの`.no-js`クラスを`.js`に置き換え、JavaScriptが必要な要素の表示を切り替えます。
   */
  applyJsStyle(): void {
    document.documentElement.classList.replace('no-js', 'js');
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
    graphComponents.forEach((graphComponent) => {
      graphComponent.update();
    });

  }

  /**
   * ModulatorのVolumeをUIから取得し、`visualFmSynth`/`audioEngine`に適用させます。
   */
  assignModulatorVolumeToSynth(): void {
    // UIから値を取得
    this.modulatorProgram.volumeParameter.uiValue = this.modulatorComponent.volumeInput.value;

    // グラフ用FMSynthに適用
    this.visualFmSynth.modulator.volume = this.modulatorProgram.volumeParameter.value;
    
    // 音声用FMSynthに適用
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

    // グラフ用FMSynthに適用
    this.visualFmSynth.modulator.ratio = this.modulatorProgram.ratioParameter.value;
    
    // 音声用FMSynthに適用
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
  addEventListenerToAudioButtons(): void {
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
  setInterval(): void {
    const oneSecond_ms = 1_000;
    let intervalId: number = setInterval(() => {
      this.moveFrameForward();
    }, oneSecond_ms / this.visualFmSynthProgram.samplingRate);
  }

  /**
   * アプリの動作を開始します。
   */
  init(): void {
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
  } catch(error) {
    if (error instanceof Error) {
      console.error(`${error.name}: ${error.message}`);
    }
    window.alert(
      'アプリの内部でエラーが発生しました。\n' +
      'アプリの設計上の不具合の可能性がありますので、開発者までお知らせください。'
    )
  }
});
