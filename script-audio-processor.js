import { FMSynth } from './script-fm-synth.js';

class AudioProcessor extends AudioWorkletProcessor {
  
  constructor() {
    super();
    
    const waveFrequency = 440;
    const fmSynthVolume = 0.25;
    
    this.fmSynth = new FMSynth(sampleRate, waveFrequency, fmSynthVolume);
  }
  
  static get parameterDescriptors() {
    return [
      {
        name: 'modulatorVolume',
        defaultValue: 100,
        minValue: 0,
        maxValue: 100,
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
  
  process(inputs, outputs, parameters) {
    let output = outputs[0];
    let channel = output[0];
    
    for (let i = 0; i < channel.length; i++) { 
      let volumeParameter = parameters['modulatorVolume'];
      this.fmSynth.modulator.volume = volumeParameter.length > 1 ? volumeParameter[i] : volumeParameter[0];
      
      let ratioParameter = parameters['modulatorRatio'];
      this.fmSynth.modulator.ratio = ratioParameter.length > 1 ? ratioParameter[i] : ratioParameter[0]
      
      channel[i] = this.fmSynth.getOutput().clippedValue;
      
      this.fmSynth.moveFrameForward();
    }
    
    return true;
  }
  
}

registerProcessor('audio-processor', AudioProcessor);
