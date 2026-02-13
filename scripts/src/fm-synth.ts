// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

// -------- Signal --------

/**
 * シンセサイザー内でやりとりされる信号を表します。
 */
export class Signal {

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
  constructor(public value: number) { }

}

// -------- Interface --------

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

// -------- FM Synth Modules --------

/**
 * `FmSynth`のモジュールであることを表す基底クラスです。
 */
export class FmSynthModule { }

/**
 * FMシンセ内ですべてのPhaseの同期元となるクラスです。
 */
export class MasterPhase extends FmSynthModule implements Outputting, Syncable {

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
    public samplingRate: number,
    public waveFrequency: number
  ) {
    super();
  }
  
  /**
   * `MasterPhase`の動作をサンプリングレート一つ分進めます。
   */
  moveFrameForward(): void {
    const deltaPhase: number = this.waveFrequency / this.samplingRate;
    this._output.value = (this._output.value + deltaPhase) % 1;
  }

}

/**
 * `Operator`の位相を表すクラスです。
 */
export class Phase extends FmSynthModule implements Inputting, Processing, Outputting, Syncable {
  
  /**
   * `MasterPhase`からの信号
   */
  input: Signal;

  /**
   * まだモジュレーションが掛かっていない位相の値
   * [0]がその時点で最後に計算された値、[1]はその1つ前に計算された値です。
   */
  valuesWithoutMod: number[] = [0.0, 0.0];

  /**
   * 位相が一周して (計算した位相の値 < 一つ前に計算した位相の値) となった時に`true`、そうでない時に`false`となります。
   */
  get isLooped(): boolean {
    return this.valuesWithoutMod[0] < this.valuesWithoutMod[1];
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
   * モジュレーターの信号から計算した、実際に変調で使うモジュレーションの値
   * `modulatorSignal`が`null`の時は`0`になります。
   */
  get modulationValue(): number {
    
    // 変調量の係数 学習用に使うならこれくらいが多すぎず少なすぎずちょうどいい
    const modulationCoefficient = 0.25;
    
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
   * @param modulatorSignal モジュレーターとなる`Operator`からの信号 モジュレーション元がない場合は`null`となります
   */
  constructor(
    masterPhaseSignal: Signal,
    public operatorRatio: number,
    public modulatorSignal: Signal | null
  ) {
    super();
    this.input = masterPhaseSignal;
  }

  /**
   * 信号を処理して出力信号の値を計算します。
   * @returns 計算した出力信号の値
   */
  process(): number {
    let value: number = this.valuesWithoutMod[0] + this.modulationValue;
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
export class Operator extends FmSynthModule implements Processing, Outputting, Syncable {

  /**
   * オペレーターの位相を表す`Phase`クラスのインスタンス
   */
  phase: Phase;

  /**
   * Ratioパラメーター
   * `MasterPhase`の周波数に対する周波数比
   */
  get ratio(): number {
    return this.phase.operatorRatio;
  }

  /**
   * Ratioパラメーター
   * `MasterPhase`の周波数に対する周波数比
   */
  set ratio(newValue: number) {
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
    public volume: number,
    ratio: number,
    masterPhaseSignal: Signal,
    modulatorSignal: Signal | null
  ) {
    super();
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
export class FmSynth implements Processing, Outputting, Syncable {

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
    public samplingRate: number, 
    public waveFrequency: number, 
    public outputVolume: number
  ) {
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
