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
 * パラメーターを変更する`<input>`要素を扱うためのクラスです。
 */
class RangeInputComponent {

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
abstract class GraphComponent {

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
  constructor(public element: HTMLCanvasElement) { }

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

class ButtonComponent {

  constructor(public element: HTMLButtonElement) { }

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

// -------- Script --------

/**
 * 画面に表示される波形を生成する`FMSynth`のパラメーター値を管理する`FMSynthValue`のインスタンス
 */
const visualFmSynthProgram = new FmSynthProgram(120, 0.5, 1);

/**
 * 画面に表示される波形を生成する`FMSynth`にあるModulatorのパラメーター値を管理する`OperatorValue`のインスタンス
 */
const modulatorProgram = new OperatorProgram(
  new OperatorVolumeParameter('modulatorVolume', 1),
  new OperatorRatioParameter('modulatorRatio', 1)
);

/**
 * 音声を再生・停止する`AudioEngine`のインスタンス
 */
const audioEngine = new AudioEngine();

/**
 * 画面に表示される波形を生成する`FMSynth`のインスタンス
 */
const visualFmSynth = new FmSynth(
  visualFmSynthProgram.samplingRate,
  visualFmSynthProgram.waveFrequency,
  visualFmSynthProgram.outputVolume
);

// Modulator Volume Input
// `index.html`上で`#modulator-volume-input`は`<input>`要素、`#modulator-volume-value-label`は`<label>`要素であり、
// 要素は動的に削除されず、これらのidが動的に要素に付与・削除されることはないため、この型キャストは成功する。
const modulatorVolumeInputElement = document.querySelector('#modulator-volume-input') as HTMLInputElement;
const modulatorVolumeValueLabelElement = document.querySelector('#modulator-volume-value-label') as HTMLLabelElement;
/**
 * ModulatorのVolumeパラメーターの`<input>`要素を制御するクラスのインスタンス
 */
const modulatorVolumeInputComponent = new RangeInputComponent(
  modulatorVolumeInputElement,
  modulatorVolumeValueLabelElement,
  modulatorProgram.volumeParameter.uiValue
)

// Modulator Ratio Input
// `index.html`上で`#modulator-ratio-input`は`<input>`要素、`#modulator-ratio-value-label`は`<label>`要素であり、
// 要素は動的に削除されず、これらのidが動的に要素に付与・削除されることはないため、この型キャストは成功する。
const modulatorRatioInputElement = document.querySelector('#modulator-ratio-input') as HTMLInputElement;
const modulatorRatioValueLabelElement = document.querySelector('#modulator-ratio-value-label') as HTMLLabelElement;
/**
 * ModulatorのRatioパラメーターの`<input>`要素を制御するクラスのインスタンス
 */
const modulatorRatioInputComponent = new RangeInputComponent(
  modulatorRatioInputElement,
  modulatorRatioValueLabelElement,
  modulatorProgram.ratioParameter.uiValue
)

// Modulator Graph
// `index.html`上で`#modulator-phase-graph`・`#modulator-output-graph`、`#modulator-waveform-graph`はすべて`<canvas>`要素であり
// 要素は動的に削除されず、これらのidが動的に要素に付与・削除されることはないため、この型キャストは成功する。
const modulatorPhaseGraphElement = document.querySelector('#modulator-phase-graph') as HTMLCanvasElement;
const modulatorOutputGraphElement = document.querySelector('#modulator-output-graph') as HTMLCanvasElement;
const modulatorWaveformGraphElement = document.querySelector('#modulator-waveform-graph') as HTMLCanvasElement;
const modulatorPhaseGraphComponent = new PhaseGraphComponent(
  modulatorPhaseGraphElement, 
  visualFmSynth.modulator
);
const modulatorOutputGraphComponent = new OutputGraphComponent(
  modulatorOutputGraphElement,
  visualFmSynth.modulator,
  true
);
const modulatorWaveformGraphComponent = new WaveformGraphComponent(
  modulatorWaveformGraphElement,
  visualFmSynthProgram.samplingRate
);

// Carrier Graph
// `index.html`上で`#carrier-phase-graph`・`#carrier-output-graph`、`#carrier-waveform-graph`はすべて`<canvas>`要素であり
// 要素は動的に削除されず、これらのidが動的に要素に付与・削除されることはないため、この型キャストは成功する。
const carrierPhaseGraphElement = document.querySelector('#carrier-phase-graph') as HTMLCanvasElement;
const carrierOutputGraphElement = document.querySelector('#carrier-output-graph') as HTMLCanvasElement;
const carrierWaveformGraphElement = document.querySelector('#carrier-waveform-graph') as HTMLCanvasElement;
const carrierPhaseGraphComponent = new PhaseGraphComponent(
  carrierPhaseGraphElement,
  visualFmSynth.carrier
);
const carrierOutputGraphComponent = new OutputGraphComponent(
  carrierOutputGraphElement,
  visualFmSynth.carrier,
  false
);
const carrierWaveformGraphComponent = new WaveformGraphComponent(
  carrierWaveformGraphElement,
  visualFmSynthProgram.samplingRate
);

// Audio Button
// `index.html`内で`#start-audio-button`・`#stop-audio-button`は`<button>`要素であり、
// 要素は動的に削除されず、このidを動的に付与・削除されることもないため、この型キャストは成功する。
const startAudioButtonElement = document.querySelector('#start-audio-button') as HTMLButtonElement;
const stopAudioButtonElement = document.querySelector('#stop-audio-button') as HTMLButtonElement;
const startAudioButtonComponent = new AudioButtonComponent(startAudioButtonElement);
const stopAudioButtonComponent = new AudioButtonComponent(stopAudioButtonElement);

/**
 * グラフの動作をサンプリングレート一つ分進めます。
 */
function moveFrameForward(): void {
  visualFmSynth.moveFrameForward();
  
  modulatorWaveformGraphComponent.addValue(visualFmSynth.modulator.output.value);
  carrierWaveformGraphComponent.addValue(visualFmSynth.carrier.output.value);

  const graphComponents: GraphComponent[] = [
    modulatorPhaseGraphComponent,
    modulatorOutputGraphComponent,
    modulatorWaveformGraphComponent,
    carrierPhaseGraphComponent,
    carrierOutputGraphComponent,
    carrierWaveformGraphComponent
  ];
  graphComponents.forEach((graphComponent) => {
    graphComponent.update();
  });
}

/**
 * WebページのJavaScriptの動作を開始します。
 */
function setUp(): void {

  // JavaScript無効時に非表示になっている要素を表示させる
  // `index.html`内で`.div-working-with-javascript`が付与されている要素は全て`<div>`要素であり、
  // これらの要素は動的に削除されず、classが動的に付与・削除されることがないため、この型キャストは成功する。
  const divWorkingWithJavascript = document.querySelectorAll('.div-working-with-javascript') as NodeListOf<HTMLDivElement>;
  for (let i = 0; i < divWorkingWithJavascript.length; i++) {
    divWorkingWithJavascript[i].style.display = 'block';
  }

  /**
   * UIからモジュレーターのVolumeの値を取得し、FMSynthに適用します。
   */
  function setModulatorVolume(): void {
    // UIから値を取得
    modulatorProgram.volumeParameter.uiValue = modulatorVolumeInputComponent.value;

    // グラフ用FMSynthに適用
    visualFmSynth.modulator.volume = modulatorProgram.volumeParameter.value;
    
    // 音声用FMSynthに適用
    if (audioEngine.isRunning) {
      audioEngine.setParameterValue(
        modulatorProgram.volumeParameter.name,
        modulatorProgram.volumeParameter.value
      );
    }
  }

  /**
   * UIからモジュレーターのRatioの値を取得し、FMSynthに適用します。
   */
  function setModulatorRatio(): void {
    // UIから値を取得
    modulatorProgram.ratioParameter.uiValue = modulatorRatioInputComponent.value;

    // グラフ用FMSynthに適用
    visualFmSynth.modulator.ratio = modulatorProgram.ratioParameter.value;
    
    // 音声用FMSynthに適用
    if (audioEngine.isRunning) {
      audioEngine.setParameterValue(
        modulatorProgram.ratioParameter.name,
        modulatorProgram.ratioParameter.value
      );
    }
  }

  setModulatorVolume();
  setModulatorRatio();

  startAudioButtonComponent.addClickEventListener(() => {
    if (!audioEngine.isRunning) {
      audioEngine.start(modulatorProgram, () => {
        startAudioButtonComponent.hide();
        stopAudioButtonComponent.show();
      });
    }
  });
  stopAudioButtonComponent.addClickEventListener(() => {
    if (audioEngine.isRunning) {
      audioEngine.stop();
    }
    stopAudioButtonComponent.hide();
    startAudioButtonComponent.show();
  });

  modulatorVolumeInputComponent.addEventListener(() => {
    setModulatorVolume();
  });
  modulatorRatioInputComponent.addEventListener(() => {
    setModulatorRatio();
  });

  /**
   * 1秒をミリ秒で表した数
   */
  const oneSecond_ms = 1_000;
  
  let intervalId: number = setInterval(moveFrameForward, oneSecond_ms / visualFmSynthProgram.samplingRate);
}

// 読み込みが終わってからコードを実行する
window.addEventListener('load', () => {
  setUp();
});
