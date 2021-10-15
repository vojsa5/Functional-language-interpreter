import {InstructionShortcut} from "../instructions/InstructionShortcut";


export abstract class Node{
    constructor() {

    }

    public abstract toString(): string;
}

export abstract class CodeNode extends Node{
    protected constructor() {
        super();
    }
}

export class EmptyNode extends Node{
    constructor() {
        super()
    }

    public toString(): string {
        return ""
    }
}

export class InnerNode extends CodeNode{
    public toString(): string {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super();
    }
}

export class IfNode extends InnerNode{
    condition: CodeNode
    expr1: CodeNode
    expr2: CodeNode

    constructor(condition: CodeNode, node1: CodeNode, node2: CodeNode) {
        super();
        this.condition = condition
        this.expr1 = node1
        this.expr2 = node2
    }

    public toString(): string {
        return this.condition.toString() + this.expr1.toString() + this.expr2.toString()
    }
}

export class UnaryExprNode extends InnerNode{
    nonCode1: NonCodeNode
    expr: CodeNode
    nonCode2: NonCodeNode

    constructor(node: CodeNode) {
        super();
        this.expr = node
    }

    public toString(): string {
        return this.nonCode1.toString() + this.expr.toString() + this.nonCode2.toString()
    }
}

export class BinaryExprNode extends InnerNode{
    expr1: CodeNode
    expr2: CodeNode
    operator: InstructionShortcut

    constructor(node1: CodeNode, node2: CodeNode, operator: InstructionShortcut) {
        super();
        this.expr1 = node1
        this.expr2 = node2
        this.operator = operator
    }

    public toString(): string {
        return '(' + this.operator.toString() + ' ' + this.expr1.toString() + ' ' + this.expr2.toString() + ')'
    }
}


export class ValueNode extends CodeNode{
    value: number

    constructor(value: number | boolean) {
        super();
        if(typeof(value) == "boolean"){
            if(value)
                this.value = 1
            else
                this.value = 0
        }
        else
            this.value = value
    }

    public toString(): string {
        return this.value.toString()
    }
}

export class NonCodeNode extends Node{
    nonCode: string

    public toString(): string {
        return this.nonCode
    }
}