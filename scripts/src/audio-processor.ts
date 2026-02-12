/*
 * Copyright (c) 2026 Igarin
 * This software is released under the MIT License.
 * https://opensource.org
 */

import { FmSynth } from './fm-synth.js';

class AudioProcessor extends AudioWorkletProcessor {

  static get parameterDescriptors(): AudioParamDescriptor[] {
    return [
      {
        // モジュレーターのVolumeパラメーター
        name: 'modulatorVolume',
        defaultValue: 1,
        minValue: 0,
        maxValue: 1,
        automationRate: 'a-rate'
      },
      {
        // モジュレーターのRatioパラメーター
        name: 'modulatorRatio',
        defaultValue: 1,
        minValue: 1,
        maxValue: 10,
        automationRate: 'a-rate'
      }
    ];
  }

  // 音声を出力するFMシンセサイザー
  fmSynth: FmSynth;

  constructor() {
    super();

    // 周波数を440ヘルツ固定にする
    const waveFrequency = 440;
    
    // ボリュームはこれくらいがちょうど良い
    const fmSynthVolume = 0.25;

    this.fmSynth = new FmSynth(sampleRate, waveFrequency, fmSynthVolume);
  }

  process(
    inputs: Float32Array[][], 
    outputs: Float32Array[][], 
    parameters: Record<string, Float32Array>
  ): boolean {
    let output = outputs[0];
    let channels = output[0];

    /**
     * `AudioParamDescriptor`からパラメータの値を取得します
     * @param parameterName `AudioParamDescriptor.name`で指定した文字列
     * @param channelIndex 1つの出力に含まれるチャンネルのindex
     * @returns パラメータの値
     */
    function getParameterValue(parameterName: string, channelIndex: number): number {
      const parameterValues = parameters[parameterName];
      if (parameterValues.length > 1) {
        return parameterValues[channelIndex];
      } else {
        return parameterValues[0];
      }
    }

    for (let channelIndex = 0; channelIndex < channels.length; channelIndex++) {
      // パラメーターの値を取得、FMシンセに設定する
      this.fmSynth.modulator.volume = getParameterValue('modulatorVolume', channelIndex);
      this.fmSynth.modulator.ratio = getParameterValue('modulatorRatio', channelIndex);

      // FMシンセの信号を出力する
      channels[channelIndex] = this.fmSynth.output.clippedValue;
      
      // FMシンセの動作をサンプリングレート一つ分進める
      this.fmSynth.moveFrameForward();
    }

    return true;
  }

}

registerProcessor('audio-processor', AudioProcessor);
