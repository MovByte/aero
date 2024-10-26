# Aero Live Deployment Page (new demo)

### What it will be

- [ ] TODO: This will serve as the demo site for aero
- [ ] TODO: This will use GitHub Pages for the official demo with external [epoxy-tls servers](https://github.com/MercuryWorkshop/epoxy-tls) in rotation

### What it will have (wants)

- [ ] TODO: To be on the `main` branch by default and to be able to switch to commits on the `unstable` branch to get reference builds from. The `untested` branch will not be supported.
- [ ] TODO: To say what checks have passed through a button that says `# of checks passed/# of checks` and drops down to show what is broken and what is not.
- [ ] TODO: To be configurable in the settings to automatically choose the commit with the least breaking changes in that branch; it would select the latest one if it needs a tie-breaker.
- [ ] TODO: The ability to change the backend servers, including setting multiple in rotation and being able to sort them differently (by ping, by priority order, etc...), with multiple transport support such as bare v1-3, [bare v4](https://github.com/tomphttp/specifications-v4), [wisp](https://github.com/MercuryWorkshop/wisp-protocol), and epoxy-tls.

## Deployments

I want to make better deployments for the aero dev server so you can host your demo version

- [ ] [Nix Flake](https://www.tweag.io/blog/2020-05-25-flakes)
- [ ] [systemd service](https://www.tecmint.com/create-systemd-service-linux)
- [ ] [PM2 ecosystem config](https://pm2.keymetrics.io/docs/usage/application-declaration)