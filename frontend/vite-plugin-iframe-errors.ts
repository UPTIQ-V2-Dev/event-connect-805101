import type { Plugin } from 'vite';

export function iframeErrorPropagation(): Plugin {
    return {
        name: 'iframe-error-propagation',

        transformIndexHtml(html: string) {
            if (process.env.NODE_ENV !== 'development') return html;

            const errorScript = `
        <script>
          // Helper to format any error as a string or undefined
          function formatErrorMessage(err) {
            if (!err) return undefined;

            // Axios error
            if (err.response?.data) {
              if (typeof err.response.data === 'string') {
                return err.response.data;
              }
              try {
                return JSON.stringify(err.response.data);
              } catch {
                // Not serializable, continue to next check
              }
            }


            // Normal Error
            if (err instanceof Error) return err.message || undefined;

            // Function
            if (typeof err === 'function') return '[Function: ' + (err.name || 'anonymous') + ']';

            // Primitive types (string, number, boolean)
            if (typeof err === 'string' || typeof err === 'number' || typeof err === 'boolean') {
              return String(err);
            }

            // Anything else (object, symbol, etc.) -> undefined
            return undefined;
          }

          // Send message to parent window
          function sendToParent(data) {
            if (window.parent !== window) {
              window.parent.postMessage(data, '*');
            }
          }

          // Capture runtime errors
          window.addEventListener('error', (event) => {
            sendToParent({
              type: 'RUNTIME_ERROR',
              message: formatErrorMessage(event.error) || 'Runtime Error',
              stack: event.error?.stack,
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno
            });
          });

          // Capture unhandled promise rejections
          window.addEventListener('unhandledrejection', (event) => {
            sendToParent({
              type: 'UNHANDLED_REJECTION',
              message: formatErrorMessage(event.reason) || 'Unhandled Rejection',
              stack: event.reason?.stack
            });
          });

          // Capture console.error
          (function() {
            const origConsoleError = console.error;
            console.error = function(...args) {
              sendToParent({
                type: 'CONSOLE_ERROR',
                message: args.map(formatErrorMessage).filter(Boolean).join(' '),
                stack: args.find(a => a instanceof Error)?.stack
              });
              origConsoleError.apply(console, args);
            };
          })();
        </script>
      `;

            return html.replace('<head>', `<head>${errorScript}`);
        }
    };
}
