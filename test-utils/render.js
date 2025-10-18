/**
 * Utility function to render a component for testing
 * @param {string} html - HTML string to render
 * @returns {HTMLElement} - The rendered element
 */
export function render(html) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);
  return wrapper.firstElementChild;
}

/**
 * Cleans up the test environment
 */
export function cleanup() {
  document.body.innerHTML = '';
}
