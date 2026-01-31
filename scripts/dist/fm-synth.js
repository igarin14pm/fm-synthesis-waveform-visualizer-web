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
     * Signalのインスタンスを生成します。
     * @param value 信号の値
     */
    constructor(value) {
        this.value = value;
    }
}
// FM Synth Modules
/**
 * FMシンセ内ですべてのPhaseの同期元となるクラスです。
 */
export class MasterPhase {
    /**
     * 出力信号
     */
    get output() {
        return this.outputSource;
    }
    /**
     * MasterPhaseのインスタンスを生成します。
     * @param fmSynth MasterPhaseのインスタンスをフィールドに持っているFMSynthのインスタンス
     */
    constructor(fmSynth) {
        /**
         * 出力信号のインスタンス
         */
        this.outputSource = new Signal(0.0);
        this.fmSynth = fmSynth;
    }
    /**
     * MasterPhaseの動作をサンプリングレート一つ分進めます。
     */
    moveFrameForward() {
        const deltaPhase = this.fmSynth.waveFrequency / this.fmSynth.samplingRate;
        this.outputSource.value = (this.outputSource.value + deltaPhase) % 1;
    }
}
/**
 * Operatorの位相を表すクラスです。
 */
export class Phase {
    /**
     * 位相が一周して (計算した位相の値 < 一つ前に計算した位相の値) となった時にtrue、そうでない時にfalseとなります。
     */
    get isLooped() {
        return this.valuesWithoutMod[0] < this.valuesWithoutMod[1];
    }
    /**
     * 出力信号
     */
    get output() {
        return this.outputSource;
    }
    /**
     * モジュレーターの信号から計算した、実際に変調で使うモジュレーションの値
     * modulatorSignalがnullの時は0になります。
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
     * Phaseのインスタンスを生成します。
     * @param operator Phaseのインスタンスをフィールドに持っているOperatorのインスタンス
     * @param masterPhaseSignal MasterPhaseからの信号
     * @param modulatorSignal モジュレーターとなるOperatorからの信号
     */
    constructor(operator, masterPhaseSignal, modulatorSignal) {
        /**
         * まだモジュレーションが掛かっていない位相の値
         * [0]がその時点で最後に計算された値、[1]はその1つ前に計算された値です。
         */
        this.valuesWithoutMod = [0.0, 0.0];
        /**
         * 出力信号のインスタンス
         */
        this.outputSource = new Signal(0.0);
        this.operator = operator;
        this.input = masterPhaseSignal;
        this.modulatorSignal = modulatorSignal;
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
     * Phaseの動作をサンプリングレート一つ分進めます。
     */
    moveFrameForward() {
        let valueWithoutMod = this.input.value * this.operator.ratio % 1;
        this.valuesWithoutMod.pop();
        this.valuesWithoutMod.splice(0, 0, valueWithoutMod);
        this.outputSource.value = this.process();
    }
}
/**
 * FMシンセサイザーで波形を生成するオペレーターを表すクラスです。
 */
export class Operator {
    /**
     * 出力信号
     */
    get output() {
        return this.outputSource;
    }
    /**
     * Operatorのインスタンスを生成します。
     * @param fmSynth Operatorのインスタンスをフィールドに持っているFMSynthのインスタンス
     * @param modulatorSignal モジュレーターからの信号 モジュレーターを持たない場合はnullを渡してください
     */
    constructor(fmSynth, modulatorSignal) {
        /**
         * Volumeパラメーター
         * キャリアの場合は音量、モジュレーターの場合はモジュレーション量になります。
         */
        this.volume = 1.0;
        /**
         * Ratioパラメーター
         * MasterPhaseの周波数に対する周波数比
         */
        this.ratio = 1;
        /**
         * 出力信号のインスタンス
         */
        this.outputSource = new Signal(0.0);
        this.phase = new Phase(this, fmSynth.masterPhase.output, modulatorSignal);
        if (modulatorSignal !== null) {
            this.input = modulatorSignal;
        }
        else {
            this.input = new Signal(0.0);
        }
    }
    /**
     * 信号を処理して出力信号の値を計算します。
     * @returns 計算した出力信号の値
     */
    process() {
        return this.volume * Math.sin(2 * Math.PI * this.phase.output.value);
    }
    /**
     * Operatorの動作をサンプリングレート一つ分進めます。
     */
    moveFrameForward() {
        this.phase.moveFrameForward();
        this.outputSource.value = this.process();
    }
}
/**
 * FMシンセサイザーを表すクラスです。
 */
export class FMSynth {
    /**
     * 出力信号
     */
    get output() {
        return this.outputSource;
    }
    /**
     * FMSynthのインスタンスを生成します。
     * @param samplingRate サンプリングレート
     * @param waveFrequency 出力波形の周波数
     * @param outputVolume 出力信号のボリューム
     */
    constructor(samplingRate, waveFrequency, outputVolume) {
        /**
         * 出力信号のインスタンス
         */
        this.outputSource = new Signal(0.0);
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
    process() {
        return this.carrier.output.value * this.outputVolume;
    }
    /**
     * FMSynthの動作をサンプリングレート一つ分進めます。
     */
    moveFrameForward() {
        let frameUpdateQueue = [this.masterPhase, this.modulator, this.carrier];
        frameUpdateQueue.forEach(syncable => {
            syncable.moveFrameForward();
        });
        this.outputSource.value = this.process();
    }
}
