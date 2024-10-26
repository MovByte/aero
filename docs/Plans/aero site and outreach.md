# Improving the aero site and outreach

This site will be hosted on GitHub pages and will be created in an action after the other actions have been ran. I want to market aero like how JS frameworks do.

## A page for the docs

It will have typedoc on it

## New live deployment demo

Yes, the [other plan I wrote a while ago in this directory](./aero%20Live%20Deployment%20Page.md) will be a part of this site

I will use the power of Nested SWs to enable revision support in aero's demo site. This will work because I will have a CI that makes a release per every commit in `main` and `unstable`, but not `untested`, and it will publish all of the bundle files in the release individually. The GitHub pages site will fetch the bundles live for whatever revision you choose using the GitHub API and it will be evaled and routed properly through Nested SWs

> Revision support is going back to a particular commit on any branch other than `untested` and using aero from that specified time

## Dashboard

I will make a dashboard for aero
It will update every day on the unstable branch, and it will say aero's octane score, wpt/wpt-diff score, tests passed/failed, and how it has changed from the past.

## Live Repl demos

### AeroSandbox playground

I will have a playground where you can experiment with intercepting things with AeroSandbox and it will have examples

### Proxy Middleware

I will continue to work on my live middleware technology and have a [Monaco](https://microsoft.github.io/monaco-editor/playground.html?source=v0.52.0#example-creating-the-editor-hello-world)-based editor for it. This is unrelated to aero, however can show that aero is versatile and can be used for more than unblocking.