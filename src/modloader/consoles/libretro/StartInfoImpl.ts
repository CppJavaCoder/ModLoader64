import { Frontend } from "./ml64_emu_libretro_addon";

export class StartInfoImpl implements Frontend.StartInfo{
    windowTitle: string;
    windowWidth: number;
    windowHeight: number;
    windowIcon?: Buffer | undefined;
    libretro: string;
    configDir: string;
    dataDir: string;

    constructor(windowTitle: string, windowWidth: number, windowHeight: number, libretro: string, configDir: string, dataDir: string){
        this.windowTitle = windowTitle;
        this.windowWidth = windowWidth;
        this.windowHeight = windowHeight;
        this.libretro = libretro;
        this.configDir = configDir;
        this.dataDir = dataDir;
    }
}