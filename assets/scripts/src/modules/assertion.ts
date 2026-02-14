// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

/**
 * 取得したHTML要素の型が正しくない時に発生するエラーです。
 */
export class InvalidHtmlElementError extends TypeError {

  /**
   * `InvalidHtmlElementError`のインスタンスを生成します。
   * @param message エラーメッセージ
   */
  constructor(message?: string) {
    super(message);
    this.name = 'InvalidHtmlElementError';
  }

}

/**
 * `element`の型が`HTMLButtonElement`かどうか判定し、そうでない場合は`InvalidHtmlElementError`を投げます。
 * @param element 判定する`document.querySelector()`で取得した要素
 */
export function assertIsHTMLButtonElement(element: Element | null): asserts element is HTMLButtonElement {
  if (!(element instanceof HTMLButtonElement)) {
    throw new InvalidHtmlElementError(`${element} is not HTMLButtonElement`);
  }
}

/**
 * `element`の型が`HTMLCanvasElement`かどうか判定し、そうでない場合は`InvalidHtmlElementError`を投げます。
 * @param element 判定する`document.querySelector()`で取得した要素
 */
export function assertIsHTMLCanvasElement(element: Element | null): asserts element is HTMLCanvasElement {
  if (!(element instanceof HTMLCanvasElement)) {
    throw new InvalidHtmlElementError(`${element} is not HTMLCanvasElement`);
  }
}

/**
 * `element`の型が`HTMLInputElement`かどうか判定し、そうでない場合は`InvalidHtmlElementError`を投げます。
 * @param element 判定する`document.querySelector()`で取得した要素
 */
export function assertIsHTMLInputElement(element: Element | null): asserts element is HTMLInputElement {
  if (!(element instanceof HTMLInputElement)) {
    throw new InvalidHtmlElementError(`${element} is not HTMLInputElement`);
  }
}

/**
 * `element`の型が`HTMLLabelElement`かどうか判定し、そうでない場合は`InvalidHtmlElementError`を投げます。
 * @param element 判定する`document.querySelector()`で取得した要素
 */
export function assertIsHTMLLabelElement(element: Element | null): asserts element is HTMLLabelElement {
  if (!(element instanceof HTMLLabelElement)) {
    throw new InvalidHtmlElementError(`${element} is not HTMLLabelElement`);
  }
}
