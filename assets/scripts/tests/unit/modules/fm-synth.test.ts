import * as fmSynthCode from '../../../src/modules/fm-synth';

// -------- Signal --------

function getRandomSignalValue(): number {
  return Math.random() * 2 - 1;
}

test('`Signal`コンストラクタ', () => {
  const randomSignalValue: number = getRandomSignalValue();

  const signal = new fmSynthCode.Signal(randomSignalValue);

  expect(signal.value).toBe(randomSignalValue);
});

test('`Signal.clippedValue`: `Signal.value`が-1より小さい場合`', () => {
  const signal = new fmSynthCode.Signal(-2);

  expect(signal.clippedValue).toBe(-1);
});

test('`Signal.clippedValue`: `Signal.value`が-1以上1以下の場合', () => {
  const minimumValue = -1;
  const minimumValueSignal = new fmSynthCode.Signal(minimumValue);

  const randomValue: number = getRandomSignalValue();
  const randomValueSignal = new fmSynthCode.Signal(randomValue);

  const maximumValue = 1;
  const maximumValueSignal = new fmSynthCode.Signal(maximumValue);

  expect(minimumValueSignal.clippedValue).toBe(minimumValue);
  expect(randomValueSignal.clippedValue).toBe(randomValue);
  expect(maximumValueSignal.clippedValue).toBe(maximumValue);
})

test('`Signal.clippedValue`: `Signal.value`が1より大きい場合', () => {
  const signal = new fmSynthCode.Signal(2);

  expect(signal.clippedValue).toBe(1);
});

// -------- MasterPhase --------

test('`MasterPhase`コンストラクタ', () => {
  const samplingRate = 48000;
  const waveFrequency = 440;

  const masterPhase = new fmSynthCode.MasterPhase(samplingRate, waveFrequency);

  expect(masterPhase.samplingRate).toBe(samplingRate);
  expect(masterPhase.waveFrequency).toBe(waveFrequency);
});

test('`MasterPhase.output`の参照渡しによる`Signal.value`の伝達', () => {
  const masterPhase = new fmSynthCode.MasterPhase(48000, 440);
  const output: fmSynthCode.Signal = masterPhase.output;

  masterPhase.moveFrameForward();

  expect(output.value).toBe(masterPhase.output.value);
});

test('`MasterPhase.moveFrameForward()`: 1フレーム進めた場合', () => {
  const samplingRate = 48000;
  const waveFrequency = 440;
  const masterPhase = new fmSynthCode.MasterPhase(samplingRate, waveFrequency);
  
  masterPhase.moveFrameForward();

  expect(masterPhase.output.value).toBe(waveFrequency / samplingRate);
});

test('`MasterPhase.moveFrameForward()`: 位相が一周した場合に位相が1の剰余の値になっているか', () => {
  const samplingRate = 48000;
  const waveFrequency = 440;
  const masterPhase = new fmSynthCode.MasterPhase(samplingRate, waveFrequency);

  let phase = 0;
  for (let i = 0; i < Math.ceil(samplingRate / waveFrequency); i++) {
    phase += waveFrequency / samplingRate;
    masterPhase.moveFrameForward();
  }
  phase %= 1;

  expect(masterPhase.output.value).toBe(phase);
});

// -------- Phase --------

test('`Phase`コンストラクタ', () => {
  const masterPhaseSamplingRate = 48000;
  const masterPhaseWaveFrequency = 440;
  const masterPhase = new fmSynthCode.MasterPhase(masterPhaseSamplingRate, masterPhaseWaveFrequency);
  const operatorRatio = 1;
  const modulatorSignal = new fmSynthCode.Signal(0);

  const phase = new fmSynthCode.Phase(masterPhase.output, operatorRatio, modulatorSignal);

  expect(phase.input).toBe(masterPhase.output);
  expect(phase.operatorRatio).toBe(operatorRatio);
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
  const samplingRate = 48000;
  const waveFrequency = 440;
  const masterPhase = new fmSynthCode.MasterPhase(samplingRate, waveFrequency);
  const phase = new fmSynthCode.Phase(masterPhase.output, 1, null);
  const syncableModules: fmSynthCode.Syncable[] = [masterPhase, phase];

  for (let i = 0; i < Math.ceil(samplingRate / waveFrequency); i++) {
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

  expect(result).toBe(phase.valuesWithoutMod[0]);
});

test('`Phase.process()`: `Phase.modulatorSignal != null`の場合', () => {
  const modulatorSignal = new fmSynthCode.Signal(0.25);
  const phase = new fmSynthCode.Phase(new fmSynthCode.Signal(0), 1, modulatorSignal);
  const phaseValue = 0.5
  phase.valuesWithoutMod[0] = phaseValue;

  const result: number = phase.process()

  const modulatorCoefficient = 0.25;
  expect(result).toBe(phaseValue + modulatorSignal.value * modulatorCoefficient);
});

test('`Phase.process()`: `Phase.valuesWithoutMod[0] + Phase.modulationValue > 1`の場合', () => {
  const modulatorSignal = new fmSynthCode.Signal(0.8);
  const phase = new fmSynthCode.Phase(new fmSynthCode.Signal(0), 1, modulatorSignal);
  const phaseValue = 0.9;
  phase.valuesWithoutMod[0] = phaseValue;
  
  const result: number = phase.process();

  const modulatorCoefficient = 0.25;
  expect(result).toBe(phaseValue + modulatorSignal.value * modulatorCoefficient - 1);
});

test('`Phase.process()`: `Phase.valuesWithoutMod[0] + Phase.modulationValue < -1`の場合', () => {
  const modulatorSignal = new fmSynthCode.Signal(-0.8);
  const phase = new fmSynthCode.Phase(new fmSynthCode.Signal(0), 1, modulatorSignal);
  const phaseValue = 0.1;
  phase.valuesWithoutMod[0] = phaseValue;

  const result: number = phase.process();

  const modulatorCoefficient = 0.25;
  expect(result).toBe(phaseValue + modulatorSignal.value * modulatorCoefficient+ 1);
});

test('`Phase.moveFrameForward()`: `Phase.valuesWithoutMod`の長さが変化しない', () => {
  const phase = new fmSynthCode.Phase(new fmSynthCode.Signal(0), 1, null);
  const valuesWithoutModLengthBeforeCall = phase.valuesWithoutMod.length;

  phase.moveFrameForward();

  expect(phase.valuesWithoutMod.length).toBe(valuesWithoutModLengthBeforeCall);
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
  const samplingRate = 48000;
  const waveFrequency = 440;
  const masterPhase = new fmSynthCode.MasterPhase(samplingRate, waveFrequency);
  const operatorRatio = 2;
  const phase = new fmSynthCode.Phase(masterPhase.output, operatorRatio, null);
  const syncableModules: fmSynthCode.Syncable[] = [masterPhase, phase];

  for (let i = 0; i < Math.ceil(samplingRate / (waveFrequency * operatorRatio)); i++) {
    syncableModules.forEach((syncable) => {
      syncable.moveFrameForward();
    });
  }

  expect(phase.valuesWithoutMod[0]).toBeLessThan(phase.valuesWithoutMod[1]);
});
