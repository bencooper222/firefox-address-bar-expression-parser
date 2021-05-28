import { evaluate } from 'mathjs';

browser.omnibox.setDefaultSuggestion({
  description: `Do most mathematical computations.`,
});

browser.omnibox.onInputChanged.addListener((text, suggest) => {
  const data = evaluate(text);
  suggest([{ description: data, content: data }]);
});
