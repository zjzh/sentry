import '@emotion/react';

import color from 'color';

import CHART_PALETTE from 'app/constants/chartPalette';
import {DataCategory} from 'app/types';

const lightColors = {
  // todo
  black: '#1a1a1a',
  white: 'rgba(255, 255, 255, 1)',

  surface100: 'rgba(250, 249, 251, 1)',
  surface200: 'rgba(255, 255, 255, 1)',
  surface300: 'rgba(255, 255, 255, 1)',

  gray500: 'rgba(43, 34, 51, 1)',
  gray400: 'rgba(77, 65, 88, 1)',
  gray300: 'rgba(128, 112, 143, 1)',
  gray200: 'rgba(219, 214, 225, 1)',
  gray100: 'rgba(235, 230, 239, 1)',

  inverted: '#FFFFFF',

  purple300: 'rgba(108, 95, 199, 1)',
  purple200: 'rgba(108, 95, 199, 0.5)',
  purple100: 'rgba(108, 95, 199, 0.1)',

  blue300: 'rgba(61, 116, 219, 1)',
  blue200: 'rgba(61, 116, 219, 0.5)',
  blue100: 'rgba(61, 116, 219, 0.1)',

  green300: 'rgba(43, 161, 133, 1)',
  green200: 'rgba(43, 161, 133, 0.5)',
  green100: 'rgba(43, 161, 133, 0.1)',

  yellow300: 'rgba(245, 176, 0, 1)',
  yellow200: 'rgba(245, 176, 0, 0.5)',
  yellow100: 'rgba(245, 176, 0, 0.1)',

  red300: 'rgba(245, 84, 89, 1)',
  red200: 'rgba(245, 84, 89, 0.5)',
  red100: 'rgba(245, 84, 89, 0.1)',

  pink300: 'rgba(239, 77, 121, 1)',
  pink200: 'rgba(239, 77, 121, 0.5)',
  pink100: 'rgba(239, 77, 121, 0.1)',
};

const darkColors = {
  // todo
  black: '#1a1a1a',
  white: 'rgba(255, 255, 255, 1)',

  surface100: 'rgba(26, 20, 31, 1)',
  surface200: 'rgba(34, 27, 40, 1)',
  surface300: 'rgba(41, 35, 47, 1)',

  gray500: 'rgba(235, 230, 239, 1)',
  gray400: 'rgba(214, 208, 220, 1)',
  gray300: 'rgba(153, 141, 165, 1)',
  gray200: 'rgba(67, 56, 76, 1)',
  gray100: 'rgba(52, 43, 59, 1)',

  inverted: '#FFFFFF',

  purple300: 'rgba(118, 105, 211, 1)',
  purple200: 'rgba(118, 105, 211, 0.4)',
  purple100: 'rgba(118, 105, 211, 0.06)',

  blue300: 'rgba(92, 149, 255, 1)',
  blue200: 'rgba(92, 149, 255, 0.4)',
  blue100: 'rgba(92, 149, 255, 0.06)',

  green300: 'rgba(42, 200, 163, 1)',
  green200: 'rgba(42, 200, 163, 0.4)',
  green100: 'rgba(42, 200, 163, 0.06)',

  yellow300: 'rgba(255, 194, 39, 1)',
  yellow200: 'rgba(255, 194, 39, 0.4)',
  yellow100: 'rgba(255, 194, 39, 0.06)',

  red300: 'rgba(250, 79, 84, 1)',
  red200: 'rgba(250, 79, 84, 0.4)',
  red100: 'rgba(250, 79, 84, 0.06)',

  pink300: 'rgba(250, 76, 124, 1)',
  pink200: 'rgba(250, 76, 124, 0.4)',
  pink100: 'rgba(250, 76, 124, 0.06)',
};

type BaseColors = typeof lightColors;

const generateAliases = (colors: BaseColors) => ({
  /**
   * Primary text color
   */
  textColor: colors.gray500,

  /**
   * Text that should not have as much emphasis
   */
  subText: colors.gray300,

  /**
   * Background for the main content area of a page?
   */
  bodyBackground: colors.surface100,

  /**
   * Primary background color
   */
  background: colors.surface200,

  /**
   * Secondary background color used as a slight contrast against primary background
   */
  backgroundSecondary: colors.surface100,

  /**
   * Background for the header of a page
   */
  headerBackground: colors.surface200,

  /**
   * Primary border color
   */
  border: colors.gray200,

  /**
   * Inner borders, e.g. borders inside of a grid
   */
  innerBorder: colors.gray100,

  /**
   * Border around modals
   */
  modalBorder: 'none',

  /**
   * Box shadow on the modal
   */
  modalBoxShadow: 'none',

  /**
   * A color that denotes a "success", or something good
   */
  success: colors.green300,

  /**
   * A color that denotes an error, or something that is wrong
   */
  error: colors.red300,

  /**
   * A color that indicates something is disabled where user can not interact or use
   * it in the usual manner (implies that there is an "enabled" state)
   */
  disabled: colors.gray300,
  disabledBorder: colors.gray100,

  /**
   * Indicates that something is "active" or "selected"
   */
  active: colors.purple300,

  /**
   * Indicates that something has "focus", which is different than "active" state as it is more temporal
   * and should be a bit subtler than active
   */
  focus: colors.surface100,

  /**
   * Inactive
   */
  inactive: colors.gray300,

  /**
   * Link color indicates that something is clickable
   */
  linkColor: colors.blue300,
  linkHoverColor: colors.blue300,

  /**
   * Secondary button colors
   */
  secondaryButtonBorder: colors.gray200,

  secondaryButtonText: colors.gray500,

  /**
   * Primary button colors
   */
  // todo
  primaryButtonBorder: '#3d328e',
  primaryButtonBorderActive: '#352b7b',

  /**
   * Form placeholder text color
   */
  formPlaceholder: colors.gray300,

  /**
   * Default form text color
   */
  formText: colors.gray400,

  /**
   * Form input border
   */
  formInputBorder: colors.gray200,

  /**
   *
   */
  rowBackground: colors.surface300,

  /**
   * Color of lines that flow across the background of the chart to indicate axes levels
   * (This should only be used for yAxis)
   */
  chartLineColor: colors.gray100,

  /**
   * Color for chart label text
   */
  chartLabel: colors.gray300,

  /**
   * Default Progressbar color
   */
  progressBar: colors.purple300,

  /**
   * Default Progressbar color
   */
  progressBackground: colors.gray100,

  /**
   * Background of default badge (mainly used in NavTabs)
   */
  badgeBackground: colors.gray200,

  /**
   * Overlay for partial opacity
   */
  // todo
  overlayBackgroundAlpha: color(colors.surface100).opaquer(0.7),

  /**
   * Tag progress bars
   */
  tagBarHover: colors.purple200,
  tagBar: colors.gray200,

  /**
   * Color for badge text
   */
  badgeText: colors.inverted,

  /**
   * Search filter "token" background
   */
  searchTokenBackground: {
    valid: colors.blue100,
    validActive: color(colors.blue100).darken(0.1).string(),
    invalid: colors.red100,
    invalidActive: color(colors.red100).darken(0.1).string(),
  },

  /**
   * Search filter "token" border
   */
  searchTokenBorder: {
    valid: colors.blue200,
    validActive: color(colors.blue200).darken(0.3).string(),
    invalid: colors.red200,
    invalidActive: color(colors.red200).darken(0.3).string(),
  },

  /**
   * Count on button when active
   */
  buttonCountActive: colors.inverted,

  /**
   * Count on button
   */
  buttonCount: colors.gray500,

  /**
   * Background of alert banners at the top
   */
  bannerBackground: colors.gray500,
});

const dataCategory = {
  [DataCategory.ERRORS]: CHART_PALETTE[4][3],
  [DataCategory.TRANSACTIONS]: CHART_PALETTE[4][2],
  [DataCategory.ATTACHMENTS]: CHART_PALETTE[4][1],
  [DataCategory.DEFAULT]: CHART_PALETTE[4][0],
};

const generateAlertTheme = (colors: BaseColors, alias: Aliases) => ({
  muted: {
    background: colors.gray200,
    backgroundLight: alias.backgroundSecondary,
    border: alias.border,
    iconColor: 'inherit',
  },
  info: {
    background: colors.blue300,
    backgroundLight: colors.blue100,
    border: colors.blue200,
    iconColor: colors.blue300,
  },
  warning: {
    background: colors.yellow300,
    backgroundLight: colors.yellow100,
    border: colors.yellow300,
    iconColor: colors.yellow300,
  },
  success: {
    background: colors.green300,
    backgroundLight: colors.green100,
    border: colors.green200,
    iconColor: colors.green300,
  },
  error: {
    background: colors.red300,
    backgroundLight: colors.red100,
    border: colors.red200,
    iconColor: colors.red300,
    textLight: colors.red200,
  },
});

const generateBadgeTheme = (colors: BaseColors, alias: Aliases) => ({
  default: {
    background: alias.badgeBackground,
    indicatorColor: alias.badgeBackground,
    color: alias.badgeText,
  },
  alpha: {
    background: `linear-gradient(90deg, ${colors.pink300}, ${colors.yellow300})`,
    indicatorColor: colors.pink300,
    color: alias.badgeText,
  },
  beta: {
    background: `linear-gradient(90deg, ${colors.purple300}, ${colors.pink300})`,
    indicatorColor: colors.purple300,
    color: alias.badgeText,
  },
  new: {
    background: `linear-gradient(90deg, ${colors.blue300}, ${colors.green300})`,
    indicatorColor: colors.green300,
    color: alias.badgeText,
  },
  review: {
    background: colors.purple300,
    indicatorColor: colors.purple300,
    color: alias.badgeText,
  },
  warning: {
    background: colors.yellow300,
    indicatorColor: colors.yellow300,
    color: alias.badgeText,
  },
});

const generateTagTheme = (colors: BaseColors) => ({
  default: {
    background: colors.gray100,
    iconColor: colors.purple300,
  },
  promotion: {
    background: colors.pink100,
    iconColor: colors.pink300,
  },
  highlight: {
    background: colors.purple100,
    iconColor: colors.purple300,
  },
  warning: {
    background: colors.yellow100,
    iconColor: colors.yellow300,
  },
  success: {
    background: colors.green100,
    iconColor: colors.green300,
  },
  error: {
    background: colors.red100,
    iconColor: colors.red300,
  },
  info: {
    background: colors.blue100,
    iconColor: colors.blue300,
  },
  white: {
    background: colors.surface200,
    iconColor: colors.gray500,
  },
  black: {
    background: colors.gray500,
    iconColor: colors.inverted,
  },
});

const level = (colors: BaseColors) => ({
  sample: colors.purple300,
  info: colors.blue300,
  warning: colors.yellow300,
  error: colors.pink300,
  fatal: colors.red300,
  default: colors.gray300,
});

const generateButtonTheme = (colors: BaseColors, alias: Aliases) => ({
  borderRadius: '3px',

  default: {
    color: alias.secondaryButtonText,
    colorActive: alias.secondaryButtonText,
    background: alias.background,
    backgroundActive: alias.background,
    border: alias.secondaryButtonBorder,
    borderActive: alias.secondaryButtonBorder,
    focusShadow: color(colors.gray200).alpha(0.5).string(),
  },
  primary: {
    color: colors.surface200,
    colorActive: colors.surface200,
    background: colors.purple300,
    backgroundActive: '#4e3fb4',
    border: alias.primaryButtonBorder,
    borderActive: alias.primaryButtonBorderActive,
    focusShadow: color(colors.purple300).alpha(0.4).string(),
  },
  success: {
    color: colors.surface200,
    colorActive: colors.surface200,
    background: '#3fa372',
    backgroundActive: colors.green300,
    border: '#7ccca5',
    borderActive: '#7ccca5',
    focusShadow: color(colors.green300).alpha(0.5).string(),
  },
  danger: {
    color: colors.surface200,
    colorActive: colors.surface200,
    background: colors.red300,
    backgroundActive: '#bf2a1d',
    border: '#bf2a1d',
    borderActive: '#7d1c13',
    focusShadow: color(colors.red300).alpha(0.5).string(),
  },
  link: {
    color: colors.blue300,
    colorActive: colors.blue300,
    background: 'transparent',
    border: false,
    borderActive: false,
    backgroundActive: 'transparent',
    focusShadow: false,
  },
  disabled: {
    color: alias.disabled,
    colorActive: alias.disabled,
    border: alias.disabledBorder,
    borderActive: alias.disabledBorder,
    background: alias.background,
    backgroundActive: alias.background,
    focusShadow: false,
  },
  form: {
    color: alias.textColor,
    colorActive: alias.textColor,
    background: alias.background,
    backgroundActive: alias.background,
    border: alias.formInputBorder,
    borderActive: alias.formInputBorder,
    focusShadow: false,
  },
});

const iconSizes = {
  xs: '12px',
  sm: '16px',
  md: '20px',
  lg: '24px',
  xl: '32px',
  xxl: '72px',
};

const commonTheme = {
  breakpoints: ['800px', '992px', '1200px', '1440px', '2560px'],

  ...lightColors,

  iconSizes,

  iconDirections: {
    up: '0',
    right: '90',
    down: '180',
    left: '270',
  },

  // Try to keep these ordered plz
  zIndex: {
    // Generic z-index when you hope your component is isolated and
    // does not need to battle others for z-index priority
    initial: 1,

    truncationFullValue: 10,

    traceView: {
      spanTreeToggler: 900,
      dividerLine: 909,
      rowInfoMessage: 910,
      minimapContainer: 999,
    },

    header: 1000,
    errorMessage: 1000,
    dropdown: 1001,

    dropdownAutocomplete: {
      // needs to be below actor but above other page elements (e.g. pagination)
      // (e.g. Issue Details "seen" dots on chart is 2)
      // stream header is 1000
      menu: 1007,

      // needs to be above menu
      actor: 1008,
    },

    globalSelectionHeader: 1009,

    settingsSidebarNavMask: 1017,
    settingsSidebarNav: 1018,
    sidebarPanel: 1019,
    sidebar: 1020,
    orgAndUserMenu: 1030,

    // Sentry user feedback modal
    sentryErrorEmbed: 1090,

    // If you change modal also update shared-components.less
    // as the z-index for bootstrap modals lives there.
    modal: 10000,
    toast: 10001,

    // tooltips and hovercards can be inside modals sometimes.
    hovercard: 10002,
    tooltip: 10003,

    // On mobile views org stats dropdowns overlap
    orgStats: {
      dataCategory: 1,
      timeRange: 2,
    },

    // On mobile views issue list dropdowns overlap
    issuesList: {
      stickyHeader: 1,
      sortOptions: 2,
      displayOptions: 3,
    },
  },

  grid: 8,

  borderRadius: '4px',
  borderRadiusBottom: '0 0 4px 4px',
  borderRadiusTop: '4px 4px 0 0',
  headerSelectorRowHeight: 44,
  headerSelectorLabelHeight: 28,

  dropShadowLightest: '0 0 2px rgba(43, 34, 51, 0.04)',
  dropShadowLight: '0 1px 4px rgba(43, 34, 51, 0.04)',
  dropShadowHeavy: '0 4px 24px rgba(43, 34, 51, 0.08)',

  // Relative font sizes
  fontSizeRelativeSmall: '0.9em',

  fontSizeExtraSmall: '11px',
  fontSizeSmall: '12px',
  fontSizeMedium: '14px',
  fontSizeLarge: '16px',
  fontSizeExtraLarge: '18px',
  headerFontSize: '22px',

  settings: {
    // Max-width for settings breadcrumbs
    // i.e. organization, project, or team
    maxCrumbWidth: '240px',

    containerWidth: '1440px',
    headerHeight: '69px',
    sidebarWidth: '220px',
  },

  sidebar: {
    background: '#2f2936',
    color: '#9586a5',
    divider: '#493e54',
    badgeSize: '22px',
    smallBadgeSize: '11px',
    collapsedWidth: '70px',
    expandedWidth: '220px',
    mobileHeight: '54px',
    menuSpacing: '15px',
  },

  text: {
    family: '"Rubik", "Avenir Next", sans-serif',
    familyMono: '"Roboto Mono", Monaco, Consolas, "Courier New", monospace',
    lineHeightHeading: '1.15',
    lineHeightBody: '1.4',
  },

  tag: generateTagTheme(lightColors),

  dataCategory,

  level,

  charts: {
    colors: CHART_PALETTE[CHART_PALETTE.length - 1],

    // We have an array that maps `number + 1` --> list of `number` colors
    getColorPalette: (length: number) =>
      CHART_PALETTE[Math.min(CHART_PALETTE.length - 1, length + 1)] as string[],

    previousPeriod: lightColors.gray200,
    symbolSize: 6,
  },

  diff: {
    removedRow: 'hsl(358deg 89% 65% / 15%)',
    removed: 'hsl(358deg 89% 65% / 30%)',
    addedRow: 'hsl(100deg 100% 87% / 18%)',
    added: 'hsl(166deg 58% 47% / 32%)',
  },

  // Similarity spectrum used in "Similar Issues" in group details
  similarity: {
    empty: '#e2dee6',
    colors: ['#ec5e44', '#f38259', '#f9a66d', '#98b480', '#57be8c'],
  },

  // used as a gradient,
  businessIconColors: ['#EA5BC2', '#6148CE'],

  demo: {
    headerSize: '70px',
  },
};

const lightAliases = generateAliases(lightColors);

export const lightTheme = {
  ...commonTheme,
  ...lightColors,
  ...lightAliases,
  /**
   * Gradient for sidebar
   */
  sidebarGradient:
    'linear-gradient(294.17deg,#2f1937 35.57%,#452650 92.42%,#452650 92.42%)',
  alert: generateAlertTheme(lightColors, lightAliases),
  badge: generateBadgeTheme(lightColors, lightAliases),
  button: generateButtonTheme(lightColors, lightAliases),
  tag: generateTagTheme(lightColors),
};

const darkAliases = generateAliases(darkColors);

export const darkTheme: Theme = {
  ...commonTheme,
  ...darkColors,
  ...darkAliases,
  /**
   * Gradient for sidebar
   */
  // todo
  sidebarGradient: 'linear-gradient(6.01deg, #1A1825 -8.44%, #1D1B28 85.02%)',
  alert: generateAlertTheme(darkColors, darkAliases),
  badge: generateBadgeTheme(darkColors, darkAliases),
  button: generateButtonTheme(darkColors, darkAliases),
  tag: generateTagTheme(lightColors),
};

export type Theme = typeof lightTheme;
export type Aliases = typeof lightAliases;

export type Color = keyof typeof lightColors;
export type IconSize = keyof typeof iconSizes;

export default commonTheme;

type MyTheme = Theme;

/**
 * Configure Emotion to use our theme
 */
declare module '@emotion/react' {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  export interface Theme extends MyTheme {}
}

// This should never be used directly (except in storybook)
export {lightAliases as aliases};
