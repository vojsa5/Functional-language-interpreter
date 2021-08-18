import {Instruction} from "./Instructions";


class InstructionUtil{
    public static toString(instruction: Instruction): string{
        return Instruction[instruction];
    }
}