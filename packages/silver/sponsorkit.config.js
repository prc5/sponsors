import { defineConfig } from "sponsorkit";
import { Tiers } from "../../constants/tiers.constants";
import { sharedSponsorConfig } from "../../config";

/** @type {import("sponsorkit").SponsorkitConfig} */
export default defineConfig({
  ...sharedSponsorConfig,
  filter: (sponsor) => {
    if (
      sponsor.monthlyDollars < Tiers.Gold.monthlyDollars &&
      sponsor.monthlyDollars >= Tiers.Silver.monthlyDollars
    ) {
      return true;
    }
    return false;
  },
  tiers: Object.values(Tiers),
});
