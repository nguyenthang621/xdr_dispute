const express = require('express');
const os = require('os');

const app = express();
const port = process.env.PORT || 3001;

app.get('/api/pod', (req, res) => {
  const podHostname = os.hostname();
  res.json({ podHostname });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
