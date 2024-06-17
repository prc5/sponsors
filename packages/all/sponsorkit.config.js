import { defineConfig } from "sponsorkit";
import { Tiers } from "../../constants/tiers.constants";
import { sharedSponsorConfig } from "../../sponsor.config";

export default defineConfig(
  /** @type {import("sponsorkit").SponsorkitConfig} */
  {
    ...sharedSponsorConfig,
    tiers: Object.values(Tiers),
  }
);
