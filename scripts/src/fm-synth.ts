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
   * Signalのインスタンスを生成します。
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
   * Signalインスタンスを格納したプライベートフィールドを参照するゲッタとして実装することで、
   * Signalインスタンスを他シンセモジュールに参照渡しすることができます。
   * @example
   * class SomeClass implements Outputting {
   *   // Signalのインスタンス
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
   * MasterPhaseのインスタンスをフィールドに持っているFMSynthのインスタンス
   */
  fmSynth: FMSynth;

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
   * MasterPhaseのインスタンスを生成します。
   * @param fmSynth MasterPhaseのインスタンスをフィールドに持っているFMSynthのインスタンス
   */
  constructor(fmSynth: FMSynth) {
    this.fmSynth = fmSynth;
  }
  
  /**
   * MasterPhaseの動作をサンプリングレート一つ分進めます。
   */
  moveFrameForward(): void {
    const deltaPhase = this.fmSynth.waveFrequency / this.fmSynth.samplingRate;
    this._output.value = (this._output.value + deltaPhase) % 1;
  }

}

/**
 * Operatorの位相を表すクラスです。
 */
export class Phase implements Inputting, Processing, Outputting, Syncable {
  
  /**
   * Phaseのインスタンスをフィールドに持っているOperatorのインスタンス
   */
  operator: Operator;
  
  /**
   * MasterPhaseからの信号
   */
  input: Signal;
  
  /**
   * モジュレーターとなるOperatorからの信号
   * モジュレーション元がない場合はnullとなります。
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
   * 位相が一周して (計算した位相の値 < 一つ前に計算した位相の値) となった時にtrue、そうでない時にfalseとなります。
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
   * modulatorSignalがnullの時は0になります。
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
   * Phaseのインスタンスを生成します。
   * @param operator Phaseのインスタンスをフィールドに持っているOperatorのインスタンス
   * @param masterPhaseSignal MasterPhaseからの信号
   * @param modulatorSignal モジュレーターとなるOperatorからの信号
   */
  constructor(operator: Operator, masterPhaseSignal: Signal, modulatorSignal: Signal | null) {
    this.operator = operator;
    this.input = masterPhaseSignal;
    this.modulatorSignal = modulatorSignal
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
   * Phaseの動作をサンプリングレート一つ分進めます。
   */
  moveFrameForward(): void {
    let valueWithoutMod = this.input.value * this.operator.ratio % 1;
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
   * オペレーターの位相を表すPhaseクラスのインスタンス
   */
  phase: Phase;

  /**
   * Volumeパラメーター
   * キャリアの場合は音量、モジュレーターの場合はモジュレーション量になります。
   */
  volume: number = 1.0;
  
  /**
   * Ratioパラメーター
   * MasterPhaseの周波数に対する周波数比
   */
  ratio: number = 1;

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
   * Operatorのインスタンスを生成します。
   * @param fmSynth Operatorのインスタンスをフィールドに持っているFMSynthのインスタンス
   * @param modulatorSignal モジュレーターからの信号 モジュレーターを持たない場合はnullを渡してください
   */
  constructor(fmSynth: FMSynth, modulatorSignal: Signal | null) {
    this.phase = new Phase(this, fmSynth.masterPhase.output, modulatorSignal);
  }

  /**
   * 信号を処理して出力信号の値を計算します。
   * @returns 計算した出力信号の値
   */
  process(): number {
    return this.volume * Math.sin(2 * Math.PI * this.phase.output.value);
  }

  /**
   * Operatorの動作をサンプリングレート一つ分進めます。
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
   * MasterPhaseのインスタンス
   */
  masterPhase: MasterPhase;
  
  /**
   * モジュレーター用Operatorのインスタンス
   */
  modulator: Operator;
  
  /**
   * キャリア用Operatorのインスタンス
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
   * FMSynthのインスタンスを生成します。
   * @param samplingRate サンプリングレート
   * @param waveFrequency 出力波形の周波数
   * @param outputVolume 出力信号のボリューム
   */
  constructor(samplingRate: number, waveFrequency: number, outputVolume: number) {
    this.samplingRate = samplingRate;
    this.waveFrequency = waveFrequency;
    this.outputVolume = outputVolume;

    this.masterPhase = new MasterPhase(this);
    this.modulator = new Operator(this, null);
    this.carrier = new Operator(this, this.modulator.output);
  }

  /**
   * 信号を処理して出力信号の値を計算します。
   * @returns 計算した出力信号の値
   */
  process(): number {
    return this.carrier.output.value * this.outputVolume;
  }

  /**
   * FMSynthの動作をサンプリングレート一つ分進めます。
   */
  moveFrameForward(): void {
    let frameUpdateQueue: Syncable[] = [this.masterPhase, this.modulator, this.carrier];
    frameUpdateQueue.forEach(syncable => {
      syncable.moveFrameForward();
    });

    this._output.value = this.process();
  }

}
