// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org
import { FmSynthesisWaveformVisualizerApp } from './modules/app.js';
document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new FmSynthesisWaveformVisualizerApp();
        app.init();
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`${error.name}: ${error.message}`);
        }
        window.alert('アプリの内部でエラーが発生しました。\n' +
            'アプリの設計上の不具合の可能性がありますので、開発者までお知らせください。');
    }
});
