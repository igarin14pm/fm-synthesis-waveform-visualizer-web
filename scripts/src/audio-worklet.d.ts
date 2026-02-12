// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

/**
 * `AudioWorkletNode`上でカスタム`AudioParam`を作成するときに使用します
 */
interface AudioParamDescriptor {

  /**
   * `AudioParam`の名前を表す文字列
   */
  name: string;

  /**
   * `AudioParam`の初期値
   */
  defaultValue?: number;

  /**
   * `AudioParam`の最小値
   */
  minValue?: number;

  /**
   * `AudioParam`の最大値
   */
  maxValue?: number;

  /**
   * `AudioParam`の自動化レートを表す`'a-rate'`・`'k-rate'`文字列のいずれか
   */
  automationRate?: 'a-rate' | 'k-rate';
}

/**
 * `AudioWorkletNode`が用いる独自の音声処理コードを表します
 */
declare class AudioWorkletProcessor {

  /**
   * `AudioWorkletNode`との双方向通信に用いる`MessagePort`を返します
   */
  readonly port: MessagePort;

  /**
   * 音声処理アルゴリズムを表します
   * @param inputs ノードに接続されている入力の配列 `inputs[n][m][i]`は`n`番目の入力の`m`番目のチャンネルの`i`番目のサンプルにアクセスします
   * @param outputs 出力の配列 `process()`実行時に値を入力してください
   * @param parameters `ParameterDescriptor`で定義した`AudioParam`オブジェクトについて、`name`がkey、値が`Float32Array`となります
   * @returns 出力を継続するときに`true`、継続しないときに`false`
   */
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

/**
 * `AudioWorkletProcessor`から派生したクラスを指定の`name`で登録します
 * @param name 登録する名前を表す文字列
 * @param processorCtor 登録する`AudioWorkletProcessor`から派生したクラスのコンストラクタ
 */
declare function registerProcessor(
  name: string,
  processorCtor: new (options?: any) => AudioWorkletProcessor
): void;

/**
 * サンプルレートの値
 */
declare var sampleRate: number;

/**
 * 処理中の音声ブロックの時刻を表す数値
 */
declare var currentTime: number;

/**
 * 複数の`AudioParam`のセット
 */
interface AudioParamMap extends ReadonlyMap<string, AudioParam> { }
