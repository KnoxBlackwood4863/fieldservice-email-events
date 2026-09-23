import { dispatchFollowUp } from "./service.js";

const to = process.env.TECHNICIAN_EMAIL;
if (!to) throw new Error("TECHNICIAN_EMAIL is required");
const result = await dispatchFollowUp({ workOrderId: "WO-1042", technicianEmail: to, photoUrls: ["https://example.com/photos/WO-1042-before.jpg"], dispatchStatus: "en_route" });
console.log(JSON.stringify(result, null, 2));
