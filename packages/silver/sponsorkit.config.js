import { defineConfig } from "sponsorkit";
import { Tiers } from "../../constants/tiers.constants";

/** @type {import("sponsorkit").SponsorkitConfig} */
export default defineConfig({
  // Providers configs
  github: {
    type: "user",
    login: "prc5",
  },

  // Rendering configs
  width: 800,
  formats: ["svg", "png"],
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
