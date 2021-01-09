#!/usr/bin/env node

import program from 'commander';
import path from 'path';
import zip from 'adm-zip';
import { Pak4 } from 'modloader64_api/PakFormatNew';
import fse from 'fs-extra';

program.option('-d --dir <dir>', 'base directory');
program.option('-i --input <pak>', 'pak to unpak');
program.option('-o, --output <dir>', 'output dir');
program.option("-a, --algo <algo>", "compression algo");
program.option("-m, --meta <file>", "metadata file");

program.parse(process.argv);

if (program.dir !== undefined) {
    let recursive = require('recursive-readdir');
    require('mkdir-recursive');

    recursive(program.dir, function (err: any, files: string[]) {
        if (program.algo === "zip"){
            let zipFile: zip = new zip();
            zipFile.addLocalFolder(path.resolve(program.dir), path.parse(program.dir).name);
            zipFile.writeZip(path.resolve(program.output + "/" + path.parse(program.dir).name + '.zip'));
        }else{
            let zipFile: zip = new zip();
            zipFile.addLocalFolder(path.resolve(program.dir), path.parse(program.dir).name);
            let pak: Pak4 = new Pak4(program.output + "/" + path.parse(program.dir).name + '.pak');
            pak.fromZip(zipFile.toBuffer());
            if (program.meta !== undefined){
                pak.metadata = JSON.parse(fse.readFileSync(program.meta).toString());
            }
            pak.save();
        }
    });
}

if (program.input !== undefined) {
    let pak: Pak4 = new Pak4(program.input);
    pak.extractAll(program.output);
}
