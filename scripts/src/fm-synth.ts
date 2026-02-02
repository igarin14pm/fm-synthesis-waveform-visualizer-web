/*
 * Copyright (c) 2026 Igarin
 * This software is released under the MIT License.
 * https://opensource.org
 */

// Signal

/**
 * シンセサイザー内でやりとりされる信号を表します。
 */
export class Signal {

  /**
   * 信号の値
   */
  value: number;

  /**
   * 信号の値を表しますが、元の値が1.0を上回る場合は1.0、-1.0を下回る場合は-1.0になります。
   */
  get clippedValue(): number {
    if (this.value > 1.0) {
      return 1.0;
    } else if (this.value < -1.0) {
      return -1.0;
    } else {
      return this.value;
    }
  }

  /**
   * `Signal`のインスタンスを生成します。
   * @param value 信号の値
   */
  constructor(value: number) {
    this.value = value;
  }

}

// Interface

/**
 * シンセサイザー・モジュールが入力を持っていることを表します。
 */
export interface Inputting {
  
  /**
   * 入力信号
   */
  input: Signal;

}

/**
 * シンセサイザー・モジュール内で信号を処理することを表します。
 */
export interface Processing {
  
  /**
   * 信号を処理して出力信号の値を計算します。
   * @returns 計算した出力信号の値
   */
  process(): number;
}


/**
 * シンセサイザー・モジュールが信号を出力することを表します。
 */
export interface Outputting {
  
  /**
   * 出力する信号
   * `Signal`インスタンスを格納したプライベートフィールドを参照するゲッタとして実装することで、
   * `Signal`インスタンスを他シンセモジュールに参照渡しすることができます。
   * @example
   * class SomeClass implements Outputting {
   *   // `Signal`のインスタンス
   *   private _output = Signal(0);
   *
   *   get output(): Signal { return this._output; }
   * }
   */
  output: Signal;
  
}

/**
 * シンセサイザー・モジュールがサンプリングレートに同期して動作することを表します。
 */
export interface Syncable {
  
  /**
   * シンセサイザー・モジュールの動作をサンプリングレート一つ分進めます。
   */
  moveFrameForward(): void;
}

// FM Synth Modules

/**
 * FMシンセ内ですべてのPhaseの同期元となるクラスです。
 */
export class MasterPhase implements Outputting, Syncable {

  /**
   * サンプリングレート
   */
  samplingRate: number;
  
  /**
   * 出力波形の周波数
   */
  waveFrequency: number;

  /**
   * 出力信号のインスタンス
   */
  private _output = new Signal(0.0);

  /**
   * 出力信号
   */
  get output(): Signal {
    return this._output;
  }

  /**
   * `MasterPhase`のインスタンスを生成します。
   * @param samplingRate サンプリングレート
   * @param waveFrequency 出力波形の周波数
   */
  constructor(
    samplingRate: number,
    waveFrequency: number
  ) {
    this.samplingRate = samplingRate;
    this.waveFrequency = waveFrequency;
  }
  
  /**
   * `MasterPhase`の動作をサンプリングレート一つ分進めます。
   */
  moveFrameForward(): void {
    const deltaPhase = this.waveFrequency / this.samplingRate;
    this._output.value = (this._output.value + deltaPhase) % 1;
  }

}

/**
 * `Operator`の位相を表すクラスです。
 */
export class Phase implements Inputting, Processing, Outputting, Syncable {
  
  /**
   * `MasterPhase`からの信号
   */
  input: Signal;

  /**
   * `Operator`のRatioパラメーターの値
   */
  operatorRatio: number;
  
  /**
   * モジュレーターとなる`Operator`からの信号
   * モジュレーション元がない場合は`null`となります。
   */
  modulatorSignal: Signal | null;

  /**
   * まだモジュレーションが掛かっていない位相の値
   * [0]がその時点で最後に計算された値、[1]はその1つ前に計算された値です。
   */
  valuesWithoutMod: number[] = [0.0, 0.0];
  
  /**
   * 出力信号のインスタンス
   */
  private _output = new Signal(0.0);

  /**
   * 位相が一周して (計算した位相の値 < 一つ前に計算した位相の値) となった時に`true`、そうでない時に`false`となります。
   */
  get isLooped(): boolean {
    return this.valuesWithoutMod[0] < this.valuesWithoutMod[1];
  }

  /**
   * 出力信号
   */
  get output(): Signal {
    return this._output;
  }

  /**
   * モジュレーターの信号から計算した、実際に変調で使うモジュレーションの値
   * `modulatorSignal`が`null`の時は`0`になります。
   */
  get modulationValue(): number {
    
    // 変調量の係数 学習用に使うならこれくらいが多すぎず少なすぎずちょうどいい
    const modulationCoefficient: number = 0.25;
    
    if (this.modulatorSignal != null) {
      return this.modulatorSignal.value * modulationCoefficient;
    } else {
      return 0
    }
    
  }

  /**
   * `Phase`のインスタンスを生成します。
   * @param masterPhaseSignal `MasterPhase`からの信号
   * @param operatorRatio `Operator`のRatioパラメーターの値
   * @param modulatorSignal モジュレーターとなる`Operator`からの信号 モジュレーション元がない場合は`null`を渡してください
   */
  constructor(
    masterPhaseSignal: Signal,
    operatorRatio: number,
    modulatorSignal: Signal | null
  ) {
    this.input = masterPhaseSignal;
    this.operatorRatio = operatorRatio;
    this.modulatorSignal = modulatorSignal;
  }

  /**
   * 信号を処理して出力信号の値を計算します。
   * @returns 計算した出力信号の値
   */
  process(): number {
    let value = this.valuesWithoutMod[0] + this.modulationValue;
    value -= Math.floor(value);
    return value;
  }

  /**
   * `Phase`の動作をサンプリングレート一つ分進めます。
   */
  moveFrameForward(): void {
    const valueWithoutMod: number = this.input.value * this.operatorRatio % 1;
    this.valuesWithoutMod.pop();
    this.valuesWithoutMod.splice(0, 0, valueWithoutMod);

    this._output.value = this.process();
  }

}

/**
 * FMシンセサイザーで波形を生成するオペレーターを表すクラスです。
 */
export class Operator implements Processing, Outputting, Syncable {

  /**
   * オペレーターの位相を表す`Phase`クラスのインスタンス
   */
  phase: Phase;

  /**
   * Volumeパラメーター
   * キャリアの場合は音量、モジュレーターの場合はモジュレーション量になります。
   */
  volume: number = 1.0;

  /**
   * `ratio`のプライベートフィールド
   */
  private _ratio: number;

  /**
   * Ratioパラメーター
   * `MasterPhase`の周波数に対する周波数比
   */
  get ratio(): number {
    return this._ratio;
  }

  /**
   * Ratioパラメーター
   * `MasterPhase`の周波数に対する周波数比
   */
  set ratio(newValue) {
    this._ratio = newValue;
    this.phase.operatorRatio = newValue;
  }

  /**
   * 出力信号のインスタンス
   */
  private _output = new Signal(0.0);

  /**
   * 出力信号
   */
  get output(): Signal {
    return this._output;
  }

  /**
   * `Operator`のインスタンスを生成します。
   * @param volume Volumeパラメーター キャリアの場合は音量、モジュレーターの場合はモジュレーション量になります
   * @param ratio Ratioパラメーター `MasterPhase`の周波数に対する周波数比
   * @param masterPhaseSignal `MasterPhase`からの信号
   * @param modulatorSignal モジュレーターとなる`Operator`からの信号 モジュレーション元がない場合は`null`を渡してください
   */
  constructor(
    volume: number,
    ratio: number,
    masterPhaseSignal: Signal,
    modulatorSignal: Signal | null
  ) {
    this.volume = volume;
    this._ratio = ratio;
    this.phase = new Phase(masterPhaseSignal, ratio, modulatorSignal);
  }

  /**
   * 信号を処理して出力信号の値を計算します。
   * @returns 計算した出力信号の値
   */
  process(): number {
    return this.volume * Math.sin(2 * Math.PI * this.phase.output.value);
  }

  /**
   * `Operator`の動作をサンプリングレート一つ分進めます。
   */
  moveFrameForward(): void {
    this.phase.moveFrameForward();
    this._output.value = this.process();
  }

}

/**
 * FMシンセサイザーを表すクラスです。
 */
export class FMSynth implements Processing, Outputting, Syncable {

  /**
   * FMシンセサイザーが動作するサンプリングレート
   */
  samplingRate: number;
  
  /**
   * 出力する波形の周波数
   */
  waveFrequency: number;
  
  /**
   * 出力する波形のボリューム
   */
  outputVolume: number;

  /**
   * `MasterPhase`のインスタンス
   */
  masterPhase: MasterPhase;
  
  /**
   * モジュレーター用`Operator`のインスタンス
   */
  modulator: Operator;
  
  /**
   * キャリア用`Operator`のインスタンス
   */
  carrier: Operator;

  /**
   * 出力信号のインスタンス
   */
  private _output = new Signal(0.0);

  /**
   * 出力信号
   */
  get output(): Signal {
    return this._output;
  }

  /**
   * `FMSynth`のインスタンスを生成します。
   * @param samplingRate サンプリングレート
   * @param waveFrequency 出力波形の周波数
   * @param outputVolume 出力信号のボリューム
   */
  constructor(
    samplingRate: number, 
    waveFrequency: number, 
    outputVolume: number
  ) {
    this.samplingRate = samplingRate;
    this.waveFrequency = waveFrequency;
    this.outputVolume = outputVolume;

    this.masterPhase = new MasterPhase(samplingRate, waveFrequency);
    this.modulator = new Operator(1, 1, this.masterPhase.output, null);
    this.carrier = new Operator(1, 1, this.masterPhase.output, this.modulator.output);
  }

  /**
   * 信号を処理して出力信号の値を計算します。
   * @returns 計算した出力信号の値
   */
  process(): number {
    return this.carrier.output.value * this.outputVolume;
  }

  /**
   * `FMSynth`の動作をサンプリングレート一つ分進めます。
   */
  moveFrameForward(): void {
    let frameUpdateQueue: Syncable[] = [this.masterPhase, this.modulator, this.carrier];
    frameUpdateQueue.forEach(syncable => {
      syncable.moveFrameForward();
    });

    this._output.value = this.process();
  }

}
