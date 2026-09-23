import { z } from "zod";
import { infrai } from "./infrai.js";

export const followUpRequest = z.object({ workOrderId: z.string().min(1), technicianEmail: z.string().email(), photoUrls: z.array(z.string().url()).min(1), dispatchStatus: z.enum(["dispatched", "en_route", "complete"]) });
export type FollowUpRequest = z.infer<typeof followUpRequest>;
export type FollowUpResult = { messageId: string; state: "sent" | "opened" | "bounced"; nextAction: string };

export async function dispatchFollowUp(input: unknown): Promise<FollowUpResult> {
  const request = followUpRequest.parse(input);
  const sent = await infrai.email.send({ to: request.technicianEmail, subject: `Work order ${request.workOrderId}: ${request.dispatchStatus}`, html: `<p>Photos:</p><p>${request.photoUrls.join("<br>")}</p>` }, `work-order-${request.workOrderId}`);
  const events = await infrai.email.event.list(sent.message_id);
  const names = events.map((event) => (event.type ?? event.event ?? "").toLowerCase());
  const state = names.includes("bounce") || names.includes("bounced") ? "bounced" : names.includes("open") || names.includes("opened") ? "opened" : "sent";
  return { messageId: sent.message_id, state, nextAction: state === "bounced" ? "check technician address" : state === "opened" ? "await field notes" : "monitor delivery" };
}
