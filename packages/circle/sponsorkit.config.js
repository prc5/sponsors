import { defineConfig } from "sponsorkit";
import { sharedSponsorConfig } from "../../sponsor.config";

export default defineConfig(
  /** @type {import("sponsorkit").SponsorkitConfig} */
  {
    ...sharedSponsorConfig,
    renderer: "circles",
    circles: {
      radiusPast: 3,
    },
  }
);
