import { Frontend, ImGui, Retro } from './ml64_emu_libretro_addon';
import IMemory from 'modloader64_api/IMemory';
import { IImGui } from 'modloader64_api/Sylvain/ImGui';
import { SDL, WindowRef } from 'modloader64_api/Sylvain/SDL';
import { Gfx, Texture } from 'modloader64_api/Sylvain/Gfx';
import { Input } from 'modloader64_api/Sylvain/Input';
import { IYaz0 } from 'modloader64_api/Sylvain/Yaz0';
import { Debugger } from 'modloader64_api/Sylvain/Debugger';

export interface IRetro {
    Frontend: IFrontend;
    Retro: IRetro;
    Yaz0: IYaz0;
    ImGui: IImGui;
    SDL: SDL;
    Gfx: Gfx;
}

export interface IFrontend {
    startup(startInfo: Frontend.StartInfo): void;
    shutdown(): void;
    doEvents(): void;
    execute(): void;
    stop(): void;
	
    on(which: string, callback: any): void;

    getVideoOutputInfo(): Frontend.VideoOutputInfo;
    toggleFullScreen(): void;
    takeNextScreenshot(): void;
    captureFrame(): void;
    getFrameTexture(): Texture;
    createResourcesNextVi(): void;
    getMainWindow(): WindowRef;
    showMessageBox(parent: WindowRef | undefined, icon: Frontend.MessageBoxIcon,
        title: string, mainInstruction: string, content: string): void;

    getDefaultFont(): ImGui.FontRef;
    setDefaultFont(font: ImGui.FontRef): void;
    getDefaultMonoFont(): ImGui.FontRef;
    setDefaultMonoFont(font: ImGui.FontRef): void;

    openInputConfig(): void;
    closeInputConfig(): void;
    isInputConfigOpen(): boolean;
    openCheatConfig(): void;
    closeCheatConfig(): void;
    isCheatConfigOpen(): boolean;
    setCheatsCRC(crc: string): void;
    disableAllCheats(): void;
    openMemViewer(): void;
    closeMemViewer(): void;
    isMemViewerOpen(): boolean;

    Sprite: Sprite;
}

export interface Sprite
{
    fromImage(imFile: string,w: number,h: number,cols: number,rows: number): void;
    fromSurface(srf: Buffer,w: number,h: number,cols: number,rows: number): void;
    fromBuffer(pixels: Buffer,pitch: number,w: number,h: number,cols: number,rows: number): void;
    fromSprite(index: number): void;
    remove(index: number): void;
    setFrame(index: number,frame: number): void;
    animate(index: number,from: number,to: number,time: number): void;
    setPos(index: number,x: number,y: number): void;
    replaceColor(index: number,r1: number,g1: number,b1:number,r2: number,g2: number,b2:number): void;
    replaceColour(index: number,r1: number,g1: number,b1:number,r2: number,g2: number,b2:number): void;
    getX(index: number): number;
    getY(index: number): number;
    getW(index: number): number;
    getH(index: number): number;
    setHFlip(index: number,flip: boolean): void;
    setVFlip(index: number,flip: boolean): void;
    setFG(index: number,fg: boolean): void;
    getFG(index: number): boolean;
    setClip(index: number,x: number,y: number, w: number,h: number): void;
}

export interface IRetro {
	loadCore(file: string): void;
	unloadCore(): void;
	loadGame(file: string): boolean;
	loadGameSpecial(game_type: number, file: string, num_info: number): boolean;
	unloadGame(): void;

    init(): void;
    deinit(): void;
    getAPIVersion(): number;
    getSystemInfo(): Retro.retro_system_info;
	getSystemAvInfo(): Retro.retro_system_av_info;
	setControllerPortDevice(port: number, device: number): void;
	reset(): void;
	run(): void;
	serializeSize(): number;
	serialize(data: Buffer, size: number): boolean;
	unserialize(data: Buffer, size: number): boolean;
	cheatReset(): void;
	cheatSet(index: number, enabled: boolean, code: string): void;
	getRegion(): number;
	getGameInfo(): Retro.retro_game_info;
	setNeedGameSupport(s: boolean): void;
	getNeedGameSupport(): boolean;
	setSaveDir(path: string): void;

    pause(): void;
    resume(): void;
    advanceFrame(): void;
	
    Memory: IMemory;
    Input: Input;
    Config: Config;
    Debugger: Debugger;	
}

export const enum EmuState {
    Stopped = 1,
    Running,
    Paused
}

export const enum ParamType {
    Int = 1, Float, Bool, String
}

export interface Param {
    name: string;
    type: ParamType;
}

export interface Section {
    getName(): string;
    listParams(): Param[];
    save(): void;
    hasUnsavedChanges(): boolean;
    erase(): void;
    revertChanges(): void;

    getHelp(name: string): string;
    setHelp(name: string, help: string): void;
    getType(name: string): ParamType;

    setDefaultInt(name: string, value: number): void;
    setDefaultFloat(name: string, value: number): void;
    setDefaultBool(name: string, value: boolean): void;
    setDefaultString(name: string, value: string): void;

    getInt(name: string): number;
    getIntOr(name: string, value: number): number;
    setInt(name: string, value: number): void;
    getFloat(name: string): number;
    getFloatOr(name: string, value: number): number;
    setFloat(name: string, value: number): void;
    getBool(name: string): boolean;
    getBoolOr(name: string, value: boolean): boolean;
    setBool(name: string, value: boolean): void;
    getString(name: string): string;
    getStringOr(name: string, value: string): string;
    setString(name: string, value: string): void;
}

export interface Config {
    saveFile(): void;
    hasUnsavedChanges(): boolean;
    listSections(): string[];
    openSection(name: string): Section;
    getSharedDataFilePath(file: string): string;
    getUserConfigPath(): string;
    getUserDataPath(): string;
    getUserCachePath(): string;
}

export const enum CoreEvent {
    ChangeWindow,
    StateSetSlot,
    Stop,
    StateSave,
    StateLoad,
    StateIncSlot,
    SoftReset,
    SpeedDown,
    SpeedUp,
    TakeNextScreenshot,
    TogglePause,
    VolumeMute,
    VolumeUp,
    VolumeDown,
    SetFastForward,
    AdvanceOne,
    SetGameShark,
    UnsetFastForward,
    UnsetGameShark
}

export const enum CoreParam {
    EmuState = 1,
    VideoMode,
    SaveStateSlot,
    SpeedFactor,
    SpeedLimiter,
    VideoSize,
    AudioVolume,
    AudioMute,
    InputGameShark,
    StateLoadComplete,
    StateSaveComplete
}