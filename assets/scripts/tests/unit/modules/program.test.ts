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
