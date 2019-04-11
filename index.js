// import * as expr from './exprParse';
import { eval as exprEval } from 'mathjs';

browser.omnibox.setDefaultSuggestion({
  description: `Do most mathematical computations.`,
});

const doMath = expression => exprEval(expression);

browser.omnibox.onInputChanged.addListener((text, suggest) => {
  const data = doMath(text);
  suggest([{ description: data, content: data }]);
});
