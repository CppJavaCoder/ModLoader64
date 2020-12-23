import { IRomHeader } from "API/build/IRomHeader";

export class GCRomHeader implements IRomHeader{
    name: string = "";
    country_code: string = "E";
    revision: number = 0;
    id: string = "";
}