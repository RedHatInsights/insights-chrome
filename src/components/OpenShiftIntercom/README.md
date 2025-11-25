# OpenShift Intercom Federated Module

This module provides a clickable icon component that integrates OpenShift support chat functionality through Intercom. It's designed to be imported as a federated module by other micro frontends within the Red Hat console ecosystem.

## Features

- **Clickable Icon**: Provides a comment icon button that opens OpenShift support chat
- **Intercom Integration**: Automatically detects and uses the Intercom widget when available
- **Fallback Support**: Falls back to state management when Intercom widget is not available
- **Feature Flag Support**: Controlled by the `platform.chrome.openshift-intercom` feature flag
- **Error Handling**: Gracefully handles errors and provides fallback functionality

## Usage

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | - | Optional CSS class name for styling |

## Feature Flag

The component is controlled by the feature flag `platform.chrome.openshift-intercom` to smoothly transition between the button in the corner and the current setup.

## Development

### Component Structure

```
src/components/OpenShiftIntercom/
├── OpenShiftIntercomModule.tsx     # Main component
├── OpenShiftIntercom.scss        # Styles
└── index.ts                      # Export definitions
```

### State Management

The component uses Jotai atoms for state management:

- `openShiftIntercomExpandedAtom`: Controls the expanded state of the Intercom widget

### Styling

The component includes custom styles for hover, focus, and clicked states that follow PatternFly design patterns.

## Integration Notes

1. **Webpack Configuration**: The component is exposed through ModuleFederationPlugin in `config/webpack.plugins.js`
2. **Type Declarations**: SCSS imports are supported through type declarations in `src/@types/assets.d.ts`
3. **Chrome Context**: Integrated with the global Chrome object for consistent API access
4. **Error Boundaries**: Component includes error handling to prevent layout breakage

## Example Implementation
```typescript
const isOpenShiftIntercomEnabled = useFlag('platform.chrome.openshift-intercom');
const [isOpenShiftIntercomExpanded, setIsOpenShiftIntercomExpanded] = useAtom(openShiftIntercomExpandedAtom);

const toggleIntercom = () => {
  setIsOpenShiftIntercomExpanded((prev) => !prev);
};

const OpenShiftIntercomModuleProps: ScalprumComponentProps<Record<string, unknown>, OpenShiftIntercomModuleProps> = {
  scope: 'chrome',
  module: './OpenShiftIntercomModule',
  fallback: null,
  isExpanded: isOpenShiftIntercomExpanded,
  ErrorComponent: <Fragment />, // Prevents broken layout
  toggleIntercom,
};

return (
  <>
    {isOpenShiftIntercomEnabled && <ScalprumComponent {...OpenShiftIntercomModuleProps} />}
    {/* Other header components */}
  </>
);
```
