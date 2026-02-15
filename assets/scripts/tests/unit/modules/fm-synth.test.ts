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

  masterPhase1.moveFrameForward();
  masterPhase2.moveFrameForward();

  expect(output1.value).toBe(440 / 48000);
  expect(output2.value).toBe(0.5 / 120);
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

  masterPhaseSignal1.value = 0.1;
  masterPhaseSignal2.value = 0.2

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
  
  masterPhase1.moveFrameForward();
  masterPhase2.moveFrameForward();
  phase1.moveFrameForward();
  phase2.moveFrameForward();

  expect(output1.value).toBe(440 / 48000);
  expect(output2.value).toBe(0.5 / 120 + 0.5 * 0.25);
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

  expect(result1).toBe(0.4 + 0.1 * 0.25);
  expect(result2).toBe(0.5 + (-0.2) * 0.25);
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

  expect(result1).toBe(0.9 + 0.8 * 0.25 - 1);
  expect(result2).toBe(0.95 + 8 * 0.25 - 2);
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

  expect(result1).toBe(0.1 + (-0.8) * 0.25 + 1);
  expect(result2).toBe(0.05 + (-8) * 0.25 + 2);
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
