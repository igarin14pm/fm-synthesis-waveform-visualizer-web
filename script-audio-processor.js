class AudioProcessor extends AudioWorkletProcessor {
  
  constructor() {
    super();
  }
  
  process(inputs, outputs, parameters) {
    let output = outputs[0];
    let channel = output[0];
    
    for (let i = 0; i < channel.length; i++) {
      channel[i] = Math.random() * 2 - 1;
    }
    
    return true;
  }
  
}

registerProcessor('audio-processor', AudioProcessor);
