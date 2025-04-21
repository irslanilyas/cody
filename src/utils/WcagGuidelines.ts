/**
 * WCAG 2.1 guidelines and requirements reference
 */

export interface WCAGGuideline {
    id: string;
    name: string;
    level: "A" | "AA" | "AAA";
    summary: string;
    details: string;
    url: string;
  }
  
  /**
   * Map of WCAG guidelines related to visual design and accessibility
   */
  export const WCAG_GUIDELINES: Record<string, WCAGGuideline> = {
    "1.1.1": {
      id: "1.1.1",
      name: "Non-text Content",
      level: "A",
      summary: "All non-text content has a text alternative.",
      details: "All non-text content that is presented to the user has a text alternative that serves the equivalent purpose, except for specific situations.",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html"
    },
    "1.3.1": {
      id: "1.3.1",
      name: "Info and Relationships",
      level: "A",
      summary: "Information, structure, and relationships can be programmatically determined.",
      details: "Information, structure, and relationships conveyed through presentation can be programmatically determined or are available in text.",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html"
    },
    "1.3.2": {
      id: "1.3.2",
      name: "Meaningful Sequence",
      level: "A",
      summary: "The reading order of content is logical and intuitive.",
      details: "When the sequence in which content is presented affects its meaning, a correct reading sequence can be programmatically determined.",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/meaningful-sequence.html"
    },
    "1.4.1": {
      id: "1.4.1",
      name: "Use of Color",
      level: "A",
      summary: "Color is not the only visual means of conveying information.",
      details: "Color is not used as the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element.",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html"
    },
    "1.4.3": {
      id: "1.4.3",
      name: "Contrast (Minimum)",
      level: "AA",
      summary: "Text has sufficient contrast against its background.",
      details: "The visual presentation of text and images of text has a contrast ratio of at least 4.5:1, except for large text (3:1), incidental text, or logotypes.",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html"
    },
    "1.4.4": {
      id: "1.4.4",
      name: "Resize Text",
      level: "AA",
      summary: "Text can be resized without loss of content or functionality.",
      details: "Except for captions and images of text, text can be resized without assistive technology up to 200 percent without loss of content or functionality.",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html"
    },
    "1.4.6": {
      id: "1.4.6",
      name: "Contrast (Enhanced)",
      level: "AAA",
      summary: "Text has enhanced contrast against its background.",
      details: "The visual presentation of text and images of text has a contrast ratio of at least 7:1, except for large text (4.5:1), incidental text, or logotypes.",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced.html"
    },
    "1.4.8": {
      id: "1.4.8",
      name: "Visual Presentation",
      level: "AAA",
      summary: "Text is presented in a way that is easy to read.",
      details: "For blocks of text, users can select foreground and background colors, width is no more than 80 characters, text is not fully justified, line spacing is at least 1.5, and text can be resized without requiring horizontal scrolling.",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html"
    },
    "1.4.11": {
      id: "1.4.11",
      name: "Non-text Contrast",
      level: "AA",
      summary: "User interface components and graphical objects have sufficient contrast.",
      details: "The visual presentation of UI components and graphical objects have a contrast ratio of at least 3:1 against adjacent colors.",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html"
    },
    "2.1.1": {
      id: "2.1.1",
      name: "Keyboard",
      level: "A",
      summary: "All functionality is available from a keyboard.",
      details: "All functionality of the content is operable through a keyboard interface without requiring specific timings for individual keystrokes.",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html"
    },
    "2.4.3": {
      id: "2.4.3",
      name: "Focus Order",
      level: "A",
      summary: "Focus moves in a logical order when navigating with a keyboard.",
      details: "If a web page can be navigated sequentially and the navigation sequences affect meaning or operation, focusable components receive focus in an order that preserves meaning and operability.",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html"
    },
    "2.4.7": {
      id: "2.4.7",
      name: "Focus Visible",
      level: "AA",
      summary: "Keyboard focus is visible.",
      details: "Any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible.",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html"
    },
    "2.5.5": {
      id: "2.5.5",
      name: "Target Size",
      level: "AAA",
      summary: "Touch targets are large enough to interact with.",
      details: "The size of the target for pointer inputs is at least 44 by 44 CSS pixels, except when the target is available through an equivalent link or control on the same page.",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/target-size.html"
    }
  };
  
  /**
   * Gets a WCAG guideline by ID
   * @param id The WCAG guideline ID (e.g., "1.4.3")
   * @returns The guideline information or undefined if not found
   */
  export function getGuideline(id: string): WCAGGuideline | undefined {
    return WCAG_GUIDELINES[id];
  }
  
  /**
   * Gets all guidelines at a specific conformance level
   * @param level The conformance level ("A", "AA", or "AAA")
   * @returns Array of guidelines at the specified level
   */
  export function getGuidelinesByLevel(level: "A" | "AA" | "AAA"): WCAGGuideline[] {
    return Object.values(WCAG_GUIDELINES).filter(guideline => guideline.level === level);
  }
  
  /**
   * Gets the required contrast ratio for text based on its size and conformance level
   * @param fontSize Font size in pixels
   * @param isBold Whether the font is bold
   * @param level Conformance level ("AA" or "AAA")
   * @returns Required contrast ratio
   */
  export function getRequiredContrastRatio(
    fontSize: number, 
    isBold: boolean, 
    level: "AA" | "AAA" = "AA"
  ): number {
    // Large text is defined as 18pt (24px) or 14pt (18.67px) and bold
    const isLargeText = fontSize >= 24 || (fontSize >= 18.67 && isBold);
    
    if (level === "AAA") {
      return isLargeText ? 4.5 : 7.0;
    } else { // AA
      return isLargeText ? 3.0 : 4.5;
    }
  }
  
  /**
   * Gets the required touch target size based on platform guidelines
   * @param platform The target platform ("web", "ios", "android", "windows")
   * @returns Required touch target size in pixels
   */
  export function getRequiredTouchTargetSize(platform: "web" | "ios" | "android" | "windows" = "web"): number {
    switch (platform) {
      case "ios":
        return 44; // Apple recommends 44x44 points
      case "android":
        return 48; // Google recommends 48x48 dp
      case "windows":
        return 40; // Microsoft recommends 40x40 pixels
      case "web":
      default:
        return 44; // WCAG 2.5.5 recommends 44x44 CSS pixels
    }
  }