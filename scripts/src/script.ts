/*
 * Copyright (c) 2026 Igarin
 * This software is released under the MIT License.
 * https://opensource.org
 */

import { Syncable, Operator, FMSynth } from './fm-synth.js';

/* -------- Value Class -------- */

/**
 * オペレーターのパラメーターの値を保持し、UI上での値とFMシンセ側の値を変換するクラスです。
 */
class OperatorValue {

  /**
   * AudioParamDescriptorにおけるVolumeのパラメーター名
   */
  volumeParameterName: string;
  
  /**
   * OperatorのパラメーターVolumeの値(0〜1.0)
   */
  volumeValue: number;
  
  /**
   * AudioParamDescriptorにおけるRatioのパラメーター名
   */
  ratioParameterName: string;
  
  /**
   * OperatorのパラメーターRatioの値(1〜10)
   */
  ratioValue: number;

  /**
   * オペレーターのVolumeのUI上での値(0〜100)
   */
  get volumeUIValue(): number {
    return this.volumeValue * 100;
  }

  /**
   * オペレーターのVolumeのUI上での値(0〜100)
   */
  set volumeUIValue(newValue: number) {
    this.volumeValue = newValue / 100;
  }

  /**
   * オペレーターのRatioのUI上での値(1〜10)
   */
  get ratioUIValue(): number {
    return this.ratioValue;
  }

  /**
   * オペレーターのRatioのUI上での値(1〜10)
   */
  set ratioUIValue(newValue: number) {
    this.ratioValue = newValue;
  }

  /**
   * OperatorValueのインスタンスを生成します。
   * @param volumeParameterName AudioParamDescriptorにおけるVolumeのパラメーター名
   * @param volumeValue OperatorのパラメーターVolumeの値(0〜1.0)
   * @param ratioParameterName AudioParamDescriptorにおけるRatioのパラメーター名
   * @param ratioValue OperatorのパラメーターRatioの値(1〜10)
   */
  constructor(volumeParameterName: string, volumeValue: number, ratioParameterName: string, ratioValue: number) {
    this.volumeParameterName = volumeParameterName;
    this.volumeValue = volumeValue;
    this.ratioParameterName = ratioParameterName;
    this.ratioValue = ratioValue;
  }

}

/**
 * FMシンセサイザーの値を保持するクラスです。
 */
class FMSynthValue {

  /**
   * FMシンセサイザーのサンプリングレートのプライベートフィールド
   */
  private _samplingRate: number;
  
  /**
   * 出力波形の周波数のプライベートフィールド
   */
  private _waveFrequency: number;
  
  /**
   * 出力波形のボリュームのプライベートフィールド
   */
  private _outputVolume: number;

  /**
   * FMシンセサイザーのサンプリングレート
   */
  get samplingRate(): number {
    return this._samplingRate;
  }

  /**
   * 出力波形の周波数
   */
  get waveFrequency(): number {
    return this._waveFrequency;
  }

  /**
   * 出力波形のボリューム
   */
  get outputVolume(): number {
    return this._outputVolume;
  }

  /**
   * FMSynthValueのインスタンスを生成します。
   * @param samplingRate FMシンセサイザーのサンプリングレート
   * @param waveFrequency 出力波形の周波数
   * @param outputVolume 出力波形のボリューム
   */
  constructor(
    samplingRate: number, 
    waveFrequency: number, 
    outputVolume: number,
  ) {
    this._samplingRate = samplingRate;
    this._waveFrequency = waveFrequency;
    this._outputVolume = outputVolume;
  }

}

/* -------- Audio Class -------- */

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
    return this.audioContext !== null && this.audioWorkletNode !== null;
  }

  /**
   * 指定したパラメーター名にパラメーターの値をセットします
   * @param name AudioParamDescriptorで指定したパラメーター名
   * @param value パラメーターの値
   */
  setParameterValue(name: string, value: number) {
    if (this.isRunning) {
      const param = this.audioWorkletNode!.parameters.get(name);
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
    await this.audioContext.audioWorklet.addModule('./scripts/dist/audio-processor.js');
    this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');

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

/* -------- UI Classes -------- */

/**
 * `<canvas>`要素にグラフを描画するための抽象クラスです
 */
abstract class Graph {

  /**
   * DOMで取得した`<canvas>`要素
   */
  element: HTMLCanvasElement;
  
  /**
   * グラフに描画する波形の上下の余白の大きさ
   */
  verticalPadding: number = 10;

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
  constructor(element: HTMLCanvasElement) {
    this.element = element
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
class PhaseGraph extends Graph {

  /**
   * 位相グラフに描画したいOperatorのインスタンス
   */
  operator: Operator;

  /**
   * PhaseGraphのインスタンスを生成します。
   * @param element DOMで取得した`<canvas>`要素
   * @param operator 位相グラフに描画したいOperatorのインスタンス
   */
  constructor(element: HTMLCanvasElement, operator: Operator) {
    super(element);
    this.operator = operator
  }

  /**
   * グラフを描画します。
   */
  override draw(): void {
    // sin(x) = 0 の時の値が綺麗に描画されるように+1する(植木算の考えで)
    const sineWaveValueLength = 120 + 1;
    const context: CanvasRenderingContext2D = this.element.getContext('2d')!;

    // モジュレーション量を描画
    context.fillStyle = '#00cdb944';
    const phaseWithoutModX: number = this.width * this.operator.phase.valuesWithoutMod[0];
    const modRectY: number = 0;
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
    for (let i: number = 0; i < sineWaveValueLength; i++) {
      const sineWaveValue: number = Math.sin(2 * Math.PI * i / (sineWaveValueLength - 1));

      const sineWaveX: number = this.width * i / (sineWaveValueLength - 1);
      const sineWaveY: number = this.convertToCoordinateY(this.operator.volume * sineWaveValue);

      if (i == 0) {
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
    const phaseLineStartY: number = 0;
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
    const valueCircleRadius: number = 12.5;
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
   * 出力グラフに描画したいOperatorのインスタンス
   */
  operator: Operator;
  
  /**
   * モジュレーターの出力量を描画するかを表します。
   * operatorがモジュレーターである時にtrueにします。
   */
  showsModulatingAmount: boolean;

  /**
   * OutputGraphのインスタンスを生成します。
   * @param element DOMで取得した`<canvas>`要素
   * @param operator 出力グラフに描画したいOperatorのインスタンス
   * @param showsModulatingAmount モジュレーターの出力量を描画するか operatorがモジュレーターである時にtrueにします
   */
  constructor(element: HTMLCanvasElement, operator: Operator, showsModulatingAmout: boolean) {
    super(element);
    this.operator = operator;
    this.showsModulatingAmount = showsModulatingAmout;
  }

  /**
   * グラフを描画します。
   */
  override draw(): void {
    const context: CanvasRenderingContext2D = this.element.getContext('2d')!;

    const outputLineStartX: number = 0;
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
 * 波形グラフのためのデータを保持するクラスです。
 */
class WaveformGraphData {

  /**
   * オペレーターから出力された値のデータの長さ
   */
  valueLength: number;
  
  /**
   * オペレーターから出力された値のデータ
   */
  values: number[];

  /**
   * WaveformGraphDataのインスタンスを生成します。
   * @param samplingRate FMSynthのサンプリングレート
   */
  constructor(samplingRate: number) {
    const numberOfWaves = 4;
    // sin(x) = 0 の時の値が綺麗に描画されるように+1する(植木算の考えで)
    this.valueLength = samplingRate * numberOfWaves + 1;

    let values = new Array<number>(this.valueLength);
    values.fill(0.0);
    this.values = values;
  }

  /**
   * データに値を追加します。
   * @param value 追加する波形の出力信号の値
   */
  add(value: number) {
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
   * 表示するデータを格納したWaveformGraphDataのインスタンス
   */
  data: WaveformGraphData;

  /**
   * WaveformGraphのインスタンスを生成します。
   * @param element DOMで取得した`<canvas>`要素
   * @param samplingRate FMSynthのサンプリングレート
   */
  constructor(element: HTMLCanvasElement, samplingRate: number) {
    super(element);
    this.data = new WaveformGraphData(samplingRate);
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
    for (const [index, value] of this.data.values.entries()) {
      const x = (index / (this.data.valueLength - 1)) * this.width;
      const y = this.convertToCoordinateY(value);
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.stroke();

    // 左端のボーダーの線分を描画
    const borderLineX: number = 1;
    const borderLineStartY: number = 0;
    const borderLineEndY: number = this.height;
    context.strokeStyle = '#888888';
    context.lineWidth = 4;
    context.beginPath()
    context.moveTo(borderLineX, borderLineStartY);
    context.lineTo(borderLineX, borderLineEndY);
    context.stroke();
  }

}

/**
 * パラメーターを変更する`<input>`要素を扱うためのクラスです。
 */
class RangeInputUI {

  /**
   * DOMで取得した`<input>`要素
   */
  inputElement: HTMLInputElement;
  
  /**
   * DOMで取得した値を表示する`<label>`要素
   */
  valueLabelElement: HTMLLabelElement;

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
    inputElement: HTMLInputElement,
    valueLabelElement: HTMLLabelElement,
    initialValue: number
  ) {
    this.inputElement = inputElement;
    this.valueLabelElement = valueLabelElement;

    this.inputElement.value = initialValue.toString();
    this.valueLabelElement.textContent = initialValue.toString();
  }

  /**
   * `<input>`要素に値が入力した時に発生するイベントリスナーを設定します。
   */
  addEventListener(listener: () => void) {
    this.inputElement.addEventListener('input', () => {
      listener();
      this.valueLabelElement.textContent = this.inputElement.value;
    })
  }

}

/**
 * オペレーターが関わるグラフを管理するクラスです。
 */
class OperatorUI implements Syncable {

  /**
   * グラフに表示させたいOperatorのインスタンス
   */
  operator: Operator;
  
  /**
   * PhaseGraphのインスタンス
   */
  phaseGraph: PhaseGraph;
  
  /**
   * OutputGraphのインスタンス
   */
  outputGraph: OutputGraph;
  
  /**
   * WaveformGraphのインスタンス
   */
  waveformGraph: WaveformGraph;
  
  /**
   * OperatorUIのインスタンスを生成します。
   * @param operator グラフに表示させたいOperatorのインスタンス
   * @param phaseGraphElement DOMで取得した位相グラフの`<canvas>`要素
   * @param outputGraphElement DOMで取得した出力グラフの`<canvas>`要素
   * @param waveformGraphElement DOMで取得した波形グラフの`<canvas>`要素
   * @param showsModulatingAmount 出力グラフにモジュレーションを掛ける量を表示するか
   * @param samplingRate FMSynthのサンプリングレート
   */
  constructor(
    operator: Operator,
    phaseGraphElement: HTMLCanvasElement,
    outputGraphElement: HTMLCanvasElement,
    waveformGraphElement: HTMLCanvasElement,
    showsModulatingAmount: boolean,
    samplingRate: number
  ) {
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
  moveFrameForward(): void {
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
const visualFMSynthValue = new FMSynthValue(120, 0.5, 1);

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
const visualFMSynth = new FMSynth(
  visualFMSynthValue.samplingRate,
  visualFMSynthValue.waveFrequency,
  visualFMSynthValue.outputVolume
);

// Modulator Volume Input
const modulatorVolumeInputElement = <HTMLInputElement>document.getElementById('modulator-volume-input');
const modulatorVolumeValueLabelElement = <HTMLLabelElement>document.getElementById('modulator-volume-value-label');
/**
 * ModulatorのVolumeパラメーターの`<input>`要素を制御するクラスのインスタンス
 */
const modulatorVolumeInputUI = new RangeInputUI(
  modulatorVolumeInputElement,
  modulatorVolumeValueLabelElement,
  modulatorValue.volumeUIValue
)

// Modulator Ratio Input
const modulatorRatioInputElement = <HTMLInputElement>document.getElementById('modulator-ratio-input');
const modulatorRatioValueLabelElement = <HTMLLabelElement>document.getElementById('modulator-ratio-value-label');
/**
 * ModulatorのRatioパラメーターの`<input>`要素を制御するクラスのインスタンス
 */
const modulatorRatioInputUI = new RangeInputUI(
  modulatorRatioInputElement,
  modulatorRatioValueLabelElement,
  modulatorValue.ratioUIValue
)

// Modulator Graph
const modulatorPhaseGraphElement = <HTMLCanvasElement>document.getElementById('modulator-phase-graph');
const modulatorOutputGraphElement = <HTMLCanvasElement>document.getElementById('modulator-output-graph');
const modulatorWaveformGraphElement = <HTMLCanvasElement>document.getElementById('modulator-waveform-graph');
/**
 * Modulatorのグラフを制御するクラスのインスタンス
 */
const modulatorUI = new OperatorUI(
  visualFMSynth.modulator,
  modulatorPhaseGraphElement,
  modulatorOutputGraphElement,
  modulatorWaveformGraphElement,
  true,
  visualFMSynthValue.samplingRate
)

// Carrier Graph
const carrierPhaseGraphElement = <HTMLCanvasElement>document.getElementById('carrier-phase-graph');
const carrierOutputGraphElement = <HTMLCanvasElement>document.getElementById('carrier-output-graph');
const carrierWaveformGraphElement = <HTMLCanvasElement>document.getElementById('carrier-waveform-graph');
/**
 * Carrierのグラフを制御するクラスのインスタンス
 */
const carrierUI = new OperatorUI(
  visualFMSynth.carrier,
  carrierPhaseGraphElement,
  carrierOutputGraphElement,
  carrierWaveformGraphElement,
  false,
  visualFMSynthValue.samplingRate
);

/**
 * グラフの動作をサンプリングレート一つ分進めます。
 */
function moveFrameForward() {
  let frameUpdateQueue: Syncable[] = [visualFMSynth, modulatorUI, carrierUI];
  frameUpdateQueue.forEach(syncable => {
    syncable.moveFrameForward();
  });
}

/**
 * WebページのJavaScriptの動作を開始します。
 */
function setUp() {

  // JavaScript無効時に非表示になっている要素を表示させる
  const divWorkingWithJavascript = <HTMLCollectionOf<HTMLDivElement>>document.getElementsByClassName('div-working-with-javascript');
  for (let i = 0; i < divWorkingWithJavascript.length; i++) {
    divWorkingWithJavascript[i].style.display = 'block';
  }

  /**
   * UIからモジュレーターのVolumeの値を取得し、FMSynthに適用します。
   */
  function setModulatorVolume() {
    // UIから値を取得
    modulatorValue.volumeUIValue = modulatorVolumeInputUI.value;

    // グラフ用FMSynthに適用
    visualFMSynth.modulator.volume = modulatorValue.volumeValue;
    
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
  function setModulatorRatio() {
    // UIから値を取得
    modulatorValue.ratioUIValue = modulatorRatioInputUI.value;

    // グラフ用FMSynthに適用
    visualFMSynth.modulator.ratio = modulatorValue.ratioValue;
    
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

  /**
   * "音声を再生する"ボタンの要素
   */
  const startAudioButton = <HTMLButtonElement>document.getElementById('start-audio-button');
  
  /**
   * "音声を停止する"ボタンの要素
   */
  const stopAudioButton = <HTMLButtonElement>document.getElementById('stop-audio-button');

  startAudioButton.addEventListener('click', function() {
    if (!audioEngine.isRunning) {
      audioEngine.start(modulatorValue, () => {
        startAudioButton.style.display = 'none';
        stopAudioButton.style.display = 'block';
      });
    }
  });

  stopAudioButton.addEventListener('click', function() {
    if (audioEngine.isRunning) {
      audioEngine.stop();
    }
    startAudioButton.style.display = 'block';
    stopAudioButton.style.display = 'none';
  });

  modulatorVolumeInputUI.addEventListener(function() {
    setModulatorVolume();
  });
  modulatorRatioInputUI.addEventListener(function() {
    setModulatorRatio();
  });

  /**
   * 1秒をミリ秒で表した数
   */
  const oneSecond_ms = 1_000;
  
  let intervalId = setInterval(moveFrameForward, oneSecond_ms / visualFMSynthValue.samplingRate);
}

// 読み込みが終わってからコードを実行する
window.addEventListener('load', () => {
  setUp();
})
