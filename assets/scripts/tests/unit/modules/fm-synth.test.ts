// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

import { expect, test } from 'vitest';
import {
  FmSynth,
  MasterPhase,
  Operator,
  Phase,
  Signal
} from '../../../src/modules/fm-synth';

// -------- `Signal` --------

test('`Signal`コンストラクタ', () => {
  const signal1 = new Signal(0.5);
  const signal2 = new Signal(-0.6);

  expect(signal1.value).toBe(0.5);
  expect(signal2.value).toBe(-0.6);
});

test('`Signal.clippedValue`: `Signal.value`が-1より小さい場合`', () => {
  const signal1 = new Signal(-2);
  const signal2 = new Signal(-100);

  expect(signal1.clippedValue).toBe(-1);
  expect(signal2.clippedValue).toBe(-1);
});

test('`Signal.clippedValue`: `Signal.value`が-1以上1以下の場合', () => {
  const minimumValueSignal = new Signal(-1);
  const signal = new Signal(0.25);
  const maximumValueSignal = new Signal(1);

  expect(minimumValueSignal.clippedValue).toBe(-1);
  expect(signal.clippedValue).toBe(0.25);
  expect(maximumValueSignal.clippedValue).toBe(1);
});

test('`Signal.clippedValue`: `Signal.value`が1より大きい場合', () => {
  const signal1 = new Signal(2);
  const signal2 = new Signal(100);

  expect(signal1.clippedValue).toBe(1);
  expect(signal2.clippedValue).toBe(1);
});

// -------- `MasterPhase` --------

test('`MasterPhase`コンストラクタ', () => {
  const masterPhase1 = new MasterPhase(48000, 440);
  const masterPhase2 = new MasterPhase(120, 0.5);

  expect(masterPhase1.samplingRate).toBe(48000);
  expect(masterPhase1.waveFrequency).toBe(440);
  expect(masterPhase2.samplingRate).toBe(120);
  expect(masterPhase2.waveFrequency).toBe(0.5);
});

test('`MasterPhase.output`の参照渡しによる`Signal.value`の伝達', () => {
  const masterPhase1 = new MasterPhase(48000, 440);
  const masterPhase2 = new MasterPhase(120, 0.5);
  const output1: Signal = masterPhase1.output;
  const output2: Signal = masterPhase2.output;

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
  const masterPhase1 = new MasterPhase(48000, 440);
  const masterPhase2 = new MasterPhase(120, 0.5);
  
  expect(masterPhase1.output.value).toBe(0);
  expect(masterPhase2.output.value).toBe(0);

  masterPhase1.moveFrameForward();
  masterPhase2.moveFrameForward();

  expect(masterPhase1.output.value).toBe(440 / 48000);
  expect(masterPhase2.output.value).toBe(0.5 / 120);
});

test('`MasterPhase.moveFrameForward()`: 位相が一周した場合に位相が1の剰余の値になっているか', () => {
  const masterPhase1 = new MasterPhase(48000, 440);
  const masterPhase2 = new MasterPhase(120, 0.5);

  let expectedValue1 = 0;
  let oldValue1 = 0;
  let newValue1 = 0;
  let count1 = 0;
  while (oldValue1 <= newValue1) {
    expectedValue1 += 440 / 48000;
    oldValue1 = masterPhase1.output.value;
    masterPhase1.moveFrameForward();
    newValue1 = masterPhase1.output.value;
    count1 += 1;

    if (masterPhase1.output.value < 0) {
      throw new Error('`MasterPhase.output.value` must not be less than 0');
    }
    if (oldValue1 === 0 && newValue1 === 0) {
      throw new Error('`MasterPhase` does not output value');
    }
    if (masterPhase1.output.value > 1) {
      throw new Error('`MasterPhase.output.value` must not be greater than 1');
    }
    if (count1 > (48000 / 440) * 2) {
      throw new Error('`MasterPhase.moveFrameForward()` called too many times');
    }
  }
  
  let expectedValue2 = 0;
  let oldValue2 = 0;
  let newValue2 = 0;
  let count2 = 0;
  while (oldValue2 <= newValue2) {
    expectedValue2 += 0.5 / 120;
    oldValue2 = masterPhase2.output.value;
    masterPhase2.moveFrameForward();
    newValue2 = masterPhase2.output.value;
    count2 += 1;

    if (masterPhase2.output.value < 0) {
      throw new Error('`MasterPhase.output.value` must not be less than 0');
    }
    if (oldValue2 === 0 && newValue2 === 0) {
      throw new Error('`MasterPhase` does not output value');
    }
    if (masterPhase2.output.value > 1) {
      throw new Error('`MasterPhase.output.value` must not be greater than 1');
    }
    if (count2 > (120 / 0.5) * 2) {
      throw new Error('`MasterPhase.moveFrameForward()` called too many times');
    }
  }

  expect(masterPhase1.output.value).toBe(expectedValue1 - 1);
  expect(masterPhase2.output.value).toBe(expectedValue2 - 1);
});

// -------- `Phase` --------

test('`Phase`コンストラクタ', () => {
  const masterPhaseSignal1 = new Signal(0.1);
  const masterPhaseSignal2 = new Signal(0.2);
  const modulatorSignal1 = new Signal(0.3);
  const modulatorSignal2 = new Signal(-0.4);
  const feedbackSignal1 = new Signal(0);
  const feedbackSignal2 = new Signal(1);

  const phase1 = new Phase(masterPhaseSignal1, 1, 0, modulatorSignal1, feedbackSignal1);
  const phase2 = new Phase(masterPhaseSignal2, 10, 1, modulatorSignal2, feedbackSignal2);
  const noModulatorPhase = new Phase(new Signal(0.5), 1, 0.5, null, new Signal(0));

  expect(phase1.input).toBe(masterPhaseSignal1);
  expect(phase1.operatorRatio).toBe(1);
  expect(phase1.operatorFeedback).toBe(0);
  expect(phase1.modulatorSignal).toBe(modulatorSignal1);
  expect(phase1.feedbackSignal).toBe(feedbackSignal1);
  expect(phase2.input).toBe(masterPhaseSignal2);
  expect(phase2.operatorRatio).toBe(10);
  expect(phase2.operatorFeedback).toBe(1);
  expect(phase2.modulatorSignal).toBe(modulatorSignal2);
  expect(phase2.feedbackSignal).toBe(feedbackSignal2);
  expect(noModulatorPhase.modulatorSignal).toBeNull();
});

test('`Phase.input`: 参照渡しによる`Signal.value`の伝達', () => {
  const masterPhaseSignal1 = new Signal(0);
  const phase1 = new Phase(masterPhaseSignal1, 1, 0, null, new Signal(0));
  const masterPhaseSignal2 = new Signal(0);
  const phase2 = new Phase(masterPhaseSignal2, 5, 1, new Signal(-0.5), new Signal(1));

  expect(phase1.input.value).toBe(0);
  expect(phase2.input.value).toBe(0);

  masterPhaseSignal1.value = 0.1;
  masterPhaseSignal2.value = 0.2;

  expect(phase1.input.value).toBe(0.1);
  expect(phase2.input.value).toBe(0.2);
});

test('`Phase.output`: 参照渡しによる`Signal.value`の伝達', () => {
  const masterPhase1 = new MasterPhase(48000, 440);
  const masterPhase2 = new MasterPhase(120, 0.5);
  const phase1 = new Phase(masterPhase1.output, 1, 0, null, new Signal(0));
  const phase2 = new Phase(masterPhase2.output, 1, 1, new Signal(0.5), new Signal(0.5));
  const output1: Signal = phase1.output;
  const output2: Signal = phase2.output;

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
  const phase1 = new Phase(new Signal(0), 1, 0, null, new Signal(0));
  const phase2 = new Phase(new Signal(0.5), 2, 1, null, new Signal(0.7));

  expect(phase1.modulationValue).toBe(0);
  expect(phase2.modulationValue).toBe(0);
});

test('`Phase.modulationValue`: `Phase.modulatorSignal != null`の場合', () => {
  const modulatorSignal1 = new Signal(0.3);
  const modulatorSignal2 = new Signal(-0.4);
  const phase1 = new Phase(new Signal(0), 1, 0, modulatorSignal1, new Signal(0.3));
  const phase2 = new Phase(new Signal(0.8), 2, 1, modulatorSignal2, new Signal(0.4));

  expect(phase1.modulationValue).toBe(0.3 * 0.25);
  expect(phase2.modulationValue).toBe(-0.4 * 0.25);
});

test('`Phase.feedbackValue`', () => {
  const phase1 = new Phase(new Signal(0), 1, 0, new Signal(0), new Signal(1));
  const phase2 = new Phase(new Signal(1), 2, 0.5, new Signal(0.2), new Signal(0.2));
  
  const result1 = phase1.feedbackValue;
  const result2 = phase2.feedbackValue;

  expect(result1).toBe(0);
  expect(result2).toBeCloseTo(0.2 * 0.5 * 0.125);
});

test('`Phase.process()`: `Phase.modulatorSignal == null`の場合', () => {
  const phase1 = new Phase(new Signal(0), 1, 0, null, new Signal(0));
  const phase2 = new Phase(new Signal(0.5), 2, 0, null, new Signal(0.5));
  phase1.valueWithoutMod = 0.25;
  phase2.valueWithoutMod = 0.6;

  const result1: number = phase1.process();
  const result2: number = phase2.process();

  expect(result1).toBe(0.25);
  expect(result2).toBe(0.6);
});

test('`Phase.process()`: `Phase.modulatorSignal != null`の場合', () => {
  const modulatorSignal1 = new Signal(0.1);
  const modulatorSignal2 = new Signal(-0.2);
  const phase1 = new Phase(new Signal(0), 1, 0, modulatorSignal1, new Signal(0.2));
  const phase2 = new Phase(new Signal(0.3), 2, 0, modulatorSignal2, new Signal(0.4));
  phase1.valueWithoutMod = 0.4;
  phase2.valueWithoutMod = 0.5;

  const result1: number = phase1.process();
  const result2: number = phase2.process();

  expect(result1).toBeCloseTo(0.4 + 0.1 * 0.25);
  expect(result2).toBeCloseTo(0.5 + (-0.2) * 0.25);
});

test('`Phase.process()`: `Phase.valueWithoutMod + Phase.modulationValue > 1`の場合', () => {
  const modulatorSignal1 = new Signal(0.8);
  const modulatorSignal2 = new Signal(8);
  const phase1 = new Phase(new Signal(0), 1, 0, modulatorSignal1, new Signal(0.2));
  const phase2 = new Phase(new Signal(0.5), 2, 0, modulatorSignal2, new Signal(0.4));
  phase1.valueWithoutMod = 0.9;
  phase2.valueWithoutMod = 0.95;
  
  const result1: number = phase1.process();
  const result2: number = phase2.process();

  expect(result1).toBeCloseTo(0.9 + 0.8 * 0.25 - 1);
  expect(result2).toBeCloseTo(0.95 + 8 * 0.25 - 2);
});

test('`Phase.process()`: `Phase.valueWithoutMod + Phase.modulationValue < -1`の場合', () => {
  const modulatorSignal1 = new Signal(-0.8);
  const modulatorSignal2 = new Signal(-8);
  const phase1 = new Phase(new Signal(0), 1, 0, modulatorSignal1, new Signal(0.6));
  const phase2 = new Phase(new Signal(0.5), 2, 0, modulatorSignal2, new Signal(0.8));
  phase1.valueWithoutMod = 0.1;
  phase2.valueWithoutMod = 0.05;

  const result1: number = phase1.process();
  const result2: number = phase2.process();

  expect(result1).toBeCloseTo(0.1 + (-0.8) * 0.25 + 1);
  expect(result2).toBeCloseTo(0.05 + (-8) * 0.25 + 2);
});

test('`Phase.process()`: フィードバック', () => {
  const phase1 = new Phase(new Signal(0), 1, 1, null, new Signal(1));
  const phase2 = new Phase(new Signal(0.1), 2, 0.3, new Signal(-0.4), new Signal(0.5));
  phase1.valueWithoutMod = 0;
  phase2.valueWithoutMod = 0.6;

  const result1: number = phase1.process();
  const result2: number = phase2.process();

  expect(result1).toBeCloseTo(0 + 0 + 0.125);
  expect(result2).toBeCloseTo(0.6 + (-0.4 * 0.25) + (0.5 * 0.3 * 0.125));
});

test('`Phase.moveFrameForward()`: `Phase.OperatorRatio`が正しく計算に含まれるか', () => {
  const masterPhase1 = new MasterPhase(48000, 440);
  const masterPhase2 = new MasterPhase(120, 0.5);
  const phase1 = new Phase(masterPhase1.output, 2, 0, null, new Signal(0.2));
  const phase2 = new Phase(masterPhase2.output, 3, 0, new Signal(0.5), new Signal(0.4));

  masterPhase1.moveFrameForward();
  masterPhase2.moveFrameForward();
  phase1.moveFrameForward();
  phase2.moveFrameForward();

  expect(phase1.valueWithoutMod).toBe((440 * 2) / 48000);
  expect(phase2.valueWithoutMod).toBe((0.5 * 3) / 120);
});

test('`Phase.moveFrameForward()`: 位相が一周した場合', () => {
  const masterPhase1 = new MasterPhase(48000, 440);
  const masterPhase2 = new MasterPhase(120, 0.5);
  const phase1 = new Phase(masterPhase1.output, 1, 0, null, new Signal(0.6));
  const phase2 = new Phase(masterPhase2.output, 5, 0, new Signal(-0.1), new Signal(0.8));

  let oldValue1 = 0;
  let newValue1 = 0;
  let count1 = 0;
  while (oldValue1 <= newValue1) {
    oldValue1 = phase1.valueWithoutMod;
    masterPhase1.moveFrameForward();
    phase1.moveFrameForward();
    newValue1 = phase1.valueWithoutMod;
    count1 += 1;

    if (phase1.output.value < 0) {
      throw new Error('`Phase.output.value` must not be less than 0');
    }
    if (oldValue1 === 0 && newValue1 === 0) {
      throw new Error('`Phase` does not output anything');
    }
    if (phase1.valueWithoutMod > 1) {
      throw new Error('`Phase.valuesWithoutMod[0]` must not be greater than 1');
    }
    if (count1 > (48000 / 440) * 2) {
      throw new Error('`Phase.moveFrameForward()` called too many times');
    }
  }

  let oldValue2 = 0;
  let newValue2 = 0;
  let count2 = 0;
  while (oldValue2 <= newValue2) {
    oldValue2 = phase2.valueWithoutMod;
    masterPhase2.moveFrameForward();
    phase2.moveFrameForward();
    newValue2 = phase2.valueWithoutMod;
    count2 += 1;

    if (phase2.output.value < 0) {
      throw new Error('`Phase.output.value` must not be less than 0');
    }
    if (oldValue2 === 0 && newValue2 === 0) {
      throw new Error('`Phase` does not output value');
    }
    if (phase2.valueWithoutMod > 1) {
      throw new Error('`Phase.valuesWithoutMod[0]` must not be greater than 1');
    }
    if (count2 > (120 / 0.5) * 2) {
      throw new Error('`Phase.moveFrameForward()` called too many times');
    }
  }

  expect(phase1.valueWithoutMod).toBeCloseTo((440 / 48000) * count1 % 1);
  expect(phase2.valueWithoutMod).toBeCloseTo(((0.5 * 5) / 120) * count2 % 1);
});

// -------- `Operator` --------

test('`Operator`コンストラクタ', () => {
  const masterPhaseSignal1 = new Signal(0);
  const masterPhaseSignal2 = new Signal(0.3);
  const modulatorSignal2 = new Signal(-0.4);

  const operator1 = new Operator(1, 1, 1, masterPhaseSignal1, null);
  const operator2 = new Operator(0.1, 2, 0.3, masterPhaseSignal2, modulatorSignal2);

  expect(operator1.volume).toBe(1);
  expect(operator1.phase.operatorRatio).toBe(1);
  expect(operator1.phase.operatorFeedback).toBe(1);
  expect(operator1.phase.input).toBe(masterPhaseSignal1);
  expect(operator1.phase.modulatorSignal).toBeNull();
  expect(operator2.volume).toBe(0.1);
  expect(operator2.phase.operatorRatio).toBe(2);
  expect(operator2.phase.operatorFeedback).toBe(0.3);
  expect(operator2.phase.input).toBe(masterPhaseSignal2);
  expect(operator2.phase.modulatorSignal).toBe(modulatorSignal2);
});

test('`Operator.ratio`: ゲッタ', () => {
  const operator1 = new Operator(1, 4, 1, new Signal(0), null);
  const operator2 = new Operator(0.5, 5, 0.1, new Signal(0.5), new Signal(-0.3));

  const result1: number = operator1.ratio;
  const result2: number = operator2.ratio;

  expect(result1).toBe(4);
  expect(result2).toBe(5);
});

test('`Operator.ratio`: セッタ', () => {
  const operator1 = new Operator(1, 1, 1, new Signal(0), null);
  const operator2 = new Operator(0.5, 2, 0.2, new Signal(0.5), new Signal(-0.3));

  operator1.ratio = 8;
  operator2.ratio = 9;

  expect(operator1.phase.operatorRatio).toBe(8);
  expect(operator2.phase.operatorRatio).toBe(9);
});

test('`Operator.feedback`: ゲッタ', () => {
  const operator1 = new Operator(1, 1, 1, new Signal(0), null);
  const operator2 = new Operator(0.1, 2, 0.3, new Signal(0.4), new Signal(0.5));

  const result1: number = operator1.phase.operatorFeedback;
  const result2: number = operator2.phase.operatorFeedback;

  expect(result1).toBe(1);
  expect(result2).toBe(0.3);
});

test('`Operator.feedback`: セッタ', () => {
  const operator1 = new Operator(1, 1, 1, new Signal(0), null);
  const operator2 = new Operator(0.1, 2, 0.3, new Signal(0.4), new Signal(0.5));

  operator1.feedback = 0.1;
  operator2.feedback = 0.2;
  
  expect(operator1.phase.operatorFeedback).toBe(0.1);
  expect(operator2.phase.operatorFeedback).toBe(0.2);
});

test('`Operator.output`: 参照渡しによる`value`の伝達', () => {
  const masterPhase1 = new MasterPhase(48000, 440);
  const masterPhase2 = new MasterPhase(120, 0.5);
  const operator1 = new Operator(1, 1, 1, masterPhase1.output, null);
  const operator2 = new Operator(0.5, 2, 0.3, masterPhase2.output, new Signal(-0.3));
  const output1: Signal = operator1.output;
  const output2: Signal = operator2.output;

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
  const operator1 = new Operator(1, 1, 1, new Signal(0.1), null);
  const operator2 = new Operator(0.2, 3, 0.4, new Signal(0.4), new Signal(-0.5));

  // TODO: これを呼ばなくてもいいように`FmSynth`, `FmSynthModule`のコンストラクタで
  // `process()`と同じ処理をするようにする
  operator1.moveFrameForward();
  operator2.moveFrameForward();

  const result1: number = operator1.process();
  const result2: number = operator2.process();

  expect(result1).toBeCloseTo(Math.sin(2 * Math.PI * 0.1));
  expect(result2).toBeCloseTo(0.2 * Math.sin(2 * Math.PI * (3 * 0.4 + (-0.5) * 0.25)) % 1);
});

test(`Operator.moveFrameForward()`, () => {
  const masterPhase1 = new MasterPhase(48000, 440);
  const masterPhase2 = new MasterPhase(120, 0.5);
  const operator1 = new Operator(1, 1, 1, masterPhase1.output, null);
  const operator2 = new Operator(0.2, 3, 0.5, masterPhase2.output, new Signal(-0.5));
  
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

// -------- `FmSynth` --------

test('`FmSynth`コンストラクタ', () => {
  const fmSynth1 = new FmSynth(48000, 440, 0.25);
  const fmSynth2 = new FmSynth(120, 0.5, 1);

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
  const fmSynth1 = new FmSynth(48000, 440, 0.25);
  const fmSynth2 = new FmSynth(120, 0.5, 1);
  fmSynth1.modulator.volume = 1;
  fmSynth2.modulator.volume = 1;

  fmSynth1.moveFrameForward();
  fmSynth2.moveFrameForward();

  expect(fmSynth1.process()).toBeCloseTo(0.25 * Math.sin(2 * Math.PI * ((440 / 48000) + Math.sin(2 * Math.PI * (440 / 48000) * 0.25))));
  expect(fmSynth2.process()).toBeCloseTo(Math.sin(2 * Math.PI * ((0.5 / 120) + Math.sin(2 * Math.PI * (0.5 / 120) * 0.25))));
});

test('`FmSynth.moveFrameForward()`', () => {
  const fmSynth1 = new FmSynth(48000, 440, 0.25);
  const fmSynth2 = new FmSynth(120, 0.5, 1);
  fmSynth1.modulator.volume = 1;
  fmSynth2.modulator.volume = 1;

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
