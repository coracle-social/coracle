# Contributing to Coracle

First off, thanks for taking the time to contribute!

All types of contributions are encouraged and valued. See the [Table of Contents](#table-of-contents) for different ways to help and details about how this project handles them. Please make sure to read the relevant section before making your contribution. It will make it a lot easier for the maintainers and smooth out the experience for all involved. The community looks forward to your contributions.

> And if you like the project, but just don't have time to contribute, that's fine. There are other easy ways to support the project and show your appreciation, which we would also be very happy about:
> - Star the project
> - Nost about it
> - Tell your friends about it
> - Donate on [Geyser](https://geyser.fund/project/coracle)

## Table of Contents

- [I Have a Question](#i-have-a-question)
- [I Want To Contribute](#i-want-to-contribute)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)
- [Contributing Code](#contributing-code)
- [Project Structure](#project-structure)
- [User Experience Notes](#user-experience-notes)

## I Have a Question

Before you ask a question, it is best to search for existing [Issues](/issues) that might help you. In case you have found a suitable issue and still need clarification, you can write your question in this issue. It is also advisable to search the internet for answers first.

If you then still feel the need to ask a question and need clarification, we recommend the following:

- Open an [Issue](/issues/new).
- Provide as much context as you can about what you're running into.
- Provide OS, browser, active extensions, etc., depending on what seems relevant.

We will then take care of the issue as soon as possible.


## I Want To Contribute

> ### Legal Notice
> When contributing to this project, you must agree that you have authored 100% of the content, that you have the necessary rights to the content and that the content you contribute may be provided under the project license.

### Reporting Bugs


#### Before Submitting a Bug Report

A good bug report shouldn't leave others needing to chase you up for more information. Therefore, we ask you to investigate carefully, collect information and describe the issue in detail in your report.

#### How Do I Submit a Good Bug Report?

> You must never report security related issues, vulnerabilities or bugs including sensitive information to the issue tracker, or elsewhere in public. Instead sensitive bugs must be sent by email to <hodlbod@coracle.social>.

We use GitHub issues to track bugs and errors. If you run into an issue with the project:

- Open an [Issue](/issues/new).
- Explain the behavior you would expect and the actual behavior.
- Please provide as much context as possible and describe the *reproduction steps* that someone else can follow to recreate the issue on their own.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for Coracle, **including completely new features and minor improvements to existing functionality**. Following these guidelines will help maintainers and the community to understand your suggestion and find related suggestions.

#### Before Submitting an Enhancement

- Find out if the functionality is already covered.
- Perform a [search](/issues) to see if the enhancement has already been suggested. If it has, add a comment to the existing issue instead of opening a new one.
- Find out whether your idea fits with the scope and aims of the project. It's up to you to make a strong case to convince the project's developers of the merits of this feature. Keep in mind that we want features that will be useful to the majority of our users and not just a small subset.

#### How Do I Submit a Good Enhancement Suggestion?

Enhancement suggestions are tracked as [GitHub issues](/issues).

- Use a **clear and descriptive title** for the issue to identify the suggestion.
- Provide a **step-by-step description of the suggested enhancement** in as many details as possible.
- **Describe the current behavior** and **explain which behavior you expected to see instead** and why. At this point you can also tell which alternatives do not work for you.
- **Explain why this enhancement would be useful** to most users. You may also want to point out the other projects that solved it better and which could serve as inspiration.

### Contributing Code

We welcome pull requests. To ensure your pull request is accepted, please follow the guidelines below:

- Base your pull request on an issue that has already been discussed and acknowledged as a problem or desirable enhancement. (ROADMAP.md)[ROADMAP.md] also contains several tasks that have not been put into issues yet.
- Make sure your pull request passes all checks and follows code style. You can autoformat, lint, and check types using the scripts in package.json. More broadly, code style is generally procedural, with some functional paradigms, using objects mostly as singletons with an initialization step. Try to use (but not over-use) svelte stores, ramda, and hurdak when possible.

#### Development and Deployment

To create a working copy, please fork the repository and clone it so that all PRs can go through a review. Run `yarn && yarn dev` to start the dev server, and `yarn run check` to run all checks. Pushes to the `dev` branch are autodeployed via render.com to `dev.coracle.social`. Pushes to `master` are autodeployed via render.com to `app.coracle.social`.

### Project Structure

Coracle is organized into four main parts:

- `util` contains utility functions of various kinds, which should generally be stateless and not coupled or dependent on the rest of the codebase.
- `engine` contains nostr-specific global application state and functionality. This may be released as an independent library at some point, and so should avoid coupling and dependencies on other parts of the codebase.
- `partials` contains general purpose svelte components, and some shared state. These should avoid depending on other parts of the app other than `util`, and should avoid coupling with app- or nostr-specific use cases.
- `app` contains application-specific components and state.

#### Engine

`engine` is divided into components and utilities.

Components are intended to be instantiated as a singleton via the `Engine` class, and should address a discrete piece of functionality. Each may have state (usually `writable` or `collection` stores, getters that add logic to state, and actions that update state. Each component may define an `initialize` method that gives it access to the full `engine` object. This is where listeners on other components can be set up. Dependencies between components in a component's methods are discouraged. If many of these occur, logic should be factored out into a utility that combines logic and state from multiple components.

Utilities may be either low-level utilities depended on by components (stores, workers), or wrappers around the engine class to provide enhanced functionality. For example, `Feed` takes the engine class and some configuration and provides an interface supporting an infinite-scroll feed.

#### App

The app directory is mostly svelte components, with the exception of `engine` and `state` which provide shared state and functionality for the rest of the directory. `App` is the top-level component and contains a bunch of disorganized junk. The rest of the top-level components are for routing or globally available components (navs, buttons).

The `shared` directory is similar to `partials` in that they are intended for use in other components, but may freely depend on anything defined in `app/state` or `app/engine`.

The `views` directory contains components intended to be used either as a route or as a modal. Many views may be used as either in different contexts. Coracle's routing model uses traditional SPA routing in addition with layered modals. In general, clicking a link should open a modal rather than navigating when possible, allowing the user to drill arbitrarily far into the details of a given piece of content without losing their place.

### User Experience Notes

Onboarding is important. A user should be able to land on Coracle and immediately start playing around, including changing user settings. Reasonable defaults are provided, and relays/follows can be edited by an anonymous user. Anonymous settings are carried through the onboarding process if an anonymous user creates an account, but should not disrupt existing settings if a user logs in.

An important goal for the UX is speed without reflow due to late-arriving events. The best approach I've found is to use multiple buffers when fetching and merging events from multiple relays with a slight delay before displaying them. Caches may be used sparingly to accelerate this process, but due to the limitations of indexeddb (performance and capacity), this should be limited to highly relevant of frequently used data like profiles, notifications, joined channels, etc.

I'm still working through the privacy tradeoff. In general, I opt for the public version of any primitive (follows, relays list) so that more sophisticated functionality can be built on top of open social graphs. However, in the case of application-specific settings and usage data, there is no benefit to sharing that information publicly, and so it is encrypted. One of the main goals of Coracle is also to eventually support private groups alongside public notes, which will present a tricky design challenge.

Coracle only has support for DMs and chat because it was added early on and people use it. These are not the priority of the project, and hopefully can be replaced with an embedded micro-app at some point in the future. Insofar as certain NIPs can augment regular social content (public and private) however, they should be supported. This includes things like Data Vending Machines and Client recommendations. Rendering support is included for long-form posts, profile updates, and more, and advanced search and custom feeds are an area of research I'm interested in pushing forward.
