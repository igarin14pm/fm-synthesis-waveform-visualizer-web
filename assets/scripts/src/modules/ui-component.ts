// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

import { Operator } from './fm-synth.js';

/**
 * UIコンポーネントであることを表す基底クラスです。
 */
export class UiComponent { }

/**
 * パラメーターを変更する`<input>`要素を扱うためのクラスです。
 */
export class RangeInputComponent extends UiComponent {

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
export abstract class GraphComponent extends UiComponent {

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
export class PhaseGraphComponent extends GraphComponent {

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
   * モジュレーション量を描画します。
   */
  private drawModulatedAmount(): void {
    const context: CanvasRenderingContext2D | null = this.element.getContext('2d');
    if (context != null) {
      context.fillStyle = '#00cdb944';

      const phaseWithoutModX: number = this.width * this.operator.phase.valuesWithoutMod[0];
      const modRectY = 0;
      const modRectWidth: number = this.width * this.operator.phase.modulationValue;
      const modRectHeight: number = this.height;
      if (phaseWithoutModX + modRectWidth > this.width) { // 長方形がCanvas要素から右側にはみ出る場合

        // 右端の長方形を描画
        context.fillRect(phaseWithoutModX, modRectY, this.width - phaseWithoutModX, this.height);

        // 左端の長方形を描画
        context.fillRect(0, modRectY, phaseWithoutModX + modRectWidth - this.width, modRectHeight);

      } else if (phaseWithoutModX + modRectWidth < 0) { // 図形がCanvas要素から左側にはみ出る場合

        // 左端の長方形を描画
        context.fillRect(phaseWithoutModX, modRectY, -1 * phaseWithoutModX, modRectHeight);

        // 右端の長方形を描画
        context.fillRect(this.width, modRectY, phaseWithoutModX + modRectWidth, modRectHeight);

      } else { // 長方形がCanvas要素からはみ出ない場合
        context.fillRect(phaseWithoutModX, modRectY, modRectWidth, modRectHeight);
      }
    }
  }

  /**
   * サイン波を描画します。
   */
  private drawSineWave(): void {
    const sineWaveValueLength = 120 + 1; // sin(x) = 0 の時の値が綺麗に描画されるように+1する(植木算の考えで)
    const context: CanvasRenderingContext2D | null = this.element.getContext('2d');
    if (context != null) {
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
    }
  }

  /**
   * 位相を表す線分を描画します。
   */
  private drawPhaseLine(): void {
    const context: CanvasRenderingContext2D | null = this.element.getContext('2d');
    if (context != null) {
      context.strokeStyle = '#00cdb9';
      context.lineWidth = 8;
      context.beginPath();
      const phaseLineX: number = this.width * this.operator.phase.output.value;
      const phaseLineStartY = 0;
      const phaseLineEndY: number = this.height;
      context.moveTo(phaseLineX, phaseLineStartY);
      context.lineTo(phaseLineX, phaseLineEndY);
      context.stroke();
    }
  }

  /**
   * 出力を表す線分を描画します。
   */
  private drawOutputLine(): void {
    const context: CanvasRenderingContext2D | null = this.element.getContext('2d');
    if (context != null) {
      context.strokeStyle = '#888888';
      context.lineWidth = 4;
      context.beginPath();
      const outputLineStartX: number = this.width * this.operator.phase.output.value;
      const outputLineEndX: number = this.width;
      const outputLineY: number = this.convertToCoordinateY(this.operator.output.value);
      context.moveTo(outputLineStartX, outputLineY);
      context.lineTo(outputLineEndX, outputLineY);
      context.stroke();
    }
  }

  /**
   * サイン波と位相を表す線分の交点に円を描画します。
   */
  private drawValueCircle(): void {
    const context: CanvasRenderingContext2D | null = this.element.getContext('2d');
    if (context != null) {
      context.fillStyle = '#00cdb9';
      const valueCircleX: number = this.width * this.operator.phase.output.value; // phaseLineX;
      const valueCircleY: number = this.convertToCoordinateY(this.operator.output.value); // outputLineY;
      const valueCircleRadius = 12.5;
      context.arc(valueCircleX, valueCircleY, valueCircleRadius, 0, 2 * Math.PI);
      context.fill();
    }
  }

  /**
   * グラフを描画します。
   */
  override draw(): void {
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
export class OutputGraphComponent extends GraphComponent {

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
   * 変調を掛ける量を表す長方形を描画します。
   */
  private drawModulatingAmount(): void {
    const context: CanvasRenderingContext2D | null = this.element.getContext('2d');
    if (context != null) {
      const outputLineY: number = this.convertToCoordinateY(this.operator.output.value);
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
  }

  /**
   * 出力を表す線分を描画します。
   */
  private drawOutputLine(): void {
    const context: CanvasRenderingContext2D | null = this.element.getContext('2d');
    if (context != null) {
      const outputLineStartX = 0;
      const outputLineEndX: number = this.width;
      const outputLineY: number = this.convertToCoordinateY(this.operator.output.value);
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
  override draw(): void {
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
export class WaveformGraphComponent extends GraphComponent {

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
   * 波形を描画します。
   */
  private drawWaveform(): void {
    const context: CanvasRenderingContext2D | null = this.element.getContext('2d');
    if (context != null) {
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
    }
  }

  /**
   * 左端に線分を描画します。
   */
  private drawBorderLeft(): void {
    const context: CanvasRenderingContext2D | null = this.element.getContext('2d');
    if (context != null) {
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

  /**
   * グラフを描画します。
   */
  override draw(): void {
    this.drawWaveform();
    this.drawBorderLeft();
  }

}

export class ButtonComponent extends UiComponent {

  constructor(public element: HTMLButtonElement) {
    super();
  }

  addClickEventListener(listener: () => void): void {
    this.element.addEventListener('click', listener);
  }

}

export class AudioButtonComponent extends ButtonComponent {

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
