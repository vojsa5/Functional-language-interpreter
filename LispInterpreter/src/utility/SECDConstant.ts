import {Node} from "../AST/AST";
import {Instruction} from "../instructions/Instruction";


export type SECDConstant = {
    val: number | string | boolean | Instruction
    node: Node
}