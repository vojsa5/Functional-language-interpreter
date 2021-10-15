import {SECDConstant} from "./SECDConstant";
import {Instruction} from "../instructions/Instruction";
import {TreeUtils} from "../AST/TreeUtils";


export class SECDValue implements TreeUtils{
    val: SECDConstant

    constructor(val: number | string | boolean | Instruction, node: Node) {
        this.val = {
            "val": val,
            "node": node
        }
    }

    public getNode() {
        return this.val.node
    }

    public toString() {
        return this.val.node.toString()
    }
}