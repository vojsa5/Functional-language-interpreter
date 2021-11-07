import {SECDConstant} from "./SECDConstant";
import {Instruction} from "../instructions/Instruction";
import { ColourType } from "./ColourType";


export class SECDValue{
    private _val: SECDConstant
    private _colour: ColourType

    get colour(): ColourType {
        return this._colour;
    }

    get val(): SECDConstant{
        return this._val;
    }

    set colour(value: ColourType) {
        this._colour = value;
    }

    constructor(val: number | string | Instruction) {
        this._val = val as unknown as SECDConstant
        this._colour = ColourType.None
    }

    public toString() {
        return this._val.toString()
    }
} 