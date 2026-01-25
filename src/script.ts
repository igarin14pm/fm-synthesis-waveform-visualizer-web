import { Syncable, Phase, Operator, FMSynth } from './fm-synth.js';

// Value Class

class OperatorValue {

  volumeParameterName: string;
  volumeValue: number;
  ratioParameterName: string;
  ratioValue: number;

  constructor(volumeParameterName: string, volumeValue: number, ratioParameterName: string, ratioValue: number) {
    this.volumeParameterName = volumeParameterName;
    this.volumeValue = volumeValue;
    this.ratioParameterName = ratioParameterName;
    this.ratioValue = ratioValue;
  }

  get volumeUIValue(): number {
    return this.volumeValue * 100;
  }

  set volumeUIValue(newValue: number) {
    this.volumeValue = newValue / 100;
  }

  get ratioUIValue(): number {
    return this.ratioValue;
  }

  set ratioUIValue(newValue: number) {
    this.ratioValue = newValue;
  }

}

class FMSynthValue {

  private _samplingRate: number;
  private _waveFrequency: number;
  private _outputVolume: number;

  constructor(
    samplingRate: number, 
    waveFrequency: number, 
    outputVolume: number,
  ) {
    this._samplingRate = samplingRate;
    this._waveFrequency = waveFrequency;
    this._outputVolume = outputVolume;
  }

  get samplingRate(): number {
    return this._samplingRate;
  }

  get waveFrequency(): number {
    return this._waveFrequency;
  }

  get outputVolume(): number {
    return this._outputVolume;
  }

}

// Audio Class

class AudioEngine {

  audioContext: AudioContext | null = null;
  audioWorkletNode: AudioWorkletNode | null = null; 

  get isRunning(): boolean {
    return this.audioContext !== null && this.audioWorkletNode !== null;
  }

  setParameterValue(name: string, value: number) {
    if (this.isRunning) {
      const param = this.audioWorkletNode!.parameters.get(name);
      param?.setValueAtTime(value, this.audioContext!.currentTime);
    }
  }

  async start(modulatorValue: OperatorValue) {
    this.audioContext = new AudioContext();
    await this.audioContext.audioWorklet.addModule('./dist/audio-processor.js');
    this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');

    this.setParameterValue(
      modulatorValue.volumeParameterName,
      modulatorValue.volumeValue
    );
    this.setParameterValue(
      modulatorValue.ratioParameterName,
      modulatorValue.ratioValue
    );
    
    this.audioWorkletNode.connect(this.audioContext.destination);    
  }

  stop() {
    this.audioContext?.close();
    this.audioContext = null;
    this.audioWorkletNode = null;
  }
}

// UI Classes

class PhaseGraph {

  element: HTMLCanvasElement;
  operator: Operator;

  constructor(element: HTMLCanvasElement, operator: Operator) {
    this.element = element; 
    this.operator = operator;
  }

  get width(): number {
    return this.element.width;
  }

  get height(): number {
    return this.element.height;
  }

  draw(): void {
    let circleCenterX = this.width / 3;
    let circleCenterY = this.height / 2;
    let circleRadius = this.height / 2 * this.operator.volume;
    if (this.element.getContext) {
      let phaseValue: number = this.operator.phase.output.value;
      let context: CanvasRenderingContext2D | null = this.element.getContext('2d');
      context?.beginPath();
      context?.arc(circleCenterX, circleCenterY, circleRadius, 0, 2 * Math.PI);
      context?.moveTo(circleCenterX, circleCenterY);
      context?.lineTo(
        circleRadius * Math.cos(2 * Math.PI * phaseValue) + circleCenterX,
        -1 * circleRadius * Math.sin(2 * Math.PI * phaseValue) + circleCenterY
      );
      context?.lineTo(
        this.width,
        -1 * circleRadius * Math.sin(2 * Math.PI * phaseValue) + circleCenterY
      );
      context?.stroke();
    }
  }

  clear(): void {
    if (this.element.getContext) {
      let context: CanvasRenderingContext2D | null = this.element.getContext('2d');
      context?.clearRect(0, 0, this.width, this.height);
    }
  }
  
  update(): void {
    this.clear();
    this.draw();
  }

}

class WaveformGraphData {

  valueLength: number;
  values: number[];

  constructor(samplingRate: number) {
    const numberOfWaves = 4;
    this.valueLength = samplingRate * numberOfWaves;

    let values = new Array<number>(this.valueLength);
    values.fill(0.0);
    this.values = values;
  }

  add(value: number) {
    this.values.pop();
    this.values.splice(0, 0, value);
  }

}

class WaveformGraph {

  element: HTMLCanvasElement;
  data: WaveformGraphData;

  constructor(element: HTMLCanvasElement, samplingRate: number) {
    this.element = element; 
    this.data = new WaveformGraphData(samplingRate);
  }

  get width(): number {
    return this.element.width;
  }

  get height(): number {
    return this.element.height;
  }

  draw() {
    if (this.element.getContext) {
      let context: CanvasRenderingContext2D | null = this.element.getContext('2d');
      context?.beginPath();
      for (const [index, value] of this.data.values.entries()) {
        let x = (index / (this.data.valueLength - 1)) * this.width;
        let y = (-(value) + 1) / 2 * this.height;
        if (index === 0) {
          context?.moveTo(x, y);
        } else {
          context?.lineTo(x, y);
        }
      }
      context?.stroke();

    }
  }

  clear() {
    if (this.element.getContext) {
      let context: CanvasRenderingContext2D | null = this.element.getContext('2d');
      context?.clearRect(0, 0, this.width, this.height);
    }
  }

  update() {
    this.clear();
    this.draw();
  }

}

class RangeInputUI {

  inputElement: HTMLInputElement;
  valueLabelElement: HTMLLabelElement;

  constructor(
    inputElement: HTMLInputElement,
    valueLabelElement: HTMLLabelElement,
    initialValue: number
  ) {
    this.inputElement = inputElement;
    this.valueLabelElement = valueLabelElement;

    this.inputElement.value = initialValue.toString();
    this.valueLabelElement.textContent = initialValue.toString();
  }

  get value(): number {
    return parseInt(this.inputElement.value);
  }

  addEventListener(listener: () => void) {
    this.inputElement.addEventListener('input', () => {
      listener();
      this.valueLabelElement.textContent = this.inputElement.value;
    })
  }

}

class OperatorUI implements Syncable {

  operator: Operator;
  phaseGraph: PhaseGraph;
  waveformGraph: WaveformGraph;
  
  constructor(
    operator: Operator,
    phaseGraphElement: HTMLCanvasElement,
    waveformGraphElement: HTMLCanvasElement,
    samplingRate: number
  ) {
    this.operator = operator;
    this.phaseGraph = new PhaseGraph(phaseGraphElement, operator);
    this.waveformGraph = new WaveformGraph(waveformGraphElement, samplingRate);

    this.phaseGraph.draw();
    this.waveformGraph.draw();
  }

  moveFrameForward(): void {
    this.phaseGraph.update();
    this.waveformGraph.data.add(this.operator.output.value);
    this.waveformGraph.update();
  }

}

class MeterUI {

  meterElement: HTMLMeterElement;

  constructor(meterElement: HTMLMeterElement) {
    this.meterElement = meterElement;
  }

  get value(): number {
    return this.meterElement.value;
  }

  set value(newValue: number) {
    this.meterElement.value = newValue;
  }

}

class AngularVelocityMeterUI implements Syncable {

  phase: Phase;
  phaseValues: number[];
  meterUI: MeterUI;

  constructor(phase: Phase, meterElement: HTMLMeterElement) {
    this.phase = phase;
    this.phaseValues = [phase.output.value, phase.output.value];
    this.meterUI = new MeterUI(meterElement);
  }

  moveFrameForward(): void {
    this.phaseValues.pop();
    this.phaseValues.splice(0, 0, this.phase.output.value);
    let newValue = this.phaseValues[0] - this.phaseValues[1];
    if (this.phase.isLooped) {
      newValue += 1.0;
    }
    this.meterUI.value = newValue;
  }

}

// Script

const visualFMSynthValue = new FMSynthValue(
  120, 
  0.5, 
  1
);

const modulatorValue = new OperatorValue(
  'modulatorVolume',
  1,
  'modulatorRatio',
  1
);

const audioEngine = new AudioEngine();

const visualFMSynth = new FMSynth(
  visualFMSynthValue.samplingRate,
  visualFMSynthValue.waveFrequency,
  visualFMSynthValue.outputVolume
);

const modulatorVolumeInputUI = new RangeInputUI(
  <HTMLInputElement>document.getElementById('modulator-volume-input'),
  <HTMLLabelElement>document.getElementById('modulator-volume-value-label'),
  modulatorValue.volumeUIValue
)

const modulatorRatioInputUI = new RangeInputUI(
  <HTMLInputElement>document.getElementById('modulator-ratio-input'),
  <HTMLLabelElement>document.getElementById('modulator-ratio-value-label'),
  modulatorValue.ratioUIValue
)

const modulatorUI = new OperatorUI(
  visualFMSynth.modulator,
  <HTMLCanvasElement>document.getElementById('modulator-phase-graph'),
  <HTMLCanvasElement>document.getElementById('modulator-waveform-graph'),
  visualFMSynthValue.samplingRate
)

const carrierAngularVelocityMeter = new AngularVelocityMeterUI(
  visualFMSynth.carrier.phase,
  <HTMLMeterElement>document.getElementById('carrier-angular-velocity-meter')
);

const carrierUI = new OperatorUI(
  visualFMSynth.carrier,
  <HTMLCanvasElement>document.getElementById('carrier-phase-graph'),
  <HTMLCanvasElement>document.getElementById('carrier-waveform-graph'),
  visualFMSynthValue.samplingRate
);

function moveFrameForward() {
  let frameUpdateQueue: Syncable[] = [visualFMSynth, modulatorUI, carrierAngularVelocityMeter, carrierUI];
  frameUpdateQueue.forEach(syncable => {
    syncable.moveFrameForward();
  });
}

function setUp() {
  function setModulatorVolume() {
    modulatorValue.volumeUIValue = modulatorVolumeInputUI.value;

    visualFMSynth.modulator.volume = modulatorValue.volumeValue;
    if (audioEngine.isRunning) {
      audioEngine.setParameterValue(
        modulatorValue.volumeParameterName,
        modulatorValue.volumeValue
      );
    }
  }

  function setModulatorRatio() {
    modulatorValue.ratioUIValue = modulatorRatioInputUI.value;

    visualFMSynth.modulator.ratio = modulatorValue.ratioValue;
    if (audioEngine.isRunning) {
      audioEngine.setParameterValue(
        modulatorValue.ratioParameterName,
        modulatorValue.ratioValue
      );
    }
  }

  setModulatorVolume();
  setModulatorRatio();

  document.getElementById('start-audio-button')?.addEventListener('click', function() {
    if (!audioEngine.isRunning) {
      audioEngine.start(modulatorValue);
    }
  });
  document.getElementById('stop-audio-button')?.addEventListener('click', function() {
    if (audioEngine.isRunning) {
      audioEngine.stop();
    }
  });

  modulatorVolumeInputUI.addEventListener(function() {
    setModulatorVolume();
  });
  modulatorRatioInputUI.addEventListener(function() {
    setModulatorRatio();
  });

  const oneSecond_ms = 1_000;
  let intervalId = setInterval(moveFrameForward, oneSecond_ms / visualFMSynthValue.samplingRate);

}

setUp();
