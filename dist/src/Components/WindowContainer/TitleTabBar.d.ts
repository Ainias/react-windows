import { RbmComponentProps } from '@ainias42/react-bootstrap-mobile';
export type TitleTabBarProps = RbmComponentProps<{
    storeId: string;
    containerId: string;
    titleInfos: {
        id: string;
        title: string;
    }[];
    onMoveUpdate: (isMoving: boolean) => void;
    disabled?: boolean;
}>;
export declare const TitleTabBar: ({ storeId, containerId, style, className, titleInfos, onMoveUpdate, }: TitleTabBarProps) => JSX.Element;
