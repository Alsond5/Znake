import { Field, Bool, UInt32 } from "o1js"

const a = UInt32.MAXINT().addMod32(UInt32.one);

console.log(a)