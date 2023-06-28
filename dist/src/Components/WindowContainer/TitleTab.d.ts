import { RbmComponentProps, WithStringProps } from '@ainias42/react-bootstrap-mobile';
export type TitleTabProps = RbmComponentProps<{
    id: string;
    isActive: boolean;
    onClick: (id: string) => void;
    isHidden?: boolean;
    storeId: string;
}, WithStringProps>;
export declare const TitleTab: ({ id, children, isActive, onClick, className, style, isHidden, storeId }: TitleTabProps) => JSX.Element;
