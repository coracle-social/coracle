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

- Base your pull request on an issue that has already been discussed and acknowledged as a problem or desirable enhancement.
- Set your pull request up to merge into the `dev` branch of the upstream repo.
- Make sure your pull request passes all checks and follows code style. You can autoformat, lint, and check types using the scripts in package.json. More broadly, code style is generally procedural, with some functional paradigms, using objects mostly as singletons with an initialization step. Try to use (but not over-use) svelte stores and the welshman library when possible.

#### Bounties

Issues labeled `bounty` are subject to a payout _upon completion_. A bounty's full amount may not be paid out if a PR is not complete, or requires significant cleanup after merge, or if requirements change. Please work on bounties in close communication with the project's maintainers to avoid wasting time. The bounty amount is listed in the issue.

#### Development and Deployment

To create a working copy, please fork the repository and clone it so that all PRs can go through a review. Run `npm i && npm run dev` to start the dev server, and `npm run check` to run all checks. Pushes to the `dev` branch are autodeployed via render.com to `dev.coracle.social`. Pushes to `master` are autodeployed via render.com to `app.coracle.social`.

### Project Structure

Coracle is organized into four main parts:

- `util` contains utility functions of various kinds, which should generally be stateless and not coupled or dependent on the rest of the codebase.
- `engine` contains nostr-specific global application state and functionality.
- `partials` contains general purpose svelte components, and some shared state. These should avoid depending on other parts of the app other than `util`, and should avoid coupling with app- or nostr-specific use cases.
- `app` contains application-specific components and state.

Coracle also makes heavy use of the `@welshman` libraries.

#### Engine

The engine directory where the "backend" of coracle lives - including functions for loading data, keeping track of session state, deriving stuff from the events repository, and hooking things up to storage.

#### App

The app directory is mostly svelte components. `App` is the top-level component and contains a bunch of disorganized junk. The rest of the top-level components are for routing or globally available components (navs, buttons).

The `shared` directory is similar to `partials` in that they are intended for use in other components, but may freely depend on anything defined in `app/state` or `engine`.

The `views` directory contains components intended to be used either as a route or as a modal. Many views may be used as either in different contexts. Coracle's routing model uses traditional SPA routing in addition with layered modals. In general, clicking a link should open a modal rather than navigating when possible, allowing the user to drill arbitrarily far into the details of a given piece of content without losing their place.
