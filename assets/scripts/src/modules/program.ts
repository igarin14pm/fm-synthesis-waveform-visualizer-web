// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

/**
 * プログラムのパラメータを表す抽象クラスです
 */
export abstract class ProgramParameter {
  
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
export class OperatorVolumeParameter extends ProgramParameter {

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
export class OperatorRatioParameter extends ProgramParameter {

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
export class OperatorProgram {

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
export class FmSynthProgram {

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
