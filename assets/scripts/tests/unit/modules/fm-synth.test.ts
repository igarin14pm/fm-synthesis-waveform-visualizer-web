// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

import * as fmSynthCode from '../../../src/modules/fm-synth';

// -------- Signal --------

test('`Signal`コンストラクタ', () => {
  const signal1 = new fmSynthCode.Signal(0.5);
  const signal2 = new fmSynthCode.Signal(-0.6);

  expect(signal1.value).toBe(0.5);
  expect(signal2.value).toBe(-0.6);
});

test('`Signal.clippedValue`: `Signal.value`が-1より小さい場合`', () => {
  const signal1 = new fmSynthCode.Signal(-2);
  const signal2 = new fmSynthCode.Signal(-100);

  expect(signal1.clippedValue).toBe(-1);
  expect(signal2.clippedValue).toBe(-1);
});

test('`Signal.clippedValue`: `Signal.value`が-1以上1以下の場合', () => {
  const minimumValueSignal = new fmSynthCode.Signal(-1);
  const signal = new fmSynthCode.Signal(0.25);
  const maximumValueSignal = new fmSynthCode.Signal(1);

  expect(minimumValueSignal.clippedValue).toBe(-1);
  expect(signal.clippedValue).toBe(0.25);
  expect(maximumValueSignal.clippedValue).toBe(1);
})

test('`Signal.clippedValue`: `Signal.value`が1より大きい場合', () => {
  const signal1 = new fmSynthCode.Signal(2);
  const signal2 = new fmSynthCode.Signal(100);

  expect(signal1.clippedValue).toBe(1);
  expect(signal2.clippedValue).toBe(1);
});

// -------- MasterPhase --------

test('`MasterPhase`コンストラクタ', () => {
  const masterPhase1 = new fmSynthCode.MasterPhase(48000, 440);
  const masterPhase2 = new fmSynthCode.MasterPhase(120, 0.5);

  expect(masterPhase1.samplingRate).toBe(48000);
  expect(masterPhase1.waveFrequency).toBe(440);
  expect(masterPhase2.samplingRate).toBe(120);
  expect(masterPhase2.waveFrequency).toBe(0.5);
});

test('`MasterPhase.output`の参照渡しによる`Signal.value`の伝達', () => {
  const masterPhase1 = new fmSynthCode.MasterPhase(48000, 440);
  const masterPhase2 = new fmSynthCode.MasterPhase(120, 0.5);
  const output1: fmSynthCode.Signal = masterPhase1.output;
  const output2: fmSynthCode.Signal = masterPhase2.output;

  expect(output1.value).toBe(0);
  expect(output2.value).toBe(0);

  masterPhase1.moveFrameForward();
  masterPhase2.moveFrameForward();

  expect(output1.value).not.toBe(0);
  expect(output2.value).not.toBe(0);
  expect(output1.value).toBe(masterPhase1.output.value);
  expect(output2.value).toBe(masterPhase2.output.value);
});

test('`MasterPhase.moveFrameForward()`: 1フレーム進めた場合', () => {
  const masterPhase1 = new fmSynthCode.MasterPhase(48000, 440);
  const masterPhase2 = new fmSynthCode.MasterPhase(120, 0.5);
  
  expect(masterPhase1.output.value).toBe(0);
  expect(masterPhase2.output.value).toBe(0);

  masterPhase1.moveFrameForward();
  masterPhase2.moveFrameForward();

  expect(masterPhase1.output.value).toBe(440 / 48000);
  expect(masterPhase2.output.value).toBe(0.5 / 120);
});

test('`MasterPhase.moveFrameForward()`: 位相が一周した場合に位相が1の剰余の値になっているか', () => {
  const masterPhase1 = new fmSynthCode.MasterPhase(48000, 440);
  const masterPhase2 = new fmSynthCode.MasterPhase(120, 0.5);

  let expectedValue1 = 0;
  let oldValue1 = 0;
  let newValue1 = 0;
  while (oldValue1 <= newValue1) {
    expectedValue1 += 440 / 48000;
    oldValue1 = masterPhase1.output.value;
    masterPhase1.moveFrameForward();
    newValue1 = masterPhase1.output.value;

    if (oldValue1 == 0 && newValue1 == 0) {
      throw new Error('`MasterPhase` does not output value');
    }
    if (masterPhase1.output.value > 1) {
      throw new Error('`MasterPhase.output.value` must not be greater than 1');
    }
  }
  
  let expectedValue2 = 0;
  let oldValue2 = 0;
  let newValue2 = 0;
  while (oldValue2 <= newValue2) {
    expectedValue2 += 0.5 / 120;
    oldValue2 = masterPhase2.output.value;
    masterPhase2.moveFrameForward();
    newValue2 = masterPhase2.output.value;

    if (oldValue2 == 0 && newValue2 == 0) {
      throw new Error('`MasterPhase` does not output value');
    }
    if (masterPhase2.output.value > 1) {
      throw new Error('`MasterPhase.output.value` must not be greater than 1');
    }
  }

  expect(masterPhase1.output.value).toBe(expectedValue1 - 1);
  expect(masterPhase2.output.value).toBe(expectedValue2 - 1);
});

// -------- Phase --------

test('`Phase`コンストラクタ', () => {
  const masterPhaseSignal1 = new fmSynthCode.Signal(0.1);
  const masterPhaseSignal2 = new fmSynthCode.Signal(0.2);
  const modulatorSignal1 = new fmSynthCode.Signal(0.3);
  const modulatorSignal2 = new fmSynthCode.Signal(-0.4)

  const phase1 = new fmSynthCode.Phase(masterPhaseSignal1, 1, modulatorSignal1);
  const phase2 = new fmSynthCode.Phase(masterPhaseSignal2, 10, modulatorSignal2);
  const noModulatorPhase = new fmSynthCode.Phase(new fmSynthCode.Signal(0.5), 1, null);

  expect(phase1.input).toBe(masterPhaseSignal1);
  expect(phase1.operatorRatio).toBe(1);
  expect(phase1.modulatorSignal).toBe(modulatorSignal1);
  expect(phase2.input).toBe(masterPhaseSignal2);
  expect(phase2.operatorRatio).toBe(10);
  expect(phase2.modulatorSignal).toBe(modulatorSignal2);
  expect(noModulatorPhase.modulatorSignal).toBeNull();
});

test('`Phase.input`: 参照渡しによる`Signal.value`の伝達', () => {
  const masterPhaseSignal1 = new fmSynthCode.Signal(0);
  const phase1 = new fmSynthCode.Phase(masterPhaseSignal1, 1, null);
  const masterPhaseSignal2 = new fmSynthCode.Signal(0);
  const phase2 = new fmSynthCode.Phase(masterPhaseSignal2, 5, new fmSynthCode.Signal(-0.5));

  expect(phase1.input.value).toBe(0);
  expect(phase2.input.value).toBe(0);

  masterPhaseSignal1.value = 0.1;
  masterPhaseSignal2.value = 0.2;

  expect(phase1.input.value).toBe(0.1);
  expect(phase2.input.value).toBe(0.2);
});

test('`Phase.isLooped`: `Phase.moveFrameForward()`が一度も呼ばれていないとき', () => {
  const masterPhase1 = new fmSynthCode.MasterPhase(48000, 440);
  const masterPhase2 = new fmSynthCode.MasterPhase(120, 0.5);
  const phase1 = new fmSynthCode.Phase(masterPhase1.output, 1, null);
  const phase2 = new fmSynthCode.Phase(masterPhase2.output, 10, new fmSynthCode.Signal(-0.5));

  expect(phase1.isLooped).toBe(false);
  expect(phase2.isLooped).toBe(false);
});

test('`Phase.isLooped`: `Phase.moveFrameForward()`が呼ばれたが位相が一周していないとき', () => {
  // 一度の`moveFrameForward()`呼び出しで位相が一周しないことが自明
  const masterPhase1 = new fmSynthCode.MasterPhase(48000, 440);
  const masterPhase2 = new fmSynthCode.MasterPhase(120, 0.5);
  const phase1 = new fmSynthCode.Phase(masterPhase1.output, 1, null);
  const phase2 = new fmSynthCode.Phase(masterPhase2.output, 2, new fmSynthCode.Signal(0.5));

  masterPhase1.moveFrameForward();
  masterPhase2.moveFrameForward();
  phase1.moveFrameForward();
  phase2.moveFrameForward();

  expect(phase1.isLooped).toBe(false);
  expect(phase2.isLooped).toBe(false);
});

test('`Phase.isLooped`: 位相が一周したとき', () => {
  
  const masterPhase1 = new fmSynthCode.MasterPhase(48000, 440);
  const masterPhase2 = new fmSynthCode.MasterPhase(120, 0.5);
  const phase1 = new fmSynthCode.Phase(masterPhase1.output, 1, null);
  const phase2 = new fmSynthCode.Phase(masterPhase2.output, 5, null);

  let oldValue1 = 0;
  let newValue1 = 0;
  while (oldValue1 <= newValue1) {
    oldValue1 = phase1.output.value;
    masterPhase1.moveFrameForward();
    phase1.moveFrameForward();
    newValue1 = phase1.output.value;

    if (oldValue1 == 0 && newValue1 == 0) {
      throw new Error('`Phase` does not output value');
    }
    if (phase1.output.value > 1) {
      throw new Error('`Phase.output.value` must not be greater than 1');
    }
  }

  let oldValue2 = 0;
  let newValue2 = 0;
  while (oldValue2 <= newValue2) {
    oldValue2 = phase2.output.value;
    masterPhase2.moveFrameForward();
    phase2.moveFrameForward();
    newValue2 = phase2.output.value;

    if (oldValue2 == 0 && newValue2 == 0) {
      throw new Error('`Phase` does not output value');
    }
    if (phase2.output.value > 1) {
      throw new Error('`Phase.output.value` must not be greater than 1');
    }
  }
  expect(phase1.isLooped).toBe(true);
  expect(phase2.isLooped).toBe(true);
});

test('`Phase.output`: 参照渡しによる`Signal.value`の伝達', () => {
  const masterPhase1 = new fmSynthCode.MasterPhase(48000, 440);
  const masterPhase2 = new fmSynthCode.MasterPhase(120, 0.5);
  const phase1 = new fmSynthCode.Phase(masterPhase1.output, 1, null);
  const phase2 = new fmSynthCode.Phase(masterPhase2.output, 1, new fmSynthCode.Signal(0.5));
  const output1: fmSynthCode.Signal = phase1.output;
  const output2: fmSynthCode.Signal = phase2.output;

  expect(output1.value).toBe(0);
  expect(output2.value).toBe(0);
  
  masterPhase1.moveFrameForward();
  masterPhase2.moveFrameForward();
  phase1.moveFrameForward();
  phase2.moveFrameForward();

  expect(output1.value).not.toBe(0);
  expect(output2.value).not.toBe(0);
  expect(output1.value).toBe(phase1.output.value);
  expect(output2.value).toBe(phase2.output.value);
});

test('`Phase.modulationValue`: `Phase.modulatorSignal == null`の場合', () => {
  const phase1 = new fmSynthCode.Phase(new fmSynthCode.Signal(0), 1, null);
  const phase2 = new fmSynthCode.Phase(new fmSynthCode.Signal(0.5), 2, null);

  expect(phase1.modulationValue).toBe(0);
  expect(phase2.modulationValue).toBe(0);
})

test('`Phase.modulationValue`: `Phase.modulatorSignal != null`の場合', () => {
  const modulatorSignal1 = new fmSynthCode.Signal(0.3);
  const modulatorSignal2 = new fmSynthCode.Signal(-0.4);
  const phase1 = new fmSynthCode.Phase(new fmSynthCode.Signal(0), 1, modulatorSignal1);
  const phase2 = new fmSynthCode.Phase(new fmSynthCode.Signal(0.8), 2, modulatorSignal2);

  expect(phase1.modulationValue).toBe(0.3 * 0.25);
  expect(phase2.modulationValue).toBe(-0.4 * 0.25);
});

test('`Phase.process()`: `Phase.modulatorSignal == null`の場合', () => {
  const phase1 = new fmSynthCode.Phase(new fmSynthCode.Signal(0), 1, null);
  const phase2 = new fmSynthCode.Phase(new fmSynthCode.Signal(0.5), 2, null);
  phase1.valuesWithoutMod[0] = 0.25;
  phase2.valuesWithoutMod[0] = 0.6;

  const result1: number = phase1.process()
  const result2: number = phase2.process();

  expect(result1).toBe(0.25);
  expect(result2).toBe(0.6);
});

test('`Phase.process()`: `Phase.modulatorSignal != null`の場合', () => {
  const modulatorSignal1 = new fmSynthCode.Signal(0.1);
  const modulatorSignal2 = new fmSynthCode.Signal(-0.2);
  const phase1 = new fmSynthCode.Phase(new fmSynthCode.Signal(0), 1, modulatorSignal1);
  const phase2 = new fmSynthCode.Phase(new fmSynthCode.Signal(0.3), 2, modulatorSignal2);
  phase1.valuesWithoutMod[0] = 0.4;
  phase2.valuesWithoutMod[0] = 0.5;

  const result1: number = phase1.process();
  const result2: number = phase2.process();

  expect(result1).toBeCloseTo(0.4 + 0.1 * 0.25);
  expect(result2).toBeCloseTo(0.5 + (-0.2) * 0.25);
});

test('`Phase.process()`: `Phase.valuesWithoutMod[0] + Phase.modulationValue > 1`の場合', () => {
  const modulatorSignal1 = new fmSynthCode.Signal(0.8);
  const modulatorSignal2 = new fmSynthCode.Signal(8);
  const phase1 = new fmSynthCode.Phase(new fmSynthCode.Signal(0), 1, modulatorSignal1);
  const phase2 = new fmSynthCode.Phase(new fmSynthCode.Signal(0.5), 2, modulatorSignal2);
  phase1.valuesWithoutMod[0] = 0.9;
  phase2.valuesWithoutMod[0] = 0.95;
  
  const result1: number = phase1.process();
  const result2: number = phase2.process();

  expect(result1).toBeCloseTo(0.9 + 0.8 * 0.25 - 1);
  expect(result2).toBeCloseTo(0.95 + 8 * 0.25 - 2);
});

test('`Phase.process()`: `Phase.valuesWithoutMod[0] + Phase.modulationValue < -1`の場合', () => {
  const modulatorSignal1 = new fmSynthCode.Signal(-0.8);
  const modulatorSignal2 = new fmSynthCode.Signal(-8);
  const phase1 = new fmSynthCode.Phase(new fmSynthCode.Signal(0), 1, modulatorSignal1);
  const phase2 = new fmSynthCode.Phase(new fmSynthCode.Signal(0.5), 2, modulatorSignal2);
  phase1.valuesWithoutMod[0] = 0.1;
  phase2.valuesWithoutMod[0] = 0.05;

  const result1: number = phase1.process();
  const result2: number = phase2.process();

  expect(result1).toBeCloseTo(0.1 + (-0.8) * 0.25 + 1);
  expect(result2).toBeCloseTo(0.05 + (-8) * 0.25 + 2);
});

test('`Phase.moveFrameForward()`: `Phase.valuesWithoutMod`の長さが変化しない', () => {
  const phase1 = new fmSynthCode.Phase(new fmSynthCode.Signal(0), 1, null);
  const phase2 = new fmSynthCode.Phase(new fmSynthCode.Signal(0.5), 5, new fmSynthCode.Signal(-0.6));

  expect(phase1.valuesWithoutMod.length).toBe(2);
  expect(phase2.valuesWithoutMod.length).toBe(2);

  phase1.moveFrameForward();
  phase2.moveFrameForward();

  expect(phase1.valuesWithoutMod.length).toBe(2);
  expect(phase2.valuesWithoutMod.length).toBe(2);
});

test('`Phase.moveFrameForward()`: `Phase.valuesWithoutMod`の値が後ろに1つずつずれ動く', () => {
  const masterPhase1 = new fmSynthCode.MasterPhase(48000, 440);
  const masterPhase2 = new fmSynthCode.MasterPhase(120, 0.5);
  const phase1 = new fmSynthCode.Phase(masterPhase1.output, 1, null);
  const phase2 = new fmSynthCode.Phase(masterPhase2.output, 1, new fmSynthCode.Signal(-0.1));

  masterPhase1.moveFrameForward();
  masterPhase2.moveFrameForward();
  phase1.moveFrameForward();
  phase2.moveFrameForward();

  expect(phase1.valuesWithoutMod[0]).toBe(440 / 48000);
  expect(phase1.valuesWithoutMod[1]).not.toBe(440 / 48000);
  expect(phase2.valuesWithoutMod[0]).toBe(0.5 / 120);
  expect(phase2.valuesWithoutMod[1]).not.toBe(0.5 / 120);

  masterPhase1.moveFrameForward();
  masterPhase2.moveFrameForward();
  phase1.moveFrameForward();
  phase2.moveFrameForward();

  expect(phase1.valuesWithoutMod[0]).not.toBe(440 / 48000);
  expect(phase1.valuesWithoutMod[1]).toBe(440 / 48000);
  expect(phase2.valuesWithoutMod[0]).not.toBe(0.5/ 120);
  expect(phase2.valuesWithoutMod[1]).toBe(0.5 / 120);
});

test('`Phase.moveFrameForward()`: `Phase.OperatorRatio`が正しく計算に含まれるか', () => {
  const masterPhase1 = new fmSynthCode.MasterPhase(48000, 440);
  const masterPhase2 = new fmSynthCode.MasterPhase(120, 0.5);
  const phase1 = new fmSynthCode.Phase(masterPhase1.output, 2, null);
  const phase2 = new fmSynthCode.Phase(masterPhase2.output, 3, new fmSynthCode.Signal(0.5));

  masterPhase1.moveFrameForward();
  masterPhase2.moveFrameForward();
  phase1.moveFrameForward();
  phase2.moveFrameForward();

  expect(phase1.valuesWithoutMod[0]).toBe((440 * 2) / 48000);
  expect(phase2.valuesWithoutMod[0]).toBe((0.5 * 3) / 120);
});

test('`Phase.moveFrameForward()`: 位相が一周した場合', () => {
  const masterPhase1 = new fmSynthCode.MasterPhase(48000, 440);
  const masterPhase2 = new fmSynthCode.MasterPhase(120, 0.5);
  const phase1 = new fmSynthCode.Phase(masterPhase1.output, 1, null);
  const phase2 = new fmSynthCode.Phase(masterPhase2.output, 5, new fmSynthCode.Signal(-0.1));

  let i1 = 0;
  let oldValue1 = 0;
  let newValue1 = 0;
  while (oldValue1 <= newValue1) {
    oldValue1 = phase1.valuesWithoutMod[0];
    masterPhase1.moveFrameForward();
    phase1.moveFrameForward();
    i1 += 1;
    newValue1 = phase1.valuesWithoutMod[0];

    if (oldValue1 == 0 && newValue1 == 0) {
      throw new Error('Phase does not output anything');
    }
    if (phase1.valuesWithoutMod[0] > 1) {
      throw new Error('`Phase.valuesWithoutMod[0]` must not be greater than 1');
    }
  }

  let i2 = 0;
  let oldValue2 = 0;
  let newValue2 = 0;
  while (oldValue2 <= newValue2) {
    oldValue2 = phase2.valuesWithoutMod[0];
    masterPhase2.moveFrameForward();
    phase2.moveFrameForward();
    i2 += 1;
    newValue2 = phase2.valuesWithoutMod[0];

    if (oldValue2 == 0 && newValue2 == 0) {
      throw new Error('Phase does not output value');
    }
    if (phase2.valuesWithoutMod[0] > 1) {
      throw new Error('`Phase.valuesWithoutMod[0]` must not be greater than 1');
    }
  }

  expect(phase1.valuesWithoutMod[0]).toBeCloseTo((440 / 48000) * i1 % 1);
  expect(phase2.valuesWithoutMod[0]).toBeCloseTo(((0.5 * 5) / 120) * i2 % 1);
});

// -------- Operator --------

test('`Operator`コンストラクタ', () => {
  const masterPhaseSignal1 = new fmSynthCode.Signal(0);
  const masterPhaseSignal2 = new fmSynthCode.Signal(0.3);
  const modulatorSignal2 = new fmSynthCode.Signal(-0.4);

  const operator1 = new fmSynthCode.Operator(1, 1, masterPhaseSignal1, null);
  const operator2 = new fmSynthCode.Operator(0.1, 2, masterPhaseSignal2, modulatorSignal2);

  expect(operator1.volume).toBe(1);
  expect(operator1.phase.operatorRatio).toBe(1);
  expect(operator1.phase.input).toBe(masterPhaseSignal1);
  expect(operator1.phase.modulatorSignal).toBeNull();
  expect(operator2.volume).toBe(0.1);
  expect(operator2.phase.operatorRatio).toBe(2);
  expect(operator2.phase.input).toBe(masterPhaseSignal2);
  expect(operator2.phase.modulatorSignal).toBe(modulatorSignal2);
});

test('`Operator.ratio`: ゲッタ', () => {
  const operator1 = new fmSynthCode.Operator(1, 4, new fmSynthCode.Signal(0), null);
  const operator2 = new fmSynthCode.Operator(0.5, 5, new fmSynthCode.Signal(0.5), new fmSynthCode.Signal(-0.3));

  const result1: number = operator1.ratio;
  const result2: number = operator2.ratio;

  expect(result1).toBe(4);
  expect(result2).toBe(5)
});

test('`Operator.ratio`: セッタ', () => {
  const operator1 = new fmSynthCode.Operator(1, 1, new fmSynthCode.Signal(0), null);
  const operator2 = new fmSynthCode.Operator(0.5, 2, new fmSynthCode.Signal(0.5), new fmSynthCode.Signal(-0.3));

  operator1.ratio = 8;
  operator2.ratio = 9;

  expect(operator1.phase.operatorRatio).toBe(8);
  expect(operator2.phase.operatorRatio).toBe(9);
});

test('`Operator.output`: 参照渡しによる`value`の伝達', () => {
  const masterPhase1 = new fmSynthCode.MasterPhase(48000, 440);
  const masterPhase2 = new fmSynthCode.MasterPhase(120, 0.5)
  const operator1 = new fmSynthCode.Operator(1, 1, masterPhase1.output, null);
  const operator2 = new fmSynthCode.Operator(0.5, 2, masterPhase2.output, new fmSynthCode.Signal(-0.3));
  const output1: fmSynthCode.Signal = operator1.output;
  const output2: fmSynthCode.Signal = operator2.output;

  expect(output1.value).toBe(0);
  expect(output2.value).toBe(0);

  masterPhase1.moveFrameForward();
  masterPhase2.moveFrameForward();
  operator1.moveFrameForward();
  operator2.moveFrameForward();

  expect(output1.value).not.toBe(0);
  expect(output2.value).not.toBe(0);
  expect(output1.value).toBe(operator1.output.value);
  expect(output2.value).toBe(operator2.output.value);
});

test(`Operator.process()`, () => {
  const operator1 = new fmSynthCode.Operator(1, 1, new fmSynthCode.Signal(0.1), null);
  const operator2 = new fmSynthCode.Operator(0.2, 3, new fmSynthCode.Signal(0.4), new fmSynthCode.Signal(-0.5));

  // TODO: これを呼ばなくてもいいように`FmSynth`, `FmSynthModule`のコンストラクタで
  // `process()`と同じ処理をするようにする
  operator1.moveFrameForward();
  operator2.moveFrameForward();

  const result1: number = operator1.process();
  const result2: number = operator2.process();

  expect(result1).toBeCloseTo(1 * Math.sin(2 * Math.PI * 0.1));
  expect(result2).toBeCloseTo(0.2 * Math.sin(2 * Math.PI * (3 * 0.4 + (-0.5) * 0.25)) % 1);
});

test(`Operator.moveFrameForward()`, () => {
  const masterPhase1 = new fmSynthCode.MasterPhase(48000, 440);
  const masterPhase2 = new fmSynthCode.MasterPhase(120, 0.5);
  const operator1 = new fmSynthCode.Operator(1, 1, masterPhase1.output, null);
  const operator2 = new fmSynthCode.Operator(0.2, 3, masterPhase2.output, new fmSynthCode.Signal(-0.5));
  
  expect(operator1.output.value).toBe(0);
  expect(operator2.output.value).toBe(0);

  masterPhase1.moveFrameForward();
  masterPhase2.moveFrameForward();
  operator1.moveFrameForward();
  operator2.moveFrameForward();

  expect(operator1.output.value).not.toBe(0);
  expect(operator2.output.value).not.toBe(0);
  expect(operator1.output.value).toBe(operator1.process());
  expect(operator2.output.value).toBe(operator2.process());
});

// -------- FmSynth --------

test('`FmSynth`コンストラクタ', () => {
  const fmSynth1 = new fmSynthCode.FmSynth(48000, 440, 0.25);
  const fmSynth2 = new fmSynthCode.FmSynth(120, 0.5, 1);

  expect(fmSynth1.samplingRate).toBe(48000);
  expect(fmSynth1.masterPhase.samplingRate).toBe(48000);
  expect(fmSynth1.waveFrequency).toBe(440);
  expect(fmSynth1.masterPhase.waveFrequency).toBe(440);
  expect(fmSynth1.outputVolume).toBe(0.25);
  expect(fmSynth2.samplingRate).toBe(120);
  expect(fmSynth2.masterPhase.samplingRate).toBe(120);
  expect(fmSynth2.waveFrequency).toBe(0.5);
  expect(fmSynth2.masterPhase.waveFrequency).toBe(0.5);
  expect(fmSynth2.outputVolume).toBe(1);
});

test('`FmSynth.process()`', () => {
  const fmSynth1 = new fmSynthCode.FmSynth(48000, 440, 0.25);
  const fmSynth2 = new fmSynthCode.FmSynth(120, 0.5, 1);

  fmSynth1.moveFrameForward();
  fmSynth2.moveFrameForward();

  expect(fmSynth1.process()).toBeCloseTo(0.25 * Math.sin(2 * Math.PI * ((440 / 48000) + Math.sin(2 * Math.PI * (440 / 48000) * 0.25))));
  expect(fmSynth2.process()).toBeCloseTo(1 * Math.sin(2 * Math.PI * ((0.5 / 120) + Math.sin(2 * Math.PI * (0.5 / 120) * 0.25))))
});

test('`FmSynth.moveFrameForward()`', () => {
  const fmSynth1 = new fmSynthCode.FmSynth(48000, 440, 0.25);
  const fmSynth2 = new fmSynthCode.FmSynth(120, 0.5, 1);

  expect(fmSynth1.masterPhase.output.value).toBe(0);
  expect(fmSynth1.modulator.output.value).toBe(0);
  expect(fmSynth1.carrier.output.value).toBe(0);
  expect(fmSynth1.output.value).toBe(0);
  expect(fmSynth2.masterPhase.output.value).toBe(0);
  expect(fmSynth2.modulator.output.value).toBe(0);
  expect(fmSynth2.carrier.output.value).toBe(0);
  expect(fmSynth2.output.value).toBe(0);

  fmSynth1.moveFrameForward();
  fmSynth2.moveFrameForward();

  expect(fmSynth1.masterPhase.output.value).not.toBe(0);
  expect(fmSynth1.modulator.output.value).not.toBe(0);
  expect(fmSynth1.carrier.output.value).not.toBe(0);
  expect(fmSynth1.masterPhase.output.value).toBeCloseTo(440 / 48000);
  expect(fmSynth1.modulator.output.value).toBe(fmSynth1.modulator.process());
  expect(fmSynth1.carrier.output.value).toBe(fmSynth1.carrier.process());
  expect(fmSynth1.output.value).toBe(fmSynth1.process());
  expect(fmSynth2.masterPhase.output.value).not.toBe(0);
  expect(fmSynth2.modulator.output.value).not.toBe(0);
  expect(fmSynth2.carrier.output.value).not.toBe(0);
  expect(fmSynth2.masterPhase.output.value).toBeCloseTo(0.5 / 120);
  expect(fmSynth2.modulator.output.value).toBe(fmSynth2.modulator.process());
  expect(fmSynth2.carrier.output.value).toBe(fmSynth2.carrier.process());
  expect(fmSynth2.output.value).toBe(fmSynth2.process());
});
