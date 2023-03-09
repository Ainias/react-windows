import * as React from 'react';
import {
    ForwardedRef,
    MouseEvent as ReactMouseEvent,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';

import styles from './windowContainer.scss';
import classNames from 'classnames';
import { faWindowMaximize, faWindowMinimize, faWindowRestore } from '@fortawesome/free-regular-svg-icons';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { checkWindowDimension } from './checkWindowDimension';
import { changeDimension, changeDimensionWidth } from './changeDimension';
import {
    WINDOW_CONTAINER_MIN_HEIGHT,
    WINDOW_CONTAINER_MIN_WIDTH,
    WindowContainerDimension,
} from './WindowContainerDimension';
import { WindowButton, WindowButtonProps } from '../WindowButton/WindowButton';
import {
    Block,
    Clickable,
    Flex,
    Grow,
    InlineBlock,
    Menu,
    MenuItem,
    SizeCalculator,
    useOnce,
    WindowContext,
    withForwardRef,
} from 'react-bootstrap-mobile';
import { getWindowStore, WindowContainerData, WindowData } from '../store/createWindowStore';
import { shallow } from 'zustand/shallow';
import { ContainerState } from '../types/ContainerState';
import { TitleTabBar } from './TitleTabBar';
import { createPortal } from 'react-dom';

type ResizeDirection = 'top' | 'left' | 'right' | 'bottom' | 'tl' | 'tr' | 'bl' | 'br';
export type WindowButtonData = WindowButtonProps<any> & { key: string };

export type WindowContainerProps = {
    id: string;
    store?: string;
    initialTop?: number;
    initialLeft?: number;
    containerData: WindowContainerData;
    titleInfos: { id: string; title: string }[];
    windowData?: WindowData;
    isActive: boolean;
    disabled?: boolean;
    className?: string;
};

export type WindowContainerRef = {
    minimize(): void;
    maximize(): void;
    toggleMinimize(): void;
    toggleMaximize(): void;
    resizeToContent(): void;
    openInNewWindow(): void;
};

export const WindowContainer = withForwardRef(
    function WindowContainer(
        {
            initialTop = 200,
            initialLeft = 200,
            id,
            store = 'default',
            containerData,
            windowData,
            titleInfos,
            isActive,
            disabled,
            className,
        }: WindowContainerProps,
        ref?: ForwardedRef<WindowContainerRef>
    ) {
        // Variables

        // Refs
        const [portalContainer] = useState<HTMLDivElement>(() => {
            return document.createElement('div');
        });

        // Open in new window refs
        const windowContainerRef = useRef<HTMLDivElement>(null);
        const containerRef = useRef<HTMLSpanElement>();
        const [windowObject, setWindowObject] = useState<Window | undefined>(undefined);

        // Resize to content-refs
        const titleRef = useRef<HTMLDivElement>(null);
        const contentRef = useRef<HTMLDivElement>(null);
        const windowRef = useRef<HTMLDivElement>(null);

        // States
        const useStore = getWindowStore(store);
        const [setActiveContainer, updateContainerDimension, updateContainerState] = useStore(
            (s) => [s.setActiveContainer, s.updateContainerDimension, s.updateContainerState],
            shallow
        );

        const { defaultWidth } = windowData ?? {};
        const { dimension, state } = containerData;

        const [isMenuOpen, setIsMenuOpen] = useState(false);
        const [menuX, setMenuX] = useState(0);
        const [menuY, setMenuY] = useState(0);

        const [isClient, setIsClient] = useState(false);

        const [mouseDownPos, setMouseDownPos] = useState<undefined | { x: number; y: number }>(undefined);
        const [moveStartPos, setMoveStartPos] = useState(dimension);

        const [resizeStartPos, setResizeStartPos] = useState<undefined | { x: number; y: number }>(undefined);
        const [resizeDirection, setResizeDirection] = useState<undefined | ResizeDirection>();
        const [resizeStartDimension, setResizeStartDimension] = useState(dimension);
        const [buttonWidth, setButtonWidth] = useState(0);

        // Selectors

        // Callbacks
        const setContainerState = useCallback(
            (newState: Parameters<typeof updateContainerState>[1]) => {
                updateContainerState(id, newState);
            },
            [id, updateContainerState]
        );

        const setDimension = useCallback(
            (newDimension: WindowContainerDimension | undefined) => updateContainerDimension(id, newDimension),
            [id, updateContainerDimension]
        );
        const setActive = useCallback(() => setActiveContainer(id), [id, setActiveContainer]);

        const closeMenu = useCallback(() => setIsMenuOpen(false), []);
        const openMenu = useCallback((ev: ReactMouseEvent) => {
            setIsMenuOpen(true);
            setMenuX(ev.clientX);
            setMenuY(ev.clientY);
        }, []);

        const getDimensions = useCallback(() => {
            if (windowContainerRef.current) {
                const computedStyles = window.getComputedStyle(windowContainerRef.current);
                return {
                    top: parseFloat(computedStyles.getPropertyValue('top')),
                    bottom: parseFloat(computedStyles.getPropertyValue('bottom')),
                    left: parseFloat(computedStyles.getPropertyValue('left')),
                    right: parseFloat(computedStyles.getPropertyValue('right')),
                };
            }
            return undefined;
        }, []);

        const resizeToContent = useCallback(() => {
            if (!windowRef.current || !titleRef.current || !contentRef.current) {
                return;
            }
            const realDimension = getDimensions();
            if (!realDimension) {
                return;
            }

            if (defaultWidth && windowContainerRef.current) {
                const currentWidth = window.innerWidth - realDimension.left - realDimension.right;
                if (currentWidth !== defaultWidth) {
                    changeDimensionWidth(realDimension, defaultWidth - currentWidth);
                    windowContainerRef.current.style.right = `${realDimension.right}px`;
                    windowContainerRef.current.style.left = `${realDimension.left}px`;
                }
            }

            let diffY = contentRef.current.scrollHeight - contentRef.current.clientHeight;
            const diffX = contentRef.current.scrollWidth - contentRef.current.clientWidth;

            if (diffY === 0) {
                diffY =
                    titleRef.current.clientHeight + contentRef.current.clientHeight - windowRef.current.clientHeight;
            }

            changeDimension(realDimension, diffX, diffY);
            setDimension(checkWindowDimension(realDimension));
        }, [defaultWidth, getDimensions, setDimension]);

        const toggleMinimized = useCallback(
            () =>
                setContainerState((old) =>
                    old === ContainerState.MINIMIZED ? ContainerState.NORMAL : ContainerState.MINIMIZED
                ),
            [setContainerState]
        );
        const toggleMaximized = useCallback(
            () =>
                setContainerState((old) =>
                    old === ContainerState.MAXIMIZED ? ContainerState.NORMAL : ContainerState.MAXIMIZED
                ),
            [setContainerState]
        );

        const onResizeStart = useCallback(
            (e: ReactMouseEvent, direction: ResizeDirection) => {
                setResizeDirection(direction);
                setResizeStartPos({ x: e.clientX, y: e.clientY });
                setResizeStartDimension(dimension);
            },
            [dimension]
        );

        const onMoveStart = useCallback(
            (e: ReactMouseEvent) => {
                setMouseDownPos({ x: e.clientX, y: e.clientY });
                setMoveStartPos(dimension);
            },
            [dimension]
        );

        const onMove = useCallback(
            (e: MouseEvent) => {
                if (!dimension) {
                    return;
                }

                const newDimension = { ...dimension };
                if (resizeStartPos && resizeStartDimension) {
                    const diff = { x: e.clientX - resizeStartPos.x, y: e.clientY - resizeStartPos.y };
                    if (resizeDirection === 'top' || resizeDirection === 'tl' || resizeDirection === 'tr') {
                        newDimension.top = Math.min(
                            window.innerHeight - (resizeStartDimension.bottom ?? 0) - WINDOW_CONTAINER_MIN_HEIGHT,
                            resizeStartDimension.top + diff.y
                        );
                    }
                    if (resizeDirection === 'bottom' || resizeDirection === 'bl' || resizeDirection === 'br') {
                        newDimension.bottom = Math.min(
                            window.innerHeight - resizeStartDimension.top - WINDOW_CONTAINER_MIN_HEIGHT,
                            (resizeStartDimension.bottom ?? 0) - diff.y
                        );
                    }
                    if (resizeDirection === 'left' || resizeDirection === 'bl' || resizeDirection === 'tl') {
                        newDimension.left = Math.min(
                            window.innerWidth - (resizeStartDimension.right ?? 0) - WINDOW_CONTAINER_MIN_WIDTH,
                            resizeStartDimension.left + diff.x
                        );
                    }
                    if (resizeDirection === 'right' || resizeDirection === 'br' || resizeDirection === 'tr') {
                        newDimension.right = Math.min(
                            window.innerWidth - resizeStartDimension.left - WINDOW_CONTAINER_MIN_WIDTH,
                            (resizeStartDimension.right ?? 0) - diff.x
                        );
                    }
                } else if (mouseDownPos && moveStartPos) {
                    const diff = { x: e.clientX - mouseDownPos.x, y: e.clientY - mouseDownPos.y };
                    const dimensions = getDimensions();
                    if (!dimensions) {
                        return;
                    }
                    diff.y = Math.min(
                        Math.max(diff.y, -moveStartPos.top),
                        dimensions.top + (dimensions.bottom ?? 0) - moveStartPos.top
                    );
                    diff.x = Math.min(
                        Math.max(diff.x, -moveStartPos.left),
                        (dimensions.right ?? 0) + dimensions.left - moveStartPos.left
                    );

                    newDimension.top = moveStartPos.top + diff.y;
                    newDimension.left = moveStartPos.left + diff.x;
                    newDimension.bottom = moveStartPos.bottom - diff.y;
                    newDimension.right = moveStartPos.right - diff.x;
                }

                if (mouseDownPos || resizeStartPos) {
                    setActive();
                    setDimension(newDimension);
                }
            },
            [
                dimension,
                getDimensions,
                mouseDownPos,
                moveStartPos,
                resizeDirection,
                resizeStartDimension,
                resizeStartPos,
                setActive,
                setDimension,
            ]
        );

        const onMoveStop = useCallback(() => {
            setMouseDownPos(undefined);
            setResizeStartPos(undefined);
        }, []);

        const openInNewWindow = useCallback(
            (force = false) => {
                if ((!force && state === ContainerState.POPUP) || !containerRef.current) {
                    return;
                }
                const windowProxy = window.open('', '', 'modal=yes');
                if (windowProxy === null) {
                    // showToast('cannot open popup :(');
                    console.warn('LOG-d cannot open in new window... :/');
                    if (state === ContainerState.POPUP) {
                        setContainerState(ContainerState.NORMAL);
                    }
                    return;
                }
                setContainerState(ContainerState.POPUP);

                const baseElement = document.createElement('base');
                baseElement.href = window.location.href;
                windowProxy.document.head.appendChild(baseElement);

                const titleElement = document.createElement('title');
                titleElement.innerText = windowData?.title ?? '';
                windowProxy.document.head.appendChild(titleElement);

                document.querySelectorAll("link[rel='stylesheet']").forEach((styleElem) => {
                    windowProxy.document.head.appendChild(styleElem.cloneNode());
                });
                document.querySelectorAll('style').forEach((styleElem) => {
                    windowProxy.document.head.appendChild(styleElem.cloneNode(true));
                });
                document.body.classList.forEach((bodyClass) => {
                    windowProxy.document.body.classList.add(bodyClass);
                });

                // TODO Theme-Checker?
                windowProxy.document.body.classList.add('flat-design');

                portalContainer.remove();
                windowProxy.document.body.appendChild(portalContainer);
                setWindowObject(windowProxy.window);

                windowProxy.addEventListener('beforeunload', () => {
                    setContainerState(ContainerState.NORMAL);

                    portalContainer.remove();
                    containerRef.current?.append(portalContainer);
                    setWindowObject(undefined);
                });
            },
            [portalContainer, setContainerState, state, windowData?.title]
        );

        // TODO refs
        useImperativeHandle(
            ref,
            () => ({
                toggleMaximize: () => {
                    if (!disabled) {
                        toggleMaximized();
                    }
                },
                toggleMinimize: () => {
                    if (!disabled) {
                        toggleMinimized();
                    }
                },
                maximize() {
                    if (!disabled && state !== ContainerState.POPUP && state !== ContainerState.MAXIMIZED) {
                        toggleMaximized();
                    }
                },
                minimize() {
                    if (!disabled && state !== ContainerState.POPUP && state !== ContainerState.MINIMIZED) {
                        toggleMinimized();
                    }
                },
                openInNewWindow() {
                    if (!disabled && state !== ContainerState.POPUP) {
                        openInNewWindow();
                    }
                },
                resizeToContent() {
                    if (!disabled && state !== ContainerState.POPUP) {
                        resizeToContent();
                    }
                },
            }),
            [disabled, openInNewWindow, resizeToContent, state, toggleMaximized, toggleMinimized]
        );

        const updateContainerRef = useCallback(
            (element: HTMLSpanElement | null) => {
                containerRef.current = element ?? undefined;
                if (element && state !== ContainerState.POPUP) {
                    element.appendChild(portalContainer);
                }
            },
            [portalContainer, state]
        );

        // Effects
        useEffect(() => {
            if (disabled) {
                return undefined;
            }

            window.addEventListener('mousemove', onMove);
            return () => window.removeEventListener('mousemove', onMove);
        }, [disabled, onMove]);

        useEffect(() => {
            if (disabled) {
                return undefined;
            }

            window.addEventListener('mouseup', onMoveStop);
            return () => window.removeEventListener('mouseup', onMoveStop);
        }, [disabled, onMoveStop]);

        useEffect(() => {
            if (disabled) {
                return;
            }

            if (!dimension) {
                setDimension(getDimensions());
            }
        }, [dimension, disabled, getDimensions, setDimension]);

        useEffect(() => setIsClient(true), []);

        useOnce(() => {
            if (disabled) {
                return;
            }

            if (state === ContainerState.POPUP) {
                openInNewWindow(true);
            }
        }, !!windowData);

        // Other
        const realButtons = useMemo(() => {
            const defaultButtons: WindowButtonData[] = [
                {
                    key: 'minimize-button',
                    icon: faWindowMinimize,
                    onClick: toggleMinimized,
                },
                {
                    key: 'maximize-button',
                    icon: state === ContainerState.MAXIMIZED ? faWindowRestore : faWindowMaximize,
                    onClick: toggleMaximized,
                },
            ];

            return windowData?.buttons(state, defaultButtons) ?? defaultButtons;
        }, [toggleMinimized, state, toggleMaximized, windowData]);

        const menuItems = useMemo(() => {
            const items: MenuItem[] = [];
            if (state === ContainerState.NORMAL) {
                items.push({
                    key: 'resize',
                    label: 'Resize',
                    callback: resizeToContent,
                });
            }
            items.push({
                key: 'openInWindow',
                label: 'Open in new Window',
                callback: openInNewWindow,
            });
            return items;
        }, [openInNewWindow, resizeToContent, state]);

        const renderTitle = () => (
            <Clickable
                onMouseDown={onMoveStart}
                className={classNames(className, styles.fullWidth)}
                ref={titleRef}
                preventDefault={false}
            >
                <Flex horizontal={true} className={classNames(styles.title)}>
                    <TitleTabBar
                        storeId={store}
                        containerId={id}
                        style={{ width: `calc(100% - ${buttonWidth}px)` }}
                        titleInfos={titleInfos}
                        disabled={disabled}
                    />
                    <SizeCalculator onSize={setButtonWidth}>
                        <InlineBlock className={styles.titleButtons}>
                            {realButtons?.map((b) => (
                                <WindowButton {...b} containerState={state} />
                            ))}
                            <WindowButton icon={faEllipsisV} onClick={openMenu} containerState={state} />
                            <Menu items={menuItems} x={menuX} y={menuY} isOpen={isMenuOpen} onClose={closeMenu} />
                        </InlineBlock>
                    </SizeCalculator>
                </Flex>
            </Clickable>
        );

        // Render Functions

        if (!windowData) {
            return null;
        }

        return (
            <Clickable onClick={setActive} onClickData={id} ref={updateContainerRef}>
                {createPortal(
                    <WindowContext.Provider value={windowObject}>
                        <Flex
                            className={classNames(styles.windowContainer, {
                                [styles.minimized]: state === ContainerState.MINIMIZED,
                                [styles.maximized]: state === ContainerState.MAXIMIZED,
                                [styles.popup]: state === ContainerState.POPUP,
                                [styles.moving]: mouseDownPos,
                                [styles.active]: isActive,
                                [styles.disabled]: disabled,
                            })}
                            style={{
                                top: initialTop,
                                left: initialLeft,
                                right:
                                    defaultWidth && isClient
                                        ? window.innerWidth - initialLeft - defaultWidth
                                        : undefined,
                                ...(dimension ?? {}),
                                minWidth: WINDOW_CONTAINER_MIN_WIDTH,
                                minHeight: WINDOW_CONTAINER_MIN_HEIGHT,
                            }}
                            ref={windowContainerRef}
                        >
                            <Flex horizontal={true} className={styles.fullWidth}>
                                <Clickable
                                    className={classNames(styles.resize, styles.edge, styles.nw)}
                                    onMouseDown={onResizeStart}
                                    onMouseDownData="tl"
                                />
                                <Clickable
                                    className={classNames(styles.resize, styles.y)}
                                    onMouseDown={onResizeStart}
                                    onMouseDownData="top"
                                />
                                <Clickable
                                    className={classNames(styles.resize, styles.edge, styles.ne)}
                                    onMouseDown={onResizeStart}
                                    onMouseDownData="tr"
                                />
                            </Flex>
                            <Grow className={classNames(styles.fullWidth, styles.overflowHidden)}>
                                <Flex horizontal={true} className={classNames(styles.stretchItems, styles.fullHeight)}>
                                    <Clickable
                                        className={classNames(styles.resize, styles.x)}
                                        onMouseDown={onResizeStart}
                                        onMouseDownData="left"
                                    />
                                    <Grow className={styles.overflowXAuto}>
                                        <Block className={styles.window} ref={windowRef}>
                                            {renderTitle()}
                                            <Block
                                                className={classNames(styles.content, {
                                                    [styles.fillHeight]: windowData?.fillHeight,
                                                })}
                                                __allowChildren="all"
                                                ref={contentRef}
                                            >
                                                {windowData?.children}
                                            </Block>
                                        </Block>
                                    </Grow>
                                    <Clickable
                                        className={classNames(styles.resize, styles.x)}
                                        onMouseDown={onResizeStart}
                                        onMouseDownData="right"
                                    />
                                </Flex>
                            </Grow>
                            <Flex horizontal={true} className={styles.fullWidth}>
                                <Clickable
                                    className={classNames(styles.resize, styles.edge, styles.sw)}
                                    onMouseDown={onResizeStart}
                                    onMouseDownData="bl"
                                />
                                <Clickable
                                    className={classNames(styles.resize, styles.y)}
                                    onMouseDown={onResizeStart}
                                    onMouseDownData="bottom"
                                />
                                <Clickable
                                    className={classNames(styles.resize, styles.edge, styles.se)}
                                    onMouseDown={onResizeStart}
                                    onMouseDownData="br"
                                />
                            </Flex>
                        </Flex>
                    </WindowContext.Provider>,
                    portalContainer
                )}
            </Clickable>
        );
    },
    styles,
    'html'
);
