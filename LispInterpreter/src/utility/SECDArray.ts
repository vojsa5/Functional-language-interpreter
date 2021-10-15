import {TreeUtils} from "../AST/TreeUtils";
import {SECDValue} from "./SECDValue";

export class SECDArray extends Array<SECDValue | SECDArray> implements TreeUtils{

    constructor() {
        super()
    }

    public getNode() {
        return this[this.length - 1].getNode
    }

    public concat(other: SECDArray): SECDArray {
        return <SECDArray>super.concat(other);
    }

    public toString(): string {
        return '[' + super.toString() + ']'
    }
}
