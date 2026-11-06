// The react-jsx transform carries children inside the props object, but Vue's JSX types (written for its own transform)
// never put children on the attributes. Teach the native-element attributes that one prop exists; the runtime already
// knows what to do with it.
import type { VNodeChild } from "vue";

declare module "@vue/runtime-dom" {
  export interface HTMLAttributes {
    children?: VNodeChild;
  }
}
