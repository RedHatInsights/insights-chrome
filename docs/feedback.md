# Feedback

Chrome supplies a "feedback" tab that allows customers in applications to submit feedback to the Product Managers through Jira.

The feedback tab is activated on a per-bundle basis which is driven by the PMs. If the bundle is not ready for feedback, we will not turn it on. This means, that applications cannot request to have the feedback tab turned on if their bundle does not support it.

## Usage

Apps get the feedback tab by default if they're in a bundle that has it activated

### Using Pendo

We supply a native feedback form for the customers to submit, however, some applications would rather use pendo's form in order to collect the feedback instead.

In order to do this, we disable to form functionality, but keep the button so that pendo can target the element on the page. Chrome supplies a hook that allows team to disable the native form's functionality which you can use through the frontend components.

```js
import usePendoFeedback from '@redhat-cloud-services/frontend-components/usePendoFeedback';

const AppEntryPoint = () => {
  usePendoFeedback()

  ...
}
```

### Toggle feedback modal via `useChrome`

To open feedback form programmatically, we supply a toggle function through `useChrome` hook.

```js
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

const Component = () => {
  const { toggleFeedbackModal } = useChrome()
  // open modal
  toggleFeedbackModal(true)
  // close modal
  toggleFeedbackModal(false)

  ...
}
```