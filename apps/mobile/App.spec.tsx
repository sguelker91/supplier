/**
 * Rendering-Test für die Bootstrap-App-Shell (jest-expo-Preset,
 * react-test-renderer).
 */
import { act, create } from 'react-test-renderer';

import App from './App';

describe('App (Bootstrap-Shell)', () => {
  it('rendert ohne Fehler', async () => {
    let tree: ReturnType<typeof create>;
    await act(async () => {
      tree = create(<App />);
    });
    expect(tree!.toJSON()).toBeTruthy();
  });
});
