// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org
/**
 * プログラムのパラメータを表す抽象クラスです
 */
export class ProgramParameter {
    /**
     * `ProgramParameter`のインスタンスを生成します
     * @param name `AudioParam`で使用するパラメータ名
     * @param initialValue パラメータの初期値
     */
    constructor(name, initialValue) {
        this.name = name;
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
    get uiValue() {
        return this.value * 100;
    }
    /**
     * UI上で表示するパラメーターの値
     */
    set uiValue(newValue) {
        this.value = newValue / 100;
    }
    /**
     * `OperatorVolumeParameter`のインスタンスを生成します
     * @param name `AudioParam`で使用するパラメータ名
     * @param initialValue パラメータの初期値
     */
    constructor(name, initialValue) {
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
    get uiValue() {
        return this.value;
    }
    /**
     * UI上で表示するパラメーターの値
     */
    set uiValue(newValue) {
        this.value = newValue;
    }
    /**
     * `OperatorRatioParameter`のインスタンスを生成します
     * @param name `AudioParam`で使用するパラメータ名
     * @param initialValue パラメータの初期値
     */
    constructor(name, initialValue) {
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
    constructor(volumeParameter, ratioParameter) {
        this.volumeParameter = volumeParameter;
        this.ratioParameter = ratioParameter;
    }
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
    constructor(samplingRate, waveFrequency, outputVolume) {
        this.samplingRate = samplingRate;
        this.waveFrequency = waveFrequency;
        this.outputVolume = outputVolume;
    }
}
