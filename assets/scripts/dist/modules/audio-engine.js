// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org
/**
 * オーディオの処理を行うクラスです。
 */
export class AudioEngine {
    constructor() {
        /**
         * Web Audio APIのAudioContextインスタンスです
         */
        this.audioContext = null;
        /**
         * FMシンセサイザーの音を出力するAudioWorkletNodeです
         */
        this.audioWorkletNode = null;
    }
    /**
     * AudioEngineが音を出力中かを表します
     */
    get isRunning() {
        return this.audioContext != null;
    }
    /**
     * 指定したパラメーター名にパラメーターの値をセットします
     * @param name AudioParamDescriptorで指定したパラメーター名
     * @param value パラメーターの値
     */
    setParameterValue(name, value) {
        if (this.audioContext != null && this.audioWorkletNode != null) {
            const param = this.audioWorkletNode.parameters.get(name);
            param?.setValueAtTime(value, this.audioContext.currentTime);
        }
    }
    /**
     * 音声を再生します。
     * @param modulatorValue モジュレーターの値を格納したOperatorValueのインスタンス
     * @param callback 再生を始める処理が完了した後に呼ばれる関数
     */
    async start(modulatorProgram, callback) {
        this.audioContext = new AudioContext();
        await this.audioContext.audioWorklet.addModule('./assets/scripts/dist/modules/fm-synth-audio-processor.js');
        this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'fm-synth-audio-processor');
        this.setParameterValue(modulatorProgram.volumeParameter.name, modulatorProgram.volumeParameter.value);
        this.setParameterValue(modulatorProgram.ratioParameter.name, modulatorProgram.ratioParameter.value);
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
