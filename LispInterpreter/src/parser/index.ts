import {SECDArray} from "./SECDArray";
import {Parser} from "./Parser";


export function parse(): SECDArray {

    const parser : Parser = new Parser()

    return parser.loadInstructions();
}

export default {
    parse
}