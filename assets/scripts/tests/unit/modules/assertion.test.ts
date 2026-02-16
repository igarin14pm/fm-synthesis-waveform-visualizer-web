// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

import * as assertionModule from '../../../src/modules/assertion';

// -------- `InvalidHtmlElementError` --------

test('`InvalidHtmlElementError`コンストラクタ', () => {
  const invalidHtmlElementError1 = new assertionModule.InvalidHtmlElementError('HTMLButtonElement is not HTMLCanvasElement');
  const invalidHtmlElementError2 = new assertionModule.InvalidHtmlElementError('null is not HTMLInputElement');

  expect(invalidHtmlElementError1.name).toBe('InvalidHtmlElementError');
  expect(invalidHtmlElementError1.message).toBe('HTMLButtonElement is not HTMLCanvasElement');
  expect(invalidHtmlElementError2.name).toBe('InvalidHtmlElementError');
  expect(invalidHtmlElementError2.message).toBe('null is not HTMLInputElement');
});

// -------- `assertIsHTMLButtonElement()` --------

test('`assertIsHTMLButtonElement()`: アサーション成功', () => {
  document.body.innerHTML =
    '<button id="start-audio-button">音声を再生する</button>' +
    '<button id="stop-audio-button">音声を停止する</button>'
  const startAudioButtonElement: Element | null = document.querySelector('#start-audio-button');
  const stopAudioButtonElement: Element | null = document.querySelector('#stop-audio-button');

  expect(() => {
    assertionModule.assertIsHTMLButtonElement(startAudioButtonElement);
  }).not.toThrow();
  expect(() => {
    assertionModule.assertIsHTMLButtonElement(stopAudioButtonElement);
  }).not.toThrow();
});

test('`assertIsHTMLButtonElement()`: アサーション失敗', () => {
  document.body.innerHTML =
    '<canvas id="modulator-phase-graph"></canvas>' +
    '<button id="start-audio-button">音声を再生する</button>';
  const wrongElement: Element | null = document.querySelector('#modulator-phase-graph');
  const wrongId: Element | null = document.querySelector('#staart-audio-button');

  expect(() => {
    assertionModule.assertIsHTMLButtonElement(wrongElement);
  }).toThrow(new assertionModule.InvalidHtmlElementError('[object HTMLCanvasElement] is not HTMLButtonElement'));
  expect(() => {
    assertionModule.assertIsHTMLButtonElement(wrongId);
  }).toThrow(new assertionModule.InvalidHtmlElementError('null is not HTMLButtonElement'));
});

// -------- `assertIsHTMLCanvasElement()` --------

test('`assertIsHTMLCanvasElement()`: アサーション成功', () => {
  document.body.innerHTML =
    '<canvas id="modulator-phase-graph"></canvas>' +
    '<canvas id="modulator-waveform-graph"></canvas>';
  const modulatorPhaseGraphElement: Element | null = document.querySelector('#modulator-phase-graph');
  const modulatorWaveformGraphElement: Element | null = document.querySelector('#modulator-waveform-graph');

  expect(() => {
    assertionModule.assertIsHTMLCanvasElement(modulatorPhaseGraphElement);
  }).not.toThrow();
  expect(() => {
    assertionModule.assertIsHTMLCanvasElement(modulatorWaveformGraphElement);
  }).not.toThrow();
});

test('`assertIsHTMLCanvasElement()`: アサーション失敗', () => {
  document.body.innerHTML =
    '<button id="start-audio-button">音声を再生する</button>' +
    '<canvas id="modulator-phase-graph"></canvas>';
  const wrongElement: Element | null = document.querySelector('#start-audio-button');
  const wrongId: Element | null = document.querySelector('#modulatorr-phase-graph');

  expect(() => {
    assertionModule.assertIsHTMLCanvasElement(wrongElement);
  }).toThrow(new assertionModule.InvalidHtmlElementError('[object HTMLButtonElement] is not HTMLCanvasElement'));
  expect(() => {
    assertionModule.assertIsHTMLCanvasElement(wrongId);
  }).toThrow(new assertionModule.InvalidHtmlElementError('null is not HTMLCanvasElement'));
});

// -------- `assertIsHTMLInputElement()` --------

test('`assertIsHTMLInputElement()`: アサーション成功', () => {
  document.body.innerHTML =
    '<input type="range" id="modulator-volume-input" name="modulator-volume-input" min="0" max="100" />' +
    '<input type="range" id="modulator-ratio-input" name="modulator-ratio-input" min="1" max="10" />'
  const modulatorVolumeInputElement: Element | null = document.querySelector('#modulator-volume-input');
  const modulatorRatioInputElement: Element | null = document.querySelector('#modulator-ratio-input');

  expect(() => {
    assertionModule.assertIsHTMLInputElement(modulatorVolumeInputElement);
  }).not.toThrow();
  expect(() => {
    assertionModule.assertIsHTMLInputElement(modulatorRatioInputElement);
  }).not.toThrow();
});

test('`assertIsHTMLInputElement()`: アサーション失敗', () => {
  document.body.innerHTML =
    '<label id="modulator-volume-value-label" for="modulator-volume-input"></label>' +
    '<input type="range" id="modulator-volume-input" name="modulator-volume-input" min="0" max="100" />';
  const wrongElement: Element | null = document.querySelector('#modulator-volume-value-label');
  const wrongId: Element | null = document.querySelector('#modulatorr-volume-input');

  expect(() => {
    assertionModule.assertIsHTMLInputElement(wrongElement);
  }).toThrow(new assertionModule.InvalidHtmlElementError('[object HTMLLabelElement] is not HTMLInputElement'));
  expect(() => {
    assertionModule.assertIsHTMLInputElement(wrongId);
  }).toThrow(new assertionModule.InvalidHtmlElementError('null is not HTMLInputElement'));
});

// -------- `assertIsHTMLLabelElement()` --------

test('`assertIsHTMLLabelElement()`: アサーション成功', () => {
  document.body.innerHTML =
    '<label id="modulator-volume-value-label" for="modulator-volume-input"></label>' +
    '<label id="modulator-ratio-value-label" for="modulator-ratio-input"></label>'
  const modulatorVolumeValueLabelElement: Element | null = document.querySelector('#modulator-volume-value-label');
  const modulatorRatioValueLabelElement: Element | null = document.querySelector('#modulator-ratio-value-label');

  expect(() => {
    assertionModule.assertIsHTMLLabelElement(modulatorVolumeValueLabelElement);
  }).not.toThrow();
  expect(() => {
    assertionModule.assertIsHTMLLabelElement(modulatorRatioValueLabelElement);
  }).not.toThrow();
});

test('`assertIsHTMLLabelElement()`: アサーション失敗', () => {
  document.body.innerHTML =
    '<input type="range" id="modulator-volume-input" name="modulator-volume-input" min="0" max="100" />'
    '<label id="modulator-volume-value-label" for="modulator-volume-input"></label>';
  const wrongElement: Element | null = document.querySelector('#modulator-volume-input');
  const wrongId: Element | null = document.querySelector('#moddulator-volume-value-label');

  expect(() => {
    assertionModule.assertIsHTMLLabelElement(wrongElement)
  }).toThrow(new assertionModule.InvalidHtmlElementError('[object HTMLInputElement] is not HTMLLabelElement'));
  expect(() => {
    assertionModule.assertIsHTMLLabelElement(wrongId)
  }).toThrow(new assertionModule.InvalidHtmlElementError('null is not HTMLLabelElement'));
});
