self.addEventListener("message", (e) => {
  const [svgText, pos] = e.data;
  postMessage([svgText, pos]);
});
