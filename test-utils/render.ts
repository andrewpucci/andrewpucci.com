export function render(html: string): Element | null {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);
  return wrapper.firstElementChild;
}

export function cleanup(): void {
  document.body.innerHTML = '';
}
