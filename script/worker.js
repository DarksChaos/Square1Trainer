import SquanLib from './squanlib.js';
import { getScramble } from './pbl-scrambler.js';

const squan = new SquanLib();

self.onmessage = function (e) {
    const { caseName, equatorMode, scrambleMode, allowBottom56 } = e.data;
    try {
        let barflip;
        if (equatorMode === 'bar') barflip = '-';
        else if (equatorMode === 'slash') barflip = '+';
        else barflip = "-+"[Math.floor(Math.random() * 2)];

        const scramble = squan.optimize(getScramble(caseName, barflip, scrambleMode, allowBottom56));
        const fullCase = caseName + barflip;
        self.postMessage({
            scramble: scramble.replaceAll("/", " / "),
            karn: squan.karnify(scramble),
            caseName: fullCase
        });
    } catch (err) {
        self.postMessage({ error: err.message });
    }
};
