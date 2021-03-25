/**
 * These are assets that our django rendered templates load
 *
 * We are using a "fake" entrypoint so that these assets are run through webpack
 * so that we can attach a contenthash to the filenames so that they can be cached long term.
 */
import 'sentry-images/favicon.png';
import 'sentry-images/logos/apple-touch-icon.png';
import 'sentry-images/logos/apple-touch-icon-76x76.png';
import 'sentry-images/logos/apple-touch-icon-120x120.png';
import 'sentry-images/logos/apple-touch-icon-152x152.png';
import 'sentry-images/logos/logo-sentry.svg';
