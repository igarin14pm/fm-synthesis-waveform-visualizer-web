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

abstract class Graph {

  element: HTMLCanvasElement;

  get width(): number {
    return this.element.width;
  }

  get height(): number {
    return this.element.height;
  }

  constructor(element: HTMLCanvasElement) {
    this.element = element
  }

  abstract draw(): void;

  clear(): void {
    let context: CanvasRenderingContext2D = this.element.getContext('2d')!;
    context.clearRect(0, 0, this.width, this.height);
  }

  update(): void {
    this.clear();
    this.draw();
  }

}

class PhaseGraph extends Graph {

  operator: Operator;

  constructor(element: HTMLCanvasElement, operator: Operator) {
    super(element);
    this.operator = operator
  }

  override draw(): void {
    const sineWaveValueLength = 120;
    if (this.element.getContext) {
      // サイン波を描画
      const context: CanvasRenderingContext2D = this.element.getContext('2d')!;
      context.strokeStyle = 'black';
      context.beginPath();
      for (let i: number = 0; i < sineWaveValueLength; i++) {
        const sineWaveValue: number = Math.sin(2 * Math.PI * i / (sineWaveValueLength - 1));

        const sineWaveX: number = this.width * i / (sineWaveValueLength - 1);
        const sineWaveY: number = this.height * (-1 * this.operator.volume * sineWaveValue / 2 + 0.5);

        if (i == 0) {
          context.moveTo(sineWaveX, sineWaveY);
        } else {
          context.lineTo(sineWaveX, sineWaveY);
        }
      }
      context.stroke();

      // 位相を表す線分を描画
      context.strokeStyle = 'green';
      context.beginPath();
      const phaseLineX: number = this.width * this.operator.phase.output.value;
      const phaseLineStartY: number = 0;
      const phaseLineEndY: number = this.height;
      context.moveTo(phaseLineX, phaseLineStartY);
      context.lineTo(phaseLineX, phaseLineEndY);
      context.stroke();

      // 値の出力を表す線分を描画
      context.strokeStyle = 'black';
      context.beginPath();
      const outputLineStartX: number = phaseLineX;
      const outputLineEndX: number = this.width;
      const outputLineY: number = this.height * (-1 * this.operator.output.value / 2 + 0.5);
      context.moveTo(outputLineStartX, outputLineY);
      context.lineTo(outputLineEndX, outputLineY);
      context.stroke();

      // 値を表す円を描画
      context.fillStyle = 'green';
      const valueCircleX: number = phaseLineX;
      const valueCircleY: number = outputLineY;
      const valueCircleRadius: number = 5;
      context.arc(valueCircleX, valueCircleY, valueCircleRadius, 0, 2 * Math.PI);
      context.fill();
    }
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
      let context: CanvasRenderingContext2D = this.element.getContext('2d')!;
      context.beginPath();
      for (const [index, value] of this.data.values.entries()) {
        let x = (index / (this.data.valueLength - 1)) * this.width;
        let y = (-(value) + 1) / 2 * this.height;
        if (index === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.stroke();

    }
  }

  clear() {
    if (this.element.getContext) {
      let context: CanvasRenderingContext2D = this.element.getContext('2d')!;
      context.clearRect(0, 0, this.width, this.height);
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

const modulatorVolumeInputElement = <HTMLInputElement>document.getElementById('modulator-volume-input');
const modulatorVolumeValueLabelElement = <HTMLLabelElement>document.getElementById('modulator-volume-value-label');
const modulatorVolumeInputUI = new RangeInputUI(
  modulatorVolumeInputElement,
  modulatorVolumeValueLabelElement,
  modulatorValue.volumeUIValue
)

const modulatorRatioInputElement = <HTMLInputElement>document.getElementById('modulator-ratio-input');
const modulatorRatioValueLabelElement = <HTMLLabelElement>document.getElementById('modulator-ratio-value-label');
const modulatorRatioInputUI = new RangeInputUI(
  modulatorRatioInputElement,
  modulatorRatioValueLabelElement,
  modulatorValue.ratioUIValue
)

const modulatorPhaseGraphElement = <HTMLCanvasElement>document.getElementById('modulator-phase-graph');
const modulatorWaveformGraphElement = <HTMLCanvasElement>document.getElementById('modulator-waveform-graph');
const modulatorUI = new OperatorUI(
  visualFMSynth.modulator,
  modulatorPhaseGraphElement,
  modulatorWaveformGraphElement,
  visualFMSynthValue.samplingRate
)

const carrierAngularVelocityMeterElement = <HTMLMeterElement>document.getElementById('carrier-angular-velocity-meter');
const carrierAngularVelocityMeter = new AngularVelocityMeterUI(
  visualFMSynth.carrier.phase,
  carrierAngularVelocityMeterElement
);

const carrierPhaseGraphElement = <HTMLCanvasElement>document.getElementById('carrier-phase-graph');
const carrierWaveformGraphElement = <HTMLCanvasElement>document.getElementById('carrier-waveform-graph');
const carrierUI = new OperatorUI(
  visualFMSynth.carrier,
  carrierPhaseGraphElement,
  carrierWaveformGraphElement,
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

  const startAudioButton = <HTMLButtonElement>document.getElementById('start-audio-button');
  startAudioButton.addEventListener('click', function() {
    if (!audioEngine.isRunning) {
      audioEngine.start(modulatorValue);
    }
  });

  const stopAudioButton = <HTMLButtonElement>document.getElementById('stop-audio-button');
  stopAudioButton?.addEventListener('click', function() {
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
