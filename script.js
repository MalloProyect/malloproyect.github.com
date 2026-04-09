const countElement = document.getElementById('count');
const incClicksElement = document.getElementById('incClicks');
const decClicksElement = document.getElementById('decClicks');

const incrementButton = document.getElementById('increment');
const decrementButton = document.getElementById('decrement');

let count = 0;
let incClicks = 0;
let decClicks = 0;

function nextClicksValue(current) {
  const updated = current + 1;
  return updated > 10 ? 1 : updated;
}

function render() {
  countElement.textContent = count;
  incClicksElement.textContent = incClicks;
  decClicksElement.textContent = decClicks;
}

incrementButton.addEventListener('click', () => {
  count += 1;
  incClicks = nextClicksValue(incClicks);
  render();
});

decrementButton.addEventListener('click', () => {
  count -= 1;
  decClicks = nextClicksValue(decClicks);
  render();
});

render();
