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
    get clippedValue() {
        if (this.value > 1.0) {
            return 1.0;
        }
        else if (this.value < -1.0) {
            return -1.0;
        }
        else {
            return this.value;
        }
    }
    /**
     * `Signal`のインスタンスを生成します。
     * @param value 信号の値
     */
    constructor(value) {
        this.value = value;
    }
}
// -------- FM Synth Modules --------
/**
 * `FmSynth`のモジュールであることを表す基底クラスです。
 */
export class FmSynthModule {
}
/**
 * FMシンセ内ですべてのPhaseの同期元となるクラスです。
 */
export class MasterPhase extends FmSynthModule {
    /**
     * 出力信号
     */
    get output() {
        return this._output;
    }
    /**
     * `MasterPhase`のインスタンスを生成します。
     * @param samplingRate サンプリングレート
     * @param waveFrequency 出力波形の周波数
     */
    constructor(samplingRate, waveFrequency) {
        super();
        this.samplingRate = samplingRate;
        this.waveFrequency = waveFrequency;
        /**
         * 出力信号のインスタンス
         */
        this._output = new Signal(0.0);
    }
    /**
     * `MasterPhase`の動作をサンプリングレート一つ分進めます。
     */
    moveFrameForward() {
        const deltaPhase = this.waveFrequency / this.samplingRate;
        this._output.value = (this._output.value + deltaPhase) % 1;
    }
}
/**
 * `Operator`の位相を表すクラスです。
 */
export class Phase extends FmSynthModule {
    /**
     * 位相が一周して (計算した位相の値 < 一つ前に計算した位相の値) となった時に`true`、そうでない時に`false`となります。
     */
    get isLooped() {
        return this.valuesWithoutMod[0] < this.valuesWithoutMod[1];
    }
    /**
     * 出力信号
     */
    get output() {
        return this._output;
    }
    /**
     * モジュレーターの信号から計算した、実際に変調で使うモジュレーションの値
     * `modulatorSignal`が`null`の時は`0`になります。
     */
    get modulationValue() {
        // 変調量の係数 学習用に使うならこれくらいが多すぎず少なすぎずちょうどいい
        const modulationCoefficient = 0.25;
        if (this.modulatorSignal != null) {
            return this.modulatorSignal.value * modulationCoefficient;
        }
        else {
            return 0;
        }
    }
    /**
     * `Phase`のインスタンスを生成します。
     * @param masterPhaseSignal `MasterPhase`からの信号
     * @param operatorRatio `Operator`のRatioパラメーターの値
     * @param modulatorSignal モジュレーターとなる`Operator`からの信号 モジュレーション元がない場合は`null`となります
     */
    constructor(masterPhaseSignal, operatorRatio, modulatorSignal) {
        super();
        this.operatorRatio = operatorRatio;
        this.modulatorSignal = modulatorSignal;
        /**
         * まだモジュレーションが掛かっていない位相の値
         * [0]がその時点で最後に計算された値、[1]はその1つ前に計算された値です。
         */
        this.valuesWithoutMod = [0.0, 0.0];
        /**
         * 出力信号のインスタンス
         */
        this._output = new Signal(0.0);
        this.input = masterPhaseSignal;
    }
    /**
     * 信号を処理して出力信号の値を計算します。
     * @returns 計算した出力信号の値
     */
    process() {
        let value = this.valuesWithoutMod[0] + this.modulationValue;
        value -= Math.floor(value);
        return value;
    }
    /**
     * `Phase`の動作をサンプリングレート一つ分進めます。
     */
    moveFrameForward() {
        const valueWithoutMod = this.input.value * this.operatorRatio % 1;
        this.valuesWithoutMod.pop();
        this.valuesWithoutMod.splice(0, 0, valueWithoutMod);
        this._output.value = this.process();
    }
}
/**
 * FMシンセサイザーで波形を生成するオペレーターを表すクラスです。
 */
export class Operator extends FmSynthModule {
    /**
     * Ratioパラメーター
     * `MasterPhase`の周波数に対する周波数比
     */
    get ratio() {
        return this.phase.operatorRatio;
    }
    /**
     * Ratioパラメーター
     * `MasterPhase`の周波数に対する周波数比
     */
    set ratio(newValue) {
        this.phase.operatorRatio = newValue;
    }
    /**
     * 出力信号
     */
    get output() {
        return this._output;
    }
    /**
     * `Operator`のインスタンスを生成します。
     * @param volume Volumeパラメーター キャリアの場合は音量、モジュレーターの場合はモジュレーション量になります
     * @param ratio Ratioパラメーター `MasterPhase`の周波数に対する周波数比
     * @param masterPhaseSignal `MasterPhase`からの信号
     * @param modulatorSignal モジュレーターとなる`Operator`からの信号 モジュレーション元がない場合は`null`を渡してください
     */
    constructor(volume, ratio, masterPhaseSignal, modulatorSignal) {
        super();
        this.volume = volume;
        /**
         * 出力信号のインスタンス
         */
        this._output = new Signal(0.0);
        this.phase = new Phase(masterPhaseSignal, ratio, modulatorSignal);
    }
    /**
     * 信号を処理して出力信号の値を計算します。
     * @returns 計算した出力信号の値
     */
    process() {
        return this.volume * Math.sin(2 * Math.PI * this.phase.output.value);
    }
    /**
     * `Operator`の動作をサンプリングレート一つ分進めます。
     */
    moveFrameForward() {
        this.phase.moveFrameForward();
        this._output.value = this.process();
    }
}
/**
 * FMシンセサイザーを表すクラスです。
 */
export class FmSynth {
    /**
     * 出力信号
     */
    get output() {
        return this._output;
    }
    /**
     * `FMSynth`のインスタンスを生成します。
     * @param samplingRate サンプリングレート
     * @param waveFrequency 出力波形の周波数
     * @param outputVolume 出力信号のボリューム
     */
    constructor(samplingRate, waveFrequency, outputVolume) {
        this.samplingRate = samplingRate;
        this.waveFrequency = waveFrequency;
        this.outputVolume = outputVolume;
        /**
         * 出力信号のインスタンス
         */
        this._output = new Signal(0.0);
        this.masterPhase = new MasterPhase(samplingRate, waveFrequency);
        this.modulator = new Operator(1, 1, this.masterPhase.output, null);
        this.carrier = new Operator(1, 1, this.masterPhase.output, this.modulator.output);
    }
    /**
     * 信号を処理して出力信号の値を計算します。
     * @returns 計算した出力信号の値
     */
    process() {
        return this.carrier.output.value * this.outputVolume;
    }
    /**
     * `FMSynth`の動作をサンプリングレート一つ分進めます。
     */
    moveFrameForward() {
        let frameUpdateQueue = [this.masterPhase, this.modulator, this.carrier];
        frameUpdateQueue.forEach(syncable => {
            syncable.moveFrameForward();
        });
        this._output.value = this.process();
    }
}
