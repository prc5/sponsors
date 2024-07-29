import { defineConfig } from "sponsorkit";
import { Tiers } from "../../constants/tiers.constants";
import { sharedSponsorConfig } from "../../config";

const pastSponsors = [];

/** @type {import("sponsorkit").SponsorkitConfig} */
export default defineConfig({
  ...sharedSponsorConfig,
  onSponsorsFetched: (sponsors) => {
    sponsors.forEach((sponsor) => {
      if (pastSponsors.includes(sponsor.sponsor.name)) {
        sponsor.monthlyDollars = Tiers.Platinum.monthlyDollars;
      }
    });
  },
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
