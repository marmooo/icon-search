self.addEventListener("message", (e) => {
  const pos = e.data;
  postMessage(pos);
});
