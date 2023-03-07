import React, { useCallback, useEffect } from 'react';
import { Clickable, InlineBlock, RbmComponentProps, withMemo, Text, WithStringProps } from 'react-bootstrap-mobile';
import classNames from 'classnames';
import styles from './windowContainer.scss';
import { useDrag } from 'react-dnd';
import { getDragType } from '../helper/getDragType';
import { getWindowStore } from '../store/createWindowStore';
import { getEmptyImage } from 'react-dnd-html5-backend';

export type TitleTabProps = RbmComponentProps<
    { id: string; isActive: boolean; onClick: (id: string) => void; storeId: string; isHidden?: boolean },
    WithStringProps
>;

export const TitleTab = withMemo(
    function TitleTab({ id, children, isActive, onClick, className, storeId, style, isHidden = false }: TitleTabProps) {
        // Variables

        // Refs

        // States
        const useStore = getWindowStore(storeId);
        const moveToOwnContainer = useStore((s) => s.moveWindowToOwnContainer);

        const [, dragRef, previewRef] = useDrag(
            () => ({
                type: getDragType(storeId),
                item: { id, title: children },
                collect: (monitor) => ({
                    isDragging: monitor.isDragging(),
                }),
                end: (item, monitor) => {
                    if (!monitor.didDrop()) {
                        moveToOwnContainer(item.id, monitor.getSourceClientOffset());
                    }
                },
            }),
            [storeId, id, children, moveToOwnContainer]
        );

        // Selectors

        // Callbacks
        const onClickInner = useCallback(() => {
            console.log('LOG-d onClick');
            onClick(id);
        }, [id, onClick]);

        // Effects
        useEffect(() => {
            previewRef(getEmptyImage());
        }, [previewRef]);

        // Other

        // Render Functions

        return (
            <InlineBlock
                className={classNames(
                    styles.titleTab,
                    {
                        [styles.titleTabActive]: isActive,
                        [styles.titleTabHidden]: isHidden,
                    },
                    className
                )}
                style={style}
                ref={dragRef}
            >
                <Clickable onClick={onClickInner} preventDefault={false}>
                    <Text className={styles.titleText}>{children}</Text>
                </Clickable>
            </InlineBlock>
        );
    },
    styles,
    'text'
);
