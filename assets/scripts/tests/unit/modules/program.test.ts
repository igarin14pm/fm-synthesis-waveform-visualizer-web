// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

import { expect, test } from 'vitest';
import {
  FmSynthProgram,
  OperatorFeedbackParameter,
  OperatorProgram,
  OperatorRatioParameter,
  OperatorVolumeParameter
} from '../../../src/modules/program';

// -------- `OperatorVolumeParameter` --------

test('`OperatorVolumeParameter`コンストラクタ', () => {
  const operatorVolumeParameter1 = new OperatorVolumeParameter('modulator-volume', 1);
  const operatorVolumeParameter2 = new OperatorVolumeParameter('carrier-volume', 0.5);

  expect(operatorVolumeParameter1.name).toBe('modulator-volume');
  expect(operatorVolumeParameter1.value).toBe(1);
  expect(operatorVolumeParameter2.name).toBe('carrier-volume');
  expect(operatorVolumeParameter2.value).toBe(0.5);
});

test('`OperatorVolumeParameter.uiValue`: ゲッタ', () => {
  const operatorVolumeParameter1 = new OperatorVolumeParameter('modulator-volume', 1);
  const operatorVolumeParameter2 = new OperatorVolumeParameter('carrier-volume', 0.5);

  expect(operatorVolumeParameter1.uiValue).toBe(100);
  expect(operatorVolumeParameter2.uiValue).toBe(50);
});

test('`OperatorVolumeParameter.uiValue`: セッタ', () => {
  const operatorVolumeParameter1 = new OperatorVolumeParameter('modulator-volume', 1);
  const operatorVolumeParameter2 = new OperatorVolumeParameter('carrier-volume', 0.5);

  operatorVolumeParameter1.uiValue = 10;
  operatorVolumeParameter2.uiValue = 20;

  expect(operatorVolumeParameter1.value).toBe(0.1);
  expect(operatorVolumeParameter2.value).toBe(0.2);
});

// -------- `OperatorRatioParameter` --------

test('`OperatorRatioParameter`コンストラクタ', () => {
  const operatorRatioParameter1 = new OperatorRatioParameter('modulator-ratio', 1);
  const operatorRatioParameter2 = new OperatorRatioParameter('carrier-ratio', 2);

  expect(operatorRatioParameter1.name).toBe('modulator-ratio');
  expect(operatorRatioParameter1.value).toBe(1);
  expect(operatorRatioParameter2.name).toBe('carrier-ratio');
  expect(operatorRatioParameter2.value).toBe(2);
});

test('`OperatorRatioParameter.uiValue`: ゲッタ', () => {
  const operatorRatioParameter1 = new OperatorRatioParameter('modulator-ratio', 3);
  const operatorRatioParameter2 = new OperatorRatioParameter('carrier-ratio', 4);

  expect(operatorRatioParameter1.uiValue).toBe(3);
  expect(operatorRatioParameter2.uiValue).toBe(4);
});

test('`OperatorRatioParameter.uiValue`: セッタ', () => {
  const operatorRatioParameter1 = new OperatorRatioParameter('modulator-ratio', 5);
  const operatorRatioParameter2 = new OperatorRatioParameter('carrier-ratio', 6);

  operatorRatioParameter1.uiValue = 7;
  operatorRatioParameter2.uiValue = 8;

  expect(operatorRatioParameter1.value).toBe(7);
  expect(operatorRatioParameter2.value).toBe(8);
});

// TODO: OperatorFeedbackParameter

// -------- `OperatorProgram` --------

test('`OperatorProgram`コンストラクタ', () => {
  const operator1VolumeParameter = new OperatorVolumeParameter('modulator-volume', 1);
  const operator1RatioParameter = new OperatorRatioParameter('modulator-ratio', 2);
  const operator1FeedbackParameter = new OperatorFeedbackParameter('modulator-feedback', 0.3);
  const operator2VolumeParameter = new OperatorVolumeParameter('carrier-volume', 0.4);
  const operator2RatioParameter = new OperatorRatioParameter('carrier-ratio', 5);
  const operator2FeedbackParameter = new OperatorFeedbackParameter('carrier-feedback', 0.6);

  const operatorProgram1 = new OperatorProgram(operator1VolumeParameter, operator1RatioParameter, operator1FeedbackParameter);
  const operatorProgram2 = new OperatorProgram(operator2VolumeParameter, operator2RatioParameter, operator2FeedbackParameter);

  expect(operatorProgram1.volumeParameter).toBe(operator1VolumeParameter);
  expect(operatorProgram1.ratioParameter).toBe(operator1RatioParameter);
  expect(operatorProgram1.feedbackParameter).toBe(operator1FeedbackParameter);
  expect(operatorProgram2.volumeParameter).toBe(operator2VolumeParameter);
  expect(operatorProgram2.ratioParameter).toBe(operator2RatioParameter);
  expect(operatorProgram2.feedbackParameter).toBe(operator2FeedbackParameter);
});

// -------- `FmSynthProgram` --------

test('`FmSynthProgram`コンストラクタ', () => {
  const fmSynthProgram1 = new FmSynthProgram(48000, 440, 0.25);
  const fmSynthProgram2 = new FmSynthProgram(120, 0.5, 1);

  expect(fmSynthProgram1.samplingRate).toBe(48000);
  expect(fmSynthProgram1.waveFrequency).toBe(440);
  expect(fmSynthProgram1.outputVolume).toBe(0.25);
  expect(fmSynthProgram2.samplingRate).toBe(120);
  expect(fmSynthProgram2.waveFrequency).toBe(0.5);
  expect(fmSynthProgram2.outputVolume).toBe(1);
});
