import zip from 'adm-zip';
import { SmartBuffer } from 'smart-buffer';
import fs from 'fs';
import crypto from 'crypto';
import os from 'os';
import path from 'path';

export class Pak4 {

    entries: Map<string, Buffer> = new Map<string, Buffer>();
    metadata: any = {};
    private the_hash: string = "";
    private hashMatch: boolean = false;
    private header: SmartBuffer = new SmartBuffer();
    private data: SmartBuffer = new SmartBuffer();
    private footer: SmartBuffer = new SmartBuffer();
    private file: string;
    private internalZip: zip = new zip();

    constructor(file: string) {
        this.file = file;
    }

    private updateInternalZip() {
        this.internalZip = new zip();
        this.entries.forEach((value: Buffer, key: string) => {
            this.internalZip.addFile(key, value);
        });
    }

    extractAll(out: string) {
        this.updateInternalZip();
        this.internalZip.extractAllTo(out, true);
    }

    save() {
        this.data.clear();
        // Create Header.
        this.header.clear();
        this.header.writeString("MODLOADER64");
        this.header.writeUInt32BE(0xDEADBEEF); // Total size.
        this.header.writeUInt8(0x4);
        this.header.writeUInt32BE(0xDEADBEEF); // Data section pointer.
        this.header.writeUInt32BE(0xDEADBEEF); // Meta section pointer.
        this.header.writeUInt32BE(0xDEADBEEF); // Hash section pointer.
        this.header.writeUInt32BE(0xDEADBEEF); // Build section pointer.
        this.header.writeUInt32BE(0xDEADBEEF); // Data section size.
        this.header.writeUInt32BE(0xDEADBEEF); // Meta section size.
        this.header.writeUInt32BE(0xDEADBEEF); // Hash section size.
        this.header.writeUInt32BE(0xDEADBEEF); // Build section size.
        this.data.writeBuffer(this.header.toBuffer());
        // Create Data section.
        this.updateInternalZip();
        let ds = this.internalZip.toBuffer();
        this.data.writeUInt32BE(this.data.writeOffset, 0x10);
        this.data.writeUInt32BE(ds.byteLength, 0x20);
        this.data.writeBuffer(ds);
        // Create meta section.
        let meta = Buffer.from(JSON.stringify(this.metadata));
        this.data.writeUInt32BE(this.data.writeOffset, 0x14);
        this.data.writeUInt32BE(meta.byteLength, 0x24);
        this.data.writeBuffer(meta);
        // Create hash section.
        this.the_hash = crypto.createHash('sha512').update(ds).digest('hex');
        let hashb = Buffer.from(this.the_hash, 'hex');
        this.data.writeUInt32BE(this.data.writeOffset, 0x18);
        this.data.writeUInt32BE(hashb.byteLength, 0x28);
        this.data.writeBuffer(hashb);
        // Create build section.
        let build_data: Buffer = Buffer.from(os.userInfo().username + '@' + os.hostname() + ' ' + new Date().toISOString());
        this.data.writeUInt32BE(this.data.writeOffset, 0x1C);
        this.data.writeUInt32BE(build_data.byteLength, 0x2C);
        this.data.writeBuffer(build_data);
        // Create Footer.
        this.footer.clear();
        this.footer.writeString("PAKEND");
        this.data.writeBuffer(this.footer.toBuffer());
        // Pad file to be 16 byte aligned.
        while (this.data.length % 0x10 !== 0) {
            this.data.writeUInt8(0xFF);
        }
        // Write length to header.
        this.data.writeUInt32BE(this.data.length, 0xB);
        fs.writeFileSync(this.file, this.data.toBuffer());
    }

    load() {
        let ext = path.parse(this.file).ext;
        switch (ext) {
            case ".pak":
                let p = fs.readFileSync(this.file);
                let data_pointer: number = p.readUInt32BE(0x10);
                let data_length: number = p.readUInt32BE(0x20);
                let data = p.slice(data_pointer, data_pointer + data_length);
                let _temp = new zip(data);
                for (let i = 0; i < _temp.getEntries().length; i++) {
                    let e = _temp.getEntries()[i];
                    if (!e.isDirectory) {
                        this.entries.set(e.entryName, e.getData());
                    }
                }
                let hash_pointer: number = p.readUInt32BE(0x18);
                let hash_length: number = p.readUInt32BE(0x28);
                this.the_hash = p.slice(hash_pointer, hash_pointer + hash_length).toString('hex');
                let _hash: string = crypto.createHash('sha512').update(data).digest('hex');
                this.hashMatch = this.the_hash === _hash;
                break;
            case ".zip":
                let temp = new zip(fs.readFileSync(file));
                for (let i = 0; i < temp.getEntries().length; i++) {
                    let e = temp.getEntries()[i];
                    if (!e.isDirectory) {
                        this.entries.set(e.entryName, e.getData());
                    }
                }
                let nn = path.parse(this.file).name + ".pak";
                let np = path.parse(this.file).dir;
                this.file = path.resolve(np, nn);
                this.the_hash = crypto.createHash('sha512').update(temp.toBuffer()).digest('hex');
                this.hashMatch = true;
                break;
            default:
                this.hashMatch = false;
                this.the_hash = "DEADBEEF";
                break;
        }
    }

    get hash(): string {
        return this.the_hash;
    }

    get isValid(): boolean {
        return this.hashMatch;
    }

}