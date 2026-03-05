// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org
import { CarrierAndModulatorMode } from "./carrier-and-modulator-mode.js";
/**
 * "FM-Synthesis Waveform Visualizer"のアプリを表すクラスです。
 */
export class FmSynthesisWaveformVisualizerApp {
    /**
     * `FmSynthesisWaveformVisualizerApp`のインスタンスを生成します。
     */
    constructor() {
        /**
         * "Carrier and Modulator"モードの動作を行う`CarrierAndModulatorMode`のインスタンス
         */
        this.carrierAndModulatorMode = new CarrierAndModulatorMode();
    }
    /**
     * `<html>`タグの`.no-js`クラスを`.js`に置き換え、JavaScriptが必要な要素の表示を切り替えます。
     */
    static applyJsStyle() {
        document.documentElement.classList.replace('no-js', 'js');
    }
    /**
     * アプリの動作を開始します。
     */
    init() {
        FmSynthesisWaveformVisualizerApp.applyJsStyle();
        this.carrierAndModulatorMode.init();
        this.carrierAndModulatorMode.start();
    }
}
