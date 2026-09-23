import assert from "node:assert/strict";
import { followUpRequest } from "../src/service.js";

const parsed = followUpRequest.safeParse({ workOrderId: "WO-1", technicianEmail: "tech@example.com", photoUrls: ["https://example.com/p.jpg"], dispatchStatus: "en_route" });
assert.equal(parsed.success, true);
assert.equal(followUpRequest.safeParse({ workOrderId: "WO-1", technicianEmail: "bad", photoUrls: [], dispatchStatus: "en_route" }).success, false);
console.log("workflow boundary: valid dispatch accepted, invalid email/photo set rejected");
