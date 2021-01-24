import { IRetro, EmuState, CoreEvent, CoreParam } from './IRetro';
import IMemory from 'modloader64_api/IMemory';
import IConsole from 'modloader64_api/IConsole';
import { IRomMemory } from 'modloader64_api/IRomMemory';
import { IRomHeader } from 'modloader64_api/IRomHeader';
import { RetroHeader } from './RetroHeader';
import { ILogger, ModLoaderEvents } from 'modloader64_api/IModLoaderAPI';
import IUtils from 'modloader64_api/IUtils';
import ISaveState from 'modloader64_api/ISaveState';
import path from 'path';
import { StartInfoImpl } from './StartInfoImpl';
import fs from 'fs';
import { IImGui } from 'modloader64_api/Sylvain/ImGui';
import { SDL } from 'modloader64_api/Sylvain/SDL';
import { Gfx } from 'modloader64_api/Sylvain/Gfx';
import { Input } from 'modloader64_api/Sylvain/Input';
import { bus } from 'modloader64_api/EventHandler';
import { IYaz0 } from 'modloader64_api/Sylvain/Yaz0';
import { internal_event_bus } from '../../modloader64';
import { vec2, xy } from 'modloader64_api/Sylvain/vec';
import { ModLoaderErrorCodes } from 'modloader64_api/ModLoaderErrorCodes';
import { Debugger } from 'modloader64_api/Sylvain/Debugger';

class Retro implements IConsole {
    rawModule: any;
    retro: IRetro;
    rom_size: number;
    logger: ILogger;
    lobby: string;
    isPaused: boolean = false;
    callbacks: Map<string, Array<Function>> = new Map<string, Array<Function>>();
    texPath: string = "";

    constructor(rom: string, logger: ILogger, lobby: string) {
        this.logger = logger;
        this.lobby = lobby;
        this.rawModule = require('@emulator/ml64_emu_libretro_addon.node');
        this.retro = this.rawModule as IRetro;
		
		this.rom_size = 0;
		
        let size: vec2 = xy(800, 600);
        if (global.ModLoader.hasOwnProperty("ScreenWidth") && global.ModLoader.hasOwnProperty("ScreenHeight")) {
            size.x = global.ModLoader["ScreenWidth"];
            size.y = global.ModLoader["ScreenHeight"];
        } else {
            if (fs.existsSync(path.join(".", "emulator", "retro64plus.cfg"))) {
                let opts: any = {};
                let retro: string = fs.readFileSync(path.join(".", "emulator", "retro64plus.cfg")).toString();
                let lines = retro.split("\n");
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].indexOf("[") > -1) {
                        continue;
                    }
                    if (lines[i].indexOf("#") > -1) {
                        continue;
                    }
                    if (lines[i].trim() === "") {
                        continue;
                    }
                    let s = lines[i].split("=");
                    opts[s[0].trim()] = s[1].trim().replace(/['"]+/g, "");
                }
                global.ModLoader["ScreenWidth"] = parseInt(opts["ScreenWidth"]);
                global.ModLoader["ScreenHeight"] = parseInt(opts["ScreenHeight"]);
            } else {
                global.ModLoader["ScreenWidth"] = 800;
                global.ModLoader["ScreenHeight"] = 600;
            }
        }
        size.x = global.ModLoader["ScreenWidth"];
        size.y = global.ModLoader["ScreenHeight"];

        let emu_dir: string = global["module-alias"]["moduleAliases"]["@emulator"];
        this.retro.Frontend.startup(new StartInfoImpl("ModLoader64", size.x, size.y, emu_dir + "/genesis_plus_gx_libretro", emu_dir, emu_dir));
        //this.texPath = this.retro.Retro.Config.openSection("Video-GLideRetro").getStringOr("txPath", "");
        let doEvents = setInterval(() => this.retro.Frontend.doEvents(), 10);
        //const _64_MB = 64 * 1024 * 1024;

        //let section = this.retro.Retro.Config.openSection("Core");
        let screenshot_dir: string = path.resolve("./", "screenshots");
        if (!fs.existsSync(screenshot_dir)) {
            fs.mkdirSync(screenshot_dir);
        }
        //section.setString("ScreenshotPath", screenshot_dir);
        //this.retro.Retro.Config.saveFile();

        bus.on('create-sprite', (fname: string, w: number, h: number, cols: number, rows: number) => {
            this.logger.info("Loading Sprite "+fname);
            this.retro.Frontend.Sprite.fromImage(fname,w,h,cols,rows);
        });
        bus.on('copy-sprite', (index: number) => {
            this.logger.info("Copying Sprite "+index);
            this.retro.Frontend.Sprite.fromSprite(index);
        });
        bus.on('move-sprite', (index: number, x: number, y: number) => {
            this.retro.Frontend.Sprite.setPos(index, x, y);
        });
        bus.on('frame-sprite', (index: number, frm: number) => {
            this.retro.Frontend.Sprite.setFrame(index, frm);
        });
        bus.on('fg-sprite', (index: number, pos: boolean) => {
            this.retro.Frontend.Sprite.setFG(index, pos);
        });
        bus.on('clip-sprite', (index: number, x: number, y: number, w: number, h: number) => {
            this.retro.Frontend.Sprite.setClip(index, x, y, w, h);
        });

        this.registerCallback('window-closing', () => {
            //if (this.retro.Retro.getEmuState() === EmuState.Paused) {
            //    this.retro.Retro.resume();
            //}
            //if (this.retro.Retro.getEmuState() === EmuState.Running) {
            //    this.retro.Frontend.stop();
            //}
        });
        this.registerCallback('core-stopped', () => {
            this.logger.debug("core-stopped");
            clearInterval(doEvents);
            this.retro.Frontend.shutdown();
            internal_event_bus.emit('SHUTDOWN_EVERYTHING', {});
            setTimeout(() => {
                process.exit(0);
            }, 3000);
        });
        this.registerCallback('core-event', (event: CoreEvent, data: number) => {
            if (event == CoreEvent.SoftReset) {
                this.logger.info("Soft reset detected. Sending alert to plugins.");
                bus.emit(ModLoaderEvents.ON_SOFT_RESET_PRE, {});
                this.logger.info("Letting the reset go through...");
                this.softReset();
                internal_event_bus.emit("CoreEvent.SoftReset", {});
            } else if (event == CoreEvent.TakeNextScreenshot) {
                this.retro.Frontend.takeNextScreenshot();
            } else if (event == CoreEvent.VolumeUp) {
                //this.retro.Retro.setAudioVolume(this.retro.Retro.getAudioVolume() + 1);
                //global.ModLoader["GLOBAL_VOLUME"] = this.retro.Retro.getAudioVolume();
                bus.emit(ModLoaderEvents.ON_VOLUME_CHANGE, global.ModLoader["GLOBAL_VOLUME"]);
            } else if (event == CoreEvent.VolumeDown) {
                //this.retro.Retro.setAudioVolume(this.retro.Retro.getAudioVolume() - 1);
                //global.ModLoader["GLOBAL_VOLUME"] = this.retro.Retro.getAudioVolume();
                bus.emit(ModLoaderEvents.ON_VOLUME_CHANGE, global.ModLoader["GLOBAL_VOLUME"]);
            } else if (event == CoreEvent.VolumeMute) {
                //this.retro.Retro.setAudioMuted(!this.retro.Retro.isAudioMuted());
            } else if (event == CoreEvent.SetFastForward) {
                //this.retro.Retro.setSpeedFactor(300);
            } else if (event == CoreEvent.UnsetFastForward) {
                //this.retro.Retro.setSpeedFactor(100);
            } else if (event == CoreEvent.SpeedUp) {
                //this.retro.Retro.setSpeedFactor(this.retro.Retro.getSpeedFactor() + 1);
            } else if (event == CoreEvent.SpeedDown) {
                //this.retro.Retro.setSpeedFactor(this.retro.Retro.getSpeedFactor() - 1);
            } else if (event == CoreEvent.TogglePause) {
                if (!this.isPaused) {
                    this.retro.Retro.pause();
                    this.isPaused = true;
                } else {
                    this.retro.Retro.resume();
                    this.isPaused = false;
                }
            } else if (event == CoreEvent.Stop) {
                internal_event_bus.emit("SHUTDOWN_EVERYTHING", {});
                setTimeout(() => {
                    process.exit(0);
                }, 3000);
            } else if (event == CoreEvent.ChangeWindow) {
                this.retro.Frontend.toggleFullScreen();
            }
        });
        logger.info("Loading rom: " + rom + ".");
        if (rom === "") {
            this.logger.error("No rom selected!");
            process.exit(ModLoaderErrorCodes.NO_ROM);
        }
        if (!fs.existsSync(rom)) {
            this.logger.error("No rom selected!");
            process.exit(2);
        }
        if(!fs.existsSync(rom) || this.retro.Retro.loadGame(rom))
			this.logger.debug("ROM loaded successfully!");
		else
			this.logger.debug("ROM failed to load");

        let _rom: Buffer = fs.readFileSync(rom);
        this.rom_size = _rom.byteLength;

		bus.on('openInputConfig', () => {
            this.retro.Frontend.openInputConfig();
        });
        bus.on('openMemViewer', () => {
            this.retro.Frontend.openMemViewer();
        });
        bus.on('openCheatConfig', () => {
            this.retro.Frontend.openCheatConfig();
        });
        bus.on('toggleFullScreen', () => {
            this.retro.Frontend.toggleFullScreen();
        });
        //bus.on(ModLoaderEvents.OVERRIDE_TEXTURE_PATH, (p: string) => {
            //this.retro.Retro.Config.openSection("Video-GLideRetro").setString("txPath", p);
            //this.retro.Retro.Config.openSection("Video-GLideRetro").setString("txCachePath", path.resolve(path.parse(p).dir, "cache"));
            //this.retro.Retro.Config.openSection("Video-GLideRetro").setBool("txHiresEnable", true);
            //this.retro.Retro.Config.openSection("Video-GLideRetro").setBool("txHiresFullAlphaChannel", true);
            //this.retro.Retro.Config.openSection("Video-GLideRetro").setBool("txEnhancedTextureFileStorage", false);
            //this.retro.Retro.Config.openSection("Video-GLideRetro").setBool("txHiresTextureFileStorage", false);
            //this.retro.Retro.Config.openSection("Video-GLideRetro").setBool("txSaveCache", true);
            //this.retro.Retro.Config.saveFile();
        //});
    }

    private registerCallback(type: string, callback: Function) {
        if (!this.callbacks.has(type)) {
            this.callbacks.set(type, []);
            this.retro.Frontend.on(type, (event: any, data: any) => {
                for (let i = 0; i < this.callbacks.get(type)!.length; i++) {
                    this.callbacks.get(type)![i](event, data);
                }
            });
        }
        this.callbacks.get(type)!.push(callback);
    }

    getYaz0Encoder(): IYaz0 {
        return this.retro.Yaz0;
    }

    getInputAccess(): Input {
        return this.retro.Input;
	}

    getGfxAccess(): Gfx {
        return this.retro.Gfx;
    }

    getSDLAccess(): SDL {
        return this.retro.SDL;
    }

    getImGuiAccess(): IImGui {
        return this.retro.ImGui;
    }

    on(which: string, callback: any): void {
        this.registerCallback(which, callback);
    }

    startEmulator(preStartCallback: Function): IMemory {
        let rom_r = ((this.retro.Retro.Memory as unknown) as IRomMemory);
        let buf: Buffer = preStartCallback();
        if (buf !== undefined || buf !== null) {
            rom_r.romWriteBuffer(0x0, buf);
        }
        this.setSaveDir(path.relative(path.resolve(global["module-alias"]["moduleAliases"]["@emulator"]), path.resolve(global["module-alias"]["moduleAliases"]["@emulator"], "saves", this.lobby)));
        this.retro.Frontend.execute();
        internal_event_bus.on('emulator_started', () => {
            //global.ModLoader["GLOBAL_VOLUME"] = this.retro.Retro.getAudioVolume();
        });
        internal_event_bus.on('emulator_started', () => {
            if (this.texPath !== "") {
                //this.retro.Retro.Config.openSection("Video-GLideRetro").setString("txPath", this.texPath);
                //this.retro.Retro.Config.openSection("Video-GLideRetro").setString("txCachePath", path.resolve(path.parse(this.texPath).dir, "cache"));
            }
            //this.retro.Retro.Config.saveFile();
        });
		this.logger.debug("About to read data");
		for(let n = 0; n < 10; n++)
		{
			this.logger.debug(""+((this.retro.Retro.Memory as unknown) as IRomMemory).romRead8(n));
		}
        return this.retro.Retro.Memory as IMemory;
	}

    stopEmulator(): void {
        this.retro.Frontend.stop();
    }

    finishInjects(): void {
        //this.retro.Retro.Memory.invalidateCachedCode();
    }

    isEmulatorReady(): boolean {
        //return this.retro.Retro.getEmuState() === EmuState.Running;
		return true;
    }

    getLoadedRom(): Buffer {
        let rom_r = ((this.retro.Retro.Memory as unknown) as IRomMemory);
        const size = this.retro.Retro.getGameInfo().size;
        this.logger.debug("I am here at least...");
        let buf: Buffer = rom_r.romReadBuffer(0x0, size);
        this.logger.debug("I read from the scary buffer!");
        return buf;
    }

    getRomOriginalSize(): number {
        return this.rom_size;
    }

    getFrameCount(): number {
       // return this.retro.Retro.getNumElapsedFrames();
	   return 0;
    }

    setFrameCount(num: number): void {
    }

    pauseEmulator(): void {
        this.retro.Retro.pause();
    }

    resumeEmulator(): void {
        this.retro.Retro.resume();
    }

    getRomHeader(): IRomHeader {
        let raw = ((this.retro.Retro.Memory as unknown) as IRomMemory).romReadBuffer(0x0, 0x10);
        return new RetroHeader(raw);
    }

    getMemoryAccess(): IMemory {
        return this.retro.Retro.Memory;
    }

    softReset(): void {
        this.retro.Retro.reset();
    }

    hardReset(): void {
        this.retro.Retro.reset();
    }

    saveState(file: string): void {
        //this.retro.Retro.saveStateToFile(file);
    }

    loadState(file: string): void {
        //this.retro.Retro.loadStateFromFile(file);
    }

    setSaveDir(path: string): void {
        //let section = this.retro.Retro.Config.openSection('Core');
        //section.setString('SaveSRAMPath', path);
        //section.save();
    }

    getUtils(): IUtils {
        return (this.retro.Yaz0 as unknown) as IUtils;
    }

    getSaveStateManager(): ISaveState {
        //return this.retro.Retro as ISaveState;
		return (null as unknown) as ISaveState;
    }

    getDebuggerAccess(): Debugger {
        //return this.retro.Retro.Debugger;
		return (null as unknown) as Debugger;
    }
}

export default Retro;
