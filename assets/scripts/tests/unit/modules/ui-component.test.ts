// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

import * as assertionModule from '../../../src/modules/assertion';
import * as uiComponentModule from '../../../src/modules/ui-component';

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
