// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

import * as assertionModule from '../../../src/modules/assertion';
import * as fmSynthModule from '../../../src/modules/fm-synth';
import * as uiComponentModule from '../../../src/modules/ui-component';

function getHTMLButtonElementByIdOrThrow(id: string): HTMLButtonElement {
  const element: Element | null = document.querySelector(`#${id}`);
  assertionModule.assertIsHTMLButtonElement(element);
  return element;
}

function getHTMLCanvasElementByIdOrThrow(id: string): HTMLCanvasElement {
  const element: Element | null = document.querySelector(`#${id}`);
  assertionModule.assertIsHTMLCanvasElement(element);
  return element;
}

function getHTMLInputElementByIdOrThrow(id: string): HTMLInputElement {
  const element: Element | null = document.querySelector(`#${id}`);
  assertionModule.assertIsHTMLInputElement(element);
  return element;
}

function getHTMLLabelElementByIdOrThrow(id: string): HTMLLabelElement {
  const element: Element | null = document.querySelector(`#${id}`);
  assertionModule.assertIsHTMLLabelElement(element);
  return element;
}

// -------- `RangeInputComponent` --------

const rangeInputCompnentInnerHtml = 
  '<table>' +
  '  <tr>' +
  '    <td>' +
  '      <input type="range" id="modulator-volume-input" name="modulator-volume-input" min="0" max="100" />' +
  '    </td>' +
  '    <td>' +
  '      <label id="modulator-volume-value-label" for="modulator-volume-input"></label>' +
  '    </td>' +
  '  </tr>' +
  '  <tr>' +
  '    <td>' +
  '      <input type="range" id="modulator-ratio-input" name="modulator-ratio-input" min="1" max="10" />' +
  '    </td>' +
  '    <td>' +
  '      <label id="modulator-ratio-value-label" for="modulator-ratio-input"></label>' +
  '    </td>' +
  '  </tr>' +
  '</table>';

test('`RangeInputComponent`コンストラクタ', () => {
  document.body.innerHTML = rangeInputCompnentInnerHtml;
  const modulatorVolumeInputElement: HTMLInputElement = getHTMLInputElementByIdOrThrow('modulator-volume-input');
  const modulatorVolumeValueLabelElement: HTMLLabelElement = getHTMLLabelElementByIdOrThrow('modulator-volume-value-label');
  const modulatorRatioInputElement: HTMLInputElement = getHTMLInputElementByIdOrThrow('modulator-ratio-input');
  const modulatorRatioValueLabelElement: HTMLLabelElement = getHTMLLabelElementByIdOrThrow('modulator-ratio-value-label');

  const modulatorVolumeInputComponent = new uiComponentModule.RangeInputComponent(
    modulatorVolumeInputElement,
    modulatorVolumeValueLabelElement,
    100
  );
  const modulatorRatioInputComponent = new uiComponentModule.RangeInputComponent(
    modulatorRatioInputElement,
    modulatorRatioValueLabelElement,
    1
  );

  expect(modulatorVolumeInputComponent.inputElement).toBe(modulatorVolumeInputElement);
  expect(modulatorVolumeInputComponent.valueLabelElement).toBe(modulatorVolumeValueLabelElement);
  expect(modulatorVolumeInputComponent.inputElement.value).toBe('100');
  expect(modulatorVolumeInputComponent.valueLabelElement.textContent).toBe('100');
  expect(modulatorRatioInputComponent.inputElement).toBe(modulatorRatioInputElement);
  expect(modulatorRatioInputComponent.valueLabelElement).toBe(modulatorRatioValueLabelElement);
  expect(modulatorRatioInputComponent.inputElement.value).toBe('1');
  expect(modulatorRatioInputComponent.valueLabelElement.textContent).toBe('1');
});

test('`RangeInputComponent.value`', () => {
  document.body.innerHTML = rangeInputCompnentInnerHtml;
  const modulatorVolumeInputComponent = new uiComponentModule.RangeInputComponent(
    getHTMLInputElementByIdOrThrow('modulator-volume-input'),
    getHTMLLabelElementByIdOrThrow('modulator-volume-value-label'),
    100
  );
  const modulatorRatioInputComponent = new uiComponentModule.RangeInputComponent(
    getHTMLInputElementByIdOrThrow('modulator-ratio-input'),
    getHTMLLabelElementByIdOrThrow('modulator-ratio-value-label'),
    1
  );
  
  modulatorVolumeInputComponent.inputElement.value = '25';
  modulatorRatioInputComponent.inputElement.value = '5';

  expect(modulatorVolumeInputComponent.value).toBe(25);
  expect(modulatorRatioInputComponent.value).toBe(5);
});

// 実装未定: `RangeInputComponent.addEventListener()`

// -------- `GraphComponent` --------

const graphComponentInnerHtml =
  '<canvas id="graph1" width="100" height="100"></canvas>' +
  '<canvas id="graph2" width="200" height="200"></canvas>';

class GraphComponentInpl extends uiComponentModule.GraphComponent {

  constructor(element: HTMLCanvasElement) {
    super(element);
  }

  override draw(): void { }

}

test('`GraphComponent.width`', () => {
  document.body.innerHTML = graphComponentInnerHtml;
  const graphComponent1 = new GraphComponentInpl(
    getHTMLCanvasElementByIdOrThrow('graph1')
  );
  const graphComponent2 = new GraphComponentInpl(
    getHTMLCanvasElementByIdOrThrow('graph2')
  );

  const width1: number = graphComponent1.width;
  const width2: number = graphComponent2.width;

  expect(width1).toBe(100);
  expect(width2).toBe(200);
});

test('`GraphComponent.height`', () => {
  document.body.innerHTML = graphComponentInnerHtml;
  const graphComponent1 = new GraphComponentInpl(
    getHTMLCanvasElementByIdOrThrow('graph1')
  );
  const graphComponent2 = new GraphComponentInpl(
    getHTMLCanvasElementByIdOrThrow('graph2')
  );

  const height1: number = graphComponent1.height;
  const height2: number = graphComponent2.height;

  expect(height1).toBe(100);
  expect(height2).toBe(200);
});

test('`GraphComponent.convertToCoordinateY()`', () => {
  document.body.innerHTML = graphComponentInnerHtml;
  const graphComponent1 = new GraphComponentInpl(
    getHTMLCanvasElementByIdOrThrow('graph1')
  );
  const graphComponent2 = new GraphComponentInpl(
    getHTMLCanvasElementByIdOrThrow('graph2')
  );

  const oneToCoordinateY1: number = graphComponent1.convertToCoordinateY(1);
  const zeroToCoordinateY1: number = graphComponent1.convertToCoordinateY(0);
  const minusOneToCoordinateY1: number = graphComponent1.convertToCoordinateY(-1);
  const oneToCoordinateY2: number = graphComponent2.convertToCoordinateY(1);
  const zeroToCoordinateY2: number = graphComponent2.convertToCoordinateY(0);
  const minusOneToCoordinateY2: number = graphComponent2.convertToCoordinateY(-1)

  expect(oneToCoordinateY1).toBe(10);
  expect(zeroToCoordinateY1).toBe(50);
  expect(minusOneToCoordinateY1).toBe(90);
  expect(oneToCoordinateY2).toBe(10);
  expect(zeroToCoordinateY2).toBe(100);
  expect(minusOneToCoordinateY2).toBe(190);
});

// 実装未定: `GraphComponent.clear()`

// 実装未定: `GraphComponent.update()`

// -------- `PhaseGraphComponent` --------

const phaseGraphComponentInnerHtml = 
  '<div class="graph">' +
  '  <canvas id="modulator-phase-graph" width="516" height="340"></canvas>' +
  '</div>' +
  '<div class="graph">' +
  '  <canvas id="carrier-phase-graph" width="258" height="170"></canvas>' +
  '</div>'

test('`PhaseGraphComponent`コンストラクタ', () => {
  document.body.innerHTML = phaseGraphComponentInnerHtml;
  const modulatorPhaseGraphElement: HTMLCanvasElement = getHTMLCanvasElementByIdOrThrow('modulator-phase-graph');
  const modulator = new fmSynthModule.Operator(1, 1, new fmSynthModule.Signal(0), null);
  const carrierPhaseGraphElement: HTMLCanvasElement = getHTMLCanvasElementByIdOrThrow('carrier-phase-graph');
  const carrier = new fmSynthModule.Operator(0.5, 2, new fmSynthModule.Signal(0), modulator.output);

  const modulatorPhaseGraphComponent = new uiComponentModule.PhaseGraphComponent(
    modulatorPhaseGraphElement,
    modulator
  );
  const carrierPhaseGraphComponent = new uiComponentModule.PhaseGraphComponent(
    carrierPhaseGraphElement,
    carrier
  );

  expect(modulatorPhaseGraphComponent.element).toBe(modulatorPhaseGraphElement);
  expect(modulatorPhaseGraphComponent.operator).toBe(modulator);
  expect(carrierPhaseGraphComponent.element).toBe(carrierPhaseGraphElement);
  expect(carrierPhaseGraphComponent.operator).toBe(carrier);
});

// 実装未定: `PhaseGraphComponent.drawModulatedAmount()`

// 実装未定: `PhaseGraphComponent.drawSineWave()`

// 実装未定: `PhaseGraphComponent.drawPhaseLine()`

// 実装未定: `PhaseGraphComponent.drawOutputLine()`

// 実装未定: `PhaseGraphComponent.drawValueCircle()`

// 実装未定: `PhaseGraphComponent.draw()`

// -------- `OutputGraphComponent` --------

const outputGraphComponentInnerHtml = 
  '<div class="graph">' +
  '  <canvas id="modulator-output-graph" width="100" height="340"></canvas>' +
  '</div>' +
  '<div class="graph">' +
  '  <canvas id="carrier-output-graph" width="50" height="170"></canvas>' +
  '</div>';

test('`OutputGraphComponent`コンストラクタ', () => {
  document.body.innerHTML = outputGraphComponentInnerHtml;
  const modulatorOutputGraphElement: HTMLCanvasElement = getHTMLCanvasElementByIdOrThrow('modulator-output-graph');
  const modulator = new fmSynthModule.Operator(1, 2, new fmSynthModule.Signal(0), null);
  const carrierOutputGraphElement: HTMLCanvasElement = getHTMLCanvasElementByIdOrThrow('carrier-output-graph');
  const carrier = new fmSynthModule.Operator(0.25, 1, new fmSynthModule.Signal(0), modulator.output);

  const modulatorOutputGraphComponent = new uiComponentModule.OutputGraphComponent(
    modulatorOutputGraphElement,
    modulator,
    true
  );
  const carrierOutputGraphComponent = new uiComponentModule.OutputGraphComponent(
    carrierOutputGraphElement,
    carrier,
    false
  );

  expect(modulatorOutputGraphComponent.element).toBe(modulatorOutputGraphElement);
  expect(modulatorOutputGraphComponent.operator).toBe(modulator);
  expect(modulatorOutputGraphComponent.showsModulatingAmount).toBe(true);
  expect(carrierOutputGraphComponent.element).toBe(carrierOutputGraphElement);
  expect(carrierOutputGraphComponent.operator).toBe(carrier);
  expect(carrierOutputGraphComponent.showsModulatingAmount).toBe(false);
});

// 実装未定: `OutputGraphComponent.drawModulatingAmount()`

// 実装未定: `OutputGraphComponent.drawOutputLine()`

// 実装未定: `OutputGraphComponent.draw()`

// -------- `WaveformGraphComponent` --------

const waveformGraphComponentInnerHtml =
  '<div class="graph">' +
  '  <canvas id="modulator-waveform-graph" width="1032" height="340"></canvas>' +
  '</div>' +
  '<div class="graph">' +
  '  <canvas id="carrier-waveform-graph" width="516" height="170"></canvas>' +
  '</div>';

test('`WaveformGraphComponent`コンストラクタ', () => {
  document.body.innerHTML = waveformGraphComponentInnerHtml;
  const modulatorWaveformGraphElement: HTMLCanvasElement = getHTMLCanvasElementByIdOrThrow('modulator-waveform-graph');
  const carrierWaveformGraphElement: HTMLCanvasElement = getHTMLCanvasElementByIdOrThrow('carrier-waveform-graph');

  const modulatorWaveformGraphComponent = new uiComponentModule.WaveformGraphComponent(
    modulatorWaveformGraphElement,
    120
  );
  const carrierWaveformGraphComponent = new uiComponentModule.WaveformGraphComponent(
    carrierWaveformGraphElement,
    240
  );

  expect(modulatorWaveformGraphComponent.element).toBe(modulatorWaveformGraphElement);
  expect(modulatorWaveformGraphComponent.values).toHaveLength(481);
  expect(modulatorWaveformGraphComponent.values.every((value) => value === 0)).toBe(true);
  expect(carrierWaveformGraphComponent.element).toBe(carrierWaveformGraphElement);
  expect(carrierWaveformGraphComponent.values).toHaveLength(961);
  expect(carrierWaveformGraphComponent.values.every((value) => value === 0)).toBe(true);
});

test('`WaveformGraphElement.addValue`', () => {
  document.body.innerHTML = waveformGraphComponentInnerHtml;
  const modulatorWaveformGraphElement: HTMLCanvasElement = getHTMLCanvasElementByIdOrThrow('modulator-waveform-graph');
  const carrierWaveformGraphElement: HTMLCanvasElement = getHTMLCanvasElementByIdOrThrow('carrier-waveform-graph');

  const modulatorWaveformGraphComponent = new uiComponentModule.WaveformGraphComponent(
    modulatorWaveformGraphElement,
    120
  );
  const carrierWaveformGraphComponent = new uiComponentModule.WaveformGraphComponent(
    carrierWaveformGraphElement,
    240
  );

  modulatorWaveformGraphComponent.addValue(0.1);
  carrierWaveformGraphComponent.addValue(-0.1);

  expect(modulatorWaveformGraphComponent.values).toHaveLength(481);
  expect(carrierWaveformGraphComponent.values).toHaveLength(961);
  expect(modulatorWaveformGraphComponent.values[0]).toBe(0.1);
  expect(carrierWaveformGraphComponent.values[0]).toBe(-0.1);

  modulatorWaveformGraphComponent.addValue(0.2);
  carrierWaveformGraphComponent.addValue(-0.2);

  expect(modulatorWaveformGraphComponent.values).toHaveLength(481);
  expect(carrierWaveformGraphComponent.values).toHaveLength(961);
  expect(modulatorWaveformGraphComponent.values[0]).toBe(0.2);
  expect(modulatorWaveformGraphComponent.values[1]).toBe(0.1);
  expect(carrierWaveformGraphComponent.values[0]).toBe(-0.2);
  expect(carrierWaveformGraphComponent.values[1]).toBe(-0.1);
});

// 実装未定: `WaveformGraphElement.drawWaveform()`

// 実装未定: `WaveformGraphElement.drawBorderLeft()`

// 実装未定: `WaveformGraphElement.draw()`

// -------- `ButtonComponent` --------

const buttonComponentInnerHtml = 
  '<button id="button1">ボタン1</button>' +
  '<button id="button2">ボタン2</button>';

test('`ButtonComponent`コンストラクタ', () => {
  document.body.innerHTML = buttonComponentInnerHtml;
  const buttonElement1: HTMLButtonElement = getHTMLButtonElementByIdOrThrow('button1');
  const buttonElement2: HTMLButtonElement = getHTMLButtonElementByIdOrThrow('button2');

  const buttonComponent1 = new uiComponentModule.ButtonComponent(buttonElement1);
  const buttonComponent2 = new uiComponentModule.ButtonComponent(buttonElement2);

  expect(buttonComponent1.element).toBe(buttonElement1);
  expect(buttonComponent2.element).toBe(buttonElement2);
});

// 実装未定: `ButtonComponent.addClickEventListener`

// -------- `AudioButtonComponent` --------

const audioButtonComponentInnerHtml =
  '<button id="start-audio-button" class="green-button">音声を再生する</button>' +
  '<button id="stop-audio-button" class="red-button">音声を停止する</button>'

test('`AudioButtonComponent`コンストラクタ', () => {
  document.body.innerHTML = audioButtonComponentInnerHtml;
  const startAudioButtonElement: HTMLButtonElement = getHTMLButtonElementByIdOrThrow('start-audio-button');
  const stopAudioButtonElement: HTMLButtonElement = getHTMLButtonElementByIdOrThrow('stop-audio-button');

  const startAudioButtonComponent = new uiComponentModule.AudioButtonComponent(startAudioButtonElement);
  const stopAudioButtonComponent = new uiComponentModule.AudioButtonComponent(stopAudioButtonElement);

  expect(startAudioButtonComponent.element).toBe(startAudioButtonElement);
  expect(stopAudioButtonComponent.element).toBe(stopAudioButtonElement);
});

test('`AudioButtonComponent.hide()`', () => {
  const startAudioButtonComponent = new uiComponentModule.AudioButtonComponent(
    getHTMLButtonElementByIdOrThrow('start-audio-button')
  );
  const stopAudioButtonComponent = new uiComponentModule.AudioButtonComponent(
    getHTMLButtonElementByIdOrThrow('stop-audio-button')
  );
  startAudioButtonComponent.element.style.display = 'block';
  stopAudioButtonComponent.element.style.display = 'block';

  startAudioButtonComponent.hide();
  stopAudioButtonComponent.hide();

  expect(startAudioButtonComponent.element.style.display).toBe('none');
  expect(stopAudioButtonComponent.element.style.display).toBe('none');
});

test('`AudioButtonComponent.show()`', () => {
  const startAudioButtonComponent = new uiComponentModule.AudioButtonComponent(
    getHTMLButtonElementByIdOrThrow('start-audio-button')
  );
  const stopAudioButtonComponent = new uiComponentModule.AudioButtonComponent(
    getHTMLButtonElementByIdOrThrow('stop-audio-button')
  );
  startAudioButtonComponent.element.style.display = 'none';
  stopAudioButtonComponent.element.style.display = 'none';

  startAudioButtonComponent.show();
  stopAudioButtonComponent.show();

  expect(startAudioButtonComponent.element.style.display).toBe('block');
  expect(stopAudioButtonComponent.element.style.display).toBe('block');
});
