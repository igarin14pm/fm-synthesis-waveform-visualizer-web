import { OperatorParam, FMSynthParam, FMSynth } from './script-fm-synth.js';

class AudioProcessor extends AudioWorkletProcessor {  
  constructor() {
    super();
    
    let fmSynthParam = new FMSynthParam(
      sampleRate,
      440,
      new OperatorParam(1.0, 1),
      new OperatorParam(1.0, 1),
      1
    );
    this.fmSynth = new FMSynth(fmSynthParam);
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
      this.fmSynth.fmSynthParam.modulator.volume = volumeParameter.length > 1 ? volumeParameter[i] : volumeParameter[0];
        
      let ratioParameter = parameters['modulatorRatio'];
      this.fmSynth.fmSynthParam.modulator.ratio = ratioParameter.length > 1 ? ratioParameter[i] : ratioParameter[0]
      
      channel[i] = this.fmSynth.getOutput();
      this.fmSynth.moveFrameForward();
    }
    
    return true;
  }
  
}

registerProcessor('audio-processor', AudioProcessor);
