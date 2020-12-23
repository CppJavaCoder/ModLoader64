import { IModLoaderAPI, IPlugin } from "modloader64_api/IModLoaderAPI";

class DolphinPlugin implements IPlugin {

    ModLoader!: IModLoaderAPI;
    pluginName?: string | undefined;
    pluginHash?: string | undefined;

    preinit(): void {
    }
    init(): void {
    }
    postinit(): void {
    }
    onTick(frame?: number): void {
    }
}

module.exports = DolphinPlugin;