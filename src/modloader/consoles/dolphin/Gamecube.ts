import IConsole from "modloader64_api/IConsole";
import IMemory from "modloader64_api/IMemory";
import { ILogger } from "modloader64_api/IModLoaderAPI";
import { IRomHeader } from "modloader64_api/IRomHeader";
import ISaveState from "modloader64_api/ISaveState";
import IUtils from "modloader64_api/IUtils";
import { Debugger } from "modloader64_api/Sylvain/Debugger";
import { Gfx } from "modloader64_api/Sylvain/Gfx";
import { Emulator_Callbacks, IImGui } from "modloader64_api/Sylvain/ImGui";
import { Input } from "modloader64_api/Sylvain/Input";
import { SDL } from "modloader64_api/Sylvain/SDL";
import { IYaz0 } from "modloader64_api/Sylvain/Yaz0";
import path from 'path';
import { GCRomHeader } from "./GCRomHeader";
import { DolphinMemoryWrapper } from "./MemoryWrapper";
import fs from 'fs';
import { CoreState, Dolphin } from '@dolphin/binding/Dolphin';
import { internal_event_bus } from "../../modloader64";
import { bus } from "modloader64_api/EventHandler";

export class Gamecube implements IConsole {

    mod: Dolphin;
    rom: string;
    mem: DolphinMemoryWrapper;
    callbacks: Map<string, Array<Function>> = new Map<string, Array<Function>>();
    isRunning: boolean = false;

    constructor(rom: string, logger: ILogger, lobby: string) {
        this.mod = new Dolphin({
            // Qt app metadata, mostly used when storing settings via QSetting
            orgName: 'ModLoader64',
            orgDomain: 'https://modloader64.com/',
            appName: 'modloader64-dolphin-emu',
            appDisplayName: 'ModLoader64', // window title suffix: `${title} - ${appDisplayName}`
            baseDir: global["module-alias"]["moduleAliases"]["@dolphin"], // folder containing Sys/;Languages/;QtPlugins/ and dolphin.node
            userDir: path.join(global["module-alias"]["moduleAliases"]["@dolphin"], 'UserData') // user settings, Documents/Dolphin Emulator/
        });
        this.rom = rom;
        this.mem = new DolphinMemoryWrapper(this.mod);
        this.mod.onTick = () => {
            for (let i = 0; i < this.callbacks.get(Emulator_Callbacks.new_frame)!.length; i++) {
                this.callbacks.get(Emulator_Callbacks.new_frame)![i]();
            }
        };
        this.mod.onStateChanged = (newState: CoreState) => {
            logger.debug('New state: ' + CoreState[newState]);
            bus.emit("DolphinStateChanged", newState);
            if (newState === CoreState.Running) {
                this.isRunning = true;
            } else {
                if (this.isRunning && newState === CoreState.Uninitialized) {
                    // Emulation ended.
                    internal_event_bus.emit('SHUTDOWN_EVERYTHING', {});
                    process.exit(0);
                }
            }
        };
    }

    getInternalPluginPath(): string {
        return path.resolve(__dirname, "DolphinPlugin.js");
    }

    startEmulator(preStartCallback: Function): IMemory {
        preStartCallback(this.getLoadedRom());
        this.mod.start({
            path: this.rom,
            isNandTitle: false,
            savestatePath: undefined
        });
        return this.mem;
    }

    stopEmulator(): void {
    }

    softReset(): void {
    }

    hardReset(): void {
    }

    saveState(file: string): void {
    }

    loadState(file: string): void {
    }

    finishInjects(): void {
    }

    isEmulatorReady(): boolean {
        return true;
    }

    getLoadedRom(): Buffer {
        return this.mem.getRomBuffer();
    }

    getRomOriginalSize(): number {
        return 1;
    }

    getRomHeader(): IRomHeader {
        let iso = fs.readFileSync(this.rom);
        let head = new GCRomHeader();
        head.id = iso.slice(0, 6).toString();
        let b = -1;
        let o = 0x20;
        while (b !== 0) {
            b = iso.readUInt8(o);
            head.name += iso.slice(o, o + 1).toString();
            o++;
        }
        head.name = head.name.trim();
        return head;
    }

    pauseEmulator(): void {
    }

    resumeEmulator(): void {
    }

    getMemoryAccess(): IMemory {
        return this.mem;
    }

    setSaveDir(path: string): void {
    }

    getUtils(): IUtils {
        return {} as any;
    }

    getSaveStateManager(): ISaveState {
        return {} as any;
    }

    getFrameCount(): number {
        return 0;
    }

    setFrameCount(num: number): void {
    }

    on(which: string, callback: any): void {
        this.registerCallback(which, callback);
    }

    getImGuiAccess(): IImGui {
        return {} as any;
    }

    getSDLAccess(): SDL {
        return {} as any;
    }

    getGfxAccess(): Gfx {
        return {} as any;
    }

    getInputAccess(): Input {
        return {} as any;
    }

    getYaz0Encoder(): IYaz0 {
        return {} as any;
    }

    getDebuggerAccess(): Debugger {
        return {} as any;
    }

    private registerCallback(type: string, callback: Function) {
        if (!this.callbacks.has(type)) {
            this.callbacks.set(type, []);
        }
        this.callbacks.get(type)!.push(callback);
    }

}