import { IRomHeader } from 'modloader64_api/IRomHeader';

export class RetroHeader implements IRomHeader {
    name: string;
    country_code: string;
    revision: number;
    id: string;

    constructor(raw: Buffer) {
        this.name = raw
            .slice(0x0, 0x03)
            .toString('ascii');
        this.country_code = '0';
        this.revision = raw.readUInt8(0x07);
        this.id = '0';
    }
}
