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

test('`MasterPhase.output`の参照渡しによる出力信号の伝達', () => {
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
  while (phase <= 1) {
    phase += waveFrequency / samplingRate;
    masterPhase.moveFrameForward();
  }
  phase %= 1;

  expect(masterPhase.output.value).toBe(phase);
});
