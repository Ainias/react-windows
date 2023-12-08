import * as React from 'react';
import {
    ForwardedRef,
    PointerEvent as ReactPointerEvent,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState
} from 'react';

import styles from './windowContainer.scss';
import classNames from 'classnames';
import { faWindowMaximize, faWindowMinimize, faWindowRestore } from '@fortawesome/free-regular-svg-icons';
import { faClose, faEllipsisV, faThumbtack } from '@fortawesome/free-solid-svg-icons';
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
    Inline,
    InlineBlock,
    Menu,
    MenuItemType,
    SizeCalculator,
    useOnce,
    WindowContext,
    withForwardRef,
} from '@ainias42/react-bootstrap-mobile';
import { getWindowStore } from '../store/createWindowStore';
import { shallow } from 'zustand/shallow';
import { ContainerState } from '../types/ContainerState';
import { TitleTabBar } from './TitleTabBar';
import { createPortal } from 'react-dom';
import { Position, useOnMouseDrag } from '../hooks/useOnMouseDrag';

import "../../i18n/i18n";
import { WindowContainerRefContext } from "./WindowContainerRefContext";
import { ResizeToContentEnum } from "./ResizeToContentEnum";
import { selectCanCloseContainer } from "../store/selectCanCloseContainer";
import { useT } from "../../i18n/useT";
import { selectTitleInfos } from "../store/selectTitleInfos";
import { JsonHelper, ObjectHelper } from "@ainias42/js-helper";
import { selectWindowsForContainer } from "../store/selectWindowsForContainer";
import { selectActiveWindowIdForContainer } from "../store/selectAvticeWindowIdForContainer";

type ResizeDirection = 'top' | 'left' | 'right' | 'bottom' | 'tl' | 'tr' | 'bl' | 'br';
export type WindowButtonData = WindowButtonProps<any> & { key: string };

export type WindowContainerProps = {
    id: string;
    store?: string;
    initialTop?: number;
    initialLeft?: number;
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
            disabled,
            className,
        }: WindowContainerProps,
        ref?: ForwardedRef<WindowContainerRef>
    ) {
        // Variables
        const {t} = useT();

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
        const userIsResizing = useRef(false);

        // States
        const useStore = getWindowStore(store);
        const containerData = useStore((s) => s.containers[id]);
        const windowDatas = useStore((s) => selectWindowsForContainer(s, id)) ?? {};
        const activeWindowId = useStore(s => selectActiveWindowIdForContainer(s, id)) ?? "";
        const activeWindowData = windowDatas[activeWindowId];
        const isActive = useStore((s) => s.activeContainerId === id);
        const titleInfos = useStore((s) => selectTitleInfos(s, id), (a, b) => JsonHelper.deepEqual(a, b));

        const [
            setActiveContainer,
            updateContainerDimension,
            updateContainerState,
            setContainerButtonWidth,
            setContainerIsMoving,
            setContainerIsLocked,
            setShouldResizeToContent,
            closeContainer
        ] = useStore(
            (s) => [
                s.setActiveContainer,
                s.updateContainerDimension,
                s.updateContainerState,
                s.setButtonWidth,
                s.setContainerIsMoving,
                s.setContainerIsLocked,
                s.setShouldResizeToContent,
                s.closeContainer
            ],
            shallow
        );

        const canCloseContainer = useStore(s => selectCanCloseContainer(s, id));

        const buttonWidth = useStore((s) => s.containers[id].buttonWidth);
        const draggingWindowId = useStore((s) => s.draggingWindowId);

        const {defaultWidth} = activeWindowData ?? {};
        const {dimension, state, shouldResizeToContent} = containerData;

        const [isMenuOpen, setIsMenuOpen] = useState(false);
        const [menuX, setMenuX] = useState(0);
        const [menuY, setMenuY] = useState(0);

        const [isClient, setIsClient] = useState(false);

        const [resizeDirection, setResizeDirection] = useState<undefined | ResizeDirection>();
        const [resizeStartDimension, setResizeStartDimension] = useState(dimension);
        const {isMoving} = containerData;

        // Selectors

        // Callbacks
        const setIsMoving = useCallback(
            (newIsMoving: boolean) => {
                setContainerIsMoving(id, newIsMoving);
            },
            [id, setContainerIsMoving]
        );
        const unlock = useCallback(() => setContainerIsLocked(id, false), [id, setContainerIsLocked]);
        const lock = useCallback(() => setContainerIsLocked(id, true), [id, setContainerIsLocked]);

        const setButtonWidth = useCallback(
            (newButtonWidth: number) => setContainerButtonWidth(id, newButtonWidth),
            [id, setContainerButtonWidth]
        );

        const setContainerState = useCallback(
            (newState: Parameters<typeof updateContainerState>[1]) => {
                updateContainerState(id, newState);
            },
            [id, updateContainerState]
        );

        const setDimension = useCallback(
            (newDimension: WindowContainerDimension | undefined, resizeNeighbours = true) => updateContainerDimension(id, newDimension, resizeNeighbours),
            [id, updateContainerDimension]
        );
        const setActive = useCallback(() => setActiveContainer(id), [id, setActiveContainer]);

        const closeMenu = useCallback(() => setIsMenuOpen(false), []);
        const openMenu = useCallback((ev: ReactPointerEvent) => {
            setIsMenuOpen(true);
            setMenuX(ev.clientX);
            setMenuY(ev.clientY);
        }, []);

        const getDimensions = useCallback(() => {
            if (windowContainerRef.current) {
                const computedStyles = window.getComputedStyle(windowContainerRef.current);
                return {
                    top: Math.floor(parseFloat(computedStyles.getPropertyValue('top'))),
                    bottom: Math.floor(parseFloat(computedStyles.getPropertyValue('bottom'))),
                    left: Math.floor(parseFloat(computedStyles.getPropertyValue('left'))),
                    right: Math.floor(parseFloat(computedStyles.getPropertyValue('right'))),
                };
            }
            return undefined;
        }, []);

        const resizeToContent = useCallback((resizeWidth = true, resizeHeight = true) => {
            if (!windowRef.current || !titleRef.current || !contentRef.current || containerData.state !== ContainerState.NORMAL || containerData.isMoving) {
                return;
            }

            const classesBefore = contentRef.current.className;
            contentRef.current.classList.remove(styles.fillHeight);
            contentRef.current.classList.add("resizing");

            const realDimension = getDimensions();

            if (!realDimension) {
                contentRef.current.className = classesBefore;
                return;
            }

            if (defaultWidth && windowContainerRef.current && resizeWidth) {
                const currentWidth = window.innerWidth - realDimension.left - realDimension.right;
                if (currentWidth !== defaultWidth) {
                    changeDimensionWidth(realDimension, defaultWidth - currentWidth);
                    windowContainerRef.current.style.right = `${realDimension.right}px`;
                    windowContainerRef.current.style.left = `${realDimension.left}px`;
                }
            }

            // element.clientHeight is rounded, use unrounded values
            const contentClientHeight = parseFloat(getComputedStyle(contentRef.current).height);

            let diffY = contentRef.current.scrollHeight - Math.round(contentClientHeight);
            const diffX = !resizeWidth ? 0 : contentRef.current.scrollWidth - contentRef.current.clientWidth;

            if (diffY === 0) {
            const windowClientHeight = parseFloat(getComputedStyle(windowRef.current).height);
            const titleClientHeight = parseFloat(getComputedStyle(titleRef.current).height);
                diffY =
                    titleClientHeight + contentClientHeight - windowClientHeight;
            }

            if (!resizeHeight) {
                diffY = 0;
            }

            if (resizeHeight) {
                setShouldResizeToContent(id, resizeWidth ? ResizeToContentEnum.RESIZE : ResizeToContentEnum.HEIGHT_ONLY);
            } else if (resizeWidth) {
                setShouldResizeToContent(id, ResizeToContentEnum.WIDTH_ONLY);
            } else {
                setShouldResizeToContent(id, ResizeToContentEnum.NONE);
            }
            contentRef.current.className = classesBefore;

            changeDimension(realDimension, diffX, diffY);
            checkWindowDimension(realDimension);
            setDimension(checkWindowDimension(realDimension), true);
        }, [containerData.state, containerData.isMoving, getDimensions, defaultWidth, setDimension, setShouldResizeToContent, id]);

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

        const checkResizeToContent = useCallback(() => {
            if (!userIsResizing.current && shouldResizeToContent !== ResizeToContentEnum.NONE && activeWindowId !== draggingWindowId && containerData.state === ContainerState.NORMAL) {
                resizeToContent(shouldResizeToContent === ResizeToContentEnum.WIDTH_ONLY || shouldResizeToContent === ResizeToContentEnum.RESIZE, shouldResizeToContent === ResizeToContentEnum.HEIGHT_ONLY || shouldResizeToContent === ResizeToContentEnum.RESIZE);
            }
        }, [containerData.state, draggingWindowId, resizeToContent, shouldResizeToContent, activeWindowId]);

        const onMouseDown = useCallback(() => {
            if (!containerData.isLocked) {
                setIsMoving(true);
            }
        }, [containerData.isLocked, setIsMoving]);

        const onMouseMove = useCallback(
            (diff: Position) => {
                if (!resizeStartDimension) {
                    return;
                }

                const newDimension = {...resizeStartDimension};
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

                const changedHeight = resizeStartDimension.bottom !== newDimension.bottom || resizeStartDimension.top !== newDimension.top;
                const changedWidth = resizeStartDimension.left !== newDimension.left || resizeStartDimension.right !== newDimension.right;

                if (shouldResizeToContent !== ResizeToContentEnum.NONE) {
                    if ((changedWidth && changedHeight) || (shouldResizeToContent === ResizeToContentEnum.WIDTH_ONLY && changedWidth) || (shouldResizeToContent === ResizeToContentEnum.HEIGHT_ONLY && changedHeight)) {
                        setShouldResizeToContent(id, ResizeToContentEnum.NONE);
                    } else if (shouldResizeToContent === ResizeToContentEnum.RESIZE) {
                        if (changedHeight) {
                            setShouldResizeToContent(id, ResizeToContentEnum.WIDTH_ONLY);
                        } else if (changedWidth) {
                            setShouldResizeToContent(id, ResizeToContentEnum.HEIGHT_ONLY);
                        }
                    }
                }

                setActive();
                setDimension(newDimension);
            },
            [id, resizeDirection, resizeStartDimension, setActive, setDimension, setShouldResizeToContent, shouldResizeToContent]
        );

        const onMouseUp = useCallback(() => {
            setIsMoving(false);
            userIsResizing.current = false;
            checkResizeToContent();
        }, [setIsMoving, checkResizeToContent]);

        const onDragDown = useOnMouseDrag({onMouseMove, onMouseDown, onMouseUp});

        const onResizeStart = useCallback(
            (e: ReactPointerEvent, direction: ResizeDirection) => {
                userIsResizing.current = true;
                setResizeDirection(direction);
                onDragDown(e);
                setResizeStartDimension(dimension);
            },
            [dimension, onDragDown]
        );

        const openInNewWindow = useCallback(
            (force = false) => {
                if ((!force && state === ContainerState.POPUP) || !containerRef.current) {
                    return;
                }
                const windowProxy = window.open('', '', 'modal=yes');
                if (windowProxy === null) {
                    // showToast('cannot open popup :(');
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
                titleElement.innerText = activeWindowData?.title ?? '';
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
            [portalContainer, setContainerState, state, activeWindowData?.title]
        );

        const realRef = useMemo(() => ({
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
            checkResizeToContent() {
                if (!disabled && state !== ContainerState.POPUP) {
                    checkResizeToContent();
                }
            }
        }), [checkResizeToContent, disabled, openInNewWindow, resizeToContent, state, toggleMaximized, toggleMinimized]);

        useImperativeHandle(ref, () => realRef, [realRef]);

        const updateContainerRef = useCallback(
            (element: HTMLSpanElement | null) => {
                containerRef.current = element ?? undefined;
                if (element && state !== ContainerState.POPUP) {
                    element.appendChild(portalContainer);
                }
            },
            [portalContainer, state]
        );

        const resizeInBothDirections = useCallback(() => resizeToContent(true, true), [resizeToContent]);
        const resizeToWidth = useCallback(() => {
            resizeToContent(true, false);
        }, [resizeToContent]);
        const resizeToHeight = useCallback(() => resizeToContent(false, true), [resizeToContent]);

        // Effects
        useEffect(() => {
            if (disabled) {
                return;
            }

            if (!dimension) {
                setDimension(getDimensions());
            }
        }, [dimension, disabled, getDimensions, setDimension]);

        useEffect(() => setIsClient(true), []);

        useEffect(() => {
            if (!contentRef.current) {
                return undefined;
            }

            const observer = new ResizeObserver((entries) => {
                const [entry] = entries;
                if (!entry || shouldResizeToContent === ResizeToContentEnum.NONE) {
                    return;
                }
                checkResizeToContent();
            });

            observer.observe(contentRef.current);
            return () => {
                observer.disconnect();
            };
            // ActiveWindowId change changes ref
        }, [checkResizeToContent, shouldResizeToContent, activeWindowId]);

        useOnce(() => {
            if (disabled) {
                return;
            }

            if (state === ContainerState.POPUP) {
                openInNewWindow(true);
            }
        }, !!activeWindowData);

        // Other
        const realButtons = useMemo(() => {
            const newButtons: WindowButtonData[] = [
                {
                    key: 'minimize-button',
                    icon: state === ContainerState.MINIMIZED ? faWindowRestore : faWindowMinimize,
                    onClick: toggleMinimized,
                    title: state === ContainerState.MINIMIZED ? t('window.button.restore') : t('window.button.minimize'),
                    order: 10,
                },
                {
                    key: 'maximize-button',
                    icon: state === ContainerState.MAXIMIZED ? faWindowRestore : faWindowMaximize,
                    onClick: toggleMaximized,
                    title: state === ContainerState.MAXIMIZED ? t('window.button.restore') : t('window.button.maximize'),
                    order: 20,
                },
            ];

            if (containerData.isLocked) {
                newButtons.push({
                    key: 'unlock-button',
                    icon: faThumbtack,
                    onClick: unlock,
                    title: t("window.button.unlock"),
                    order: 5,
                    className: styles.lockedIcon
                });
            }

            if (canCloseContainer) {
                newButtons.push({
                    key: 'close-button',
                    icon: faClose,
                    onClick: () => closeContainer(id),
                    title: t("window.button.close"),
                    order: 30
                });
            }

            return newButtons.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }, [id, canCloseContainer, closeContainer, state, toggleMinimized, t, toggleMaximized, containerData.isLocked, unlock]);

        const menuItems = useMemo(() => {
            const items: MenuItemType[] = [];

            if (state !== ContainerState.POPUP && !containerData.isLocked) {
                items.push({
                    key: "lock",
                    label: t("window.menu-item.lock"),
                    callback: lock,
                });
            }

            if (state === ContainerState.NORMAL) {
                items.push({
                    key: 'resize',
                    label: t("window.menu-item.resize"),
                    callback: resizeToContent,
                });
            }
            items.push({
                key: 'openInWindow',
                label: t('window.menu-item.open-window'),
                callback: openInNewWindow,
            });
            return items;
        }, [state, containerData.isLocked, t, openInNewWindow, lock, resizeToContent]);

        const renderTitle = () => (
            <Inline className={classNames(className, styles.fullWidth)} ref={titleRef}>
                <Flex horizontal={true} className={classNames(styles.title)}>
                    <TitleTabBar
                        storeId={store}
                        containerId={id}
                        style={{width: `calc(100% - ${buttonWidth}px)`}}
                        titleInfos={titleInfos}
                        isLocked={containerData.isLocked}
                        onMoveUpdate={setIsMoving}
                    />
                    <SizeCalculator onSize={setButtonWidth}>
                        <InlineBlock className={styles.titleButtons}>
                            {realButtons?.map((b) => (
                                <WindowButton {...b} containerState={state}/>
                            ))}
                            <WindowButton icon={faEllipsisV} onClick={openMenu} containerState={state}/>
                            <Menu items={menuItems} x={menuX} y={menuY} isOpen={isMenuOpen} onClose={closeMenu}/>
                        </InlineBlock>
                    </SizeCalculator>
                </Flex>
            </Inline>
        );

        // Render Functions

        if (!activeWindowData) {
            return null;
        }

        return (
            <Clickable onClick={setActive} onClickData={id} ref={updateContainerRef}>
                {createPortal(
                    <WindowContext.Provider value={windowObject}>
                        <WindowContainerRefContext.Provider value={realRef}>
                            <Flex
                                className={classNames(styles.windowContainer, activeWindowData?.className, {
                                    [styles.minimized]: state === ContainerState.MINIMIZED,
                                    [styles.maximized]: state === ContainerState.MAXIMIZED,
                                    [styles.popup]: state === ContainerState.POPUP,
                                    [styles.moving]: isMoving,
                                    [styles.active]: isActive,
                                    [styles.disabled]: disabled,
                                })}
                                style={{
                                    ...(activeWindowData?.style ?? {}),
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
                                        onPointerDown={onResizeStart}
                                        onPointerDownData="tl"
                                        onDoubleClick={resizeInBothDirections}
                                    />
                                    <Clickable
                                        className={classNames(styles.resize, styles.y)}
                                        onPointerDown={onResizeStart}
                                        onPointerDownData="top"
                                        onDoubleClick={resizeToHeight}
                                    />
                                    <Clickable
                                        className={classNames(styles.resize, styles.edge, styles.ne)}
                                        onPointerDown={onResizeStart}
                                        onPointerDownData="tr"
                                        onDoubleClick={resizeInBothDirections}
                                    />
                                </Flex>
                                <Grow className={classNames(styles.fullWidth, styles.overflowHidden)}>
                                    <Flex
                                        horizontal={true}
                                        className={classNames(styles.stretchItems, styles.fullHeight)}
                                    >
                                        <Clickable
                                            className={classNames(styles.resize, styles.x)}
                                            onPointerDown={onResizeStart}
                                            onPointerDownData="left"
                                            onDoubleClick={resizeToWidth}
                                        />
                                        <Grow className={styles.overflowXAuto}>
                                            <Block className={styles.window} ref={windowRef}>
                                                {renderTitle()}
                                                {ObjectHelper.values(windowDatas).map((windowData) => {
                                                    return <Block
                                                        key={windowData.id}
                                                        className={classNames(styles.content, {
                                                            [styles.fillHeight]: activeWindowData?.fillHeight,
                                                            [styles.hidden]: windowData?.id !== activeWindowId,
                                                        })}
                                                        __allowChildren="all"
                                                        ref={activeWindowId === windowData.id ? contentRef : undefined}
                                                    >
                                                        {windowData?.children}
                                                    </Block>;
                                                })}
                                            </Block>
                                        </Grow>
                                        <Clickable
                                            className={classNames(styles.resize, styles.x)}
                                            onPointerDown={onResizeStart}
                                            onPointerDownData="right"
                                            onDoubleClick={resizeToWidth}
                                        />
                                    </Flex>
                                </Grow>
                                <Flex horizontal={true} className={styles.fullWidth}>
                                    <Clickable
                                        className={classNames(styles.resize, styles.edge, styles.sw)}
                                        onPointerDown={onResizeStart}
                                        onPointerDownData="bl"
                                        onDoubleClick={resizeInBothDirections}
                                    />
                                    <Clickable
                                        className={classNames(styles.resize, styles.y)}
                                        onPointerDown={onResizeStart}
                                        onPointerDownData="bottom"
                                        onDoubleClick={resizeToHeight}
                                    />
                                    <Clickable
                                        className={classNames(styles.resize, styles.edge, styles.se)}
                                        onPointerDown={onResizeStart}
                                        onPointerDownData="br"
                                        onDoubleClick={resizeInBothDirections}
                                    />
                                </Flex>
                            </Flex>
                        </WindowContainerRefContext.Provider>
                    </WindowContext.Provider>,
                    portalContainer
                )}
            </Clickable>
        );
    },
    styles,
    'html'
);
