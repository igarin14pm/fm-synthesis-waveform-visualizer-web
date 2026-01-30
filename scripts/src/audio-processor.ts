/*
 * Copyright (c) 2026 Igarin
 * This software is released under the MIT License.
 * https://opensource.org
 */

import { FMSynth } from './fm-synth.js';

class AudioProcessor extends AudioWorkletProcessor {

  static get parameterDescriptors(): AudioParamDescriptor[] {
    return [
      {
        name: 'modulatorVolume',
        defaultValue: 1,
        minValue: 0,
        maxValue: 1,
        automationRate: 'a-rate'
      },
      {
        name: 'modulatorRatio',
        defaultValue: 1,
        minValue: 1,
        maxValue: 10,
        automationRate: 'a-rate'
      }
    ];
  }

  fmSynth: FMSynth;

  constructor() {
    super();

    const waveFrequency = 440;
    const fmSynthVolume = 0.25;

    this.fmSynth = new FMSynth(sampleRate, waveFrequency, fmSynthVolume);
  }

  process(
    inputs: Float32Array[][], 
    outputs: Float32Array[][], 
    parameters: Record<string, Float32Array>
  ): boolean {
    let output = outputs[0];
    let channel = output[0];

    for (let i = 0; i < channel.length; i++) {
      let modulatorVolumeParameter = parameters['modulatorVolume'];
      this.fmSynth.modulator.volume = modulatorVolumeParameter.length > 1 ? modulatorVolumeParameter[i] : modulatorVolumeParameter[0];

      let modulatorRatioParameter = parameters['modulatorRatio'];
      this.fmSynth.modulator.ratio = modulatorRatioParameter.length > 1 ? modulatorRatioParameter[i] : modulatorRatioParameter[0];
      

      channel[i] = this.fmSynth.output.clippedValue;
      this.fmSynth.moveFrameForward();
    }

    return true;
  }

}

registerProcessor('audio-processor', AudioProcessor);
