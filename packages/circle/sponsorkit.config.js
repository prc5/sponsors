import { defineConfig } from "sponsorkit";
import { sharedSponsorConfig } from "../../config";

export default defineConfig(
  /** @type {import("sponsorkit").SponsorkitConfig} */
  {
    ...sharedSponsorConfig,
    includePastSponsors: true,
    renderer: "circles",
  }
);
