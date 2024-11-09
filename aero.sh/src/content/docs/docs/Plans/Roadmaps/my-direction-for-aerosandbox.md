---
title: My direction for aero and what I hope for the future of proxies
description: The latest roadmap
---

TLDR: I want proxies to move towards sandboxing rather than unblocking
I'm getting bored of unblockers, and I see a ton of potential

Two of the most significant recent controversies for Google and the advertisement industry as a whole are Chrome removing MV2 extensions such as AdBlockers and AdBlocker Detection on YouTube and many other sites. Content scripts containing AeroSandbox and minimal emulation code can revive MV2. These scripts work through message channels between the content scripts and the extension, which then signals to the content script what to do with the hooks (primarily for network requests). The fact that Google knows this is possible means that removing MV2 APIs was useless. Yet, they try to use the excuse it is for security, proving that they are lying and, therefore, eliminating the APIs to stop AdBlockers for no other reason. You can get whatever you want out of the content scripts. It is entirely irrelevant. Aero can now solve two of Google's most significant controversial decisions, except for Gemini. That is why this is so important. For example, why block onbeforeheaders if the extension could use a content script to inject a hook into the API used to make the request and steal the cookies that way? Or better yet, use the content scripts to get the current cookies. They also added filter rules but completely made them nerfed to the point where it is only helpful for content blockers and not AdBlockers. The whole purpose of the filter rules is to appease the filtering companies, and, in respect, the school districts are using the filtering companies because they know k12 Chromebooks are one of their biggest markets. I've had this all planned out.

I'm also working on a new chrome extension, which uses the storageIsolation API on AeroSandbox to bring Firefox Containers into Chrome with native syncing support.

I focused more on the APIs than the site support; I wanted a strong base (AeroSandbox). That is why AeroSandbox is a powerful, portable library supporting every API. AeroSandbox removes ANY limitations to user scripts, extensions, bookmarklets, etc... And all you have to do is important the library and go use the "fake DOM" or extend the hooks provided in your "sandbox script". In just 200 lines of code, you can make an undetectable AdBlocker extension using the masking APIs provided by AeroSandbox. When I say AeroSandbox can remove all web limitations, aero can do that. It can bypass any detection system in JS just by its mere behavior. You can tear down anything on the site, and the site's scripts would not suspect a thing happened when using the Faker APIs on AeroSandbox.

Aero is a container for the web. Do you know how people use containers to isolate software from the rest of the OS? Those containers work by intercepting OS syscalls. Aero works by intercepting web features, rather than parsing and rewriting them. If you use well-made container software, it is so seamless that the software you run doesn't know it is in a container. I've been trying to reach that level of standard. To use AeroSandbox in a project, you don't even have to know what a sandbox, interception, emulation, or proxy is; all you do is call the AeroSandbox APIs, and you can make the site behave however you want. Make it believe it is in whatever context you want. It is like making a container and tricking the software into thinking it is on another CPU (box86/rosseta2) or even thinking it is on an entirely different OS (LXC). What Docker/Free BSD Jails/containers did to running software AeroSandbox wants to do to the web for the first time ever.

## Example

Let's solve the problem of sites spamming the debugger statement

The high-level, simple, and effective way: `AeroSandbox.faker.aeroJails.trap("debugger", null)`.

The lower-level and inefficient way: What you do is call AeroSandbox.faker.modifyExecutionContext() but pass in these two arguments
The target script element
A replacer handler that has a parameter containing the current script content, and you remove the debugger statements in the script and return the modified script.
