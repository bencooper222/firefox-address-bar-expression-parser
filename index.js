import { evaluate } from 'mathjs';

browser.omnibox.setDefaultSuggestion({
  description: `Do most mathematical computations.`,
});

const cb = (text, suggest) => {
  const data = evaluate(text);
  suggest([{ description: String(data), content: String(data) }]);
}

browser.omnibox.onInputStarted.addListener(cb);
browser.omnibox.onInputChanged.addListener(cb);
