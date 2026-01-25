import { Syncable, FMSynth } from './fm-synth.js';

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
  modulator: OperatorValue;

  constructor(
    samplingRate: number, 
    waveFrequency: number, 
    outputVolume: number,
    modulator: OperatorValue
  ) {
    this._samplingRate = samplingRate;
    this._waveFrequency = waveFrequency;
    this._outputVolume = outputVolume;
    this.modulator = modulator;
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

// UI Classes

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

// Script

const visualFMSynthValue = new FMSynthValue(
  120, 
  0.5, 
  1,
  new OperatorValue(
    'modulatorVolume',
    1,
    'modulatorRatio',
    1
  )
);

let visualFMSynth = new FMSynth(
  visualFMSynthValue.samplingRate,
  visualFMSynthValue.waveFrequency,
  visualFMSynthValue.outputVolume
)

// temporary code
let carrierWaveformGraph = new WaveformGraph(
  <HTMLCanvasElement>document.getElementById('carrier-waveform-graph'),
  visualFMSynthValue.samplingRate
);

function moveFrameForward() {
  let frameUpdateQueue: [Syncable] = [visualFMSynth];
  frameUpdateQueue.forEach(syncable => {
    syncable.moveFrameForward();
  });

  // temporary code
  carrierWaveformGraph.data.add(visualFMSynth.output.value);
  carrierWaveformGraph.update();
}

function setUp() {

  const oneSecond_ms = 1_000;
  let intervalId = setInterval(moveFrameForward, oneSecond_ms / visualFMSynthValue.samplingRate);

}

setUp();