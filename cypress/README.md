# Visual regression testing

Make sure to get familiar with the [cypress component docs](https://docs.cypress.io/guides/component-testing/writing-your-first-component-test).

## Some rules

1. Do not create e2e tests, these tests are supposed to be only used for visual component testing.
2. If you need to mock some API calls, use the [cy.intercept](https://docs.cypress.io/guides/guides/network-requests) stub.
3. Do not store videos of tests
4. Only create test files inside the `cypress/component` directory.
5. Test files must end with `cy.ts` or `cy.tsx` extensions.
6. To get the browser snapshots, we have to query for the `html` tag!

## Setup

run `npm i`

## Creating new test

### Create a new test file inside the `cypress/component` directory

### Create the desired DOM

```tsx
const elem = cy.mount(<Banner />).get('html')
elem.matchImageSnapshot()
```

The **`.get('html')`** is a critical part. The snapshot only accepts DOM.

## Running tests locally

### CLI (preferred)

#### Run visual tests

```sh
npm run test:ct
```

#### Update outdated snapshots

```sh
npm run test:ct -- -u
```

### Interactive

To run the tests in interactive env use

```sh
npx cypress open
```

**Visual snapshots are not accurate when setting the viewport size manually!**

**If a snapshot is mismatched, the interactive mode will not show/store the diff!**
