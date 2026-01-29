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

  async start(modulatorValue: OperatorValue, callback: () => void) {
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

    callback();
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
  verticalPadding: number = 10;

  get width(): number {
    return this.element.width;
  }

  get height(): number {
    return this.element.height;
  }

  constructor(element: HTMLCanvasElement) {
    this.element = element
  }

  convertToCoordinateY(value: number): number {
    return (this.height - this.verticalPadding * 2) * (-1 * value + 1) / 2 + this.verticalPadding;
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
    const context: CanvasRenderingContext2D = this.element.getContext('2d')!;

    // モジュレーション量を描画
    context.fillStyle = '#00cdb944';
    const phaseWithoutModX: number = this.width * this.operator.phase.valuesWithoutMod[0];
    const modRectY: number = 0;
    const modRectWidth: number = this.width * this.operator.phase.modulationValue;
    const modRectHeight: number = this.height;
    if (phaseWithoutModX + modRectWidth > this.width) {
      // 長方形がCanvas要素から右側にはみ出る場合

      // 右端の長方形を描画
      context.fillRect(phaseWithoutModX, modRectY, this.width - phaseWithoutModX, this.height);

      // 左端の長方形を描画
      context.fillRect(0, modRectY, phaseWithoutModX + modRectWidth - this.width, modRectHeight);
      
    } else if (phaseWithoutModX + modRectWidth < 0) {
      // 図形がCanvas要素から左側にはみ出る場合

      // 左端の長方形を描画
      context.fillRect(phaseWithoutModX, modRectY, -1 * phaseWithoutModX, modRectHeight);

      // 右端の長方形を描画
      context.fillRect(this.width, modRectY, phaseWithoutModX + modRectWidth, modRectHeight);

    } else {
      // 長方形がCanvas要素からはみ出ない場合
      context.fillRect(phaseWithoutModX, modRectY, modRectWidth, modRectHeight);
    }

    // サイン波を描画
    context.strokeStyle = '#eeeeee';
    context.lineWidth = 2;
    context.beginPath();
    for (let i: number = 0; i < sineWaveValueLength; i++) {
      const sineWaveValue: number = Math.sin(2 * Math.PI * i / (sineWaveValueLength - 1));

      const sineWaveX: number = this.width * i / (sineWaveValueLength - 1);
      const sineWaveY: number = this.convertToCoordinateY(this.operator.volume * sineWaveValue);

      if (i == 0) {
        context.moveTo(sineWaveX, sineWaveY);
      } else {
        context.lineTo(sineWaveX, sineWaveY);
      }
    }
    context.stroke();

    // 位相を表す線分を描画
    context.strokeStyle = '#00cdb9';
    context.lineWidth = 4;
    context.beginPath();
    const phaseLineX: number = this.width * this.operator.phase.output.value;
    const phaseLineStartY: number = 0;
    const phaseLineEndY: number = this.height;
    context.moveTo(phaseLineX, phaseLineStartY);
    context.lineTo(phaseLineX, phaseLineEndY);
    context.stroke();

    // 値の出力を表す線分を描画
    context.strokeStyle = '#888888';
    context.lineWidth = 1;
    context.beginPath();
    const outputLineStartX: number = phaseLineX;
    const outputLineEndX: number = this.width;
    const outputLineY: number = this.convertToCoordinateY(this.operator.output.value);
    context.moveTo(outputLineStartX, outputLineY);
    context.lineTo(outputLineEndX, outputLineY);
    context.stroke();

    // 値を表す円を描画
    context.fillStyle = '#00cdb9';
    const valueCircleX: number = phaseLineX;
    const valueCircleY: number = outputLineY;
    const valueCircleRadius: number = 7.5;
    context.arc(valueCircleX, valueCircleY, valueCircleRadius, 0, 2 * Math.PI);
    context.fill();
  }

}

class OutputGraph extends Graph {

  operator: Operator;
  showsModulatingAmount: boolean;

  constructor(element: HTMLCanvasElement, operator: Operator, showsModulatingAmout: boolean) {
    super(element);
    this.operator = operator;
    this.showsModulatingAmount = showsModulatingAmout;
  }

  override draw(): void {
    const context: CanvasRenderingContext2D = this.element.getContext('2d')!;

    const outputLineStartX: number = 0;
    const outputLineEndX: number = this.width;
    const outputLineY: number = this.convertToCoordinateY(this.operator.output.value);

    // 変調を掛ける量を表す長方形を描画
    if (this.showsModulatingAmount) {
      const amountRectX: number = this.width / 3;
      const amountRectWidth: number = this.width / 3;


      // 枠線を描画
      const amountRectOutlineY: number = this.verticalPadding;
      const amountRectOutlineHeight: number = this.height - this.verticalPadding * 2;
      context.strokeStyle = '#eeeeee';
      context.lineWidth = 1;
      context.strokeRect(amountRectX, amountRectOutlineY, amountRectWidth, amountRectOutlineHeight);

      // 塗りつぶしを描画
      const amountRectFillY: number = this.height / 2;
      const amountRectFillHeight: number = outputLineY - amountRectFillY;
      context.fillStyle = '#00cdb944';
      context.fillRect(amountRectX, amountRectFillY, amountRectWidth, amountRectFillHeight);
    }

    // 出力を表す線分を描画
    context.strokeStyle = '#888888';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(outputLineStartX, outputLineY);
    context.lineTo(outputLineEndX, outputLineY);
    context.stroke();

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

class WaveformGraph extends Graph {

  data: WaveformGraphData;

  constructor(element: HTMLCanvasElement, samplingRate: number) {
    super(element);
    this.data = new WaveformGraphData(samplingRate);
  }

  override draw(): void {
    let context: CanvasRenderingContext2D = this.element.getContext('2d')!;

    // 波形を描画
    context.strokeStyle = '#eeeeee';
    context.lineWidth = 2;
    context.beginPath();
    for (const [index, value] of this.data.values.entries()) {
      const x = (index / (this.data.valueLength - 1)) * this.width;
      const y = this.convertToCoordinateY(value);
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.stroke();

    // 左端のボーダーの線分を描画
    const borderLineX: number = 1;
    const borderLineStartY: number = 0;
    const borderLineEndY: number = this.height;
    context.strokeStyle = '#888888';
    context.lineWidth = 1;
    context.moveTo(borderLineX, borderLineStartY);
    context.lineTo(borderLineX, borderLineEndY);
    context.stroke();
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
  outputGraph: OutputGraph;
  waveformGraph: WaveformGraph;
  
  constructor(
    operator: Operator,
    phaseGraphElement: HTMLCanvasElement,
    outputGraphElement: HTMLCanvasElement,
    waveformGraphElement: HTMLCanvasElement,
    showsModulatingAmount: boolean,
    samplingRate: number
  ) {
    this.operator = operator;
    this.phaseGraph = new PhaseGraph(phaseGraphElement, operator);
    this.outputGraph = new OutputGraph(outputGraphElement, operator, showsModulatingAmount);
    this.waveformGraph = new WaveformGraph(waveformGraphElement, samplingRate);

    this.phaseGraph.draw();
    this.outputGraph.draw();
    this.waveformGraph.draw();
  }

  moveFrameForward(): void {
    this.phaseGraph.update();
    this.outputGraph.update();
    this.waveformGraph.data.add(this.operator.output.value);
    this.waveformGraph.update();
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
const modulatorOutputGraphElement = <HTMLCanvasElement>document.getElementById('modulator-output-graph');
const modulatorWaveformGraphElement = <HTMLCanvasElement>document.getElementById('modulator-waveform-graph');
const modulatorUI = new OperatorUI(
  visualFMSynth.modulator,
  modulatorPhaseGraphElement,
  modulatorOutputGraphElement,
  modulatorWaveformGraphElement,
  true,
  visualFMSynthValue.samplingRate
)

const carrierPhaseGraphElement = <HTMLCanvasElement>document.getElementById('carrier-phase-graph');
const carrierOutputGraphElement = <HTMLCanvasElement>document.getElementById('carrier-output-graph');
const carrierWaveformGraphElement = <HTMLCanvasElement>document.getElementById('carrier-waveform-graph');
const carrierUI = new OperatorUI(
  visualFMSynth.carrier,
  carrierPhaseGraphElement,
  carrierOutputGraphElement,
  carrierWaveformGraphElement,
  false,
  visualFMSynthValue.samplingRate
);

function moveFrameForward() {
  let frameUpdateQueue: Syncable[] = [visualFMSynth, modulatorUI, carrierUI];
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
  const stopAudioButton = <HTMLButtonElement>document.getElementById('stop-audio-button');

  startAudioButton.addEventListener('click', function() {
    if (!audioEngine.isRunning) {
      audioEngine.start(modulatorValue, () => {
        startAudioButton.style.display = 'none';
        stopAudioButton.style.display = 'block';
      });
    }
  });

  stopAudioButton?.addEventListener('click', function() {
    if (audioEngine.isRunning) {
      audioEngine.stop();
    }
    startAudioButton.style.display = 'block';
    stopAudioButton.style.display = 'none';
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

window.addEventListener('load', () => {
  setUp();
})
