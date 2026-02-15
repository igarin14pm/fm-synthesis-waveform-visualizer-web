import * as fmSynthCode from '../../../src/modules/fm-synth';

// -------- Signal --------

test('`Signal`コンストラクタ', () => {
  const signal = new fmSynthCode.Signal(0.5);

  expect(signal.value).toBe(0.5);
});

test('`Signal.clippedValue`: `Signal.value`が-1より小さい場合`', () => {
  const signal = new fmSynthCode.Signal(-2);

  expect(signal.clippedValue).toBe(-1);
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
  const signal = new fmSynthCode.Signal(2);

  expect(signal.clippedValue).toBe(1);
});

// -------- MasterPhase --------

test('`MasterPhase`コンストラクタ', () => {
  const masterPhase = new fmSynthCode.MasterPhase(48000, 440);

  expect(masterPhase.samplingRate).toBe(48000);
  expect(masterPhase.waveFrequency).toBe(440);
});

test('`MasterPhase.output`の参照渡しによる`Signal.value`の伝達', () => {
  const masterPhase = new fmSynthCode.MasterPhase(48000, 440);
  const output: fmSynthCode.Signal = masterPhase.output;

  masterPhase.moveFrameForward();

  expect(output.value).toBe(masterPhase.output.value);
});

test('`MasterPhase.moveFrameForward()`: 1フレーム進めた場合', () => {
  const masterPhase = new fmSynthCode.MasterPhase(48000, 440);
  
  masterPhase.moveFrameForward();

  expect(masterPhase.output.value).toBe(440 / 48000);
});

test('`MasterPhase.moveFrameForward()`: 位相が一周した場合に位相が1の剰余の値になっているか', () => {
  const masterPhase = new fmSynthCode.MasterPhase(48000, 440);

  let phase = 0;
  for (let i = 0; i < Math.ceil(48000 / 440); i++) {
    phase += 440 / 48000;
    masterPhase.moveFrameForward();
  }
  phase %= 1;

  expect(masterPhase.output.value).toBe(phase);
});

// -------- Phase --------

test('`Phase`コンストラクタ', () => {
  const masterPhaseSignal = new fmSynthCode.Signal(0.5);
  const modulatorSignal = new fmSynthCode.Signal(0);

  const phase = new fmSynthCode.Phase(masterPhaseSignal, 1, modulatorSignal);

  expect(phase.input).toBe(masterPhaseSignal);
  expect(phase.operatorRatio).toBe(1);
  expect(phase.modulatorSignal).toBe(modulatorSignal);
});

test('`Phase.input`: 参照渡しによる`Signal.value`の伝達', () => {
  const masterPhaseSignal = new fmSynthCode.Signal(0);
  const phase = new fmSynthCode.Phase(masterPhaseSignal, 1, null);

  masterPhaseSignal.value = 0.5;

  expect(phase.input.value).toBe(masterPhaseSignal.value);
});

test('`Phase.isLooped`: `Phase.moveFrameForward()`が一度も呼ばれていないとき', () => {
  const masterPhase = new fmSynthCode.MasterPhase(48000, 440);
  const phase = new fmSynthCode.Phase(masterPhase.output, 1, null);

  expect(phase.isLooped).toBe(false);
});

test('`Phase.isLooped`: `Phase.moveFrameForward()`が呼ばれたが位相が一周していないとき', () => {
  const masterPhase = new fmSynthCode.MasterPhase(48000, 440); // 一度の`moveFrameForward()`呼び出しで位相が一周しないことが自明
  const phase = new fmSynthCode.Phase(masterPhase.output, 1, null);
  const syncableModules: fmSynthCode.Syncable[] = [masterPhase, phase];
  
  syncableModules.forEach((syncable) => {
    syncable.moveFrameForward();
  });

  expect(phase.isLooped).toBe(false);
});

test('`Phase.isLooped`: 位相が一周したとき', () => {
  const masterPhase = new fmSynthCode.MasterPhase(48000, 440);
  const phase = new fmSynthCode.Phase(masterPhase.output, 1, null);
  const syncableModules: fmSynthCode.Syncable[] = [masterPhase, phase];

  for (let i = 0; i < Math.ceil(48000 / 440); i++) {
    syncableModules.forEach((syncable) => {
      syncable.moveFrameForward()
    });
  }

  expect(phase.isLooped).toBe(true);
});

test('`Phase.output`: 参照渡しによる`Signal.value`の伝達', () => {
  const masterPhase = new fmSynthCode.MasterPhase(48000, 440);
  const phase = new fmSynthCode.Phase(masterPhase.output, 1, null);
  const syncableModules: fmSynthCode.Syncable[] = [masterPhase, phase];

  const output: fmSynthCode.Signal = phase.output;
  syncableModules.forEach((syncable) => {
    syncable.moveFrameForward();
  });

  expect(output.value).toBe(phase.output.value);
});

test('`Phase.modulationValue`: `Phase.modulatorSignal == null`の場合', () => {
  const phase = new fmSynthCode.Phase(new fmSynthCode.Signal(0), 1, null);

  expect(phase.modulationValue).toBe(0);
})

test('`Phase.modulationValue`: `Phase.modulatorSignal != null`の場合', () => {
  const modulatorSignal = new fmSynthCode.Signal(0.5);
  const phase = new fmSynthCode.Phase(new fmSynthCode.Signal(0), 1, modulatorSignal);

  expect(phase.modulationValue).toBe(modulatorSignal.value * 0.25);
});

test('`Phase.process()`: `Phase.modulatorSignal == null`の場合', () => {
  const phase = new fmSynthCode.Phase(new fmSynthCode.Signal(0), 1, null);
  phase.valuesWithoutMod[0] = 0.25;

  const result: number = phase.process()

  expect(result).toBe(0.25);
});

test('`Phase.process()`: `Phase.modulatorSignal != null`の場合', () => {
  const modulatorSignal = new fmSynthCode.Signal(0.3);
  const phase = new fmSynthCode.Phase(new fmSynthCode.Signal(0), 1, modulatorSignal);
  phase.valuesWithoutMod[0] = 0.4;

  const result: number = phase.process()

  expect(result).toBe(0.4 + 0.3 * 0.25);
});

test('`Phase.process()`: `Phase.valuesWithoutMod[0] + Phase.modulationValue > 1`の場合', () => {
  const modulatorSignal = new fmSynthCode.Signal(0.8);
  const phase = new fmSynthCode.Phase(new fmSynthCode.Signal(0), 1, modulatorSignal);
  phase.valuesWithoutMod[0] = 0.9;
  
  const result: number = phase.process();

  expect(result).toBe(0.9 + 0.8 * 0.25 - 1);
});

test('`Phase.process()`: `Phase.valuesWithoutMod[0] + Phase.modulationValue < -1`の場合', () => {
  const modulatorSignal = new fmSynthCode.Signal(-0.8);
  const phase = new fmSynthCode.Phase(new fmSynthCode.Signal(0), 1, modulatorSignal);
  phase.valuesWithoutMod[0] = 0.1;

  const result: number = phase.process();

  expect(result).toBe(0.1 + (-0.8) * 0.25 + 1);
});

test('`Phase.moveFrameForward()`: `Phase.valuesWithoutMod`の長さが変化しない', () => {
  const phase = new fmSynthCode.Phase(new fmSynthCode.Signal(0), 1, null);

  phase.moveFrameForward();

  expect(phase.valuesWithoutMod.length).toBe(2);
});

test('`Phase.moveFrameForward()`: `Phase.valuesWithoutMod`の値が後ろに1つずつずれ動く', () => {
  const masterPhase = new fmSynthCode.MasterPhase(48000, 440);
  const phase = new fmSynthCode.Phase(masterPhase.output, 1, null);
  const syncableModules: fmSynthCode.Syncable[] = [masterPhase, phase];
  syncableModules.forEach((syncable) => {
    syncable.moveFrameForward();
  });

  const valuesWithoutMod0: number = phase.valuesWithoutMod[0];
  syncableModules.forEach((syncable) => {
    syncable.moveFrameForward();
  });

  expect(phase.valuesWithoutMod[1]).toBe(valuesWithoutMod0);
});

test('`Phase.moveFrameForward()`: `Phase.OperatorRatio`が正しく計算に含まれるか', () => {
  const masterPhase = new fmSynthCode.MasterPhase(48000, 440);
  const phase1 = new fmSynthCode.Phase(masterPhase.output, 1, null);
  const phase2 = new fmSynthCode.Phase(masterPhase.output, 2, null);
  const syncableModules: fmSynthCode.Syncable[] = [masterPhase, phase1, phase2];

  syncableModules.forEach((syncable) => {
    syncable.moveFrameForward();
  });

  expect(phase2.valuesWithoutMod[0]).toBe(phase1.valuesWithoutMod[0] * 2);

});

test('`Phase.moveFrameForward()`: 位相が一周した場合', () => {
  const masterPhase = new fmSynthCode.MasterPhase(48000, 440);
  const phase = new fmSynthCode.Phase(masterPhase.output, 2, null);
  const syncableModules: fmSynthCode.Syncable[] = [masterPhase, phase];

  for (let i = 0; i < Math.ceil(48000 / (440 * 2)); i++) {
    syncableModules.forEach((syncable) => {
      syncable.moveFrameForward();
    });
  }

  expect(phase.valuesWithoutMod[0]).toBeLessThan(phase.valuesWithoutMod[1]);
});
