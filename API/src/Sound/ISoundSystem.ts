/*
 * File generated by Interface generator (dotup.dotup-vscode-interface-generator)
 * Date: 2020-07-16 07:59:09 
*/

import { Listener, Music, Sound } from "./sfml_audio";


export interface ISoundSystem {
    loadSound(file: string): Sound;
    initSound(buf: Buffer): Sound;
    loadMusic(file: string): Music;
    initMusic(buf: Buffer): Music;
    listener: Listener;
}

export class FakeSoundImpl implements ISoundSystem {
    listener!: Listener;
    loadSound(file: string): Sound {
        //@ts-ignore
        return undefined;
    }
    initSound(buf: Buffer): Sound {
        //@ts-ignore
        return undefined;
    }
    loadMusic(file: string): Music {
        //@ts-ignore
        return undefined;
    }
    initMusic(buf: Buffer): Music {
        //@ts-ignore
        return undefined;
    }
}