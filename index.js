import { evaluate } from 'mathjs';

browser.omnibox.setDefaultSuggestion({
  description: `Do most mathematical computations.`,
});

const cb = (text, suggest) => {
  const data = evaluate(text);
  console.log(text, data);
  suggest([{ description: data, content: data }]);
}

browser.omnibox.onInputStarted.addListener(cb);

browser.omnibox.onInputChanged.addListener(cb);
