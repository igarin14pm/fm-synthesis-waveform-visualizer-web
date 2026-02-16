// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

import * as assertionModule from '../../../src/modules/assertion';
import * as fmSynthModule from '../../../src/modules/fm-synth';
import * as uiComponentModule from '../../../src/modules/ui-component';

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
