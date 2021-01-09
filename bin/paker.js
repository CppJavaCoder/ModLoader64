#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = __importDefault(require("commander"));
var path_1 = __importDefault(require("path"));
var adm_zip_1 = __importDefault(require("adm-zip"));
var PakFormatNew_1 = require("modloader64_api/PakFormatNew");
var fs_extra_1 = __importDefault(require("fs-extra"));
commander_1.default.option('-d --dir <dir>', 'base directory');
commander_1.default.option('-i --input <pak>', 'pak to unpak');
commander_1.default.option('-o, --output <dir>', 'output dir');
commander_1.default.option("-a, --algo <algo>", "compression algo");
commander_1.default.option("-m, --meta <file>", "metadata file");
commander_1.default.parse(process.argv);
if (commander_1.default.dir !== undefined) {
    var recursive = require('recursive-readdir');
    require('mkdir-recursive');
    recursive(commander_1.default.dir, function (err, files) {
        if (commander_1.default.algo === "zip") {
            var zipFile = new adm_zip_1.default();
            zipFile.addLocalFolder(path_1.default.resolve(commander_1.default.dir), path_1.default.parse(commander_1.default.dir).name);
            zipFile.writeZip(path_1.default.resolve(commander_1.default.output + "/" + path_1.default.parse(commander_1.default.dir).name + '.zip'));
        }
        else {
            var zipFile = new adm_zip_1.default();
            zipFile.addLocalFolder(path_1.default.resolve(commander_1.default.dir), path_1.default.parse(commander_1.default.dir).name);
            var pak = new PakFormatNew_1.Pak4(commander_1.default.output + "/" + path_1.default.parse(commander_1.default.dir).name + '.pak');
            pak.fromZip(zipFile.toBuffer());
            if (commander_1.default.meta !== undefined) {
                pak.metadata = JSON.parse(fs_extra_1.default.readFileSync(commander_1.default.meta).toString());
            }
            pak.save();
        }
    });
}
if (commander_1.default.input !== undefined) {
    var pak = new PakFormatNew_1.Pak4(commander_1.default.input);
    pak.extractAll(commander_1.default.output);
}
