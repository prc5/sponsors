import { defineConfig } from "sponsorkit";
import { Tiers } from "../../constants/tiers.constants";
import { sharedSponsorConfig } from "../../config";

const pastSponsors = [];

export default defineConfig(
  /** @type {import("sponsorkit").SponsorkitConfig} */
  {
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
