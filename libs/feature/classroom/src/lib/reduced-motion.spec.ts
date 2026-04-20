import { AvatarComponent } from './avatar.component';
import { MicButtonComponent } from './mic-button.component';

/**
 * Regression guard for SEV-31 acceptance: avatar states + mic pulse must
 * honour `prefers-reduced-motion: reduce` across every animated element
 * listed in states-gallery §6. The test inspects component-level styles
 * directly so the gate trips if anyone removes a selector from the
 * reduced-motion block.
 */
function componentStyles(component: { ɵcmp?: { styles?: readonly string[] } }): string {
  const styles = component.ɵcmp?.styles;
  if (!styles?.length) {
    throw new Error('component has no styles metadata');
  }
  return styles.join('\n');
}

describe('reduced-motion — Classroom (SEV-31)', () => {
  it('Avatar collapses halo, mouth, thinking-dots, and idle-breathe under prefers-reduced-motion', () => {
    const css = componentStyles(AvatarComponent as unknown as { ɵcmp: { styles: string[] } });
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    const mediaBlockMatch = css.match(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[^{]*\{([\s\S]*?\}\s*)\}/
    );
    expect(mediaBlockMatch).withContext('avatar must declare a reduced-motion block').not.toBeNull();
    const body = mediaBlockMatch![1];
    expect(body).toContain('.mc-avatar__halo');
    expect(body).toContain('.mc-avatar__mouth');
    expect(body).toContain('.mc-avatar__thinking-dots');
    expect(body).toMatch(/data-state=['"]idle['"]\]\s*(\[_ngcontent-[^\]]*\])?\s+\.mc-avatar__frame/);
    expect(body).toMatch(/animation:\s*none/);
  });

  it('MicButton collapses halo + amp pulses under prefers-reduced-motion', () => {
    const css = componentStyles(MicButtonComponent as unknown as { ɵcmp: { styles: string[] } });
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    const mediaBlockMatch = css.match(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[^{]*\{([\s\S]*?\}\s*)\}/
    );
    expect(mediaBlockMatch).withContext('mic-button must declare a reduced-motion block').not.toBeNull();
    const body = mediaBlockMatch![1];
    expect(body).toContain('.mc-mic__halo');
    expect(body).toContain('.mc-mic__amp');
    expect(body).toMatch(/animation:\s*none/);
  });
});
