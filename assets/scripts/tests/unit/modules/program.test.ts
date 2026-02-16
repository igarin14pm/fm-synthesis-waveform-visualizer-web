// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

import * as programModule from '../../../src/modules/program';

// -------- `OperatorVolumeParameter` --------

test('`OperatorVolumeParameter`コンストラクタ', () => {
  const operatorVolumeParameter1 = new programModule.OperatorVolumeParameter('modulator-volume', 1);
  const operatorVolumeParameter2 = new programModule.OperatorVolumeParameter('carrier-volume', 0.5);

  expect(operatorVolumeParameter1.name).toBe('modulator-volume');
  expect(operatorVolumeParameter1.value).toBe(1);
  expect(operatorVolumeParameter2.name).toBe('carrier-volume');
  expect(operatorVolumeParameter2.value).toBe(0.5);
});

test('`OperatorVolumeParameter.uiValue`: ゲッタ', () => {
  const operatorVolumeParameter1 = new programModule.OperatorVolumeParameter('modulator-volume', 1);
  const operatorVolumeParameter2 = new programModule.OperatorVolumeParameter('carrier-volume', 0.5);

  expect(operatorVolumeParameter1.uiValue).toBe(100);
  expect(operatorVolumeParameter2.uiValue).toBe(50);
});

test('`OperatorVolumeParameter.uiValue`: セッタ', () => {
  const operatorVolumeParameter1 = new programModule.OperatorVolumeParameter('modulator-volume', 1);
  const operatorVolumeParameter2 = new programModule.OperatorVolumeParameter('carrier-volume', 0.5);

  operatorVolumeParameter1.uiValue = 10;
  operatorVolumeParameter2.uiValue = 20;

  expect(operatorVolumeParameter1.value).toBe(0.1);
  expect(operatorVolumeParameter2.value).toBe(0.2);
});

// -------- `OperatorRatioParameter` --------

test('`OperatorRatioParameter`コンストラクタ', () => {
  const operatorRatioParameter1 = new programModule.OperatorRatioParameter('modulator-ratio', 1);
  const operatorRatioParameter2 = new programModule.OperatorRatioParameter('carrier-ratio', 2);

  expect(operatorRatioParameter1.name).toBe('modulator-ratio');
  expect(operatorRatioParameter1.value).toBe(1);
  expect(operatorRatioParameter2.name).toBe('carrier-ratio');
  expect(operatorRatioParameter2.value).toBe(2);
});

test('`OperatorRatioParameter.uiValue`: ゲッタ', () => {
  const operatorRatioParameter1 = new programModule.OperatorRatioParameter('modulator-ratio', 3);
  const operatorRatioParameter2 = new programModule.OperatorRatioParameter('carrier-ratio', 4);

  expect(operatorRatioParameter1.uiValue).toBe(3);
  expect(operatorRatioParameter2.uiValue).toBe(4);
});

test('`OperatorRatioParameter.uiValue`: セッタ', () => {
  const operatorRatioParameter1 = new programModule.OperatorRatioParameter('modulator-ratio', 5);
  const operatorRatioParameter2 = new programModule.OperatorRatioParameter('carrier-ratio', 6);

  operatorRatioParameter1.uiValue = 7;
  operatorRatioParameter2.uiValue = 8;

  expect(operatorRatioParameter1.value).toBe(7);
  expect(operatorRatioParameter2.value).toBe(8);
});
