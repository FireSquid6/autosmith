import type { CovenantServer } from "@covenant-rpc/server";
import type { covenant } from "../covenant";

type CovenantType = typeof covenant;

export type AppServer = CovenantServer<
  CovenantType["procedures"],
  CovenantType["channels"],
  null,
  null
>;
