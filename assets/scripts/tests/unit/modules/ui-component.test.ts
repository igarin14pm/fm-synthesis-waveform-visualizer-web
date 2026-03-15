// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

import { expect, test } from 'vitest';
import {
  assertIsHTMLButtonElement,
  assertIsHTMLCanvasElement,
  assertIsHTMLDivElement,
  assertIsHTMLInputElement,
  assertIsHTMLLabelElement,
  assertIsHTMLSelectElement
} from '../../../src/modules/assertion';
import {
  Operator,
  Signal
} from '../../../src/modules/fm-synth';
import {
  ButtonComponent,
  CollapsibleButtonComponent,
  GraphComponent,
  OutputGraphComponent,
  PhaseGraphComponent,
  RangeInputComponent,
  SelectComponent,
  SynthesisModeDivConponent,
  WaveformGraphComponent
} from '../../../src/modules/ui-component';

function getHTMLButtonElementByIdOrThrow(id: string): HTMLButtonElement {
  const element: Element | null = document.querySelector(`#${id}`);
  assertIsHTMLButtonElement(element);
  return element;
}

function getHTMLCanvasElementByIdOrThrow(id: string): HTMLCanvasElement {
  const element: Element | null = document.querySelector(`#${id}`);
  assertIsHTMLCanvasElement(element);
  return element;
}

function getHTMLDivElementByIdOrThrow(id: string): HTMLDivElement {
  const element: Element | null = document.querySelector(`#${id}`);
  assertIsHTMLDivElement(element);
  return element;
}

function getHTMLInputElementByIdOrThrow(id: string): HTMLInputElement {
  const element: Element | null = document.querySelector(`#${id}`);
  assertIsHTMLInputElement(element);
  return element;
}

function getHTMLLabelElementByIdOrThrow(id: string): HTMLLabelElement {
  const element: Element | null = document.querySelector(`#${id}`);
  assertIsHTMLLabelElement(element);
  return element;
}

function getHTMLSelectElementByIdOrThrow(id: string): HTMLSelectElement {
  const element: Element | null = document.querySelector(`#${id}`);
  assertIsHTMLSelectElement(element);
  return element;
}

// -------- `SelectComponent` --------

const selectComponentInnerHtml =
  '<select id="select1">' +
  '  <option value="value-a">Value A</option>' +
  '  <option value="value-b">Value B</option>' +
  '</select>' +
  '<select id="synthesis-mode-select">' +
  '  <option value="carrier-and-modulator">Carrier and Modulator</option>' +
  '  <option value="feedback">Feedback</option>' +
  '</select>';

test('`SelectComponent`コンストラクタ', () => {
  document.body.innerHTML = selectComponentInnerHtml;
  const selectElement1: HTMLSelectElement = getHTMLSelectElementByIdOrThrow('select1');
  const selectElement2: HTMLSelectElement = getHTMLSelectElementByIdOrThrow('synthesis-mode-select');

  const selectComponent1 = new SelectComponent(selectElement1);
  const selectComponent2 = new SelectComponent(selectElement2);

  expect(selectComponent1.element).toBe(selectElement1);
  expect(selectComponent2.element).toBe(selectElement2);
});

test('`SelectComponent.value`', () => {
  document.body.innerHTML = selectComponentInnerHtml;
  const selectElement1: HTMLSelectElement = getHTMLSelectElementByIdOrThrow('select1');
  const selectElement2: HTMLSelectElement = getHTMLSelectElementByIdOrThrow('synthesis-mode-select');
  const selectComponent1 = new SelectComponent(selectElement1);
  const selectComponent2 = new SelectComponent(selectElement2);

  const result1: string = selectComponent1.value;
  const result2: string = selectComponent2.value;

  expect(result1).toBe('value-a');
  expect(result2).toBe('carrier-and-modulator');
});

// 実装未定: `SelectComponent.addChangeEventListener()`

// -------- `SynthesisModeDivComponent` --------

const synthesisModeDivComponentInnerHtml =
  '<div id="carrier-and-modulator-mode">' +
  '  <p>Carrier and Modulator</p>' +
  '</div>' +
  '<div id="feedback-mode">' +
  '  <p>Feedback</p>' +
  '</div>';

test('`SynthesisModeDivComponent`コンストラクタ', () => {
  document.body.innerHTML = synthesisModeDivComponentInnerHtml;
  const divElement1: HTMLDivElement = getHTMLDivElementByIdOrThrow('carrier-and-modulator-mode');
  const divElement2: HTMLDivElement = getHTMLDivElementByIdOrThrow('feedback-mode');

  const synthesisModeDivComponent1 = new SynthesisModeDivConponent(divElement1);
  const synthesisModeDivComponent2 = new SynthesisModeDivConponent(divElement2);

  expect(synthesisModeDivComponent1.element).toBe(divElement1);
  expect(synthesisModeDivComponent2.element).toBe(divElement2);
});

test('`SynthesisModeDivComponent.isCollapsed`: ゲッタ', () => {
  document.body.innerHTML = synthesisModeDivComponentInnerHtml;
  const divElement1: HTMLDivElement = getHTMLDivElementByIdOrThrow('carrier-and-modulator-mode');
  const divElement2: HTMLDivElement = getHTMLDivElementByIdOrThrow('feedback-mode');
  const synthesisModeDivComponent1 = new SynthesisModeDivConponent(divElement1);
  const synthesisModeDivComponent2 = new SynthesisModeDivConponent(divElement2);

  synthesisModeDivComponent1.element.style.display = 'block';
  synthesisModeDivComponent2.element.style.display = 'none';

  expect(synthesisModeDivComponent1.isCollapsed).toBe(false);
  expect(synthesisModeDivComponent2.isCollapsed).toBe(true);
});

test('`SynthesisModeDivComponent.isCollapsed`: セッタ', () => {
  document.body.innerHTML = synthesisModeDivComponentInnerHtml;
  const divElement1: HTMLDivElement = getHTMLDivElementByIdOrThrow('carrier-and-modulator-mode');
  const divElement2: HTMLDivElement = getHTMLDivElementByIdOrThrow('feedback-mode');
  const synthesisModeDivComponent1 = new SynthesisModeDivConponent(divElement1);
  const synthesisModeDivComponent2 = new SynthesisModeDivConponent(divElement2);

  synthesisModeDivComponent1.isCollapsed = true;
  synthesisModeDivComponent2.isCollapsed = false;

  expect(synthesisModeDivComponent1.element.style.display).toBe('none');
  expect(synthesisModeDivComponent2.element.style.display).toBe('block');
});

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

  const modulatorVolumeInputComponent = new RangeInputComponent(
    modulatorVolumeInputElement,
    modulatorVolumeValueLabelElement,
    100
  );
  const modulatorRatioInputComponent = new RangeInputComponent(
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
  const modulatorVolumeInputComponent = new RangeInputComponent(
    getHTMLInputElementByIdOrThrow('modulator-volume-input'),
    getHTMLLabelElementByIdOrThrow('modulator-volume-value-label'),
    100
  );
  const modulatorRatioInputComponent = new RangeInputComponent(
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

class GraphComponentInpl extends GraphComponent {

  constructor(element: HTMLCanvasElement) {
    super(element);
  }

  // eslint-disable-next-line class-methods-use-this, no-empty-function
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
  const minusOneToCoordinateY2: number = graphComponent2.convertToCoordinateY(-1);

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
  '</div>';

test('`PhaseGraphComponent`コンストラクタ', () => {
  document.body.innerHTML = phaseGraphComponentInnerHtml;
  const modulatorPhaseGraphElement: HTMLCanvasElement = getHTMLCanvasElementByIdOrThrow('modulator-phase-graph');
  const modulator = new Operator(1, 1, 1, new Signal(0), null);
  const carrierPhaseGraphElement: HTMLCanvasElement = getHTMLCanvasElementByIdOrThrow('carrier-phase-graph');
  const carrier = new Operator(0.5, 2, 0.3, new Signal(0), modulator.output);

  const modulatorPhaseGraphComponent = new PhaseGraphComponent(
    modulatorPhaseGraphElement,
    modulator
  );
  const carrierPhaseGraphComponent = new PhaseGraphComponent(
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
  const modulator = new Operator(1, 2, 0.3, new Signal(0), null);
  const carrierOutputGraphElement: HTMLCanvasElement = getHTMLCanvasElementByIdOrThrow('carrier-output-graph');
  const carrier = new Operator(0.25, 1, 0.5, new Signal(0), modulator.output);

  const modulatorOutputGraphComponent = new OutputGraphComponent(
    modulatorOutputGraphElement,
    modulator,
    true
  );
  const carrierOutputGraphComponent = new OutputGraphComponent(
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

  const modulatorWaveformGraphComponent = new WaveformGraphComponent(
    modulatorWaveformGraphElement,
    120
  );
  const carrierWaveformGraphComponent = new WaveformGraphComponent(
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

  const modulatorWaveformGraphComponent = new WaveformGraphComponent(
    modulatorWaveformGraphElement,
    120
  );
  const carrierWaveformGraphComponent = new WaveformGraphComponent(
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

  const buttonComponent1 = new ButtonComponent(buttonElement1);
  const buttonComponent2 = new ButtonComponent(buttonElement2);

  expect(buttonComponent1.element).toBe(buttonElement1);
  expect(buttonComponent2.element).toBe(buttonElement2);
});

// 実装未定: `ButtonComponent.addClickEventListener`

// -------- `CollapsibleButtonComponent` --------

const collapsibleButtonComponentInnerHtml =
  '<button id="start-audio-button" class="green-button">音声を再生する</button>' +
  '<button id="stop-audio-button" class="red-button">音声を停止する</button>';

test('`CollapsibleButtonComponent`コンストラクタ', () => {
  document.body.innerHTML = collapsibleButtonComponentInnerHtml;
  const startAudioButtonElement: HTMLButtonElement = getHTMLButtonElementByIdOrThrow('start-audio-button');
  const stopAudioButtonElement: HTMLButtonElement = getHTMLButtonElementByIdOrThrow('stop-audio-button');

  const startAudioButtonComponent = new CollapsibleButtonComponent(startAudioButtonElement);
  const stopAudioButtonComponent = new CollapsibleButtonComponent(stopAudioButtonElement);

  expect(startAudioButtonComponent.element).toBe(startAudioButtonElement);
  expect(stopAudioButtonComponent.element).toBe(stopAudioButtonElement);
});

test('`CollapsibleButtonComponent.isCollapsed`: ゲッタ', () => {
  document.body.innerHTML = collapsibleButtonComponentInnerHtml;
  const startAudioButtonComponent = new CollapsibleButtonComponent(
    getHTMLButtonElementByIdOrThrow('start-audio-button')
  );
  const stopAudioButtonComponent = new CollapsibleButtonComponent(
    getHTMLButtonElementByIdOrThrow('stop-audio-button')
  );

  startAudioButtonComponent.element.style.display = 'block';
  stopAudioButtonComponent.element.style.display = 'none';

  expect(startAudioButtonComponent.isCollapsed).toBe(false);
  expect(stopAudioButtonComponent.isCollapsed).toBe(true);
});

test('`CollapsibleButtonComponent.isCollapsed`: セッタ', () => {
  document.body.innerHTML = collapsibleButtonComponentInnerHtml;
  const startAudioButtonComponent = new CollapsibleButtonComponent(
    getHTMLButtonElementByIdOrThrow('start-audio-button')
  );
  const stopAudioButtonComponent = new CollapsibleButtonComponent(
    getHTMLButtonElementByIdOrThrow('stop-audio-button')
  );

  startAudioButtonComponent.isCollapsed = false;
  stopAudioButtonComponent.isCollapsed = true;

  expect(startAudioButtonComponent.element.style.display).toBe('block');
  expect(stopAudioButtonComponent.element.style.display).toBe('none');
});
