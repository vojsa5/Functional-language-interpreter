import {InstructionShortcut} from "./InstructionShortcut";

export class Instruction {
    get shortcut(): InstructionShortcut {
        return this._shortcut;
    }
    private _shortcut: InstructionShortcut

    constructor(shortcut: InstructionShortcut) {
        this._shortcut = shortcut
    }

    public toString(): string{
        switch (this._shortcut){
            case InstructionShortcut.ADD:
                return "+"
            case InstructionShortcut.SUB:
                return "-"
            case InstructionShortcut.MUL:
                return "*"
            case InstructionShortcut.DIV:
                return "/"
            case InstructionShortcut.EQ:
                return "="
            case InstructionShortcut.NE:
                return "!="
            case InstructionShortcut.HE:
                return ">="
            case InstructionShortcut.HT:
                return ">"
            case InstructionShortcut.LE:
                return "<="
            case InstructionShortcut.LT:
                return "<"
            default:

        }
    }
}