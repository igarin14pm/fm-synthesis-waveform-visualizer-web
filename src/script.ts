import { Syncable, FMSynth, Operator } from './fm-synth.js';

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

const visualFMSynth = new FMSynth(
  visualFMSynthValue.samplingRate,
  visualFMSynthValue.waveFrequency,
  visualFMSynthValue.outputVolume
);

const modulatorUI = new OperatorUI(
  visualFMSynth.modulator,
  <HTMLCanvasElement>document.getElementById('modulator-phase-graph'),
  <HTMLCanvasElement>document.getElementById('modulator-waveform-graph'),
  visualFMSynthValue.samplingRate
)

const carrierUI = new OperatorUI(
  visualFMSynth.carrier,
  <HTMLCanvasElement>document.getElementById('carrier-phase-graph'),
  <HTMLCanvasElement>document.getElementById('carrier-waveform-graph'),
  visualFMSynthValue.samplingRate
);

function moveFrameForward() {
  let frameUpdateQueue: Syncable[] = [visualFMSynth, modulatorUI, carrierUI];
  frameUpdateQueue.forEach(syncable => {
    syncable.moveFrameForward();
  });
}

function setUp() {

  const oneSecond_ms = 1_000;
  let intervalId = setInterval(moveFrameForward, oneSecond_ms / visualFMSynthValue.samplingRate);

}

setUp();