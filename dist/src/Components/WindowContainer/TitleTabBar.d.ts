import { RbmComponentProps } from '@ainias42/react-bootstrap-mobile';
export type TitleTabBarProps = RbmComponentProps<{
    storeId: string;
    containerId: string;
    titleInfos: {
        id: string;
        title: string;
    }[];
    onMoveUpdate: (isMoving: boolean) => void;
    isLocked: boolean;
}>;
export declare const TitleTabBar: ({ storeId, containerId, style, className, titleInfos, onMoveUpdate, isLocked }: TitleTabBarProps) => JSX.Element;
