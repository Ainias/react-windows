# React-Windows

With this library you can add different Windows to your project.
These windows can be minimized, maximized or even opened in a browser popup
to display them on a different screen.

Also tabs are supported! You can drag a tab anywhere to create a new window
or drag it to another window to add it there instead.

## How to install

The usual. Just run

```
npm install @ainias42/react-windows
``` 

and you are good to go!

## How to use

You only really need two components. The first one is

```Typescript tsx
<Window id = {"unique-window-id"}
title = {"myWindowTitle"} > {...} < /Window>
```

and the second one is

```Typescript tsx
<WindowList / >
```

With ```<Window>``` you create new window data. The component itself does
not render anything but will add the data and children you give it to a
store in the background. Then ```<WindowList>``` displays the different
windows. With this concept you can add windows in different parts of
your application, but they will always be on the same z-layer and therefore
can better interact with each other.

The settings (which windows are displayed as tabs inside one container ect) is saved
locally. From the window itself, only the id and the corresponding container
is saved. If a window in future is not present, aka not in the React-DOM,
then it will not be loaded or displayed. If it is added at a later point,
it will be in the same container as before. This allows conditional window display.

## Props

### `<Window>`

| Prop               | type                                                                                                        | required | default   | explanation                                                                                                                                                                                                                                                       |
|--------------------|-------------------------------------------------------------------------------------------------------------|----------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| id                 | `string`                                                                                                    | x        |           | The unique id inside the store for the window (can be the same as a containerId. See below)                                                                                                                                                                       | 
| title              | `string`                                                                                                    | x        |           | The Title of the window                                                                                                                                                                                                                                           |
| defaultContainerId | `string`                                                                                                    |          | undefined | When two windows have the same containerId, they will be displayed as tabs inside the same windowContainer. Keep in mind, the user can with drag and drop change the container. The user configuration will always be more important than the defaultContainerId. |
| fillHeight         | `boolean`                                                                                                   |          | false     | If the content should fill all of the available window-space. This breaks the resize-to-content-function in the height.                                                                                                                                           |
| defaultWidth       | `number`                                                                                                    |          | undefined | sets an initial width                                                                                                                                                                                                                                             
| storeId            | `string`                                                                                                    |          | 'default' | the name of the store to use. Normally you don't need this. If you want windows which should not interact with each other, use different stores for them.                                                                                                         |
| buttons            | `WindowButtonData[]` or `(state: ContainerState, defaultButtons: WindowButtonData[]) => WindowButtonData[]` |          | `[]`      | Title Buttons to display at the right of a window container. See below for a definition of `WindowButtonData` and `ContainerState`                                                                                                                                

### `<WindowList>`

| Prop    | type     | required | default   | explanation                                                                                                                                               |
|---------|----------|----------|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| storeId | `string` |          | 'default' | the name of the store to use. Normally you don't need this. If you want windows which should not interact with each other, use different stores for them. |

#### `WindowButtonData`

```typescript
{
    key: string;
    icon: IconSource;
    title ? : string;
    containerState ? : ContainerState;
    hideWhenMaximized ? : boolean;
    hideWhenMinimized ? : boolean;
    onClick: (mouseEvent, onClickData) => void;
    onClickData: any
}
```

#### `Containerstate`

```typescript
enum ContainerState {
    NORMAL,
    MINIMIZED,
    MAXIMIZED,
    POPUP,
}
```

## FAQ

### My component is not working correctly when the window is opened inside a popup!

Did you use the `window`-object inside your component? Thats not directly possible as
this library uses React-Portals to render the component inside the popup (or the window).
Therefore the `window`-object always returns the window of the main browser-window.

But there is a solution! You just have to use `useWindow()` from `react-bootstrap-mobile`.
This hook gives you `undefined` on the server, but a `window`-object on the client.
Either the new popup-window or the normal browser window.
