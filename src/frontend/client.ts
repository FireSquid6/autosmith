import { CovenantReactClient } from "@covenant-rpc/react";
import { httpClientToServer } from "@covenant-rpc/client/interfaces/http";
import { httpClientToSidekick } from "@covenant-rpc/client/interfaces/http";
import { covenant } from "../covenant";

const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const sidekickUrl = `${wsProtocol}//${window.location.host}/socket`;

export const client = new CovenantReactClient(covenant, {
  serverConnection: httpClientToServer("/api/covenant"),
  sidekickConnection: httpClientToSidekick(sidekickUrl),
});
