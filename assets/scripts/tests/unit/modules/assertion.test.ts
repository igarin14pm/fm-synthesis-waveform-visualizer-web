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
  assertIsHTMLSelectElement,
  InvalidHtmlElementError
} from '../../../src/modules/assertion';

// -------- `InvalidHtmlElementError` --------

test('`InvalidHtmlElementError`コンストラクタ', () => {
  const invalidHtmlElementError1 = new InvalidHtmlElementError('HTMLButtonElement is not HTMLCanvasElement');
  const invalidHtmlElementError2 = new InvalidHtmlElementError('null is not HTMLInputElement');

  expect(invalidHtmlElementError1.name).toBe('InvalidHtmlElementError');
  expect(invalidHtmlElementError1.message).toBe('HTMLButtonElement is not HTMLCanvasElement');
  expect(invalidHtmlElementError2.name).toBe('InvalidHtmlElementError');
  expect(invalidHtmlElementError2.message).toBe('null is not HTMLInputElement');
});

// -------- `assertIsHTMLButtonElement()` --------

test('`assertIsHTMLButtonElement()`: アサーション成功', () => {
  document.body.innerHTML =
    '<button id="start-audio-button">音声を再生する</button>' +
    '<button id="stop-audio-button">音声を停止する</button>';
  const startAudioButtonElement: Element | null = document.querySelector('#start-audio-button');
  const stopAudioButtonElement: Element | null = document.querySelector('#stop-audio-button');

  expect(() => {
    assertIsHTMLButtonElement(startAudioButtonElement);
  }).not.toThrow();
  expect(() => {
    assertIsHTMLButtonElement(stopAudioButtonElement);
  }).not.toThrow();
});

test('`assertIsHTMLButtonElement()`: アサーション失敗', () => {
  document.body.innerHTML =
    '<canvas id="modulator-phase-graph"></canvas>' +
    '<button id="start-audio-button">音声を再生する</button>';
  const wrongElement: Element | null = document.querySelector('#modulator-phase-graph');
  const wrongId: Element | null = document.querySelector('#staart-audio-button');

  expect(() => {
    assertIsHTMLButtonElement(wrongElement);
  }).toThrow(new InvalidHtmlElementError('[object HTMLCanvasElement] is not HTMLButtonElement'));
  expect(() => {
    assertIsHTMLButtonElement(wrongId);
  }).toThrow(new InvalidHtmlElementError('null is not HTMLButtonElement'));
});

// -------- `assertIsHTMLCanvasElement()` --------

test('`assertIsHTMLCanvasElement()`: アサーション成功', () => {
  document.body.innerHTML =
    '<canvas id="modulator-phase-graph"></canvas>' +
    '<canvas id="modulator-waveform-graph"></canvas>';
  const modulatorPhaseGraphElement: Element | null = document.querySelector('#modulator-phase-graph');
  const modulatorWaveformGraphElement: Element | null = document.querySelector('#modulator-waveform-graph');

  expect(() => {
    assertIsHTMLCanvasElement(modulatorPhaseGraphElement);
  }).not.toThrow();
  expect(() => {
    assertIsHTMLCanvasElement(modulatorWaveformGraphElement);
  }).not.toThrow();
});

test('`assertIsHTMLCanvasElement()`: アサーション失敗', () => {
  document.body.innerHTML =
    '<button id="start-audio-button">音声を再生する</button>' +
    '<canvas id="modulator-phase-graph"></canvas>';
  const wrongElement: Element | null = document.querySelector('#start-audio-button');
  const wrongId: Element | null = document.querySelector('#modulatorr-phase-graph');

  expect(() => {
    assertIsHTMLCanvasElement(wrongElement);
  }).toThrow(new InvalidHtmlElementError('[object HTMLButtonElement] is not HTMLCanvasElement'));
  expect(() => {
    assertIsHTMLCanvasElement(wrongId);
  }).toThrow(new InvalidHtmlElementError('null is not HTMLCanvasElement'));
});

// -------- `assertIsHTMLDivElement()` --------

test('`assertIsHTMLDivElement()`: アサーション成功', () => {
  document.body.innerHTML =
    '<div id="carrier-and-modulator-mode">' +
    '  <p>Carrier and Modulator Mode</p>' +
    '</div>' +
    '<div id="feedback-mode">' +
    '  <p>Feedback Mode</p>' +
    '</div>';
  const carrierAndModulatorModeDivElement: Element | null = document.querySelector('#carrier-and-modulator-mode');
  const feedbackModeDivElement: Element | null = document.querySelector('#feedback-mode');

  expect(() => {
    assertIsHTMLDivElement(carrierAndModulatorModeDivElement);
  }).not.toThrow();
  expect(() => {
    assertIsHTMLDivElement(feedbackModeDivElement);
  }).not.toThrow();
});

test('`assertIsHTMLDivElement()`: アサーション失敗', () => {
  document.body.innerHTML =
    '<button id="start-audio-button">音声を再生する</button>' +
    '<div id="feedback-mode">' +
    '  <p>Feedback Mode</p>' +
    '</div>';

  const wrongElement: Element | null = document.querySelector('#start-audio-button');
  const wrongId: Element | null = document.querySelector('#feeedback-mode');

  expect(() => {
    assertIsHTMLDivElement(wrongElement);
  }).toThrow(new InvalidHtmlElementError('[object HTMLButtonElement] is not HTMLDivElement'));
  expect(() => {
    assertIsHTMLDivElement(wrongId);
  }).toThrow(new InvalidHtmlElementError('null is not HTMLDivElement'));
});

// -------- `assertIsHTMLInputElement()` --------

test('`assertIsHTMLInputElement()`: アサーション成功', () => {
  document.body.innerHTML =
    '<input type="range" id="modulator-volume-input" name="modulator-volume-input" min="0" max="100" />' +
    '<input type="range" id="modulator-ratio-input" name="modulator-ratio-input" min="1" max="10" />';
  const modulatorVolumeInputElement: Element | null = document.querySelector('#modulator-volume-input');
  const modulatorRatioInputElement: Element | null = document.querySelector('#modulator-ratio-input');

  expect(() => {
    assertIsHTMLInputElement(modulatorVolumeInputElement);
  }).not.toThrow();
  expect(() => {
    assertIsHTMLInputElement(modulatorRatioInputElement);
  }).not.toThrow();
});

test('`assertIsHTMLInputElement()`: アサーション失敗', () => {
  document.body.innerHTML =
    '<label id="modulator-volume-value-label" for="modulator-volume-input"></label>' +
    '<input type="range" id="modulator-volume-input" name="modulator-volume-input" min="0" max="100" />';
  const wrongElement: Element | null = document.querySelector('#modulator-volume-value-label');
  const wrongId: Element | null = document.querySelector('#modulatorr-volume-input');

  expect(() => {
    assertIsHTMLInputElement(wrongElement);
  }).toThrow(new InvalidHtmlElementError('[object HTMLLabelElement] is not HTMLInputElement'));
  expect(() => {
    assertIsHTMLInputElement(wrongId);
  }).toThrow(new InvalidHtmlElementError('null is not HTMLInputElement'));
});

// -------- `assertIsHTMLLabelElement()` --------

test('`assertIsHTMLLabelElement()`: アサーション成功', () => {
  document.body.innerHTML =
    '<label id="modulator-volume-value-label" for="modulator-volume-input"></label>' +
    '<label id="modulator-ratio-value-label" for="modulator-ratio-input"></label>';
  const modulatorVolumeValueLabelElement: Element | null = document.querySelector('#modulator-volume-value-label');
  const modulatorRatioValueLabelElement: Element | null = document.querySelector('#modulator-ratio-value-label');

  expect(() => {
    assertIsHTMLLabelElement(modulatorVolumeValueLabelElement);
  }).not.toThrow();
  expect(() => {
    assertIsHTMLLabelElement(modulatorRatioValueLabelElement);
  }).not.toThrow();
});

test('`assertIsHTMLLabelElement()`: アサーション失敗', () => {
  document.body.innerHTML =
    '<input type="range" id="modulator-volume-input" name="modulator-volume-input" min="0" max="100" />' +
    '<label id="modulator-volume-value-label" for="modulator-volume-input"></label>';
  const wrongElement: Element | null = document.querySelector('#modulator-volume-input');
  const wrongId: Element | null = document.querySelector('#moddulator-volume-value-label');

  expect(() => {
    assertIsHTMLLabelElement(wrongElement);
  }).toThrow(new InvalidHtmlElementError('[object HTMLInputElement] is not HTMLLabelElement'));
  expect(() => {
    assertIsHTMLLabelElement(wrongId);
  }).toThrow(new InvalidHtmlElementError('null is not HTMLLabelElement'));
});

// -------- `assertIsHTMLSelectElement` --------

test('`assertIsHTMLSelectElement()`: アサーション成功', () => {
  document.body.innerHTML =
    '<select id="select1">' +
    '  <option value="value-a">Value A</option>' +
    '  <option value="value-b">Value B</option>' +
    '</select>' +
    '<select id="synthesis-mode-select">' +
    '  <option value="carrier-and-modulator">Carrier and Modulator</option>' +
    '  <option value="feedback">Feedback</option>' +
    '</select>';
  const selectElement1: Element | null = document.querySelector('#select1');
  const synthesisModeSelect: Element | null = document.querySelector('#synthesis-mode-select');

  expect(() => {
    assertIsHTMLSelectElement(selectElement1);
  }).not.toThrow();
  expect(() => {
    assertIsHTMLSelectElement(synthesisModeSelect);
  }).not.toThrow();
});

test('`assertIsHTMLSelectElement()`: アサーション失敗', () => {
  document.body.innerHTML =
    '<button id="start-audio-button">音声を再生</button>' +
    '<select id="synthesis-mode-select">' +
    '  <option value="carrier-and-modulator">Carrier and Modulator</option>' +
    '  <option value="feedback">Feedback</option>' +
    '</select>';
  const wrongElement: Element | null = document.querySelector('#start-audio-button');
  const wrongId: Element | null = document.querySelector('#synthesis-mmode-select');

  expect(() => {
    assertIsHTMLSelectElement(wrongElement);
  }).toThrow(new InvalidHtmlElementError('[object HTMLButtonElement] is not HTMLSelectElement'));
  expect(() => {
    assertIsHTMLSelectElement(wrongId);
  }).toThrow(new InvalidHtmlElementError('null is not HTMLSelectElement'));
});
