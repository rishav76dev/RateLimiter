import express from "express"

const app = express();

// app.use(rateLimiterMiddleware);

app.get('/api/login', (req, res) => res.send("Login Success"));

app.listen(3000, () => console.log("Server running  on port 3000"))