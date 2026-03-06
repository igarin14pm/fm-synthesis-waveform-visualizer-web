// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

import { assertIsHTMLDivElement, assertIsHTMLSelectElement } from "./assertion.js";
import { CarrierAndModulatorMode } from "./carrier-and-modulator-mode.js";
import { FeedbackMode } from "./feedback-mode.js";
import { SelectComponent, SynthesisModeDivConponent } from "./ui-component.js";

/**
 * 継承したクラスがアプリであることを表す抽象クラスです。
 */
export abstract class App { }

/**
 * "Synthesis Mode"に関連する`UiComponent`クラスのインスタンスをまとめたオブジェクトの型を定義するインターフェースです。
 */
export interface SynthesisModeComponentGroup {

  carrierAndModulatorDiv: SynthesisModeDivConponent;

  feedbackDiv: SynthesisModeDivConponent;

}

/**
 * "FM-Synthesis Waveform Visualizer"のアプリを表すクラスです。
 */
export class FmSynthesisWaveformVisualizerApp extends App {

  /**
   * "Carrier and Modulator"モードの動作を行う`CarrierAndModulatorMode`のインスタンス
   */
  carrierAndModulatorMode = new CarrierAndModulatorMode();

  /**
   * "Feedback"モードの動作を行う`FeedbackMode`のインスタンス
   */
  feedbackMode = new FeedbackMode();

  /**
   * "Synthesis Mode"を選択する`<select>`要素を操作する`SelectComponent`のインスタンス
   */
  synthesisModeSelectComponent: SelectComponent;

  /**
   * "Synthesis Mode"の各UIを操作する`UiComponent`を格納するオブジェクト
   */
  synthesisModeComponentGroup: SynthesisModeComponentGroup;

  /**
   * `FmSynthesisWaveformVisualizerApp`のインスタンスを生成します。
   */
  constructor() {
    
    super();

    const synthesisModeSelectElement: Element | null = document.querySelector('#synthesis-mode-select');
    assertIsHTMLSelectElement(synthesisModeSelectElement);
    this.synthesisModeSelectComponent = new SelectComponent(synthesisModeSelectElement);

    const carrierAndModulatorModeDivElement: Element | null = document.querySelector('#carrier-and-modulator-mode');
    const feedbackModeDivElement: Element | null = document.querySelector('#feedback-mode');
    assertIsHTMLDivElement(carrierAndModulatorModeDivElement);
    assertIsHTMLDivElement(feedbackModeDivElement);
    this.synthesisModeComponentGroup = {
      carrierAndModulatorDiv: new SynthesisModeDivConponent(carrierAndModulatorModeDivElement, false),
      feedbackDiv: new SynthesisModeDivConponent(feedbackModeDivElement, true)
    };

  }

  /**
   * `<html>`タグの`.no-js`クラスを`.js`に置き換え、JavaScriptが必要な要素の表示を切り替えます。
   */
  static applyJsStyle(): void {
    document.documentElement.classList.replace('no-js', 'js');
  }

  /**
   * `SelectComponent`にイベントリスナーを追加します。
   */
  addEventListenerToSelectComponent(): void {
    this.synthesisModeSelectComponent.addChangeEventListener(() => {
      switch (this.synthesisModeSelectComponent.value) {
        case "carrier-and-modulator":
          this.carrierAndModulatorMode.start();
          this.feedbackMode.stop();
          
          this.synthesisModeComponentGroup.carrierAndModulatorDiv.isCollapsed = false;
          this.synthesisModeComponentGroup.feedbackDiv.isCollapsed = true;

          break;
        case "feedback":
          this.carrierAndModulatorMode.stop();
          this.feedbackMode.start();

          this.synthesisModeComponentGroup.carrierAndModulatorDiv.isCollapsed = true;
          this.synthesisModeComponentGroup.feedbackDiv.isCollapsed = false;

          break;
        default: break;
      }
    });
  }

  /**
   * アプリの動作を開始します。
   */
  init(): void {

    FmSynthesisWaveformVisualizerApp.applyJsStyle();

    this.addEventListenerToSelectComponent();

    this.carrierAndModulatorMode.init();
    this.feedbackMode.init();

    this.carrierAndModulatorMode.start();

  }

}
