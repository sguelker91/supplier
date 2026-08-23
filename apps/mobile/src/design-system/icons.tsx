/**
 * Handgezeichnete, strichbasierte Icons (react-native-svg), Pendant zu
 * `apps/web/src/design-system/icons.tsx`. Bewusst keine Icon-Font-
 * Bibliothek für zwei Icons.
 */
import { Circle, Path, Rect, Svg } from 'react-native-svg';

export function DocumentIcon(props: { size?: number; color?: string }) {
  const { size = 20, color = '#000' } = props;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 3h7l5 5v13H7z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M14 3v5h5" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M10 13h6M10 17h6" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function TruckIcon(props: { size?: number; color?: string }) {
  const { size = 20, color = '#000' } = props;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={10} width={10} height={7} rx={1} stroke={color} strokeWidth={1.6} />
      <Path d="M14 12h3.2L20 15v2h-6" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Circle cx={8} cy={19} r={1.6} stroke={color} strokeWidth={1.4} />
      <Circle cx={17} cy={19} r={1.6} stroke={color} strokeWidth={1.4} />
    </Svg>
  );
}

export function BrandMarkIcon(props: { size?: number; color?: string }) {
  const { size = 24, color = '#000' } = props;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20 L4 12 C4 8 7 5 12 5 C17 5 20 8 20 12 L20 20"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path d="M4 20 L20 20" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M12 5 L12 13" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
