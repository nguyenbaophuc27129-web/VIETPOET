declare module 'react-simple-maps' {
  export interface GeographyProps {
    geography: any;
    onMouseEnter?: (geography: any) => void;
    onMouseLeave?: () => void;
    onClick?: (geography: any) => void;
    style?: any;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  }

  export interface GeographiesProps {
    geography: any;
    children: (props: { geographies: any[] }) => React.ReactNode;
  }

  export const Geography: React.FC<GeographyProps>;
  export const Geographies: React.FC<GeographiesProps>;
  export const ComposableMap: React.FC<any>;
  export const ZoomableGroup: React.FC<any>;
  export const Marker: React.FC<any>;

  export default { Geography, Geographies, ComposableMap, ZoomableGroup, Marker };
}
