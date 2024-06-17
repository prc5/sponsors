import { defineConfig } from "sponsorkit";
import { Tiers } from "../../constants/tiers.constants";
import { sharedSponsorConfig } from "../../config";

export default defineConfig(
  /** @type {import("sponsorkit").SponsorkitConfig} */
  {
    ...sharedSponsorConfig,
    filter: (sponsor) => {
      if (
        sponsor.monthlyDollars < Tiers.Platinum.monthlyDollars &&
        sponsor.monthlyDollars >= Tiers.Gold.monthlyDollars
      ) {
        return true;
      }
      return false;
    },
    tiers: Object.values(Tiers),
  }
);
