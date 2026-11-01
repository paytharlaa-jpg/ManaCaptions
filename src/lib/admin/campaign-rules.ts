export function marketingEligible(consent: boolean, suppressed: boolean, suspended: boolean) {
  return consent && !suppressed && !suspended;
}
export function announcementVisible(audience: "all" | "paid" | "free", paid: boolean) {
  return audience === "all" || (audience === "paid" ? paid : !paid);
}