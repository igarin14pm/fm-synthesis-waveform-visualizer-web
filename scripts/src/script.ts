// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

import { Operator, FmSynth } from './fm-synth.js';

// -------- Value Class --------

/**
 * オペレーターのパラメーターの値を保持し、UI上での値とFMシンセ側の値を変換するクラスです。
 */
class OperatorValue {

  /**
   * オペレーターのVolumeのUI上での値(0〜100)
   */
  get volumeUiValue(): number {
    return this.volumeValue * 100;
  }

  /**
   * オペレーターのVolumeのUI上での値(0〜100)
   */
  set volumeUiValue(newValue: number) {
    this.volumeValue = newValue / 100;
  }

  /**
   * オペレーターのRatioのUI上での値(1〜10)
   */
  get ratioUiValue(): number {
    return this.ratioValue;
  }

  /**
   * オペレーターのRatioのUI上での値(1〜10)
   */
  set ratioUiValue(newValue: number) {
    this.ratioValue = newValue;
  }

  /**
   * OperatorValueのインスタンスを生成します。
   * @param volumeParameterName AudioParamDescriptorにおけるVolumeのパラメーター名
   * @param volumeValue OperatorのパラメーターVolumeの値(0〜1.0)
   * @param ratioParameterName AudioParamDescriptorにおけるRatioのパラメーター名
   * @param ratioValue OperatorのパラメーターRatioの値(1〜10)
   */
  constructor(
    public volumeParameterName: string, 
    public volumeValue: number, 
    public ratioParameterName: string, 
    public ratioValue: number
  ) { }

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
  constructor(
    public readonly samplingRate: number, 
    public readonly waveFrequency: number, 
    public readonly outputVolume: number,
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
    return this.audioContext != null && this.audioWorkletNode != null;
  }

  /**
   * 指定したパラメーター名にパラメーターの値をセットします
   * @param name AudioParamDescriptorで指定したパラメーター名
   * @param value パラメーターの値
   */
  setParameterValue(name: string, value: number) {
    if (this.isRunning) {
      const param: AudioParam | undefined = this.audioWorkletNode!.parameters.get(name);
      param?.setValueAtTime(value, this.audioContext!.currentTime);
    }
  }

  /**
   * 音声を再生します。
   * @param modulatorValue モジュレーターの値を格納したOperatorValueのインスタンス
   * @param callback 再生を始める処理が完了した後に呼ばれる関数
   */
  async start(modulatorValue: OperatorValue, callback: () => void) {
    this.audioContext = new AudioContext();
    await this.audioContext.audioWorklet.addModule('./scripts/dist/fm-synth-audio-processor.js');
    this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'fm-synth-audio-processor');

    this.setParameterValue(
      modulatorValue.volumeParameterName,
      modulatorValue.volumeValue
    );
    this.setParameterValue(
      modulatorValue.ratioParameterName,
      modulatorValue.ratioValue
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
const visualFmSynth = new FmSynth(
  visualFmSynthValue.samplingRate,
  visualFmSynthValue.waveFrequency,
  visualFmSynthValue.outputVolume
);

// Modulator Volume Input
// `index.html`上で`#modulator-volume-input`は`<input>`要素、`#modulator-volume-value-label`は`<label>`要素であり、
// 要素は動的に削除されず、これらのidが動的に要素に付与・削除されることはないため、この型キャストは成功する。
const modulatorVolumeInputElement = document.getElementById('modulator-volume-input') as HTMLInputElement;
const modulatorVolumeValueLabelElement = document.getElementById('modulator-volume-value-label') as HTMLLabelElement;
/**
 * ModulatorのVolumeパラメーターの`<input>`要素を制御するクラスのインスタンス
 */
const modulatorVolumeInputComponent = new RangeInputComponent(
  modulatorVolumeInputElement,
  modulatorVolumeValueLabelElement,
  modulatorValue.volumeUiValue
)

// Modulator Ratio Input
// `index.html`上で`#modulator-ratio-input`は`<input>`要素、`#modulator-ratio-value-label`は`<label>`要素であり、
// 要素は動的に削除されず、これらのidが動的に要素に付与・削除されることはないため、この型キャストは成功する。
const modulatorRatioInputElement = document.getElementById('modulator-ratio-input') as HTMLInputElement;
const modulatorRatioValueLabelElement = document.getElementById('modulator-ratio-value-label') as HTMLLabelElement;
/**
 * ModulatorのRatioパラメーターの`<input>`要素を制御するクラスのインスタンス
 */
const modulatorRatioInputComponent = new RangeInputComponent(
  modulatorRatioInputElement,
  modulatorRatioValueLabelElement,
  modulatorValue.ratioUiValue
)

// Modulator Graph
// `index.html`上で`#modulator-phase-graph`・`#modulator-output-graph`、`#modulator-waveform-graph`はすべて`<canvas>`要素であり
// 要素は動的に削除されず、これらのidが動的に要素に付与・削除されることはないため、この型キャストは成功する。
const modulatorPhaseGraphElement = document.getElementById('modulator-phase-graph') as HTMLCanvasElement;
const modulatorOutputGraphElement = document.getElementById('modulator-output-graph') as HTMLCanvasElement;
const modulatorWaveformGraphElement = document.getElementById('modulator-waveform-graph') as HTMLCanvasElement;
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
  visualFmSynthValue.samplingRate
);

// Carrier Graph
// `index.html`上で`#carrier-phase-graph`・`#carrier-output-graph`、`#carrier-waveform-graph`はすべて`<canvas>`要素であり
// 要素は動的に削除されず、これらのidが動的に要素に付与・削除されることはないため、この型キャストは成功する。
const carrierPhaseGraphElement = document.getElementById('carrier-phase-graph') as HTMLCanvasElement;
const carrierOutputGraphElement = document.getElementById('carrier-output-graph') as HTMLCanvasElement;
const carrierWaveformGraphElement = document.getElementById('carrier-waveform-graph') as HTMLCanvasElement;
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
  visualFmSynthValue.samplingRate
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
  const divWorkingWithJavascript = document.getElementsByClassName('div-working-with-javascript') as HTMLCollectionOf<HTMLDivElement>;
  for (let i = 0; i < divWorkingWithJavascript.length; i++) {
    divWorkingWithJavascript[i].style.display = 'block';
  }

  /**
   * UIからモジュレーターのVolumeの値を取得し、FMSynthに適用します。
   */
  function setModulatorVolume(): void {
    // UIから値を取得
    modulatorValue.volumeUiValue = modulatorVolumeInputComponent.value;

    // グラフ用FMSynthに適用
    visualFmSynth.modulator.volume = modulatorValue.volumeValue;
    
    // 音声用FMSynthに適用
    if (audioEngine.isRunning) {
      audioEngine.setParameterValue(
        modulatorValue.volumeParameterName,
        modulatorValue.volumeValue
      );
    }
  }

  /**
   * UIからモジュレーターのRatioの値を取得し、FMSynthに適用します。
   */
  function setModulatorRatio(): void {
    // UIから値を取得
    modulatorValue.ratioUiValue = modulatorRatioInputComponent.value;

    // グラフ用FMSynthに適用
    visualFmSynth.modulator.ratio = modulatorValue.ratioValue;
    
    // 音声用FMSynthに適用
    if (audioEngine.isRunning) {
      audioEngine.setParameterValue(
        modulatorValue.ratioParameterName,
        modulatorValue.ratioValue
      );
    }
  }

  setModulatorVolume();
  setModulatorRatio();

  startAudioButtonComponent.addClickEventListener(() => {
    if (!audioEngine.isRunning) {
      audioEngine.start(modulatorValue, () => {
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
  
  let intervalId: number = setInterval(moveFrameForward, oneSecond_ms / visualFmSynthValue.samplingRate);
}

// 読み込みが終わってからコードを実行する
window.addEventListener('load', () => {
  setUp();
});
