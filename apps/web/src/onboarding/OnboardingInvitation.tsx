import type { CommercialAccount } from "../api/commercial";
export function OnboardingInvitation({
  account,
}: {
  account: CommercialAccount;
}) {
  if (
    !account.user.verified ||
    (!account.manualActivation?.accessAuthorized &&
      !account.memberships.some(
        (item) =>
          item.subscriptionState === "ACTIVE" &&
          item.establishmentStatus === "ACTIVE",
      ))
  )
    return null;
  return (
    <div className="noma-onboarding-invitation">
      <a className="noma-button" href="/onboarding">
        Configurar mi negocio ↗
      </a>
    </div>
  );
}
